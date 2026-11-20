import { createHash } from 'node:crypto';

export const profiles = {
  urbano: { pm25: [30, 70], pm10: [20, 50], co2: [650, 1350], co: [2, 9] },
  industrial: { pm25: [70, 140], pm10: [35, 110], co2: [1100, 2400], co: [4, 16] },
  residencial: { pm25: [6, 30], pm10: [7, 23], co2: [500, 1500], co: [0.2, 4] }
};

export function scenarioMeasurement(scenario, seed) {
  const hash = createHash('sha256').update(scenario + ':' + seed).digest();
  const values = Object.fromEntries(Object.entries(profiles[scenario]).map(([key, [low, high]], i) => [
    key, Math.round((low + hash.readUInt16BE(i * 2) / 65535 * (high - low)) * 100) / 100
  ]));
  values.pm10 = Math.round((values.pm25 + values.pm10) * 100) / 100;
  return values;
}

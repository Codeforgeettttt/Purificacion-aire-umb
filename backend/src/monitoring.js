import { readFileSync } from 'node:fs';

export const pollutants = {
  pm25: { label: 'PM2.5', unit: 'µg/m³', limits: [15, 35] },
  pm10: { label: 'PM10', unit: 'µg/m³', limits: [45, 100] },
  co2: { label: 'CO₂', unit: 'ppm', limits: [1000, 1500] },
  co: { label: 'CO', unit: 'ppm', limits: [4, 9] }
};
export const keys = Object.keys(pollutants);
export class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export function readConcentrations(input) {
  const values = Object.fromEntries(keys.map(key => {
    const value = input?.[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100000) {
      throw new InputError('Concentración inválida para ' + pollutants[key].label);
    }
    return [key, value];
  }));
  if (values.pm25 > values.pm10) throw new InputError('PM2.5 debe ser menor o igual a PM10.');
  return values;
}
export function severity(value, key) {
  const [moderate, high] = pollutants[key].limits;
  return value >= high ? 2 : value >= moderate ? 1 : 0;
}
export function classify(values) {
  return ['Bajo', 'Moderado', 'Alto'][Math.max(...keys.map(key => severity(values[key], key)))];
}
export function getMeasurement(db, id) {
  const row = db.prepare('SELECT * FROM measurements WHERE id = ?').get(id);
  if (!row) throw new InputError('Medición no encontrada.', 404);
  return { ...row, level: classify(row) };
}
export function registerMeasurement(db, source, values) {
  const { pm25, pm10, co2, co } = readConcentrations(values);
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO measurements (source, pm25, pm10, co2, co) VALUES (?,?,?,?,?)'
  ).run(source, pm25, pm10, co2, co);
  return getMeasurement(db, lastInsertRowid);
}
export function installMonitoring(app, db) {
  db.exec(readFileSync(new URL('./database/001-monitoring.sql', import.meta.url), 'utf8'));
  app.get('/api/pollutants', (_req, res) => res.json(pollutants));
  app.get('/api/measurements', (_req, res) => {
    const rows = db.prepare('SELECT * FROM measurements ORDER BY id DESC').all();
    res.json(rows.map(row => ({ ...row, level: classify(row) })));
  });
  app.get('/api/measurements/:id', (req, res) => res.json(getMeasurement(db, req.params.id)));
  app.post('/api/measurements', (req, res) => {
    res.status(201).json(registerMeasurement(db, 'manual', req.body));
  });
  app.post('/api/measurements/simulate', (_req, res) => {
    const pm25 = Math.round(8 + Math.random() * 80);
    res.status(201).json(registerMeasurement(db, 'simulated', {
      pm25, pm10: pm25 + 30, co2: Math.round(600 + Math.random() * 1400),
      co: Math.round(Math.random() * 100) / 10
    }));
  });
}

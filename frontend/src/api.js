export async function api(path, body) {
  const response = await fetch('/api/' + path, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la operación.');
  return data;
}
export const fields = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³' },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³' },
  { key: 'co2', label: 'CO₂', unit: 'ppm' },
  { key: 'co', label: 'CO', unit: 'ppm' }
];
export const number = value => value == null ? '—' : new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2
}).format(value);
export const dateTime = value => new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Bogota'
}).format(new Date(value));

import { readFileSync } from 'node:fs';
import { evaluate } from './validation.js';
import { getMeasurement, InputError, keys, readConcentrations, severity } from './monitoring.js';

export const millisecondsPerMinute = 500;
export const outdoorDefault = { pm25: 8, pm10: 18, co2: 420, co: 0.5 };

export function model(initial, outside, technology, minute) {
  return Object.fromEntries(keys.map(key => {
    const airChange = technology.ventilation ? 0.08 : 0;
    const capture = technology.hepa && key.startsWith('pm') ? 0.12 : 0;
    const rate = airChange + capture;
    const equilibrium = airChange ? airChange * outside[key] / rate : 0;
    return [key, rate && minute > 0 ? equilibrium + (initial[key] - equilibrium) * Math.exp(-rate * minute) : initial[key]];
  }));
}

function saveProgress(db, row, now, stop = false) {
  if (row.status !== 'running') return;
  const minute = Math.min(row.duration, Math.max(0, Math.floor((now - row.started_at) / millisecondsPerMinute)));
  const initial = getMeasurement(db, row.measurement_id);
  const technology = db.prepare('SELECT * FROM technologies WHERE id=?').get(row.technology);
  const outside = JSON.parse(row.exterior);
  const last = db.prepare('SELECT MAX(minute) AS latest FROM samples WHERE session_id=?').get(row.id).latest ?? -1;
  const insert = db.prepare('INSERT INTO samples VALUES (?,?,?,?,?,?)');
  for (let next = last + 1; next <= minute; next++) {
    const point = model(initial, outside, technology, next);
    insert.run(row.id, next, ...keys.map(key => point[key]));
  }
  if (minute === row.duration || stop) {
    db.prepare('UPDATE sessions SET status=? WHERE id=?').run(minute === row.duration ? 'completed' : 'stopped', row.id);
  }
}

function serialize(db, row) {
  const samples = db.prepare('SELECT minute, pm25, pm10, co2, co FROM samples WHERE session_id=? ORDER BY minute').all(row.id);
  const initial = getMeasurement(db, row.measurement_id);
  const current = samples.at(-1);
  const final = row.status === 'running' ? null : current;
  return { ...row, exterior: JSON.parse(row.exterior), initial, current, final, samples,
    result: final ? evaluate(initial, final) : null,
    coWarning: severity(initial.co, 'co') === 2 || severity(current.co, 'co') === 2 };
}

export function readSessions(db, now, id, stop = false) {
  const rows = id === undefined ? db.prepare('SELECT * FROM sessions ORDER BY id DESC').all() :
    [db.prepare('SELECT * FROM sessions WHERE id=?').get(id)];
  if (!rows[0] && id !== undefined) throw new InputError('Sesión no encontrada.', 404);
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = rows.map(row => {
      const current = db.prepare('SELECT * FROM sessions WHERE id=?').get(row.id);
      if (current.status !== 'running') return serialize(db, current);
      saveProgress(db, current, now, stop);
      return serialize(db, db.prepare('SELECT * FROM sessions WHERE id=?').get(row.id));
    });
    db.exec('COMMIT');
    return id === undefined ? result : result[0];
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
export function startSession(db, input, now) {
  const { measurementId, technology, duration } = input ?? {};
  if (!Number.isSafeInteger(measurementId) || measurementId < 1 ||
      !Number.isInteger(duration) || duration < 1 || duration > 120 ||
      typeof technology !== 'string' || !db.prepare('SELECT id FROM technologies WHERE id=?').get(technology)) {
    throw new InputError('Selecciona una medición, una tecnología y entre 1 y 120 minutos.');
  }
  getMeasurement(db, measurementId);
  const exterior = readConcentrations(input.exterior ?? outdoorDefault);
  const result = db.prepare('INSERT INTO sessions (measurement_id,technology,duration,started_at,exterior) VALUES (?,?,?,?,?)')
    .run(measurementId, technology, duration, now, JSON.stringify(exterior));
  return readSessions(db, now, result.lastInsertRowid);
}
export function installTreatment(app, db, clock = Date.now) {
  db.exec(readFileSync(new URL('./database/002-treatment.sql', import.meta.url), 'utf8'));
  app.get('/api/technologies', (_req, res) => res.json({
    items: db.prepare('SELECT id,label FROM technologies').all(), outdoorDefault
  }));
  app.get('/api/sessions', (_req, res) => res.json(readSessions(db, clock())));
  app.get('/api/sessions/:id', (req, res) => res.json(readSessions(db, clock(), req.params.id)));
  app.post('/api/sessions', (req, res) => res.status(201).json(startSession(db, req.body, clock())));
  app.post('/api/sessions/:id/stop', (req, res) => res.json(readSessions(db, clock(), req.params.id, true)));
}



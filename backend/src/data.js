import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import express from 'express';
import { InputError, readConcentrations, registerMeasurement } from './monitoring.js';
import { readSessions, startSession } from './treatment.js';

const tables = ['technologies', 'measurements', 'sessions', 'samples', 'alerts', 'preferences'];
const prefs = { theme: 'light', defaultDuration: 15 };
const backupLimit = 64 * 1024 * 1024;
function temporary() {
  const dir = mkdtempSync(join(tmpdir(), 'air-quality-backup-'));
  return { path: join(dir, 'backup.sqlite'), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function restore(db, bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 100 || bytes.subarray(0, 16).toString() !== 'SQLite format 3\0') {
    throw new InputError('Selecciona un respaldo SQLite válido.');
  }
  const item = temporary();
  let input;
  try {
    writeFileSync(item.path, bytes);
    input = new DatabaseSync(item.path, { readOnly: true });
    input.exec('PRAGMA trusted_schema=OFF; PRAGMA query_only=ON');
    if (input.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw new Error('Integridad inválida.');
    const definitions = db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    const incoming = new Map(input.prepare("SELECT name,sql FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(row => [row.name, row.sql]));
    if (incoming.size !== definitions.length || !definitions.every(row => incoming.get(row.name) === row.sql)) {
      throw new Error('El formato pertenece a otra versión.');
    }
    db.exec('BEGIN IMMEDIATE');
    try {
      for (const table of [...tables].reverse()) db.exec('DELETE FROM ' + table);
      for (const table of tables) {
        const columns = db.prepare('PRAGMA table_info(' + table + ')').all().map(row => row.name);
        const names = columns.join(',');
        const insert = db.prepare('INSERT INTO ' + table + ' (' + names + ') VALUES (' + columns.map(() => '?').join(',') + ')');
        for (const row of input.prepare('SELECT ' + names + ' FROM ' + table).iterate()) {
          if (table === 'measurements' || table === 'samples') readConcentrations(row);
          if (table === 'measurements' && !Number.isFinite(Date.parse(row.recorded_at))) throw new Error('Fecha inválida.');
          if (table === 'sessions') {
            readConcentrations(JSON.parse(row.exterior));
            if (!Number.isSafeInteger(row.started_at) || !Number.isInteger(row.duration)) throw new Error('Sesión inválida.');
          }
          insert.run(...columns.map(name => row[name]));
        }
      }
      const invalidSession = db.prepare(`SELECT sessions.id FROM sessions
        LEFT JOIN samples ON samples.session_id=sessions.id GROUP BY sessions.id
        HAVING MIN(samples.minute) IS NULL OR MIN(samples.minute)<>0 OR COUNT(*)<>MAX(samples.minute)+1
          OR MAX(samples.minute)>sessions.duration LIMIT 1`).get();
      if (invalidSession) throw new Error('Secuencia de muestras inválida.');
      if (db.prepare('PRAGMA foreign_key_check').get()) throw new Error('Relaciones inválidas.');
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  } catch {
    throw new InputError('El respaldo es incompatible o está dañado. Los datos actuales se conservaron.');
  } finally {
    input?.close();
    item.cleanup();
  }
}

function settings(db) {
  const row = db.prepare('SELECT theme, defaultDuration FROM preferences WHERE id=1').get();
  return row ?? prefs;
}

export function installData(app, db, clock) {
  db.exec(readFileSync(new URL('./database/006-preferences.sql', import.meta.url), 'utf8'));
  app.get('/api/settings', (_req, res) => res.json(settings(db)));
  app.post('/api/settings', (req, res) => {
    const { theme, defaultDuration } = { ...settings(db), ...req.body };
    if (!['light', 'dark'].includes(theme) || !Number.isInteger(defaultDuration) || defaultDuration < 1 || defaultDuration > 120) {
      throw new InputError('Preferencias inválidas.');
    }
    db.prepare('INSERT INTO preferences VALUES (1,?,?) ON CONFLICT(id) DO UPDATE SET theme=excluded.theme,defaultDuration=excluded.defaultDuration')
      .run(theme, defaultDuration);
    res.json(settings(db));
  });
  app.get('/api/data/backup', (_req, res) => {
    const item = temporary();
    try {
      db.prepare('VACUUM INTO ?').run(item.path);
      const bytes = readFileSync(item.path);
      if (bytes.length > backupLimit) throw new InputError('El respaldo excede el límite de 64 MB.', 413);
      res.attachment('air-quality-respaldo.sqlite').send(bytes);
    } finally {
      item.cleanup();
    }
  });
  app.post('/api/data/restore', express.raw({ type: 'application/octet-stream', limit: backupLimit }), (req, res) => {
    restore(db, req.body);
    res.json({ ok: true });
  });
  app.post('/api/data/demo', (_req, res) => {
    db.exec(`BEGIN IMMEDIATE;
      DELETE FROM alerts WHERE measurement_id IN (SELECT id FROM measurements WHERE scenario='demo');
      DELETE FROM samples WHERE session_id IN (SELECT id FROM sessions WHERE measurement_id IN (SELECT id FROM measurements WHERE scenario='demo'));
      DELETE FROM sessions WHERE measurement_id IN (SELECT id FROM measurements WHERE scenario='demo');
      DELETE FROM measurements WHERE scenario='demo';
      COMMIT;`);
    const entry = registerMeasurement(db, 'simulated', { pm25: 60, pm10: 100, co2: 1400, co: 10 }, { scenario: 'demo' });
    const now = clock();
    for (const technology of ['hepa', 'ventilation', 'combined', 'carbon']) {
      const session = startSession(db, { measurementId: entry.id, technology, duration: 15 }, now - 8000);
      readSessions(db, now, session.id);
    }
    res.json({ ok: true });
  });
}

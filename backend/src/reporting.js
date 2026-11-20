import { readFileSync } from 'node:fs';
import { writeReport } from './pdf-report.js';
import { InputError, keys, pollutants, severity } from './monitoring.js';
import { readSessions } from './treatment.js';

const guidance = {
  pm25: 'Compara una simulación con HEPA.',
  pm10: 'Compara una simulación con HEPA.',
  co2: 'Evalúa la renovación de aire con el escenario exterior.',
  co: 'Revisa el origen del CO y el protocolo de seguridad ante una lectura real.'
};

function syncAlerts(db, sessions) {
  const insert = db.prepare('INSERT OR IGNORE INTO alerts (alert_key,measurement_id,session_id,pollutant,severity,message,origin) VALUES (?,?,?,?,?,?,?)');
  for (const row of db.prepare('SELECT * FROM measurements').all()) {
    for (const key of keys) {
      const level = severity(row[key], key);
      if (level) insert.run('entry:' + row.id + ':' + key, row.id, null, key, level === 2 ? 'Alta' : 'Moderada',
        pollutants[key].label + ' en nivel ' + (level === 2 ? 'alto. ' : 'moderado. ') + guidance[key],
        row.source === 'manual' ? 'Entrada manual sin verificar' : 'Entrada simulada');
    }
  }
  for (const session of sessions.filter(s => s.result)) {
    for (const key of keys) {
      const level = severity(session.final[key], key);
      if (level) insert.run('exit:' + session.id + ':' + key, session.measurement_id, session.id, key,
        level === 2 ? 'Alta' : 'Moderada', pollutants[key].label + ' sigue por encima del umbral operativo bajo. ' + guidance[key],
        'Salida simulada');
    }
  }
}

const colombianDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Bogota' });
function selectReport(db, now, query) {
  const { from, to, session } = query;
  if ([from, to].some(value => value !== undefined && (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))) ||
    (from && to && from > to) || (session !== undefined && !/^\d+$/.test(session))) {
    throw new InputError('Periodo o sesión inválidos.');
  }
  return readSessions(db, now).filter(row => {
    const date = colombianDate.format(row.started_at);
    return row.result && (!from || date >= from) && (!to || date <= to) && (!session || String(row.id) === session);
  });
}

function csv(sessions) {
  const headers = ['sesion', 'inicio_utc', 'tecnologia', 'origen_entrada', 'origen_salida', 'duracion_min',
    'nivel_final', 'resultado', ...keys.flatMap(key => {
      const unit = key.startsWith('pm') ? 'ug_m3' : 'ppm';
      return [key + '_entrada_' + unit, key + '_salida_' + unit, key + '_reduccion_pct'];
    })];
  const lines = sessions.filter(s => s.result).map(s => [
    s.id, new Date(s.started_at).toISOString(), s.technology, s.initial.source === 'manual' ? 'manual' : 'simulada',
    'simulada', s.final.minute, s.result.finalLevel, s.result.outcome,
    ...keys.flatMap(key => [s.initial[key], s.final[key], s.result.reductions[key]])
  ]);
  return '\uFEFF' + [headers, ...lines].map(row => row.map(value => '"' +
    String(value ?? '').replaceAll('"', '""') + '"').join(',')).join('\r\n') + '\r\n';
}

export function installReporting(app, db, clock = Date.now) {
  db.exec(readFileSync(new URL('./database/003-alerts.sql', import.meta.url), 'utf8'));
  app.get('/api/alerts', (_req, res) => {
    syncAlerts(db, readSessions(db, clock()));
    res.json(db.prepare('SELECT * FROM alerts ORDER BY id DESC').all());
  });
  app.get('/api/reports/treatments.csv', (req, res) => {
    res.attachment('tratamientos.csv').send(csv(selectReport(db, clock(), req.query)));
  });
  app.get('/api/reports/treatments.pdf', (req, res) => {
    const sessions = selectReport(db, clock(), req.query);
    res.attachment('tratamientos.pdf');
    writeReport(res, sessions);
  });
}

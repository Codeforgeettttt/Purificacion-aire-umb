import express from 'express';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { installMonitoring, InputError } from './monitoring.js';
import { installTreatment } from './treatment.js';
import { installReporting } from './reporting.js';
import { installData } from './data.js';

export async function createApp({ dbPath = process.env.DB_PATH || 'data/air.sqlite', development = false, clock = Date.now, accessToken, staticDir = resolve('dist') } = {}) {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');
  const app = express();
  app.locals.db = db;
  app.disable('x-powered-by');
  app.param('id', (_req, _res, next, value) => {
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
      return next(new InputError('Identificador inválido.'));
    }
    next();
  });
  if (accessToken) {
    app.use((req, res, next) => {
      if (req.get('X-Air-Desktop') !== accessToken) return res.status(403).json({ error: 'Acceso local no autorizado.' });
      res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'");
      next();
    });
  }
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: db.prepare('SELECT 1 AS ok').get().ok === 1 }));
  installMonitoring(app, db);
  installTreatment(app, db, clock);
  installReporting(app, db, clock);
  installData(app, db, clock);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
  app.use((err, _req, res, _next) => {
    const status = err instanceof InputError ? err.status : [400, 413].includes(err.status) ? err.status : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: err instanceof InputError ? err.message :
      status === 500 ? 'Error interno del servidor.' : 'Solicitud inválida.' });
  });
  if (development) {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(staticDir));
  }
  return app;
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  const development = process.argv.includes('--dev');
  const app = await createApp({ development });
  const port = Number(process.env.PORT || 3000);
  app.listen(port, '127.0.0.1', () => console.log('http://127.0.0.1:' + port));
}

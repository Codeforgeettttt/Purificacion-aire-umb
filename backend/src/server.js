import express from 'express';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export async function createApp({ dbPath = process.env.DB_PATH || 'data/air.sqlite', development = false } = {}) {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');
  const app = express();
  app.locals.db = db;
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_req, res) => res.json({ ok: db.prepare('SELECT 1 AS ok').get().ok === 1 }));
  if (development) {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(resolve('dist')));
  }
  return app;
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  const development = process.argv.includes('--dev');
  const app = await createApp({ development });
  const port = Number(process.env.PORT || 3000);
  app.listen(port, '127.0.0.1', () => console.log('http://127.0.0.1:' + port));
}

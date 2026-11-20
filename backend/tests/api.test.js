import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/server.js';

test('API completa, historial en disco y alertas sin duplicados', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'air-quality-test-'));
  const dbPath = join(folder, 'test.sqlite');
  let now = 1764000000000;
  let app, server;
  async function open() {
    app = await createApp({ dbPath, clock: () => now });
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
  }
  async function close() {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    app.locals.db.close();
    server = null;
  }
  const request = (path, body) => fetch('http://127.0.0.1:' + server.address().port + '/api/' + path,
    body === undefined ? undefined : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    await open();
    assert.deepEqual(await (await request('health')).json(), { ok: true });
    assert.equal((await request('measurements', { pm25: 80, pm10: 4, co2: 0, co: 0 })).status, 400);
    assert.equal((await request('measurements/999')).status, 404);
    assert.equal((await request('measurements/0')).status, 400);
    assert.equal((await request('measurements/NaN')).status, 400);
    assert.equal((await request('absent')).status, 404);
    const entryResponse = await request('measurements', { pm25: 60, pm10: 100, co2: 1400, co: 10 });
    assert.equal(entryResponse.status, 201);
    const entry = await entryResponse.json();
    assert.equal(entry.level, 'Alto');
    assert.equal(entry.source, 'manual');
    assert.equal((await request('measurements/' + entry.id)).status, 200);
    assert.equal((await (await request('measurements/simulate', {})).json()).source, 'simulated');
    assert.equal((await request('sessions', { measurementId: entry.id, duration: 0, technology: 'hepa' })).status, 400);
    const started = await request('sessions', { measurementId: entry.id, duration: 15, technology: 'hepa' });
    assert.equal(started.status, 201);
    const session = await started.json();
    assert.equal(session.status, 'running');
    assert.equal(session.current.minute, 0);
    now += 5000;
    const intermediate = await (await request('sessions/' + session.id)).json();
    assert.equal(intermediate.samples.length, 11);
    await close();
    now += 3000;
    await open();
    const finished = await (await request('sessions/' + session.id)).json();
    assert.equal(finished.status, 'completed');
    assert.equal(finished.samples.length, 16);
    assert.equal(finished.final.co, 10);
    assert.equal(finished.result.finalLevel, 'Alto');
    assert.ok(finished.result.reductions.pm25 > 80);
    const other = await (await request('sessions', { measurementId: entry.id, duration: 15, technology: 'carbon' })).json();
    now += 1000;
    const paused = await (await request('sessions/' + other.id + '/pause', {})).json();
    assert.equal(paused.status, 'paused');
    now += 10000;
    const stillPaused = await (await request('sessions/' + other.id)).json();
    assert.equal(stillPaused.current.minute, 2);
    const resumed = await (await request('sessions/' + other.id + '/resume', {})).json();
    assert.equal(resumed.status, 'running');
    const stopped = await (await request('sessions/' + other.id + '/stop', {})).json();
    assert.equal(stopped.status, 'stopped');
    assert.equal(stopped.final.minute, 2);
    assert.equal(stopped.final.pm25, entry.pm25);
    const firstAlerts = await (await request('alerts')).json();
    const secondAlerts = await (await request('alerts')).json();
    assert.ok(firstAlerts.some(a => a.pollutant === 'co' && a.severity === 'Alta' && a.session_id === session.id));
    assert.deepEqual(firstAlerts, secondAlerts);
    const csv = await request('reports/treatments.csv');
    assert.match(csv.headers.get('content-disposition'), /tratamientos\.csv/);
    assert.match(await csv.text(), /pm25_reduccion_pct/);
  } finally {
    if (server) await close();
    rmSync(folder, { recursive: true });
  }
});

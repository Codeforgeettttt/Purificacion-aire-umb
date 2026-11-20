import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { createApp } from '../src/server.js';

test('SQLite exporta y restaura datos y preferencias transaccionalmente', async () => {
  const app = await createApp({ dbPath: ':memory:' });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const request = (path, options) => fetch('http://127.0.0.1:' + server.address().port + '/api/' + path, options);
  function post(path, value) {
    return request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
  }
  const bytes = value => ({ method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: value });
  try {
    assert.equal((await post('measurements/simulate', { scenario: 'residencial', seed: 'respaldo' })).status, 201);
    assert.equal((await post('settings', { theme: 'dark', defaultDuration: 20 })).status, 200);
    const response = await request('data/backup');
    assert.equal(response.status, 200);
    const backup = await response.arrayBuffer();
    await post('measurements/simulate', {});
    assert.equal((await request('data/restore', bytes('incompatible'))).status, 400);
    assert.equal((await (await request('measurements')).json()).length, 2);
    assert.equal((await request('data/restore', bytes(backup))).status, 200);
    const restored = await (await request('measurements')).json();
    assert.equal(restored.length, 1);
    assert.equal(restored[0].seed, 'respaldo');
    assert.deepEqual(await (await request('settings')).json(), { theme: 'dark', defaultDuration: 20 });
    assert.equal((await post('data/demo', {})).status, 200);
    assert.equal((await post('data/demo', {})).status, 200);
    const sessions = await (await request('sessions')).json();
    assert.equal(sessions.length, 4);
    assert.ok(sessions.every(session => session.result && session.initial.scenario === 'demo'));
  } finally {
    await new Promise(resolve => server.close(resolve));
    app.locals.db.close();
  }
});

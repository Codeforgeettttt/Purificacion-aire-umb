import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const executable = process.argv[2] ?? 'node_modules/electron/dist/electron.exe';
const profile = mkdtempSync(join(tmpdir(), 'air-desktop-test-'));
try {
  for (let i = 0; i < 2; i++) {
    const result = spawnSync(executable, process.argv[2] ? ['--disable-gpu'] : ['.', '--disable-gpu'], {
      timeout: 45000, windowsHide: true, env: { ...process.env, AIR_QUALITY_SMOKE_DIR: profile }
    });
    if (result.error) throw result.error;
    const report = JSON.parse(readFileSync(join(profile, 'desktop-smoke.json'), 'utf8'));
    assert.equal(result.status, 0, report.error ?? result.stderr.toString());
    assert.equal(report.previous, i);
    console.log('Electron ' + report.electron + ': inicio, aislamiento y persistencia verificados (' + (i + 1) + ')');
  }
} finally {
  rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
}

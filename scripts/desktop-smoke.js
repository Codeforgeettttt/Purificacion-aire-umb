import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const executable = process.argv[2] ?? 'node_modules/electron/dist/electron.exe';
const profile = mkdtempSync(join(tmpdir(), 'air-desktop-test-'));
try {
  for (let i = 0; i < 2; i++) {
    const result = spawnSync(executable, process.argv[2] ? ['--disable-gpu'] : ['.', '--disable-gpu'], {
      timeout: 45000, windowsHide: true, env: { ...process.env, AIR_QUALITY_SMOKE_DIR: profile }
    });
    if (result.error) {
      const trace = join(profile, 'desktop-smoke.json');
      throw new Error(result.error.message + '\n' + result.stderr.toString() + '\n' + (existsSync(trace) ? readFileSync(trace, 'utf8') : 'Sin informe'));
    }
    const report = JSON.parse(readFileSync(join(profile, 'desktop-smoke.json'), 'utf8'));
    assert.equal(result.status, 0, report.error ?? result.stderr.toString());
    assert.equal(report.previous, i);
    assert.equal(report.flow.offline, true);
    console.log('Electron ' + report.electron + ': inicio, aislamiento, persistencia, gráficos, PDF, CSV y respaldo (' + (i + 1) + '). RAM: ' + Math.round(report.totalWorkingSetKiB / 1024) + ' MiB.');
  }
} finally {
  rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
}

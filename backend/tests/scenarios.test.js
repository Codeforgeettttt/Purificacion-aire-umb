import assert from 'node:assert/strict';
import test from 'node:test';
import { scenarioMeasurement } from '../src/scenarios.js';

test('los escenarios reproducen concentraciones por semilla y respetan PM10 ≥ PM2.5', () => {
  const first = scenarioMeasurement('industrial', 'taller');
  assert.deepEqual(first, scenarioMeasurement('industrial', 'taller'));
  assert.notDeepEqual(first, scenarioMeasurement('industrial', 'distinta'));
  assert.ok(first.pm10 >= first.pm25);
});

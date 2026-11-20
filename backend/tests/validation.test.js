import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluate, reduction } from '../src/validation.js';
import { model } from '../src/treatment.js';

test('reducción positiva, negativa y base cero', () => {
  assert.equal(reduction(40, 10), 75);
  assert.equal(reduction(40, 60), -50);
  assert.equal(reduction(0, 1), null);
});

test('HEPA reduce partículas sin cambiar CO₂ ni CO', () => {
  const initial = { pm25: 60, pm10: 100, co2: 1400, co: 10 };
  const final = model(initial, {}, { hepa: 1 }, 15);
  assert.ok(final.pm25 < initial.pm25);
  assert.equal(final.co2, initial.co2);
  assert.equal(final.co, initial.co);
  assert.equal(evaluate(initial, final).outcome, 'Mejora parcial');
});

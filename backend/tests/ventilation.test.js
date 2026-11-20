import test from 'node:test';
import assert from 'node:assert/strict';
import { model } from '../src/treatment.js';
import { evaluate } from '../src/validation.js';

const inside = { pm25: 12, pm10: 18, co2: 1400, co: 0 };
const outside = { pm25: 95, pm10: 120, co2: 420, co: 3 };

test('ventilación aproxima cada concentración al exterior y puede empeorar un contaminante', () => {
  const treated = model(inside, outside, { ventilation: 1 }, 30);
  assert.ok(treated.pm25 > inside.pm25 && treated.pm25 < outside.pm25);
  assert.ok(treated.co2 < inside.co2 && treated.co2 > outside.co2);
  assert.deepEqual(model(inside, outside, { ventilation: 1 }, 0), inside);
  assert.equal(evaluate(inside, treated).outcome, 'Con incrementos');
  assert.equal(evaluate(inside, treated).reductions.co, null);
});

test('carbón convencional conserva los cuatro valores del alcance', () => {
  assert.deepEqual(model(inside, outside, { carbon: 1 }, 30), inside);
});

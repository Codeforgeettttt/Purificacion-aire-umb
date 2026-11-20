import { classify, keys, severity } from './monitoring.js';

export function reduction(initial, final) {
  return initial === 0 ? null : (initial - final) / initial * 100;
}

export function evaluate(initial, final) {
  const finalLevel = classify(final);
  const reductions = Object.fromEntries(keys.map(key => [key, reduction(initial[key], final[key])]));
  const increased = keys.some(key => final[key] - initial[key] > 0.000001);
  const improved = keys.some(key => initial[key] - final[key] > 0.000001);
  let outcome = 'Sin cambio';
  if (increased) outcome = 'Con incrementos';
  else if (improved) outcome = finalLevel === 'Bajo' ? 'Mejora simulada' : 'Mejora parcial';
  const pollutantLevels = Object.fromEntries(keys.map(key => [key, ['Bajo', 'Moderado', 'Alto'][severity(final[key], key)]]));
  return { finalLevel, reductions, outcome, pollutantLevels };
}

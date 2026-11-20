import React, { useState } from 'react';
import { api, dateTime, fields, number } from './api.js';
import { CartesianGrid, LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const sessionStatus = { running: 'En proceso', paused: 'Pausado', completed: 'Completado', stopped: 'Detenido' };
export function Evolution({ session, field, timeline = 'Minuto', unit = ' min' }) {
  return <div className="chart" role="img" aria-label={'Evolución de ' + field.label + ' en ' + field.unit}>
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={session.samples} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="4 4" /><XAxis dataKey="minute" unit={unit} /><YAxis unit={' ' + field.unit} width={85} />
        <Tooltip formatter={value => [number(value) + ' ' + field.unit, field.label]} labelFormatter={minute => timeline + ' ' + minute} />
        <Line dataKey={field.key} stroke="#087d67" strokeWidth={3} dot={session.samples.length < 2} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
export default function Treatment({ rows, sessions, technologies, action, busy, defaultDuration }) {
  const [technology, setTechnology] = useState('hepa');
  const [selected, select] = useState(null);
  const [key, setKey] = useState('pm25');
  const session = sessions.find(row => row.id === selected) ?? sessions[0];
  return <section id="tratamientos"><h2>Simulador de purificación</h2>
    <p>Cada minuto simulado dura medio segundo. Los resultados son estimaciones del modelo.</p>
    {rows.length === 0 ? <p>Registra primero una medición de entrada.</p> :
      <form onSubmit={event => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const exterior = data.has('pm25') ? Object.fromEntries(fields.map(f => [f.key, Number(data.get(f.key))])) : undefined;
        action(() => api('sessions', {
          measurementId: Number(data.get('measurement')), technology, duration: Number(data.get('duration')), exterior
        })).then(result => { if (result) select(result.id); });
      }}>
        <div className="grid">
          <label>Medición de entrada<select name="measurement">{rows.map(row => <option key={row.id} value={row.id}>
            #{row.id} · {dateTime(row.recorded_at)} · {row.level}</option>)}</select></label>
          <label>Tecnología<select value={technology} onChange={e => setTechnology(e.target.value)}>{technologies.items.map(t =>
            <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
          <label>Duración (min)<input name="duration" type="number" min="1" max="120" key={defaultDuration} defaultValue={defaultDuration} required /></label>
        </div>
        <p className="muted">{{ hepa: 'HEPA captura partículas. CO y CO₂ mantienen su concentración.',
          carbon: 'El carbón actúa sobre gases compatibles. Los cuatro contaminantes del taller conservan su concentración.',
          ventilation: 'La renovación acerca las concentraciones al escenario exterior y puede elevarlas.',
          combined: 'Combina captura de partículas con renovación de aire.' }[technology]}</p>
        {['ventilation','combined'].includes(technology) && <fieldset><legend>Aire exterior simulado</legend><div className="grid">
          {fields.map(f => <label key={f.key}>{f.label} ({f.unit})<input name={f.key} type="number" step="any" min="0" max="100000" defaultValue={technologies.outdoorDefault[f.key]} required /></label>)}
        </div></fieldset>}
        <button disabled={busy || !technologies.items.length}>Iniciar simulación</button>
      </form>}
    {session && <>
      <div className="grid">
        <label>Sesión<select value={session.id} onChange={e => select(Number(e.target.value))}>{sessions.map(s =>
          <option value={s.id} key={s.id}>#{s.id} · {sessionStatus[s.status]}</option>)}</select></label>
        <label>Contaminante<select value={key} onChange={e => setKey(e.target.value)}>{fields.map(f =>
          <option key={f.key} value={f.key}>{f.label}</option>)}</select></label>
      </div>
      <p><strong>{sessionStatus[session.status]}</strong> · Minuto {session.current.minute} de {session.duration}</p>
      {session.coWarning && <p className="alert">CO elevado en la simulación. HEPA y carbón convencional no controlan este gas.</p>}
      <progress aria-label="Progreso del tratamiento" value={session.current.minute} max={session.duration} />
      {['running', 'paused'].includes(session.status) && <div className="actions">
        <button type="button" className="secondary" disabled={busy} onClick={() => action(() =>
          api('sessions/' + session.id + (session.status === 'running' ? '/pause' : '/resume'), {}))}>
          {session.status === 'running' ? 'Pausar' : 'Reanudar'}
        </button>
        <button type="button" className="secondary" disabled={busy} onClick={() => action(() => api('sessions/' + session.id + '/stop', {}))}>Detener simulación</button>
      </div>}
      <Evolution session={session} field={fields.find(f => f.key === key)} />
    </>}
  </section>;
}

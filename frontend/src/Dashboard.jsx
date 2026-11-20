import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dateTime, fields, number } from './api.js';
import { Evolution } from './Treatment.jsx';

const levels = ['Bajo', 'Moderado', 'Alto'];
const dateParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' });
const localDate = time => {
  const parts = Object.fromEntries(dateParts.formatToParts(time).map(part => [part.type, part.value]));
  return [parts.year, parts.month, parts.day].join('-');
};

export default function Dashboard({ sessions, technologies }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [technology, setTechnology] = useState('');
  const [chosen, setChosen] = useState('');
  const [key, setKey] = useState('pm25');
  const filtered = sessions.filter(s => s.result &&
    (!from || localDate(s.started_at) >= from) && (!to || localDate(s.started_at) <= to) &&
    (!technology || s.technology === technology));
  const session = filtered.find(s => String(s.id) === chosen) ?? filtered[0];
  const field = fields.find(f => f.key === key);
  const distribution = levels.map(level => ({
    level, count: filtered.filter(s => s.result.finalLevel === level).length
  }));
  const averages = fields.map(f => {
    const values = filtered.map(s => s.result.reductions[f.key]).filter(value => value !== null);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  });
  return <section id="dashboard"><h2>Panel de indicadores</h2>
    <div className="grid filters">
      <label>Desde<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
      <label>Hasta<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
      <label>Tecnología<select value={technology} onChange={e => setTechnology(e.target.value)}>
        <option value="">Todas</option>{technologies.items.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
      </select></label>
      <label>Sesión<select value={session?.id ?? ''} onChange={e => setChosen(e.target.value)}>
        {!session && <option value="">Sin sesiones</option>}
        {filtered.map(s => <option key={s.id} value={s.id}>#{s.id} · {dateTime(s.started_at)}</option>)}
      </select></label>
      <label>Contaminante<select value={key} onChange={e => setKey(e.target.value)}>
        {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
      </select></label>
    </div>
    {from && to && from > to && <p role="alert">La fecha inicial debe ser anterior o igual a la final.</p>}
    {session ? <>
      <div className="grid kpis">
        <article><span>PM2.5 · µg/m³</span><strong>{number(session.initial.pm25)} → {number(session.final.pm25)}</strong></article>
        <article><span>CO₂ · ppm</span><strong>{number(session.initial.co2)} → {number(session.final.co2)}</strong></article>
        <article><span>Reducción · {field.label}</span><strong>{session.result.reductions[key] === null ? '—' : number(session.result.reductions[key]) + '%'}</strong></article>
        <article><span>Duración simulada</span><strong>{session.final.minute} min</strong></article>
      </div>
      <p>PM10: {number(session.final.pm10)} µg/m³ · CO: {number(session.final.co)} ppm · {filtered.length} tratamientos · {session.result.outcome}</p>
      <div className="charts">
        <article><h3>Antes y después · {field.label}</h3>
          <div className="chart" role="img" aria-label={field.label + ': ' + number(session.initial[key]) + ' antes y ' + number(session.final[key]) + ' después ' + field.unit}>
            <ResponsiveContainer width="100%" height={240}><BarChart data={[{ phase: field.label, Entrada: session.initial[key], Salida: session.final[key] }]}>
              <CartesianGrid strokeDasharray="4 4" /><XAxis dataKey="phase" /><YAxis unit={' ' + field.unit} width={85} />
              <Tooltip formatter={value => number(value) + ' ' + field.unit} /><Legend />
              <Bar dataKey="Entrada" fill="#1d4d5b" isAnimationActive={false} /><Bar dataKey="Salida" fill="#087d67" isAnimationActive={false} />
            </BarChart></ResponsiveContainer>
          </div>
        </article>
        <article><h3>Evolución · {field.label}</h3><Evolution session={session} field={field} /></article>
        <article><h3>Niveles finales</h3>
          <div className="chart" role="img" aria-label={distribution.map(d => d.level + ': ' + d.count).join(', ')}>
            <ResponsiveContainer width="100%" height={240}><BarChart data={distribution}>
              <CartesianGrid strokeDasharray="4 4" /><XAxis dataKey="level" /><YAxis allowDecimals={false} />
              <Tooltip /><Bar dataKey="count" name="Tratamientos" fill="#087d67" isAnimationActive={false} />
            </BarChart></ResponsiveContainer>
          </div>
        </article>
      </div>
      <p className="muted">Reducción promedio en sesiones filtradas · {fields.map((f, i) =>
        f.label + ' ' + (averages[i] === null ? '—' : number(averages[i]) + '%')).join(' · ')}</p>
    </> : <p>No hay tratamientos finalizados para los filtros seleccionados.</p>}
  </section>;
}

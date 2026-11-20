import React, { useState } from 'react';
import { dateTime, fields, number } from './api.js';

export default function Reports({ alerts, sessions, technologies }) {
  const [level, setLevel] = useState('');
  const [pollutant, setPollutant] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [session, setSession] = useState('');
  const query = '?' + new URLSearchParams(Object.fromEntries(Object.entries({ from, to, session }).filter(([, value]) => value)));
  const validPeriod = !from || !to || from <= to;
  const finished = sessions.filter(s => s.result);
  const groups = technologies.items.map(technology => {
    const treatments = finished.filter(s => s.technology === technology.id);
    const values = fields.map(f => {
      const data = treatments.map(s => s.result.reductions[f.key]).filter(v => v !== null);
      return data.length ? number(data.reduce((sum, v) => sum + v, 0) / data.length) + '%' : '—';
    });
    return { ...technology, count: treatments.length, values };
  });
  const visible = alerts.filter(a => (!level || a.severity === level) && (!pollutant || a.pollutant === pollutant));
  return <section id="reportes"><h2>Alertas y reportes</h2>
    <p>Alertas operativas del taller · {alerts.filter(a => a.severity === 'Alta').length} altas y {alerts.filter(a => a.severity === 'Moderada').length} moderadas.</p>
    <label>Severidad<select value={level} onChange={e => setLevel(e.target.value)}>
      <option value="">Todas</option><option>Alta</option><option>Moderada</option>
    </select></label>
    <label>Contaminante<select value={pollutant} onChange={e => setPollutant(e.target.value)}>
      <option value="">Todos</option>{fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
    </select></label>
    {visible.length ? <div className="table-wrap"><table>
      <thead><tr><th>Severidad</th><th>Origen</th><th>Detalle</th><th>Fecha de registro</th></tr></thead>
      <tbody>{visible.map(a => <tr key={a.id}><td><span className={'level ' + (a.severity === 'Alta' ? 'alto' : 'moderado')}>{a.severity}</span></td>
        <td>{a.origin} · #{a.session_id ?? a.measurement_id}</td><td>{a.message}</td><td>{dateTime(a.created_at)}</td></tr>)}</tbody>
    </table></div> : <p>No hay alertas para esta selección.</p>}
    <h3>Eficiencia promedio por tecnología</h3>
    <div className="table-wrap"><table>
      <thead><tr><th>Tecnología</th><th>Sesiones</th>{fields.map(f => <th key={f.key}>{f.label}</th>)}</tr></thead>
      <tbody>{groups.map(group => <tr key={group.id}><th scope="row">{group.label}</th><td>{group.count}</td>
        {group.values.map((v, i) => <td key={fields[i].key}>{v}</td>)}</tr>)}</tbody>
    </table></div>
    <h3>Exportar informe</h3>
    <div className="grid">
      <label>Desde<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
      <label>Hasta<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
      <label>Sesión<select value={session} onChange={e => setSession(e.target.value)}>
        <option value="">Todas</option>{finished.map(s => <option key={s.id} value={s.id}>#{s.id} · {dateTime(s.started_at)}</option>)}
      </select></label>
    </div>
    {validPeriod ? <div className="actions">
      <a href={'/api/reports/treatments.csv' + query} download>Descargar CSV</a>
      <a href={'/api/reports/treatments.pdf' + query} download>Descargar PDF</a>
    </div> : <p role="alert">Corrige el intervalo de fechas.</p>}
  </section>;
}

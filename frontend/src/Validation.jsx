import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dateTime, fields, number } from './api.js';

export default function Validation({ sessions, technologies }) {
  const [id, select] = useState(null);
  const [otherId, setOther] = useState('');
  const [metric, setMetric] = useState('pm25');
  const finished = sessions.filter(s => s.result);
  const session = finished.find(s => s.id === id) ?? finished[0];
  const other = finished.find(s => String(s.id) === otherId && s.id !== session?.id);
  const compared = [session, other].filter(Boolean);
  const field = fields.find(f => f.key === metric);
  const label = s => '#' + s.id + ' · ' + (technologies.items.find(t => t.id === s.technology)?.label ?? s.technology);
  const plot = compared.map(s => ({ label: '#' + s.id, Entrada: s.initial[metric], Salida: s.final[metric] }));
  return <section id="validacion"><h2>Validación del tratamiento</h2>
    {session ? <>
      <div className="grid">
        <label>Sesión finalizada<select value={session.id} onChange={event => select(Number(event.target.value))}>
          {finished.map(s => <option key={s.id} value={s.id}>{label(s)} · {dateTime(s.started_at)}</option>)}
        </select></label>
        <label>Comparar con<select value={other?.id ?? ''} onChange={event => setOther(event.target.value)}>
          <option value="">Sin segunda sesión</option>
          {finished.filter(s => s.id !== session.id).map(s => <option key={s.id} value={s.id}>{label(s)}</option>)}
        </select></label>
        <label>Contaminante del gráfico<select value={metric} onChange={event => setMetric(event.target.value)}>
          {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select></label>
      </div>
      <div className="chart" aria-label={'Comparación de ' + field.label} role="img">
        <ResponsiveContainer width="100%" height={225}><BarChart data={plot}>
          <CartesianGrid strokeDasharray="4 4"/><XAxis dataKey="label"/><YAxis width={85} unit={' ' + field.unit}/>
          <Tooltip formatter={value => number(value) + ' ' + field.unit}/><Legend/>
          <Bar dataKey="Entrada" fill="#1d4d5b" isAnimationActive={false}/><Bar dataKey="Salida" fill="#087d67" isAnimationActive={false}/>
        </BarChart></ResponsiveContainer>
      </div>
      {compared.map(s => <article key={s.id}><h3>{label(s)}</h3>
        <p><strong>{s.result.outcome}</strong> · Nivel final {s.result.finalLevel.toLowerCase()} · {s.final.minute} min</p>
        <div className="table-wrap"><table>
          <thead><tr><th>Contaminante</th><th>Entrada</th><th>Salida simulada</th><th>Reducción</th><th>Evaluación</th></tr></thead>
          <tbody>{fields.map(({ key, label: name, unit }) => {
            const percent = s.result.reductions[key];
            const difference = s.initial[key] - s.final[key];
            const evaluation = s.result.pollutantLevels[key] + ' · ' +
              (Math.abs(difference) < 0.000001 ? 'Sin cambio' : difference > 0 ? 'Disminuyó' : 'Aumentó');
            return <tr key={key}><th scope="row">{name} ({unit})</th>
              <td>{number(s.initial[key])}</td><td>{number(s.final[key])}</td>
              <td>{percent === null ? 'No calculable (entrada 0)' : number(percent) + '%'}</td><td>{evaluation}</td></tr>;
          })}</tbody>
        </table></div>
        {s.result.finalLevel !== 'Bajo' && <p className="alert">Valores finales que siguen elevados: {fields.filter(f => s.result.pollutantLevels[f.key] !== 'Bajo').map(f => f.label).join(', ')}.</p>}
      </article>)}
      <p className="muted">El nivel final aplica reglas didácticas a la salida simulada. Una reducción negativa indica aumento.</p>
    </> : <p>Completa o detén un tratamiento para comparar sus mediciones.</p>}
  </section>;
}

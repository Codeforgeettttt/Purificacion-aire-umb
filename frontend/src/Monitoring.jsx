import React from 'react';
import { api, dateTime, fields, number } from './api.js';

export default function Monitoring({ rows, action, busy }) {
  return <section id="mediciones">
    <h2>Mediciones de entrada</h2>
    <form onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      action(() => api('measurements', Object.fromEntries(fields.map(({key}) => [key, Number(data.get(key))]))));
    }}>
      <div className="grid">{fields.map(({key, label, unit}) =>
        <label key={key}>{label} ({unit})<input name={key} type="number" step="any" min="0" max="100000" required /></label>
      )}</div>
      <div className="actions">
        <button disabled={busy}>Guardar medición</button>
        <button type="button" className="secondary" disabled={busy} onClick={() => action(() => api('measurements/simulate', {}))}>Simular entrada</button>
      </div>
    </form>
    {rows.length === 0 ? <p>Todavía no hay mediciones.</p> : <div className="table-wrap"><table>
      <caption>Historial de entrada · hora de Colombia</caption>
      <thead><tr><th>Fecha</th><th>Origen</th>{fields.map(f => <th key={f.key}>{f.label} ({f.unit})</th>)}<th>Nivel</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.id}><td>{dateTime(row.recorded_at)}</td>
        <td>{row.source === 'manual' ? 'Manual' : 'Simulado'}</td>{fields.map(f => <td key={f.key}>{number(row[f.key])}</td>)}
        <td><span className={'level ' + row.level.toLowerCase()}>{row.level}</span></td></tr>)}</tbody>
    </table></div>}
  </section>;
}

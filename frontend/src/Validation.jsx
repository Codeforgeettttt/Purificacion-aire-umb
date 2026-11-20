import React, { useState } from 'react';
import { dateTime, fields, number } from './api.js';

export default function Validation({ sessions }) {
  const [id, select] = useState(null);
  const finished = sessions.filter(s => s.result);
  const session = finished.find(s => s.id === id) ?? finished[0];
  return <section id="validacion"><h2>Validación del tratamiento</h2>
    {session ? <>
      <label>Sesión finalizada<select value={session.id} onChange={event => select(Number(event.target.value))}>
        {finished.map(s => <option key={s.id} value={s.id}>#{s.id} · {dateTime(s.started_at)}</option>)}
      </select></label>
      <p><strong>{session.result.outcome}</strong> · Nivel final {session.result.finalLevel.toLowerCase()} · {session.final.minute} min</p>
      <div className="table-wrap"><table>
        <thead><tr><th>Contaminante</th><th>Entrada</th><th>Salida simulada</th><th>Reducción</th></tr></thead>
        <tbody>{fields.map(({ key, label, unit }) => {
          const percent = session.result.reductions[key];
          return <tr key={key}><th scope="row">{label} ({unit})</th>
            <td>{number(session.initial[key])}</td><td>{number(session.final[key])}</td>
            <td>{percent === null ? 'No calculable (entrada 0)' : number(percent) + '%'}</td></tr>;
        })}</tbody>
      </table></div>
      <p className="muted">Una reducción negativa indica un aumento. El nivel final corresponde a las reglas didácticas del simulador.</p>
    </> : <p>Completa o detén un tratamiento para comparar sus mediciones.</p>}
  </section>;
}

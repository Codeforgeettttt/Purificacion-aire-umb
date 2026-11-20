import React, { useState } from 'react';
import { Evolution } from './Treatment.jsx';
import { api, dateTime, fields, number } from './api.js';

export default function Monitoring({ rows, action, busy }) {
  const [scenario, setScenario] = useState('manual');
  const [seed, setSeed] = useState('');
  const [filter, setFilter] = useState('');
  const [metric, setMetric] = useState('pm25');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const needle = search.trim().toLowerCase();
  const filtered = rows.filter(row => (!filter || (row.scenario ?? row.source) === filter) &&
    (!needle || ['#' + row.id, row.scenario, row.seed, row.level, dateTime(row.recorded_at)].some(value => value?.toLowerCase().includes(needle))));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 25));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * 25, (currentPage + 1) * 25);
  const trend = filtered.slice(0, 40).reverse().map((row, i) => ({ ...row, minute: i + 1 }));
  return <section id="mediciones">
    <h2>Mediciones de entrada</h2>
    {rows[0] && <div className="grid kpis" aria-label="Última medición">{fields.map(f =>
      <article key={f.key}><span>{f.label} · {f.unit}</span><strong>{number(rows[0][f.key])}</strong></article>
    )}</div>}
    <form onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const values = Object.fromEntries(fields.map(({key}) => [key, Number(data.get(key))]));
      action(() => scenario === 'manual' ? api('measurements', values) :
        api('measurements/simulate', { scenario, seed, values }));
    }}>
      <label>Origen y escenario<select value={scenario} onChange={e => setScenario(e.target.value)}>
        <option value="manual">Captura manual sin verificar</option><option value="urbano">Urbano simulado</option>
        <option value="industrial">Industrial simulado</option><option value="residencial">Residencial simulado</option>
        <option value="personalizado">Personalizado simulado</option>
      </select></label>
      {(scenario === 'manual' || scenario === 'personalizado') ? <div className="grid">{fields.map(({key, label, unit}) =>
        <label key={key}>{label} ({unit})<input name={key} type="number" step="any" min="0" max="100000" required /></label>
      )}</div> : <label>Semilla reproducible<input value={seed} maxLength={64} placeholder="Opcional" onChange={e => setSeed(e.target.value)} /></label>}
      <div className="actions">
        <button disabled={busy}>{scenario === 'manual' ? 'Guardar medición' : 'Guardar simulación'}</button>
        <button type="button" className="secondary" disabled={busy} onClick={() => action(() => api('measurements/simulate', {}))}>Simular entrada</button>
      </div>
    </form>
    <div className="grid">
      <label>Buscar en el historial<input type="search" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} /></label>
      <label>Filtrar por origen o escenario<select value={filter} onChange={e => { setFilter(e.target.value); setPage(0); }}>
        <option value="">Todos</option>{[...new Set(rows.map(row => row.scenario ?? row.source))].map(value => <option key={value}>{value}</option>)}
      </select></label>
      <label>Contaminante de tendencia<select value={metric} onChange={e => setMetric(e.target.value)}>
        {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
      </select></label>
    </div>
    {trend.length > 0 && <Evolution session={{ samples: trend }} field={fields.find(f => f.key === metric)} timeline="Medición" unit="" />}
    {filtered.length === 0 ? <p>No hay mediciones para esta selección.</p> : <div className="table-wrap"><table>
      <caption>Historial de entrada · hora de Colombia</caption>
      <thead><tr><th>Fecha</th><th>Origen</th>{fields.map(f => <th key={f.key}>{f.label} ({f.unit})</th>)}<th>Nivel</th></tr></thead>
      <tbody>{visible.map(row => <tr key={row.id}><td>{dateTime(row.recorded_at)}</td>
        <td>{row.source === 'manual' ? 'Manual sin verificar' : 'Simulado'}{row.scenario && ' · ' + row.scenario}{row.seed && <small> · {row.seed}</small>}</td>{fields.map(f => <td key={f.key}>{number(row[f.key])}</td>)}
        <td><span className={'level ' + row.level.toLowerCase()}>{row.level}</span></td></tr>)}</tbody>
    </table></div>}
    {pageCount > 1 && <div className="actions">
      <button className="secondary" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Anterior</button>
      <span>Página {currentPage + 1} de {pageCount}</span>
      <button className="secondary" disabled={currentPage + 1 === pageCount} onClick={() => setPage(currentPage + 1)}>Siguiente</button>
    </div>}
  </section>;
}

import React from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { number } from './api.js';

function Bars({ heading, items, unit }) {
  return <article><h3>{heading}</h3>
    <div role="img" aria-label={heading + ': ' + items.map(item => item.label + ' ' + number(item.value)).join(', ')} className="chart">
      <ResponsiveContainer width="100%" height={220}><BarChart data={items}>
        <CartesianGrid strokeDasharray="4 4"/><XAxis dataKey="label"/><YAxis width={55} unit={unit}/>
        <Tooltip formatter={value => number(value) + unit}/><Bar dataKey="value" name={heading} fill="#087d67" isAnimationActive={false}/>
      </BarChart></ResponsiveContainer>
    </div>
  </article>;
}

export default function Analytics({ sessions, technologies, field, alerts }) {
  const mean = values => values.length ? values.reduce((sum, x) => sum + x, 0) / values.length : null;
  const byTechnology = technologies.items.map(t => {
    const treatments = sessions.filter(s => s.technology === t.id);
    return { label: t.id === 'combined' ? 'Combinación' : t.label, value: mean(treatments.map(s => s.result.reductions[field.key]).filter(v => v !== null)) };
  }).filter(t => t.value !== null);
  const scenarioNames = [...new Set(sessions.map(s => s.initial.scenario ?? 'Sin escenario'))];
  const byScenario = scenarioNames.map(label => ({
    label, value: mean(sessions.filter(s => (s.initial.scenario ?? 'Sin escenario') === label).map(s => s.final[field.key]))
  }));
  const ids = new Set(sessions.map(s => s.id));
  const measurementIds = new Set(sessions.map(s => s.measurement_id));
  const related = alerts.filter(a => a.session_id ? ids.has(a.session_id) : measurementIds.has(a.measurement_id));
  const durations = sessions.map(s => s.final.minute);
  const historic = sessions.slice(0, 50).reverse().map(s => ({
    label: '#' + s.id,
    date: new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota' }).format(s.started_at), value: s.final[field.key]
  }));
  return <>
    <div className="grid kpis">
      <article><span>Tratamientos finalizados</span><strong>{sessions.length}</strong></article>
      <article><span>Completados</span><strong>{sessions.filter(s => s.status === 'completed').length}</strong></article>
      <article><span>Duración promedio</span><strong>{number(mean(durations))} min</strong></article>
      <article><span>Alertas relacionadas</span><strong>{related.length}</strong></article>
    </div>
    <div className="charts">
      <Bars heading="Reducción media por tecnología" items={byTechnology} unit="%" />
      <Bars heading="Salida media por escenario" items={byScenario} unit={' ' + field.unit} />
      <Bars heading="Distribución de alertas" items={['Alta', 'Moderada'].map(label => ({ label, value: related.filter(a => a.severity === label).length }))} unit="" />
      <article><h3>Evolución histórica · {field.label}</h3><div className="chart" role="img" aria-label={'Concentración de salida en las últimas ' + historic.length + ' sesiones'}>
        <ResponsiveContainer width="100%" height={220}><LineChart data={historic}>
          <CartesianGrid strokeDasharray="4 4"/><XAxis dataKey="date"/><YAxis width={62} unit={' ' + field.unit}/>
          <Tooltip labelFormatter={(date, items) => date + ' · ' + (items[0]?.payload.label ?? '')} formatter={value => [number(value), field.label]}/>
          <Line dataKey="value" stroke="#087d67" strokeWidth={3} isAnimationActive={false}/>
        </LineChart></ResponsiveContainer>
      </div></article>
    </div>
    <p className="muted">Cada media usa sesiones filtradas. Las reducciones con entrada cero se excluyen de la media porcentual. Los resultados dependen del escenario exterior y del tiempo simulado.</p>
  </>;
}

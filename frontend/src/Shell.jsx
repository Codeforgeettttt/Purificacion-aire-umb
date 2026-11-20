import React, { useEffect, useState } from 'react';

const sections = [
  ['dashboard', 'Panel BI', '▥'],
  ['mediciones', 'Mediciones', '◉'],
  ['tratamientos', 'Tratamientos', '≋'],
  ['validacion', 'Validación', '✓'],
  ['reportes', 'Alertas y reportes', '▤']
];

function currentSection() {
  const hash = window.location.hash.slice(1);
  return sections.some(([id]) => id === hash) ? hash : 'dashboard';
}

export default function Shell({ panels, busy, error, notice, retry }) {
  const [active, setActive] = useState(currentSection);
  const [dark, setDark] = useState(() => localStorage.getItem('air-theme') === 'dark');
  useEffect(() => {
    const change = () => setActive(currentSection());
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('air-theme', dark ? 'dark' : 'light');
  }, [dark]);
  return <div className="app-shell">
    <a className="skip" href="#contenido">Ir al contenido</a>
    <aside className="sidebar">
      <div className="wordmark"><span aria-hidden="true">≋</span><div>Air Quality<small>Intelligence Desktop</small></div></div>
      <nav aria-label="Secciones">{sections.map(([id, label, glyph]) =>
        <a key={id} href={'#' + id} aria-current={id === active ? 'page' : undefined}>
          <span aria-hidden="true">{glyph}</span> {label}
        </a>)}</nav>
      <footer>Universidad Manuela Beltrán</footer>
    </aside>
    <main id="contenido" tabIndex={-1}>
      <div className="topline">
        <span className="eyebrow">MONITOREO AMBIENTAL</span>
        <button className="secondary" type="button" aria-pressed={dark} onClick={() => setDark(!dark)}>
          {dark ? 'Modo claro' : 'Modo oscuro'}
        </button>
      </div>
      <header><p className="eyebrow">UMB · INTELIGENCIA DE NEGOCIOS</p><h1>Air Quality Intelligence</h1>
        <p>Monitorea la calidad del aire y evalúa tratamientos en un entorno simulado.</p></header>
      <div className={busy || notice ? 'toast' : ''} role="status" aria-live="polite">{busy ? 'Cargando…' : notice}</div>
      {error && <div role="alert"><p>{error}</p><button type="button" className="secondary" onClick={retry} disabled={busy}>Actualizar datos</button></div>}
      {panels[active]}
    </main>
  </div>;
}

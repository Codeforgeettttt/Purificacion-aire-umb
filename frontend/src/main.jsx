import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api.js';
import Monitoring from './Monitoring.jsx';
import Treatment from './Treatment.jsx';
import './style.css';

function App() {
  const [rows, setRows] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [technologies, setTechnologies] = useState({ items: [] });
  const running = sessions.some(session => session.status === 'running');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function reload() {
    const [entries, treatments] = await Promise.all([api('measurements'), api('sessions')]);
    setRows(entries);
    setSessions(treatments);
  }
  useEffect(() => {
    Promise.all([reload(), api('technologies').then(setTechnologies)])
      .catch(e => setError(e.message)).finally(() => setBusy(false));
  }, []);
  useEffect(() => {
    if (!running || busy) return;
    let active = true;
    let timer;
    async function poll() {
      try {
        const data = await api('sessions');
        if (active) setSessions(data);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) timer = setTimeout(poll, 500);
      }
    }
    timer = setTimeout(poll, 500);
    return () => { active = false; clearTimeout(timer); };
  }, [running, busy]);
  async function action(operation) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await operation();
      await reload();
      setNotice('Cambios guardados.');
      return result;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return <main><nav aria-label="Principal"><a href="#inicio">Inicio</a><a href="#mediciones">Mediciones</a><a href="#tratamientos">Tratamientos</a></nav>
    <header id="inicio"><p className="eyebrow">UMB · INTELIGENCIA DE NEGOCIOS</p><h1>Air Quality Intelligence</h1>
      <p>Monitorea la calidad del aire y evalúa tratamientos en un entorno simulado.</p></header>
    <div role="status" aria-live="polite">{busy ? 'Cargando…' : notice}</div>
    {error && <p role="alert">{error}</p>}
    <Monitoring rows={rows} action={action} busy={busy} />
    <Treatment rows={rows} sessions={sessions} technologies={technologies} action={action} busy={busy} />
  </main>;
}
createRoot(document.getElementById('root')).render(<App />);

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api.js';
import Monitoring from './Monitoring.jsx';
import './style.css';

function App() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function reload() {
    setRows(await api('measurements'));
  }
  useEffect(() => {
    reload().catch(e => setError(e.message)).finally(() => setBusy(false));
  }, []);
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
  return <main><nav aria-label="Principal"><a href="#inicio">Inicio</a><a href="#mediciones">Mediciones</a></nav>
    <header id="inicio"><p className="eyebrow">UMB · INTELIGENCIA DE NEGOCIOS</p><h1>Air Quality Intelligence</h1>
      <p>Monitorea la calidad del aire y evalúa tratamientos en un entorno simulado.</p></header>
    <div role="status" aria-live="polite">{busy ? 'Cargando…' : notice}</div>
    {error && <p role="alert">{error}</p>}
    <Monitoring rows={rows} action={action} busy={busy} />
  </main>;
}
createRoot(document.getElementById('root')).render(<App />);

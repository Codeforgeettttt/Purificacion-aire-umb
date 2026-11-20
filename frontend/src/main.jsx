import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  const [status, setStatus] = useState('Conectando…');
  useEffect(() => {
    fetch('/api/health').then(response => response.json())
      .then(data => setStatus(data.ok ? 'Servidor conectado' : 'Servicio no disponible'))
      .catch(() => setStatus('Servicio no disponible'));
  }, []);
  return <main><nav><a href="#inicio">Inicio</a><a href="#estado">Estado</a></nav>
    <h1 id="inicio">Air Quality Intelligence</h1><p>Universidad Manuela Beltrán · Inteligencia de Negocios</p>
    <section id="estado"><h2>Estado del sistema</h2><p role="status">{status}</p></section></main>;
}
createRoot(document.getElementById('root')).render(<App />);

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api } from './api.js';
import Monitoring from './Monitoring.jsx';
import Treatment from './Treatment.jsx';
import Validation from './Validation.jsx';
import Dashboard from './Dashboard.jsx';
import Reports from './Reports.jsx';
import Shell from './Shell.jsx';
import DataManagement from './DataManagement.jsx';
import './style.css';

function App() {
  const [settings, setSettings] = useState({ theme: 'light', defaultDuration: 15 });
  const [alerts, setAlerts] = useState([]);
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
    setAlerts(await api('alerts'));
  }
  useEffect(() => {
    Promise.all([reload(), api('technologies').then(setTechnologies), api('settings').then(setSettings)])
      .catch(e => setError(e.message)).finally(() => setBusy(false));
  }, []);
  useEffect(() => {
    if (!running || busy) return;
    let active = true;
    let timer;
    async function poll() {
      try {
        const data = await api('sessions');
        const notifications = await api('alerts');
        if (active) {
          setSessions(data);
          setAlerts(notifications);
        }
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
  return <Shell busy={busy} notice={notice} error={error} theme={settings.theme}
    changeTheme={theme => action(async () => setSettings(await api('settings', { theme })))}
    retry={() => action(() => api('technologies').then(setTechnologies))}
    panels={{
      dashboard: <Dashboard sessions={sessions} technologies={technologies} alerts={alerts} />,
      mediciones: <Monitoring rows={rows} action={action} busy={busy} />,
      tratamientos: <Treatment rows={rows} sessions={sessions} technologies={technologies} action={action} busy={busy} defaultDuration={settings.defaultDuration} />,
      validacion: <Validation sessions={sessions} technologies={technologies} />,
      reportes: <Reports alerts={alerts} sessions={sessions} technologies={technologies} />,
      datos: <DataManagement action={action} busy={busy} settings={settings} updateSettings={setSettings} />
    }} />;
}
createRoot(document.getElementById('root')).render(<App />);

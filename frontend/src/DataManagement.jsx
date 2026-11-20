import React, { useRef, useState } from 'react';
import { api } from './api.js';

export default function DataManagement({ action, busy, settings, updateSettings }) {
  const [file, setFile] = useState(null);
  const dialog = useRef(null);
  const [operation, setOperation] = useState(null);
  function confirm(kind) {
    setOperation(kind);
    dialog.current.showModal();
  }
  function run() {
    dialog.current.close();
    if (operation === 'demo') return action(() => api('data/demo', {}));
    action(async () => {
      const response = await fetch('/api/data/restore', {
        method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: file
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      updateSettings(await api('settings'));
      return result;
    });
  }
  return <section id="datos"><h2>Datos y preferencias</h2>
    <form onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      action(async () => updateSettings(await api('settings', { defaultDuration: Number(data.get('duration')) })));
    }}>
      <label>Duración predeterminada (min)<input key={settings.defaultDuration} name="duration" type="number" required min="1" max="120" defaultValue={settings.defaultDuration} /></label>
      <button disabled={busy}>Guardar preferencias</button>
    </form>
    <h3>Respaldo SQLite</h3>
    <p>Descarga todos los datos y preferencias en un archivo local. La restauración reemplaza la base activa después de validar su integridad.</p>
    <p><a href="/api/data/backup" download>Descargar respaldo</a></p>
    <label>Archivo SQLite<input type="file" accept=".sqlite,.db" onChange={event => setFile(event.target.files[0])} /></label>
    <div className="actions">
      <button disabled={busy || !file} onClick={() => confirm('restore')}>Restaurar respaldo</button>
      <button className="secondary" disabled={busy} onClick={() => confirm('demo')}>Recrear demostración</button>
    </div>
    <dialog ref={dialog} aria-labelledby="data-confirm-title">
      <h3 id="data-confirm-title">Confirma el cambio</h3>
      <p>{operation === 'demo' ? 'Se reemplazarán las sesiones de demostración creadas por esta pantalla.' :
        'Se reemplazarán las mediciones, sesiones y preferencias actuales. Guarda un respaldo antes de continuar.'}</p>
      <div className="actions">
        <button className="secondary" autoFocus onClick={() => dialog.current.close()}>Cancelar</button>
        <button onClick={run}>Confirmar</button>
      </div>
    </dialog>
  </section>;
}

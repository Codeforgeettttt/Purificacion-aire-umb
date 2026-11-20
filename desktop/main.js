import { app, BrowserWindow, dialog, Menu, session } from 'electron';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createApp } from '../backend/src/server.js';

const smoke = process.env.AIR_QUALITY_SMOKE_DIR;
const portable = process.env.PORTABLE_EXECUTABLE_DIR;
if (smoke || portable) {
  const directory = smoke ? resolve(smoke) : join(portable, 'AirQualityData');
  mkdirSync(directory, { recursive: true });
  app.setPath('userData', directory);
}

let window;
let server;
let db;
let closing = false;

async function launch() {
  const token = randomBytes(32).toString('hex');
  const backend = await createApp({ dbPath: join(app.getPath('userData'), 'air.sqlite'),
    staticDir: join(app.getAppPath(), 'dist'), accessToken: token });
  db = backend.locals.db;
  server = backend.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = 'http://127.0.0.1:' + server.address().port;
  const profile = session.fromPartition('air-quality-local');
  profile.setPermissionCheckHandler(() => false);
  profile.setPermissionRequestHandler((_contents, _permission, respond) => respond(false));
  profile.webRequest.onBeforeRequest((details, respond) => {
    respond({ cancel: new URL(details.url).origin !== origin });
  });
  profile.webRequest.onBeforeSendHeaders((details, respond) => {
    const requestHeaders = { ...details.requestHeaders };
    if (new URL(details.url).origin === origin) requestHeaders['X-Air-Desktop'] = token;
    respond({ requestHeaders });
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Aplicación', submenu: [{ label: 'Salir', role: 'quit' }] },
    { label: 'Ver', submenu: [{ label: 'Minimizar', role: 'minimize' }, { label: 'Pantalla completa', role: 'togglefullscreen' }] }
  ]));
  window = new BrowserWindow({
    title: 'Air Quality Intelligence Desktop', width: 1360, height: 900,
    minWidth: 780, minHeight: 600, show: !smoke,
    icon: join(app.getAppPath(), 'desktop', 'icon.png'),
    webPreferences: { session: profile, contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  function guard(event, url) {
    if (new URL(url).origin !== origin) event.preventDefault();
  }
  window.webContents.on('will-navigate', guard);
  window.webContents.on('will-redirect', guard);
  await window.loadURL(origin);
  if (smoke) {
    const unauthorized = await fetch(origin + '/api/health');
    const audit = await window.webContents.executeJavaScript(
      "Promise.all([fetch('/api/health').then(r=>r.json()), fetch('/api/measurements').then(r=>r.json()), typeof window.require, !!document.querySelector('h1')])"
    );
    if (unauthorized.status !== 403 || audit[0].ok !== true || !Array.isArray(audit[1]) || audit[2] !== 'undefined' || !audit[3]) {
      throw new Error('Falló el arranque o el aislamiento de escritorio: ' + JSON.stringify(audit));
    }
    const created = await window.webContents.executeJavaScript("fetch('/api/measurements/simulate',{method:'POST'}).then(r=>r.status)");
    if (created !== 201) throw new Error('Falló la escritura desde Electron.');
    writeFileSync(join(smoke, 'desktop-smoke.json'), JSON.stringify({ ok: true, previous: audit[1].length, electron: process.versions.electron }));
    app.quit();
  }
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {
    if (window?.isMinimized()) window.restore();
    window?.focus();
  });
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', event => {
    if (!server || closing) return;
    event.preventDefault();
    closing = true;
    server.close(() => {
      db.close();
      app.quit();
    });
  });
  app.whenReady().then(launch).catch(error => {
    if (smoke) writeFileSync(join(smoke, 'desktop-smoke.json'), JSON.stringify({ ok: false, error: error.stack }));
    else dialog.showErrorBox('Air Quality Intelligence', 'No fue posible iniciar la aplicación.\n\n' + error.message);
    app.exit(1);
  });
}

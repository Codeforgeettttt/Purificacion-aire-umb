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
    webPreferences: { session: profile, contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: !smoke }
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
    const web = window.webContents;
    async function wait(label, script) {
      writeFileSync(join(smoke, 'desktop-smoke.json'), JSON.stringify({ step: label }));
      for (let i = 0; i < 100; i++) {
        const result = await web.executeJavaScript(script);
        if (result) return result;
        await new Promise(resolve => setTimeout(resolve, 60));
      }
      throw new Error('La interfaz no respondió: ' + label);
    }
    await web.executeJavaScript("location.hash = 'mediciones'");
    await wait('captura simulada', "Boolean([...document.querySelectorAll('button')].find(b => b.textContent === 'Simular entrada' && !b.disabled))");
    await web.executeJavaScript("[...document.querySelectorAll('button')].find(b => b.textContent === 'Simular entrada').click()");
    await wait('historial de entrada', "document.querySelectorAll('#mediciones tbody tr').length");
    await web.executeJavaScript("location.hash = 'tratamientos'");
    await wait('inicio de tratamiento', "Boolean(document.querySelector('#tratamientos form button:not(:disabled)'))");
    await web.executeJavaScript("document.querySelector('#tratamientos input[name=duration]').value='1'; document.querySelector('#tratamientos form button').click();");
    await web.executeJavaScript("location.hash = 'dashboard'");
    await wait('indicadores de tratamiento', "document.querySelectorAll('#dashboard .kpis article').length >= 4");
    writeFileSync(join(smoke, 'desktop-smoke.json'), JSON.stringify({ step: 'gráficos listos' }));
    const charts = await web.executeJavaScript("document.querySelectorAll('#dashboard .chart').length");
    const request = path => fetch(origin + '/api/' + path, { headers: { 'X-Air-Desktop': token }, signal: AbortSignal.timeout(5000) });
    writeFileSync(join(smoke, 'desktop-smoke.json'), JSON.stringify({ step: 'solicitud PDF', charts }));
    const pdf = await request('reports/treatments.pdf');
    const pdfText = await pdf.text();
    writeFileSync(join(smoke, 'desktop-smoke.json'), JSON.stringify({ step: 'solicitud CSV', charts }));
    const csv = await request('reports/treatments.csv');
    const csvText = await csv.text();
    writeFileSync(join(smoke, 'desktop-smoke.json'), JSON.stringify({ step: 'solicitud SQLite', charts }));
    const backup = await request('data/backup');
    const backupText = await backup.text();
    writeFileSync(join(smoke, 'desktop-smoke.json'), JSON.stringify({ step: 'exportaciones listas' }));
    const offline = await Promise.race([
      web.executeJavaScript("fetch('https://example.invalid/').then(() => false, () => true)"),
      new Promise(resolve => setTimeout(() => resolve(false), 4000))
    ]);
    const flow = { charts, pdf: pdfText.startsWith('%PDF-'), csv: csvText.includes('sesion'),
      backup: backupText.startsWith('SQLite format 3'), offline };
    if (flow.charts < 3 || !flow.pdf || !flow.csv || !flow.backup || !flow.offline) {
      throw new Error('Falló el flujo de escritorio: ' + JSON.stringify(flow));
    }
    writeFileSync(join(smoke, 'desktop-smoke.json'), JSON.stringify({ ok: true, previous: audit[1].length, electron: process.versions.electron, flow,
      totalWorkingSetKiB: app.getAppMetrics().reduce((sum, item) => sum + (item.memory?.workingSetSize ?? 0), 0) }));
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
    server.closeAllConnections();
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

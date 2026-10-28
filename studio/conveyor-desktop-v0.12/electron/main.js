'use strict';

const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { classifyHandshake, isPreferredUsbPort } = require('./protocol');
const { FactoryNetwork } = require('./factoryNetwork');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-sandbox');

let win = null;
let activePort = null;
let activeParser = null;
let selectedPath = null;
let reconnectEnabled = true;
let reconnectBusy = false;
let closingByUser = false;
let reconnectTimer = null;
const factoryNetwork = new FactoryNetwork({
  sendStatus: status => send('factory-status', status),
  sendEvent: event => send('factory-event', event)
});

function send(channel, payload) {
  if (win && !win.isDestroyed() && !win.webContents.isDestroyed()) {
    win.webContents.send(channel, payload);
  }
}

function friendlyError(error) {
  const raw = String(error && (error.message || error) || '알 수 없는 오류');
  if (/access denied|permission|denied/i.test(raw)) return { code: 'PORT_BUSY', message: '다른 프로그램이 이 포트를 사용 중이거나 접근 권한이 없습니다.' };
  if (/cannot find|not found|no such file|unknown port/i.test(raw)) return { code: 'NOT_FOUND', message: '보드가 분리되었거나 Windows가 COM 포트를 인식하지 못했습니다.' };
  if (/busy|resource/i.test(raw)) return { code: 'PORT_BUSY', message: 'COM 포트가 다른 프로그램에서 사용 중입니다.' };
  return { code: 'OPEN_FAILED', message: '포트를 열 수 없습니다. USB 케이블, CH340 드라이버, 보드 인식 상태를 확인하세요.', detail: raw };
}

async function listPorts() {
  const ports = await SerialPort.list();
  return ports.map(portInfo => ({
    path: portInfo.path,
    manufacturer: portInfo.manufacturer || '',
    serialNumber: portInfo.serialNumber || '',
    pnpId: portInfo.pnpId || '',
    locationId: portInfo.locationId || '',
    vendorId: portInfo.vendorId || '',
    productId: portInfo.productId || '',
    preferred: isPreferredUsbPort(portInfo)
  })).sort((a, b) => Number(b.preferred) - Number(a.preferred) || a.path.localeCompare(b.path));
}

function closeActive({ user = false } = {}) {
  closingByUser = user;
  return new Promise(resolve => {
    if (!activePort || !activePort.isOpen) {
      activePort = null;
      activeParser = null;
      closingByUser = false;
      resolve();
      return;
    }
    const target = activePort;
    target.close(() => {
      if (activePort === target) {
        activePort = null;
        activeParser = null;
      }
      closingByUser = false;
      resolve();
    });
  });
}

async function openActive(portPath, { remember = true, reconnected = false } = {}) {
  if (!portPath) return { ok: false, error: { code: 'NO_PORT', message: '연결할 COM 포트를 선택하세요.' } };
  await closeActive();
  if (remember) selectedPath = portPath;

  return new Promise(resolve => {
    let settled = false;
    const next = new SerialPort({ path: portPath, baudRate: 115200, autoOpen: false });
    const parser = next.pipe(new ReadlineParser({ delimiter: '\n' }));
    activePort = next;
    activeParser = parser;
    parser.on('data', line => send('serial-data', String(line).replace(/\r$/, '')));
    next.once('open', () => {
      settled = true;
      send('serial-status', { state: reconnected ? 'reconnected' : 'open', path: portPath });
      resolve({ ok: true, path: portPath });
    });
    next.on('error', error => {
      const mapped = friendlyError(error);
      send('serial-status', { state: 'error', path: portPath, error: mapped });
      if (!settled) {
        settled = true;
        resolve({ ok: false, error: mapped });
      }
    });
    next.on('close', () => {
      if (activePort === next) {
        activePort = null;
        activeParser = null;
      }
      send('serial-status', { state: 'closed', path: portPath, reconnecting: reconnectEnabled && !closingByUser });
    });
    next.open(error => {
      if (error && !settled) {
        settled = true;
        resolve({ ok: false, error: friendlyError(error) });
      }
    });
  });
}

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function probePort(portPath) {
  if (!portPath) return { ok: false, error: { code: 'NO_PORT', message: '포트를 선택하세요.' } };
  if (activePort && activePort.isOpen) return { ok: false, error: { code: 'CONNECTED', message: '현재 연결을 해제한 뒤 장치 검색을 실행하세요.' } };

  return new Promise(resolve => {
    const lines = [];
    let finished = false;
    const probe = new SerialPort({ path: portPath, baudRate: 115200, autoOpen: false });
    const parser = probe.pipe(new ReadlineParser({ delimiter: '\n' }));
    parser.on('data', line => lines.push(String(line).replace(/\r$/, '').trim()));

    const finish = result => {
      if (finished) return;
      finished = true;
      const done = () => resolve(result);
      if (probe.isOpen) probe.close(done); else done();
    };

    probe.open(async error => {
      if (error) return finish({ ok: false, path: portPath, error: friendlyError(error) });
      try {
        await wait(950);
        probe.write('HELLO\nSTATUS\nHELLO?\n');
        await wait(1650);
        const result = classifyHandshake(lines);
        finish({ ok: true, path: portPath, ...result });
      } catch (probeError) {
        finish({ ok: false, path: portPath, error: friendlyError(probeError) });
      }
    });
    setTimeout(() => finish({ ok: true, path: portPath, ...classifyHandshake(lines), timedOut: true }), 3300);
  });
}

async function autoDiscover() {
  const ports = await listPorts();
  const results = [];
  for (const info of ports) {
    const result = await probePort(info.path);
    results.push({ ...info, ...result });
    if (result.ok && result.identified) break;
  }
  const verified = results.find(result => result.ok && result.identified);
  const compatible = verified || results.find(result => result.ok && result.compatible);
  return { ok: Boolean(compatible), match: compatible || null, ports, results };
}

async function reconnectTick() {
  if (!reconnectEnabled || reconnectBusy || !selectedPath || (activePort && activePort.isOpen)) return;
  reconnectBusy = true;
  try {
    const ports = await listPorts();
    if (!ports.some(portInfo => portInfo.path === selectedPath)) return;
    send('serial-status', { state: 'reconnecting', path: selectedPath });
    const result = await openActive(selectedPath, { remember: false, reconnected: true });
    if (result.ok) setTimeout(() => writeActive('HELLO\nSTATUS\n'), 1000);
  } catch (_) {
    // The next scheduled pass retries. Renderer already shows reconnect state.
  } finally {
    reconnectBusy = false;
  }
}

function writeActive(data) {
  return new Promise(resolve => {
    if (!activePort || !activePort.isOpen) return resolve({ ok: false, error: { code: 'NOT_OPEN', message: '연결된 COM 포트가 없습니다.' } });
    activePort.write(String(data), error => {
      if (error) return resolve({ ok: false, error: friendlyError(error) });
      activePort.drain(drainError => resolve(drainError ? { ok: false, error: friendlyError(drainError) } : { ok: true }));
    });
  });
}

function createWindow() {
  const webRoot = app.isPackaged ? path.join(process.resourcesPath, 'web') : path.join(__dirname, '..', 'web');
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1120,
    minHeight: 720,
    show: false,
    backgroundColor: '#08090b',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.removeMenu();
  win.maximize();
  session.defaultSession.clearCache().finally(() => win.loadFile(path.join(webRoot, 'index.html')));
  win.once('ready-to-show', () => { win.show(); win.focus(); });
}

ipcMain.handle('list-ports', async () => {
  try { return { ok: true, ports: await listPorts() }; }
  catch (error) { return { ok: false, ports: [], error: friendlyError(error) }; }
});
ipcMain.handle('probe-port', (_event, portPath) => probePort(portPath));
ipcMain.handle('auto-discover', () => autoDiscover());
ipcMain.handle('connect', (_event, portPath) => openActive(portPath));
ipcMain.handle('disconnect', async () => {
  reconnectEnabled = false;
  selectedPath = null;
  await closeActive({ user: true });
  send('serial-status', { state: 'disconnected' });
  return { ok: true };
});
ipcMain.handle('set-auto-reconnect', (_event, enabled) => {
  reconnectEnabled = Boolean(enabled);
  return { ok: true, enabled: reconnectEnabled };
});
ipcMain.handle('write', (_event, data) => writeActive(data));
ipcMain.handle('factory-start', (_event, config) => factoryNetwork.start(config));
ipcMain.handle('factory-stop', () => factoryNetwork.stop());
ipcMain.handle('factory-send-event', (_event, eventName) => {
  try { return factoryNetwork.sendFactoryEvent(eventName); }
  catch (error) { return { ok: false, error: error.message }; }
});
ipcMain.on('get-app-version', event => { event.returnValue = app.getVersion(); });

app.whenReady().then(() => {
  createWindow();
  reconnectTimer = setInterval(reconnectTick, 2000);
});
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => {
  if (reconnectTimer) clearInterval(reconnectTimer);
  reconnectEnabled = false;
  factoryNetwork.stop(false);
  try { if (activePort && activePort.isOpen) activePort.close(); } catch (_) {}
});

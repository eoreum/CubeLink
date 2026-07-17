const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

let win, port, parser, lastPath = null;
// 창이 살아있을 때만 안전하게 메시지 전송
function safeSend(channel, data) {
  if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
    win.webContents.send(channel, data);
  }
}


function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    show: false,          // 준비될 때까지 숨김 (깜빡임 방지)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.maximize();         // 창을 최대 크기로
  win.show();
  win.loadFile(path.join(__dirname, 'index.html'));
}

async function connectSerial(pathName) {
  lastPath = pathName;
  try {
    if (port && port.isOpen) { try { await port.close(); } catch(_){} }
    port = new SerialPort({ path: pathName, baudRate: 115200 });
    parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
    parser.on('data', d => safeSend('serial-data', d));
    port.on('open',  () => safeSend('serial-status', 'open'));
       port.on('close', () => {
      safeSend('serial-status', 'closed');
      // 전압 강하로 끊겨도 조용히 재시도 (단, 창이 살아있을 때만)
      if (win && !win.isDestroyed() && lastPath) {
        setTimeout(() => { if (lastPath) connectSerial(lastPath); }, 1000);
      }
    });

    port.on('error', e => safeSend('serial-status', 'error:' + e.message));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

ipcMain.handle('list-ports', async () => {
  try { return await SerialPort.list(); }
  catch(e) { return []; }
});
ipcMain.handle('connect', (_e, p) => connectSerial(p));

ipcMain.handle('write', (_e, data) => {
  return new Promise((resolve) => {
    if (port && port.isOpen) port.write(data, () => resolve({ ok: true }));
    else resolve({ ok: false });
  });
});

ipcMain.handle('disconnect', async () => {
  lastPath = null;  // 자동 재연결 중단
  try { if (port && port.isOpen) await port.close(); } catch(_) {}
  return { ok: true };
});


app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  lastPath = null;                          // 재연결 중단
  try { if (port && port.isOpen) port.close(); } catch (_) {}
  app.quit();
});


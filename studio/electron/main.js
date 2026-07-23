const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Some classroom PCs cannot start Electron's GPU process because of their
// graphics driver/runtime configuration. Use Chromium's software renderer so
// the Studio still opens reliably; the 3D simulator remains available.
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-sandbox');

let win, port, parser, lastPath = null;
// 창이 살아있을 때만 안전하게 메시지 전송
function safeSend(channel, data) {
  if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
    win.webContents.send(channel, data);
  }
}


function createWindow() {
  const rendererRoot = app.isPackaged
    ? path.join(process.resourcesPath, 'web')
    : path.join(__dirname, '..', 'web');

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
  win.maximize();                    // 창을 최대 크기로 (전체화면)
  win.show();
  win.focus();                       // 포커스 주기

  // 실행 순간 맨 앞으로 가져오기 (그 후 일반 창처럼 동작)
  win.setAlwaysOnTop(true);
  win.setAlwaysOnTop(false);
  win.moveTop();

  // 캐시만 삭제 (학생 작업물 localStorage는 유지) 후 페이지 로드
  session.defaultSession.clearCache().then(() => {
    win.loadFile(path.join(rendererRoot, 'index.html'));
  }).catch(() => {
    win.loadFile(path.join(rendererRoot, 'index.html'));
  });

}

function closeSerialPort() {
  return new Promise((resolve) => {
    if (!port || !port.isOpen) {
      port = null;
      parser = null;
      resolve();
      return;
    }

    const closingPort = port;
    closingPort.close(() => {
      if (port === closingPort) {
        port = null;
        parser = null;
      }
      resolve();
    });
  });
}

async function connectSerial(pathName) {
  if (!pathName) return { ok: false, error: 'Serial port path is required.' };

  lastPath = null;
  await closeSerialPort();
  lastPath = pathName;

  return new Promise((resolve) => {
    let settled = false;
    const nextPort = new SerialPort({ path: pathName, baudRate: 115200, autoOpen: false });
    port = nextPort;
    parser = nextPort.pipe(new ReadlineParser({ delimiter: '\n' }));
    parser.on('data', data => safeSend('serial-data', data));

    nextPort.once('open', () => {
      settled = true;
      safeSend('serial-status', 'open');
      resolve({ ok: true });
    });

    nextPort.on('error', (error) => {
      safeSend('serial-status', 'error:' + error.message);
      if (!settled) {
        settled = true;
        resolve({ ok: false, error: error.message });
      }
    });

    nextPort.on('close', () => {
      safeSend('serial-status', 'closed');
      if (port === nextPort) {
        port = null;
        parser = null;
      }
    });

    nextPort.open((error) => {
      if (error && !settled) {
        settled = true;
        safeSend('serial-status', 'error:' + error.message);
        resolve({ ok: false, error: error.message });
      }
    });
  });
}

ipcMain.handle('list-ports', async () => {
  try { return await SerialPort.list(); }
  catch(e) { return []; }
});
ipcMain.handle('connect', (_e, p) => connectSerial(p));
ipcMain.handle('focus-window', () => {
  if (win && !win.isDestroyed()) {
    win.setAlwaysOnTop(true);
    win.focus();
    win.setAlwaysOnTop(false);
  }
});
ipcMain.handle('write', (_e, data) => {
  return new Promise((resolve) => {
    if (!port || !port.isOpen) {
      resolve({ ok: false, error: 'Serial port is not open.' });
      return;
    }
    port.write(data, (error) => {
      if (error) {
        resolve({ ok: false, error: error.message });
        return;
      }
      port.drain((drainError) => {
        if (drainError) resolve({ ok: false, error: drainError.message });
        else resolve({ ok: true });
      });
    });
  });
});

ipcMain.handle('disconnect', async () => {
  lastPath = null;
  await closeSerialPort();
  return { ok: true };
});


app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  lastPath = null;
  try { if (port && port.isOpen) port.close(); } catch (_) {}
  app.quit();
});


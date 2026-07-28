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
let connectionGeneration = 0;
let serialTransition = Promise.resolve();
const SERIAL_OPEN_TIMEOUT_MS = 8000;
const SERIAL_CLOSE_TIMEOUT_MS = 2500;
const SERIAL_WRITE_TIMEOUT_MS = 3000;
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

function queueSerialTransition(task) {
  const next = serialTransition.then(task, task);
  serialTransition = next.catch(() => {});
  return next;
}

function closeSerialPort() {
  return new Promise((resolve) => {
    const closingPort = port;
    connectionGeneration++;
    port = null;
    parser = null;

    if (!closingPort) {
      resolve();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      closingPort.removeListener('close', finish);
      resolve();
    };
    const timer = setTimeout(() => {
      try { closingPort.destroy(); } catch (_) {}
      finish();
    }, SERIAL_CLOSE_TIMEOUT_MS);

    closingPort.once('close', finish);
    try {
      if (closingPort.isOpen) {
        closingPort.close(() => finish());
      } else {
        // destroy() also cancels a native port that is still opening.
        closingPort.destroy();
      }
    } catch (_) {
      finish();
    }
  });
}

async function connectSerial(pathName) {
  if (!pathName) return { ok: false, error: 'Serial port path is required.' };

  lastPath = null;
  await closeSerialPort();

  let availablePorts;
  try {
    availablePorts = await SerialPort.list();
  } catch (error) {
    return { ok: false, error: 'Unable to list serial ports: ' + error.message };
  }
  const selected = availablePorts.find(
    candidate => String(candidate.path).toLowerCase() === String(pathName).toLowerCase()
  );
  if (!selected) {
    return { ok: false, error: `Serial port ${pathName} is no longer available.` };
  }

  lastPath = pathName;

  return new Promise((resolve) => {
    let settled = false;
    const generation = ++connectionGeneration;
    const nextPort = new SerialPort({ path: pathName, baudRate: 115200, autoOpen: false });
    port = nextPort;
    parser = nextPort.pipe(new ReadlineParser({ delimiter: '\n' }));
    parser.on('data', data => {
      if (port === nextPort && generation === connectionGeneration) {
        safeSend('serial-data', data);
      }
    });

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(openTimer);
      resolve(result);
    };
    const failOpen = (message) => {
      if (settled) return;
      if (port === nextPort && generation === connectionGeneration) {
        port = null;
        parser = null;
        connectionGeneration++;
        safeSend('serial-status', 'error:' + message);
      }
      finish({ ok: false, error: message });
      try { nextPort.destroy(); } catch (_) {}
    };
    const openTimer = setTimeout(
      () => failOpen(`Timed out opening ${pathName}.`),
      SERIAL_OPEN_TIMEOUT_MS
    );

    nextPort.once('open', () => {
      if (port !== nextPort || generation !== connectionGeneration) {
        try { nextPort.close(); } catch (_) {}
        finish({ ok: false, error: 'Serial connection was cancelled.' });
        return;
      }
      safeSend('serial-status', 'open');
      finish({ ok: true });
    });

    nextPort.on('error', (error) => {
      if (port === nextPort && generation === connectionGeneration) {
        safeSend('serial-status', 'error:' + error.message);
      }
      if (!settled) {
        failOpen(error.message);
      }
    });

    nextPort.on('close', () => {
      if (port === nextPort && generation === connectionGeneration) {
        port = null;
        parser = null;
        connectionGeneration++;
        safeSend('serial-status', 'closed');
      }
    });

    nextPort.open((error) => {
      if (error && !settled) {
        failOpen(error.message);
      }
    });
  });
}

ipcMain.handle('list-ports', async () => {
  try { return await SerialPort.list(); }
  catch(e) { return []; }
});
ipcMain.handle('connect', (_e, p) => queueSerialTransition(() => connectSerial(p)));
ipcMain.handle('focus-window', () => {
  if (win && !win.isDestroyed()) {
    if (win.isMinimized()) win.restore();
    if (!win.isVisible()) win.show();
    win.setAlwaysOnTop(true);
    win.focus();
    if (win.webContents && !win.webContents.isDestroyed()) win.webContents.focus();
    win.setAlwaysOnTop(false);
  }
});
ipcMain.handle('write', (_e, data) => {
  return new Promise((resolve) => {
    if (!port || !port.isOpen) {
      resolve({ ok: false, error: 'Serial port is not open.' });
      return;
    }
    const activePort = port;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const failWrite = (message) => {
      if (port === activePort) {
        safeSend('serial-status', 'error:' + message);
        try { activePort.destroy(); } catch (_) {}
      }
      finish({ ok: false, error: message });
    };
    const timer = setTimeout(() => {
      failWrite('Serial write timed out.');
    }, SERIAL_WRITE_TIMEOUT_MS);

    activePort.write(data, (error) => {
      if (error) {
        failWrite(error.message);
        return;
      }
      activePort.drain((drainError) => {
        if (drainError) failWrite(drainError.message);
        else finish({ ok: true });
      });
    });
  });
});

ipcMain.handle('disconnect', async () => {
  lastPath = null;
  await queueSerialTransition(() => closeSerialPort());
  safeSend('serial-status', 'closed');
  return { ok: true };
});


app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  lastPath = null;
  try {
    if (port) {
      if (port.isOpen) port.close();
      else port.destroy();
    }
  } catch (_) {}
  app.quit();
});


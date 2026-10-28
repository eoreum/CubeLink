'use strict';

const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const { ArmSerialController, ConveyorSerialController, friendlyError } = require('./serialControllers');
const { diagnoseCh340, installCh340 } = require('./driverSupport');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu-sandbox');

const factoryModulePath = app.isPackaged
  ? path.join(process.resourcesPath, 'shared', 'factoryNetwork.js')
  : path.join(__dirname, '..', '..', 'desktop-v4', 'electron', 'factoryNetwork.js');
const { FactoryNetwork } = require(factoryModulePath);

let win = null;
let currentModule = 'home';
let loadedModule = '';
let reconnectTimer = null;

function send(channel, payload) {
  if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) win.webContents.send(channel, payload);
}

const armSerial = new ArmSerialController(send);
const conveyorSerial = new ConveyorSerialController(send);
const factoryNetwork = new FactoryNetwork({
  sendStatus: status => send(`${currentModule}-factory-status`, status),
  sendEvent: event => send(`${currentModule}-factory-event`, event)
});

function rendererRoot(moduleName) {
  if (app.isPackaged) {
    const folder = { home: 'launcher', arm: 'arm-web', conveyor: 'conveyor-web' }[moduleName];
    return path.join(process.resourcesPath, folder);
  }
  if (moduleName === 'home') return path.join(__dirname, '..', 'launcher');
  if (moduleName === 'arm') return path.join(__dirname, '..', '..', 'desktop-v4', 'web');
  return path.join(__dirname, '..', '..', 'conveyor-desktop-v0.12', 'web');
}

function bundledDriverInf() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'drivers', 'CH341SER', 'CH341SER.INF')
    : path.join(__dirname, '..', '..', 'electron', 'drivers', 'CH341SER', 'CH341SER', 'CH341SER.INF');
}

function inspectCh340() {
  return diagnoseCh340({ listPorts: () => armSerial.listPorts() });
}

async function openModule(moduleName) {
  if (!['home', 'arm', 'conveyor'].includes(moduleName)) return { ok: false, message: '알 수 없는 화면입니다.' };
  if (currentModule !== 'home' && moduleName !== currentModule && (armSerial.isOpen() || conveyorSerial.isOpen())) {
    return { ok: false, message: '안전을 위해 현재 장치의 연결 해제를 먼저 눌러주세요.' };
  }
  if (moduleName !== currentModule) {
    await factoryNetwork.stop(false);
    if (!conveyorSerial.isOpen()) await conveyorSerial.shutdown();
  }
  currentModule = moduleName;
  await win.loadFile(path.join(rendererRoot(moduleName), 'index.html'));
  loadedModule = moduleName;
  win.setTitle({ home: 'CubeLink Studio 4.1.8 통합 대문', arm: 'CubeLink Studio 4.1.8 · 로봇팔', conveyor: 'CubeLink Studio 4.1.8 · 컨베이어' }[moduleName]);
  return { ok: true, module: moduleName };
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    // 1366x768 laptops expose only about 1093x614 DIP at 125% scaling and
    // about 911x512 DIP at 150%. Keep the minimum below both work areas.
    minWidth: 800,
    minHeight: 480,
    show: false,
    backgroundColor: '#08090b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.removeMenu();
  win.maximize();
  if (!process.argv.includes('--smoke-test')) win.once('ready-to-show', () => { win.show(); win.focus(); });
  try { await session.defaultSession.clearCache(); } catch (_) {}
  await openModule('home');
}

async function inspectRenderer(moduleName, selectors, apiName) {
  await openModule(moduleName);
  return win.webContents.executeJavaScript(`({
    title: document.title,
    api: typeof window[${JSON.stringify(apiName)}] === 'object',
    selectors: ${JSON.stringify(selectors)}.map(selector => ({ selector, found: Boolean(document.querySelector(selector)) }))
  })`);
}

async function clickHomeLogo(moduleName, selector) {
  await openModule(moduleName);
  const clicked = await win.webContents.executeJavaScript(`(() => { const target = document.querySelector(${JSON.stringify(selector)}); if (!target) return false; target.click(); return true; })()`);
  for (let attempt = 0; attempt < 40 && loadedModule !== 'home'; attempt++) await new Promise(resolve => setTimeout(resolve, 50));
  return { clicked, returnedHome: loadedModule === 'home' };
}

async function inspectConveyorToolbox() {
  await openModule('conveyor');
  return win.webContents.executeJavaScript(`(() => {
    const toolbox = document.querySelector('.blocklyToolboxDiv');
    const label = document.querySelector('.blocklyTreeLabel');
    const workspace = Blockly.getMainWorkspace();
    const roots = workspace ? workspace.getTopBlocks(true) : [];
    const legacyDom = Blockly.utils.xml.textToDom('<xml><block type="conv_when_start"><next><block type="conv_stop"/></next></block></xml>');
    const convertedDom = normalizeProgramRoot(legacyDom);
    const convertedRoot = convertedDom.getElementsByTagName('block')[0];
    const convertedStatement = convertedRoot && Array.from(convertedRoot.childNodes).find(node => node.nodeType === 1 && node.nodeName.toLowerCase() === 'statement');
    const hintButton = document.getElementById('hintBtn');
    const hint = document.getElementById('missionHint');
    if (hintButton && hint && hint.classList.contains('hidden')) hintButton.click();
    return {
      width: toolbox ? Math.round(toolbox.getBoundingClientRect().width) : 0,
      background: toolbox ? getComputedStyle(toolbox).backgroundColor : '',
      labelColor: label ? getComputedStyle(label).color : '',
      labels: Array.from(document.querySelectorAll('.blocklyTreeLabel')).map(item => item.textContent.trim()),
      rootTypes: roots.map(block => block.type),
      setupConnected: roots.some(block => block.type === 'conv_setup_loop' && Boolean(block.getInputTargetBlock('SETUP'))),
      hasLoopInput: roots.some(block => block.type === 'conv_setup_loop' && Boolean(block.getInput('LOOP'))),
      setupLoopDefined: Boolean(Blockly.Blocks.conv_setup_loop),
      convertedType: convertedRoot ? convertedRoot.getAttribute('type') : '',
      convertedInput: convertedStatement ? convertedStatement.getAttribute('name') : '',
      hintVisible: Boolean(hint && !hint.classList.contains('hidden')),
      hintExpanded: Boolean(hintButton && hintButton.getAttribute('aria-expanded') === 'true'),
      hintText: hint ? hint.textContent.trim() : '',
      hintBesideTitle: Boolean(hintButton && hintButton.parentElement && hintButton.parentElement.querySelector('#missionTitle'))
    };
  })()`);
}

async function inspectLaptopLayout(width, height) {
  win.unmaximize();
  win.setContentSize(width, height);
  const viewportScript = selectors => `(() => {
    const within = selector => {
      const element = document.querySelector(selector);
      if (!element) return { selector, found: false, within: false };
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        selector,
        found: true,
        within: style.display !== 'none' && style.visibility !== 'hidden'
          && rect.left >= -1 && rect.right <= innerWidth + 1
          && rect.top >= -1 && rect.bottom <= innerHeight + 1,
        rect: { left: Math.round(rect.left), top: Math.round(rect.top), right: Math.round(rect.right), bottom: Math.round(rect.bottom) }
      };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      horizontalFit: document.documentElement.scrollWidth <= innerWidth + 1,
      verticalReachable: document.documentElement.scrollHeight <= innerHeight + 1
        || !['hidden', 'clip'].includes(getComputedStyle(document.body).overflowY),
      elements: ${JSON.stringify(selectors)}.map(within)
    };
  })()`;

  await openModule('home');
  const home = await win.webContents.executeJavaScript(viewportScript(['#openArm', '#openConveyor']));
  await openModule('arm');
  const armIntro = await win.webContents.executeJavaScript(viewportScript(['#btn-intro-start', '#unifiedIntroHomeLogo']));
  await win.webContents.executeJavaScript(`document.querySelector('#btn-intro-start').click()`);
  await new Promise(resolve => setTimeout(resolve, 150));
  const arm = await win.webContents.executeJavaScript(viewportScript(['header', '.layout', '#btnConnectInit', '#btnRunRealtime']));
  await openModule('conveyor');
  const conveyor = await win.webContents.executeJavaScript(viewportScript(['header', '.connectionBar', '.modebar', '.layout', '#connectBtn', '#runBtn']));
  const checks = [home, armIntro, arm, conveyor];
  return {
    width,
    height,
    passed: checks.every(check => check.horizontalFit && check.verticalReachable && check.elements.every(item => item.found && item.within)),
    home,
    armIntro,
    arm,
    conveyor
  };
}

async function runSmokeTest() {
  const result = {
    driverDiagnosis: await inspectCh340(),
    home: await inspectRenderer('home', ['#openArm', '#openConveyor', '#driverPanel', '#driverRefresh', '#driverInstall'], 'studioShell'),
    arm: await inspectRenderer('arm', ['#btnConnectInit', '#btnRunRealtime', '#toolbox category[name="🏭 연동·안전"]', '#toolbox block[type="cubelink_factory_wait_arrival"]', '#brandLogo[data-unified-home-logo="true"]'], 'cubelink')
  };
  result.armLogoReturn = await clickHomeLogo('arm', '#unifiedIntroHomeLogo');
  result.conveyor = await inspectRenderer('conveyor', ['#connectBtn', '#runBtn', '#realtimeRunBtn', '#hintBtn', '#missionHint', '#brandLogo[data-unified-home-logo="true"]'], 'conveyorDesktop');
  result.conveyorToolbox = await inspectConveyorToolbox();
  result.conveyorLogoReturn = await clickHomeLogo('conveyor', '#brandLogo');
  result.returnHome = await inspectRenderer('home', ['#openArm', '#openConveyor'], 'studioShell');
  result.laptopLayouts = [];
  for (const [width, height] of [[1093, 614], [911, 512]]) {
    result.laptopLayouts.push(await inspectLaptopLayout(width, height));
  }
  const pages = [result.home, result.arm, result.conveyor, result.returnHome];
  const driverStates = ['ready', 'driver_required', 'not_connected', 'check_failed', 'unsupported'];
  const toolboxPassed = result.conveyorToolbox.width >= 150
    && result.conveyorToolbox.background === 'rgb(21, 25, 31)'
    && result.conveyorToolbox.labelColor === 'rgb(247, 242, 231)'
    && ['🔧 기본 구조', '🔁 흐름 제어', '↔ 컨베이어', '📡 센서', '🏭 연동·안전'].every(label => result.conveyorToolbox.labels.includes(label))
    && result.conveyorToolbox.setupLoopDefined
    && result.conveyorToolbox.convertedType === 'conv_setup_loop'
    && result.conveyorToolbox.convertedInput === 'SETUP'
    && result.conveyorToolbox.hintVisible
    && result.conveyorToolbox.hintExpanded
    && result.conveyorToolbox.hintText.length > 10
    && result.conveyorToolbox.hintBesideTitle;
  const passed = driverStates.includes(result.driverDiagnosis.state) && toolboxPassed && pages.every(item => item.api && item.selectors.every(check => check.found)) && result.armLogoReturn.clicked && result.armLogoReturn.returnedHome && result.conveyorLogoReturn.clicked && result.conveyorLogoReturn.returnedHome && result.laptopLayouts.every(item => item.passed);
  console.log(`UNIFIED_SMOKE_RESULT=${JSON.stringify({ passed, ...result })}`);
  app.exit(passed ? 0 : 1);
}

ipcMain.on('shell-current-module', event => { event.returnValue = currentModule; });
ipcMain.on('get-app-version', event => { event.returnValue = app.getVersion(); });
ipcMain.handle('shell-open-module', (_event, moduleName) => openModule(moduleName));
ipcMain.handle('shell-diagnose-ch340', () => inspectCh340());
ipcMain.handle('shell-install-ch340', async () => {
  if (armSerial.isOpen() || conveyorSerial.isOpen()) {
    return { ok: false, code: 'PORT_OPEN', message: '드라이버 설치 전에 연결된 장치의 연결 해제를 눌러주세요.' };
  }
  const result = await installCh340({ driverInfPath: bundledDriverInf() });
  if (!result.ok) return result;
  await new Promise(resolve => setTimeout(resolve, 1200));
  return { ...result, diagnosis: await inspectCh340() };
});

ipcMain.handle('arm-list-ports', () => armSerial.listPorts());
ipcMain.handle('arm-connect', (_event, portPath) => armSerial.connect(portPath));
ipcMain.handle('arm-write', (_event, data) => armSerial.write(data));
ipcMain.handle('arm-disconnect', async () => { await armSerial.close(); return { ok: true }; });
ipcMain.handle('arm-focus-window', () => {
  if (!win || win.isDestroyed()) return;
  if (win.isMinimized()) win.restore();
  win.show(); win.focus(); win.webContents.focus();
});

ipcMain.handle('conveyor-list-ports', async () => {
  try { return { ok: true, ports: await conveyorSerial.listPorts() }; }
  catch (error) { return { ok: false, ports: [], error: friendlyError(error) }; }
});
ipcMain.handle('conveyor-probe-port', (_event, portPath) => conveyorSerial.probe(portPath));
ipcMain.handle('conveyor-auto-discover', () => conveyorSerial.autoDiscover());
ipcMain.handle('conveyor-connect', (_event, portPath) => conveyorSerial.open(portPath));
ipcMain.handle('conveyor-disconnect', () => conveyorSerial.disconnect());
ipcMain.handle('conveyor-set-auto-reconnect', (_event, enabled) => conveyorSerial.setAutoReconnect(enabled));
ipcMain.handle('conveyor-write', (_event, data) => conveyorSerial.write(data));

ipcMain.handle('factory-start', (_event, config) => factoryNetwork.start(config));
ipcMain.handle('factory-stop', () => factoryNetwork.stop());
ipcMain.handle('factory-send-event', (_event, eventName) => {
  try { return factoryNetwork.sendFactoryEvent(eventName); }
  catch (error) { return { ok: false, error: error.message }; }
});

app.whenReady().then(async () => {
  await createWindow();
  if (process.argv.includes('--smoke-test')) return runSmokeTest();
  reconnectTimer = setInterval(() => {
    if (currentModule === 'conveyor') conveyorSerial.reconnectTick().catch(() => {});
  }, 2000);
});

app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => {
  if (reconnectTimer) clearInterval(reconnectTimer);
  factoryNetwork.stop(false);
  armSerial.close().catch(() => {});
  conveyorSerial.shutdown().catch(() => {});
});

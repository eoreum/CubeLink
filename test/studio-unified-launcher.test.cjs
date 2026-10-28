'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('unified package includes launcher, robot arm, and conveyor resources', () => {
  const pkg = JSON.parse(read('studio/unified-desktop-v4.1/electron/package.json'));
  assert.equal(pkg.version, '4.1.8');
  const resources = pkg.build.extraResources.map(item => item.to);
  assert.ok(resources.includes('launcher'));
  assert.ok(resources.includes('arm-web'));
  assert.ok(resources.includes('conveyor-web'));
  assert.ok(resources.includes('conveyor-firmware'));
  assert.ok(pkg.build.files.includes('driverSupport.js'));
});

test('launcher offers the two device choices and smart-factory context', () => {
  const html = read('studio/unified-desktop-v4.1/launcher/index.html');
  const app = read('studio/unified-desktop-v4.1/launcher/app.js');
  assert.match(html, /큐브링크 로봇팔/);
  assert.match(html, /큐브링크 컨베이어/);
  assert.match(html, /SMART FACTORY/);
  assert.match(app, /shell\.openArm\(\)/);
  assert.match(app, /shell\.openConveyor\(\)/);
  assert.match(html, /id="driverPanel"/);
  assert.match(html, /id="driverInstall"/);
  assert.match(app, /shell\.diagnoseCh340\(\)/);
  assert.match(app, /shell\.installCh340\(\)/);
});

test('shell starts at the home page and safely routes to both studios', () => {
  const main = read('studio/unified-desktop-v4.1/electron/main.js');
  assert.match(main, /let currentModule = 'home'/);
  assert.match(main, /openModule\('home'\)/);
  assert.match(main, /\{ home: 'launcher', arm: 'arm-web', conveyor: 'conveyor-web' \}/);
  assert.match(main, /안전을 위해 현재 장치의 연결 해제를 먼저 눌러주세요/);
  assert.match(main, /armSerial\.isOpen\(\) \|\| conveyorSerial\.isOpen\(\)/);
  assert.match(main, /CubeLink Studio 4\.1\.8 통합 대문/);
  assert.match(main, /UNIFIED_SMOKE_RESULT=/);
  assert.match(main, /inspectRenderer\('arm'/);
  assert.match(main, /inspectRenderer\('conveyor'/);
  assert.match(main, /result\.conveyorToolbox\.width >= 150/);
});

test('preload preserves both existing renderer APIs and exposes home navigation', () => {
  const main = read('studio/unified-desktop-v4.1/electron/main.js');
  const preload = read('studio/unified-desktop-v4.1/electron/preload.js');
  assert.match(preload, /exposeInMainWorld\('cubelink'/);
  assert.match(preload, /exposeInMainWorld\('conveyorDesktop'/);
  assert.match(preload, /exposeInMainWorld\('studioShell'/);
  assert.match(preload, /shell-open-module', 'home'/);
  assert.match(preload, /shell-diagnose-ch340/);
  assert.match(preload, /shell-install-ch340/);
  assert.match(read('studio/desktop-v4/web/index.html'), /id="unifiedIntroHomeLogo"/);
  assert.match(read('studio/desktop-v4/web/index.html'), /id="brandLogo"/);
  assert.match(read('studio/conveyor-desktop-v0.12/web/index.html'), /id="brandLogo"/);
  assert.match(main, /clickHomeLogo\('arm'/);
  assert.match(main, /clickHomeLogo\('conveyor'/);
});

test('runtime CH340 support detects healthy and driver-problem devices without blocking launch', async () => {
  const support = require(path.join(root, 'studio/unified-desktop-v4.1/electron/driverSupport.js'));
  assert.equal(support.isCh34xPort({ path: 'COM3', vendorId: '1A86', productId: '7523' }), true);

  const ready = await support.diagnoseCh340({
    platform: 'win32',
    listPorts: async () => [{ path: 'COM3', vendorId: '1A86', productId: '7523' }],
    run: async () => { throw new Error('PnP scan should be skipped'); }
  });
  assert.equal(ready.state, 'ready');
  assert.deepEqual(ready.ports, ['COM3']);

  const missing = await support.diagnoseCh340({
    platform: 'win32',
    listPorts: async () => [],
    run: async () => ({ stdout: 'Device ID: USB\\VID_1A86&PID_7523\\1234', stderr: '' })
  });
  assert.equal(missing.state, 'driver_required');

  const absent = await support.diagnoseCh340({
    platform: 'win32',
    listPorts: async () => [],
    run: async () => ({ stdout: 'No matching devices', stderr: '' })
  });
  assert.equal(absent.state, 'not_connected');

  let elevationRequest;
  const install = await support.installCh340({
    platform: 'win32',
    driverInfPath: path.join(root, 'studio/electron/drivers/CH341SER/CH341SER/CH341SER.INF'),
    run: async (executable, args) => { elevationRequest = { executable, args }; return { stdout: '', stderr: '' }; }
  });
  assert.equal(install.ok, true);
  assert.equal(elevationRequest.executable, 'powershell.exe');
  assert.ok(elevationRequest.args.includes('-EncodedCommand'));
});

test('serial IPC channels remain isolated between the robot arm and conveyor', () => {
  const main = read('studio/unified-desktop-v4.1/electron/main.js');
  const preload = read('studio/unified-desktop-v4.1/electron/preload.js');
  for (const channel of ['arm-list-ports', 'arm-connect', 'arm-write', 'conveyor-list-ports', 'conveyor-probe-port', 'conveyor-auto-discover', 'conveyor-connect', 'conveyor-write']) {
    assert.match(main, new RegExp(channel));
    assert.match(preload, new RegExp(channel));
  }
});

test('laptop DPI layouts use a display-safe minimum and responsive low-height rules', () => {
  const main = read('studio/unified-desktop-v4.1/electron/main.js');
  const launcherHtml = read('studio/unified-desktop-v4.1/launcher/index.html');
  const launcher = read('studio/unified-desktop-v4.1/launcher/responsive.css');
  const robotHtml = read('studio/desktop-v4/web/index.html');
  const robot = read('studio/desktop-v4/web/css/laptop.css');
  const conveyorHtml = read('studio/conveyor-desktop-v0.12/web/index.html');
  const conveyor = read('studio/conveyor-desktop-v0.12/web/laptop.css');
  assert.match(main, /minWidth:\s*800/);
  assert.match(main, /minHeight:\s*480/);
  assert.match(launcherHtml, /responsive\.css/);
  assert.match(launcher, /max-height:\s*700px/);
  assert.match(robotHtml, /css\/laptop\.css/);
  assert.match(robot, /max-width:\s*920px/);
  assert.match(robot, /height:\s*auto !important;[\s\S]*flex:\s*1 1 auto !important/);
  assert.match(conveyorHtml, /laptop\.css/);
  assert.match(conveyor, /body\s*\{\s*display:\s*flex/);
  assert.match(conveyor, /max-width:\s*930px/);
  assert.match(conveyor, /max-height:\s*560px/);
});

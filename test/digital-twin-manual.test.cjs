const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const index = read('studio', 'web', 'index.html');
const app = read('studio', 'web', 'js', 'app.js');
const twin = read('studio', 'web', 'js', 'digitalTwin.js');
const css = read('studio', 'web', 'css', 'style.css');
const firmware = read('firmware', 'arduino-nano', 'CubeLinkBridge', 'CubeLinkBridge.ino');

for (const required of [
  'digitalTwinTelemetry', 'servoTelemetryRow', 'joystickTelemetryRow',
  'js/firmwareCompatibility.js',
  'js/digitalTwin.js', "manualProtocol: ''", "head === 'MANUAL_ACTIVE'",
  'window.servoAngles[pin] = ang', 'compatibility.evaluateHandshake',
  'window.unlockTwinMode', "window.setActionMode('twin', { silent:true })"
]) {
  if (!index.includes(required)) throw new Error(`Studio 트윈 UI/파서 누락: ${required}`);
}

for (const required of [
  "runtimeMode === 'twin' && window.enterDigitalTwinLayout",
  'window.exitDigitalTwinLayout()',
  "window._cubeSafety.currentProtection === 'CUR4'",
  ': `S,${pin},${realAngle}`'
]) {
  if (!app.includes(required)) throw new Error(`실시간 실행 트윈 전환 누락: ${required}`);
}

const realtimeHandlerStart = app.indexOf("document.getElementById('btnRunRealtime')?.addEventListener");
const realtimeHandlerEnd = app.indexOf("document.getElementById('btnSimStart')?.addEventListener", realtimeHandlerStart);
const realtimeHandler = app.slice(realtimeHandlerStart, realtimeHandlerEnd);
if (realtimeHandler.includes('twinUnlocked = true') || realtimeHandler.includes("setActionMode('twin'")) {
  throw new Error('일반 실시간 실행 버튼이 디지털 트윈을 자동 해금합니다.');
}

for (const required of [
  "SHORTCUT_LABEL = 'Ctrl+Alt+J'", "event.code === 'KeyJ'",
  "window.sendBoardCommand('JM,1')", "window.sendBoardCommand('JM,0')",
  'FALLBACK_DEADZONE = 120', 'FALLBACK_FILTER_DIVISOR = 4',
  'FALLBACK_MAX_STEP = 2', 'startFallbackController()',
  "!window.twinUnlocked || window.actionMode !== 'twin'"
]) {
  if (!twin.includes(required)) throw new Error(`수동조작 컨트롤러 누락: ${required}`);
}

for (const required of [
  'body.digital-twin-running .layout',
  'body.digital-twin-running #robot-3d-view',
  'body.digital-twin-running #serialMonitorBar'
]) {
  if (!css.includes(required)) throw new Error(`디지털 트윈 레이아웃 CSS 누락: ${required}`);
}

// Firmware work is developed and released independently from Desktop Studio.
// When the optional JM-capable candidate is present, keep its regression checks;
// a clean Desktop-only release checkout intentionally keeps the existing firmware.
if (firmware.includes('strcmp(line, "JM,1")')) {
  for (const required of [
    'strcmp(line, "JM,1")', 'strcmp(line, "JM,0")',
    'activateStudioManualMode()', 'filteredDx1 +=',
    'Serial.println(F(",JM1"))', 'sendJoysticksIfDue();'
  ]) {
    if (!firmware.includes(required)) throw new Error(`펌웨어 수동모드 누락: ${required}`);
  }
}

console.log('실시간 디지털 트윈 레이아웃, 단축키, 수동모드 및 호환 경로 검증 통과');

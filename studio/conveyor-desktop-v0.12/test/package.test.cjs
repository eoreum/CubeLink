'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('keeps nine missions and three folding groups', () => {
  const app = read('web/app.js');
  assert.match(app, /9\. 스마트팩토리 자동화/);
  assert.match(app, /1~3단계/);
  assert.match(app, /4~6단계/);
  assert.match(app, /7~9단계/);
  assert.match(app, /cubelinkConvMission_v09_/);
  assert.match(app, /cubelinkConvMissionSuccess_v10_/);
});

test('contains required connection and troubleshooting paths', () => {
  const main = read('electron/main.js');
  const html = read('web/index.html');
  assert.match(main, /HELLO\\nSTATUS\\nHELLO\?\\n/);
  assert.match(main, /reconnectTick/);
  assert.match(main, /PORT_BUSY/);
  assert.match(html, /자동 재연결/);
  assert.match(html, /연결 해제/);
});

test('shows a wide high-contrast Blockly category menu', () => {
  const html = read('web/index.html');
  const theme = read('web/blockly-theme.css');
  assert.match(html, /blockly-theme\.css/);
  for (const label of ['🔧 기본 구조', '🔁 흐름 제어', '↔ 컨베이어', '📡 센서', '🏭 연동·안전']) assert.match(html, new RegExp(label));
  assert.ok(html.indexOf('🔧 기본 구조') < html.indexOf('🔁 흐름 제어'));
  assert.ok(html.indexOf('🔁 흐름 제어') < html.indexOf('↔ 컨베이어'));
  assert.match(theme, /\.blocklyToolboxDiv/);
  assert.match(theme, /width:168px!important/);
  assert.match(theme, /background:#15191f!important/);
  assert.match(theme, /\.blocklyTreeLabel/);
  assert.match(theme, /color:#f7f2e7!important/);
  assert.match(theme, /\.blocklyTreeSelected \.blocklyTreeLabel/);
});

test('shares the robot-arm setup-loop, wait, and flow concepts while upgrading saved work', () => {
  const app = read('web/app.js');
  const html = read('web/index.html');
  assert.match(app, /type:'conv_setup_loop',message0:'처음 한 번 setup\(\) %1 %2 계속 반복 loop\(\) %3 %4'/);
  assert.match(app, /type:'conv_wait',message0:'%1 초 기다리기'/);
  assert.match(html, /<category name="🔧 기본 구조"[\s\S]*conv_setup_loop[\s\S]*conv_wait[\s\S]*<category name="🔁 흐름 제어"/);
  assert.match(html, /<category name="🔁 흐름 제어"[\s\S]*conv_repeat[\s\S]*conv_forever[\s\S]*conv_if_distance/);
  assert.match(app, /function normalizeProgramRoot/);
  assert.match(app, /Blockly\.Xml\.textToDom[\s\S]*Blockly\.utils\.xml\.textToDom/);
  assert.match(app, /legacy\.setAttribute\('type', 'conv_setup_loop'\)/);
  assert.match(app, /root\.getInputTargetBlock\('SETUP'\)/);
  assert.match(app, /root\.getInputTargetBlock\('LOOP'\)/);
  assert.match(app, /root\.type === 'conv_when_start'/);
});

test('provides a collapsible mission-specific hint beside every mission title', () => {
  const html = read('web/index.html');
  const app = read('web/app.js');
  const style = read('web/mission-hint.css');
  const hints = app.slice(app.indexOf('const missionHints = ['), app.indexOf('];', app.indexOf('const missionHints = [')));
  assert.match(html, /id="missionTitle"[\s\S]*id="hintBtn"/);
  assert.match(html, /id="missionHint" class="missionHint hidden"/);
  assert.match(app, /const missionHints = \[/);
  assert.equal((hints.match(/^  '/gm) || []).length, 9);
  assert.match(app, /\$\('hintBtn'\)\.onclick/);
  assert.match(app, /aria-expanded/);
  assert.match(style, /\.missionTitleRow/);
  assert.match(style, /\.missionHint\.hidden\{display:none\}/);
});

test('firmware uses the required pin map and handshake', () => {
  const firmware = read('firmware/CubeLink_Conveyor_Firmware_v1_2/CubeLink_Conveyor_Firmware_v1_2.ino');
  for (const expected of ['PIN_PWMA = 3','PIN_AIN1 = 7','PIN_AIN2 = 8','PIN_STBY = 12','PIN_TRIG = 4','PIN_ECHO = 5']) assert.match(firmware, new RegExp(expected));
  assert.match(firmware, /DEVICE=CUBELINK_CONVEYOR/);
  assert.match(firmware, /FW=1\.2\.0/);
  assert.match(firmware, /STATUS/);
  assert.match(firmware, /CONVEYOR,START/);
  assert.match(firmware, /CONVEYOR,STOP/);
});

test('firmware runs safe standalone ultrasonic mode until Studio takes control', () => {
  const firmware = read('firmware/CubeLink_Conveyor_Firmware_v1_2/CubeLink_Conveyor_Firmware_v1_2.ino');
  assert.match(firmware, /STANDALONE_TRIGGER_CM = 5\.0/);
  assert.match(firmware, /STANDALONE_REARM_CM = 8\.0/);
  assert.match(firmware, /STANDALONE_SPEED_PERCENT = 60/);
  assert.match(firmware, /STANDALONE_RUN_MS = 3000UL/);
  assert.match(firmware, /STANDALONE_STARTUP_GRACE_MS = 2000UL/);
  assert.match(firmware, /distanceCm > 0\.0 && distanceCm < STANDALONE_TRIGGER_CM/);
  assert.match(firmware, /millis\(\) - standaloneStartedAt >= STANDALONE_RUN_MS/);
  assert.match(firmware, /if \(distanceCm >= STANDALONE_REARM_CM\) standaloneArmed = true/);
  assert.match(firmware, /void enterStudioControl\(\)[\s\S]*studioControlled = true[\s\S]*standaloneRunning = false[\s\S]*stopMotorWithoutChangingRequestedSpeed/);
  assert.match(firmware, /if \(studioControlled \|\| millis\(\) < STANDALONE_STARTUP_GRACE_MS\) return/);
  assert.doesNotMatch(firmware, /delay\(3000\)/);
});

test('adds ultrasonic condition and forever-loop blocks with executable runtime paths', () => {
  const app = read('web/app.js');
  const html = read('web/index.html');
  assert.match(app, /type:'conv_if_distance'/);
  assert.match(app, /options:\[\['이하','LE'\],\['이상','GE'\]\]/);
  assert.match(app, /type:'conv_forever'/);
  assert.match(app, /type === 'conv_if_distance'/);
  assert.match(app, /type === 'conv_forever'/);
  assert.match(app, /while \(token === runToken\)/);
  assert.match(html, /<block type="conv_if_distance"><\/block>/);
  assert.match(html, /<block type="conv_forever"><\/block>/);
  assert.match(app, /conv_wait_near[\s\S]*conv_if_distance[\s\S]*conv_stop/);
});

test('mission selection saves the old workspace without repainting the old active item', () => {
  const app = read('web/app.js');
  const style = read('web/style.css');
  assert.match(app, /clearTimeout\(autosaveTimer\)/);
  assert.match(app, /saveMission\(current, true, false\)/);
  assert.match(app, /button\.dataset\.missionIndex = String\(index\)/);
  assert.match(app, /button\.setAttribute\('aria-current', 'step'\)/);
  assert.match(style, /\.missionBtn\[aria-current="step"\]/);
});

test('separates block simulation from physical manual control', () => {
  const app = read('web/app.js');
  const html = read('web/index.html');
  const runtime = app.slice(app.indexOf('async function execChain'), app.indexOf('const hasType'));
  assert.match(app, /function setSimulatedMotor/);
  assert.match(app, /async function setPhysicalMotor/);
  assert.match(runtime, /mode === 'realtime' \? setPhysicalMotor/);
  assert.match(runtime, /runtimeDistance\(mode\)/);
  assert.match(app, /블록 시뮬레이션 시작 · 실물 명령 전송 없음/);
  assert.match(app, /블록 실시간 실행 시작 · 실물 명령 전송/);
  assert.match(app, /\$\('runBtn'\)\.onclick=\(\)=>runProgram\('simulation'\)/);
  assert.match(app, /\$\('realtimeRunBtn'\)\.onclick=\(\)=>runProgram\('realtime'\)/);
  assert.match(app, /function stopProgram\(\)[\s\S]*실물 제어 상태는 변경하지 않습니다/);
  assert.match(html, /실물 실시간/);
  assert.match(html, /시뮬레이션 실행/);
  assert.match(html, /실시간 실행/);
  assert.match(html, /모의 초음파/);
  assert.match(html, /실물 초음파/);
});

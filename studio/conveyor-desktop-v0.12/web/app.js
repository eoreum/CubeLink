'use strict';

const desktop = window.conveyorDesktop;
const $ = id => document.getElementById(id);
const GOLD = '#D4AF37', FLOW = '#5C81A6', DEVICE = '#3498DB', SENSOR = '#F39C12', FACTORY = '#27AE60';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

let connected = false;
let verified = false;
let selectedPort = '';
let current = 0;
let runToken = 0;
let distance = 30;
let hardwareDistance = null;
let simulationRunning = false;
let executionMode = 'idle';
let speed = 60;
let direction = 'STOP';
let product = false;
let boxX = 55;
let motionTimer = null;
let isWorkspaceLoading = false;
let autosaveTimer = null;
let openGroups = JSON.parse(localStorage.getItem('cubelinkConvOpenGroups') || '[true,false,false]');

if (desktop && desktop.getVersion) $('appVersion').textContent = desktop.getVersion();

function log(message) {
  const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
  $('log').textContent += `[${time}] ${message}\n`;
  $('log').scrollTop = $('log').scrollHeight;
}

function showHelp(message) {
  $('helpText').textContent = message;
  $('helpBox').classList.toggle('hidden', !message);
}

function setConnectionUi(state, title, detail) {
  $('statusDot').className = `dot ${state}`;
  $('connectionTitle').textContent = title;
  $('connectionDetail').textContent = detail;
  $('connectBtn').disabled = connected;
  $('disconnectBtn').disabled = !connected;
  $('portSelect').disabled = connected;
  $('autoBtn').disabled = connected;
  $('forwardBtn').disabled = !connected;
  $('reverseBtn').disabled = !connected;
  $('manualStopBtn').disabled = !connected;
  $('speedSlider').disabled = !connected;
  $('realtimeRunBtn').disabled = !connected;
  $('modeLabel').textContent = connected
    ? `실물 제어 연결됨 · ${selectedPort}${verified ? ' · CubeLink Conveyor 확인됨' : ' · 수동 연결'} · 블록은 시뮬레이션 전용`
    : '블록 시뮬레이션 모드 · 실물 제어 미연결';
  $('deviceState').textContent = connected ? (verified ? '펌웨어 확인' : '수동 연결') : '미연결';
}

function portLabel(port) {
  const bits = [port.path];
  if (port.preferred) bits.push('Arduino/CH340 후보');
  if (port.manufacturer) bits.push(port.manufacturer);
  if (port.vendorId || port.productId) bits.push(`${port.vendorId || '----'}:${port.productId || '----'}`);
  return bits.join(' · ');
}

async function refreshPorts(quiet = false) {
  if (!desktop) return;
  const previous = $('portSelect').value;
  const result = await desktop.listPorts();
  $('portSelect').innerHTML = '<option value="">COM 포트 선택</option>';
  for (const port of result.ports || []) {
    const option = document.createElement('option');
    option.value = port.path;
    option.textContent = portLabel(port);
    $('portSelect').appendChild(option);
  }
  if ([...$('portSelect').options].some(option => option.value === previous)) $('portSelect').value = previous;
  if (!quiet) {
    const count = (result.ports || []).length;
    log(count ? `COM 포트 ${count}개 검색됨` : '사용 가능한 COM 포트 없음');
    if (!count) showHelp('보드 전원 표시를 확인하고 데이터 통신이 가능한 USB 케이블로 다시 연결하세요. CH340 장치가 장치 관리자에 보이지 않으면 드라이버가 필요할 수 있습니다.');
    else showHelp('');
  }
}

async function connectPath(path, isVerified, version = null) {
  setConnectionUi('wait', 'COM 포트 연결 중', `${path}를 여는 중입니다.`);
  const result = await desktop.connect(path);
  if (!result.ok) {
    connected = false;
    const message = result.error && result.error.message || '연결에 실패했습니다.';
    setConnectionUi('error', '연결 실패', message);
    showHelp(`${message} Arduino IDE·시리얼 모니터를 닫고, USB 케이블과 CH340 드라이버 및 Windows 장치 관리자 인식을 확인하세요.`);
    log(`연결 실패: ${message}`);
    return false;
  }
  connected = true;
  verified = Boolean(isVerified);
  selectedPort = path;
  await desktop.setAutoReconnect($('reconnectToggle').checked);
  setConnectionUi('on', verified ? 'CubeLink Conveyor 연결됨' : '수동 포트 연결됨', `${path}${version ? ` · 펌웨어 ${version}` : ''}`);
  showHelp(verified ? '' : '식별 문자열이 없는 구형 펌웨어로 수동 연결했습니다. 제어 명령 호환 여부를 낮은 속도에서 확인하세요.');
  log(`${path} 연결 완료${verified ? ' · 펌웨어 식별 성공' : ' · 수동 호환 모드'}`);
  await sleep(950);
  await desktop.write('HELLO\nSTATUS\n');
  return true;
}

async function autoDiscover() {
  setConnectionUi('wait', 'CubeLink Conveyor 검색 중', '각 COM 포트에 HELLO/STATUS를 보내 펌웨어를 확인합니다.');
  showHelp('검색 중에는 Arduino Nano가 한 번 재시작될 수 있습니다.');
  log('자동 장치 검색 시작');
  const result = await desktop.autoDiscover();
  await refreshPorts(true);
  if (result.ok && result.match) {
    $('portSelect').value = result.match.path;
    log(`${result.match.path}에서 ${result.match.identified ? 'CubeLink Conveyor 식별 응답' : '호환 텔레메트리'} 확인`);
    await connectPath(result.match.path, result.match.identified, result.match.version);
    return;
  }
  connected = false;
  verified = false;
  setConnectionUi('error', '자동 식별 장치 없음', '포트가 있다면 목록에서 직접 선택해 수동 연결할 수 있습니다.');
  const busy = (result.results || []).find(item => !item.ok && item.error && item.error.code === 'PORT_BUSY');
  showHelp(busy
    ? `${busy.path} 포트가 사용 중입니다. Arduino IDE 또는 다른 시리얼 프로그램을 닫고 재검색하세요.`
    : '응답이 없으면 펌웨어 업로드 상태·데이터 USB 케이블·CH340 드라이버를 확인하세요. 식별 문자열이 없는 구형 펌웨어는 포트를 직접 선택해 연결할 수 있습니다.');
  log('자동 식별 실패 · 수동 포트 선택 가능');
}

async function manualConnect() {
  const path = $('portSelect').value;
  if (!path) return showHelp('먼저 COM 포트를 선택하세요.');
  setConnectionUi('wait', '펌웨어 확인 중', `${path}에 HELLO/STATUS를 보내고 있습니다.`);
  const probe = await desktop.probePort(path);
  if (!probe.ok) {
    const message = probe.error && probe.error.message || '포트를 확인할 수 없습니다.';
    setConnectionUi('error', '포트 확인 실패', message);
    showHelp(`${message} 포트 점유, USB 케이블, 드라이버 상태를 확인하세요.`);
    return;
  }
  if (probe.identified || probe.compatible) return connectPath(path, probe.identified, probe.version);
  const proceed = confirm('CubeLink Conveyor 식별 문자열을 받지 못했습니다.\n\n구형 펌웨어라면 수동 연결을 계속할 수 있습니다. 이 포트로 연결할까요?');
  if (proceed) await connectPath(path, false, null);
  else setConnectionUi('off', '연결 취소됨', '다른 포트를 선택하거나 펌웨어를 확인하세요.');
}

async function disconnect() {
  runToken++;
  simulationRunning = false;
  executionMode = 'idle';
  updateTwinMotor('STOP', speed);
  if (desktop) await desktop.disconnect();
  connected = false;
  verified = false;
  selectedPort = '';
  setConnectionUi('off', '컨베이어 연결 안 됨', 'COM 포트를 검색하거나 시뮬레이션으로 학습할 수 있습니다.');
  showHelp('');
  log('연결 해제');
}

function parseDistance(line) {
  let match = line.match(/^U\s*[,=:]\s*(-?\d+(?:\.\d+)?)/i)
    || line.match(/^(?:DIST|DISTANCE)\s*[,=:]\s*(-?\d+(?:\.\d+)?)/i)
    || line.match(/\bDIST\s*=\s*(-?\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

if (desktop) {
  desktop.onData(line => {
    const clean = String(line || '').trim();
    if (!clean) return;
    log(`RX ${clean}`);
    if (/CUBELINK[ _-]*CONVEYOR|DEVICE\s*[=:,]\s*CUBELINK[ _-]*CONVEYOR/i.test(clean)) {
      verified = true;
      if (connected) setConnectionUi('on', 'CubeLink Conveyor 연결됨', `${selectedPort} · 펌웨어 응답 확인`);
    }
    const value = parseDistance(clean);
    if (value !== null && Number.isFinite(value)) setDistance(value, true);
    const motor = clean.match(/(?:DIR|MOTOR)\s*=\s*(F|R|STOP)/i);
    const pwm = clean.match(/SPEED\s*=\s*(\d+)/i);
    if (motor && !simulationRunning) updateTwinMotor(motor[1].toUpperCase(), pwm ? Number(pwm[1]) : speed);
  });
  desktop.onStatus(status => {
    if (!status || !status.state) return;
    if (status.state === 'closed') {
      connected = false;
      setConnectionUi('wait', status.reconnecting ? 'USB 연결 끊김 · 재연결 대기' : '연결 종료', status.path || '');
      log('COM 포트 연결 끊김');
    } else if (status.state === 'reconnecting') {
      setConnectionUi('wait', '자동 재연결 중', `${status.path}를 다시 여는 중입니다.`);
    } else if (status.state === 'reconnected') {
      connected = true;
      selectedPort = status.path;
      setConnectionUi('on', verified ? 'CubeLink Conveyor 재연결됨' : '포트 재연결됨', status.path);
      log(`${status.path} 자동 재연결 성공`);
    } else if (status.state === 'error') {
      showHelp(status.error && status.error.message || 'COM 포트 오류가 발생했습니다.');
    }
  });
}

Blockly.defineBlocksWithJsonArray([
  {type:'conv_setup_loop',message0:'처음 한 번 setup() %1 %2 계속 반복 loop() %3 %4',args0:[{type:'input_dummy'},{type:'input_statement',name:'SETUP'},{type:'input_dummy'},{type:'input_statement',name:'LOOP'}],colour:GOLD},
  // Legacy saved work is upgraded on load; retain this hidden definition for compatibility.
  {type:'conv_when_start',message0:'▶ 실행 버튼을 눌렀을 때',nextStatement:null,colour:GOLD,hat:'cap'},
  {type:'conv_motor',message0:'컨베이어 %1 속도 %2 %%',args0:[{type:'field_dropdown',name:'DIR',options:[['정방향','F'],['역방향','R']]},{type:'field_number',name:'SPEED',value:60,min:0,max:100}],previousStatement:null,nextStatement:null,colour:DEVICE},
  {type:'conv_stop',message0:'컨베이어 정지',previousStatement:null,nextStatement:null,colour:DEVICE},
  {type:'conv_speed',message0:'컨베이어 속도 %1 %% 로 설정',args0:[{type:'field_number',name:'SPEED',value:60,min:0,max:100}],previousStatement:null,nextStatement:null,colour:DEVICE},
  {type:'conv_ultra',message0:'초음파 거리 cm',output:'Number',colour:SENSOR},
  {type:'conv_wait_near',message0:'물체가 %1 cm 이내 올 때까지 기다리기',args0:[{type:'field_number',name:'CM',value:10,min:1,max:100}],previousStatement:null,nextStatement:null,colour:SENSOR},
  {type:'conv_wait_far',message0:'물체가 %1 cm 이상 멀어질 때까지 기다리기',args0:[{type:'field_number',name:'CM',value:15,min:1,max:100}],previousStatement:null,nextStatement:null,colour:SENSOR},
  {type:'conv_if_distance',message0:'만약 초음파 거리가 %1 %2 cm 이면 %3 %4',args0:[{type:'field_dropdown',name:'OP',options:[['이하','LE'],['이상','GE']]},{type:'field_number',name:'CM',value:10,min:1,max:400},{type:'input_dummy'},{type:'input_statement',name:'DO'}],previousStatement:null,nextStatement:null,colour:FLOW},
  {type:'conv_count',message0:'제품 %1 개 감지할 때까지 세기',args0:[{type:'field_number',name:'COUNT',value:5,min:1,max:99}],previousStatement:null,nextStatement:null,colour:SENSOR},
  {type:'conv_jam',message0:'물체가 %1 cm 이내에서 %2 초 머무르면 경고 정지',args0:[{type:'field_number',name:'CM',value:10,min:1,max:100},{type:'field_number',name:'SEC',value:5,min:1,max:30}],previousStatement:null,nextStatement:null,colour:SENSOR},
  {type:'conv_wait',message0:'%1 초 기다리기',args0:[{type:'field_number',name:'SEC',value:1,min:0,max:60,precision:0.1}],previousStatement:null,nextStatement:null,colour:GOLD},
  {type:'conv_repeat',message0:'%1 번 반복하기 %2 %3',args0:[{type:'field_number',name:'TIMES',value:5,min:1,max:50},{type:'input_dummy'},{type:'input_statement',name:'DO'}],previousStatement:null,nextStatement:null,colour:FLOW},
  {type:'conv_forever',message0:'계속 반복하기 %1 %2',args0:[{type:'input_dummy'},{type:'input_statement',name:'DO'}],previousStatement:null,nextStatement:null,colour:FLOW},
  {type:'conv_safe',message0:'안전 확인 후 재시작',previousStatement:null,nextStatement:null,colour:FACTORY},
  {type:'conv_handoff',message0:'로봇팔 작업 완료 신호 기다리기',previousStatement:null,nextStatement:null,colour:FACTORY}
]);

const workspace = Blockly.inject('blocklyDiv', { toolbox:$('toolbox'), trashcan:true, scrollbars:true, zoom:{controls:true,wheel:true,startScale:.9,maxScale:1.4,minScale:.5,scaleSpeed:1.1}, grid:{spacing:20,length:3,colour:'#ddd',snap:true} });
workspace.addChangeListener(event => { if (!isWorkspaceLoading && !(event && event.isUiEvent)) queueMissionSave(); });

const missionXML = [
  `<xml><block type="conv_when_start" x="40" y="40"><next><block type="conv_motor"><field name="DIR">F</field><field name="SPEED">60</field><next><block type="conv_wait"><field name="SEC">3</field><next><block type="conv_stop"/></next></block></next></block></next></block></xml>`,
  `<xml><block type="conv_when_start" x="40" y="40"><next><block type="conv_motor"><field name="DIR">F</field><field name="SPEED">60</field><next><block type="conv_wait"><field name="SEC">3</field><next><block type="conv_stop"><next><block type="conv_wait"><field name="SEC">1</field><next><block type="conv_motor"><field name="DIR">R</field><field name="SPEED">60</field><next><block type="conv_wait"><field name="SEC">3</field><next><block type="conv_stop"/></next></block></next></block></next></block></next></block></next></block></next></block></next></block></xml>`,
  `<xml><block type="conv_when_start" x="40" y="40"><next><block type="conv_motor"><field name="DIR">F</field><field name="SPEED">60</field><next><block type="conv_wait_near"><field name="CM">10</field><next><block type="conv_if_distance"><field name="OP">LE</field><field name="CM">10</field><statement name="DO"><block type="conv_stop"/></statement></block></next></block></next></block></next></block></xml>`,
  `<xml><block type="conv_when_start" x="40" y="40"><next><block type="conv_motor"><field name="DIR">F</field><field name="SPEED">60</field><next><block type="conv_wait_near"><field name="CM">10</field><next><block type="conv_stop"><next><block type="conv_wait_far"><field name="CM">15</field><next><block type="conv_motor"><field name="DIR">F</field><field name="SPEED">60</field></block></next></block></next></block></next></block></next></block></next></block></xml>`,
  `<xml><block type="conv_when_start" x="40" y="40"><next><block type="conv_repeat"><field name="TIMES">5</field><statement name="DO"><block type="conv_motor"><field name="DIR">F</field><field name="SPEED">60</field><next><block type="conv_wait"><field name="SEC">2</field><next><block type="conv_stop"><next><block type="conv_wait"><field name="SEC">1</field></block></next></block></next></block></next></block></statement></block></next></block></xml>`,
  `<xml><block type="conv_when_start" x="40" y="40"><next><block type="conv_motor"><field name="DIR">F</field><field name="SPEED">60</field><next><block type="conv_count"><field name="COUNT">5</field><next><block type="conv_stop"/></next></block></next></block></next></block></xml>`,
  `<xml><block type="conv_when_start" x="40" y="40"><next><block type="conv_motor"><field name="DIR">F</field><field name="SPEED">60</field><next><block type="conv_jam"><field name="CM">10</field><field name="SEC">5</field></block></next></block></next></block></xml>`,
  `<xml><block type="conv_when_start" x="40" y="40"><next><block type="conv_motor"><field name="DIR">F</field><field name="SPEED">60</field><next><block type="conv_wait_near"><field name="CM">10</field><next><block type="conv_stop"><next><block type="conv_wait_far"><field name="CM">15</field><next><block type="conv_safe"/></next></block></next></block></next></block></next></block></next></block></xml>`,
  `<xml><block type="conv_when_start" x="40" y="40"><next><block type="conv_motor"><field name="DIR">F</field><field name="SPEED">60</field><next><block type="conv_wait_near"><field name="CM">10</field><next><block type="conv_stop"><next><block type="conv_handoff"><next><block type="conv_motor"><field name="DIR">F</field><field name="SPEED">60</field></block></next></block></next></block></next></block></next></block></next></block></xml>`
];
const missions = [
  ['1. 컨베이어 출발','정방향으로 3초간 운반한 뒤 정지합니다.'],['2. 방향을 바꿔라','정방향과 역방향을 순서대로 제어합니다.'],['3. 물체를 감지하라','초음파 센서가 10cm 이내 물체를 감지하면 정지합니다.'],['4. 자동 출발 시스템','물체 감지 시 정지하고 이탈하면 다시 출발합니다.'],['5. 일정 간격 운반','2초 이동, 1초 정지를 5회 반복합니다.'],['6. 제품 수량 세기','물체의 접근과 이탈을 구분하여 5개를 셉니다.'],['7. 이상 체류 감지','센서 앞에 오래 머무르면 경고 후 정지합니다.'],['8. 안전 관리자','감지 후 정지하고 안전 확인 뒤 재시작합니다.'],['9. 스마트팩토리 자동화','로봇팔 작업 완료 신호를 받은 뒤 컨베이어를 재가동합니다.']
];
const missionHints = [
  'setup 안에 정방향 60% → 3초 기다리기 → 컨베이어 정지 순서로 연결하세요.',
  'setup 안에 정방향 → 3초 기다리기 → 정지 → 1초 기다리기 → 역방향 → 3초 기다리기 → 정지를 연결하세요.',
  '흐름 제어의 “만약 초음파 거리가 10cm 이하이면” 블록 안에 컨베이어 정지를 넣으세요.',
  '정방향 → 물체 접근 기다리기 → 정지 → 물체 이탈 기다리기 → 정방향 순서로 연결하세요.',
  '“5번 반복하기” 안에 정방향 → 2초 기다리기 → 정지 → 1초 기다리기를 넣으세요.',
  '정방향으로 출발한 뒤 “제품 5개 감지할 때까지 세기”와 정지 블록을 연결하세요.',
  '정방향으로 출발한 뒤 센서 메뉴의 “10cm 이내에서 5초 머무르면 경고 정지” 블록을 연결하세요.',
  '정방향 → 물체 접근 기다리기 → 정지 → 물체 이탈 기다리기 → 안전 확인 후 재시작을 연결하세요.',
  '정방향 → 물체 접근 기다리기 → 정지 → 로봇팔 작업 완료 신호 기다리기 → 정방향 순서로 연결하세요.'
];
const missionSaveKey = index => `cubelinkConvMission_v09_${index}`;
const missionSuccessKey = index => `cubelinkConvMissionSuccess_v10_${index}`;
const missionIsSuccess = index => localStorage.getItem(missionSuccessKey(index)) === '1';
const missionHasSaved = index => Boolean(localStorage.getItem(missionSaveKey(index)));

function setMissionSuccess(index) { localStorage.setItem(missionSuccessKey(index), '1'); renderMissions(); }
function saveMission(index = current, quiet = true, refreshList = true) {
  if (isWorkspaceLoading || index < 0 || index >= missions.length) return;
  const text = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
  localStorage.setItem(missionSaveKey(index), text);
  if (!quiet) { $('notice').textContent = `${missions[index][0]} 코딩을 저장했습니다.`; log(`${missions[index][0]} 저장`); }
  if (refreshList) renderMissions();
}
function queueMissionSave() { clearTimeout(autosaveTimer); autosaveTimer = setTimeout(() => saveMission(current, true), 250); }
function renderMissions() {
  $('missionList').innerHTML = '';
  [{title:'1~3단계 · 기초',start:0,end:3},{title:'4~6단계 · 응용',start:3,end:6},{title:'7~9단계 · 심화',start:6,end:9}].forEach((group, groupIndex) => {
    const wrap = document.createElement('div'); wrap.className = 'missionGroup';
    const head = document.createElement('button'); head.className = `missionGroupHeader${openGroups[groupIndex] ? '' : ' closed'}`; head.innerHTML = `<span>${group.title}</span><span class="arrow">▼</span>`;
    const body = document.createElement('div'); body.className = `missionGroupBody${openGroups[groupIndex] ? '' : ' hidden'}`;
    head.onclick = () => { openGroups[groupIndex] = !openGroups[groupIndex]; localStorage.setItem('cubelinkConvOpenGroups', JSON.stringify(openGroups)); renderMissions(); };
    for (let index = group.start; index < group.end; index++) {
      const button = document.createElement('button');
      button.dataset.missionIndex = String(index);
      button.className = `missionBtn${index === current ? ' active' : ''}${missionIsSuccess(index) ? ' missionSuccess' : ''}`;
      if (index === current) button.setAttribute('aria-current', 'step');
      button.innerHTML = `<span>${missionIsSuccess(index) ? '✅ ' : ''}${missions[index][0]}</span>${missionIsSuccess(index) ? '<span class="successBadge">성공</span>' : missionHasSaved(index) ? '<span class="savedDot">● 저장됨</span>' : ''}`;
      button.onclick = () => selectMission(index); body.appendChild(button);
    }
    wrap.append(head, body); $('missionList').appendChild(wrap);
  });
}
function normalizeProgramRoot(dom) {
  const blocks = Array.from(dom.getElementsByTagName('block'));
  blocks.filter(block => block.getAttribute('type') === 'conv_when_start').forEach(legacy => {
    legacy.setAttribute('type', 'conv_setup_loop');
    const next = Array.from(legacy.childNodes).find(node => node.nodeType === 1 && node.nodeName.toLowerCase() === 'next');
    if (!next) return;
    const statement = dom.ownerDocument.createElement('statement');
    statement.setAttribute('name', 'SETUP');
    while (next.firstChild) statement.appendChild(next.firstChild);
    legacy.replaceChild(statement, next);
  });
  return dom;
}
function loadXml(xml) {
  isWorkspaceLoading = true;
  try {
    const dom = Blockly.Xml.textToDom
      ? Blockly.Xml.textToDom(xml)
      : Blockly.utils.xml.textToDom(xml);
    workspace.clear(); Blockly.Xml.domToWorkspace(normalizeProgramRoot(dom), workspace); Blockly.svgResize(workspace);
  }
  finally { setTimeout(() => { isWorkspaceLoading = false; }, 0); }
}
function resetToProgramRoot() {
  isWorkspaceLoading = true;
  workspace.clear();
  const root = workspace.newBlock('conv_setup_loop');
  root.initSvg(); root.render(); root.moveBy(40, 40);
  Blockly.svgResize(workspace);
  setTimeout(() => { isWorkspaceLoading = false; }, 0);
}
function selectMission(index) {
  if (!Number.isInteger(index) || index < 0 || index >= missions.length) return;
  clearTimeout(autosaveTimer);
  if (index !== current) saveMission(current, true, false);
  current = index; openGroups[Math.floor(index / 3)] = true; localStorage.setItem('cubelinkConvOpenGroups', JSON.stringify(openGroups));
  $('missionTitle').textContent = missions[index][0]; $('missionDesc').textContent = missions[index][1];
  $('missionHint').textContent = missionHints[index]; $('missionHint').classList.add('hidden'); $('hintBtn').setAttribute('aria-expanded', 'false'); $('hintBtn').textContent = '💡 힌트';
  const saved = localStorage.getItem(missionSaveKey(index)); loadXml(saved || missionXML[index]);
  $('notice').textContent = saved ? `${missions[index][0]} · 저장된 코딩을 불러왔습니다.` : missions[index][1];
  renderMissions();
}

async function sendCommand(command) {
  if (!connected || !desktop) throw new Error('실물 컨베이어가 연결되지 않았습니다.');
  log(`TX ${command}`);
  const result = await desktop.write(`${command}\n`);
  if (!result.ok) {
    showHelp(result.error && result.error.message || '명령 전송 실패');
    throw new Error(result.error && result.error.message || '명령 전송 실패');
  }
  return result;
}
function updateTwinMotor(dir, nextSpeed) {
  direction = dir; speed = Math.max(0, Math.min(100, Number(nextSpeed) || 0));
  const stopped = dir === 'STOP' || speed === 0;
  $('motorState').textContent = stopped ? '정지' : dir === 'F' ? '정방향' : '역방향';
  $('speedState').textContent = `${stopped ? 0 : speed}%`; $('speedSlider').value = speed; $('speedValue').textContent = `${speed}%`;
  $('chain').className = `chain${stopped ? '' : ` moving ${dir === 'F' ? 'forward' : 'reverse'}`}`;
  if (motionTimer) clearInterval(motionTimer);
  motionTimer = null;
  if (!stopped) motionTimer = setInterval(() => {
    if (!product) return;
    boxX += Math.max(.5, speed / 28) * (dir === 'F' ? 1 : -1);
    if (boxX > 270) boxX = 30; if (boxX < 30) boxX = 270;
    $('box').style.left = `${boxX}px`;
  }, 50);
}
async function setPhysicalMotor(dir, nextSpeed = speed) {
  updateTwinMotor(dir, nextSpeed);
  const command = dir === 'STOP' ? 'MOTOR,STOP' : `MOTOR,${dir},${speed}`;
  await sendCommand(command);
  log(`실물 모터 ${dir === 'F' ? '정방향' : dir === 'R' ? '역방향' : '정지'}${dir === 'STOP' ? '' : ` / ${speed}%`}`);
}
function setSimulatedMotor(dir, nextSpeed = speed) {
  updateTwinMotor(dir, nextSpeed);
  log(`시뮬레이션 ${dir === 'F' ? '정방향' : dir === 'R' ? '역방향' : '정지'}${dir === 'STOP' ? '' : ` / ${speed}%`}`);
}
function setDistance(value, fromHardware = false) {
  const nextDistance = Math.max(0, Number(value) || 0);
  if (fromHardware) {
    hardwareDistance = nextDistance;
    $('hardwareDistanceState').textContent = `${nextDistance.toFixed(nextDistance % 1 ? 1 : 0)} cm`;
  } else {
    distance = nextDistance;
    $('distanceState').textContent = `${distance.toFixed(distance % 1 ? 1 : 0)} cm`;
  }
  window.dispatchEvent(new CustomEvent('cubelink-conveyor-distance', { detail: { distance: nextDistance, fromHardware } }));
}

window.CubeLinkConveyorFactory = {
  isHardwareConnected: () => connected,
  stop: async () => {
    updateTwinMotor('STOP', speed);
    await sendCommand('CONVEYOR,STOP');
    log('스마트팩토리 연동 · 컨베이어 정지');
  },
  resume: async () => {
    await sendCommand('CONVEYOR,START');
    updateTwinMotor('F', speed || 60);
    log('스마트팩토리 연동 · 컨베이어 재가동');
  }
};
async function timedWait(seconds, token) {
  const total = Math.max(0, Number(seconds) || 0), started = performance.now();
  while (token === runToken) { const elapsed = (performance.now() - started) / 1000; $('notice').textContent = `대기 중... ${Math.max(0,total-elapsed).toFixed(1)}초`; if (elapsed >= total) break; await sleep(80); }
  return token === runToken;
}
async function waitUntil(predicate, token, message) { $('notice').textContent = message; while (token === runToken && !predicate()) await sleep(100); return token === runToken; }
const runtimeDistance = mode => mode === 'realtime' ? (hardwareDistance ?? 400) : distance;
async function execChain(block, token, mode) {
  while (block && token === runToken) {
    const type = block.type;
    if (type === 'conv_motor') await (mode === 'realtime' ? setPhysicalMotor(block.getFieldValue('DIR'), Number(block.getFieldValue('SPEED'))) : setSimulatedMotor(block.getFieldValue('DIR'), Number(block.getFieldValue('SPEED'))));
    else if (type === 'conv_stop') await (mode === 'realtime' ? setPhysicalMotor('STOP') : setSimulatedMotor('STOP'));
    else if (type === 'conv_speed') { speed = Number(block.getFieldValue('SPEED')); updateTwinMotor(direction, speed); if (mode === 'realtime') await sendCommand(`SPEED,${speed}`); }
    else if (type === 'conv_wait' && !await timedWait(Number(block.getFieldValue('SEC')), token)) return;
    else if (type === 'conv_wait_near' && !await waitUntil(() => runtimeDistance(mode) <= Number(block.getFieldValue('CM')), token, `${mode === 'realtime' ? '실물' : '모의'} 물체 접근 대기`)) return;
    else if (type === 'conv_wait_far' && !await waitUntil(() => runtimeDistance(mode) >= Number(block.getFieldValue('CM')), token, `${mode === 'realtime' ? '실물' : '모의'} 물체 이탈 대기`)) return;
    else if (type === 'conv_if_distance') {
      const cm = Number(block.getFieldValue('CM'));
      const measured = runtimeDistance(mode);
      const condition = block.getFieldValue('OP') === 'GE' ? measured >= cm : measured <= cm;
      if (condition) await execChain(block.getInputTargetBlock('DO'), token, mode);
    }
    else if (type === 'conv_repeat') { const inner = block.getInputTargetBlock('DO'); for (let index=0; index<Number(block.getFieldValue('TIMES')) && token===runToken; index++) await execChain(inner, token, mode); }
    else if (type === 'conv_forever') {
      const inner = block.getInputTargetBlock('DO');
      while (token === runToken) {
        if (inner) await execChain(inner, token, mode);
        if (token === runToken) await sleep(30);
      }
      return;
    }
    else if (type === 'conv_count') { for (let index=1; index<=Number(block.getFieldValue('COUNT')) && token===runToken; index++) { if (!await waitUntil(()=>runtimeDistance(mode)<=10,token,`제품 ${index} 접근 대기`)) return; if (!await waitUntil(()=>runtimeDistance(mode)>=15,token,'물체 이탈 대기')) return; } }
    else if (type === 'conv_jam') { const cm=Number(block.getFieldValue('CM')), sec=Number(block.getFieldValue('SEC')); if (!await waitUntil(()=>runtimeDistance(mode)<=cm,token,'이상 체류 확인 대기')) return; await sleep(sec*1000); if (runtimeDistance(mode)<=cm) { await (mode === 'realtime' ? setPhysicalMotor('STOP') : setSimulatedMotor('STOP')); $('notice').textContent='⚠ 이상 체류 감지'; } }
    else if (type === 'conv_safe') { alert(`${mode === 'realtime' ? '실물 주변' : '시뮬레이션'} 안전을 확인한 뒤 확인을 누르세요.`); await (mode === 'realtime' ? setPhysicalMotor('F', speed || 60) : setSimulatedMotor('F', speed || 60)); }
    else if (type === 'conv_handoff') { alert('로봇팔 작업 완료 신호를 확인했습니다.'); log('로봇팔 완료 신호(수업용)'); }
    block = block.getNextBlock();
  }
}
const hasType = type => workspace.getAllBlocks(false).some(block => block.type === type);
const getBlocks = type => workspace.getAllBlocks(false).filter(block => block.type === type);
const getProgramRoots = () => workspace.getTopBlocks(true).filter(block => block.type === 'conv_setup_loop' || block.type === 'conv_when_start');
const hasStartConnected = () => getProgramRoots().some(block => block.type === 'conv_when_start'
  ? block.getNextBlock()
  : block.getInputTargetBlock('SETUP') || block.getInputTargetBlock('LOOP'));
function validateMissionCoding(index) {
  const motors = getBlocks('conv_motor'), waits = getBlocks('conv_wait'), forward = motors.some(block=>block.getFieldValue('DIR')==='F'), reverse = motors.some(block=>block.getFieldValue('DIR')==='R');
  return [
    () => hasStartConnected()&&forward&&waits.length&&hasType('conv_stop'), () => hasStartConnected()&&forward&&reverse&&hasType('conv_stop'),
    () => hasStartConnected()&&forward&&(hasType('conv_wait_near')||hasType('conv_if_distance'))&&hasType('conv_stop'), () => hasStartConnected()&&hasType('conv_wait_near')&&hasType('conv_wait_far')&&forward,
    () => hasStartConnected()&&hasType('conv_repeat')&&forward&&waits.length&&hasType('conv_stop'), () => hasStartConnected()&&hasType('conv_count')&&hasType('conv_stop'),
    () => hasStartConnected()&&hasType('conv_jam'), () => hasStartConnected()&&hasType('conv_safe'), () => hasStartConnected()&&hasType('conv_handoff')&&forward
  ][index]();
}
async function runProgram(mode = 'simulation') {
  if (mode === 'realtime' && !connected) { $('notice').textContent='실시간 실행 전에 CubeLink Conveyor를 연결하세요.'; return; }
  if (mode === 'simulation' && !product) { $('notice').textContent='📦 먼저 모의 제품을 투입하세요.'; return; }
  const roots = getProgramRoots();
  if (!roots.length || !validateMissionCoding(current)) { $('notice').textContent='❌ 기본 구조 안에 현재 미션에 필요한 블록을 연결했는지 확인하세요.'; return; }
  if (executionMode === 'realtime' && connected) { runToken++; await setPhysicalMotor('STOP'); }
  const token = ++runToken;
  executionMode = mode;
  simulationRunning = mode === 'simulation';
  $('notice').textContent = mode === 'realtime' ? '실시간 블록 실행 중 · 실물 컨베이어를 제어합니다.' : '시뮬레이션 실행 중 · 실물에는 명령을 보내지 않습니다.';
  log(mode === 'realtime' ? '블록 실시간 실행 시작 · 실물 명령 전송' : '블록 시뮬레이션 시작 · 실물 명령 전송 없음');
  try {
    for (const root of roots) {
      if (root.type === 'conv_when_start') {
        await execChain(root.getNextBlock(), token, mode);
      } else {
        await execChain(root.getInputTargetBlock('SETUP'), token, mode);
        const loop = root.getInputTargetBlock('LOOP');
        while (loop && token === runToken) {
          await execChain(loop, token, mode);
          if (token === runToken) await sleep(30);
        }
      }
      if (token !== runToken) return;
    }
    await (mode === 'realtime' ? setPhysicalMotor('STOP') : setSimulatedMotor('STOP')); if (token !== runToken) return;
    setMissionSuccess(current); $('notice').textContent=`🎉 미션 성공! ${missions[current][0]} 완료`; alert(`🎉 미션 성공!\n${missions[current][0]} 완료`);
  } catch (error) {
    if (mode === 'realtime' && connected) {
      try { await setPhysicalMotor('STOP'); } catch (stopError) { log(`실물 정지 실패: ${stopError.message}`); }
    }
    $('notice').textContent=`실행 중단: ${error.message}`; log(`실행 오류: ${error.message}`);
  }
  finally { if (token === runToken) { simulationRunning = false; executionMode = 'idle'; } }
}
function stopProgram() {
  if (executionMode !== 'simulation') { $('notice').textContent='실행 중인 시뮬레이션이 없습니다.'; return; }
  runToken++; simulationRunning = false; executionMode = 'idle'; updateTwinMotor('STOP', speed);
  $('notice').textContent='시뮬레이션이 정지되었습니다. 실물 제어 상태는 변경하지 않습니다.';
}
async function runManualMotor(dir, nextSpeed = speed) {
  if (executionMode === 'realtime') { runToken++; executionMode = 'idle'; }
  await setPhysicalMotor(dir, nextSpeed);
  $('notice').textContent = dir === 'STOP' ? '실물 컨베이어가 정지되었습니다.' : `실물 컨베이어 ${dir === 'F' ? '정방향' : '역방향'} 수동제어 중`;
}

$('autoBtn').onclick = autoDiscover; $('refreshBtn').onclick = () => refreshPorts(false); $('connectBtn').onclick = manualConnect; $('disconnectBtn').onclick = disconnect;
$('reconnectToggle').onchange = () => desktop && desktop.setAutoReconnect($('reconnectToggle').checked);
$('forwardBtn').onclick = () => runManualMotor('F', Number($('speedSlider').value)).catch(error=>{ log(error.message); showHelp(error.message); });
$('reverseBtn').onclick = () => runManualMotor('R', Number($('speedSlider').value)).catch(error=>{ log(error.message); showHelp(error.message); });
$('manualStopBtn').onclick = () => runManualMotor('STOP').catch(error=>{ log(error.message); showHelp(error.message); });
$('speedSlider').oninput = () => { speed=Number($('speedSlider').value); $('speedValue').textContent=`${speed}%`; if(direction!=='STOP') updateTwinMotor(direction,speed); };
$('speedSlider').onchange = () => { if(connected) sendCommand(`SPEED,${speed}`).catch(error=>log(error.message)); };
$('runBtn').onclick=()=>runProgram('simulation'); $('realtimeRunBtn').onclick=()=>runProgram('realtime'); $('stopBtn').onclick=stopProgram;
$('resetBtn').onclick=()=>{ if(executionMode==='realtime') { $('notice').textContent='실시간 실행은 실물 정지 버튼으로 먼저 중지하세요.'; return; } stopProgram(); product=false; $('box').style.display='none'; boxX=55; setDistance(30); selectMission(current); };
$('insertBtn').onclick=()=>{ product=true; boxX=55; $('box').style.display='block'; $('box').style.left=`${boxX}px`; $('notice').textContent='모의 제품이 투입되었습니다.'; };
$('nearBtn').onclick=()=>{ setDistance(5); $('notice').textContent='모의 초음파 거리: 5cm'; };
$('farBtn').onclick=()=>{ setDistance(30); $('notice').textContent='모의 초음파 거리: 30cm'; };
$('saveBtn').onclick=()=>saveMission(current,false); $('loadBtn').onclick=()=>{ const xml=localStorage.getItem(missionSaveKey(current)); if(xml) loadXml(xml); else alert('현재 미션에 저장된 블록이 없습니다.'); };
$('reloadBtn').onclick=()=>{ if(confirm('현재 미션을 기본 예제 블록으로 되돌릴까요?')) { loadXml(missionXML[current]); setTimeout(()=>saveMission(current,false),40); } };
$('hintBtn').onclick=()=>{ const opening=$('missionHint').classList.contains('hidden'); $('missionHint').classList.toggle('hidden',!opening); $('hintBtn').setAttribute('aria-expanded',String(opening)); $('hintBtn').textContent=opening?'💡 힌트 닫기':'💡 힌트'; };
$('clearBtn').onclick=()=>{ resetToProgramRoot(); queueMissionSave(); }; $('freeBtn').onclick=()=>{ resetToProgramRoot(); $('missionTitle').textContent='자유 창작 모드'; $('missionDesc').textContent='기본 구조의 setup 또는 loop 안에 원하는 블록을 연결하세요.'; $('missionHint').classList.add('hidden'); $('hintBtn').setAttribute('aria-expanded','false'); queueMissionSave(); };
$('fullscreenBtn').onclick=()=>{ document.body.classList.toggle('fullscreenTwin'); setTimeout(()=>Blockly.svgResize(workspace),50); };
window.addEventListener('beforeunload',()=>saveMission(current,true));

setConnectionUi('off','컨베이어 연결 안 됨','COM 포트를 검색하거나 시뮬레이션으로 학습할 수 있습니다.');
setDistance(30); updateTwinMotor('STOP',speed); renderMissions(); selectMission(0); refreshPorts(true);

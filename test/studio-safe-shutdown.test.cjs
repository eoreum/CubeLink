const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'studio', 'web', 'js', 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'studio', 'web', 'index.html'), 'utf8');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'arduino-nano', 'CubeLinkBridge', 'CubeLinkBridge.ino'),
  'utf8'
);

const start = app.indexOf('// ===== 안전 종료 버튼');
const end = app.indexOf('// ===== 연결 상태에 따라 안전 종료 버튼 표시 =====', start);
if (start < 0 || end < 0 || end <= start) {
  throw new Error('안전 종료 처리 구간을 찾을 수 없습니다.');
}

const safeShutdown = app.slice(start, end);
if (!safeShutdown.includes("enc.encode('K\\n')")) {
  throw new Error('안전 종료가 펌웨어 K 명령을 보내지 않습니다.');
}

for (const forbidden of ['safePos', 'getServoOffset', 'S,${pin}']) {
  if (safeShutdown.includes(forbidden)) {
    throw new Error(`안전 종료에 중복 사전 이동 코드가 남아 있습니다: ${forbidden}`);
  }
}

for (const forbidden of ['_manualJoystickActive', "sendBoardCommand(starting ? 'M,1'", "'M,1'", "'M,0'"]) {
  if (app.includes(forbidden) || index.includes(forbidden)) {
    throw new Error(`펌웨어 변경이 필요한 M 수동모드 코드가 남아 있습니다: ${forbidden}`);
  }
}

for (const forbidden of ["else if (cmd == 'M')", 'v1.4.3']) {
  if (firmware.includes(forbidden)) {
    throw new Error(`펌웨어 변경 내용이 남아 있습니다: ${forbidden}`);
  }
}

console.log('Studio 안전 종료 단일 K 명령 및 펌웨어 무변경 검증 통과');

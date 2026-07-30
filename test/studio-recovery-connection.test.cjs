const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'studio', 'web', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'studio', 'web', 'js', 'app.js'), 'utf8');

if (index.includes('USB 전원을 분리한 상태')) {
  throw new Error('복구 안내에 USB 분리를 요구하는 문구가 남아 있습니다.');
}
if (!index.includes('USB 연결은 절대로 빼지 마세요')) {
  throw new Error('복구 중 USB 연결 유지 안내가 없습니다.');
}
if (!index.includes("waitForBoardResponse(['INIT_OK', 'ERR'], 5000)")) {
  throw new Error('재접속 시 현재 보드 상태를 먼저 확인하지 않습니다.');
}
if (!index.includes("probeResponse === 'INIT_OK'")) {
  throw new Error('이미 활성화된 로봇 세션을 이동 없이 복원하는 처리가 없습니다.');
}
if (!index.includes('Array.isArray(w.expected) ? w.expected.includes(head)')) {
  throw new Error('여러 상태 응답을 기다리는 시리얼 처리기가 없습니다.');
}

for (const removed of ['btnManualJoystick', '_studioJoystickManual', 'runStudioJoystickManualTick']) {
  if (index.includes(removed) || app.includes(removed)) {
    throw new Error(`확정판에서 제외한 조이스틱 수동모드 코드가 남아 있습니다: ${removed}`);
  }
}

console.log('복구 연결 유지 및 조이스틱 수동모드 제외 검증 통과');

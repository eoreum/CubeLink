const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(
  path.join(root, 'firmware', 'arduino-nano', 'CubeLinkBridge', 'CubeLinkBridge.ino'),
  'utf8'
);

const armingStart = firmware.indexOf('void checkArming()');
const armingEnd = firmware.indexOf('void armAuto()', armingStart);
if (armingStart < 0 || armingEnd <= armingStart) {
  throw new Error('Standalone arming function was not found.');
}

const arming = firmware.slice(armingStart, armingEnd);

for (const required of [
  'if (studioSessionActive) return;',
  'if (!joystickCalibrated) return;',
  'if (!servosActive && !safetyState.safelyParked) return;',
  '(x1 > centerJ1x + ARM_EDGE) && (y1 < centerJ1y - ARM_EDGE)',
  '(x2 > centerJ2x + ARM_EDGE) && (y2 < centerJ2y - ARM_EDGE)',
  'leftInwardCorner && rightInwardCorner',
  'now - armHoldStart >= ARM_HOLD_TIME'
]) {
  if (!arming.includes(required)) {
    throw new Error(`Required standalone arming safety rule is missing: ${required}`);
  }
}

if (!firmware.includes('const unsigned long ARM_HOLD_TIME = 2000;')) {
  throw new Error('Standalone inward gesture must be held for exactly 2 seconds.');
}

for (const removed of [
  '(x1 < centerJ1x - ARM_EDGE) && (y1 < centerJ1y - ARM_EDGE)',
  '(x2 > centerJ2x + ARM_EDGE) && (y2 > centerJ2y + ARM_EDGE)'
]) {
  if (arming.includes(removed)) {
    throw new Error(`Legacy asymmetric arming gesture remains: ${removed}`);
  }
}

console.log('Standalone down-and-inward 2-second arming gesture and safety gates verified');

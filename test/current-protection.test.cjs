const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const firmware = fs.readFileSync(path.join(
  root, 'firmware', 'arduino-nano', 'CubeLinkBridge', 'CubeLinkBridge.ino'
), 'utf8');
const studio = fs.readFileSync(path.join(root, 'studio', 'web', 'js', 'app.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'studio', 'web', 'index.html'), 'utf8');

test('firmware requires two INA3221 boards and exposes four-channel capability', () => {
  assert.match(firmware, /INA3221_ARM_ADDRESS\s*=\s*0x40/);
  assert.match(firmware, /INA3221_GRIPPER_ADDRESS\s*=\s*0x41/);
  assert.match(firmware, /PIN_BASE,[\s\S]*PIN_LOWER,[\s\S]*PIN_UPPER,[\s\S]*PIN_GRIPPER,/);
  assert.match(firmware, /currentSensorsReady \? F\("CUR4"\) : F\("CUR0"\)/);
  assert.match(firmware, /ERR,CURRENT_SENSOR_REQUIRED/);
});

test('firmware detaches a stalled servo and has guarded rollback commands', () => {
  assert.match(firmware, /CURRENT_START_GRACE_MS\s*=\s*250/);
  assert.match(firmware, /CURRENT_TRIP_HOLD_MS\s*=\s*450/);
  assert.match(firmware, /detachServoPin\(channel\.pin\)/);
  assert.match(firmware, /cmd == 'M' \|\| cmd == 'B'/);
  assert.match(firmware, /FAULT,[\s\S]*ROLLBACK[\s\S]*RECOVERY_OK/);
  assert.match(firmware, /EMERGENCY_STOPPED/);
  assert.match(firmware, /CURRENT,6,mA,9,mA,10,mA,11,mA|reportServoCurrents/);
});

test('Studio maps faults to blocks and rolls successful actions back in reverse order', () => {
  assert.match(index, /supportedSafetyVersions = \['v1\.5\.0'\]/);
  assert.match(index, /currentProtection !== 'CUR4'/);
  assert.match(index, /head === 'FAULT'/);
  assert.match(studio, /workspace\.highlightBlock\(block\.id\)/);
  assert.match(studio, /stepNumber: servoProtection\.actions\.size \+ 1/);
  assert.match(studio, /번째 블록\(PIN \$\{fault\.pin\}\)/);
  assert.match(studio, /servoProtection\.history[\s\S]*\.reverse\(\)/);
  assert.match(studio, /`B,\$\{commandId\},\$\{pin\},\$\{realAngle\}`/);
  assert.match(studio, /writer\.write\(enc\.encode\('C\\n'\)\)/);
  assert.match(studio, /writer\.write\(enc\.encode\('X\\n'\)\)/);
});

test('Student servo actions use monitored command ids and interruptible waits', () => {
  assert.match(studio, /beginServoAction\(b, pin, angle\)/);
  assert.match(studio, /beginServoAction\(b, pin, target\)/);
  assert.match(studio, /verifyServoAction\(actionStarted\)/);
  assert.match(studio, /await runtimeDelay\(ms\)/);
  assert.match(studio, /ServoProtectionError/);
});

test('Completing the ninth mission automatically enters the saved free workspace', () => {
  assert.match(studio, /justCompleted && this\.current !== FREE_WORKSPACE\.id/);
  assert.match(studio, /selectMission\(FREE_WORKSPACE\.id\)/);
  assert.match(studio, /WorkspaceStorage\.save\(MissionProgress\.current\)/);
  assert.match(studio, /WorkspaceStorage\.restore\(id\)/);
});

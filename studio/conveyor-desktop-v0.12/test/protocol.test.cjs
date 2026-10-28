'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { classifyHandshake, isPreferredUsbPort } = require('../electron/protocol');

test('identifies current CubeLink Conveyor handshake and version', () => {
  const result = classifyHandshake(['HELLO,CUBELINK_CONVEYOR,1.1.0', 'DEVICE=CUBELINK_CONVEYOR', 'FW=1.1.0', 'END']);
  assert.equal(result.identified, true);
  assert.equal(result.compatible, true);
  assert.equal(result.version, '1.1.0');
});

test('accepts legacy ultrasonic telemetry as compatible but unverified', () => {
  const result = classifyHandshake(['U,18.4']);
  assert.equal(result.identified, false);
  assert.equal(result.telemetry, true);
  assert.equal(result.compatible, true);
});

test('does not identify unrelated serial text', () => {
  const result = classifyHandshake(['boot ok', 'temperature=21']);
  assert.equal(result.compatible, false);
});

test('prefers CH340 and Arduino USB metadata', () => {
  assert.equal(isPreferredUsbPort({ vendorId: '1A86' }), true);
  assert.equal(isPreferredUsbPort({ manufacturer: 'Arduino LLC' }), true);
  assert.equal(isPreferredUsbPort({ vendorId: '9999', manufacturer: 'Other' }), false);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const compatibility = require(path.resolve(
  __dirname, '..', 'studio', 'web', 'js', 'firmwareCompatibility.js'
));

const compatibleHandshake = versionText => compatibility.evaluateHandshake({
  versionText,
  safetyState: 'SAFE',
  poseProfile: 'PARK_90_30_160_90'
});

test('parses stable semver with an optional v prefix', () => {
  assert.deepEqual(compatibility.parseSemver('v1.3.5'), {
    raw: 'v1.3.5', major: 1, minor: 3, patch: 5, prerelease: ''
  });
  assert.equal(compatibility.parseSemver('1.25.103').minor, 25);
  assert.equal(compatibility.parseSemver('v1.03.5'), null);
  assert.equal(compatibility.parseSemver('1.4'), null);
});

test('accepts stable firmware 1.3.5 and later without a minor or patch ceiling', () => {
  assert.equal(compatibleHandshake('v1.3.5').ok, true);
  assert.equal(compatibleHandshake('1.4.99').ok, true);
  assert.equal(compatibleHandshake('v1.999.999').ok, true);
});

test('rejects older, malformed, and prerelease firmware versions', () => {
  assert.equal(compatibleHandshake('v1.3.4').code, 'VERSION_TOO_OLD');
  assert.equal(compatibleHandshake('v1.4').code, 'INVALID_VERSION');
  assert.equal(compatibleHandshake('v1.6.0-beta.1').code, 'PRERELEASE_VERSION');
});

test('checks protocol compatibility independently from the version floor', () => {
  assert.equal(compatibleHandshake('v2.0.0').code, 'UNSUPPORTED_PROTOCOL_MAJOR');
  assert.equal(compatibility.evaluateHandshake({
    versionText: 'v1.6.0', safetyState: 'SAFE', poseProfile: 'PARK_FUTURE'
  }).code, 'UNSUPPORTED_POSE_PROFILE');
  assert.equal(compatibility.evaluateHandshake({
    versionText: 'v1.6.0', safetyState: 'FUTURE_STATE', poseProfile: 'PARK_90_30_160_90'
  }).code, 'UNSUPPORTED_SAFETY_STATE');
});

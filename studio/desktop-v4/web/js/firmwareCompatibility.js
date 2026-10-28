/**
 * CubeLink firmware version eligibility and Studio protocol compatibility.
 *
 * Version eligibility deliberately has no upper bound. Protocol compatibility
 * is evaluated separately so a future breaking command set fails closed.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CubeLinkFirmwareCompatibility = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const MINIMUM_FIRMWARE = Object.freeze({ major: 1, minor: 3, patch: 5 });
  const SUPPORTED_PROTOCOL_MAJOR = 1;
  const REQUIRED_POSE_PROFILE = 'PARK_90_30_160_90';
  const SUPPORTED_SAFETY_STATES = new Set(['SAFE', 'RECOVERY_REQUIRED']);
  const SEMVER_PATTERN = /^[vV]?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

  function parseSemver(value) {
    const raw = String(value || '').trim();
    const match = SEMVER_PATTERN.exec(raw);
    if (!match) return null;
    const version = {
      raw,
      major: Number(match[1]),
      minor: Number(match[2]),
      patch: Number(match[3]),
      prerelease: match[4] || ''
    };
    if (![version.major, version.minor, version.patch].every(Number.isSafeInteger)) return null;
    return version;
  }

  function compareCore(left, right) {
    for (const key of ['major', 'minor', 'patch']) {
      if (left[key] !== right[key]) return left[key] < right[key] ? -1 : 1;
    }
    return 0;
  }

  function checkVersionEligibility(versionText) {
    const version = parseSemver(versionText);
    if (!version) return { ok: false, code: 'INVALID_VERSION', version: null };
    if (version.prerelease) return { ok: false, code: 'PRERELEASE_VERSION', version };
    if (compareCore(version, MINIMUM_FIRMWARE) < 0) {
      return { ok: false, code: 'VERSION_TOO_OLD', version };
    }
    return { ok: true, code: 'OK', version };
  }

  function checkProtocolCompatibility(details) {
    const version = details && details.version;
    if (!version || version.major !== SUPPORTED_PROTOCOL_MAJOR) {
      return { ok: false, code: 'UNSUPPORTED_PROTOCOL_MAJOR' };
    }
    if (details.poseProfile !== REQUIRED_POSE_PROFILE) {
      return { ok: false, code: 'UNSUPPORTED_POSE_PROFILE' };
    }
    if (!SUPPORTED_SAFETY_STATES.has(details.safetyState)) {
      return { ok: false, code: 'UNSUPPORTED_SAFETY_STATE' };
    }
    return { ok: true, code: 'OK' };
  }

  function evaluateHandshake(details) {
    const versionResult = checkVersionEligibility(details && details.versionText);
    if (!versionResult.ok) return { ...versionResult, stage: 'version' };
    const protocolResult = checkProtocolCompatibility({
      version: versionResult.version,
      poseProfile: details && details.poseProfile,
      safetyState: details && details.safetyState
    });
    if (!protocolResult.ok) {
      return { ...protocolResult, stage: 'protocol', version: versionResult.version };
    }
    return { ok: true, code: 'OK', stage: 'ready', version: versionResult.version };
  }

  return Object.freeze({
    MINIMUM_FIRMWARE,
    SUPPORTED_PROTOCOL_MAJOR,
    REQUIRED_POSE_PROFILE,
    parseSemver,
    compareCore,
    checkVersionEligibility,
    checkProtocolCompatibility,
    evaluateHandshake
  });
});

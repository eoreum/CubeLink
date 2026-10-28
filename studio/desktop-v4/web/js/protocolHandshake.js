/**
 * CubeLink Studio 4 protocol discovery.
 *
 * Protocol 2 always gets the whole discovery window, even when legacy
 * telemetry arrives first.  Only after the HELLO? retries are exhausted may
 * known CubeLink telemetry be used as evidence for Legacy mode.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CubeLinkProtocolHandshake = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const SUPPORTED_PROTOCOL = 2;
  const REQUIRED_LEGACY_POSE_PROFILE = 'PARK_90_30_160_90';
  const SUPPORTED_LEGACY_SAFETY_STATES = Object.freeze(['SAFE', 'RECOVERY_REQUIRED']);
  const HELLO_RETRY_DELAYS_MS = Object.freeze([0, 750, 1750, 3250, 5000]);
  const HANDSHAKE_TIMEOUT_MS = 6500;
  const KEY_VALUE_PATTERN = /^([A-Z][A-Z0-9_]*)=(.*)$/;

  function normalizeCapabilities(value) {
    const items = Array.isArray(value) ? value : String(value || '').split(',');
    return [...new Set(items.map(item => String(item).trim().toUpperCase()).filter(Boolean))];
  }

  function parseLegacyTelemetry(line) {
    const value = String(line || '').trim();
    if (/^J[12],-?\d+,-?\d+,[01]$/.test(value)) {
      return { kind: 'JOYSTICK', line: value };
    }
    if (/^A,(6|9|10|11),-?\d+$/.test(value)) {
      return { kind: 'SERVO4', line: value };
    }
    if (/^U,-?\d+$/.test(value)) {
      return { kind: 'ULTRASONIC', line: value };
    }
    if (/^(READY|PONG),CUBELINK(?:,|$)/.test(value)) {
      return { kind: 'CUBELINK_STATUS', line: value };
    }
    if (/^(INIT_OK|PARKED|RECOVERY_(?:ACCEPTED|OK)|MANUAL_(?:ACTIVE|INACTIVE)|STANDALONE_ACTIVE)$/.test(value)) {
      return { kind: 'CUBELINK_STATUS', line: value };
    }
    return null;
  }

  function parseLegacySafetyHandshake(line) {
    const parts = String(line || '').trim().split(',');
    if (!['READY', 'PONG'].includes(parts[0]) || parts[1] !== 'CUBELINK') return null;
    return {
      source: parts[0],
      firmware: parts[2] || '',
      safetyState: parts[3] || '',
      poseProfile: parts[4] || '',
      currentProtection: parts[5] || 'CUR0',
      manualProtocol: parts[6] || ''
    };
  }

  // Protocol 1 / older firmware legitimately rejects the Protocol 2 probe.
  // This response is meaningful only while discovery is active: it must not
  // become Legacy identity evidence, and it must not hide later real errors.
  function isExpectedDiscoveryRejection(line) {
    return String(line || '').trim() === 'ERR,UNKNOWN_COMMAND';
  }

  // Studio 4 does not use the firmware label as an allowlist. A Legacy board
  // may identify as v1.x, EVENT-v1.0, or another product label. Older classroom
  // firmware may also omit or report a different safety profile; those boards
  // stay connected and use Studio's default CubeLink profile with a warning.
  function evaluateLegacySafetyContract(details) {
    if (!details || details.poseProfile !== REQUIRED_LEGACY_POSE_PROFILE) {
      return {
        ok: true,
        fallback: true,
        code: 'FALLBACK_POSE_PROFILE',
        poseProfile: REQUIRED_LEGACY_POSE_PROFILE
      };
    }
    if (!SUPPORTED_LEGACY_SAFETY_STATES.includes(details.safetyState)) {
      return {
        ok: true,
        fallback: true,
        code: 'FALLBACK_SAFETY_STATE',
        poseProfile: REQUIRED_LEGACY_POSE_PROFILE
      };
    }
    return {
      ok: true,
      fallback: false,
      code: 'OK',
      poseProfile: REQUIRED_LEGACY_POSE_PROFILE
    };
  }

  function createDetector() {
    let fields = Object.create(null);
    let evidence = [];
    let inferredCapabilities = new Set();
    let result = null;

    function snapshot() {
      return {
        fields: { ...fields },
        evidence: evidence.slice(),
        inferredCapabilities: [...inferredCapabilities],
        result
      };
    }

    function observe(rawLine) {
      if (result) return result;
      const line = String(rawLine || '').trim();
      if (!line) return { status: 'pending' };

      if (line === 'END') {
        if (fields.DEVICE !== 'CUBELINK') {
          result = { status: 'failed', code: 'INVALID_DEVICE' };
        } else if (Number(fields.PROTOCOL) !== SUPPORTED_PROTOCOL) {
          result = { status: 'failed', code: 'UNSUPPORTED_PROTOCOL', protocol: fields.PROTOCOL || '' };
        } else {
          result = {
            status: 'protocol2',
            device: fields.DEVICE,
            firmware: fields.FW || '',
            protocol: SUPPORTED_PROTOCOL,
            capabilities: normalizeCapabilities(fields.CAP)
          };
        }
        return result;
      }

      const keyValue = KEY_VALUE_PATTERN.exec(line);
      if (keyValue) {
        fields[keyValue[1]] = keyValue[2].trim();
        return { status: 'pending', protocolResponseStarted: true };
      }

      const legacy = parseLegacyTelemetry(line);
      if (legacy) {
        evidence.push(legacy);
        if (legacy.kind === 'JOYSTICK') inferredCapabilities.add('JOYSTICK');
        if (legacy.kind === 'SERVO4') inferredCapabilities.add('SERVO4');
        if (legacy.kind === 'ULTRASONIC') inferredCapabilities.add('ULTRASONIC');
        return { status: 'pending', legacyEvidence: legacy };
      }
      return { status: 'pending' };
    }

    function finalize() {
      if (result) return result;
      if (evidence.length) {
        result = {
          status: 'legacy',
          protocol: 'Legacy',
          capabilities: [...inferredCapabilities],
          evidence: evidence.slice()
        };
      } else {
        result = { status: 'failed', code: 'NO_CUBELINK_RESPONSE' };
      }
      return result;
    }

    return Object.freeze({ observe, finalize, snapshot });
  }

  return Object.freeze({
    SUPPORTED_PROTOCOL,
    REQUIRED_LEGACY_POSE_PROFILE,
    SUPPORTED_LEGACY_SAFETY_STATES,
    HELLO_RETRY_DELAYS_MS,
    HANDSHAKE_TIMEOUT_MS,
    normalizeCapabilities,
    parseLegacyTelemetry,
    parseLegacySafetyHandshake,
    isExpectedDiscoveryRejection,
    evaluateLegacySafetyContract,
    createDetector
  });
});

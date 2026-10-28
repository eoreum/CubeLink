'use strict';

const ID_PATTERNS = [
  /CUBELINK[ _-]*CONVEYOR/i,
  /DEVICE\s*[=:,]\s*CUBELINK[ _-]*CONVEYOR/i,
  /CONVEYOR[ _-]*(?:FW|FIRMWARE|READY)/i,
  /READY\s*[,=:]\s*(?:CUBELINK[ _-]*)?CONVEYOR/i
];

const TELEMETRY_PATTERNS = [
  /^U\s*[,=:]\s*-?\d+(?:\.\d+)?/i,
  /^(?:DIST|DISTANCE)\s*[,=:]\s*-?\d+(?:\.\d+)?/i,
  /^STATUS\s*[,=:]/i
];

function classifyHandshake(lines) {
  const clean = (Array.isArray(lines) ? lines : [])
    .map(line => String(line || '').trim())
    .filter(Boolean);
  const text = clean.join('\n');
  const identified = ID_PATTERNS.some(pattern => pattern.test(text));
  const telemetry = TELEMETRY_PATTERNS.some(pattern => clean.some(line => pattern.test(line)));
  const versionMatch = text.match(/(?:FW|FIRMWARE|VERSION)\s*[=:,]\s*([A-Za-z0-9._-]+)/i)
    || text.match(/CUBELINK[ _-]*CONVEYOR\s*[,/-]\s*(?:V)?([A-Za-z0-9._-]+)/i);
  return {
    identified,
    telemetry,
    compatible: identified || telemetry,
    version: versionMatch ? versionMatch[1] : null,
    lines: clean
  };
}

function isPreferredUsbPort(info) {
  const vid = String(info && info.vendorId || '').toUpperCase().replace(/^0X/, '');
  const product = `${info && info.manufacturer || ''} ${info && info.friendlyName || ''} ${info && info.pnpId || ''}`;
  return ['1A86', '2341', '2A03'].includes(vid) || /CH340|CH341|USB[- ]SERIAL|ARDUINO/i.test(product);
}

module.exports = { classifyHandshake, isPreferredUsbPort };

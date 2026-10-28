'use strict';

const CONVEYOR_PATTERNS = [
  /CUBELINK[ _-]*CONVEYOR/i,
  /DEVICE\s*[=:,]\s*CUBELINK[ _-]*CONVEYOR/i,
  /CONVEYOR[ _-]*(?:FW|FIRMWARE|READY)/i,
  /READY\s*[,=:]\s*(?:CUBELINK[ _-]*)?CONVEYOR/i
];
const TELEMETRY_PATTERNS = [/^U\s*[,=:]\s*-?\d/i, /^(?:DIST|DISTANCE)\s*[,=:]\s*-?\d/i, /\bDIST\s*=\s*-?\d/i];

function classifyHandshake(lines) {
  const values = (lines || []).map(value => String(value || '').trim()).filter(Boolean);
  const identified = values.some(line => CONVEYOR_PATTERNS.some(pattern => pattern.test(line)));
  const compatible = identified || values.some(line => TELEMETRY_PATTERNS.some(pattern => pattern.test(line)));
  const text = values.join('\n');
  const version = (text.match(/(?:FW|FIRMWARE)\s*[=:,]\s*(?:V)?([A-Za-z0-9._-]+)/i)
    || text.match(/CUBELINK[ _-]*CONVEYOR\s*[,/-]\s*(?:V)?([A-Za-z0-9._-]+)/i) || [])[1] || null;
  return { identified, compatible, version, lines: values };
}

function isPreferredUsbPort(portInfo = {}) {
  const text = [portInfo.manufacturer, portInfo.pnpId, portInfo.friendlyName, portInfo.path].filter(Boolean).join(' ');
  return /CH340|CH341|wch\.cn|Arduino|USB[- ]?Serial/i.test(text) || /^(1A86|2341|2A03)$/i.test(String(portInfo.vendorId || ''));
}

module.exports = { classifyHandshake, isPreferredUsbPort };

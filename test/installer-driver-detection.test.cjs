const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const installer = fs.readFileSync(
  path.join(root, 'studio', 'electron', 'installer.nsh'),
  'utf8'
);
const packageJson = JSON.parse(fs.readFileSync(
  path.join(root, 'studio', 'electron', 'package.json'),
  'utf8'
));

for (const required of [
  '/enum-devices /connected /problem /deviceids',
  '!ifndef BUILD_UNINSTALLER',
  '$WINDIR\\Sysnative\\pnputil.exe',
  '$SYSDIR\\pnputil.exe',
  'driver_not_needed:',
  'driver_install_required:',
  '/add-driver "$INSTDIR\\resources\\drivers\\CH341SER\\CH341SER.INF" /install',
  'USB\\VID_1A86&PID_7523',
  'USB\\VID_1A86&PID_5523',
  'USB\\VID_1A86&PID_7522',
  'USB\\VID_1A86&PID_E523',
  'USB\\VID_4348&PID_5523'
]) {
  if (!installer.includes(required)) {
    throw new Error(`Required conditional driver-install rule is missing: ${required}`);
  }
}

const detectionIndex = installer.indexOf('/enum-devices /connected /problem /deviceids');
const installIndex = installer.indexOf('/add-driver ');
if (detectionIndex < 0 || installIndex <= detectionIndex) {
  throw new Error('Bundled driver installation must occur only after device-problem detection.');
}

if (installer.includes('"$SYSDIR\\pnputil.exe" /add-driver')) {
  throw new Error('Driver installation still uses the broken direct SysWOW64 pnputil path.');
}

if (packageJson.version !== '3.6.4') {
  throw new Error(`Expected Studio 3.6 compatibility version 3.6.4, found ${packageJson.version}`);
}

console.log('Conditional CH340/CH341 problem detection and native pnputil routing verified');

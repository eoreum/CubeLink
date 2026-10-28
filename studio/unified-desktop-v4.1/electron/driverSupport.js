'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const CH34X_ID = /USB\\VID_(?:1A86&PID_(?:7523|5523|7522|E523)|4348&PID_5523)/i;

function isCh34xPort(port = {}) {
  const text = [port.vendorId, port.productId, port.manufacturer, port.pnpId, port.friendlyName, port.path]
    .filter(Boolean)
    .join(' ');
  return /(?:^|\s)1A86(?:\s|$)|4348.*5523|CH34[01]|wch\.cn|USB[- ]?SERIAL/i.test(text);
}

function pnpUtilPath(environment = process.env) {
  const windowsRoot = environment.WINDIR || environment.SystemRoot || 'C:\\Windows';
  const candidates = [
    path.join(windowsRoot, 'System32', 'pnputil.exe'),
    path.join(windowsRoot, 'Sysnative', 'pnputil.exe')
  ];
  return candidates.find(candidate => fs.existsSync(candidate)) || 'pnputil.exe';
}

async function diagnoseCh340({ listPorts, run = execFileAsync, platform = process.platform, environment = process.env } = {}) {
  if (platform !== 'win32') return { ok: true, state: 'unsupported', title: 'Windows에서만 드라이버를 점검합니다.' };

  let ports = [];
  try { ports = typeof listPorts === 'function' ? await listPorts() : []; } catch (_) {}
  const readyPorts = ports.filter(isCh34xPort).map(port => port.path).filter(Boolean);
  if (readyPorts.length) {
    return { ok: true, state: 'ready', ports: readyPorts, title: `CH340 COM 포트 준비됨 · ${readyPorts.join(', ')}` };
  }

  try {
    const result = await run(pnpUtilPath(environment), ['/enum-devices', '/connected', '/problem', '/deviceids'], {
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024
    });
    const output = `${result && result.stdout || ''}\n${result && result.stderr || ''}`;
    if (CH34X_ID.test(output)) {
      return {
        ok: true,
        state: 'driver_required',
        title: 'CH340 장치는 연결됐지만 드라이버가 필요합니다.',
        detail: '아래 설치 버튼을 누르면 Windows 관리자 승인 후 드라이버를 설치합니다.'
      };
    }
    return {
      ok: true,
      state: 'not_connected',
      title: '연결된 CH340 보드를 찾지 못했습니다.',
      detail: 'Nano 보드와 데이터 USB 케이블을 연결한 뒤 다시 점검하세요.'
    };
  } catch (error) {
    return {
      ok: false,
      state: 'check_failed',
      title: 'CH340 상태를 자동으로 확인하지 못했습니다.',
      detail: 'Windows 장치 관리자에서 USB-SERIAL CH340 또는 COM 포트를 확인하세요.',
      error: String(error && error.message || error)
    };
  }
}

function quotePowerShell(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function installCh340({ driverInfPath, run = execFileAsync, platform = process.platform, environment = process.env } = {}) {
  if (platform !== 'win32') return { ok: false, code: 'UNSUPPORTED', message: 'Windows에서만 드라이버를 설치할 수 있습니다.' };
  if (!driverInfPath || !fs.existsSync(driverInfPath)) {
    return { ok: false, code: 'DRIVER_MISSING', message: '포터블 파일에 포함된 CH340 드라이버를 찾지 못했습니다.' };
  }

  const command = [
    `$driver = ${quotePowerShell(driverInfPath)}`,
    `$tool = ${quotePowerShell(pnpUtilPath(environment))}`,
    "$process = Start-Process -FilePath $tool -ArgumentList @('/add-driver', ('\"' + $driver + '\"'), '/install') -Verb RunAs -Wait -PassThru",
    'exit $process.ExitCode'
  ].join('; ');
  const encoded = Buffer.from(command, 'utf16le').toString('base64');

  try {
    await run('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded], {
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024
    });
    return { ok: true, code: 'INSTALLED', message: 'CH340 드라이버 설치가 완료되었습니다.' };
  } catch (error) {
    const output = `${error && error.stdout || ''}\n${error && error.stderr || ''}\n${error && error.message || ''}`;
    const cancelled = /1223|canceled|cancelled|취소/i.test(output);
    return {
      ok: false,
      code: cancelled ? 'CANCELLED' : 'INSTALL_FAILED',
      message: cancelled
        ? '관리자 승인이 취소되어 드라이버를 설치하지 않았습니다.'
        : '드라이버를 설치하지 못했습니다. 학교 전산 담당자에게 관리자 설치를 요청하세요.'
    };
  }
}

module.exports = { CH34X_ID, diagnoseCh340, installCh340, isCh34xPort };

'use strict';

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { classifyHandshake, isPreferredUsbPort } = require('./protocol');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

class ArmSerialController {
  constructor(send) {
    this.send = send;
    this.port = null;
    this.parser = null;
  }

  isOpen() { return Boolean(this.port && this.port.isOpen); }

  async listPorts() {
    try { return await SerialPort.list(); } catch (_) { return []; }
  }

  close() {
    return new Promise(resolve => {
      if (!this.port || !this.port.isOpen) {
        this.port = null;
        this.parser = null;
        resolve();
        return;
      }
      const target = this.port;
      target.close(() => {
        if (this.port === target) { this.port = null; this.parser = null; }
        resolve();
      });
    });
  }

  async connect(portPath) {
    if (!portPath) return { ok: false, error: 'Serial port path is required.' };
    await this.close();
    return new Promise(resolve => {
      let settled = false;
      const next = new SerialPort({ path: portPath, baudRate: 115200, autoOpen: false });
      this.port = next;
      this.parser = next.pipe(new ReadlineParser({ delimiter: '\n' }));
      this.parser.on('data', data => this.send('arm-serial-data', data));
      next.once('open', () => {
        settled = true;
        this.send('arm-serial-status', 'open');
        resolve({ ok: true });
      });
      next.on('error', error => {
        this.send('arm-serial-status', `error:${error.message}`);
        if (!settled) { settled = true; resolve({ ok: false, error: error.message }); }
      });
      next.on('close', () => {
        this.send('arm-serial-status', 'closed');
        if (this.port === next) { this.port = null; this.parser = null; }
      });
      next.open(error => {
        if (error && !settled) {
          settled = true;
          this.send('arm-serial-status', `error:${error.message}`);
          resolve({ ok: false, error: error.message });
        }
      });
    });
  }

  write(data) {
    return new Promise(resolve => {
      if (!this.isOpen()) return resolve({ ok: false, error: 'Serial port is not open.' });
      this.port.write(data, error => {
        if (error) return resolve({ ok: false, error: error.message });
        this.port.drain(drainError => resolve(drainError ? { ok: false, error: drainError.message } : { ok: true }));
      });
    });
  }
}

function friendlyError(error) {
  const raw = String(error && (error.message || error) || '알 수 없는 오류');
  if (/access denied|permission|denied|busy|resource/i.test(raw)) return { code: 'PORT_BUSY', message: '다른 프로그램이 이 포트를 사용 중이거나 접근 권한이 없습니다.' };
  if (/cannot find|not found|no such file|unknown port/i.test(raw)) return { code: 'NOT_FOUND', message: '보드가 분리되었거나 Windows가 COM 포트를 인식하지 못했습니다.' };
  return { code: 'OPEN_FAILED', message: '포트를 열 수 없습니다. USB 케이블, CH340 드라이버, 보드 인식 상태를 확인하세요.', detail: raw };
}

class ConveyorSerialController {
  constructor(send) {
    this.send = send;
    this.port = null;
    this.parser = null;
    this.selectedPath = null;
    this.reconnectEnabled = true;
    this.reconnectBusy = false;
    this.closingByUser = false;
  }

  isOpen() { return Boolean(this.port && this.port.isOpen); }
  hasPendingReconnect() { return Boolean(this.reconnectEnabled && this.selectedPath); }

  async listPorts() {
    const ports = await SerialPort.list();
    return ports.map(info => ({
      path: info.path,
      manufacturer: info.manufacturer || '',
      serialNumber: info.serialNumber || '',
      pnpId: info.pnpId || '',
      locationId: info.locationId || '',
      vendorId: info.vendorId || '',
      productId: info.productId || '',
      preferred: isPreferredUsbPort(info)
    })).sort((a, b) => Number(b.preferred) - Number(a.preferred) || a.path.localeCompare(b.path));
  }

  close({ user = false } = {}) {
    this.closingByUser = user;
    return new Promise(resolve => {
      if (!this.isOpen()) {
        this.port = null;
        this.parser = null;
        this.closingByUser = false;
        resolve();
        return;
      }
      const target = this.port;
      target.close(() => {
        if (this.port === target) { this.port = null; this.parser = null; }
        this.closingByUser = false;
        resolve();
      });
    });
  }

  async open(portPath, { remember = true, reconnected = false } = {}) {
    if (!portPath) return { ok: false, error: { code: 'NO_PORT', message: '연결할 COM 포트를 선택하세요.' } };
    await this.close();
    if (remember) this.selectedPath = portPath;
    return new Promise(resolve => {
      let settled = false;
      const next = new SerialPort({ path: portPath, baudRate: 115200, autoOpen: false });
      const parser = next.pipe(new ReadlineParser({ delimiter: '\n' }));
      this.port = next;
      this.parser = parser;
      parser.on('data', line => this.send('conveyor-serial-data', String(line).replace(/\r$/, '')));
      next.once('open', () => {
        settled = true;
        this.send('conveyor-serial-status', { state: reconnected ? 'reconnected' : 'open', path: portPath });
        resolve({ ok: true, path: portPath });
      });
      next.on('error', error => {
        const mapped = friendlyError(error);
        this.send('conveyor-serial-status', { state: 'error', path: portPath, error: mapped });
        if (!settled) { settled = true; resolve({ ok: false, error: mapped }); }
      });
      next.on('close', () => {
        if (this.port === next) { this.port = null; this.parser = null; }
        this.send('conveyor-serial-status', { state: 'closed', path: portPath, reconnecting: this.reconnectEnabled && !this.closingByUser });
      });
      next.open(error => {
        if (error && !settled) { settled = true; resolve({ ok: false, error: friendlyError(error) }); }
      });
    });
  }

  async probe(portPath) {
    if (!portPath) return { ok: false, error: { code: 'NO_PORT', message: '포트를 선택하세요.' } };
    if (this.isOpen()) return { ok: false, error: { code: 'CONNECTED', message: '현재 연결을 해제한 뒤 장치 검색을 실행하세요.' } };
    return new Promise(resolve => {
      const lines = [];
      let finished = false;
      const probe = new SerialPort({ path: portPath, baudRate: 115200, autoOpen: false });
      const parser = probe.pipe(new ReadlineParser({ delimiter: '\n' }));
      parser.on('data', line => lines.push(String(line).replace(/\r$/, '').trim()));
      const finish = result => {
        if (finished) return;
        finished = true;
        const done = () => resolve(result);
        if (probe.isOpen) probe.close(done); else done();
      };
      probe.open(async error => {
        if (error) return finish({ ok: false, path: portPath, error: friendlyError(error) });
        try {
          await wait(950);
          probe.write('HELLO\nSTATUS\nHELLO?\n');
          await wait(1650);
          finish({ ok: true, path: portPath, ...classifyHandshake(lines) });
        } catch (probeError) {
          finish({ ok: false, path: portPath, error: friendlyError(probeError) });
        }
      });
      setTimeout(() => finish({ ok: true, path: portPath, ...classifyHandshake(lines), timedOut: true }), 3300);
    });
  }

  async autoDiscover() {
    const ports = await this.listPorts();
    const results = [];
    for (const info of ports) {
      const result = await this.probe(info.path);
      results.push({ ...info, ...result });
      if (result.ok && result.identified) break;
    }
    const verified = results.find(result => result.ok && result.identified);
    const compatible = verified || results.find(result => result.ok && result.compatible);
    return { ok: Boolean(compatible), match: compatible || null, ports, results };
  }

  write(data) {
    return new Promise(resolve => {
      if (!this.isOpen()) return resolve({ ok: false, error: { code: 'NOT_OPEN', message: '연결된 COM 포트가 없습니다.' } });
      this.port.write(String(data), error => {
        if (error) return resolve({ ok: false, error: friendlyError(error) });
        this.port.drain(drainError => resolve(drainError ? { ok: false, error: friendlyError(drainError) } : { ok: true }));
      });
    });
  }

  async disconnect() {
    this.reconnectEnabled = false;
    this.selectedPath = null;
    await this.close({ user: true });
    this.send('conveyor-serial-status', { state: 'disconnected' });
    return { ok: true };
  }

  setAutoReconnect(enabled) {
    this.reconnectEnabled = Boolean(enabled);
    return { ok: true, enabled: this.reconnectEnabled };
  }

  async reconnectTick() {
    if (!this.reconnectEnabled || this.reconnectBusy || !this.selectedPath || this.isOpen()) return;
    this.reconnectBusy = true;
    try {
      const ports = await this.listPorts();
      if (!ports.some(info => info.path === this.selectedPath)) return;
      this.send('conveyor-serial-status', { state: 'reconnecting', path: this.selectedPath });
      const result = await this.open(this.selectedPath, { remember: false, reconnected: true });
      if (result.ok) setTimeout(() => this.write('HELLO\nSTATUS\n'), 1000);
    } finally {
      this.reconnectBusy = false;
    }
  }

  async shutdown() {
    this.reconnectEnabled = false;
    this.selectedPath = null;
    await this.close({ user: true });
  }
}

module.exports = { ArmSerialController, ConveyorSerialController, friendlyError };

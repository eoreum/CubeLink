/* Capacitor(Android) USB Serial adapter.
   Electron support is installed by the second adapter below. */
(function () {
  'use strict';

  if (!window.Capacitor || window.cubelink) return;

  const getUsbSerial = () =>
    window.Capacitor?.Plugins?.UsbSerial ||
    window.Capacitor?.compiledPlugins?.UsbSerial;

  class CapacitorSerialPort {
    constructor(deviceInfo) {
      this.info = deviceInfo;
      this.isOpen = false;
      this.readBuffer = [];
      this.readResolvers = [];
      this.listenerHandle = null;
    }

    getInfo() {
      return {
        usbVendorId: this.info.vendorId,
        usbProductId: this.info.productId
      };
    }

    async open(options = {}) {
      const usbSerial = getUsbSerial();
      if (!usbSerial) throw new Error('USB Serial plugin is unavailable.');

      const result = await usbSerial.open({
        deviceId: this.info.deviceId,
        baudRate: options.baudRate || 115200,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });
      if (!result.success) throw new Error(result.error || 'Unable to open the serial port.');

      this.isOpen = true;
      this.listenerHandle = await usbSerial.addListener('dataReceived', (event) => {
        const bytes = Uint8Array.from(atob(event.data), c => c.charCodeAt(0));
        const resolver = this.readResolvers.shift();
        if (resolver) resolver({ value: bytes, done: false });
        else this.readBuffer.push(bytes);
      });
    }

    async close() {
      const usbSerial = getUsbSerial();
      if (this.listenerHandle) await this.listenerHandle.remove();
      if (usbSerial) await usbSerial.close({ deviceId: this.info.deviceId });
      this.isOpen = false;
      while (this.readResolvers.length) {
        this.readResolvers.shift()({ value: undefined, done: true });
      }
    }

    get readable() {
      const port = this;
      return {
        getReader() {
          return {
            async read() {
              if (!port.isOpen) return { value: undefined, done: true };
              if (port.readBuffer.length) {
                return { value: port.readBuffer.shift(), done: false };
              }
              return new Promise(resolve => port.readResolvers.push(resolve));
            },
            releaseLock() {},
            cancel() { return Promise.resolve(); }
          };
        }
      };
    }

    get writable() {
      const port = this;
      return {
        getWriter() {
          return {
            async write(data) {
              const usbSerial = getUsbSerial();
              if (!usbSerial || !port.isOpen) throw new Error('Serial port is not open.');
              const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
              let binary = '';
              for (const byte of bytes) binary += String.fromCharCode(byte);
              await usbSerial.write({ deviceId: port.info.deviceId, data: btoa(binary) });
            },
            releaseLock() {},
            close() { return Promise.resolve(); }
          };
        }
      };
    }
  }

  const serial = {
    async requestPort() {
      const usbSerial = getUsbSerial();
      if (!usbSerial) throw new DOMException('USB Serial plugin is unavailable.', 'NotFoundError');
      const result = await usbSerial.listDevices();
      const devices = result.devices || [];
      if (!devices.length) throw new DOMException('No serial device found.', 'NotFoundError');
      const chosen = devices[0];
      const permission = await usbSerial.requestPermission({ deviceId: chosen.deviceId });
      if (!permission.granted) throw new DOMException('USB permission denied.', 'SecurityError');
      return new CapacitorSerialPort(chosen);
    },
    async getPorts() {
      const usbSerial = getUsbSerial();
      if (!usbSerial) return [];
      const result = await usbSerial.listDevices();
      return (result.devices || []).map(device => new CapacitorSerialPort(device));
    },
    addEventListener() {},
    removeEventListener() {}
  };

  Object.defineProperty(navigator, 'serial', {
    value: serial,
    configurable: true,
    writable: false
  });
})();

/* ════════════════════════════════════════════════════════════════
   CUBELINK Electron — Web Serial 폴리필
   웹앱은 navigator.serial 을 그대로 사용.
   이 폴리필이 그 호출을 window.cubelink (Electron IPC) 로 연결한다.
   웹앱 코드(index.html / app.js 등)는 수정하지 않음.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Electron(window.cubelink)이 없으면 = 일반 브라우저 → 폴리필 미적용
  if (!window.cubelink) {
    console.log('[polyfill] 일반 브라우저 환경 — Web Serial 폴리필 건너뜀');
    return;
  }
  console.log('[polyfill] Electron 환경 감지 — Web Serial 폴리필 적용');

  const enc = new TextEncoder();

  // ── 수신 데이터를 웹앱의 reader로 흘려보내기 위한 큐 ──
  // main → onData(줄단위 문자열) → 여기 큐 → port.readable 스트림
  let dataListeners = [];
  window.cubelink.onData((line) => {
    // main.js의 ReadlineParser가 '\n' 제거하고 주므로 다시 붙여준다
    const chunk = line + '\n';
    dataListeners.forEach((fn) => { try { fn(chunk); } catch (_) {} });
  });

  // 연결 상태 (open/closed/error) → disconnect 이벤트로 변환
  let statusListeners = [];
  window.cubelink.onStatus((s) => {
    statusListeners.forEach((fn) => { try { fn(s); } catch (_) {} });
  });

  // ─────────────────────────────────────────────
  //  가짜 SerialPort 객체
  // ─────────────────────────────────────────────
  function makePort(portInfo) {
    const evtTarget = new EventTarget();
    let opened = false;
    let readableStream = null;
    let writableStream = null;

    // 상태 변화 감지 → disconnect 이벤트 발생
    statusListeners.push((s) => {
      if ((s === 'closed' || (typeof s === 'string' && s.startsWith('error'))) && opened) {
        opened = false;
        evtTarget.dispatchEvent(new Event('disconnect'));
      }
    });

    const port = {
      // ── 포트 열기 ──
      async open(options) {
        const path = portInfo && portInfo._path;
        const res = await window.cubelink.connect(path);
        if (!res || !res.ok) {
          throw new Error(res && res.error ? res.error : '포트 열기 실패');
        }
        opened = true;

        // readable: main에서 오는 데이터를 ReadableStream으로 노출
        readableStream = new ReadableStream({
          start(controller) {
            const listener = (chunk) => {
              try { controller.enqueue(enc.encode(chunk)); } catch (_) {}
            };
            dataListeners.push(listener);
            this._listener = listener;
          },
          cancel() {
            const i = dataListeners.indexOf(this._listener);
            if (i >= 0) dataListeners.splice(i, 1);
          }
        });

        // writable: 웹앱이 getWriter().write() 하면 cubelink.write로 전송
        writableStream = new WritableStream({
          async write(chunk) {
            // chunk는 Uint8Array → 문자열로 복원
            const text = new TextDecoder().decode(chunk);
            const result = await window.cubelink.write(text);
            if (!result || !result.ok) {
              throw new Error(result && result.error ? result.error : 'Serial write failed.');
            }
          }
        });
      },

      get readable() { return readableStream; },
      get writable() { return writableStream; },

      // ── DTR/RTS 신호 (Electron main에서 자동 처리하므로 no-op) ──
      async setSignals() { return; },

      // ── 포트 닫기 ──
      async close() {
        opened = false;
        try { await window.cubelink.disconnect(); } catch (_) {}
        readableStream = null;
        writableStream = null;
      },

      // ── 좀비 포트 회피용 (Electron에선 불필요, no-op) ──
      async forget() { return; },

      // ── 이벤트 리스너 ──
      addEventListener: (t, cb) => evtTarget.addEventListener(t, cb),
      removeEventListener: (t, cb) => evtTarget.removeEventListener(t, cb),

      getInfo: () => ({
        usbVendorId: portInfo.usbVendorId || 0x1a86,
        usbProductId: portInfo.usbProductId || 0x7523,
        portPath: portInfo._path || ''
      })
    };

    return port;
  }

  // ─────────────────────────────────────────────
  //  navigator.serial 구현
  // ─────────────────────────────────────────────
  const serialEvtTarget = new EventTarget();

  const serial = {
    // 승인된 포트 목록 → Electron은 실제 COM 포트 목록 반환
    async getPorts() {
      const list = await window.cubelink.listPorts();
      return (list || []).map((p) => makePort({
        _path: p.path,
        usbVendorId: p.vendorId ? parseInt(p.vendorId, 16) : undefined,
        usbProductId: p.productId ? parseInt(p.productId, 16) : undefined
      }));
    },

    // 포트 선택 → Electron은 첫 번째(또는 CH340) 포트 자동 선택
    async requestPort(options = {}) {
      const list = await window.cubelink.listPorts();
      if (!list || list.length === 0) {
        const e = new Error('No port selected by the user.');
        e.name = 'NotFoundError';
        throw e;
      }
      const requestedPath = options && options.path;
      const requested = requestedPath
        ? list.find((p) => String(p.path).toLowerCase() === String(requestedPath).toLowerCase())
        : null;
      // 명시적으로 고른 포트를 우선하고, 구버전 호출은 CH340을 우선한다.
      const ch340 = list.find((p) =>
        (p.vendorId && p.vendorId.toLowerCase() === '1a86') ||
        (p.manufacturer && /wch|ch340/i.test(p.manufacturer))
      );
      const chosen = requested || ch340 || list[0];
      return makePort({
        _path: chosen.path,
        usbVendorId: chosen.vendorId ? parseInt(chosen.vendorId, 16) : undefined,
        usbProductId: chosen.productId ? parseInt(chosen.productId, 16) : undefined
      });
    },

    addEventListener: (t, cb) => serialEvtTarget.addEventListener(t, cb),
    removeEventListener: (t, cb) => serialEvtTarget.removeEventListener(t, cb)
  };

  // navigator.serial 주입
  try {
    Object.defineProperty(navigator, 'serial', {
      value: serial,
      configurable: true,
      writable: false
    });
    console.log('[polyfill] navigator.serial 주입 완료');
  } catch (e) {
    console.warn('[polyfill] navigator.serial 주입 실패:', e.message);
  }

  // TextDecoderStream / TextEncoderStream 은 Chromium(Electron)에 이미 있음
})();

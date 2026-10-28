(function() {
  'use strict';

  const diagnostics = window.CubeLinkServoDiagnostics;
  if (!diagnostics) return;

  const encoder = new TextEncoder();
  let selectedPin = 6;

  const byId = id => document.getElementById(id);
  const connectedAndReady = () => !!(
    window._serialPort && window._serialPort.writable &&
    window._cubeSafety && window._cubeSafety.initialized &&
    (window._connState === 'ready' || window._connState === 'connected')
  );

  function status(message, kind) {
    const element = byId('servoDiagnosticStatus');
    if (!element) return;
    element.textContent = message;
    element.dataset.kind = kind || 'idle';
  }

  function setBusy(busy) {
    ['servoDiagnosticPin', 'servoDiagnosticAngle', 'servoDiagnosticMove', 'servoDiagnosticRoundTrip']
      .forEach(id => { const element = byId(id); if (element) element.disabled = busy; });
    const stop = byId('servoDiagnosticStop');
    if (stop) {
      stop.disabled = !busy;
      if (!busy) stop.blur();
    }
    window._servoDiagnosticActive = busy;
  }

  function updateProfile() {
    selectedPin = Number(byId('servoDiagnosticPin')?.value || 6);
    const profile = diagnostics.getProfile(selectedPin);
    const slider = byId('servoDiagnosticAngle');
    if (slider) {
      slider.min = String(profile.min);
      slider.max = String(profile.max);
      slider.value = String(profile.target);
    }
    const value = byId('servoDiagnosticAngleValue');
    if (value) value.textContent = `${profile.target}°`;
    const range = byId('servoDiagnosticRange');
    if (range) range.textContent = `검사 범위 ${profile.min}°–${profile.max}° · 복귀 ${profile.home}°`;
    status(`D${profile.pin} ${profile.name}를 선택했습니다.`, 'idle');
  }

  async function sendServoCommand(pin, angle, run) {
    if (run.cancelled) throw new diagnostics.DiagnosticStoppedError();
    const port = window._serialPort;
    if (!port || !port.writable || !connectedAndReady()) {
      throw new Error('CubeLink 연결 또는 안전 초기화 상태를 확인하세요.');
    }

    let writer = null;
    let writeStarted = false;
    try {
      writer = await window.acquireSerialWriter(port, 1500);
      if (run.cancelled) throw new diagnostics.DiagnosticStoppedError();

      const offset = window.getServoOffset ? Number(window.getServoOffset(pin)) || 0 : 0;
      const hardwareLimits = {
        6: [10, 170], 9: [30, 170], 10: [10, 160], 11: [50, 120]
      };
      const limits = hardwareLimits[pin];
      const realAngle = Math.max(limits[0], Math.min(limits[1], Math.round(angle + offset)));
      const writePromise = writer.write(encoder.encode(`S,${pin},${realAngle}\n`));
      writeStarted = true;
      try {
        await writePromise;
      } finally {
        try { writer.releaseLock(); } catch (_) {}
      }
      if (run.cancelled) throw new diagnostics.DiagnosticStoppedError();

      window.servoAngles = window.servoAngles || {};
      window.servoAngles[pin] = angle;
      if (window.Sim && typeof window.Sim.setServoAngle === 'function') {
        window.Sim.setServoAngle(pin, angle);
      }
      if (window.appendSerialLog) {
        window.appendSerialLog(`🧪 개별 검사 D${pin}: ${angle}° 명령`);
      }
    } finally {
      if (writer && !writeStarted) {
        try { writer.releaseLock(); } catch (_) {}
      }
    }
  }

  const controller = diagnostics.createController({
    send: sendServoCommand,
    onState(event) {
      const profile = event.profile;
      if (event.state === 'running') {
        setBusy(true);
        status(`D${event.pin} ${profile.name} 검사 준비 중…`, 'running');
      } else if (event.state === 'moving') {
        status(`D${event.pin} ${profile.name} ${event.angle}° 이동 · ${event.step}/${event.total}`, 'running');
      } else if (event.state === 'complete') {
        setBusy(false);
        status(`D${event.pin} ${profile.name} 검사가 완료되었습니다.`, 'success');
      } else if (event.state === 'stopped') {
        setBusy(false);
        status(`D${event.pin} 검사를 중지했습니다. 연결은 유지됩니다.`, 'warn');
      } else if (event.state === 'failed') {
        setBusy(false);
        status(`D${event.pin} 검사 실패: ${event.error?.message || '알 수 없는 오류'} · 연결은 유지됩니다.`, 'error');
      }
    }
  });

  async function start(mode) {
    if (controller.isActive()) return;
    if (!connectedAndReady()) {
      status('먼저 CubeLink 연결과 안전 초기화를 완료하세요.', 'error');
      return;
    }
    if (window._runtimeRunning) {
      status('블록 실행을 중지한 뒤 개별 검사를 시작하세요.', 'error');
      return;
    }
    if (window.isJoystickManualActive && window.isJoystickManualActive()) {
      status('조이스틱 수동조작을 종료한 뒤 개별 검사를 시작하세요.', 'error');
      return;
    }
    const angle = Number(byId('servoDiagnosticAngle').value);
    try {
      await controller.start({
        pin: selectedPin,
        target: angle,
        mode,
        cycles: 2,
        dwellMs: 800,
        timeoutMs: 3000
      });
    } catch (error) {
      if (!error || error.code !== 'STOPPED') console.warn('서보 개별 검사 실패:', error);
    }
  }

  window.stopServoDiagnostic = function() {
    return controller.stop();
  };
  window.isServoDiagnosticActive = function() {
    return controller.isActive();
  };
  window.handleServoDiagnosticFault = function(fault) {
    const detail = fault && fault.pin
      ? `D${fault.pin} 보호 작동 (${fault.milliAmps || 0}mA)`
      : '서보 보호 작동';
    return controller.fail(new Error(detail));
  };

  function openPanel() {
    byId('servoDiagnosticPanel').style.display = 'flex';
    updateProfile();
  }

  function closePanel() {
    controller.stop();
    byId('servoDiagnosticPanel').style.display = 'none';
  }

  function bind() {
    byId('btnServoDiagnostic')?.addEventListener('click', openPanel);
    byId('servoDiagnosticClose')?.addEventListener('click', closePanel);
    byId('servoDiagnosticPin')?.addEventListener('change', updateProfile);
    byId('servoDiagnosticAngle')?.addEventListener('input', event => {
      byId('servoDiagnosticAngleValue').textContent = `${event.target.value}°`;
    });
    byId('servoDiagnosticMove')?.addEventListener('click', () => start('move'));
    byId('servoDiagnosticRoundTrip')?.addEventListener('click', () => start('roundTrip'));
    byId('servoDiagnosticStop')?.addEventListener('click', () => controller.stop());
    byId('servoDiagnosticPanel')?.addEventListener('mousedown', event => {
      if (event.target === byId('servoDiagnosticPanel')) closePanel();
    });
    updateProfile();
    setBusy(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();

/**
 * CubeLink Studio digital-twin run layout and joystick manual controller.
 * New firmware owns manual motion through JM,1/JM,0. Older compatible firmware
 * can use the Studio-mediated S-command fallback without angle jumps.
 */
(function () {
  'use strict';

  const SHORTCUT_LABEL = 'Ctrl+Alt+J';
  const FALLBACK_TICK_MS = 40;
  const FALLBACK_DEADZONE = 120;
  const FALLBACK_FILTER_DIVISOR = 4;
  const FALLBACK_MAX_STEP = 2;
  const LIMITS = {
    6: [10, 170],
    9: [30, 170],
    10: [10, 160],
    11: [50, 120]
  };

  const state = {
    layoutActive: false,
    manualActive: false,
    manualStarting: false,
    nativeManual: false,
    fallbackTimer: null,
    fallbackBusy: false,
    filtered: { x1: 0, y1: 0, x2: 0, y2: 0 },
    previousAxis: { left: '', right: '' },
    savedNodes: new Map()
  };

  function rememberAndMove(node, parent) {
    if (!node || !parent) return;
    if (!state.savedNodes.has(node)) {
      state.savedNodes.set(node, { parent: node.parentNode, next: node.nextSibling });
    }
    parent.appendChild(node);
  }

  function restoreNode(node, location) {
    if (!node || !location || !location.parent) return;
    if (location.next && location.next.parentNode === location.parent) {
      location.parent.insertBefore(node, location.next);
    } else {
      location.parent.appendChild(node);
    }
  }

  function selectSimulatorTab() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === 'sim');
    });
    document.querySelectorAll('.tab-body').forEach(body => {
      body.classList.toggle('active', body.dataset.body === 'sim');
    });
  }

  function updateManualBadge() {
    const badge = document.getElementById('manualModeBadge');
    const button = document.getElementById('btnManualTwin');
    if (badge) {
      badge.textContent = state.manualActive
        ? (state.nativeManual ? '하드웨어 수동조작' : 'Studio 수동조작')
        : '프로그램 실행';
      badge.classList.toggle('active', state.manualActive);
    }
    if (button) {
      button.textContent = state.manualActive ? '⏹ 수동조작 종료' : '🕹 수동조작';
      button.setAttribute('aria-pressed', state.manualActive ? 'true' : 'false');
    }
  }

  function enterDigitalTwinLayout(options) {
    options = options || {};
    if (state.layoutActive) {
      if (options.manual != null) state.manualActive = !!options.manual;
      updateManualBadge();
      return;
    }
    const telemetryBody = document.getElementById('digitalTwinTelemetryBody');
    const leftPanel = document.querySelector('.panel-left');
    const servoRow = document.getElementById('servoTelemetryRow');
    const joystickRow = document.getElementById('joystickTelemetryRow');
    const monitor = document.getElementById('serialMonitorBar');
    if (!telemetryBody || !leftPanel || !servoRow || !joystickRow || !monitor) return;

    state.layoutActive = true;
    state.manualActive = !!options.manual;
    selectSimulatorTab();
    rememberAndMove(servoRow, telemetryBody);
    rememberAndMove(joystickRow, telemetryBody);
    rememberAndMove(monitor, leftPanel);
    document.body.classList.add('digital-twin-running');
    updateManualBadge();
    if (window.Sim && typeof window.Sim.init === 'function') window.Sim.init();
    window.dispatchEvent(new Event('resize'));
  }

  function exitDigitalTwinLayout(options) {
    options = options || {};
    if (!state.layoutActive || (state.manualActive && !options.force)) return;
    state.layoutActive = false;
    document.body.classList.remove('digital-twin-running');
    for (const [node, location] of state.savedNodes.entries()) restoreNode(node, location);
    state.savedNodes.clear();
    window.dispatchEvent(new Event('resize'));
  }

  function appendLog(message) {
    if (window.appendSerialLog) window.appendSerialLog(message);
  }

  function clamp(pin, value) {
    const range = LIMITS[pin] || [0, 180];
    return Math.max(range[0], Math.min(range[1], value));
  }

  function dominantAxis(dx, dy, previous) {
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax < FALLBACK_DEADZONE && ay < FALLBACK_DEADZONE) return '';
    if (previous === 'x' && ax >= FALLBACK_DEADZONE && ax + 35 >= ay) return 'x';
    if (previous === 'y' && ay >= FALLBACK_DEADZONE && ay + 35 >= ax) return 'y';
    return ax >= ay ? 'x' : 'y';
  }

  function filteredDelta(key, raw) {
    state.filtered[key] += (raw - state.filtered[key]) / FALLBACK_FILTER_DIVISOR;
    return state.filtered[key];
  }

  function speedStep(delta) {
    const amount = Math.abs(delta);
    if (amount < FALLBACK_DEADZONE) return 0;
    return Math.max(1, Math.min(FALLBACK_MAX_STEP,
      Math.round((amount - FALLBACK_DEADZONE) / 220) + 1));
  }

  function collectFallbackMoves() {
    const left = window.joystickData && window.joystickData.left;
    const right = window.joystickData && window.joystickData.right;
    if (!left || !right) return [];

    const dx1 = filteredDelta('x1', Number(left.x) - 512);
    const dy1 = filteredDelta('y1', Number(left.y) - 512);
    const dx2 = filteredDelta('x2', Number(right.x) - 512);
    const dy2 = filteredDelta('y2', Number(right.y) - 512);
    const axis1 = dominantAxis(dx1, dy1, state.previousAxis.left);
    const axis2 = dominantAxis(dx2, dy2, state.previousAxis.right);
    state.previousAxis.left = axis1;
    state.previousAxis.right = axis2;

    const moves = [];
    const add = (pin, direction, magnitude) => {
      const current = Number(window.servoAngles && window.servoAngles[pin]);
      const start = Number.isFinite(current) ? current : 90;
      const target = clamp(pin, start + direction * speedStep(magnitude));
      if (target !== start) moves.push({ pin, angle: target });
    };

    if (axis1 === 'y') add(6, dy1 < 0 ? -1 : 1, dy1);
    else if (axis1 === 'x') add(9, dx1 < 0 ? 1 : -1, dx1);
    if (axis2 === 'y') add(11, dy2 < 0 ? 1 : -1, dy2);
    else if (axis2 === 'x') add(10, dx2 < 0 ? -1 : 1, dx2);
    return moves;
  }

  async function fallbackTick() {
    if (!state.manualActive || state.nativeManual || state.fallbackBusy) return;
    if (!window._serialPort || !window._serialPort.writable) {
      await stopJoystickManual({ localOnly: true });
      return;
    }
    const moves = collectFallbackMoves();
    if (!moves.length) return;
    state.fallbackBusy = true;
    try {
      for (const move of moves) {
        await window.sendBoardCommand(`S,${move.pin},${move.angle}`);
        window.servoAngles[move.pin] = move.angle;
        if (window.Sim && typeof window.Sim.setServo === 'function') {
          window.Sim.setServo(move.pin, move.angle);
        }
      }
    } catch (error) {
      appendLog('🛑 수동조작 전송 중단: ' + error.message);
      await stopJoystickManual({ localOnly: true });
    } finally {
      state.fallbackBusy = false;
    }
  }

  function startFallbackController() {
    if (state.fallbackTimer) clearInterval(state.fallbackTimer);
    state.filtered = { x1: 0, y1: 0, x2: 0, y2: 0 };
    state.previousAxis = { left: '', right: '' };
    state.fallbackTimer = setInterval(fallbackTick, FALLBACK_TICK_MS);
  }

  async function waitForRuntimeStop() {
    if (!window._runtimeRunning) return true;
    window._runtimeRunning = false;
    const deadline = Date.now() + 2500;
    while (Date.now() < deadline) {
      if (!window._serialPort || !window._serialPort.writable || !window._serialPort.writable.locked) return true;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return false;
  }

  async function startJoystickManual(options) {
    options = options || {};
    if (state.manualActive || state.manualStarting) return;
    if (!window._serialPort || !window._serialPort.writable ||
        !window._cubeSafety || !window._cubeSafety.initialized) {
      if (window.showToast) window.showToast('로봇 연결 및 안전 초기화를 먼저 완료하세요.', 'warn', 3500);
      return;
    }
    state.manualStarting = true;
    try {
      if (!await waitForRuntimeStop()) throw new Error('실행 중인 프로그램이 아직 정지되지 않았습니다.');
      window.twinUnlocked = true;
      if (window.setActionMode) window.setActionMode('twin', { silent: true });
      state.nativeManual = window._cubeSafety.manualProtocol === 'JM1';
      if (state.nativeManual && !options.fromBoard) {
        const responseWait = window.waitForBoardResponse(['MANUAL_ACTIVE', 'ERR'], 3000);
        await window.sendBoardCommand('JM,1');
        const response = await responseWait;
        if (!response.startsWith('MANUAL_ACTIVE')) throw new Error(response);
      }
      state.manualActive = true;
      window._manualJoystickActive = true;
      enterDigitalTwinLayout({ manual: true });
      if (!state.nativeManual) startFallbackController();
      appendLog(state.nativeManual
        ? '🕹 하드웨어 수동조작 시작 · 펌웨어 데드존/스무딩/속도 제한 적용'
        : '🕹 Studio 수동조작 시작 · 이전 펌웨어 호환 스무딩 적용');
      if (window.showToast) window.showToast(`🕹 수동조작 시작 · ${SHORTCUT_LABEL}로 종료`, 'success', 3000);
    } catch (error) {
      state.manualActive = false;
      window._manualJoystickActive = false;
      exitDigitalTwinLayout({ force: true });
      if (window.showToast) window.showToast('수동조작을 시작하지 못했습니다: ' + error.message, 'error', 4500);
    } finally {
      state.manualStarting = false;
      updateManualBadge();
    }
  }

  async function stopJoystickManual(options) {
    options = options || {};
    if (!state.manualActive && !options.force) return;
    if (state.fallbackTimer) clearInterval(state.fallbackTimer);
    state.fallbackTimer = null;
    const shouldNotifyBoard = state.nativeManual && !options.localOnly &&
      window._serialPort && window._serialPort.writable;
    state.manualActive = false;
    window._manualJoystickActive = false;
    if (shouldNotifyBoard) {
      try {
        const responseWait = window.waitForBoardResponse(['MANUAL_INACTIVE', 'ERR'], 3000);
        await window.sendBoardCommand('JM,0');
        await responseWait;
      } catch (error) {
        appendLog('⚠️ 수동모드 종료 응답 없음: ' + error.message);
      }
    }
    state.nativeManual = false;
    updateManualBadge();
    exitDigitalTwinLayout({ force: true });
    appendLog('⏹ 조이스틱 수동조작 종료');
  }

  function onBoardManualModeChanged(active) {
    if (active) {
      state.nativeManual = true;
      state.manualActive = true;
      window._manualJoystickActive = true;
      window.twinUnlocked = true;
      if (window.setActionMode) window.setActionMode('twin', { silent: true });
      enterDigitalTwinLayout({ manual: true });
      appendLog('🕹 조이스틱 제스처로 하드웨어 수동조작 모드 진입');
    } else if (state.manualActive && state.nativeManual) {
      state.manualActive = false;
      window._manualJoystickActive = false;
      state.nativeManual = false;
      updateManualBadge();
      // 프로그램 실행이 수동모드를 선점한 경우에는 실행용 트윈 화면을 유지한다.
      if (!window._runtimeRunning) exitDigitalTwinLayout({ force: true });
    }
  }

  window.enterDigitalTwinLayout = enterDigitalTwinLayout;
  window.exitDigitalTwinLayout = exitDigitalTwinLayout;
  window.startJoystickManual = startJoystickManual;
  window.stopJoystickManual = stopJoystickManual;
  window.onBoardManualModeChanged = onBoardManualModeChanged;
  window.isJoystickManualActive = () => state.manualActive;

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('btnManualTwin');
    if (button) button.addEventListener('click', () => {
      if (state.manualActive) stopJoystickManual();
      else startJoystickManual();
    });
    document.addEventListener('keydown', event => {
      if (!(event.ctrlKey && event.altKey && !event.shiftKey && event.code === 'KeyJ')) return;
      event.preventDefault();
      if (state.manualActive) stopJoystickManual();
      else startJoystickManual();
    }, true);
    updateManualBadge();
  });
})();

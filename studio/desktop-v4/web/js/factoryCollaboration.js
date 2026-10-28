(function () {
  'use strict';

  const api = window.cubelink;
  const state = {
    active: false,
    paired: false,
    role: '',
    waitingForRobot: false,
    detectionCount: 0,
    clearCount: 0,
    detectionArmed: true,
    thresholdCm: 15
  };

  function $(id) { return document.getElementById(id); }
  function log(message) {
    const output = $('factoryLog');
    if (!output) return;
    const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
    output.textContent += `[${time}] ${message}\n`;
    output.scrollTop = output.scrollHeight;
  }

  function showPanel(open) { $('factoryPanel')?.classList.toggle('open', !!open); }

  function setStatus(status) {
    state.active = !!status.active;
    state.paired = !!status.paired;
    if (status.role) state.role = status.role;
    const box = $('factoryStatus');
    if (box) {
      box.className = `factory-status ${status.state || ''}`;
      box.textContent = status.detail || '협업 연결 대기';
    }
    const badge = $('factoryBadge');
    if (badge) {
      badge.classList.toggle('paired', state.paired);
      badge.textContent = state.paired ? `🏭 ${status.groupId} 모둠 연결됨` : '🏭 협업모드';
    }
    const connect = $('factoryConnectBtn');
    const disconnect = $('factoryDisconnectBtn');
    if (connect) connect.disabled = state.active;
    if (disconnect) disconnect.disabled = !state.active;
    if (status.detail) log(status.detail);
  }

  async function writeSerialCommand(command) {
    const port = window._serialPort;
    if (!port || !port.writable) {
      log(`USB 장치가 없어 '${command}' 명령을 보내지 못했습니다.`);
      return false;
    }
    try {
      const writer = await (window.acquireSerialWriter
        ? window.acquireSerialWriter(port)
        : Promise.resolve(port.writable.getWriter()));
      try { await writer.write(new TextEncoder().encode(command + '\n')); }
      finally { try { writer.releaseLock(); } catch (_) {} }
      log(`장치 명령: ${command}`);
      return true;
    } catch (error) {
      log(`장치 명령 실패: ${error.message}`);
      return false;
    }
  }

  async function sendEvent(name) {
    if (!state.active || !state.paired) return false;
    const result = await api.factorySendEvent(name);
    if (!result || !result.ok) {
      log(`이벤트 전송 실패: ${result && result.error || '알 수 없는 오류'}`);
      return false;
    }
    log(`보냄: ${name}`);
    return true;
  }

  async function handleDistance(distance) {
    if (!state.active || !state.paired || state.role !== 'CONVEYOR') return;
    if (!Number.isFinite(distance) || distance <= 0) return;
    if (distance <= state.thresholdCm) {
      state.clearCount = 0;
      state.detectionCount += 1;
      if (state.detectionArmed && state.detectionCount >= 3) {
        state.detectionArmed = false;
        state.waitingForRobot = true;
        await writeSerialCommand('CONVEYOR,STOP');
        await sendEvent('OBJECT_DETECTED');
        await sendEvent('OBJECT_ARRIVED');
        log(`물체 감지 ${distance}cm → 컨베이어 정지, 로봇 호출`);
      }
    } else {
      state.detectionCount = 0;
      state.clearCount += 1;
      if (!state.waitingForRobot && state.clearCount >= 3) state.detectionArmed = true;
    }
  }

  async function handleFactoryEvent(message) {
    if (!message || !message.event) return;
    log(`받음: ${message.event}`);
    if (state.role === 'ROBOT' && message.event === 'OBJECT_ARRIVED') {
      state.waitingForRobot = true;
      $('factoryDoneBtn').style.display = '';
      await sendEvent('ROBOT_WORKING');
      if (window.showToast) window.showToast('🏭 물체 도착 — 로봇 작업을 실행하세요.', 'success', 5000);
    }
    if (state.role === 'CONVEYOR' && message.event === 'ROBOT_DONE') {
      await writeSerialCommand('CONVEYOR,START');
      state.waitingForRobot = false;
      state.clearCount = 0;
      log('로봇 작업 완료 → 컨베이어 재가동');
    }
  }

  async function finishRobotWork() {
    if (state.role !== 'ROBOT' || !state.waitingForRobot) return false;
    if (await sendEvent('ROBOT_DONE')) {
      state.waitingForRobot = false;
      $('factoryDoneBtn').style.display = 'none';
      log('로봇 작업 완료를 컨베이어에 알렸습니다.');
      return true;
    }
    return false;
  }

  async function waitForArrival() {
    if (!state.active || !state.paired || state.role !== 'ROBOT') {
      throw new Error('협업모드에서 로봇 역할로 같은 모둠에 연결해야 합니다.');
    }
    while (window._runtimeRunning) {
      if (state.waitingForRobot) return true;
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!state.active || !state.paired) throw new Error('컨베이어와의 협업 연결이 끊겼습니다.');
    }
    return false;
  }

  async function signalWorking() {
    if (!state.active || !state.paired || state.role !== 'ROBOT' || !state.waitingForRobot) return false;
    return sendEvent('ROBOT_WORKING');
  }

  window.CubeLinkRobotFactory = {
    waitForArrival,
    signalWorking,
    signalDone: finishRobotWork,
    getState: () => ({ ...state })
  };

  function bind() {
    if (!api || !api.factoryStart) {
      $('factoryBadge')?.remove();
      return;
    }
    $('factoryBadge')?.addEventListener('click', () => showPanel(true));
    $('factoryCloseBtn')?.addEventListener('click', () => showPanel(false));
    $('factoryDoneBtn')?.addEventListener('click', finishRobotWork);
    $('factoryConnectBtn')?.addEventListener('click', async () => {
      const role = $('factoryRole').value;
      const sessionId = $('factorySession').value.trim();
      const groupId = $('factoryGroup').value;
      if (!sessionId) {
        $('factoryStatus').textContent = '수업 세션 코드를 입력하세요.';
        return;
      }
      state.role = role;
      state.thresholdCm = Math.max(3, Math.min(100, Number($('factoryDistance').value) || 15));
      localStorage.setItem('cubelink_factory_session', sessionId);
      localStorage.setItem('cubelink_factory_group', groupId);
      try {
        setStatus(await api.factoryStart({ role, sessionId, groupId }));
      } catch (error) {
        setStatus({ state: 'error', detail: error.message, active: false, paired: false });
      }
    });
    $('factoryDisconnectBtn')?.addEventListener('click', async () => setStatus(await api.factoryStop()));
    api.onFactoryStatus(setStatus);
    api.onFactoryEvent(handleFactoryEvent);
    const savedSession = localStorage.getItem('cubelink_factory_session');
    const savedGroup = localStorage.getItem('cubelink_factory_group');
    if (savedSession) $('factorySession').value = savedSession;
    if (savedGroup && [...$('factoryGroup').options].some(option => option.value === savedGroup)) {
      $('factoryGroup').value = savedGroup;
    }
    window.addEventListener('cubelink-board-line', event => {
      const parts = String(event.detail || '').split(',');
      if (parts[0] === 'U') handleDistance(Number(parts[1]));
    });
    window.addEventListener('cubelink-runtime-ended', event => {
      const result = event.detail || {};
      if (result.realtime && !result.faulted && state.role === 'ROBOT' && state.waitingForRobot) {
        finishRobotWork();
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();

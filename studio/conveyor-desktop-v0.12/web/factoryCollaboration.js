(function () {
  'use strict';

  const api = window.conveyorDesktop;
  const conveyor = window.CubeLinkConveyorFactory;
  const state = {
    active: false,
    paired: false,
    waitingForRobot: false,
    detectionArmed: true,
    detectionCount: 0,
    clearCount: 0,
    thresholdCm: 15
  };
  const $ = id => document.getElementById(id);

  function log(message) {
    const output = $('factoryLinkLog');
    if (!output) return;
    const time = new Date().toLocaleTimeString('ko-KR', { hour12: false });
    output.textContent += `[${time}] ${message}\n`;
    output.scrollTop = output.scrollHeight;
  }

  function showPanel(open) {
    $('factoryLinkPanel')?.classList.toggle('open', !!open);
  }

  function setStatus(status) {
    status = status || {};
    const wasPaired = state.paired;
    state.active = !!status.active;
    state.paired = !!status.paired;
    const statusBox = $('factoryLinkStatus');
    if (statusBox) {
      statusBox.className = `factoryLinkStatus ${status.state || ''}`;
      statusBox.textContent = status.detail || '연동 대기';
    }
    const button = $('factoryLinkBtn');
    if (button) {
      button.classList.toggle('paired', state.paired);
      button.textContent = state.paired ? `🔗 ${status.groupId || ''}모둠 연동됨` : '🔗 CubeLink 연동';
    }
    $('factoryLinkConnect').disabled = state.active;
    $('factoryLinkDisconnect').disabled = !state.active;
    $('factoryArrivalTest').disabled = !state.paired;
    if (status.detail) log(status.detail);
    if (wasPaired && !state.paired && state.waitingForRobot) {
      conveyor.stop().catch(error => log(`안전 정지 실패: ${error.message}`));
      log('상대 연결이 끊겨 컨베이어를 정지 상태로 유지합니다.');
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

  async function triggerArrival(source) {
    if (!state.paired || state.waitingForRobot) return;
    state.detectionArmed = false;
    state.waitingForRobot = true;
    try {
      await conveyor.stop();
      await sendEvent('OBJECT_DETECTED');
      await sendEvent('OBJECT_ARRIVED');
      log(`${source === 'test' ? '시험 신호' : '물체 감지'} → 컨베이어 정지, 로봇팔 호출`);
      $('factoryLinkStatus').textContent = '로봇팔 작업 완료를 기다리는 중입니다.';
    } catch (error) {
      state.waitingForRobot = false;
      log(`로봇팔 호출 실패: ${error.message}`);
    }
  }

  async function handleDistance(detail) {
    if (!state.active || !state.paired || state.waitingForRobot || !detail?.fromHardware) return;
    const value = Number(detail.distance);
    if (!Number.isFinite(value) || value <= 0) return;
    if (value <= state.thresholdCm) {
      state.clearCount = 0;
      state.detectionCount += 1;
      if (state.detectionArmed && state.detectionCount >= 3) await triggerArrival('sensor');
    } else if (value >= state.thresholdCm + 5) {
      state.detectionCount = 0;
      state.clearCount += 1;
      if (state.clearCount >= 3) state.detectionArmed = true;
    }
  }

  async function handleFactoryEvent(message) {
    if (!message || !message.event) return;
    log(`받음: ${message.event}`);
    if (message.event === 'ROBOT_WORKING' && state.waitingForRobot) {
      $('factoryLinkStatus').textContent = '로봇팔이 작업 중입니다.';
    }
    if (message.event === 'ROBOT_DONE' && state.waitingForRobot) {
      try {
        await conveyor.resume();
        state.waitingForRobot = false;
        state.detectionCount = 0;
        state.clearCount = 0;
        $('factoryLinkStatus').textContent = '로봇팔 작업 완료 · 컨베이어 재가동';
        log('로봇팔 작업 완료 → CONVEYOR,START 전송');
      } catch (error) {
        log(`컨베이어 재가동 실패: ${error.message}`);
        $('factoryLinkStatus').textContent = '재가동 실패 · 수동으로 안전 상태를 확인하세요.';
        $('factoryLinkStatus').classList.add('error');
      }
    }
  }

  function bind() {
    if (!api?.factoryStart || !conveyor) {
      $('factoryLinkBtn')?.remove();
      return;
    }
    $('factoryLinkBtn').addEventListener('click', () => showPanel(true));
    $('factoryLinkClose').addEventListener('click', () => showPanel(false));
    $('factoryLinkPanel').addEventListener('mousedown', event => {
      if (event.target === $('factoryLinkPanel')) showPanel(false);
    });
    $('factoryLinkConnect').addEventListener('click', async () => {
      const sessionId = $('factorySession').value.trim();
      const groupId = $('factoryGroup').value;
      if (!sessionId) {
        $('factoryLinkStatus').textContent = '수업 코드를 입력하세요.';
        return;
      }
      state.thresholdCm = Math.max(3, Math.min(100, Number($('factoryDistance').value) || 15));
      localStorage.setItem('cubelink_factory_session', sessionId);
      localStorage.setItem('cubelink_factory_group', groupId);
      try {
        setStatus(await api.factoryStart({ role: 'CONVEYOR', sessionId, groupId }));
      } catch (error) {
        setStatus({ state: 'error', detail: error.message, active: false, paired: false });
      }
    });
    $('factoryLinkDisconnect').addEventListener('click', async () => {
      if (state.waitingForRobot) await conveyor.stop().catch(() => {});
      state.waitingForRobot = false;
      setStatus(await api.factoryStop());
    });
    $('factoryArrivalTest').addEventListener('click', () => triggerArrival('test'));
    const savedSession = localStorage.getItem('cubelink_factory_session');
    const savedGroup = localStorage.getItem('cubelink_factory_group');
    if (savedSession) $('factorySession').value = savedSession;
    if (savedGroup && [...$('factoryGroup').options].some(option => option.value === savedGroup)) {
      $('factoryGroup').value = savedGroup;
    }
    api.onFactoryStatus(setStatus);
    api.onFactoryEvent(handleFactoryEvent);
    window.addEventListener('cubelink-conveyor-distance', event => handleDistance(event.detail));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();

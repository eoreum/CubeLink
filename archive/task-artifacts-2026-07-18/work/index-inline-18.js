
(function() {
  'use strict';

  window.actionMode = window.actionMode || 'real';
  window.twinUnlocked = false;

  window.shouldSendToRobot   = () => window.actionMode === 'real' || window.actionMode === 'twin';
  window.shouldUpdateGraphic = () => window.actionMode === 'sim'  || window.actionMode === 'twin';

  window.showToast = function(message, type, duration) {
    type = type || 'info';
    duration = duration || 2500;
    const old = document.getElementById('cubelinkToast');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.id = 'cubelinkToast';
    toast.className = 'cubelink-toast ' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  };

  function updateRunButton() {
    const btn = document.getElementById('btnRunRealtime');
    if (!btn) return;
    if (window.actionMode === 'twin') {
      btn.classList.add('twin-mode');
      btn.textContent = '🔄 디지털 트윈 실행';
      btn.title = '블록 코드를 실물 로봇과 3D 그래픽에서 동시에 실행합니다.';
    } else if (window.actionMode === 'sim') {
      btn.classList.remove('twin-mode');
      btn.textContent = '🖥️ 그래픽만 실행';
      btn.title = '블록 코드를 3D 그래픽에서만 실행합니다.';
      btn.style.setProperty('background', 'linear-gradient(135deg, #3498db, #2980b9)', 'important');
    } else {
      btn.classList.remove('twin-mode');
      btn.textContent = '▶ 실시간 실행';
      btn.title = '블록 코드를 OTG로 연결된 로봇팔에서 실시간 실행합니다.';
      btn.style.setProperty('background', 'linear-gradient(135deg, #D4AF37, #B8941F)', 'important');
    }
  }

  window.setActionMode = function(mode, opts) {
    opts = opts || {};
    if (!['real','sim','twin'].includes(mode)) return false;
    if (mode === 'twin' && !window.twinUnlocked) {
      window.showToast('🔒 디지털 트윈은 잠금 상태입니다', 'warn');
      return false;
    }
    window.actionMode = mode;
    updateRunButton();
    if (!opts.silent) {
      const names = { real:'실물만', sim:'그래픽만', twin:'디지털 트윈' };
      window.showToast('🔀 ' + names[mode] + ' 모드', 'info', 1800);
    }
    console.log('🔀 동작 모드 →', mode);
    return true;
  };

  function bindRunButtons() {
    const btnSim = document.getElementById('btnSimStart');
    const btnRun = document.getElementById('btnRunRealtime');
    // v2.8.9: btnSim 클릭 시 전역 모드 변경 제거 (app.js의 _simulationOnly만 사용)

    if (btnRun && btnRun.dataset.modeBound !== '1') {
      btnRun.dataset.modeBound = '1';
      btnRun.addEventListener('click', () => {
        const target = window.twinUnlocked ? 'twin' : 'real';
        window.setActionMode(target, { silent:false });
      }, true);
    }
  }

  window.unlockTwinMode = function() {
    if (window.twinUnlocked) {
      window.showToast('이미 디지털 트윈이 활성화되어 있습니다', 'info');
      return;
    }
    window.twinUnlocked = true;
    window.setActionMode('twin', { silent:true });
    window.showToast('✨ 디지털 트윈 모드 활성화 — 실물 + 그래픽 동시 동작', 'success', 3500);
    console.log('🎉 디지털 트윈 모드 잠금 해제됨');
  };

  const SECRET_TWIN = ['디지털트윈', 'twin', '트윈', 'digitaltwin', 'digital twin'];
  const CMD_REAL    = ['실물만', 'real', '실물', 'robot'];
  const CMD_SIM     = ['그래픽만', 'sim', '그래픽', 'graphic', 'simulation'];
  const CMD_RESET   = ['초기화', 'reset', 'lock', '잠금'];
  const CMD_HELP    = ['help', '도움말', '?'];
  const CMD_VERSION = ['version', '버전', 'ver'];

  function normalize(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ''); }
  function matches(input, list) {
    const n = normalize(input);
    return list.some(w => normalize(w) === n);
  }

  function appendToMonitor(text, color) {
    const mon = document.getElementById('serialMonitor');
    if (!mon) return;
    const line = document.createElement('div');
    line.style.color = color || '#888';
    line.style.fontFamily = "'Consolas','Monaco',monospace";
    line.style.fontSize = '11px';
    line.textContent = text;
    mon.appendChild(line);
    mon.scrollTop = mon.scrollHeight;
  }

  function handleCommand(cmd) {
    if (!cmd) return;
    appendToMonitor('> ' + cmd, '#D4AF37');

    if (matches(cmd, SECRET_TWIN)) {
      window.unlockTwinMode();
      appendToMonitor('✓ 디지털 트윈 모드 활성화됨', '#2ecc71');
      return;
    }
    if (matches(cmd, CMD_REAL)) {
      window.setActionMode('real');
      appendToMonitor('✓ 실물 전용 모드', '#2ecc71');
      return;
    }
    if (matches(cmd, CMD_SIM)) {
      window.setActionMode('sim');
      appendToMonitor('✓ 그래픽 전용 모드', '#2ecc71');
      return;
    }
    if (matches(cmd, CMD_RESET)) {
      window.twinUnlocked = false;
      window.setActionMode('real', { silent:true });
      appendToMonitor('✓ 모드 초기화 — 실물 전용으로 복귀', '#3498db');
      window.showToast('🔒 모드 초기화', 'info');
      return;
    }
    if (matches(cmd, CMD_HELP)) {
      appendToMonitor('─── 사용 가능 명령 ───', '#D4AF37');
      appendToMonitor('  real / 실물만     — 실물 로봇 전용', '#888');
      appendToMonitor('  sim  / 그래픽만   — 3D 그래픽 전용', '#888');
      appendToMonitor('  reset / 초기화    — 기본 모드로 복귀', '#888');
      appendToMonitor('  version / 버전    — 현재 버전 표시', '#888');
      return;
    }
    if (matches(cmd, CMD_VERSION)) {
      appendToMonitor('CubeLink Studio v3.4.3', '#3498db');
      return;
    }

    if (window._serialPort && window._serialPort.writable) {
      window.sendToRobot ? window.sendToRobot(cmd + '\n') : sendRawToRobot(cmd + '\n');
      appendToMonitor('→ 로봇으로 전송: ' + cmd, '#888');
    } else {
      appendToMonitor('알 수 없는 명령: ' + cmd, '#e74c3c');
    }
  }

  window.sendToRobot = async function(text) {
    if (!window.shouldSendToRobot()) {
      console.log('🚫 실물 전송 차단 (' + window.actionMode + '):', text.trim());
      return;
    }
    if (!window._serialPort || !window._serialPort.writable) return;
    try {
      const writer = window._serialPort.writable.getWriter();
      await writer.write(new TextEncoder().encode(text));
      writer.releaseLock();
    } catch(e) {
      console.warn('시리얼 전송 오류:', e.message);
    }
  };

  async function sendRawToRobot(text) {
    if (!window._serialPort || !window._serialPort.writable) return;
    try {
      const writer = window._serialPort.writable.getWriter();
      await writer.write(new TextEncoder().encode(text));
      writer.releaseLock();
    } catch(e) {}
  }

  function bindCommandInput() {
    const input = document.getElementById('serialCmdInput');
    const sendBtn = document.getElementById('btnSerialSend');
    if (!input || input.dataset.bound === '1') return;
    input.dataset.bound = '1';
    const submit = () => {
      const v = input.value.trim();
      if (!v) return;
      input.value = '';
      handleCommand(v);
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
    if (sendBtn) sendBtn.addEventListener('click', submit);
  }

  function patchParseBoardLine() {
    if (typeof window.parseBoardLine !== 'function') {
      setTimeout(patchParseBoardLine, 300);
      return;
    }
    if (window.parseBoardLine._modeWrapped) return;
    const origParse = window.parseBoardLine;
    window.parseBoardLine = function(line) {
      if (!line) return;
      const head = String(line).trim().split(',')[0];
      const graphicMsgs = ['A'];
      if (graphicMsgs.includes(head) && !window.shouldUpdateGraphic()) return;
      return origParse.call(this, line);
    };
    window.parseBoardLine._modeWrapped = true;
    console.log('✅ parseBoardLine 모드 라우팅 적용');
  }

  function init() {
    bindRunButtons();
    bindCommandInput();
    patchParseBoardLine();
    updateRunButton();
    console.log('🔀 v2.8.9 동작 모드 + 명령어 시스템 로드됨 (기본: real)');
    console.log('💡 강사용: 시리얼 모니터 입력창에 비밀 단어를 입력하면 디지털 트윈 해제');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


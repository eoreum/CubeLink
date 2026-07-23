
/* ---------- 조이스틱 설치 방향 보정 설정 ---------- */
window.joyOrientation = window.joyOrientation || { 1: 'cw90', 2: 'cw90' };

function applyJoyOrientation(which, rawX, rawY) {
  const orient = window.joyOrientation[which] || 'none';
  let x = rawX, y = rawY;
  switch (orient) {
    case 'cw90':   x = 1023 - rawY; y = rawX;        break;
    case 'ccw90':  x = rawY;        y = 1023 - rawX; break;
    case 'flip':   x = 1023 - rawX; y = 1023 - rawY; break;
  }
  return { x, y };
}

window.updateJoystickUI = function(which, rawX, rawY, sw) {
  const { x, y } = applyJoyOrientation(which, rawX, rawY);
  const pad = document.getElementById(`joyPad${which}`);
  const dot = document.getElementById(`joyDot${which}`);
  if (!pad || !dot) return;
  const padSize = pad.getBoundingClientRect().width;
  const dotSize = dot.getBoundingClientRect().width || 16;
  const maxOffset = (padSize - dotSize) / 2;
  const nx = (Math.max(0, Math.min(1023, x)) - 512) / 512;
  const ny = (Math.max(0, Math.min(1023, y)) - 512) / 512;
  dot.style.transform = `translate(calc(-50% + ${nx * maxOffset}px), calc(-50% + ${ny * maxOffset}px))`;
  const container = pad.closest('div').parentElement || pad.parentElement;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (/X\s*:\s*\d+/.test(node.nodeValue)) { node.nodeValue = `X:${x} Y:${y}`; break; }
  }
  const swWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  while ((node = swWalker.nextNode())) {
    if (/SW\s*:/.test(node.nodeValue)) { node.nodeValue = `SW: ${sw ? 'HIGH' : 'LOW'}`; break; }
  }
};

window.updateUltrasonicUI = function(cm) {
  const d = Math.max(0, Math.min(999, cm));
  const sliderVal = Math.max(0, Math.min(100, cm));
  const slider = document.getElementById('usSlider');
  if (slider) { slider.value = sliderVal; slider.dispatchEvent(new Event('input', { bubbles: true })); }
  const usValue = document.getElementById('usValue');
  if (usValue) usValue.textContent = d;
};

window._cubeSafety = { state: 'UNKNOWN', initialized: false, flowRunning: false };
window._boardResponseWaiters = [];

window.waitForBoardResponse = function(expected, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const waiter = { expected, resolve, reject, timer: null };
    waiter.timer = setTimeout(() => {
      window._boardResponseWaiters = window._boardResponseWaiters.filter(w => w !== waiter);
      reject(new Error(`${expected} 응답 시간 초과`));
    }, timeoutMs);
    window._boardResponseWaiters.push(waiter);
  });
};

window.sendBoardCommand = async function(command) {
  const port = window._serialPort;
  if (!port || !port.writable) throw new Error('로봇이 연결되어 있지 않습니다.');
  const writer = port.writable.getWriter();
  try {
    await writer.write(new TextEncoder().encode(command.trim() + '\n'));
  } finally {
    writer.releaseLock();
  }
};

window.runCubeSafetyStartup = async function(state) {
  const safety = window._cubeSafety;
  if (safety.flowRunning || safety.initialized) return;
  safety.flowRunning = true;
  safety.state = state;
  try {
    if (state === 'RECOVERY_REQUIRED') {
      const confirmed = confirm(
        '이전 사용이 안전 종료로 완료되지 않았습니다.\n\n' +
        'USB 전원을 분리한 상태에서 로봇팔을 보관 자세로 놓고, 팔을 손으로 지지한 뒤 확인을 누르세요.\n' +
        '(6번 90°, 9번 10°, 10번 10°, 11번 90°)'
      );
      if (!confirmed) {
        if (window.showToast) window.showToast('⚠ 복구 확인 전에는 실물 실행이 잠겨 있습니다.', 'warn', 4000);
        return;
      }
      const recovery = window.waitForBoardResponse('RECOVERY_ACCEPTED');
      await window.sendBoardCommand('R');
      await recovery;
      safety.state = 'SAFE';
    }

    if (safety.state !== 'SAFE') throw new Error('알 수 없는 안전 상태: ' + safety.state);
    const initialized = window.waitForBoardResponse('INIT_OK', 30000);
    await window.sendBoardCommand('I');
    await initialized;
    safety.initialized = true;
    safety.state = 'ACTIVE';
    if (window.showToast) window.showToast('✅ 안전 초기화 완료', 'success', 2500);
  } catch (error) {
    safety.initialized = false;
    console.warn('CubeLink 안전 초기화 실패:', error);
    if (window.showToast) window.showToast('🛑 안전 초기화 실패: ' + error.message, 'error', 5000);
  } finally {
    safety.flowRunning = false;
  }
};

window.parseBoardLine = function(line) {
  if (!line) return;
  const s = String(line).trim();
  if (!s) return;
  const p = s.split(',');
  const head = p[0];
  const waiter = window._boardResponseWaiters.find(w => w.expected === head);
  if (waiter) {
    clearTimeout(waiter.timer);
    window._boardResponseWaiters = window._boardResponseWaiters.filter(w => w !== waiter);
    waiter.resolve(s);
  }
  if (head === 'READY') {
    console.log('🟢 보드 READY:', s);
    const version = p[2] || '';
    const safetyState = p[3] || 'UNKNOWN';
    if (version !== 'v1.4.0') {
      window._cubeSafety.state = 'LEGACY';
      window._cubeSafety.initialized = false;
      if (window.showToast) window.showToast('⚠ 안전 프로토콜 v1.4.0 펌웨어가 필요합니다.', 'warn', 5000);
      return;
    }
    window.runCubeSafetyStartup(safetyState);
    return;
  }
  if (head === 'INIT_OK' || head === 'RECOVERY_ACCEPTED' || head === 'PARKED') return;
  if (head === 'ERR') {
    console.warn('보드 안전 오류:', s);
    if (window.showToast) window.showToast('🛑 ' + s, 'error', 4000);
    return;
  }
  if (head === 'U')  { const d = parseInt(p[1],10); if (!isNaN(d)) updateUltrasonicUI(d); return; }
  if (head === 'J1') { updateJoystickUI(1, parseInt(p[1],10), parseInt(p[2],10), parseInt(p[3],10)); return; }
  if (head === 'J2') { updateJoystickUI(2, parseInt(p[1],10), parseInt(p[2],10), parseInt(p[3],10)); return; }
  if (head === 'A')  {
    const pin = parseInt(p[1],10), ang = parseInt(p[2],10);
    if (window.Sim && typeof Sim.setServo === 'function') Sim.setServo(pin, ang);
    return;
  }
};

window._connState = 'idle';
window._reconnecting = false;
window._autoReconnect =  false;  // v2.8.9: brown-out 무한 루프 차단 — 수동 재연결만 허용

window.setConnectionState = function(state) {
  const btn = document.getElementById('btnConnectInit');
  if (!btn) return;
  window._connState = state;
  const states = {
    idle:       { text:'🔌 로봇 연결 및 초기화 (90도)', bg:'linear-gradient(135deg, #2ecc71, #27ae60)', border:'#27ae60', title:'로봇을 연결합니다.', disabled:false },
    connecting: { text:'⏳ 연결 중...',                 bg:'linear-gradient(135deg, #95a5a6, #7f8c8d)', border:'#7f8c8d', title:'연결 중...',           disabled:true },
    connected:  { text:'✅ 연결됨 — 해제하려면 클릭',   bg:'linear-gradient(135deg, #3498db, #2980b9)', border:'#2980b9', title:'연결 해제',            disabled:false },
    lost:       { text:'⚠️ 연결 끊김 — 클릭하여 재연결', bg:'linear-gradient(135deg, #f39c12, #e67e22)', border:'#e67e22', title:'USB를 다시 꽂고 클릭하세요', disabled:false },
    failed:     { text:'❌ 연결 실패 — 클릭하여 재시도', bg:'linear-gradient(135deg, #e74c3c, #c0392b)', border:'#c0392b', title:'다시 시도하세요',     disabled:false },
  };
  const s = states[state] || states.idle;
  btn.textContent = s.text;
  btn.title = s.title;
  btn.disabled = s.disabled;
  btn.style.setProperty('background', s.bg, 'important');
  btn.style.setProperty('border', `1px solid ${s.border}`, 'important');
  btn.style.setProperty('color', 'white', 'important');
  btn.style.setProperty('opacity', s.disabled ? '0.7' : '1', 'important');
  btn.style.setProperty('cursor', s.disabled ? 'wait' : 'pointer', 'important');
};

/* 💎 완전 해제 함수 — 좀비 객체 방지 */
window.fullCleanup = async function(opts) {
  opts = opts || {};
  if (window._cleaningUp) return;          // 중복 진입 차단 (disconnect 핸들러 2곳 동시 호출 방지)
  window._cleaningUp = true;
  try {
    if (window._cubeSafety) {
      window._cubeSafety.initialized = false;
      window._cubeSafety.flowRunning = false;
      window._cubeSafety.state = 'UNKNOWN';
    }
    (window._boardResponseWaiters || []).forEach(waiter => {
      clearTimeout(waiter.timer);
      waiter.reject(new Error('연결이 종료되었습니다.'));
    });
    window._boardResponseWaiters = [];
    if (window._heartbeatTimer) {            // v2.9.0: 하트비트 정지
      clearInterval(window._heartbeatTimer);
      window._heartbeatTimer = null;
    }
    window._readerRunning = false;
    try { await window._reader?.cancel(); } catch(_){}
    try { window._reader?.releaseLock(); } catch(_){}
    window._reader = null;
    await new Promise(r => setTimeout(r, 50));
    if (window._serialPort) {
      try {
        if (window._disconnectHandler) {
          try { window._serialPort.removeEventListener('disconnect', window._disconnectHandler); } catch(_){}
        }
        await window._serialPort.close();
        console.log('🔌 port.close() 성공');
      } catch(e) {
        console.warn('port.close() 실패 (무시):', e.message);
      }
    }
    await new Promise(r => setTimeout(r, 300));
    window._serialPort = null;
    window._disconnectHandler = null;
    if (!opts.silent) {
      setConnectionState('idle');
      console.log('✅ 완전 해제 완료');
    }
  } finally {
    window._cleaningUp = false;            // 어떤 경우든 플래그 해제
  }
};

window.stopCubelinkReader = window.fullCleanup;

/* 💎 좀비 포트 회피 */
async function getCleanPort(preferAuto) {
  const ports = await navigator.serial.getPorts();
  let candidate = ports[0] || null;
  if (preferAuto && candidate) {
    if (candidate.readable && candidate.readable.locked) {
      console.warn('⚠ 좀비 포트 감지 — forget() 후 재요청');
      try { await candidate.forget?.(); } catch(_){}
      candidate = null;
    } else {
      return candidate;
    }
  }
  if (!candidate) {
    try {
      candidate = await navigator.serial.requestPort();
    } catch(e) {
      if (e.name === 'NotFoundError' || /no port selected/i.test(e.message || '')) {
        throw new Error('USER_CANCELLED');
      }
      throw e;
    }
  }
  return candidate;
}

/* 💎 백오프 재시도로 port.open() */
async function openPortWithBackoff(port) {
  const delays = [0, 500, 1500, 3000];
  let lastErr = null;
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) await new Promise(r => setTimeout(r, delays[i]));
    try {
      if (port.readable) {
        console.log(`재시도 ${i}: port가 이미 열려 있어 close 후 재시도`);
        try { await port.close(); } catch(_){}
        await new Promise(r => setTimeout(r, 200));
      }
      await port.open({ baudRate: 115200, bufferSize: 4096 });
      console.log(`✅ port.open() 성공 (시도 ${i+1}/${delays.length})`);
      return port;
    } catch(e) {
      lastErr = e;
      console.warn(`port.open() 실패 (시도 ${i+1}/${delays.length}): ${e.message}`);
    }
  }
  throw lastErr || new Error('port.open() 최종 실패');
}

/* 💎 메인: 시리얼 리더 시작 */
window.startCubelinkReader = async function(port) {
  if (window._readerRunning) { console.log('이미 리더 동작 중 — 무시'); return; }
  setConnectionState('connecting');

  if (!port) {
    try {
      port = await getCleanPort(true);
    } catch(e) {
      if (e.message === 'USER_CANCELLED') { setConnectionState('idle'); return; }
      throw e;
    }
  }
  if (!port) { setConnectionState('idle'); return; }

  try {
    await openPortWithBackoff(port);
  } catch(e) {
    console.warn('포트 열기 최종 실패:', e.message);
    setConnectionState('failed');
    throw e;
  }

  try {
    await port.setSignals({ dataTerminalReady: false, requestToSend: false });
    await new Promise(r => setTimeout(r, 100));
    await port.setSignals({ dataTerminalReady: true, requestToSend: true });
  } catch(e) {
    console.warn('setSignals 미지원 (무시 가능):', e.message);
  }
  await new Promise(r => setTimeout(r, 1500));

  window._serialPort = port;
  window._readerRunning = true;

  if (window._disconnectHandler) {
    try { port.removeEventListener('disconnect', window._disconnectHandler); } catch(_){}
  }
  window._disconnectHandler = async () => {
    console.warn('🔌 port.disconnect 이벤트 — 완전 해제 시작');
    setConnectionState('lost');
    await window.fullCleanup({ silent: true });
    setConnectionState('lost');
  };
  port.addEventListener('disconnect', window._disconnectHandler);

  const decoder = new TextDecoderStream();
  port.readable.pipeTo(decoder.writable).catch(e => console.warn('pipe 종료:', e.message));
  const reader = decoder.readable.getReader();
  window._reader = reader;

  let buf = '';
  console.log('🎧 CUBELINK 리더 시작');
  setConnectionState('connected');
    // v2.9.0: 펌웨어 v1.1 자율모드 오인 방지 하트비트 (1초마다 P 전송)
  if (window._heartbeatTimer) clearInterval(window._heartbeatTimer);
  window._heartbeatTimer = setInterval(() => {
    if (!window._serialPort || !window._serialPort.writable) {
      clearInterval(window._heartbeatTimer); window._heartbeatTimer = null; return;
    }
    if (window._runtimeRunning) return;     // 실행 중엔 S/L 명령이 흐르므로 생략
    try {
      const w = window._serialPort.writable.getWriter();
      w.write(new TextEncoder().encode('P\n')).finally(() => {
        try { w.releaseLock(); } catch(_){}
      });
    } catch(_) { /* 다른 곳이 writer 점유 중 — 다음 주기 재시도 */ }
  }, 1000);


  try {
    while (window._readerRunning) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (line) {
          try { window.parseBoardLine(line); }
          catch(e) { console.warn('parse 오류:', e.message, line); }
        }
      }
    }
  } catch(e) {
    console.warn('reader 종료:', e.message);
  } finally {
    try { reader.releaseLock(); } catch(_){}
    const wasRunning = window._readerRunning;
    window._readerRunning = false;
    console.log('🛑 리더 종료');
    if (wasRunning && window._connState !== 'lost') setConnectionState('lost');
  }
};

/* 💎 환경 사전 진단 */
function diagnoseEnvironment() {
  const issues = [];
  if (window.cubelink) return issues;   // ★ 추가: Electron 앱에서는 진단 배너 생략
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (location.protocol !== 'https:' && !isLocal) {
    issues.push({ severity:'fatal', msg:'⚠️ HTTPS 주소가 아닙니다. https://eoreum.github.io/CubeLink/ 로 접속하세요.' });
  }
  if (!('serial' in navigator)) {
    issues.push({ severity:'fatal', msg:'⚠️ 이 브라우저는 로봇 연결을 지원하지 않습니다. Chrome 또는 Edge(데스크톱/노트북/Chromebook)를 사용하세요.' });
  }
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    issues.push({ severity:'warn', msg:'📱 모바일에서는 시뮬레이션만 가능합니다. 실제 로봇 연결은 노트북/데스크톱에서 사용하세요.' });
  }
  return issues;
}

function showDiagnosticBanner(issues) {
  if (!issues.length) return;
  const existing = document.getElementById('cubelinkDiagBanner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'cubelinkDiagBanner';
  const hasFatal = issues.some(i => i.severity === 'fatal');
  banner.style.cssText = `
    position:fixed; top:0; left:0; right:0; z-index:99998;
    background:${hasFatal ? 'linear-gradient(135deg,#c0392b,#922b21)' : 'linear-gradient(135deg,#d68910,#b9770e)'};
    color:white; padding:10px 50px 10px 16px; font-size:13px; font-weight:600;
    box-shadow:0 2px 10px rgba(0,0,0,0.3); text-align:center;`;
  banner.innerHTML = issues.map(i => i.msg).join(' &nbsp;|&nbsp; ') +
    `<button onclick="document.getElementById('cubelinkDiagBanner').remove()" style="position:absolute;right:10px;top:8px;background:transparent;border:1px solid white;color:white;border-radius:4px;padding:2px 8px;cursor:pointer;">닫기 ✕</button>`;
  document.body.insertBefore(banner, document.body.firstChild);
}

/* 💎 연결 실패 안내 모달 */
function showConnectionTroubleshoot(errorMsg) {
  const old = document.getElementById('cubelinkTroubleshoot');
  if (old) old.remove();
  const lowerErr = (errorMsg || '').toLowerCase();
  let primaryHint = '';
  if (lowerErr.includes('already open') || lowerErr.includes('failed to open')) {
    primaryHint = '💡 가장 흔한 원인: USB를 뽑았다 꽂은 직후 발생. 5~10초 기다린 후 다시 시도하세요.';
  } else if (lowerErr.includes('no port') || lowerErr.includes('notfound')) {
    primaryHint = '💡 USB가 인식되지 않았습니다. 케이블을 다시 꽂거나 다른 USB 포트에 꽂아 보세요.';
  } else if (lowerErr.includes('access denied') || lowerErr.includes('permission')) {
    primaryHint = '💡 권한 거부. Chromebook이라면 학교 관리자에게 시리얼 정책 허용을 요청하세요.';
  }
  const modal = document.createElement('div');
  modal.id = 'cubelinkTroubleshoot';
  modal.style.cssText = `
    position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7);
    z-index:99999; display:flex; align-items:center; justify-content:center;`;
  modal.innerHTML = `
    <div style="background:#1a1a1a; border:1px solid #D4AF37; border-radius:10px; padding:24px; max-width:500px; width:90%; color:white;">
      <h2 style="color:#D4AF37; margin:0 0 12px 0; font-size:18px;">🔌 로봇 연결 실패</h2>
      ${primaryHint ? `<div style="background:#2a2a2a; padding:10px; border-radius:6px; margin-bottom:12px; font-size:13px; border-left:3px solid #D4AF37;">${primaryHint}</div>` : ''}
      <div style="font-size:13px; line-height:1.7;">
        <p style="margin:6px 0; color:#ccc;">다음을 순서대로 확인하세요:</p>
        <ol style="padding-left:20px; margin:8px 0;">
          <li>USB 케이블이 양쪽 끝까지 꽉 꽂혀 있나요?</li>
          <li>Arduino IDE의 시리얼 모니터가 닫혀 있나요?</li>
          <li>같은 사이트를 다른 브라우저 탭에서 열어두지 않았나요?</li>
          <li>USB를 분리한 직후라면 5~10초 기다린 뒤 다시 시도</li>
          <li>다른 USB 포트에 꽂아 보세요 (특히 USB 허브 사용 중이라면 PC 직접 연결)</li>
          <li>그래도 안 되면 페이지를 새로고침(Ctrl+F5) 후 재시도</li>
        </ol>
        <details style="margin-top:12px;">
          <summary style="cursor:pointer; color:#888; font-size:11px;">상세 오류 메시지 보기</summary>
          <pre style="background:#0a0a0a; padding:8px; border-radius:4px; font-size:11px; color:#e74c3c; overflow-x:auto; margin-top:6px;">${errorMsg || '알 수 없는 오류'}</pre>
        </details>
      </div>
      <div style="display:flex; gap:8px; margin-top:18px; justify-content:flex-end;">
        <button id="ctsRetry" style="background:linear-gradient(135deg,#2ecc71,#27ae60);color:white;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;font-weight:600;">🔄 다시 시도</button>
        <button id="ctsClose" style="background:#444;color:white;border:none;padding:8px 18px;border-radius:6px;cursor:pointer;">닫기</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#ctsClose').onclick = () => modal.remove();
  modal.querySelector('#ctsRetry').onclick = async () => {
    modal.remove();
    document.getElementById('btnConnectInit')?.click();
  };
}
window.showConnectionTroubleshoot = showConnectionTroubleshoot;

/* 💎 버튼 클릭 핸들러 + 전역 이벤트 */
window.addEventListener('load', () => {
  const issues = diagnoseEnvironment();
  if (issues.length) showDiagnosticBanner(issues);
  if (!('serial' in navigator)) return;

  const btn = document.getElementById('btnConnectInit');
  if (btn) {
    btn.addEventListener('click', async (ev) => {
      ev.stopImmediatePropagation();
      ev.preventDefault();
      const state = window._connState;
      if (state === 'connecting') { console.log('이미 연결 중'); return; }
      if (state === 'connected')  { await window.fullCleanup(); return; }

      setConnectionState('connecting');
      try {
        if (window._serialPort || window._reader) {
          await window.fullCleanup({ silent: true });
          setConnectionState('connecting');
        }
        const port = await getCleanPort(false);
        await window.startCubelinkReader(port);
      } catch(e) {
        if (e.message === 'USER_CANCELLED') { setConnectionState('idle'); return; }
        console.warn('연결 실패:', e.message);
        setConnectionState('failed');
        showConnectionTroubleshoot(e.message);
      }
    }, true);
  }

  /* USB 재삽입 자동 재연결 (핵심) */
  navigator.serial.addEventListener('connect', async (e) => {
    console.log('🔌 navigator.serial.connect 이벤트:', e.target);
    if (!window._autoReconnect) return;
    if (window._connState === 'connected' || window._connState === 'connecting') return;

    window._runtimeRunning = false;  // v2.8.9: 자동 재연결 시 실행 중단
    await window.fullCleanup({ silent: true });
    setConnectionState('connecting');
    await new Promise(r => setTimeout(r, 1500));

    try {
      await window.startCubelinkReader(e.target);
      if (typeof window.showToast === 'function') {
        window.showToast('✅ USB 자동 재연결됨', 'success', 2500);
      }
    } catch(err) {
      console.warn('자동 재연결 실패:', err.message);
      try {
        await new Promise(r => setTimeout(r, 1000));
        const port = await getCleanPort(true);
        await window.startCubelinkReader(port);
        if (typeof window.showToast === 'function') {
          window.showToast('✅ 재연결 성공 (2차 시도)', 'success', 2500);
        }
      } catch(err2) {
        console.warn('2차 시도도 실패:', err2.message);
        setConnectionState('failed');
      }
    }
  });

  /* 전역 disconnect 이벤트 */
  navigator.serial.addEventListener('disconnect', async (e) => {
    console.warn('🔌 navigator.serial.disconnect 이벤트:', e.target);
    window._runtimeRunning = false;  // v2.8.9: USB 분리 시 실행 즉시 중단
    setConnectionState('lost');
    await window.fullCleanup({ silent: true });
    setConnectionState('lost');
    if (typeof window.showToast === 'function') {
      window.showToast('⚠️ USB 분리됨 — 재삽입을 기다리는 중', 'warn', 3000);
    }
  });

  /* v2.8.9: 페이지 로드 시 자동 연결 비활성화 — 사용자가 [연결] 버튼을 직접 눌러야 함 */
  /*
  (async () => {
    await new Promise(r => setTimeout(r, 500));
    try {
      const ports = await navigator.serial.getPorts();
      if (ports.length > 0) {
        console.log('승인된 포트 발견 — 자동 연결 시도');
        await window.startCubelinkReader(ports[0]);
      }
    } catch(e) {
      console.warn('자동 연결 실패:', e.message);
    }
  })();
  */

});

/* Blockly 리사이즈 */
window.addEventListener('load', () => {
  const triggerResize = () => {
    let ws = window.workspace || (typeof Blockly !== 'undefined' ? Blockly.mainWorkspace : null);
    if (!ws && typeof Blockly !== 'undefined' && typeof Blockly.getMainWorkspace === 'function') {
      ws = Blockly.getMainWorkspace();
    }
    if (ws && typeof Blockly.svgResize === 'function') {
      Blockly.svgResize(ws);
      if (ws.toolbox_ && typeof ws.toolbox_.position === 'function') ws.toolbox_.position();
    }
  };
  window.addEventListener('resize', triggerResize);
  setTimeout(triggerResize, 500);
});


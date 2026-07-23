
/* ════════════════════════════════════════════════════════════════
   CUBELINK Studio — 단계별 캘리브레이션 (영점 조절) 모듈
   핀 기준 오프셋: 6=베이스, 9=하완, 10=상완, 11=그리퍼
   저장 위치: localStorage 'cubelink_offsets_v1'
   ════════════════════════════════════════════════════════════════ */
(function() {
  'use strict';
  const CAL_KEY = 'cubelink_offsets_v1';

  window._servoOffsets = { 6: 0, 9: 0, 10: 0, 11: 0 };
  let calStep = 0; // 0:일반, 1~4단계

  const STEP_PIN  = { 1: 6, 2: 9, 3: 10, 4: 11 };
  const STEP_AXIS = { 1: 'lr', 2: 'ud', 3: 'ud', 4: 'lr' };

  function loadOffsets() {
    try {
      const o = JSON.parse(localStorage.getItem(CAL_KEY) || '{}');
      [6,9,10,11].forEach(p => { window._servoOffsets[p] = Number(o[p]) || 0; });
    } catch(_) {}
  }
  function saveOffsets() {
    localStorage.setItem(CAL_KEY, JSON.stringify(window._servoOffsets));
  }
  function clampOffset(v) { return Math.max(-30, Math.min(30, v)); }

  // app.js의 sendServo가 호출하는 전역 함수
  window.getServoOffset = function(pin) {
    return window._servoOffsets[parseInt(pin)] || 0;
  };

  loadOffsets();

  async function previewCurrentAxis() {
    const pin = STEP_PIN[calStep];
    if (!pin) return;
    const port = window._serialPort;
    if (!port || !port.writable) return;
    let deg = 90 + window._servoOffsets[pin];
    if (pin === 11) deg = Math.max(50, Math.min(120, deg));
    else deg = Math.max(0, Math.min(180, deg));
    try {
      const w = port.writable.getWriter();
      await w.write(new TextEncoder().encode(`S,${pin},${Math.round(deg)}\n`));
      w.releaseLock();
    } catch(_) {}
    if (window.Sim && typeof Sim.setServoAngle === 'function') Sim.setServoAngle(pin, 90);
  }

  function resetSimTo90() {
    [6,9,10,11].forEach(p => {
      if (window.Sim && typeof Sim.setServoAngle === 'function') Sim.setServoAngle(p, 90);
      window.servoAngles = window.servoAngles || {};
      window.servoAngles[p] = 90;
    });
  }

  function calKeyHandler(e) {
    if (calStep === 0) return;
    const pin  = STEP_PIN[calStep];
    const axis = STEP_AXIS[calStep];
    let handled = true;

    if (e.key === 'Enter') {
      if (calStep < 4) { calStep++; }
    } else if (axis === 'lr' && e.key === 'ArrowLeft') {
      window._servoOffsets[pin] = clampOffset(window._servoOffsets[pin] - 1);
    } else if (axis === 'lr' && e.key === 'ArrowRight') {
      window._servoOffsets[pin] = clampOffset(window._servoOffsets[pin] + 1);
    } else if (axis === 'ud' && e.key === 'ArrowUp') {
      window._servoOffsets[pin] = clampOffset(window._servoOffsets[pin] + 1);
    } else if (axis === 'ud' && e.key === 'ArrowDown') {
      window._servoOffsets[pin] = clampOffset(window._servoOffsets[pin] - 1);
    } else {
      handled = false;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key !== 'Enter') previewCurrentAxis();
      updateUI();
    } else if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  window.addEventListener('keydown', calKeyHandler, true);

  function startCalibration() {
    if (!window._serialPort || !window._serialPort.writable) {
      if (!confirm('로봇이 연결되지 않았습니다.\n연결 없이 오프셋 값만 조정하시겠습니까?\n(미리보기 동작은 생략됩니다)')) return;
    }
    calStep = 1;
    document.getElementById('calOverlay').style.display = 'flex';
    updateUI();
    previewCurrentAxis();
  }
  function finishCalibration() {
    saveOffsets();
    calStep = 0;
    resetSimTo90();
    document.getElementById('calOverlay').style.display = 'none';
    if (window.showToast) window.showToast('✅ 캘리브레이션 저장 완료', 'success', 2500);
  }
  function cancelCalibration() {
    loadOffsets();
    calStep = 0;
    document.getElementById('calOverlay').style.display = 'none';
  }

  function updateUI() {
    const stepNames = {
      1: '1단계 · 베이스(PIN6) · ◀ ▶ 로 조절',
      2: '2단계 · 하완(PIN9) · ▲ ▼ 로 조절',
      3: '3단계 · 상완(PIN10) · ▲ ▼ 로 조절',
      4: '4단계 · 그리퍼(PIN11) · ◀ ▶ 로 조절'
    };
    const t = document.getElementById('calStepTitle');
    const v = document.getElementById('calValues');
    const saveBtn = document.getElementById('calSaveBtn');
    const nextHint = document.getElementById('calNextHint');
    if (t) t.textContent = stepNames[calStep] || '';
    if (v) v.textContent =
      `베이스 ${fmt(6)}  |  하완 ${fmt(9)}  |  상완 ${fmt(10)}  |  그리퍼 ${fmt(11)}`;
    if (saveBtn) saveBtn.style.display = (calStep === 4) ? 'inline-block' : 'none';
    if (nextHint) nextHint.style.display = (calStep < 4) ? 'block' : 'none';
  }
  function fmt(pin) {
    const val = window._servoOffsets[pin];
    return (val > 0 ? '+' : '') + val + '°';
  }

  function bind() {
    document.getElementById('calStartBtn')?.addEventListener('click', startCalibration);
    document.getElementById('calSaveBtn')?.addEventListener('click', finishCalibration);
    document.getElementById('calCancelBtn')?.addEventListener('click', cancelCalibration);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else { bind(); }

  console.log('🎯 캘리브레이션 모듈 로드됨 (offsets:', window._servoOffsets, ')');
})();


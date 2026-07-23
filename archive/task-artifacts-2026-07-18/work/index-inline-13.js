
(function() {
  'use strict';

  function createJoyPad(padId, dotId, labelId, swStateId, resetBtnId, sideKey, swPin) {
    const pad   = document.getElementById(padId);
    const dot   = document.getElementById(dotId);
    const label = document.getElementById(labelId);
    const swEl  = document.getElementById(swStateId);
    const btnR  = document.getElementById(resetBtnId);
    if (!pad || !dot) { console.warn('⚠ 조이스틱 요소 없음:', padId, dotId); return null; }

    const state = { x: 512, y: 512, sw: 0, dragging: false };

    function commitToGlobal() {
      if (!window.joystickData) {
        window.joystickData = { left:{x:500,y:500,sw:0}, right:{x:500,y:500,sw:0} };
      }
      if (!window.joystickData[sideKey]) window.joystickData[sideKey] = {};
      window.joystickData[sideKey].x  = state.x;
      window.joystickData[sideKey].y  = state.y;
      window.joystickData[sideKey].sw = state.sw;
    }

    function updatePosition(dx, dy) {
      const r = Math.hypot(dx, dy);
      if (r > 1) { dx /= r; dy /= r; }
      const padSize = pad.clientWidth;
      const dotSize = dot.clientWidth || 18;
      const maxPx = (padSize - dotSize) / 2 - 2;
      dot.style.transform = `translate(calc(-50% + ${dx*maxPx}px), calc(-50% + ${dy*maxPx}px))`;
      state.x = Math.max(0, Math.min(1023, Math.round(512 + dx * 511)));
      state.y = Math.max(0, Math.min(1023, Math.round(512 + dy * 511)));
      if (label) label.textContent = `X:${state.x} Y:${state.y}`;
      commitToGlobal();
      if (window.MissionProgress && typeof MissionProgress.onSimEvent === 'function') {
        MissionProgress.onSimEvent({ type:'joystick', side:sideKey, x:state.x, y:state.y });
      }
    }

    function pointerToNormalized(clientX, clientY) {
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const r  = rect.width / 2 - 8;
      return { dx: (clientX - cx) / r, dy: (clientY - cy) / r };
    }

    function setSwitch(pressed) {
      state.sw = pressed ? 1 : 0;
      commitToGlobal();
      if (swEl) swEl.textContent = pressed ? 'SW: LOW(눌림)' : 'SW: HIGH';
    }

    pad.addEventListener('pointerdown', (e) => {
      state.dragging = true;
      setSwitch(true);
      try { pad.setPointerCapture(e.pointerId); } catch(_){}
      const p = pointerToNormalized(e.clientX, e.clientY);
      updatePosition(p.dx, p.dy);
    });
    pad.addEventListener('pointermove', (e) => {
      if (!state.dragging) return;
      const p = pointerToNormalized(e.clientX, e.clientY);
      updatePosition(p.dx, p.dy);
    });
    const release = () => {
      if (!state.dragging) return;
      state.dragging = false;
      setSwitch(false);
    };
    pad.addEventListener('pointerup', release);
    pad.addEventListener('pointercancel', release);
    pad.addEventListener('pointerleave', release);

    function reset() {
      state.x = 512; state.y = 512;
      dot.style.transform = 'translate(-50%, -50%)';
      if (label) label.textContent = 'X:512 Y:512';
      setSwitch(false);
    }
    if (btnR) btnR.addEventListener('click', reset);
    commitToGlobal();
    return { getX:()=>state.x, getY:()=>state.y, getSW:()=>state.sw, reset, side:sideKey };
  }

  function bindD2Button() {
    const btn = document.getElementById('btnD2Sim');
    if (!btn) { setTimeout(bindD2Button, 500); return; }
    if (btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    const stateEl = document.getElementById('btnD2State');
    const press = () => {
      if (!window.joystickData) window.joystickData = { left:{x:500,y:500,sw:0}, right:{x:500,y:500,sw:0} };
      window.joystickData.left.sw = 1;
      btn.style.background = '#d4af37';
      btn.style.color = '#000';
      if (stateEl) stateEl.textContent = '상태: LOW (0)';
    };
    const release = () => {
      if (window.joystickData?.left) window.joystickData.left.sw = 0;
      btn.style.background = '#444';
      btn.style.color = '#fff';
      if (stateEl) stateEl.textContent = '상태: HIGH (1)';
    };
    btn.addEventListener('mousedown',  press);
    btn.addEventListener('mouseup',    release);
    btn.addEventListener('mouseleave', release);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); press();   });
    btn.addEventListener('touchend',   (e) => { e.preventDefault(); release(); });
    console.log('✅ D2 버튼 바인딩 완료');
  }

  function initJoyPads() {
    const JoyPad1 = createJoyPad('joyPad1', 'joyDot1', 'joyValue1', 'joySw1State', 'joyResetBtn1', 'left',  2);
    const JoyPad2 = createJoyPad('joyPad2', 'joyDot2', 'joyValue2', 'joySw2State', 'joyResetBtn2', 'right', 7);
    if (JoyPad1) console.log('✅ JoyPad1 활성화');
    if (JoyPad2) console.log('✅ JoyPad2 활성화');
    window.JoyPad1 = JoyPad1;
    window.JoyPad2 = JoyPad2;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initJoyPads(); bindD2Button(); });
  } else {
    initJoyPads();
    bindD2Button();
  }

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab[data-tab="sim"]');
    if (!tab) return;
    setTimeout(() => {
      if (!window.JoyPad1 || !window.JoyPad2) initJoyPads();
      bindD2Button();
    }, 150);
  });

  console.log('🎮 v2.8.9 인터랙티브 조이스틱 시뮬 로드됨');
})();


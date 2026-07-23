
(function () {
  // 스타일을 코드로 직접 주입 (별도 CSS 파일 수정 불필요)
  const style = document.createElement('style');
  style.textContent = `
  #robot-3d-view {
  transition: height 0.3s ease;
}
#robot-3d-view.zoom-active {
  height: 480px !important;
}

  `;
  document.head.appendChild(style);
    // 초음파 거리 오버레이 라벨 생성 (3D 뷰 위 우측 상단)
  function ensureUsOverlay() {
    const view = document.getElementById('robot-3d-view');
    if (!view) return null;
    if (getComputedStyle(view).position === 'static') view.style.position = 'relative';
    let ov = document.getElementById('usOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'usOverlay';
      ov.style.cssText =
        'position:absolute; top:8px; right:8px; z-index:10;' +
        'background:rgba(0,0,0,0.6); color:#ffd479;' +
        'padding:4px 10px; border-radius:6px; font-size:14px;' +
        'font-weight:bold; pointer-events:none; display:none;';
      view.appendChild(ov);
    }
    return ov;
  }

  // 실행 중일 때 0.2초마다 초음파 값 갱신
  setInterval(() => {
    const ov = ensureUsOverlay();
    if (!ov) return;
    if (window._runtimeRunning) {
      const us = (window._ultrasonicValue != null) ? Math.round(window._ultrasonicValue) : '-';
      ov.textContent = '📏 ' + us + ' cm';
      ov.style.display = 'block';
    } else {
      ov.style.display = 'none';
    }
  }, 200);


    // ▶ 실행 시작 시: 확대 (실행 중엔 계속 확대 상태 유지)
  window.triggerRobotZoom = function () {
    if (!window._runtimeRunning) return;
    const view = document.getElementById('robot-3d-view');
    if (!view) return;
    view.classList.add('zoom-active');
  };

  // ⏹ 정지 시: 축소 (수동 호출용)
  window.stopRobotZoom = function () {
    const view = document.getElementById('robot-3d-view');
    if (view) view.classList.remove('zoom-active');
  };

  // ★ _runtimeRunning이 false로 바뀌는 순간을 자동 감지하여 축소
  (function watchRuntimeStop(){
    let lastState = null;
    setInterval(function(){
      const cur = !!window._runtimeRunning;
      if (cur === lastState) return;
      lastState = cur;
      const view = document.getElementById('robot-3d-view');
      if (!view) return;
      if (cur) view.classList.add('zoom-active');
      else view.classList.remove('zoom-active');
    }, 100);
  })();

})();


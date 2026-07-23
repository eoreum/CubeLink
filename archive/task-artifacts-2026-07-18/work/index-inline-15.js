
(function() {
  'use strict';

  // 3D 뷰 컨테이너의 크기가 (미디어 쿼리/clamp 등으로) 바뀌면
  // simulator3D.js의 onResize가 자동 호출되도록 window resize 이벤트를 발사
  function triggerResize() {
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('resize'));
    }
  }

  function attachObserver() {
    const view = document.getElementById('robot-3d-view');
    if (!view) return false;
    if (typeof ResizeObserver === 'undefined') return false;

    let lastW = 0, lastH = 0;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        // 의미 있는 크기 변화만 (1px 미만 무시)
        if (Math.abs(cr.width - lastW) < 1 && Math.abs(cr.height - lastH) < 1) continue;
        lastW = cr.width;
        lastH = cr.height;
        triggerResize();
      }
    });
    ro.observe(view);
    console.log('[v2.8.9] 3D 뷰 ResizeObserver 활성화');
    return true;
  }

  // 로드 직후 시도, 안 되면 잠시 후 재시도 (simulator3D.js 늦게 init되는 경우)
  window.addEventListener('load', () => {
    if (!attachObserver()) {
      setTimeout(attachObserver, 500);
      setTimeout(attachObserver, 1500);
    }
  });
})();



  // exe(Electron)에서는 다운로드 버튼 숨김 — 웹에서만 표시 + 다운로드 안내 팝업
  document.addEventListener('DOMContentLoaded', function () {
    if (window.cubelink) {
      const b = document.getElementById('btn-download-exe');
      if (b) b.style.display = 'none';
    }

    // 다운로드 버튼 클릭 시 안내 팝업 표시 (웹 전용)
    const dlBtn = document.getElementById('btn-download-exe');
    const guide = document.getElementById('dlGuide');
    if (dlBtn && guide) {
      dlBtn.addEventListener('click', function () {
        guide.classList.add('show');
        clearTimeout(window._dlGuideTimer);
        window._dlGuideTimer = setTimeout(() => guide.classList.remove('show'), 12000);
      });
    }
  });


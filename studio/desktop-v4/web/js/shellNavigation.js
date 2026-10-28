'use strict';

(() => {
  const shell = window.studioShell;
  if (!shell || typeof shell.openHome !== 'function') return;
  const targets = [document.getElementById('unifiedIntroHomeLogo'), document.getElementById('brandLogo')].filter(Boolean);
  targets.forEach(target => {
    target.hidden = false;
    target.dataset.unifiedHomeLogo = 'true';
    target.setAttribute('role', 'button');
    target.setAttribute('tabindex', '0');
    target.setAttribute('aria-label', '통합 대문으로 돌아가기');
    target.title = '통합 대문으로 돌아가기';
    const goHome = async event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      target.setAttribute('aria-busy', 'true');
      try {
        const result = await shell.openHome();
        if (!result || !result.ok) window.alert(result && result.message || '통합 대문으로 돌아갈 수 없습니다.');
      } finally {
        target.removeAttribute('aria-busy');
      }
    };
    target.addEventListener('click', goHome, true);
    target.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') goHome(event);
    }, true);
  });
})();

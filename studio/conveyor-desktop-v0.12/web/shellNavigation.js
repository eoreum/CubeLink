'use strict';

(() => {
  const logo = document.getElementById('brandLogo');
  const shell = window.studioShell;
  if (!logo || !shell || typeof shell.openHome !== 'function') return;
  logo.dataset.unifiedHomeLogo = 'true';
  logo.setAttribute('role', 'button');
  logo.setAttribute('tabindex', '0');
  logo.setAttribute('aria-label', '통합 대문으로 돌아가기');
  const goHome = async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    logo.setAttribute('aria-busy', 'true');
    try {
      const result = await shell.openHome();
      if (!result || !result.ok) window.alert(result && result.message || '통합 대문으로 돌아갈 수 없습니다.');
    } finally {
      logo.removeAttribute('aria-busy');
    }
  };
  logo.addEventListener('click', goHome, true);
  logo.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') goHome(event);
  }, true);
})();

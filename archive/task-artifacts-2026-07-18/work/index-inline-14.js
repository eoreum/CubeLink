
(function() {
  let isRunning = false;

  function fitToViewport() {
    if (isRunning) return;
    isRunning = true;
    try {
      if (window.workspace
          && typeof Blockly !== 'undefined'
          && typeof Blockly.svgResize === 'function') {
        Blockly.svgResize(window.workspace);
      }
    } finally {
      isRunning = false;
    }
  }

  window.addEventListener('load', () => {
    fitToViewport();
    setTimeout(fitToViewport, 200);
    setTimeout(fitToViewport, 600);
    setTimeout(fitToViewport, 1200);
  });
  window.addEventListener('resize', fitToViewport);
})();


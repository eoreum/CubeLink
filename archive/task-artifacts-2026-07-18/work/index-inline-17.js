
(function() {
  'use strict';
  let patched = false;

  function getBlocklyVersion() {
    if (typeof Blockly === 'undefined') return 'undefined';
    return Blockly.VERSION || (Blockly.utils && Blockly.utils.VERSION) || 'unknown';
  }

  function findFieldFromTarget(target) {
    let el = target;
    while (el && el !== document) {
      const cls = (el.getAttribute && el.getAttribute('class')) || '';
      if (cls.includes('blocklyEditableText') || cls.includes('blocklyDropdown')) return el;
      el = el.parentNode;
    }
    return null;
  }

  function findFieldInWorkspace(svgElement) {
    const allWs = (typeof Blockly.getAllWorkspaces === 'function')
      ? Blockly.getAllWorkspaces()
      : (Blockly.Workspace && Blockly.Workspace.getAll ? Blockly.Workspace.getAll() : []);
    for (const ws of allWs) {
      const blocks = ws.getAllBlocks ? ws.getAllBlocks(false) : [];
      for (const block of blocks) {
        if (!block.inputList) continue;
        for (const input of block.inputList) {
          for (const field of input.fieldRow) {
            const root = field.getSvgRoot && field.getSvgRoot();
            if (root && (root === svgElement || root.contains(svgElement))) return field;
          }
        }
      }
    }
    return null;
  }

  function onPointerDownCapture(e) {
    const flyoutEl = e.target.closest && e.target.closest('.blocklyFlyout');
    if (!flyoutEl) return;
    const fieldSvg = findFieldFromTarget(e.target);
    if (!fieldSvg) return;
    const field = findFieldInWorkspace(fieldSvg);
    if (!field) return;
    const isDropdown = field.constructor && field.constructor.name === 'FieldDropdown';
    const isEditable = typeof field.showEditor_ === 'function';
    if (!isDropdown && !isEditable) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    try { field.showEditor_(e); }
    catch(err) {
      try { field.showEditor_(); } catch(err2) { console.warn('필드 에디터 호출 실패:', err2.message); }
    }
  }

  function applyPatch() {
    if (patched) return;
    if (typeof Blockly === 'undefined') { setTimeout(applyPatch, 300); return; }
    document.addEventListener('pointerdown', onPointerDownCapture, true);
    document.addEventListener('mousedown',   onPointerDownCapture, true);
    document.addEventListener('touchstart',  onPointerDownCapture, true);
    patched = true;
    console.log('✅ 플라이아웃 드롭다운 패치 적용 (Blockly ' + getBlocklyVersion() + ')');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(applyPatch, 500));
  } else {
    setTimeout(applyPatch, 500);
  }
})();


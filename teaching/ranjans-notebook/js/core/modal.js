/* ═══════════════════════════════════════════════
   Modal — Custom prompt/confirm dialogs
   ═══════════════════════════════════════════════ */
const Modal = (() => {
  const _overlay = () => document.getElementById('modal-overlay');
  const _title   = () => document.getElementById('modal-title');
  const _input   = () => document.getElementById('modal-input');
  const _ok      = () => document.getElementById('modal-ok');
  const _cancel  = () => document.getElementById('modal-cancel');

  function _show(title, placeholder, defaultVal, showInput) {
    return new Promise(resolve => {
      const overlay = _overlay();
      const input = _input();
      const ok = _ok();
      const cancel = _cancel();

      _title().textContent = title;
      input.style.display = showInput ? '' : 'none';
      input.placeholder = placeholder || '';
      input.value = defaultVal || '';

      overlay.classList.add('visible');
      if (showInput) setTimeout(() => { input.focus(); input.select(); }, 50);

      function cleanup() {
        overlay.classList.remove('visible');
        ok.removeEventListener('click', onOk);
        cancel.removeEventListener('click', onCancel);
        input.removeEventListener('keydown', onKey);
        document.removeEventListener('keydown', onEsc);
      }

      function onOk() {
        cleanup();
        resolve(showInput ? input.value.trim() : true);
      }
      function onCancel() {
        cleanup();
        resolve(showInput ? null : false);
      }
      function onKey(e) {
        if (e.key === 'Enter') onOk();
        if (e.key === 'Escape') onCancel();
      }
      function onEsc(e) {
        if (e.key === 'Escape') onCancel();
      }

      ok.addEventListener('click', onOk);
      cancel.addEventListener('click', onCancel);
      if (showInput) input.addEventListener('keydown', onKey);
      else document.addEventListener('keydown', onEsc);
    });
  }

  return {
    prompt(title, placeholder, defaultVal) {
      return _show(title, placeholder, defaultVal, true);
    },
    confirm(title) {
      return _show(title, '', '', false);
    }
  };
})();

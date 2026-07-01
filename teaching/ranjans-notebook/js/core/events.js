/* ═══════════════════════════════════════════════
   Events — Simple pub/sub event bus
   ═══════════════════════════════════════════════ */

'use strict';

const Events = (() => {
  const _listeners = {};

  return {
    on(event, fn) {
      if (!_listeners[event]) _listeners[event] = [];
      _listeners[event].push(fn);
    },

    emit(event, data) {
      if (_listeners[event]) {
        _listeners[event].forEach(fn => fn(data));
      }
    },

    off(event, fn) {
      if (_listeners[event]) {
        _listeners[event] = _listeners[event].filter(f => f !== fn);
      }
    }
  };
})();

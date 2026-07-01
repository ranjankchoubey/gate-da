/* ═══════════════════════════════════════════════
   Router — Page navigation with history
   ═══════════════════════════════════════════════ */

'use strict';

const Router = (() => {
  let _history = [];
  let _index = -1;

  return {
    init() {
      const lastPage = Store.getCurrentPageId();
      if (lastPage && Store.findPage(lastPage)) {
        this.go(lastPage, false);
      }
    },

    go(pageId, recordHistory = true) {
      // Save current page before leaving
      const currentId = Store.getCurrentPageId();
      if (currentId) {
        EditorComponent.saveCurrentPage();
      }

      if (recordHistory) {
        _history = _history.slice(0, _index + 1);
        _history.push(pageId);
        _index = _history.length - 1;
      }

      Store.setCurrentPageId(pageId);
      EditorComponent.renderPage(pageId);
      SidebarComponent.setActive(pageId);
      App.updateBreadcrumb(pageId);
    },

    back() {
      if (_index > 0) {
        _index--;
        this.go(_history[_index], false);
      }
    },

    forward() {
      if (_index < _history.length - 1) {
        _index++;
        this.go(_history[_index], false);
      }
    },

    canGoBack() { return _index > 0; },
    canGoForward() { return _index < _history.length - 1; }
  };
})();

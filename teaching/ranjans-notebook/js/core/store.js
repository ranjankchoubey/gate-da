/* ═══════════════════════════════════════════════
   Store — Data persistence (localStorage + JSON)
   All data mutations go through here.
   ═══════════════════════════════════════════════ */

'use strict';

const Store = (() => {
  const STORAGE_KEY = 'ranjans-notebook';

  // ─── Internal state ───
  let _data = null;

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      _data = raw ? JSON.parse(raw) : { notebooks: [], currentPageId: null };
    } catch (e) {
      console.error('Store: failed to load', e);
      _data = { notebooks: [], currentPageId: null };
    }
  }

  function _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_data));
    } catch (e) {
      console.error('Store: failed to save', e);
    }
  }

  function _id() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }

  // ─── Public API ───
  return {
    init() { _load(); },

    // Getters
    getNotebooks() { return _data.notebooks; },
    getCurrentPageId() { return _data.currentPageId; },

    setCurrentPageId(id) {
      _data.currentPageId = id;
      _save();
    },

    // Find
    findPage(pageId) {
      for (const nb of _data.notebooks) {
        for (const sec of nb.sections) {
          const p = sec.pages.find(pg => pg.id === pageId);
          if (p) return { notebook: nb, section: sec, page: p };
        }
      }
      return null;
    },

    // ─── Notebook CRUD ───
    addNotebook(name) {
      const nb = { id: _id(), name, icon: '📘', sections: [], createdAt: new Date().toISOString() };
      _data.notebooks.push(nb);
      _save();
      return nb;
    },

    renameNotebook(id, name) {
      const nb = _data.notebooks.find(n => n.id === id);
      if (nb) { nb.name = name; _save(); }
    },

    deleteNotebook(id) {
      _data.notebooks = _data.notebooks.filter(n => n.id !== id);
      _save();
    },

    // ─── Section CRUD ───
    addSection(notebookId, name) {
      const nb = _data.notebooks.find(n => n.id === notebookId);
      if (!nb) return null;
      const sec = { id: _id(), name, icon: '📂', pages: [] };
      nb.sections.push(sec);
      _save();
      return sec;
    },

    renameSection(notebookId, sectionId, name) {
      const nb = _data.notebooks.find(n => n.id === notebookId);
      if (!nb) return;
      const sec = nb.sections.find(s => s.id === sectionId);
      if (sec) { sec.name = name; _save(); }
    },

    deleteSection(notebookId, sectionId) {
      const nb = _data.notebooks.find(n => n.id === notebookId);
      if (!nb) return;
      nb.sections = nb.sections.filter(s => s.id !== sectionId);
      _save();
    },

    // ─── Page CRUD ───
    addPage(notebookId, sectionId, title) {
      const nb = _data.notebooks.find(n => n.id === notebookId);
      if (!nb) return null;
      const sec = nb.sections.find(s => s.id === sectionId);
      if (!sec) return null;
      const page = {
        id: _id(), title, status: 'todo', tags: [], blocks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      sec.pages.push(page);
      _save();
      return page;
    },

    updatePage(pageId, updates) {
      const result = this.findPage(pageId);
      if (!result) return;
      Object.assign(result.page, updates, { updatedAt: new Date().toISOString() });
      _save();
    },

    deletePage(pageId) {
      for (const nb of _data.notebooks) {
        for (const sec of nb.sections) {
          const idx = sec.pages.findIndex(p => p.id === pageId);
          if (idx !== -1) { sec.pages.splice(idx, 1); _save(); return; }
        }
      }
    },

    setPageStatus(pageId, status) {
      const result = this.findPage(pageId);
      if (result) { result.page.status = status; _save(); }
    },

    // ─── Block CRUD ───
    addBlock(pageId, type, title, content) {
      const result = this.findPage(pageId);
      if (!result) return null;
      const block = { id: _id(), type, title: title || '', content: content || '' };
      result.page.blocks.push(block);
      _save();
      return block;
    },

    updateBlock(pageId, blockId, updates) {
      const result = this.findPage(pageId);
      if (!result) return;
      const block = result.page.blocks.find(b => b.id === blockId);
      if (block) { Object.assign(block, updates); _save(); }
    },

    deleteBlock(pageId, blockId) {
      const result = this.findPage(pageId);
      if (!result) return;
      result.page.blocks = result.page.blocks.filter(b => b.id !== blockId);
      _save();
    },

    moveBlock(pageId, blockId, direction) {
      const result = this.findPage(pageId);
      if (!result) return;
      const blocks = result.page.blocks;
      const idx = blocks.findIndex(b => b.id === blockId);
      const target = idx + direction;
      if (target < 0 || target >= blocks.length) return;
      [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
      _save();
    },

    // ─── Export / Import ───
    exportJSON() {
      const blob = new Blob([JSON.stringify(_data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ranjans-notebook-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },

    importJSON(jsonStr) {
      try {
        _data = JSON.parse(jsonStr);
        _save();
        return true;
      } catch (e) {
        console.error('Import failed:', e);
        return false;
      }
    },

    // ─── Seed sample data ───
    loadSampleData(data) {
      _data = data;
      _save();
    }
  };
})();

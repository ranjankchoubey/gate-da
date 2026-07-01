/* ═══════════════════════════════════════════════
   Sidebar Component — Tree navigation
   ═══════════════════════════════════════════════ */

'use strict';

const SidebarComponent = (() => {
  let _el = null;

  function _render() {
    const notebooks = Store.getNotebooks();

    let html = `
      <div class="sidebar-brand">
        <h1>📓 Ranjan's Notebook</h1>
        <button class="btn-add" onclick="SidebarComponent.addNotebook()" title="New Notebook">+</button>
      </div>
      <div class="sidebar-search">
        <input type="text" placeholder="Search pages..." oninput="SidebarComponent.filter(this.value)">
      </div>
      <div class="sidebar-tree">
    `;

    if (notebooks.length === 0) {
      html += `<div style="padding:30px 16px;text-align:center;color:rgba(255,255,255,0.25);font-size:0.74rem;">
        No notebooks yet.<br>Click + to create one, or<br><br>
        <button class="btn primary" onclick="App.loadSampleData()" style="font-size:0.72rem;">Load sample data</button>
      </div>`;
    }

    for (const nb of notebooks) {
      html += `
        <div class="tree-notebook" data-nb-id="${nb.id}">
          <div class="tree-notebook-header">
            <span>${nb.icon || '📘'} ${nb.name}</span>
            <span class="tree-actions">
              <button class="tree-action" onclick="SidebarComponent.addSection('${nb.id}')">+§</button>
              <button class="tree-action" onclick="SidebarComponent.renameNotebook('${nb.id}')">✎</button>
              <button class="tree-action" onclick="SidebarComponent.deleteNotebook('${nb.id}')">✕</button>
            </span>
          </div>
      `;

      for (const sec of nb.sections) {
        html += `
          <div class="tree-section open" data-sec-id="${sec.id}" onclick="SidebarComponent.toggleSection(this, event)">
            <span>${sec.icon || '📂'} ${sec.name}</span>
            <span class="chevron">▶</span>
          </div>
          <div class="tree-pages open" data-sec-pages="${sec.id}">
        `;

        for (const page of sec.pages) {
          html += `
            <div class="tree-page" data-page-id="${page.id}" onclick="Router.go('${page.id}')">
              <span class="truncate">${page.title}</span>
              <span class="dot ${page.status || 'todo'}"></span>
            </div>
          `;
        }

        html += `
            <div class="tree-add-page" onclick="SidebarComponent.addPage('${nb.id}','${sec.id}')">+ page</div>
          </div>
        `;
      }
      html += '</div>';
    }

    html += '</div>';
    _el.innerHTML = html;
  }

  return {
    init() {
      _el = document.getElementById('sidebar');
      _render();
    },

    refresh() { _render(); },

    setActive(pageId) {
      _el.querySelectorAll('.tree-page').forEach(p => p.classList.remove('active'));
      const el = _el.querySelector(`.tree-page[data-page-id="${pageId}"]`);
      if (el) el.classList.add('active');
    },

    toggleSection(el, event) {
      event.stopPropagation();
      el.classList.toggle('open');
      const pages = el.nextElementSibling;
      if (pages) pages.classList.toggle('open');
    },

    filter(query) {
      const q = query.toLowerCase();
      _el.querySelectorAll('.tree-page').forEach(p => {
        const match = p.textContent.toLowerCase().includes(q) || !q;
        p.style.display = match ? '' : 'none';
      });
    },

    // CRUD actions
    addNotebook() {
      Modal.prompt('New Notebook', 'Notebook name').then(name => {
        if (name) { Store.addNotebook(name); _render(); }
      });
    },

    renameNotebook(id) {
      const nb = Store.getNotebooks().find(n => n.id === id);
      Modal.prompt('Rename Notebook', 'Name', nb?.name).then(name => {
        if (name) { Store.renameNotebook(id, name); _render(); }
      });
    },

    deleteNotebook(id) {
      Modal.confirm('Delete this entire notebook?').then(yes => {
        if (yes) { Store.deleteNotebook(id); _render(); }
      });
    },

    addSection(nbId) {
      Modal.prompt('New Section', 'Section name').then(name => {
        if (name) { Store.addSection(nbId, name); _render(); }
      });
    },

    addPage(nbId, secId) {
      Modal.prompt('New Page', 'Page title').then(title => {
        if (!title) return;
        const page = Store.addPage(nbId, secId, title);
        if (page) { _render(); Router.go(page.id); }
      });
    }
  };
})();

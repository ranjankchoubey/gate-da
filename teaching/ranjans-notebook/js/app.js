/* ═══════════════════════════════════════════════
   App — Main init, mode switching, coordination
   ═══════════════════════════════════════════════ */

'use strict';

const App = (() => {
  let _mode = 'build'; // 'build' | 'teach'

  function _renderToolbar() {
    const toolbar = document.getElementById('toolbar');
    const isBuild = _mode === 'build';
    toolbar.innerHTML = `
      <div class="toolbar-nav">
        <button class="btn ghost sm" onclick="Router.back()">◀</button>
        <button class="btn ghost sm" onclick="Router.forward()">▶</button>
        <span class="toolbar-breadcrumb" id="breadcrumb"></span>
      </div>
      <div class="toolbar-spacer"></div>
      <div class="toolbar-modes">
        <button class="btn ${isBuild ? 'active' : ''}" onclick="App.setMode('build')">📋 Build</button>
        <button class="btn ${!isBuild ? 'active' : ''}" onclick="App.setMode('teach')">🎓 Teach</button>
      </div>
      ${isBuild ? `<button class="btn" id="btn-edit" onclick="EditorComponent.toggleEdit()">✏️ Edit</button>
      <button class="btn" onclick="EditorComponent.addBlock()">+ Block</button>` : ''}
      <button class="btn ghost sm" onclick="App.zoomOut()" title="Decrease font size">A−</button>
      <button class="btn ghost sm" onclick="App.zoomIn()" title="Increase font size">A+</button>
      <button class="btn ghost sm" onclick="App.exportPDF()" title="Export PDF">📄</button>
    `;
  }

  return {
    init() {
      Store.init();

      // Only load sample data on FIRST visit (no notebooks in storage)
      if (Store.getNotebooks().length === 0) {
        Store.loadSampleData(SAMPLE_DATA);
      }

      _renderToolbar();
      SidebarComponent.init();
      EditorComponent.init();

      const currentPage = Store.getCurrentPageId();
      if (currentPage && Store.findPage(currentPage)) {
        Router.init();
      } else {
        // Navigate to first available page
        const notebooks = Store.getNotebooks();
        if (notebooks.length > 0 && notebooks[0].sections.length > 0 && notebooks[0].sections[0].pages.length > 0) {
          Router.go(notebooks[0].sections[0].pages[0].id);
        } else {
          EditorComponent.showWelcome();
        }
      }

      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // Skip shortcuts when user is typing in any input/textarea/contenteditable
        const tag = e.target.tagName;
        if (e.target.contentEditable === 'true' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault();
          EditorComponent.saveCurrentPage();
          App.toast('Saved!', 'success');
        }
        // Teach mode shortcuts (only single-letter keys without modifiers)
        if (_mode === 'teach' && !e.metaKey && !e.ctrlKey && !e.altKey) {
          if (e.key === 'ArrowRight') TeachMode.next();
          if (e.key === 'ArrowLeft') TeachMode.prev();
          if (e.key === 'f') CanvasComponent.setTool('pen'); // f = freehand/pen
          if (e.key === 'v') CanvasComponent.setTool('select');
          if (e.key === 'e') CanvasComponent.setTool('eraser');
          if (e.key === 'l') CanvasComponent.setTool('line');
          if (e.key === 'a') CanvasComponent.setTool('arrow');
          if (e.key === 'r') CanvasComponent.setTool('rect');
          if (e.key === 'c') CanvasComponent.setTool('circle');
          if (e.key === 'd') CanvasComponent.toggleDashed();
          if (e.key === 'b') TeachMode.toggleFullBoard();
          if (e.key === 'Escape') CanvasComponent.setTool('pen');
          if (e.key === 'Delete' || e.key === 'Backspace') CanvasComponent.deleteSelectedImage();
        }
        // Ctrl/Cmd shortcuts work regardless
        if (_mode === 'teach') {
          if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); CanvasComponent.undo(); }
          if (e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); CanvasComponent.redo(); }
          if (e.key === 'y' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); CanvasComponent.redo(); }
        }
      });
    },

    setMode(mode) {
      _mode = mode;
      _renderToolbar();

      const pageArea = document.getElementById('page-area');
      const pageId = Store.getCurrentPageId();
      const sidebar = document.getElementById('sidebar');

      // Auto-collapse sidebar in teach mode, show in build mode
      if (mode === 'teach' && !sidebar.classList.contains('collapsed')) {
        App.toggleSidebar();
      } else if (mode === 'build' && sidebar.classList.contains('collapsed')) {
        App.toggleSidebar();
      }

      if (mode === 'teach' && pageId) {
        const result = Store.findPage(pageId);
        if (!result) return;
        const { page } = result;

        pageArea.className = 'page-area teach-mode';
        pageArea.innerHTML = `
          <div class="teach-nav" id="teach-nav">
            <button class="btn sm" onclick="TeachMode.prev()">◀ Prev</button>
            <span class="teach-counter" id="teach-counter">All</span>
            <button class="btn sm" onclick="TeachMode.next()">Next ▶</button>
            <button class="btn sm ghost" onclick="TeachMode.showAll()">Show All</button>
            <div style="flex:1"></div>
            <button class="btn sm ${TeachMode.focusOn ? 'active' : ''}" id="btn-focus" onclick="TeachMode.toggleFocus()">🔦 Focus</button>
            <button class="btn sm ghost" id="btn-fullboard" onclick="TeachMode.toggleFullBoard()">⛶ Board</button>
          </div>
          <div class="teach-split">
            <div class="teach-content" id="teach-content">
              <h2 class="teach-title">${page.title}</h2>
              <div class="teach-blocks" id="teach-blocks">
                ${page.blocks.map((b, i) => `
                  <div class="block" data-type="${b.type}" data-idx="${i}">
                    <span class="block-badge ${b.type}">${b.type}</span>
                    <div class="block-title">${b.title}</div>
                    <div class="block-body">${b.content}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="teach-divider" id="teach-divider"></div>
            <div class="teach-canvas" id="teach-canvas"></div>
          </div>
        `;

        CanvasComponent.attach(document.getElementById('teach-canvas'));
        TeachMode.init();
        App._initDividerDrag();

        try {
          renderMathInElement(pageArea, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false }
            ],
            throwOnError: false
          });
        } catch (e) {}

      } else {
        pageArea.className = 'page-area';
        CanvasComponent.detach();
        if (pageId) {
          EditorComponent.renderPage(pageId);
        } else {
          EditorComponent.showWelcome();
        }
      }
    },

    updateBreadcrumb(pageId) {
      const bc = document.getElementById('breadcrumb');
      if (!bc) return;
      const result = Store.findPage(pageId);
      if (!result) { bc.textContent = ''; return; }
      bc.innerHTML = `
        <span class="crumb-link">${result.notebook.name}</span>
        <span class="crumb-sep">›</span>
        <span class="crumb-link">${result.section.name}</span>
        <span class="crumb-sep">›</span>
        <span>${result.page.title}</span>
      `;
    },

    toast(msg, type = 'info') {
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    },

    zoomIn() {
      const current = parseFloat(getComputedStyle(document.documentElement).fontSize);
      document.documentElement.style.fontSize = Math.min(current + 1, 22) + 'px';
    },

    zoomOut() {
      const current = parseFloat(getComputedStyle(document.documentElement).fontSize);
      document.documentElement.style.fontSize = Math.max(current - 1, 12) + 'px';
    },

    toggleSidebar() {
      const sidebar = document.getElementById('sidebar');
      const toggle = document.getElementById('sidebar-toggle');
      sidebar.classList.toggle('collapsed');
      const collapsed = sidebar.classList.contains('collapsed');
      toggle.innerHTML = collapsed ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>';
    },

    _initDividerDrag() {
      const divider = document.getElementById('teach-divider');
      const content = document.getElementById('teach-content');
      if (!divider || !content) return;

      let startX, startW;

      function onMouseDown(e) {
        e.preventDefault();
        startX = e.clientX;
        startW = content.offsetWidth;
        divider.classList.add('dragging');
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }

      function onMouseMove(e) {
        const dx = e.clientX - startX;
        const newW = Math.max(200, Math.min(startW + dx, window.innerWidth * 0.8));
        content.style.width = newW + 'px';
      }

      function onMouseUp() {
        divider.classList.remove('dragging');
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        // Resize canvas after divider move
        if (typeof CanvasComponent !== 'undefined') CanvasComponent.resize();
      }

      divider.addEventListener('mousedown', onMouseDown);
    },

    loadSampleData() {
      Store.loadSampleData(SAMPLE_DATA);
      SidebarComponent.refresh();
      Router.go(SAMPLE_DATA.currentPageId);
      App.toast('Sample data loaded!', 'success');
    },

    exportPDF() {
      const pageId = Store.getCurrentPageId();
      if (!pageId) { App.toast('No page selected', 'error'); return; }
      const result = Store.findPage(pageId);
      if (!result) return;
      const { page, notebook, section } = result;

      const printWin = window.open('', '_blank');
      printWin.document.write(`<!DOCTYPE html><html><head>
        <meta charset="UTF-8">
        <title>${page.title} — ${notebook.name}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px 50px; color: #1a1a2e; line-height: 1.6; }
          h1 { font-size: 1.6rem; margin-bottom: 4px; }
          .meta { font-size: 0.8rem; color: #666; margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; }
          .block { margin-bottom: 18px; padding: 14px 18px; border-radius: 8px; border-left: 4px solid #ccc; page-break-inside: avoid; }
          .block[data-type="concept"] { background: #eff6ff; border-color: #3b82f6; }
          .block[data-type="formula"] { background: #faf5ff; border-color: #a855f7; }
          .block[data-type="example"] { background: #f0fdf4; border-color: #10b981; }
          .block[data-type="warning"] { background: #fef2f2; border-color: #ef4444; }
          .block[data-type="gate"] { background: #fffbeb; border-color: #f59e0b; }
          .block[data-type="note"] { background: #f8fafc; border-color: #64748b; }
          .block-badge { display: inline-block; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 3px; margin-bottom: 6px; background: rgba(0,0,0,0.06); }
          .block-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 4px; }
          .block-body { font-size: 0.85rem; }
          .block-body p { margin-bottom: 6px; }
          .block-body ul, .block-body ol { padding-left: 20px; }
          .formula-display { text-align: center; padding: 10px; margin: 8px 0; background: white; border-radius: 6px; border: 1px solid #e5e7eb; }
          details summary { cursor: pointer; font-weight: 600; color: #3b82f6; }
          @media print { body { padding: 20px 30px; } .block { box-shadow: none; } }
        </style>
      </head><body>
        <h1>${page.title}</h1>
        <div class="meta">${notebook.name} › ${section.name} ${page.tags ? '&nbsp; | &nbsp;' + page.tags.join(', ') : ''}</div>
        ${page.blocks.map(b => `
          <div class="block" data-type="${b.type}">
            <span class="block-badge">${b.type}</span>
            <div class="block-title">${b.title}</div>
            <div class="block-body">${b.content}</div>
          </div>
        `).join('')}
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
        <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"><\/script>
        <script>
          document.addEventListener('DOMContentLoaded', () => {
            renderMathInElement(document.body, {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
              ], throwOnError: false
            });
            setTimeout(() => window.print(), 500);
          });
        <\/script>
      </body></html>`);
      printWin.document.close();
    }
  };
})();

// ═══════════════════════════════════════════════
// TeachMode — Focus, step-through, timer
// ═══════════════════════════════════════════════
const TeachMode = (() => {
  let _index = -1; // -1 = show all
  let _focusOn = false;
  let _timerRunning = false;
  let _timerSec = 0;
  let _timerInterval = null;

  function _blocks() {
    return document.querySelectorAll('#teach-blocks .block');
  }

  function _update() {
    const blocks = _blocks();
    const counter = document.getElementById('teach-counter');

    if (_index === -1) {
      blocks.forEach(b => { b.style.display = ''; b.classList.remove('active'); });
      if (counter) counter.textContent = 'All';
    } else {
      blocks.forEach((b, i) => {
        if (_focusOn) {
          b.style.display = '';
          b.classList.toggle('active', i === _index);
        } else {
          b.style.display = i === _index ? '' : 'none';
          b.classList.remove('active');
        }
      });
      if (counter) counter.textContent = `${_index + 1} / ${blocks.length}`;
    }

    // Scroll to active
    if (_index >= 0) {
      const active = _focusOn
        ? document.querySelector('#teach-blocks .block.active')
        : _blocks()[_index];
      if (active) active.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return {
    get focusOn() { return _focusOn; },

    init() {
      _index = -1;
      _focusOn = false;
      _update();
    },

    next() {
      const total = _blocks().length;
      if (total === 0) return;
      _index = Math.min(_index + 1, total - 1);
      _update();
    },

    prev() {
      if (_index <= 0) { _index = 0; }
      else { _index--; }
      _update();
    },

    showAll() {
      _index = -1;
      _focusOn = false;
      const tc = document.getElementById('teach-content');
      if (tc) tc.classList.remove('spotlight');
      document.querySelectorAll('#teach-blocks .block').forEach(b => b.classList.remove('active'));
      _update();
    },

    toggleFocus() {
      _focusOn = !_focusOn;
      const btn = document.getElementById('btn-focus');
      if (btn) btn.classList.toggle('active', _focusOn);
      const tc = document.getElementById('teach-content');
      if (tc) tc.classList.toggle('spotlight', _focusOn);

      if (_focusOn && _index === -1) _index = 0;
      _update();
    },

    toggleFullBoard() {
      const pageArea = document.getElementById('page-area');
      if (!pageArea) return;
      pageArea.classList.toggle('full-board');
      const btn = document.getElementById('btn-fullboard');
      const isFullBoard = pageArea.classList.contains('full-board');
      if (btn) btn.classList.toggle('full-board-active', isFullBoard);
      // Resize canvas after toggle
      setTimeout(() => { if (typeof CanvasComponent !== 'undefined') CanvasComponent.resize(); }, 50);
    }
  };
})();

// ═══════════════════════════════════════════════
// Sample Data (inline, loaded on demand)
// ═══════════════════════════════════════════════
const SAMPLE_DATA = {
  currentPageId: 'pg-stars-bars',
  notebooks: [
    {
      id: 'nb1', name: 'Probability & Statistics', icon: '📊',
      sections: [
        {
          id: 'sec1', name: 'Counting & Combinatorics', icon: '📐',
          pages: [
            {
              id: 'pg-rules', title: 'Product & Sum Rule', status: 'done',
              tags: ['Fundamental', 'Rosen Ch.6'],
              blocks: [
                { id: 'b1', type: 'concept', title: 'Product Rule (AND)', content: '<p>If a task consists of steps done <strong>in sequence</strong>:</p><div class="formula-display">$$\\text{Total} = n_1 \\times n_2 \\times \\cdots \\times n_k$$</div><p>Each step is independent. Think: "AND" = multiply.</p>' },
                { id: 'b2', type: 'concept', title: 'Sum Rule (OR)', content: '<p>If a task can be done <strong>one of several ways</strong> (mutually exclusive):</p><div class="formula-display">$$\\text{Total} = n_1 + n_2 + \\cdots + n_k$$</div><p>Think: "OR" = add.</p>' },
                { id: 'b3', type: 'example', title: 'License Plates', content: '<p><strong>Q:</strong> 3 letters followed by 3 digits. How many plates?</p><p><strong>A:</strong> $26^3 \\times 10^3 = 17{,}576{,}000$ (product rule — each position is a step)</p>' },
                { id: 'b4', type: 'example', title: 'Password Problem', content: '<p><strong>Q:</strong> Password is 6-8 characters (uppercase + digits), must have at least one digit.</p><p><strong>A:</strong> Total $-$ all-letters = $(36^6 - 26^6) + (36^7 - 26^7) + (36^8 - 26^8)$</p><p><em>Sum rule for length 6/7/8, subtraction for "at least one digit".</em></p>' },
                { id: 'b5', type: 'gate', title: 'GATE 2024 — Variable Names', content: '<p><strong>Q:</strong> Variable names in BASIC: 1 or 2 alphanumeric chars, must start with letter, 5 reserved words. How many valid names?</p><details><summary>Solution</summary><p>1-char: 26 (must be letter)<br>2-char: $26 \\times 36 - 5 = 931$<br>Total: $26 + 931 = 957$</p></details>' }
              ]
            },
            {
              id: 'pg-perm', title: 'Permutations', status: 'done',
              tags: ['nPr', 'Arrangements', 'Rosen Ch.6'],
              blocks: [
                { id: 'b10', type: 'formula', title: 'Permutations (without repetition)', content: '<div class="formula-display">$$P(n,r) = \\frac{n!}{(n-r)!}$$</div><p>Arrange $r$ items from $n$ distinct items. <strong>Order matters.</strong></p>' },
                { id: 'b11', type: 'formula', title: 'Permutations with Repetition', content: '<div class="formula-display">$$\\frac{n!}{n_1! \\cdot n_2! \\cdots n_k!}$$</div><p><strong>Example:</strong> "MISSISSIPPI" = $\\frac{11!}{4!\\cdot 4!\\cdot 2!\\cdot 1!} = 34{,}650$</p>' },
                { id: 'b12', type: 'warning', title: 'Permutation vs Combination', content: '<p>⚠️ Ask yourself: <strong>Does order matter?</strong></p><ul><li>"Arrange" / "line up" / "sequence" → Permutation</li><li>"Choose" / "select" / "committee" → Combination</li></ul>' },
                { id: 'b13', type: 'example', title: 'Rosen Ex: Seating 8 people around a circular table', content: '<p><strong>Q:</strong> How many ways can 8 people be seated around a circular table?</p><p><strong>A:</strong> Fix one person, arrange rest: $(8-1)! = 7! = 5040$</p><p><em>Circular permutation = $(n-1)!$ because rotations are equivalent.</em></p>' },
                { id: 'b14', type: 'example', title: 'Rosen: Bit strings of length 7', content: '<p><strong>Q:</strong> How many bit strings of length 7 are there?</p><p><strong>A:</strong> Each bit has 2 choices. By product rule: $2^7 = 128$</p>' },
                { id: 'b15', type: 'gate', title: 'GATE 2023 — Arrangements', content: '<p><strong>Q:</strong> In how many ways can 5 men and 4 women stand in a row such that no two women are adjacent?</p><details><summary>Solution</summary><p>Arrange 5 men: $5!$ ways<br>This creates 6 gaps: _M_M_M_M_M_<br>Choose 4 gaps for women: $\\binom{6}{4}$<br>Arrange women: $4!$<br>Total = $5! \\times \\binom{6}{4} \\times 4! = 120 \\times 15 \\times 24 = 43{,}200$</p></details>' }
              ]
            },
            {
              id: 'pg-comb', title: 'Combinations', status: 'done',
              tags: ['nCr', 'Selection'],
              blocks: [
                { id: 'b20', type: 'formula', title: 'Combinations', content: '<div class="formula-display">$$\\binom{n}{r} = \\frac{n!}{r!(n-r)!}$$</div><p>Choose $r$ items from $n$. Order does NOT matter.</p><p><strong>Key:</strong> $\\binom{n}{r} = \\binom{n}{n-r}$ (symmetry)</p>' },
                { id: 'b21', type: 'concept', title: 'Binomial Theorem', content: '<div class="formula-display">$$(x+y)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^{n-k} y^k$$</div><p>Useful identity: $\\sum_{k=0}^n \\binom{n}{k} = 2^n$ (set $x=y=1$)</p>' },
                { id: 'b26', type: 'concept', title: 'Pascal\'s Identity', content: '<div class="formula-display">$$\\binom{n}{k} = \\binom{n-1}{k-1} + \\binom{n-1}{k}$$</div><p>The basis of Pascal\'s triangle. Each entry is the sum of the two entries above it.</p><p>Proof: Count subsets of size $k$ from $\\{1,...,n\\}$ by whether they contain element $n$ or not.</p>' },
                { id: 'b27', type: 'concept', title: 'Vandermonde\'s Identity', content: '<div class="formula-display">$$\\binom{m+n}{r} = \\sum_{k=0}^{r} \\binom{m}{k}\\binom{n}{r-k}$$</div><p><strong>Combinatorial proof:</strong> Choose $r$ from two groups of $m$ and $n$ people. Split: $k$ from first group, $r-k$ from second.</p>' },
                { id: 'b22', type: 'gate', title: 'GATE DA 2024 — Divisibility', content: '<p><strong>Q:</strong> How many 4-digit numbers divisible by 3, using {1,3,4,6,7}, no repetition?</p><details><summary>Solution</summary><p>Sum divisible by 3. Check all 4-element subsets:<br>• {1,3,4,7}: sum=15 ✓ → $4! = 24$ arrangements<br>• {3,4,6,7}: sum=20 ✗<br>• {1,4,6,7}: sum=18 ✓ → $4! = 24$<br>Total = $48$</p></details>' },
                { id: 'b23', type: 'example', title: 'Rosen: Computer Network Paths', content: '<p><strong>Q:</strong> How many paths of length 4 are there between vertices $a$ and $b$ in a network with 12 intermediate nodes?</p><p><strong>A:</strong> Each path uses 3 intermediate nodes in sequence:<br>$P(12, 3) = 12 \\times 11 \\times 10 = 1320$ paths.</p>' },
                { id: 'b24', type: 'example', title: 'Rosen: Poker Hands', content: '<p><strong>Q:</strong> How many 5-card poker hands contain exactly one pair?</p><p><strong>A:</strong><br>• Choose the paired value: $\\binom{13}{1}$<br>• Choose 2 suits for pair: $\\binom{4}{2}$<br>• Choose 3 other values: $\\binom{12}{3}$<br>• Choose 1 suit each: $4^3$<br>Total: $13 \\times 6 \\times 220 \\times 64 = 1{,}098{,}240$</p>' }
              ]
            },
            {
              id: 'pg-stars-bars', title: 'Stars & Bars', status: 'done',
              tags: ['Distribution', 'GATE Favourite', 'Rosen Ch.6'],
              blocks: [
                { id: 'b30', type: 'concept', title: 'The Problem', content: '<p>How many ways to distribute $m$ identical objects into $n$ distinct boxes?</p><p>Equivalent to: <strong>non-negative integer solutions</strong> of $x_1 + x_2 + \\cdots + x_n = m$</p>' },
                { id: 'b31', type: 'formula', title: 'Stars & Bars Formula', content: '<div class="formula-display">$$\\binom{m+n-1}{n-1} = \\binom{m+n-1}{m}$$</div><p>Visualize: $m$ stars (objects) and $n-1$ bars (dividers). Choose positions for bars among $m+n-1$ slots.</p>' },
                { id: 'b32', type: 'formula', title: 'Positive Solutions Variant', content: '<div class="formula-display">If $x_i \\geq 1$: $\\quad\\binom{m-1}{n-1}$$</div><p><strong>Trick:</strong> Substitute $y_i = x_i - 1$ (each $y_i \\geq 0$), then solve $y_1 + \\cdots + y_n = m - n$</p>' },
                { id: 'b33', type: 'warning', title: '⚠️ Non-negative vs Positive', content: '<ul><li>$x_i \\geq 0$ → $\\binom{m+n-1}{n-1}$</li><li>$x_i \\geq 1$ → $\\binom{m-1}{n-1}$</li><li>$x_i \\geq c_i$ → substitute $y_i = x_i - c_i$, reduce to $\\geq 0$ case</li></ul><p><strong>GATE almost always tests this distinction!</strong></p>' },
                { id: 'b34', type: 'example', title: 'Worked Example', content: '<p><strong>Q:</strong> 10 identical chocolates among 4 kids, each kid gets at least 2.</p><p><strong>A:</strong> $x_i \\geq 2$. Let $y_i = x_i - 2$, then $y_1+y_2+y_3+y_4 = 10-8 = 2$, $y_i \\geq 0$.</p><p>Answer: $\\binom{2+4-1}{4-1} = \\binom{5}{3} = 10$</p>' },
                { id: 'b35', type: 'gate', title: 'GATE DA 2026', content: '<p><strong>Q:</strong> $x_1 + x_2 + x_3 + x_4 = 12$, positive integers. Number of solutions?</p><p>(A) 165 &nbsp; (B) 455 &nbsp; (C) 220 &nbsp; (D) 330</p><details><summary>Solution</summary><p>$\\binom{12-1}{4-1} = \\binom{11}{3} = \\frac{11 \\times 10 \\times 9}{6} = 165$</p><p><strong>Answer: (A)</strong></p></details>' },
                { id: 'b36', type: 'note', title: 'The Four Distribution Cases', content: '<div class="cases-grid"><div class="case-card c1"><h4>Dist → Dist</h4><div class="formula">$n^m$</div><div class="desc">Each object picks a box</div></div><div class="case-card c2"><h4>Indist → Dist</h4><div class="formula">$\\binom{m+n-1}{n-1}$</div><div class="desc">Stars & Bars</div></div><div class="case-card c3"><h4>Dist → Indist</h4><div class="formula">$B_m$</div><div class="desc">Bell number</div></div><div class="case-card c4"><h4>Indist → Indist</h4><div class="formula">$p(m)$</div><div class="desc">Integer partitions</div></div></div>' }
              ]
            },
            {
              id: 'pg-pie', title: 'Inclusion-Exclusion', status: 'done',
              tags: ['PIE', 'Derangements'],
              blocks: [
                { id: 'b40', type: 'concept', title: 'The Principle', content: '<p>When events/sets <strong>overlap</strong>, simple addition overcounts. PIE corrects this:</p><div class="formula-display">$$|A \\cup B| = |A| + |B| - |A \\cap B|$$</div>' },
                { id: 'b41', type: 'formula', title: 'General PIE (n sets)', content: '<div class="formula-display">$$\\left|\\bigcup_{i=1}^n A_i\\right| = \\sum|A_i| - \\sum|A_i \\cap A_j| + \\sum|A_i \\cap A_j \\cap A_k| - \\cdots$$</div><p>Alternating sum: add singles, subtract pairs, add triples, ...</p>' },
                { id: 'b42', type: 'example', title: 'Rosen: Integers 1-1000 divisible by 2, 3, or 5', content: '<p><strong>Q:</strong> How many integers from 1 to 1000 are divisible by at least one of 2, 3, 5?</p><p><strong>A:</strong><br>$|A_2|=500,\\ |A_3|=333,\\ |A_5|=200$<br>$|A_2 \\cap A_3|=166,\\ |A_2 \\cap A_5|=100,\\ |A_3 \\cap A_5|=66$<br>$|A_2 \\cap A_3 \\cap A_5|=33$<br>$= 500+333+200 - 166-100-66 + 33 = \\boxed{734}$</p>' },
                { id: 'b43', type: 'formula', title: 'Derangements — $D_n$', content: '<div class="formula-display">$$D_n = n! \\sum_{k=0}^{n} \\frac{(-1)^k}{k!} \\approx \\frac{n!}{e}$$</div><p>Permutations where <strong>no element</strong> is in its original position.</p><p>$D_1=0,\\ D_2=1,\\ D_3=2,\\ D_4=9,\\ D_5=44$</p>' },
                { id: 'b44', type: 'example', title: 'Hat-check Problem', content: '<p><strong>Q:</strong> 6 people check hats. How many ways can hats be returned so no one gets their own?</p><p><strong>A:</strong> $D_6 = 6!(1 - 1 + \\frac{1}{2} - \\frac{1}{6} + \\frac{1}{24} - \\frac{1}{120} + \\frac{1}{720})$<br>$= 720 \\times \\frac{53}{144} = 265$</p>' },
                { id: 'b45', type: 'gate', title: 'GATE 2022 — Onto Functions', content: '<p><strong>Q:</strong> Number of onto functions from a set of 5 elements to a set of 3 elements?</p><details><summary>Solution (PIE)</summary><p>Onto functions = total $-$ miss-at-least-one:<br>$3^5 - \\binom{3}{1}\\cdot 2^5 + \\binom{3}{2}\\cdot 1^5 - \\binom{3}{3}\\cdot 0^5$<br>$= 243 - 96 + 3 - 0 = 150$</p></details>' }
              ]
            },
            {
              id: 'pg-pigeon', title: 'Pigeonhole Principle', status: 'done',
              tags: ['PHP', 'Rosen Ch.6'],
              blocks: [
                { id: 'b50', type: 'concept', title: 'Basic Pigeonhole Principle', content: '<p>If $n+1$ or more objects are placed into $n$ boxes, then at least one box contains <strong>two or more</strong> objects.</p><p><em>Simple but powerful — most proofs are about identifying the "pigeons" and "holes".</em></p>' },
                { id: 'b51', type: 'formula', title: 'Generalized PHP', content: '<div class="formula-display">$$\\text{If } N \\text{ objects placed in } k \\text{ boxes, some box has} \\geq \\lceil N/k \\rceil \\text{ objects}$$</div>' },
                { id: 'b52', type: 'example', title: 'Rosen: Same-birthday in a group', content: '<p><strong>Q:</strong> Among 367 people, must at least two share a birthday?</p><p><strong>A:</strong> Yes! 367 pigeons, 366 holes (days). By PHP, at least one day has $\\geq 2$ people. ✓</p>' },
                { id: 'b53', type: 'example', title: 'Rosen: Subset with sum divisible by n', content: '<p><strong>Q:</strong> Show that among any $n+1$ integers, there exist two whose difference is divisible by $n$.</p><p><strong>Proof:</strong> Each integer has remainder $0,1,...,n-1$ when divided by $n$ (these are the $n$ holes). By PHP, two integers share a remainder → their difference is divisible by $n$. □</p>' },
                { id: 'b54', type: 'gate', title: 'GATE DA 2023 — Socks Problem', content: '<p><strong>Q:</strong> A drawer has 12 red, 10 blue, 8 green socks. How many must you pick (blindly) to guarantee a matching pair?</p><details><summary>Solution</summary><p>3 colors = 3 holes. Worst case: pick 1 of each = 3 socks, all different.<br>One more guarantees a pair: $\\boxed{4}$ socks needed.</p></details>' }
              ]
            }
          ]
        },
        {
          id: 'sec2', name: 'Probability Basics', icon: '🎲',
          pages: [
            { id: 'pg-sample', title: 'Sample Space & Events', status: 'todo', tags: [], blocks: [] },
            { id: 'pg-bayes', title: "Bayes' Theorem", status: 'todo', tags: [], blocks: [] }
          ]
        },
        {
          id: 'sec3', name: 'Random Variables', icon: '📈',
          pages: [
            { id: 'pg-rv', title: 'PMF, PDF, CDF', status: 'todo', tags: [], blocks: [] },
            { id: 'pg-dist', title: 'Distributions', status: 'todo', tags: [], blocks: [] }
          ]
        }
      ]
    },
    {
      id: 'nb2', name: 'Machine Learning', icon: '🤖',
      sections: [
        {
          id: 'sec-ml1', name: 'Regression', icon: '📉',
          pages: [
            { id: 'pg-linreg', title: 'Linear Regression', status: 'todo', tags: [], blocks: [] }
          ]
        },
        {
          id: 'sec-ml2', name: 'Classification', icon: '🔲',
          pages: [
            { id: 'pg-logreg', title: 'Logistic Regression', status: 'todo', tags: [], blocks: [] },
            { id: 'pg-svm', title: 'SVM', status: 'todo', tags: [], blocks: [] }
          ]
        }
      ]
    }
  ]
};

// ─── Boot ───
document.addEventListener('DOMContentLoaded', () => App.init());

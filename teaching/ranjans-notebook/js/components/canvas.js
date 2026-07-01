/* ═══════════════════════════════════════════════
   Canvas Component — Full-featured Teaching Whiteboard
   Tools: pen, eraser, text, line, arrow, rect, roundrect, circle, laser
   Features: undo/redo, shape fill, font picker, dashed lines, image paste,
             grid overlay, snap guides, save/restore per page
   ═══════════════════════════════════════════════ */

'use strict';

const CanvasComponent = (() => {
  let _canvas = null;
  let _ctx = null;
  let _container = null;
  let _drawing = false;
  let _paths = [];
  let _undoStack = [];
  let _color = '#1a1a2e';
  let _size = 3;
  let _eraserGrowth = 0;
  let _tool = 'pen';
  let _fill = false;
  let _dashed = false;
  let _fontFamily = 'sans-serif';
  let _fontSize = 20;
  let _resizeFn = null;
  let _shapeStart = null;
  // Image selection state
  let _selectedImage = null;
  let _imgDrag = null;
  let _imgResize = null;
  // Selection tool state
  let _selectBox = null;
  let _selectedItems = [];
  let _selDrag = null;
  // Laser pointer state
  let _laserTrail = [];
  let _laserRAF = null;
  // Grid state
  let _showGrid = false;
  // Current page ID (for save/restore)
  let _pageId = null;
  // Multi-board state
  let _boardIndex = 0;
  let _boardCount = 1;

  const SHAPE_TOOLS = ['line', 'arrow', 'rect', 'roundrect', 'circle'];
  const FONTS = [
    { label: 'Sans', value: '-apple-system, sans-serif' },
    { label: 'Serif', value: 'Georgia, serif' },
    { label: 'Mono', value: "'SF Mono', 'Fira Code', monospace" },
    { label: 'Hand', value: "'Caveat', cursive" },
  ];

  function _getPos(e) {
    const rect = _canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function _drawArrowhead(ctx, fromX, fromY, toX, toY, size) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLen = Math.max(12, size * 4);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - 0.4), toY - headLen * Math.sin(angle - 0.4));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle + 0.4), toY - headLen * Math.sin(angle + 0.4));
    ctx.stroke();
  }

  function _drawItem(item) {
    if (!_ctx) return;
    _ctx.strokeStyle = item.color;
    _ctx.fillStyle = item.fillColor || item.color;
    _ctx.lineWidth = item.size;
    _ctx.lineCap = 'round';
    _ctx.lineJoin = 'round';
    _ctx.setLineDash(item.dashed ? [8, 6] : []);

    switch (item.type) {
      case 'text':
        _ctx.font = `${item.fontSize || item.size}px ${item.fontFamily || '-apple-system, sans-serif'}`;
        _ctx.fillStyle = item.color;
        _ctx.fillText(item.text, item.x, item.y);
        break;
      case 'image':
        if (item.img) {
          // Draw with crop offset if set
          if (item.cropX != null) {
            _ctx.drawImage(item.img, item.cropX, item.cropY, item.cropW, item.cropH, item.x, item.y, item.w, item.h);
          } else {
            _ctx.drawImage(item.img, item.x, item.y, item.w, item.h);
          }
          // Draw selection border if selected
          if (_selectedImage === item) {
            _ctx.setLineDash([4, 4]);
            _ctx.strokeStyle = '#4f6ef7';
            _ctx.lineWidth = 2;
            _ctx.strokeRect(item.x - 2, item.y - 2, item.w + 4, item.h + 4);
            // Corner handles
            const hs = 8;
            _ctx.fillStyle = '#4f6ef7';
            _ctx.fillRect(item.x + item.w - hs/2, item.y + item.h - hs/2, hs, hs);
            _ctx.fillRect(item.x - hs/2, item.y - hs/2, hs, hs);
            _ctx.fillRect(item.x + item.w - hs/2, item.y - hs/2, hs, hs);
            _ctx.fillRect(item.x - hs/2, item.y + item.h - hs/2, hs, hs);
            // Show crop overlay button
            _showImageActions(item);
          }
        }
        break;
      case 'stroke':
        if (item.points.length < 2) break;
        _ctx.beginPath();
        _ctx.moveTo(item.points[0].x, item.points[0].y);
        for (let i = 1; i < item.points.length; i++) {
          _ctx.lineTo(item.points[i].x, item.points[i].y);
        }
        _ctx.stroke();
        break;
      case 'line':
        _ctx.beginPath();
        _ctx.moveTo(item.x1, item.y1);
        _ctx.lineTo(item.x2, item.y2);
        _ctx.stroke();
        break;
      case 'arrow':
        _ctx.beginPath();
        _ctx.moveTo(item.x1, item.y1);
        _ctx.lineTo(item.x2, item.y2);
        _ctx.stroke();
        _ctx.setLineDash([]);
        _drawArrowhead(_ctx, item.x1, item.y1, item.x2, item.y2, item.size);
        break;
      case 'rect':
        if (item.filled) {
          _ctx.globalAlpha = 0.2;
          _ctx.fillRect(item.x1, item.y1, item.x2 - item.x1, item.y2 - item.y1);
          _ctx.globalAlpha = 1;
        }
        _ctx.strokeRect(item.x1, item.y1, item.x2 - item.x1, item.y2 - item.y1);
        break;
      case 'roundrect': {
        const rx = item.x1, ry = item.y1, rw = item.x2 - item.x1, rh = item.y2 - item.y1;
        const r = Math.min(12, Math.abs(rw) * 0.15, Math.abs(rh) * 0.15);
        _ctx.beginPath();
        _ctx.roundRect(rx, ry, rw, rh, r);
        if (item.filled) {
          _ctx.globalAlpha = 0.2;
          _ctx.fill();
          _ctx.globalAlpha = 1;
        }
        _ctx.stroke();
        break;
      }
      case 'circle': {
        const rx = Math.abs(item.x2 - item.x1) / 2;
        const ry = Math.abs(item.y2 - item.y1) / 2;
        const cx = (item.x1 + item.x2) / 2;
        const cy = (item.y1 + item.y2) / 2;
        _ctx.beginPath();
        _ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (item.filled) {
          _ctx.globalAlpha = 0.2;
          _ctx.fill();
          _ctx.globalAlpha = 1;
        }
        _ctx.stroke();
        break;
      }
    }
    _ctx.setLineDash([]);
  }

  function _redraw() {
    if (!_ctx) return;
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    _drawGrid();
    if (!_selectedImage) _hideImageActions();
    for (const item of _paths) {
      _drawItem(item);
    }
  }

  function _drawSelectionBox() {
    if (!_ctx || !_selectBox) return;
    _ctx.save();
    _ctx.setLineDash([5, 3]);
    _ctx.strokeStyle = '#4f6ef7';
    _ctx.lineWidth = 1.5;
    _ctx.fillStyle = 'rgba(79, 110, 247, 0.05)';
    _ctx.fillRect(_selectBox.x, _selectBox.y, _selectBox.w, _selectBox.h);
    _ctx.strokeRect(_selectBox.x, _selectBox.y, _selectBox.w, _selectBox.h);
    _ctx.setLineDash([]);
    // Highlight each selected item
    if (_selectedItems.length > 0) {
      _ctx.strokeStyle = 'rgba(79, 110, 247, 0.5)';
      _ctx.lineWidth = 1;
      _ctx.setLineDash([3, 3]);
      for (const item of _selectedItems) {
        const bb = _getBounds(item);
        if (bb) _ctx.strokeRect(bb.x - 4, bb.y - 4, bb.w + 8, bb.h + 8);
      }
      _ctx.setLineDash([]);
    }
    _ctx.restore();
    _showSelectionActions();
  }

  function _getBounds(item) {
    if (item.type === 'stroke' && item.points?.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of item.points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    if (item.type === 'text') {
      return { x: item.x, y: item.y - (item.fontSize || 20), w: (item.text?.length || 1) * (item.fontSize || 20) * 0.6, h: (item.fontSize || 20) };
    }
    if (item.type === 'image') {
      return { x: item.x, y: item.y, w: item.w || 100, h: item.h || 100 };
    }
    if (item.x1 !== undefined) {
      const x = Math.min(item.x1, item.x2);
      const y = Math.min(item.y1, item.y2);
      return { x, y, w: Math.abs(item.x2 - item.x1), h: Math.abs(item.y2 - item.y1) };
    }
    return null;
  }

  function _showSelectionActions() {
    if (!_container) return;
    let panel = _container.querySelector('.sel-actions');
    if (_selectedItems.length === 0) {
      if (panel) panel.remove();
      return;
    }
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'sel-actions';
      _container.appendChild(panel);
    }
    panel.innerHTML = `
      <span class="sel-count">${_selectedItems.length} selected</span>
      <button class="sel-action-btn" onclick="CanvasComponent.deleteSelectedImage()" title="Delete selected (Del)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        Delete
      </button>
    `;
  }

  function _hideSelectionActions() {
    if (!_container) return;
    const panel = _container.querySelector('.sel-actions');
    if (panel) panel.remove();
  }

  // ─── Grid overlay ───
  function _drawGrid() {
    if (!_showGrid || !_ctx) return;
    _ctx.save();
    const step = 40;
    // Minor grid lines
    _ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    _ctx.lineWidth = 0.5;
    for (let x = step; x < _canvas.width; x += step) {
      _ctx.beginPath(); _ctx.moveTo(x, 0); _ctx.lineTo(x, _canvas.height); _ctx.stroke();
    }
    for (let y = step; y < _canvas.height; y += step) {
      _ctx.beginPath(); _ctx.moveTo(0, y); _ctx.lineTo(_canvas.width, y); _ctx.stroke();
    }
    // Major grid lines (every 4th = 160px)
    _ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    _ctx.lineWidth = 1;
    for (let x = step * 4; x < _canvas.width; x += step * 4) {
      _ctx.beginPath(); _ctx.moveTo(x, 0); _ctx.lineTo(x, _canvas.height); _ctx.stroke();
    }
    for (let y = step * 4; y < _canvas.height; y += step * 4) {
      _ctx.beginPath(); _ctx.moveTo(0, y); _ctx.lineTo(_canvas.width, y); _ctx.stroke();
    }
    _ctx.restore();
  }

  // ─── Snap angle helper (Shift held) ───
  function _snapAngle(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    // Snap to nearest 45°
    const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    return {
      x: start.x + dist * Math.cos(snapped),
      y: start.y + dist * Math.sin(snapped)
    };
  }

  // ─── Snap point to grid ───
  function _snapToGrid(pos) {
    if (!_showGrid) return pos;
    const step = 40;
    return {
      x: Math.round(pos.x / step) * step,
      y: Math.round(pos.y / step) * step
    };
  }

  // ─── Laser pointer animation ───
  function _animateLaser() {
    if (!_ctx) return;
    const now = Date.now();
    _laserTrail = _laserTrail.filter(p => now - p.t < 600);
    if (_laserTrail.length === 0 && _tool !== 'laser') {
      _laserRAF = null;
      _redraw();
      return;
    }
    _redraw();
    _ctx.save();
    for (let i = 0; i < _laserTrail.length; i++) {
      const p = _laserTrail[i];
      const age = (now - p.t) / 600;
      const alpha = 1 - age;
      const radius = 4 + age * 6;
      _ctx.beginPath();
      _ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      _ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.6})`;
      _ctx.fill();
      if (i === _laserTrail.length - 1) {
        // Bright dot at current position
        _ctx.beginPath();
        _ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        _ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        _ctx.fill();
        _ctx.beginPath();
        _ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        _ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.25})`;
        _ctx.fill();
      }
    }
    _ctx.restore();
    _laserRAF = requestAnimationFrame(_animateLaser);
  }

  // ─── Save/Restore canvas data per page+board ───
  function _boardKey() {
    return 'rn-canvas-' + _pageId + (_boardIndex > 0 ? '-b' + _boardIndex : '');
  }

  function _saveCanvasData() {
    if (!_pageId) return;
    // Save current board
    const serializable = _paths.map(item => {
      if (item.type === 'image' && item.img) {
        const c = document.createElement('canvas');
        c.width = item.img.naturalWidth;
        c.height = item.img.naturalHeight;
        c.getContext('2d').drawImage(item.img, 0, 0);
        return { ...item, img: null, dataURL: c.toDataURL('image/png') };
      }
      return item;
    });
    try {
      if (serializable.length > 0) {
        localStorage.setItem(_boardKey(), JSON.stringify(serializable));
      }
      // Save board count
      localStorage.setItem('rn-canvas-' + _pageId + '-count', _boardCount);
    } catch (e) { /* quota exceeded is non-fatal */ }
    _updateBoardNav();
  }

  function _restoreCanvasData(pageId) {
    // Read board count
    const countRaw = localStorage.getItem('rn-canvas-' + pageId + '-count');
    _boardCount = countRaw ? parseInt(countRaw, 10) : 1;
    if (_boardCount < 1) _boardCount = 1;
    _loadBoard();
  }

  function _loadBoard() {
    try {
      const raw = localStorage.getItem(_boardKey());
      _paths = [];
      _undoStack = [];
      if (!raw) { _redraw(); _updateBoardNav(); return; }
      const items = JSON.parse(raw);
      let pending = 0;
      items.forEach(item => {
        if (item.dataURL) {
          pending++;
          const img = new Image();
          img.onload = () => {
            item.img = img;
            delete item.dataURL;
            if (--pending === 0) _redraw();
          };
          img.src = item.dataURL;
        }
      });
      _paths = items;
      if (pending === 0) _redraw();
      _updateBoardNav();
    } catch (e) { /* corrupt data is non-fatal */ }
  }

  function _updateBoardNav() {
    if (!_container) return;
    let nav = _container.querySelector('.board-nav');
    if (!nav) {
      nav = document.createElement('div');
      nav.className = 'board-nav';
      _container.appendChild(nav);
    }
    nav.innerHTML = `
      <button class="board-nav-btn" onclick="CanvasComponent.prevBoard()" ${_boardIndex === 0 ? 'disabled' : ''}>◀</button>
      <span class="board-nav-label">Board ${_boardIndex + 1} / ${_boardCount}</span>
      <button class="board-nav-btn" onclick="CanvasComponent.nextBoard()">▶</button>
      <button class="board-nav-btn add" onclick="CanvasComponent.addBoard()" title="New board">+</button>
      <button class="board-nav-btn" onclick="CanvasComponent.downloadBoard()" title="Download as PNG">⤓</button>
      ${_boardCount > 1 ? `<button class="board-nav-btn del" onclick="CanvasComponent.deleteBoard()" title="Delete board">✕</button>` : ''}
    `;
  }

  function _showImageActions(item) {
    if (!_container) return;
    let panel = _container.querySelector('.img-actions');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'img-actions';
      panel.innerHTML = `
        <button class="img-action-btn" data-action="crop" title="Crop">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2v4H2"/><path d="M6 6h12v12"/><path d="M18 22v-4h4"/><path d="M18 18H6V6"/></svg>
          Crop
        </button>
        <button class="img-action-btn" data-action="delete" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          Delete
        </button>
      `;
      panel.querySelector('[data-action="crop"]').addEventListener('click', () => CanvasComponent.startCrop());
      panel.querySelector('[data-action="delete"]').addEventListener('click', () => CanvasComponent.deleteSelectedImage());
      _container.appendChild(panel);
    }
    panel.style.display = 'flex';
    panel.style.left = (item.x + item.w + 8) + 'px';
    panel.style.top = item.y + 'px';
  }

  function _hideImageActions() {
    if (!_container) return;
    const panel = _container.querySelector('.img-actions');
    if (panel) panel.style.display = 'none';
  }

  // Crop state
  let _cropping = false;
  let _cropStart = null;
  let _cropRect = null;

  function _updateToolbarState() {
    document.querySelectorAll('.canvas-toolbar .tool-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === _tool);
    });
    const fillBtn = document.getElementById('btn-fill');
    if (fillBtn) fillBtn.classList.toggle('active', _fill);
    const dashedBtn = document.getElementById('btn-dashed');
    if (dashedBtn) dashedBtn.classList.toggle('active', _dashed);
    const gridBtn = document.getElementById('btn-grid');
    if (gridBtn) gridBtn.classList.toggle('active', _showGrid);
    if (_canvas) {
      const cursors = { pen: 'crosshair', eraser: 'cell', text: 'text', select: 'default', laser: 'none' };
      _canvas.style.cursor = cursors[_tool] || 'crosshair';
    }
  }

  return {
    attach(container, pageId) {
      _container = container;
      _pageId = pageId || null;

      const fontOptions = FONTS.map((f, i) =>
        `<option value="${i}" ${i === 0 ? 'selected' : ''}>${f.label}</option>`
      ).join('');

      container.innerHTML = `
        <div class="canvas-toolbar">
          <div class="color-dot active" style="background:#1a1a2e" onclick="CanvasComponent.setColor('#1a1a2e',this)"></div>
          <div class="color-dot" style="background:#ef4444" onclick="CanvasComponent.setColor('#ef4444',this)"></div>
          <div class="color-dot" style="background:#3b82f6" onclick="CanvasComponent.setColor('#3b82f6',this)"></div>
          <div class="color-dot" style="background:#22c55e" onclick="CanvasComponent.setColor('#22c55e',this)"></div>
          <div class="color-dot" style="background:#f59e0b" onclick="CanvasComponent.setColor('#f59e0b',this)"></div>
          <div class="color-dot" style="background:#a855f7" onclick="CanvasComponent.setColor('#a855f7',this)"></div>
          <span class="sep"></span>
          <input type="range" min="1" max="12" value="3" class="stroke-slider" oninput="CanvasComponent.setSize(this.value)" title="Stroke width">
          <span class="sep"></span>
          <button class="tool-btn" data-tool="select" onclick="CanvasComponent.setTool('select')" title="Select & Move (V)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>
          </button>
          <button class="tool-btn" data-tool="pen" onclick="CanvasComponent.setTool('pen')" title="Pen (F)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
          </button>
          <button class="tool-btn" data-tool="eraser" onclick="CanvasComponent.setTool('eraser')" title="Eraser (E)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H7L3 16l10-10 8 8-4 4"/><path d="M6.5 17.5l4-4"/></svg>
          </button>
          <button class="tool-btn" data-tool="laser" onclick="CanvasComponent.setTool('laser')" title="Laser Pointer (Z)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7" stroke-dasharray="2 2"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
          </button>
          <button class="tool-btn" data-tool="text" onclick="CanvasComponent.setTool('text')" title="Text (T)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
          </button>
          <span class="sep"></span>
          <button class="tool-btn" data-tool="line" onclick="CanvasComponent.setTool('line')" title="Line (L)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="19" x2="19" y2="5"/></svg>
          </button>
          <button class="tool-btn" data-tool="arrow" onclick="CanvasComponent.setTool('arrow')" title="Arrow (A)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="12 5 19 5 19 12"/></svg>
          </button>
          <button class="tool-btn" data-tool="rect" onclick="CanvasComponent.setTool('rect')" title="Rectangle (R)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14"/></svg>
          </button>
          <button class="tool-btn" data-tool="roundrect" onclick="CanvasComponent.setTool('roundrect')" title="Rounded Rect">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="4"/></svg>
          </button>
          <button class="tool-btn" data-tool="circle" onclick="CanvasComponent.setTool('circle')" title="Circle (C)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>
          </button>
          <span class="sep"></span>
          <button class="tool-btn" id="btn-fill" onclick="CanvasComponent.toggleFill()" title="Fill shapes">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
          </button>
          <button class="tool-btn" id="btn-dashed" onclick="CanvasComponent.toggleDashed()" title="Dashed lines">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="4 3"><line x1="3" y1="12" x2="21" y2="12"/></svg>
          </button>
          <button class="tool-btn" id="btn-grid" onclick="CanvasComponent.toggleGrid()" title="Grid overlay (G)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="4" y1="4" x2="4" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="20" y1="4" x2="20" y2="20"/><line x1="4" y1="4" x2="20" y2="4"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="20" x2="20" y2="20"/></svg>
          </button>
          <span class="sep"></span>
          <button class="tool-btn" onclick="CanvasComponent.undo()" title="Undo (⌘Z)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
          <button class="tool-btn" onclick="CanvasComponent.redo()" title="Redo (⌘⇧Z)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
          </button>
          <button class="tool-btn" onclick="CanvasComponent.clear()" title="Clear all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        <div class="canvas-toolbar canvas-toolbar-secondary">
          <label class="toolbar-label">Font</label>
          <select class="toolbar-select" onchange="CanvasComponent.setFont(this.value)">${fontOptions}</select>
          <label class="toolbar-label">Size</label>
          <input type="number" class="toolbar-number" value="20" min="10" max="72" step="2" onchange="CanvasComponent.setFontSize(this.value)">
          <span class="sep"></span>
          <label class="toolbar-label" style="opacity:0.5">Ctrl+V paste | Shift = snap angles</label>
        </div>
        <canvas></canvas>
      `;

      _canvas = container.querySelector('canvas');
      _ctx = _canvas.getContext('2d');
      _paths = [];
      _undoStack = [];
      _tool = 'pen';
      _fill = false;
      _dashed = false;
      _selectedImage = null;
      _showGrid = false;
      _laserTrail = [];
      _updateToolbarState();

      const resize = () => {
        _canvas.width = container.clientWidth;
        _canvas.height = container.clientHeight;
        _redraw();
      };
      _resizeFn = resize;
      resize();
      window.addEventListener('resize', resize);

      // Restore saved canvas data for this page
      if (_pageId) _restoreCanvasData(_pageId);

      // ─── Paste image handler ───
      _container._pasteHandler = (e) => {
        if (!_canvas) return;
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            e.preventDefault();
            const blob = item.getAsFile();
            const img = new Image();
            img.onload = () => {
              // Scale to fit canvas, max 400px wide
              let w = img.naturalWidth, h = img.naturalHeight;
              const maxW = Math.min(400, _canvas.width * 0.6);
              if (w > maxW) { h = h * maxW / w; w = maxW; }
              _undoStack = [];
              const imgItem = {
                type: 'image', img, x: 40, y: 40, w, h,
                origW: img.naturalWidth, origH: img.naturalHeight,
                color: 'transparent', size: 0
              };
              _paths.push(imgItem);
              _selectedImage = imgItem;
              _redraw();
              _saveCanvasData();
            };
            img.src = URL.createObjectURL(blob);
            break;
          }
        }
      };
      document.addEventListener('paste', _container._pasteHandler);

      // ─── Mouse events ───
      _canvas.addEventListener('mousedown', (e) => {
        const pos = _getPos(e);

        // Crop mode
        if (_cropping) {
          _cropStart = pos;
          _cropRect = { x: pos.x, y: pos.y, w: 0, h: 0 };
          return;
        }

        // Check if clicking on a selected image's resize handle
        if (_selectedImage) {
          const img = _selectedImage;
          const hs = 10;
          // Bottom-right corner
          if (pos.x >= img.x + img.w - hs && pos.x <= img.x + img.w + hs &&
              pos.y >= img.y + img.h - hs && pos.y <= img.y + img.h + hs) {
            _imgResize = { img, startX: pos.x, startY: pos.y, origW: img.w, origH: img.h };
            return;
          }
          // Inside image = drag
          if (pos.x >= img.x && pos.x <= img.x + img.w &&
              pos.y >= img.y && pos.y <= img.y + img.h) {
            _imgDrag = { img, offsetX: pos.x - img.x, offsetY: pos.y - img.y };
            return;
          }
          // Clicked outside image → deselect
          _selectedImage = null;
          _hideImageActions();
          _redraw();
        }

        // Check if clicking on any image to select it
        for (let i = _paths.length - 1; i >= 0; i--) {
          const item = _paths[i];
          if (item.type === 'image' &&
              pos.x >= item.x && pos.x <= item.x + item.w &&
              pos.y >= item.y && pos.y <= item.y + item.h) {
            _selectedImage = item;
            _redraw();
            return;
          }
        }

        // Select tool — draw selection box or drag selected items
        if (_tool === 'select') {
          // If we have selected items and clicking inside the selection box, drag them
          if (_selectedItems.length > 0 && _selectBox) {
            const sb = _selectBox;
            if (pos.x >= sb.x && pos.x <= sb.x + sb.w &&
                pos.y >= sb.y && pos.y <= sb.y + sb.h) {
              _selDrag = { startX: pos.x, startY: pos.y };
              return;
            }
          }
          // Start new selection box
          _selectedItems = [];
          _selectBox = { x: pos.x, y: pos.y, w: 0, h: 0 };
          _drawing = true;
          return;
        }

        // Laser pointer — no drawing, just tracking
        if (_tool === 'laser') {
          _laserTrail.push({ x: pos.x, y: pos.y, t: Date.now() });
          if (!_laserRAF) _laserRAF = requestAnimationFrame(_animateLaser);
          return;
        }

        if (_tool === 'text') {
          // Inline text input on canvas (no prompt)
          const existingInput = _container.querySelector('.canvas-text-input');
          if (existingInput) existingInput.remove();

          const snapped = _snapToGrid(pos);
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'canvas-text-input';
          input.style.left = snapped.x + 'px';
          input.style.top = (snapped.y - _fontSize / 2) + 'px';
          input.style.fontSize = _fontSize + 'px';
          input.style.fontFamily = _fontFamily;
          input.style.color = _color;
          input.placeholder = 'Type here…';

          function commit() {
            const text = input.value.trim();
            if (text) {
              _undoStack = [];
              _paths.push({
                type: 'text', text, x: snapped.x, y: snapped.y,
                color: _color, fontSize: _fontSize, fontFamily: _fontFamily
              });
              _redraw();
              _saveCanvasData();
            }
            input.remove();
          }

          input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') commit();
            if (ev.key === 'Escape') input.remove();
            ev.stopPropagation();
          });
          input.addEventListener('blur', () => setTimeout(() => {
            if (document.body.contains(input)) commit();
          }, 100));
          _container.appendChild(input);
          setTimeout(() => input.focus(), 10);
          return;
        }

        if (SHAPE_TOOLS.includes(_tool)) {
          _drawing = true;
          _shapeStart = _snapToGrid(pos);
          return;
        }

        // Pen/Eraser
        _drawing = true;
        _eraserGrowth = 0;
        _undoStack = [];
        const isEraser = _tool === 'eraser';
        const color = isEraser ? '#ffffff' : _color;
        const size = isEraser ? _size * 4 : _size;
        _paths.push({ type: 'stroke', color, size, points: [pos], isEraser });
      });

      _canvas.addEventListener('mousemove', (e) => {
        const pos = _getPos(e);

        // Laser pointer tracking
        if (_tool === 'laser') {
          _laserTrail.push({ x: pos.x, y: pos.y, t: Date.now() });
          if (!_laserRAF) _laserRAF = requestAnimationFrame(_animateLaser);
          return;
        }

        // Crop mode drawing
        if (_cropping && _cropStart) {
          _cropRect = {
            x: Math.min(_cropStart.x, pos.x),
            y: Math.min(_cropStart.y, pos.y),
            w: Math.abs(pos.x - _cropStart.x),
            h: Math.abs(pos.y - _cropStart.y)
          };
          _redraw();
          // Draw crop overlay
          _ctx.save();
          _ctx.fillStyle = 'rgba(0,0,0,0.4)';
          _ctx.fillRect(0, 0, _canvas.width, _canvas.height);
          _ctx.clearRect(_cropRect.x, _cropRect.y, _cropRect.w, _cropRect.h);
          _ctx.strokeStyle = '#4f6ef7';
          _ctx.lineWidth = 2;
          _ctx.setLineDash([5, 3]);
          _ctx.strokeRect(_cropRect.x, _cropRect.y, _cropRect.w, _cropRect.h);
          _ctx.setLineDash([]);
          _ctx.restore();
          return;
        }

        // Image drag
        if (_imgDrag) {
          _imgDrag.img.x = pos.x - _imgDrag.offsetX;
          _imgDrag.img.y = pos.y - _imgDrag.offsetY;
          _redraw();
          return;
        }
        // Image resize (maintain aspect ratio)
        if (_imgResize) {
          const dx = pos.x - _imgResize.startX;
          const aspect = _imgResize.origH / _imgResize.origW;
          const newW = Math.max(40, _imgResize.origW + dx);
          _imgResize.img.w = newW;
          _imgResize.img.h = newW * aspect;
          _redraw();
          return;
        }

        // Select tool — drag selected items
        if (_selDrag && _selectedItems.length > 0) {
          const dx = pos.x - _selDrag.startX;
          const dy = pos.y - _selDrag.startY;
          _selDrag.startX = pos.x;
          _selDrag.startY = pos.y;
          for (const item of _selectedItems) {
            if (item.type === 'stroke') {
              for (const p of item.points) { p.x += dx; p.y += dy; }
            } else if (item.type === 'text' || item.type === 'image') {
              item.x += dx; item.y += dy;
            } else {
              item.x1 += dx; item.y1 += dy; item.x2 += dx; item.y2 += dy;
            }
          }
          if (_selectBox) { _selectBox.x += dx; _selectBox.y += dy; }
          _redraw();
          _drawSelectionBox();
          return;
        }

        // Select tool — drawing selection rectangle
        if (_tool === 'select' && _drawing && _selectBox) {
          _selectBox.w = pos.x - _selectBox.x;
          _selectBox.h = pos.y - _selectBox.y;
          _redraw();
          // Draw selection rectangle
          _ctx.setLineDash([4, 4]);
          _ctx.strokeStyle = '#4f6ef7';
          _ctx.lineWidth = 1;
          _ctx.strokeRect(_selectBox.x, _selectBox.y, _selectBox.w, _selectBox.h);
          _ctx.setLineDash([]);
          return;
        }

        if (!_drawing) return;

        // Shape preview
        if (SHAPE_TOOLS.includes(_tool) && _shapeStart) {
          _redraw();
          // Snap angle if Shift is held (for lines/arrows)
          let endPos = pos;
          if (e.shiftKey && (_tool === 'line' || _tool === 'arrow')) {
            endPos = _snapAngle(_shapeStart, pos);
          }
          endPos = _snapToGrid(endPos);
          _ctx.strokeStyle = _color;
          _ctx.fillStyle = _color;
          _ctx.lineWidth = _size;
          _ctx.lineCap = 'round';
          _ctx.lineJoin = 'round';
          _ctx.setLineDash([6, 4]);
          if (_tool === 'line' || _tool === 'arrow') {
            _ctx.beginPath();
            _ctx.moveTo(_shapeStart.x, _shapeStart.y);
            _ctx.lineTo(endPos.x, endPos.y);
            _ctx.stroke();
            if (_tool === 'arrow') _drawArrowhead(_ctx, _shapeStart.x, _shapeStart.y, endPos.x, endPos.y, _size);
            // Draw snap guide lines
            if (e.shiftKey) {
              _ctx.strokeStyle = 'rgba(79, 110, 247, 0.3)';
              _ctx.lineWidth = 0.5;
              _ctx.setLineDash([3, 3]);
              // Horizontal guide
              _ctx.beginPath(); _ctx.moveTo(0, _shapeStart.y); _ctx.lineTo(_canvas.width, _shapeStart.y); _ctx.stroke();
              // Vertical guide
              _ctx.beginPath(); _ctx.moveTo(_shapeStart.x, 0); _ctx.lineTo(_shapeStart.x, _canvas.height); _ctx.stroke();
            }
          } else if (_tool === 'rect') {
            if (_fill) { _ctx.globalAlpha = 0.1; _ctx.fillRect(_shapeStart.x, _shapeStart.y, endPos.x - _shapeStart.x, endPos.y - _shapeStart.y); _ctx.globalAlpha = 1; }
            _ctx.strokeRect(_shapeStart.x, _shapeStart.y, endPos.x - _shapeStart.x, endPos.y - _shapeStart.y);
          } else if (_tool === 'roundrect') {
            const rw = endPos.x - _shapeStart.x, rh = endPos.y - _shapeStart.y;
            const r = Math.min(12, Math.abs(rw) * 0.15, Math.abs(rh) * 0.15);
            _ctx.beginPath();
            _ctx.roundRect(_shapeStart.x, _shapeStart.y, rw, rh, r);
            if (_fill) { _ctx.globalAlpha = 0.1; _ctx.fill(); _ctx.globalAlpha = 1; }
            _ctx.stroke();
          } else if (_tool === 'circle') {
            const rx = Math.abs(endPos.x - _shapeStart.x) / 2;
            const ry = Math.abs(endPos.y - _shapeStart.y) / 2;
            const cx = (_shapeStart.x + endPos.x) / 2;
            const cy = (_shapeStart.y + endPos.y) / 2;
            _ctx.beginPath();
            _ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            if (_fill) { _ctx.globalAlpha = 0.1; _ctx.fill(); _ctx.globalAlpha = 1; }
            _ctx.stroke();
          }
          _ctx.setLineDash([]);
          return;
        }

        // Pen/Eraser drawing
        const current = _paths[_paths.length - 1];
        if (!current) return;
        current.points.push(pos);
        if (current.isEraser) {
          _eraserGrowth = Math.min(_eraserGrowth + 0.15, 30);
        }
        const prev = current.points[current.points.length - 2];
        _ctx.beginPath();
        _ctx.strokeStyle = current.color;
        _ctx.lineWidth = current.size + (current.isEraser ? _eraserGrowth : 0);
        _ctx.lineCap = 'round';
        _ctx.moveTo(prev.x, prev.y);
        _ctx.lineTo(pos.x, pos.y);
        _ctx.stroke();
      });

      _canvas.addEventListener('mouseup', (e) => {
        // Crop finalize
        if (_cropping && _cropStart && _cropRect && _cropRect.w > 10 && _cropRect.h > 10) {
          _cropStart = null;
          _canvas.style.cursor = 'crosshair';
          CanvasComponent.applyCrop();
          return;
        } else if (_cropping) {
          // Too small or cancelled
          _cropping = false;
          _cropStart = null;
          _cropRect = null;
          _redraw();
          return;
        }
        if (_imgDrag) { _imgDrag = null; return; }
        if (_imgResize) { _imgResize = null; return; }
        if (_selDrag) {
          _selDrag = null;
          _saveCanvasData();
          // Deselect after move — hide the delete bar
          _selectedItems = [];
          _selectBox = null;
          _hideSelectionActions();
          _redraw();
          return;
        }
        // Select tool — finalize selection
        if (_tool === 'select' && _drawing && _selectBox) {
          _drawing = false;
          // Normalize box (handle negative w/h)
          const bx = Math.min(_selectBox.x, _selectBox.x + _selectBox.w);
          const by = Math.min(_selectBox.y, _selectBox.y + _selectBox.h);
          const bw = Math.abs(_selectBox.w);
          const bh = Math.abs(_selectBox.h);
          _selectBox = { x: bx, y: by, w: bw, h: bh };
          // Find items inside box
          _selectedItems = _paths.filter(item => {
            if (item.type === 'stroke') {
              return item.points.some(p => p.x >= bx && p.x <= bx + bw && p.y >= by && p.y <= by + bh);
            } else if (item.type === 'text' || item.type === 'image') {
              return item.x >= bx && item.x <= bx + bw && item.y >= by && item.y <= by + bh;
            } else {
              const cx = (item.x1 + item.x2) / 2, cy = (item.y1 + item.y2) / 2;
              return cx >= bx && cx <= bx + bw && cy >= by && cy <= by + bh;
            }
          });
          _redraw();
          if (_selectedItems.length > 0) _drawSelectionBox();
          else _selectBox = null;
          return;
        }
        if (!_drawing) return;
        _drawing = false;
        if (SHAPE_TOOLS.includes(_tool) && _shapeStart) {
          let pos = _getPos(e);
          // Snap angle for lines/arrows with Shift
          if (e.shiftKey && (_tool === 'line' || _tool === 'arrow')) {
            pos = _snapAngle(_shapeStart, pos);
          }
          pos = _snapToGrid(pos);
          _undoStack = [];
          _paths.push({
            type: _tool,
            x1: _shapeStart.x, y1: _shapeStart.y,
            x2: pos.x, y2: pos.y,
            color: _color, size: _size,
            filled: _fill, fillColor: _color,
            dashed: _dashed
          });
          _shapeStart = null;
          _redraw();
        }
        _saveCanvasData();
      });

      _canvas.addEventListener('mouseleave', () => {
        if (_drawing && !SHAPE_TOOLS.includes(_tool)) _saveCanvasData();
        _drawing = false;
        _shapeStart = null;
      });
    },

    setTool(tool) {
      if (_cropping) {
        _cropping = false;
        _cropStart = null;
        _cropRect = null;
      }
      if (_tool === 'select' && tool !== 'select') {
        _selectedItems = [];
        _selectBox = null;
        _hideSelectionActions();
        _redraw();
      }
      _tool = tool;
      _updateToolbarState();
    },

    setColor(color, el) {
      _color = color;
      if (_tool === 'eraser') _tool = 'pen';
      const toolbar = el.closest('.canvas-toolbar');
      toolbar.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      el.classList.add('active');
      _updateToolbarState();
    },

    setSize(val) { _size = parseInt(val); },
    setFont(idx) { _fontFamily = FONTS[parseInt(idx)].value; },
    setFontSize(val) { _fontSize = parseInt(val); },
    toggleFill() {
      _fill = !_fill;
      _updateToolbarState();
    },

    toggleDashed() {
      _dashed = !_dashed;
      _updateToolbarState();
    },

    toggleGrid() {
      _showGrid = !_showGrid;
      _updateToolbarState();
      _redraw();
    },

    deleteSelectedImage() {
      // Delete region-selected items
      if (_selectedItems.length > 0) {
        _undoStack.push({ type: 'multi-delete', items: [..._selectedItems] });
        _paths = _paths.filter(p => !_selectedItems.includes(p));
        _selectedItems = [];
        _selectBox = null;
        _hideSelectionActions();
        _redraw();
        _saveCanvasData();
        return;
      }
      // Delete single selected image
      if (!_selectedImage) return;
      const idx = _paths.indexOf(_selectedImage);
      if (idx !== -1) {
        _undoStack.push(_paths.splice(idx, 1)[0]);
        _selectedImage = null;
        _hideImageActions();
        _redraw();
        _saveCanvasData();
      }
    },

    startCrop() {
      if (!_selectedImage) return;
      _cropping = true;
      _cropStart = null;
      _cropRect = null;
      _canvas.style.cursor = 'crosshair';
      _hideImageActions();
      // Show toast hint
      App.toast('Draw a rectangle on the image to crop', 'info');
    },

    applyCrop() {
      if (!_selectedImage || !_cropRect) return;
      const img = _selectedImage;
      // Convert crop rect from canvas coords to image source coords
      const scaleX = (img.cropW || img.img.naturalWidth) / img.w;
      const scaleY = (img.cropH || img.img.naturalHeight) / img.h;
      const offsetX = img.cropX || 0;
      const offsetY = img.cropY || 0;

      const cx = ((_cropRect.x - img.x) * scaleX) + offsetX;
      const cy = ((_cropRect.y - img.y) * scaleY) + offsetY;
      const cw = _cropRect.w * scaleX;
      const ch = _cropRect.h * scaleY;

      // Update image with crop
      img.cropX = Math.max(0, cx);
      img.cropY = Math.max(0, cy);
      img.cropW = Math.min(cw, img.img.naturalWidth - img.cropX);
      img.cropH = Math.min(ch, img.img.naturalHeight - img.cropY);

      // Adjust display size proportionally
      const aspect = img.cropH / img.cropW;
      img.h = img.w * aspect;

      _cropping = false;
      _cropRect = null;
      _redraw();
    },

    undo() {
      if (_undoStack.length > 0 && _undoStack[_undoStack.length - 1]?.type === 'multi-delete') {
        // Undo a region delete — restore all items
        const entry = _undoStack.pop();
        _paths.push(...entry.items);
        _redraw();
        _saveCanvasData();
        return;
      }
      if (_paths.length === 0) return;
      _undoStack.push(_paths.pop());
      _redraw();
      _saveCanvasData();
    },

    redo() {
      if (_undoStack.length === 0) return;
      const entry = _undoStack.pop();
      if (entry?.type === 'multi-delete') {
        // Can't redo multi-delete cleanly, skip
        return;
      }
      _paths.push(entry);
      _redraw();
      _saveCanvasData();
    },

    toggleEraser() { this.setTool('eraser'); },

    clear() {
      if (_paths.length === 0) return;
      _undoStack.push({ type: 'clear-snapshot', paths: [..._paths] });
      _paths = [];
      _redraw();
      _saveCanvasData();
    },

    resize() { if (_resizeFn) _resizeFn(); },

    toDataURL() {
      return _canvas ? _canvas.toDataURL('image/png') : null;
    },

    // ─── Multi-board navigation ───
    prevBoard() {
      if (_boardIndex <= 0) return;
      _saveCanvasData();
      _boardIndex--;
      _loadBoard();
    },

    nextBoard() {
      if (_boardIndex >= _boardCount - 1) {
        // At last board — same as add
        this.addBoard();
        return;
      }
      _saveCanvasData();
      _boardIndex++;
      _loadBoard();
    },

    addBoard() {
      _saveCanvasData();
      _boardCount++;
      _boardIndex = _boardCount - 1;
      _paths = [];
      _undoStack = [];
      _redraw();
      _saveCanvasData();
      App.toast(`Board ${_boardIndex + 1} added`, 'info');
    },

    deleteBoard() {
      if (_boardCount <= 1) return;
      // Remove current board's data
      try { localStorage.removeItem(_boardKey()); } catch (e) {}
      // Shift higher boards down
      for (let i = _boardIndex + 1; i < _boardCount; i++) {
        const oldKey = 'rn-canvas-' + _pageId + (i > 0 ? '-b' + i : '');
        const newKey = 'rn-canvas-' + _pageId + ((i - 1) > 0 ? '-b' + (i - 1) : '');
        try {
          const d = localStorage.getItem(oldKey);
          if (d) localStorage.setItem(newKey, d);
          localStorage.removeItem(oldKey);
        } catch (e) {}
      }
      _boardCount--;
      if (_boardIndex >= _boardCount) _boardIndex = _boardCount - 1;
      try { localStorage.setItem('rn-canvas-' + _pageId + '-count', _boardCount); } catch (e) {}
      _loadBoard();
      App.toast('Board deleted', 'info');
    },

    downloadBoard() {
      if (!_canvas) return;
      // Create a copy with white background
      const copy = document.createElement('canvas');
      copy.width = _canvas.width;
      copy.height = _canvas.height;
      const copyCtx = copy.getContext('2d');
      copyCtx.fillStyle = '#ffffff';
      copyCtx.fillRect(0, 0, copy.width, copy.height);
      copyCtx.drawImage(_canvas, 0, 0);
      const a = document.createElement('a');
      a.href = copy.toDataURL('image/png');
      a.download = `board-${_boardIndex + 1}-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      App.toast('Board downloaded', 'info');
    },

    detach() {
      if (_laserRAF) { cancelAnimationFrame(_laserRAF); _laserRAF = null; }
      if (_pageId) _saveCanvasData();
      if (_container && _container._pasteHandler) {
        document.removeEventListener('paste', _container._pasteHandler);
      }
      _canvas = null; _ctx = null; _container = null;
      _paths = []; _undoStack = [];
      _resizeFn = null; _tool = 'pen'; _shapeStart = null;
      _selectedImage = null; _imgDrag = null; _imgResize = null;
      _selectedItems = []; _selectBox = null; _selDrag = null;
      _cropping = false; _cropStart = null; _cropRect = null;
      _laserTrail = []; _pageId = null; _showGrid = false;
      _boardIndex = 0; _boardCount = 1;
    }
  };
})();

/* ═══════════════════════════════════════════════
   Canvas Component — Full-featured Teaching Whiteboard
   Tools: pen, eraser, text, line, arrow, rect, roundrect, circle, image
   Features: undo/redo, shape fill, font picker, font size, dashed lines, image paste
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
          } else {
            _hideImageActions();
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
    _ctx.restore();
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
    if (_canvas) {
      const cursors = { pen: 'crosshair', eraser: 'cell', text: 'text', select: 'default' };
      _canvas.style.cursor = cursors[_tool] || 'crosshair';
    }
  }

  return {
    attach(container) {
      _container = container;

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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 3l14 9-6 1-3 6-5-16z"/></svg>
          </button>
          <button class="tool-btn" data-tool="pen" onclick="CanvasComponent.setTool('pen')" title="Pen (F)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
          </button>
          <button class="tool-btn" data-tool="eraser" onclick="CanvasComponent.setTool('eraser')" title="Eraser (E)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 20H7L3 16l10-10 8 8-4 4"/><path d="M6.5 17.5l4-4"/></svg>
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
          <label class="toolbar-label" style="opacity:0.5">Ctrl+V to paste image</label>
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
      _updateToolbarState();

      const resize = () => {
        _canvas.width = container.clientWidth;
        _canvas.height = container.clientHeight;
        _redraw();
      };
      _resizeFn = resize;
      resize();
      window.addEventListener('resize', resize);

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

        if (_tool === 'text') {
          // Inline text input on canvas (no prompt)
          const existingInput = _container.querySelector('.canvas-text-input');
          if (existingInput) existingInput.remove();

          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'canvas-text-input';
          input.style.left = pos.x + 'px';
          input.style.top = (pos.y - _fontSize / 2) + 'px';
          input.style.fontSize = _fontSize + 'px';
          input.style.fontFamily = _fontFamily;
          input.style.color = _color;
          input.placeholder = 'Type here…';

          function commit() {
            const text = input.value.trim();
            if (text) {
              _undoStack = [];
              _paths.push({
                type: 'text', text, x: pos.x, y: pos.y,
                color: _color, fontSize: _fontSize, fontFamily: _fontFamily
              });
              _redraw();
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
          _shapeStart = pos;
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
          _ctx.strokeStyle = _color;
          _ctx.fillStyle = _color;
          _ctx.lineWidth = _size;
          _ctx.lineCap = 'round';
          _ctx.lineJoin = 'round';
          _ctx.setLineDash([6, 4]);
          if (_tool === 'line' || _tool === 'arrow') {
            _ctx.beginPath();
            _ctx.moveTo(_shapeStart.x, _shapeStart.y);
            _ctx.lineTo(pos.x, pos.y);
            _ctx.stroke();
            if (_tool === 'arrow') _drawArrowhead(_ctx, _shapeStart.x, _shapeStart.y, pos.x, pos.y, _size);
          } else if (_tool === 'rect') {
            if (_fill) { _ctx.globalAlpha = 0.1; _ctx.fillRect(_shapeStart.x, _shapeStart.y, pos.x - _shapeStart.x, pos.y - _shapeStart.y); _ctx.globalAlpha = 1; }
            _ctx.strokeRect(_shapeStart.x, _shapeStart.y, pos.x - _shapeStart.x, pos.y - _shapeStart.y);
          } else if (_tool === 'roundrect') {
            const rw = pos.x - _shapeStart.x, rh = pos.y - _shapeStart.y;
            const r = Math.min(12, Math.abs(rw) * 0.15, Math.abs(rh) * 0.15);
            _ctx.beginPath();
            _ctx.roundRect(_shapeStart.x, _shapeStart.y, rw, rh, r);
            if (_fill) { _ctx.globalAlpha = 0.1; _ctx.fill(); _ctx.globalAlpha = 1; }
            _ctx.stroke();
          } else if (_tool === 'circle') {
            const rx = Math.abs(pos.x - _shapeStart.x) / 2;
            const ry = Math.abs(pos.y - _shapeStart.y) / 2;
            const cx = (_shapeStart.x + pos.x) / 2;
            const cy = (_shapeStart.y + pos.y) / 2;
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
        if (_imgDrag) { _imgDrag = null; return; }
        if (_imgResize) { _imgResize = null; return; }
        if (_selDrag) { _selDrag = null; return; }
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
          const pos = _getPos(e);
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
      });

      _canvas.addEventListener('mouseleave', () => {
        _drawing = false;
        _shapeStart = null;
      });
    },

    setTool(tool) {
      if (_tool === 'select' && tool !== 'select') {
        _selectedItems = [];
        _selectBox = null;
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

    deleteSelectedImage() {
      if (!_selectedImage) return;
      const idx = _paths.indexOf(_selectedImage);
      if (idx !== -1) {
        _undoStack.push(_paths.splice(idx, 1)[0]);
        _selectedImage = null;
        _redraw();
      }
    },

    undo() {
      if (_paths.length === 0) return;
      _undoStack.push(_paths.pop());
      _redraw();
    },

    redo() {
      if (_undoStack.length === 0) return;
      _paths.push(_undoStack.pop());
      _redraw();
    },

    toggleEraser() { this.setTool('eraser'); },

    clear() {
      if (_paths.length === 0) return;
      _undoStack.push({ type: 'clear-snapshot', paths: [..._paths] });
      _paths = [];
      _redraw();
    },

    resize() { if (_resizeFn) _resizeFn(); },

    toDataURL() {
      return _canvas ? _canvas.toDataURL('image/png') : null;
    },

    detach() {
      if (_container && _container._pasteHandler) {
        document.removeEventListener('paste', _container._pasteHandler);
      }
      _canvas = null; _ctx = null; _container = null;
      _paths = []; _undoStack = [];
      _resizeFn = null; _tool = 'pen'; _shapeStart = null;
      _selectedImage = null; _imgDrag = null; _imgResize = null;
      _selectedItems = []; _selectBox = null; _selDrag = null;
    }
  };
})();

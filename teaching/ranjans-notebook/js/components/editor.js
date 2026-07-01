/* ═══════════════════════════════════════════════
   Editor Component — Page rendering & editing
   ═══════════════════════════════════════════════ */

'use strict';

const EditorComponent = (() => {
  let _el = null;
  let _editing = false;
  let _currentPageId = null;
  let _dragEl = null;
  let _dragPlaceholder = null;

  function _renderBlocks(blocks) {
    if (!blocks || blocks.length === 0) {
      return '<p style="color:var(--text-muted);text-align:center;padding:40px;">No content yet. Click "+ Block" to start adding.</p>';
    }
    return blocks.map(b => {
      const imgActions = b.type === 'image' ? `
        <div class="img-block-actions">
          <button class="img-act-btn" onclick="EditorComponent.cropImageBlock('${b.id}')" title="Crop">✂ Crop</button>
          <button class="img-act-btn" onclick="EditorComponent.resizeImageBlock('${b.id}')" title="Resize">⤡ Resize</button>
          <button class="img-act-btn del" onclick="EditorComponent.deleteBlock('${b.id}')" title="Delete">✕ Delete</button>
        </div>` : '';
      return `
      <div class="block" data-id="${b.id}" data-type="${b.type}" draggable="true">
        <div class="block-drag-handle" title="Drag to reorder">⠿</div>
        <span class="block-badge ${b.type}">${b.type}</span>
        <div class="block-controls">
          <button class="block-ctrl" onclick="EditorComponent.moveBlock('${b.id}', -1)" title="Move up">↑</button>
          <button class="block-ctrl" onclick="EditorComponent.moveBlock('${b.id}', 1)" title="Move down">↓</button>
          <button class="block-ctrl del" onclick="EditorComponent.deleteBlock('${b.id}')" title="Delete">✕</button>
        </div>
        <div class="block-title" data-field="title">${b.title}</div>
        <div class="block-body" data-field="content">${b.content}</div>
        ${imgActions}
      </div>`;
    }).join('');
  }

  function _initDragDrop() {
    const area = document.getElementById('blocks-area');
    if (!area) return;

    area.addEventListener('dragstart', (e) => {
      const block = e.target.closest('.block');
      if (!block) return;
      _dragEl = block;
      block.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', block.dataset.id);
    });

    area.addEventListener('dragend', (e) => {
      if (_dragEl) _dragEl.classList.remove('dragging');
      _dragEl = null;
      if (_dragPlaceholder) {
        _dragPlaceholder.remove();
        _dragPlaceholder = null;
      }
      // Save new order
      EditorComponent.saveCurrentPage();
    });

    area.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const afterEl = _getDragAfterElement(area, e.clientY);
      if (!_dragEl) return;
      if (afterEl) {
        area.insertBefore(_dragEl, afterEl);
      } else {
        area.appendChild(_dragEl);
      }
    });
  }

  function _getDragAfterElement(container, y) {
    const blocks = [...container.querySelectorAll('.block:not(.dragging)')];
    return blocks.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function _initPasteImage() {
    const area = document.getElementById('blocks-area');
    if (!area || area._pasteReady) return;
    area._pasteReady = true;
    area.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            Store.addBlock(_currentPageId, 'image', 'Pasted image', `<img src="${ev.target.result}" alt="pasted" style="max-width:100%;border-radius:6px;">`);
            EditorComponent.renderPage(_currentPageId);
            App.toast('Image pasted', 'info');
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    });
  }

  function _setEditable(enabled) {
    if (!_el) return;
    _el.querySelectorAll('.block-title, .block-body, .page-title').forEach(el => {
      // Don't make image block bodies editable
      if (el.classList.contains('block-body') && el.closest('.block')?.dataset.type === 'image') return;
      el.contentEditable = enabled;
    });
    _el.classList.toggle('editing-active', enabled);
  }

  return {
    init() {
      _el = document.getElementById('page-area');
    },

    get isEditing() { return _editing; },

    renderPage(pageId) {
      _currentPageId = pageId;
      const result = Store.findPage(pageId);
      if (!result) {
        _el.innerHTML = '<div class="welcome-screen"><h2>Page not found</h2></div>';
        return;
      }
      const { page } = result;

      const tagsHtml = (page.tags || []).map((t, i) => {
        const colors = ['', 'green', 'orange', 'purple'];
        return `<span class="page-tag ${colors[i % 4]}">${t}<button class="tag-del" onclick="EditorComponent.deleteTag(${i})" title="Remove tag">✕</button></span>`;
      }).join('') + `<span class="page-tag add" onclick="EditorComponent.showAddTag()">+</span>`;

      _el.innerHTML = `
        <div class="page-content">
          <div class="page-header">
            <h1 class="page-title" data-field="title">${page.title}</h1>
            <div class="page-meta">${tagsHtml}</div>
          </div>
          <div id="blocks-area">${_renderBlocks(page.blocks)}</div>
          <div class="add-block-trigger" onclick="EditorComponent.addBlock()">
            + Add Block
          </div>
        </div>
      `;

      if (_editing) _setEditable(true);

      _initDragDrop();
      _initPasteImage();

      // Render math
      try {
        renderMathInElement(_el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (e) { /* KaTeX errors are non-fatal */ }
    },

    toggleEdit() {
      _editing = !_editing;
      _setEditable(_editing);
      
      const btn = document.getElementById('btn-edit');
      if (btn) {
        btn.textContent = _editing ? '✅ Done' : '✏️ Edit';
        btn.classList.toggle('active', _editing);
      }

      if (!_editing) this.saveCurrentPage();
    },

    saveCurrentPage() {
      if (!_currentPageId || !_el) return;

      const titleEl = _el.querySelector('.page-title');
      const blocks = [];
      _el.querySelectorAll('.block').forEach(blockEl => {
        const titleDiv = blockEl.querySelector('.block-title');
        const bodyDiv = blockEl.querySelector('.block-body');
        blocks.push({
          id: blockEl.dataset.id,
          type: blockEl.dataset.type,
          title: titleDiv ? titleDiv.innerHTML : '',
          content: bodyDiv ? bodyDiv.innerHTML : ''
        });
      });

      const newTitle = titleEl ? titleEl.textContent.trim() : '';
      const updates = { blocks };
      // Only update title if non-empty (prevent accidental blanking)
      if (newTitle) updates.title = newTitle;

      Store.updatePage(_currentPageId, updates);

      // Re-render math after save
      try {
        renderMathInElement(_el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (e) {}
    },

    addBlock() {
      if (!_currentPageId) return;
      // Show inline block-type picker instead of prompt
      const existing = document.getElementById('block-type-picker');
      if (existing) { existing.remove(); return; }

      const picker = document.createElement('div');
      picker.id = 'block-type-picker';
      picker.className = 'inline-picker';
      picker.innerHTML = `
        <span class="picker-label">Add block:</span>
        <button class="picker-btn concept" onclick="EditorComponent._createBlock('concept')">Concept</button>
        <button class="picker-btn formula" onclick="EditorComponent._createBlock('formula')">Formula</button>
        <button class="picker-btn example" onclick="EditorComponent._createBlock('example')">Example</button>
        <button class="picker-btn code" onclick="EditorComponent._createBlock('code')">Code</button>
        <button class="picker-btn image" onclick="EditorComponent._createImageBlock()">Image</button>
        <button class="picker-btn gate" onclick="EditorComponent._createBlock('gate')">GATE</button>
        <button class="picker-btn warning" onclick="EditorComponent._createBlock('warning')">Warning</button>
        <button class="picker-btn note" onclick="EditorComponent._createBlock('note')">Note</button>
      `;
      const area = document.getElementById('blocks-area');
      if (area) area.parentElement.insertBefore(picker, area.nextSibling);
    },

    _createBlock(type) {
      const picker = document.getElementById('block-type-picker');
      if (picker) picker.remove();
      const defaultContent = type === 'code' ? '<pre><code class="language-python"># Write Python code here\nprint("Hello, World!")</code></pre>' : '<p>Click to edit content…</p>';
      Store.addBlock(_currentPageId, type, 'Click to edit title', defaultContent);
      this.renderPage(_currentPageId);
      if (!_editing) this.toggleEdit();
    },

    _createImageBlock() {
      const picker = document.getElementById('block-type-picker');
      if (picker) picker.remove();
      // Open file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataURL = ev.target.result;
          Store.addBlock(_currentPageId, 'image', file.name, `<img src="${dataURL}" alt="${file.name}" style="max-width:100%;border-radius:6px;">`);
          this.renderPage(_currentPageId);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    },

    deleteBlock(blockId) {
      Store.deleteBlock(_currentPageId, blockId);
      this.renderPage(_currentPageId);
      App.toast('Block deleted', 'info');
    },

    moveBlock(blockId, direction) {
      this.saveCurrentPage();
      Store.moveBlock(_currentPageId, blockId, direction);
      this.renderPage(_currentPageId);
    },

    addTag() {
      this.showAddTag();
    },

    showAddTag() {
      if (!_currentPageId) return;
      const meta = _el.querySelector('.page-meta');
      if (!meta || meta.querySelector('.tag-input')) return;

      const input = document.createElement('input');
      input.className = 'tag-input';
      input.placeholder = 'tag name…';
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
          const result = Store.findPage(_currentPageId);
          if (result) {
            if (!result.page.tags) result.page.tags = [];
            result.page.tags.push(input.value.trim());
            Store.updatePage(_currentPageId, { tags: result.page.tags });
            this.renderPage(_currentPageId);
          }
        }
        if (e.key === 'Escape') input.remove();
      });
      input.addEventListener('blur', () => input.remove());
      meta.insertBefore(input, meta.lastElementChild);
      input.focus();
    },

    deleteTag(index) {
      if (!_currentPageId) return;
      const result = Store.findPage(_currentPageId);
      if (!result || !result.page.tags) return;
      result.page.tags.splice(index, 1);
      Store.updatePage(_currentPageId, { tags: result.page.tags });
      this.renderPage(_currentPageId);
    },

    showWelcome() {
      _el.innerHTML = `
        <div class="welcome-screen">
          <h2>Ranjan's Notebook</h2>
          <p>Your personal knowledge studio. Organize → Build → Teach.</p>
          <button class="btn primary" onclick="App.loadSampleData()">📥 Load Sample Data</button>
          &nbsp;
          <button class="btn" onclick="SidebarComponent.addNotebook()">+ New Notebook</button>
        </div>
      `;
    },

    cropImageBlock(blockId) {
      const blockEl = _el.querySelector(`.block[data-id="${blockId}"]`);
      if (!blockEl) return;
      const img = blockEl.querySelector('.block-body img');
      if (!img) return;

      // Create crop overlay
      const body = blockEl.querySelector('.block-body');
      const overlay = document.createElement('div');
      overlay.className = 'img-crop-overlay';
      overlay.innerHTML = `
        <div class="crop-selection" id="crop-sel-${blockId}"></div>
        <div class="crop-controls">
          <button class="btn primary" onclick="EditorComponent._applyCrop('${blockId}')">✓ Apply</button>
          <button class="btn" onclick="EditorComponent._cancelCrop('${blockId}')">✕ Cancel</button>
        </div>
      `;
      body.style.position = 'relative';
      body.appendChild(overlay);

      // Crop selection drag
      let startX, startY, sel;
      overlay.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        sel = overlay.querySelector('.crop-selection');
        const rect = overlay.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        sel.style.display = 'block';
        sel.style.left = startX + 'px';
        sel.style.top = startY + 'px';
        sel.style.width = '0';
        sel.style.height = '0';

        const onMove = (ev) => {
          const x = ev.clientX - rect.left;
          const y = ev.clientY - rect.top;
          sel.style.left = Math.min(x, startX) + 'px';
          sel.style.top = Math.min(y, startY) + 'px';
          sel.style.width = Math.abs(x - startX) + 'px';
          sel.style.height = Math.abs(y - startY) + 'px';
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    },

    _applyCrop(blockId) {
      const blockEl = _el.querySelector(`.block[data-id="${blockId}"]`);
      if (!blockEl) return;
      const body = blockEl.querySelector('.block-body');
      const overlay = body.querySelector('.img-crop-overlay');
      const sel = overlay.querySelector('.crop-selection');
      const img = body.querySelector('img');
      if (!img || !sel || sel.offsetWidth < 5) {
        this._cancelCrop(blockId);
        return;
      }

      // Get crop rectangle relative to image
      const imgRect = img.getBoundingClientRect();
      const selRect = sel.getBoundingClientRect();
      const scaleX = img.naturalWidth / imgRect.width;
      const scaleY = img.naturalHeight / imgRect.height;

      const cx = Math.max(0, (selRect.left - imgRect.left) * scaleX);
      const cy = Math.max(0, (selRect.top - imgRect.top) * scaleY);
      const cw = Math.min(selRect.width * scaleX, img.naturalWidth - cx);
      const ch = Math.min(selRect.height * scaleY, img.naturalHeight - cy);

      // Draw cropped image to canvas and replace
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx2d = canvas.getContext('2d');
      ctx2d.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);

      const dataURL = canvas.toDataURL('image/png');
      overlay.remove();
      body.style.position = '';

      // Update store
      const result = Store.findPage(_currentPageId);
      if (result) {
        const block = result.page.blocks.find(b => b.id === blockId);
        if (block) {
          block.content = `<img src="${dataURL}" alt="cropped" style="max-width:100%;border-radius:6px;">`;
          Store.updatePage(_currentPageId, { blocks: result.page.blocks });
          this.renderPage(_currentPageId);
          App.toast('Image cropped', 'info');
        }
      }
    },

    _cancelCrop(blockId) {
      const blockEl = _el.querySelector(`.block[data-id="${blockId}"]`);
      if (!blockEl) return;
      const body = blockEl.querySelector('.block-body');
      const overlay = body.querySelector('.img-crop-overlay');
      if (overlay) overlay.remove();
      body.style.position = '';
    },

    resizeImageBlock(blockId) {
      const blockEl = _el.querySelector(`.block[data-id="${blockId}"]`);
      if (!blockEl) return;
      const img = blockEl.querySelector('.block-body img');
      if (!img) return;

      Modal.prompt('Resize Image', 'Max width (px or %)', img.style.maxWidth || '100%').then(val => {
        if (!val) return;
        const result = Store.findPage(_currentPageId);
        if (result) {
          const block = result.page.blocks.find(b => b.id === blockId);
          if (block) {
            block.content = block.content.replace(/max-width:[^;"]+/, `max-width:${val}`);
            Store.updatePage(_currentPageId, { blocks: result.page.blocks });
            this.renderPage(_currentPageId);
          }
        }
      });
    }
  };
})();

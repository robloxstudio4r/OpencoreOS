// ============================================================
//  files.js — File browser for OpencoreOS v10.4
//  Includes Delete → Recycle Bin + Restore
//  Storage: VFS (/System32 protected) + LS key oc_file_bin
// ============================================================

function openFiles(initialPath){
  var path = initialPath || '/';
  var showingBin = false;

  var BIN_KEY = 'oc_file_bin';

  // ---------- Recycle bin storage ----------
  function readBin() {
    try {
      var raw = LS.getItem(BIN_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function writeBin(arr) {
    try { LS.setItem(BIN_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  // ---------- Window ----------
  var win = makeWindow('files', 'Files', '📁',
    '<div id="fi-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
      + '<div style="padding:8px 12px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:8px;">'
        + '<button type="button" id="fi-up" title="Up" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;">⬆ Up</button>'
        + '<div id="fi-path" style="flex:1;color:#8ab4f8;font-family:Menlo,Consolas,monospace;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>'
        + '<button type="button" id="fi-bin" title="Recycle Bin" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;">🗑️ Bin</button>'
        + '<button type="button" id="fi-new" title="New folder" style="background:#1db954;border:none;color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;">+ Folder</button>'
      + '</div>'
      + '<div id="fi-list" style="flex:1;overflow-y:auto;padding:10px 12px;"></div>'
      + '<div id="fi-status" style="padding:6px 12px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;"></div>'
    + '</div>', 620, 520);

  var c = win.querySelector('#fi-app');
  var listEl = c.querySelector('#fi-list');
  var pathEl = c.querySelector('#fi-path');
  var statusEl = c.querySelector('#fi-status');

  // ---------- Render folder ----------
  function render() {
    listEl.innerHTML = '';
    pathEl.textContent = path;
    pathEl.style.color = '#8ab4f8';

    var items = VFS.list(path);
    if (!items) {
      listEl.innerHTML = '<div style="color:#ef9a9a;padding:20px;text-align:center;">Not a folder.</div>';
      return;
    }
    if (!items.length) {
      listEl.innerHTML = '<div style="color:#666;padding:20px;text-align:center;">Empty folder.</div>';
      return;
    }
    items.sort(function (a, b) {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    items.forEach(function (it) { listEl.appendChild(fileRow(it)); });

    statusEl.textContent = items.length + ' item' + (items.length === 1 ? '' : 's');
  }

  function fileRow(it) {
    var row = document.createElement('div');
    row.style.cssText =
      'display:flex;align-items:center;gap:10px;padding:8px 10px;' +
      'border:1px solid rgba(255,255,255,0.06);border-radius:8px;' +
      'background:rgba(255,255,255,0.02);margin-bottom:4px;cursor:pointer;';

    var icon = document.createElement('div');
    icon.textContent = it.type === 'folder' ? '📁' : '📄';
    icon.style.cssText = 'font-size:20px;';
    row.appendChild(icon);

    var info = document.createElement('div');
    info.style.cssText = 'flex:1;min-width:0;';
    var size = it.type === 'file' ? ((it.content || '').length + ' B') : '';
    info.innerHTML =
      '<div style="color:#fff;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
        escapeHtml(it.name) + '</div>' +
      '<div style="color:#888;font-size:11px;">' +
        (it.type === 'folder' ? 'Folder' : size) + '</div>';
    row.appendChild(info);

    // Delete button
    var delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.title = 'Delete';
    delBtn.textContent = '🗑️';
    delBtn.style.cssText =
      'background:rgba(255,80,80,0.12);border:1px solid rgba(255,80,80,0.3);' +
      'color:#ff8a8a;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;';
    delBtn.onclick = function (e) {
      e.stopPropagation();
      deleteItem(it);
    };
    row.appendChild(delBtn);

    // Row click → navigate / open file
    row.onclick = function () {
      if (it.type === 'folder') {
        path = (path === '/' ? '' : path) + '/' + it.name;
        render();
      } else {
        var content = VFS.read((path === '/' ? '' : path) + '/' + it.name);
        alert(content != null ? content : '(empty)');
      }
    };

    return row;
  }

  // ---------- Delete → recycle bin ----------
  function deleteItem(it) {
    var fullPath = (path === '/' ? '' : path) + '/' + it.name;

    if (fullPath.indexOf('/System32') === 0) {
      alert('Cannot delete files inside System32.');
      return;
    }
    if (!confirm('Move "' + it.name + '" to the Recycle Bin?')) return;

    var content = it.type === 'file' ? VFS.read(fullPath) : null;

    // Store in bin
    var bin = readBin();
    bin.push({
      id: 'fb-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: it.name,
      type: it.type,
      originalPath: path,
      content: content,
      size: content ? content.length : 0,
      deletedAt: Date.now()
    });
    writeBin(bin);

    // Remove from VFS
    if (it.type === 'folder') {
      VFS.del(fullPath);
    } else {
      VFS.del(fullPath);
    }

    render();
    statusEl.textContent = 'Moved "' + it.name + '" to Recycle Bin';
  }

  // ---------- Recycle Bin view ----------
  function renderBin() {
    listEl.innerHTML = '';
    pathEl.textContent = '🗑️ Recycle Bin';
    pathEl.style.color = '#ff8a8a';

    var bin = readBin();
    if (!bin.length) {
      listEl.innerHTML = '<div style="color:#666;padding:20px;text-align:center;">Recycle Bin is empty.</div>';
      statusEl.textContent = '0 items';
      return;
    }
    bin.sort(function (a, b) { return b.deletedAt - a.deletedAt; });

    // Header with "Empty Bin" button
    var head = document.createElement('div');
    head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;';
    head.innerHTML =
      '<div style="color:#888;font-size:11px;">' + bin.length + ' deleted item' + (bin.length === 1 ? '' : 's') + '</div>';
    var emptyBtn = document.createElement('button');
    emptyBtn.type = 'button';
    emptyBtn.textContent = 'Empty Bin';
    emptyBtn.style.cssText =
      'background:rgba(255,80,80,0.12);border:1px solid rgba(255,80,80,0.3);' +
      'color:#ff8a8a;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;';
    emptyBtn.onclick = function () {
      if (!confirm('Permanently delete everything in the Recycle Bin?')) return;
      writeBin([]);
      renderBin();
    };
    head.appendChild(emptyBtn);
    listEl.appendChild(head);

    bin.forEach(function (item) {
      var row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;gap:10px;padding:8px 10px;' +
        'border:1px solid rgba(255,255,255,0.06);border-radius:8px;' +
        'background:rgba(255,255,255,0.02);margin-bottom:4px;';

      var icon = document.createElement('div');
      icon.textContent = item.type === 'folder' ? '📁' : '📄';
      icon.style.cssText = 'font-size:20px;';
      row.appendChild(icon);

      var info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;';
      var date = new Date(item.deletedAt);
      info.innerHTML =
        '<div style="color:#fff;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
          escapeHtml(item.name) + '</div>' +
        '<div style="color:#888;font-size:11px;">From ' + escapeHtml(item.originalPath) +
          ' · ' + date.toLocaleDateString() + '</div>';
      row.appendChild(info);

      // Restore button
      var restoreBtn = document.createElement('button');
      restoreBtn.type = 'button';
      restoreBtn.textContent = 'Restore';
      restoreBtn.style.cssText =
        'background:#1db954;border:none;color:#fff;padding:5px 12px;' +
        'border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;';
      restoreBtn.onclick = function () { restoreItem(item); };
      row.appendChild(restoreBtn);

      // Delete forever button
      var permBtn = document.createElement('button');
      permBtn.type = 'button';
      permBtn.title = 'Delete forever';
      permBtn.textContent = '✕';
      permBtn.style.cssText =
        'background:rgba(255,80,80,0.12);border:1px solid rgba(255,80,80,0.3);' +
        'color:#ff8a8a;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;';
      permBtn.onclick = function () {
        if (!confirm('Permanently delete "' + item.name + '"?')) return;
        var bin = readBin();
        var kept = bin.filter(function (x) { return x.id !== item.id; });
        writeBin(kept);
        renderBin();
      };
      row.appendChild(permBtn);

      listEl.appendChild(row);
    });

    statusEl.textContent = bin.length + ' item' + (bin.length === 1 ? '' : 's') + ' in Recycle Bin';
  }

  // ---------- Restore ----------
  function restoreItem(item) {
    // Restore to original folder if it still exists; otherwise /
    var targetFolder = item.originalPath;
    var node = VFS.getNode(targetFolder);
    if (!node || node.type !== 'folder') targetFolder = '/';

    var fullPath = (targetFolder === '/' ? '' : targetFolder) + '/' + item.name;

    // Check for collision
    var existing = VFS.getNode(fullPath);
    var finalName = item.name;
    if (existing) {
      // Add suffix
      var base = item.name;
      var dotIdx = base.lastIndexOf('.');
      var stem = dotIdx > 0 ? base.slice(0, dotIdx) : base;
      var ext = dotIdx > 0 ? base.slice(dotIdx) : '';
      var n = 1;
      while (VFS.getNode((targetFolder === '/' ? '' : targetFolder) + '/' + stem + ' (' + n + ')' + ext)) n++;
      finalName = stem + ' (' + n + ')' + ext;
      fullPath = (targetFolder === '/' ? '' : targetFolder) + '/' + finalName;
    }

    if (item.type === 'folder') {
      VFS.mkdir(fullPath);
    } else {
      VFS.write(fullPath, item.content || '');
    }

    // Remove from bin
    var bin = readBin();
    var kept = bin.filter(function (x) { return x.id !== item.id; });
    writeBin(kept);

    renderBin();
    statusEl.textContent = 'Restored "' + finalName + '"';
  }

  // ---------- Escape HTML ----------
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Wire header buttons ----------
  c.querySelector('#fi-up').onclick = function () {
    if (showingBin) { showingBin = false; render(); return; }
    if (path === '/' || path === '') return;
    path = path.replace(/\/[^\/]+\/?$/, '') || '/';
    render();
  };

  c.querySelector('#fi-bin').onclick = function () {
    showingBin = !showingBin;
    if (showingBin) renderBin();
    else render();
  };

  c.querySelector('#fi-new').onclick = function () {
    var name = prompt('New folder name:');
    if (!name) return;
    name = name.trim();
    if (!name) return;
    var fullPath = (path === '/' ? '' : path) + '/' + name;
    var ok = VFS.mkdir(fullPath);
    if (ok) { render(); statusEl.textContent = 'Created folder "' + name + '"'; }
    else alert('Could not create folder (may already exist).');
  };

  // ---------- Init ----------
  render();
  return win;
}

window.openFiles = openFiles;

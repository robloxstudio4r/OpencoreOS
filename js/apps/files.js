// ============================================================
//  files.js — File browser for OpencoreOS v10.4
//  Search, Recycle Bin (30-day auto-delete), recursive folder restore
//  Storage: VFS + LS key oc_file_bin
// ============================================================

function openFiles(initialPath){
  var path = initialPath || '/';
  var showingBin = false;
  var searchQuery = '';

  var BIN_KEY = 'oc_file_bin';
  var BIN_RETAIN_DAYS = 30;
  var BIN_RETAIN_MS = BIN_RETAIN_DAYS * 24 * 60 * 60 * 1000;

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

  // ---------- 30-day auto-purge ----------
  function purgeOldBinItems() {
    var now = Date.now();
    var bin = readBin();
    var kept = bin.filter(function (item) {
      return (now - (item.deletedAt || 0)) < BIN_RETAIN_MS;
    });
    if (kept.length !== bin.length) {
      writeBin(kept);
      console.log('Files bin: purged ' + (bin.length - kept.length) + ' item(s) older than ' + BIN_RETAIN_DAYS + ' days');
    }
    return kept;
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
      + '<div style="padding:6px 12px;border-bottom:1px solid #2a2a2a;">'
        + '<input id="fi-search" type="text" placeholder="Search files and folders..." '
          + 'style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);'
          + 'color:#fff;padding:7px 12px;border-radius:8px;outline:none;font-size:12px;'
          + 'box-sizing:border-box;"/>'
      + '</div>'
      + '<div id="fi-list" style="flex:1;overflow-y:auto;padding:10px 12px;"></div>'
      + '<div id="fi-status" style="padding:6px 12px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;"></div>'
    + '</div>', 640, 560);

  var c = win.querySelector('#fi-app');
  var listEl = c.querySelector('#fi-list');
  var pathEl = c.querySelector('#fi-path');
  var statusEl = c.querySelector('#fi-status');
  var searchEl = c.querySelector('#fi-search');

  // ---------- Search ----------
  searchEl.addEventListener('input', function () {
    searchQuery = searchEl.value.trim().toLowerCase();
    if (showingBin) renderBin();
    else render();
  });

  // ---------- Escape HTML ----------
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Search matcher ----------
  function matchesSearch(name) {
    if (!searchQuery) return true;
    return name.toLowerCase().indexOf(searchQuery) !== -1;
  }

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

    var filtered = items.filter(function (it) { return matchesSearch(it.name); });

    if (!filtered.length) {
      listEl.innerHTML = '<div style="color:#666;padding:20px;text-align:center;">' +
        (searchQuery ? 'No matches for "' + escapeHtml(searchQuery) + '".' : 'Empty folder.') + '</div>';
      statusEl.textContent = searchQuery ? '0 matches' : '0 items';
      return;
    }

    filtered.sort(function (a, b) {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    filtered.forEach(function (it) { listEl.appendChild(fileRow(it)); });

    statusEl.textContent = filtered.length + ' item' + (filtered.length === 1 ? '' : 's') +
      (searchQuery ? ' matching "' + searchQuery + '"' : '');
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

    row.onclick = function () {
      if (it.type === 'folder') {
        path = (path === '/' ? '' : path) + '/' + it.name;
        searchEl.value = '';
        searchQuery = '';
        render();
      } else {
        var content = VFS.read((path === '/' ? '' : path) + '/' + it.name);
        alert(content != null ? content : '(empty)');
      }
    };

    return row;
  }

  // ---------- Recursive folder serialization ----------
  function serializeNode(node) {
    if (!node) return null;
    if (node.type === 'file') {
      return { type: 'file', content: node.content || '', locked: node.locked };
    }
    var children = {};
    for (var k in node.children) {
      if (Object.prototype.hasOwnProperty.call(node.children, k)) {
        children[k] = serializeNode(node.children[k]);
      }
    }
    return { type: 'folder', children: children };
  }

  function deserializeNode(data, targetPath) {
    if (!data) return;
    if (data.type === 'file') {
      VFS.write(targetPath, data.content || '');
      return;
    }
    VFS.mkdir(targetPath);
    for (var k in data.children) {
      if (Object.prototype.hasOwnProperty.call(data.children, k)) {
        deserializeNode(data.children[k], targetPath + '/' + k);
      }
    }
  }

  // ---------- Delete → recycle bin ----------
  function deleteItem(it) {
    var fullPath = (path === '/' ? '' : path) + '/' + it.name;

    if (fullPath.indexOf('/System32') === 0) {
      alert('Cannot delete files inside System32.');
      return;
    }
    if (!confirm('Move "' + it.name + '" to the Recycle Bin?')) return;

    var node = VFS.getNode(fullPath);
    var snapshot = node ? serializeNode(node) : null;

    var bin = readBin();
    bin.push({
      id: 'fb-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: it.name,
      type: it.type,
      originalPath: path,
      snapshot: snapshot,          // full recursive structure
      size: JSON.stringify(snapshot || '').length,
      deletedAt: Date.now()
    });
    writeBin(bin);

    VFS.del(fullPath);
    render();
    statusEl.textContent = 'Moved "' + it.name + '" to Recycle Bin';
  }

  // ---------- Recycle Bin view ----------
  function renderBin() {
    // Purge old items first
    purgeOldBinItems();

    listEl.innerHTML = '';
    pathEl.textContent = '🗑️ Recycle Bin';
    pathEl.style.color = '#ff8a8a';

    var bin = readBin();

    if (!bin.length) {
      listEl.innerHTML = '<div style="color:#666;padding:20px;text-align:center;">Recycle Bin is empty.</div>';
      statusEl.textContent = '0 items · items auto-delete after ' + BIN_RETAIN_DAYS + ' days';
      return;
    }

    var filtered = bin.filter(function (item) { return matchesSearch(item.name); });
    filtered.sort(function (a, b) { return b.deletedAt - a.deletedAt; });

    // Header
    var head = document.createElement('div');
    head.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;';
    head.innerHTML =
      '<div style="color:#888;font-size:11px;">' + filtered.length + ' of ' + bin.length +
        ' item' + (bin.length === 1 ? '' : 's') + ' · auto-deletes after ' + BIN_RETAIN_DAYS + ' days</div>';
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

    if (!filtered.length) {
      var empty = document.createElement('div');
      empty.textContent = 'No bin items match "' + searchQuery + '".';
      empty.style.cssText = 'color:#666;padding:20px;text-align:center;';
      listEl.appendChild(empty);
      statusEl.textContent = '0 matches';
      return;
    }

    filtered.forEach(function (item) {
      var row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;gap:10px;padding:8px 10px;' +
        'border:1px solid rgba(255,255,255,0.06);border-radius:8px;' +
        'background:rgba(255,255,255,0.02);margin-bottom:4px;';

      var icon = document.createElement('div');
      icon.textContent = item.type === 'folder' ? '📁' : '📄';
      icon.style.cssText = 'font-size:20px;';
      row.appendChild(icon);

      var daysLeft = Math.max(0, Math.ceil((BIN_RETAIN_MS - (Date.now() - item.deletedAt)) / (24 * 60 * 60 * 1000)));

      var info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;';
      info.innerHTML =
        '<div style="color:#fff;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
          escapeHtml(item.name) + '</div>' +
        '<div style="color:#888;font-size:11px;">From ' + escapeHtml(item.originalPath) +
          ' · deletes in ' + daysLeft + ' day' + (daysLeft === 1 ? '' : 's') + '</div>';
      row.appendChild(info);

      var restoreBtn = document.createElement('button');
      restoreBtn.type = 'button';
      restoreBtn.textContent = 'Restore';
      restoreBtn.style.cssText =
        'background:#1db954;border:none;color:#fff;padding:5px 12px;' +
        'border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;';
      restoreBtn.onclick = function () { restoreItem(item); };
      row.appendChild(restoreBtn);

      var permBtn = document.createElement('button');
      permBtn.type = 'button';
      permBtn.title = 'Delete forever';
      permBtn.textContent = '✕';
      permBtn.style.cssText =
        'background:rgba(255,80,80,0.12);border:1px solid rgba(255,80,80,0.3);' +
        'color:#ff8a8a;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:11px;';
      permBtn.onclick = function () {
        if (!confirm('Permanently delete "' + item.name + '"?')) return;
        var freshBin = readBin();
        var kept = freshBin.filter(function (x) { return x.id !== item.id; });
        writeBin(kept);
        renderBin();
      };
      row.appendChild(permBtn);

      listEl.appendChild(row);
    });

    statusEl.textContent = filtered.length + ' item' + (filtered.length === 1 ? '' : 's') +
      ' · auto-deletes after ' + BIN_RETAIN_DAYS + ' days';
  }

  // ---------- Recursive restore ----------
  function restoreItem(item) {
    var targetFolder = item.originalPath;
    var node = VFS.getNode(targetFolder);
    if (!node || node.type !== 'folder') targetFolder = '/';

    var fullPath = (targetFolder === '/' ? '' : targetFolder) + '/' + item.name;

    // Collision handling
    var existing = VFS.getNode(fullPath);
    var finalName = item.name;
    if (existing) {
      var base = item.name;
      var dotIdx = base.lastIndexOf('.');
      var stem = dotIdx > 0 ? base.slice(0, dotIdx) : base;
      var ext = dotIdx > 0 ? base.slice(dotIdx) : '';
      var n = 1;
      while (VFS.getNode((targetFolder === '/' ? '' : targetFolder) + '/' + stem + ' (' + n + ')' + ext)) n++;
      finalName = stem + ' (' + n + ')' + ext;
      fullPath = (targetFolder === '/' ? '' : targetFolder) + '/' + finalName;
    }

    // Restore
    if (item.snapshot) {
      deserializeNode(item.snapshot, fullPath);
    } else if (item.type === 'folder') {
      VFS.mkdir(fullPath);
    } else {
      VFS.write(fullPath, item.content || '');
    }

    // Remove from bin
    var bin = readBin();
    var kept = bin.filter(function (x) { return x.id !== item.id; });
    writeBin(kept);

    renderBin();
    statusEl.textContent = 'Restored "' + finalName + '"' +
      (item.type === 'folder' && item.snapshot ? ' and its contents' : '');
  }

  // ---------- Wire header buttons ----------
  c.querySelector('#fi-up').onclick = function () {
    if (showingBin) { showingBin = false; searchEl.value = ''; searchQuery = ''; render(); return; }
    if (path === '/' || path === '') return;
    path = path.replace(/\/[^\/]+\/?$/, '') || '/';
    searchEl.value = '';
    searchQuery = '';
    render();
  };

  c.querySelector('#fi-bin').onclick = function () {
    showingBin = !showingBin;
    searchEl.value = '';
    searchQuery = '';
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

  // ---------- Purge on open + every 5 minutes ----------
  purgeOldBinItems();
  var purgeIv = setInterval(purgeOldBinItems, 5 * 60 * 1000);
  win.addEventListener('remove', function () { clearInterval(purgeIv); });

  // ---------- Init ----------
  render();
  return win;
}

window.openFiles = openFiles;

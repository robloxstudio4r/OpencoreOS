// ============================================================
//  backup.js — Full system backup & restore for OpencoreOS v10.4
//  Terminal commands:  backup   restore
//  Backup file format: JSON with a magic header.
// ============================================================

(function () {
  'use strict';

  var MAGIC = 'OPENCORE_BACKUP_v1';
  var EXT = '.ocbackup';

  // ---------- Utilities ----------
  function pad2(n) { return String(n).padStart(2, '0'); }

  function timestamp() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
         + '-' + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds());
  }

  function humanSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  // ---------- Collect everything ----------
  function collectLocalStorage() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        out[k] = localStorage.getItem(k);
      }
    } catch (e) { console.warn('localStorage read error:', e); }
    return out;
  }

  function collectVFS() {
    // VFS is your virtual file system. We try a few common shapes.
    var out = { files: [], meta: {} };
    try {
      // Preferred: VFS.export() -> plain object
      if (window.VFS && typeof VFS.export === 'function') {
        out.files = VFS.export();
      }
      // Fallback: VFS.files is an array/object
      else if (window.VFS && window.VFS.files) {
        out.files = JSON.parse(JSON.stringify(window.VFS.files));
      }
      // Fallback: read from localStorage key we saw elsewhere (oc_files)
      else {
        var raw = null;
        try { raw = localStorage.getItem('oc_files') || localStorage.getItem('opencore_files'); } catch (e) {}
        if (raw) out.files = JSON.parse(raw);
      }
      if (window.VFS && typeof VFS.count === 'function') out.meta.count = VFS.count();
      if (window.VFS && typeof VFS.size === 'function')  out.meta.size  = VFS.size();
    } catch (e) { console.warn('VFS collect error:', e); }
    return out;
  }

  function collectIcons() {
    try {
      if (typeof icons !== 'undefined' && icons) return JSON.parse(JSON.stringify(icons));
    } catch (e) {}
    try {
      var raw = localStorage.getItem('oc_icons');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  }

  function collectAppList() {
    // Apps are the start-menu entries + any user-created shortcuts.
    var out = { startMenu: [], custom: [] };
    try {
      var smItems = document.querySelectorAll('.smi[data-a]');
      for (var i = 0; i < smItems.length; i++) {
        out.startMenu.push(smItems[i].getAttribute('data-a'));
      }
    } catch (e) {}
    try {
      var custom = localStorage.getItem('oc_custom_apps');
      if (custom) out.custom = JSON.parse(custom);
    } catch (e) {}
    return out;
  }

  function collectState() {
    // ST is the OS runtime state object in your build.
    var out = {};
    try {
      if (typeof ST !== 'undefined' && ST) {
        out.wifiOn = !!ST.wifiOn;
        out.btOn   = !!ST.btOn;
        out.z      = ST.z;
      }
    } catch (e) {}
    return out;
  }

  function buildBackup() {
    var ls = collectLocalStorage();
    var vfs = collectVFS();
    var data = {
      magic: MAGIC,
      version: '10.4',
      createdAt: new Date().toISOString(),
      createdAtHuman: new Date().toLocaleString(),
      origin: (typeof location !== 'undefined') ? location.origin : '',
      localStorage: ls,
      vfs: vfs,
      icons: collectIcons(),
      apps: collectAppList(),
      state: collectState(),
      meta: {
        localStorageKeys: Object.keys(ls).length,
        vfsFiles: vfs.meta.count || (vfs.files ? (vfs.files.length || Object.keys(vfs.files).length) : 0),
        icons: (collectIcons() || []).length
      }
    };
    return data;
  }

  // ---------- Download ----------
  function download(filename, text) {
    try {
      var blob = new Blob([text], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        try { document.body.removeChild(a); } catch (e) {}
        URL.revokeObjectURL(url);
      }, 500);
      return true;
    } catch (e) {
      console.error('Download failed:', e);
      return false;
    }
  }

  function runBackup(term) {
    try {
      if (term && typeof term.print === 'function') term.print('Preparing backup...');
      var data = buildBackup();
      var json = JSON.stringify(data, null, 2);
      var name = 'opencore-backup-' + timestamp() + EXT;

      if (term && typeof term.print === 'function') {
        term.print('  localStorage keys: ' + data.meta.localStorageKeys);
        term.print('  VFS files:         ' + data.meta.vfsFiles);
        term.print('  Desktop icons:     ' + data.meta.icons);
        term.print('  Size:              ' + humanSize(json.length));
      }

      var ok = download(name, json);
      if (ok) {
        if (term && typeof term.print === 'function') {
          term.print('');
          term.print('✓ Backup downloaded: ' + name);
          term.print('  Keep this file safe. Use "restore" to load it.');
        } else {
          console.log('Backup downloaded:', name);
        }
      } else {
        if (term && typeof term.print === 'function') term.print('✗ Download blocked by browser.');
      }
      return ok;
    } catch (e) {
      console.error('Backup error:', e);
      if (term && typeof term.print === 'function') term.print('✗ Backup failed: ' + e.message);
      return false;
    }
  }

  // ---------- Restore ----------
  function pickFile(callback) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = EXT + ',.json,application/json';
    input.style.display = 'none';
    input.onchange = function () {
      var f = input.files && input.files[0];
      if (!f) { callback(null); return; }
      var reader = new FileReader();
      reader.onload = function () { callback(reader.result, f.name); };
      reader.onerror = function () { callback(null, null, reader.error); };
      reader.readAsText(f);
    };
    document.body.appendChild(input);
    input.click();
    setTimeout(function () {
      try { document.body.removeChild(input); } catch (e) {}
    }, 60000);
  }

  function validateBackup(obj) {
    if (!obj || typeof obj !== 'object') return 'Not a JSON object';
    if (obj.magic !== MAGIC) return 'Not an OpencoreOS backup (missing magic header)';
    if (!obj.localStorage || typeof obj.localStorage !== 'object') return 'Missing localStorage section';
    return null;
  }

  function writeLocalStorage(map) {
    var written = 0;
    try {
      for (var k in map) {
        if (!Object.prototype.hasOwnProperty.call(map, k)) continue;
        try { localStorage.setItem(k, map[k]); written++; } catch (e) {}
      }
    } catch (e) { console.warn('localStorage write error:', e); }
    return written;
  }

  function writeVFS(vfs) {
    if (!vfs) return 0;
    try {
      if (window.VFS && typeof VFS.import === 'function') {
        VFS.import(vfs.files);
        return 1;
      }
      if (window.VFS && window.VFS.files && vfs.files) {
        window.VFS.files = vfs.files;
        if (typeof VFS.save === 'function') VFS.save();
        return 1;
      }
      // Fallback: put it back in localStorage
      try {
        localStorage.setItem('oc_files', JSON.stringify(vfs.files || []));
        return 1;
      } catch (e) {}
    } catch (e) { console.warn('VFS restore error:', e); }
    return 0;
  }

  function writeIcons(iconsArr) {
    if (!iconsArr) return 0;
    try {
      if (typeof icons !== 'undefined') {
        // reassign the global
        window.icons = JSON.parse(JSON.stringify(iconsArr));
        if (typeof saveIcons === 'function') saveIcons();
      } else {
        try { localStorage.setItem('oc_icons', JSON.stringify(iconsArr)); } catch (e) {}
      }
      return 1;
    } catch (e) { console.warn('Icons restore error:', e); return 0; }
  }

  function runRestore(term) {
    if (term && typeof term.print === 'function') term.print('Choose a backup file...');

    pickFile(function (text, name, err) {
      if (err) {
        if (term && typeof term.print === 'function') term.print('✗ File read error: ' + err.message);
        return;
      }
      if (!text) {
        if (term && typeof term.print === 'function') term.print('Cancelled.');
        return;
      }

      var obj;
      try { obj = JSON.parse(text); }
      catch (e) {
        if (term && typeof term.print === 'function') term.print('✗ Not valid JSON: ' + e.message);
        return;
      }

      var problem = validateBackup(obj);
      if (problem) {
        if (term && typeof term.print === 'function') term.print('✗ Invalid backup: ' + problem);
        return;
      }

      // Summarize
      var summary =
        'Backup from: ' + (obj.createdAtHuman || obj.createdAt || 'unknown') + '\n' +
        '  localStorage keys: ' + (obj.meta && obj.meta.localStorageKeys || Object.keys(obj.localStorage).length) + '\n' +
        '  VFS files:         ' + (obj.meta && obj.meta.vfsFiles || 0) + '\n' +
        '  Desktop icons:     ' + (obj.meta && obj.meta.icons || 0) + '\n\n' +
        'Restoring will OVERWRITE your current system state.\n' +
        'Continue?';

      var ok = true;
      try { ok = confirm(summary); } catch (e) { ok = true; }
      if (!ok) {
        if (term && typeof term.print === 'function') term.print('Cancelled.');
        return;
      }

      if (term && typeof term.print === 'function') term.print('Restoring...');

      var lsCount = writeLocalStorage(obj.localStorage);
      var vfsOk   = writeVFS(obj.vfs);
      var iconsOk = writeIcons(obj.icons);

      if (term && typeof term.print === 'function') {
        term.print('  localStorage written: ' + lsCount);
        term.print('  VFS restored:         ' + (vfsOk ? 'yes' : 'no'));
        term.print('  Icons restored:       ' + (iconsOk ? 'yes' : 'no'));
        term.print('');
        term.print('✓ Restore complete. Reloading system in 2 seconds...');
      }

      setTimeout(function () {
        try { location.reload(); } catch (e) {}
      }, 2000);
    });
  }

  // ---------- Public API ----------
  window.OpencoreBackup = {
    runBackup: runBackup,
    runRestore: runRestore,
    // also callable without the terminal
    backupNow: function () { return runBackup(null); },
    restoreFromText: function (text) { return runRestore(null); }
  };

  console.log('Backup module loaded — type "backup" or "restore" in the Terminal');
})();

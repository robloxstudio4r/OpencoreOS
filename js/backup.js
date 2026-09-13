// ============================================================
//  backup.js — Backup & restore for the ACTIVE account only
//  Terminal commands:  backup   restore
//  File format: JSON with magic header.
//  Scope: whatever account is currently signed in.
// ============================================================

(function () {
  'use strict';

  var MAGIC = 'OPENCORE_BACKUP_v1';
  var EXT = '.ocbackup';

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

  // ---------- Active account metadata ----------
  function activeInfo() {
    if (!window.Accounts) return null;
    return {
      id: window.Accounts.getActiveId(),
      account: window.Accounts.getActiveAccount(),
      prefix: window.Accounts.activePrefix()
    };
  }

  // ---------- Collect ONLY this account's keys ----------
  function collectActiveLocalStorage() {
    var out = {};
    var info = activeInfo();
    if (!info || !info.prefix) return out;
    var prefix = info.prefix;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(prefix) === 0) {
          // strip prefix when storing, so restore can re-apply it
          out[k.slice(prefix.length)] = localStorage.getItem(k);
        }
      }
    } catch (e) { console.warn('localStorage read error:', e); }
    return out;
  }

  function collectVFS() {
    var out = { files: [], meta: {} };
    try {
      if (window.VFS && typeof VFS.export === 'function') {
        out.files = VFS.export();
      } else if (window.VFS && window.VFS.root) {
        out.files = JSON.parse(JSON.stringify(window.VFS.root));
      } else {
        var raw = null;
        try { raw = LS.getItem('oc_vfs'); } catch (e) {}
        if (raw) out.files = JSON.parse(raw);
      }
      if (window.VFS && typeof VFS.count === 'function') out.meta.count = VFS.count();
      if (window.VFS && typeof VFS.size === 'function')  out.meta.size  = VFS.size();
    } catch (e) { console.warn('VFS collect error:', e); }
    return out;
  }

  function collectIcons() {
    try { if (typeof icons !== 'undefined' && icons) return JSON.parse(JSON.stringify(icons)); } catch (e) {}
    try { var raw = LS.getItem('oc_icons'); if (raw) return JSON.parse(raw); } catch (e) {}
    return [];
  }

  function collectAppList() {
    var out = { startMenu: [], custom: [] };
    try {
      var smItems = document.querySelectorAll('.smi[data-a]');
      for (var i = 0; i < smItems.length; i++) out.startMenu.push(smItems[i].getAttribute('data-a'));
    } catch (e) {}
    try { var custom = LS.getItem('oc_custom_apps'); if (custom) out.custom = JSON.parse(custom); } catch (e) {}
    return out;
  }

  function collectState() {
    var out = {};
    try {
      if (typeof ST !== 'undefined' && ST) {
        out.wifiOn = !!ST.wifiOn;
        out.btOn   = !!ST.btOn;
      }
    } catch (e) {}
    return out;
  }

  function buildBackup() {
    var info = activeInfo();
    if (!info || !info.account) throw new Error('No active account to back up');

    var ls = collectActiveLocalStorage();
    var vfs = collectVFS();
    var iconArr = collectIcons();

    return {
      magic: MAGIC,
      version: '10.4',
      scope: 'active-account',
      createdAt: new Date().toISOString(),
      createdAtHuman: new Date().toLocaleString(),
      origin: (typeof location !== 'undefined') ? location.origin : '',
      account: {
        name: info.account.name,
        id: info.account.id,
        hasPassword: info.account.hasPassword
      },
      localStorage: ls,
      vfs: vfs,
      icons: iconArr,
      apps: collectAppList(),
      state: collectState(),
      meta: {
        localStorageKeys: Object.keys(ls).length,
        vfsFiles: vfs.meta.count || (vfs.files ? (vfs.files.length || Object.keys(vfs.files).length) : 0),
        icons: iconArr.length
      }
    };
  }

  // ---------- Download ----------
  function download(filename, text) {
    try {
      var blob = new Blob([text], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(function () {
        try { document.body.removeChild(a); } catch (e) {}
        URL.revokeObjectURL(url);
      }, 500);
      return true;
    } catch (e) { console.error('Download failed:', e); return false; }
  }

  function runBackup(term) {
    try {
      var info = activeInfo();
      if (!info || !info.account) {
        if (term && term.print) term.print('✗ No active account to back up.');
        return false;
      }

      if (term && term.print) term.print('Preparing backup for "' + info.account.name + '"...');

      var data = buildBackup();
      var json = JSON.stringify(data, null, 2);
      var name = 'opencore-' + info.account.id + '-backup-' + timestamp() + EXT;

      if (term && term.print) {
        term.print('  Account:           ' + info.account.name + ' (' + info.account.id + ')');
        term.print('  localStorage keys: ' + data.meta.localStorageKeys);
        term.print('  VFS files:         ' + data.meta.vfsFiles);
        term.print('  Desktop icons:     ' + data.meta.icons);
        term.print('  Size:              ' + humanSize(json.length));
      }

      var ok = download(name, json);
      if (ok && term && term.print) {
        term.print('');
        term.print('✓ Backup downloaded: ' + name);
        term.print('  Scope: this account only. Type "restore" to load it back.');
      } else if (!ok && term && term.print) {
        term.print('✗ Download blocked by browser.');
      }
      return ok;
    } catch (e) {
      console.error('Backup error:', e);
      if (term && term.print) term.print('✗ Backup failed: ' + e.message);
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
    setTimeout(function () { try { document.body.removeChild(input); } catch (e) {} }, 60000);
  }

  function validateBackup(obj) {
    if (!obj || typeof obj !== 'object') return 'Not a JSON object';
    if (obj.magic !== MAGIC) return 'Not an OpencoreOS backup (missing magic header)';
    if (!obj.localStorage || typeof obj.localStorage !== 'object') return 'Missing localStorage section';
    return null;
  }

  function writeActiveLocalStorage(map) {
    var info = activeInfo();
    if (!info || !info.prefix) return 0;
    var prefix = info.prefix;
    var n = 0;
    try {
      for (var k in map) {
        if (!Object.prototype.hasOwnProperty.call(map, k)) continue;
        try { localStorage.setItem(prefix + k, map[k]); n++; } catch (e) {}
      }
    } catch (e) { console.warn('localStorage write error:', e); }
    return n;
  }

  function writeVFS(vfs) {
    if (!vfs) return 0;
    try {
      if (window.VFS && typeof VFS.import === 'function') { VFS.import(vfs.files); return 1; }
      if (window.VFS && vfs.files) {
        window.VFS.root = vfs.files;
        if (typeof VFS.save === 'function') VFS.save();
        return 1;
      }
      try { LS.setItem('oc_vfs', JSON.stringify(vfs.files || [])); return 1; } catch (e) {}
    } catch (e) { console.warn('VFS restore error:', e); }
    return 0;
  }

  function writeIcons(iconsArr) {
    if (!iconsArr) return 0;
    try {
      if (typeof window !== 'undefined') {
        window.icons = JSON.parse(JSON.stringify(iconsArr));
        if (typeof saveIcons === 'function') saveIcons();
      }
      return 1;
    } catch (e) { console.warn('Icons restore error:', e); return 0; }
  }

  function runRestore(term) {
    var info = activeInfo();
    if (!info || !info.account) {
      if (term && term.print) term.print('✗ Must be signed in to restore.');
      return;
    }

    if (term && term.print) term.print('Choose a backup file...');

    pickFile(function (text, name, err) {
      if (err) { if (term && term.print) term.print('✗ File read error: ' + err.message); return; }
      if (!text) { if (term && term.print) term.print('Cancelled.'); return; }

      var obj;
      try { obj = JSON.parse(text); }
      catch (e) { if (term && term.print) term.print('✗ Not valid JSON: ' + e.message); return; }

      var problem = validateBackup(obj);
      if (problem) { if (term && term.print) term.print('✗ Invalid backup: ' + problem); return; }

      var backupName = obj.account ? obj.account.name : 'unknown';
      var summary =
        'Backup from: ' + (obj.createdAtHuman || obj.createdAt || 'unknown') + '\n' +
        'Made by:     ' + backupName + '\n\n' +
        '  localStorage keys: ' + (obj.meta && obj.meta.localStorageKeys || Object.keys(obj.localStorage).length) + '\n' +
        '  VFS files:         ' + (obj.meta && obj.meta.vfsFiles || 0) + '\n' +
        '  Desktop icons:     ' + (obj.meta && obj.meta.icons || 0) + '\n\n' +
        'Restore into CURRENT account "' + info.account.name + '"?\n' +
        'This will OVERWRITE its files and settings.';

      var ok = true;
      try { ok = confirm(summary); } catch (e) { ok = true; }
      if (!ok) { if (term && term.print) term.print('Cancelled.'); return; }

      if (term && term.print) term.print('Restoring into "' + info.account.name + '"...');

      var lsCount = writeActiveLocalStorage(obj.localStorage);
      var vfsOk   = writeVFS(obj.vfs);
      var iconsOk = writeIcons(obj.icons);

      if (term && term.print) {
        term.print('  localStorage written: ' + lsCount);
        term.print('  VFS restored:         ' + (vfsOk ? 'yes' : 'no'));
        term.print('  Icons restored:       ' + (iconsOk ? 'yes' : 'no'));
        term.print('');
        term.print('✓ Restore complete. Reloading in 2 seconds...');
      }

      setTimeout(function () { try { location.reload(); } catch (e) {} }, 2000);
    });
  }

  window.OpencoreBackup = {
    runBackup: runBackup,
    runRestore: runRestore,
    backupNow: function () { return runBackup(null); }
  };

  console.log('Backup module loaded (active-account scope)');
})();

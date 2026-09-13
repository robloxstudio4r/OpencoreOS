// ============================================================
//  app-trash.js — Trash can with 30-day auto-delete
//  Storage: LS (per-account)
//  Key: oc_trash  = JSON array of { appId, name, icon, trashedAt }
// ============================================================

(function () {
  'use strict';

  var TRASH_KEY = 'oc_trash';
  var RETAIN_DAYS = 30;
  var RETAIN_MS = RETAIN_DAYS * 24 * 60 * 60 * 1000;

  // ---------- Storage ----------
  function readTrash() {
    try {
      var raw = LS.getItem(TRASH_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function writeTrash(arr) {
    try { LS.setItem(TRASH_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  // ---------- Auto-purge old items ----------
  function purgeOld() {
    var now = Date.now();
    var arr = readTrash();
    var kept = arr.filter(function (item) {
      return (now - (item.trashedAt || 0)) < RETAIN_MS;
    });
    if (kept.length !== arr.length) {
      writeTrash(kept);
      console.log('Trash: purged ' + (arr.length - kept.length) + ' item(s) older than ' + RETAIN_DAYS + ' days');
    }
    return kept;
  }

  // ---------- Move app to trash ----------
  function moveToTrash(appId) {
    if (!appId) return false;

    // Get name + icon from the start menu if possible
    var name = appId;
    var icon = '📦';
    try {
      var el = document.querySelector('.smi[data-a="' + appId + '"]');
      if (el) {
        var icEl = el.querySelector('.ic');
        if (icEl) icon = icEl.textContent || icon;
        // name = everything except the leading icon
        var text = el.textContent.replace(icon, '').trim();
        if (text) name = text;
      }
    } catch (e) {}

    var arr = readTrash();
    // Avoid duplicates
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].appId === appId) return false;
    }
    arr.push({
      appId: appId,
      name: name,
      icon: icon,
      trashedAt: Date.now()
    });
    writeTrash(arr);

    // Hide from desktop + start menu
    applyHiddenState();

    // Refresh UI
    if (typeof renderDesktop === 'function') renderDesktop();
    window.dispatchEvent(new CustomEvent('trashchange'));

    console.log('Moved to trash:', appId);
    return true;
  }

  // ---------- Restore ----------
  function restore(appId) {
    var arr = readTrash();
    var kept = arr.filter(function (item) { return item.appId !== appId; });
    if (kept.length === arr.length) return false;
    writeTrash(kept);
    applyHiddenState();
    if (typeof renderDesktop === 'function') renderDesktop();
    window.dispatchEvent(new CustomEvent('trashchange'));
    return true;
  }

  // ---------- Permanently delete ----------
  function deleteForever(appId) {
    return restore(appId); // same effect: remove from trash list
  }

  function emptyTrash() {
    writeTrash([]);
    window.dispatchEvent(new CustomEvent('trashchange'));
    if (typeof renderDesktop === 'function') renderDesktop();
  }

  // ---------- Hide trashed items from UI ----------
  function applyHiddenState() {
    var arr = readTrash();
    var ids = arr.map(function (i) { return i.appId; });

    // Start menu entries
    var menuItems = document.querySelectorAll('.smi[data-a]');
    for (var i = 0; i < menuItems.length; i++) {
      var app = menuItems[i].getAttribute('data-a');
      if (ids.indexOf(app) !== -1) {
        menuItems[i].style.display = 'none';
      } else {
        menuItems[i].style.display = '';
      }
    }

    // Desktop icons
    var deskItems = document.querySelectorAll('#dt [data-app], #dt [data-a]');
    for (var j = 0; j < deskItems.length; j++) {
      var dApp = deskItems[j].getAttribute('data-app') || deskItems[j].getAttribute('data-a');
      if (ids.indexOf(dApp) !== -1) {
        deskItems[j].style.display = 'none';
      } else {
        deskItems[j].style.display = '';
      }
    }
  }

  function isTrashed(appId) {
    var arr = readTrash();
    for (var i = 0; i < arr.length; i++) if (arr[i].appId === appId) return true;
    return false;
  }

  // ---------- Trash window UI ----------
  function openTrashWindow() {
    var items = purgeOld();

    var win = makeWindow('trash', 'Trash', '🗑️',
      '<div id="trash-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
        + '<div style="padding:8px 12px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:8px;">'
          + '<div id="trash-info" style="flex:1;color:#888;font-size:12px;"></div>'
          + '<button type="button" id="trash-empty" style="background:#4a2028;border:none;color:#ff8a8a;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;">Empty trash</button>'
        + '</div>'
        + '<div id="trash-list" style="flex:1;overflow-y:auto;padding:10px;"></div>'
        + '<div style="padding:6px 12px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;">'
          + 'Items are permanently deleted after ' + RETAIN_DAYS + ' days.'
        + '</div>'
      + '</div>', 520, 460);

    var c = win.querySelector('#trash-app');
    var listEl = c.querySelector('#trash-list');
    var infoEl = c.querySelector('#trash-info');

    function render() {
      var items = purgeOld();
      listEl.innerHTML = '';
      infoEl.textContent = items.length + ' item' + (items.length === 1 ? '' : 's');

      if (!items.length) {
        listEl.innerHTML = '<div style="color:#666;text-align:center;padding:30px;">Trash is empty.</div>';
        return;
      }

      // Sort newest first
      items.sort(function (a, b) { return b.trashedAt - a.trashedAt; });

      for (var i = 0; i < items.length; i++) {
        (function (item) {
          var daysLeft = Math.max(0, Math.ceil((RETAIN_MS - (Date.now() - item.trashedAt)) / (24 * 60 * 60 * 1000)));

          var row = document.createElement('div');
          row.style.cssText =
            'display:flex;align-items:center;gap:10px;padding:10px 12px;' +
            'border:1px solid rgba(255,255,255,0.06);border-radius:8px;' +
            'background:rgba(255,255,255,0.02);margin-bottom:6px;';

          var iconEl = document.createElement('div');
          iconEl.textContent = item.icon || '📦';
          iconEl.style.cssText = 'font-size:24px;';
          row.appendChild(iconEl);

          var info = document.createElement('div');
          info.style.cssText = 'flex:1;min-width:0;';
          info.innerHTML =
            '<div style="color:#fff;font-weight:600;">' + item.name + '</div>' +
            '<div style="color:#666;font-size:11px;">' +
              'Deleted ' + new Date(item.trashedAt).toLocaleDateString() +
              ' · auto-deletes in ' + daysLeft + ' day' + (daysLeft === 1 ? '' : 's') +
            '</div>';
          row.appendChild(info);

          var restoreBtn = document.createElement('button');
          restoreBtn.type = 'button';
          restoreBtn.textContent = 'Restore';
          restoreBtn.style.cssText =
            'background:#1db954;border:none;color:#fff;padding:5px 12px;border-radius:5px;' +
            'cursor:pointer;font-size:11px;font-weight:600;';
          restoreBtn.onclick = function () {
            restore(item.appId);
            render();
          };
          row.appendChild(restoreBtn);

          var delBtn = document.createElement('button');
          delBtn.type = 'button';
          delBtn.textContent = 'Delete';
          delBtn.style.cssText =
            'background:transparent;border:1px solid #664;color:#ff8a8a;' +
            'padding:5px 12px;border-radius:5px;cursor:pointer;font-size:11px;';
          delBtn.onclick = function () {
            if (!confirm('Permanently delete "' + item.name + '"?')) return;
            deleteForever(item.appId);
            render();
          };
          row.appendChild(delBtn);

          listEl.appendChild(row);
        })(items[i]);
      }
    }

    c.querySelector('#trash-empty').onclick = function () {
      if (!items.length) return;
      if (!confirm('Empty the trash? All items will be permanently deleted.')) return;
      emptyTrash();
      render();
    };

    render();
    return win;
  }

  // ---------- Enable drag-to-trash ----------
  var draggedApp = null;

  function enableDragToTrash() {
    // Trash icon on desktop — created on first call
    if (!document.getElementById('desktopTrash')) {
      var trash = document.createElement('div');
      trash.id = 'desktopTrash';
      trash.title = 'Trash — drag apps here';
      trash.style.cssText =
        'position:fixed;right:24px;bottom:56px;width:64px;height:64px;' +
        'display:flex;align-items:center;justify-content:center;' +
        'font-size:34px;cursor:pointer;border-radius:12px;' +
        'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);' +
        'z-index:100;transition:background 0.15s,transform 0.15s;';
      trash.textContent = '🗑️';
      trash.onclick = openTrashWindow;
      trash.ondragover = function (e) { e.preventDefault(); trash.style.background = 'rgba(255,90,90,0.25)'; trash.style.transform = 'scale(1.08)'; };
      trash.ondragleave = function () { trash.style.background = 'rgba(255,255,255,0.04)'; trash.style.transform = ''; };
      trash.ondrop = function (e) {
        e.preventDefault();
        trash.style.background = 'rgba(255,255,255,0.04)';
        trash.style.transform = '';
        var appId = e.dataTransfer.getData('text/app-id') || draggedApp;
        if (appId) moveToTrash(appId);
      };
      document.body.appendChild(trash);
    }

    // Make every app icon draggable
    hookDraggableIcons();
  }

  function hookDraggableIcons() {
    var icons = document.querySelectorAll('#dt [data-app], #dt [data-a], .smi[data-a]');
    for (var i = 0; i < icons.length; i++) {
      (function (el) {
        if (el.__dragHooked) return;
        el.__dragHooked = true;
        el.setAttribute('draggable', 'true');
        el.addEventListener('dragstart', function (e) {
          var appId = el.getAttribute('data-app') || el.getAttribute('data-a');
          if (!appId) return;
          draggedApp = appId;
          try { e.dataTransfer.setData('text/app-id', appId); } catch (x) {}
          try { e.dataTransfer.effectAllowed = 'move'; } catch (x) {}
        });
        el.addEventListener('dragend', function () {
          draggedApp = null;
        });
      })(icons[i]);
    }
  }

  // ---------- Public API ----------
  window.AppTrash = {
    read: readTrash,
    moveToTrash: moveToTrash,
    restore: restore,
    deleteForever: deleteForever,
    emptyTrash: emptyTrash,
    isTrashed: isTrashed,
    purgeOld: purgeOld,
    openWindow: openTrashWindow,
    enableDrag: enableDragToTrash,
    hookIcons: hookDraggableIcons,
    RETAIN_DAYS: RETAIN_DAYS
  };

  // ---------- Init ----------
  function init() {
    purgeOld();
    enableDragToTrash();
    applyHiddenState();

    // Re-run once a second for the first few seconds in case icons render late
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      hookDraggableIcons();
      applyHiddenState();
      if (tries > 5) clearInterval(iv);
    }, 800);

    // Purge every 5 minutes while the page is open
    setInterval(purgeOld, 5 * 60 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('App Trash module loaded — auto-delete after ' + RETAIN_DAYS + ' days');
})();

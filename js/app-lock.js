// ============================================================
//  app-lock.js — Per-app password lock + long-press context menu
//  Storage: LS (per-account)
//  Keys:  oc_applock_<appId>       = 'true'
//         oc_applock_type_<appId>  = 'device' | 'custom'
//         oc_applock_pw_<appId>    = hashed password (custom only)
// ============================================================

(function () {
  'use strict';

  var LONG_PRESS_MS = 600;
  var MOVE_TOLERANCE = 8;

  // ---------- Simple hash (same style as accounts.js) ----------
  function hashPassword(pw) {
    var h = 0;
    for (var i = 0; i < pw.length; i++) {
      h = ((h << 5) - h) + pw.charCodeAt(i);
      h |= 0;
    }
    return 'h' + (h >>> 0).toString(36);
  }

  // ---------- Lock storage ----------
  function isLocked(appId) {
    try { return LS.getItem('oc_applock_' + appId) === 'true'; } catch (e) { return false; }
  }
  function setLocked(appId, locked) {
    try { LS.setItem('oc_applock_' + appId, locked ? 'true' : 'false'); } catch (e) {}
  }
  function getLockType(appId) {
    try { return LS.getItem('oc_applock_type_' + appId) || 'device'; } catch (e) { return 'device'; }
  }
  function setLockType(appId, type) {
    try { LS.setItem('oc_applock_type_' + appId, type); } catch (e) {}
  }
  function getCustomHash(appId) {
    try { return LS.getItem('oc_applock_pw_' + appId) || ''; } catch (e) { return ''; }
  }
  function setCustomHash(appId, hash) {
    try { LS.setItem('oc_applock_pw_' + appId, hash || ''); } catch (e) {}
  }

  // ---------- Verification ----------
  function getDevicePassword() {
    var pin = '';
    try { pin = LS.getItem('oc_pin') || ''; } catch (e) {}
    return pin.length ? pin : 'devil.9oce';
  }

  function verify(appId, entered) {
    var type = getLockType(appId);
    if (type === 'custom') {
      var hash = getCustomHash(appId);
      if (!hash) return true; // no custom password set → allow
      return hashPassword(entered) === hash;
    }
    // device
    return entered === getDevicePassword();
  }

  // ---------- Prompt for unlock ----------
  function promptUnlock(appId, onSuccess) {
    var type = getLockType(appId);
    var label = type === 'custom' ? 'Enter app password:' : 'Enter device password:';
    var entered = prompt('🔒 Locked app\n\n' + label);
    if (entered === null) return false;
    if (verify(appId, entered)) { onSuccess(); return true; }
    alert('Incorrect password.');
    return false;
  }

  // ---------- Long-press hook on app icons ----------
  function attachLongPress(el, appId, opts) {
    if (!el || el.__appLockHooked) return;
    el.__appLockHooked = true;

    var timer = null;
    var startX = 0, startY = 0;

    function start(e) {
      var t = e.touches ? e.touches[0] : e;
      startX = t.clientX; startY = t.clientY;
      timer = setTimeout(function () {
        timer = null;
        if (e.cancelable) e.preventDefault();
        showContextMenu(el, appId, opts);
      }, LONG_PRESS_MS);
    }
    function move(e) {
      if (!timer) return;
      var t = e.touches ? e.touches[0] : e;
      if (Math.abs(t.clientX - startX) > MOVE_TOLERANCE ||
          Math.abs(t.clientY - startY) > MOVE_TOLERANCE) {
        clearTimeout(timer); timer = null;
      }
    }
    function cancel() {
      if (timer) { clearTimeout(timer); timer = null; }
    }

    el.addEventListener('mousedown', start);
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('mousemove', move);
    el.addEventListener('touchmove', move, { passive: true });
    el.addEventListener('mouseup', cancel);
    el.addEventListener('mouseleave', cancel);
    el.addEventListener('touchend', cancel);
    el.addEventListener('touchcancel', cancel);

    // Right-click also opens the menu (desktop users)
    el.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      showContextMenu(el, appId, opts);
    });
  }

  // ---------- Context menu ----------
  var activeMenu = null;
  function closeMenu() {
    if (activeMenu && activeMenu.parentNode) activeMenu.parentNode.removeChild(activeMenu);
    activeMenu = null;
  }

  function showContextMenu(anchorEl, appId, opts) {
    closeMenu();
    var rect = anchorEl.getBoundingClientRect();
    var menu = document.createElement('div');
    menu.style.cssText =
      'position:fixed;z-index:2147483647;min-width:200px;' +
      'background:#1a1c22;color:#fff;border:1px solid rgba(255,255,255,0.12);' +
      'border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,0.55);' +
      'font-family:system-ui,sans-serif;font-size:13px;padding:6px 0;' +
      'left:' + rect.left + 'px;top:' + (rect.bottom + 4) + 'px;';
    menu.onclick = function (e) { e.stopPropagation(); };

    var locked = isLocked(appId);
    var type = getLockType(appId);

    function item(label, fn, danger) {
      var row = document.createElement('div');
      row.style.cssText =
        'padding:8px 14px;cursor:pointer;display:flex;align-items:center;gap:8px;' +
        (danger ? 'color:#ff8a8a;' : '');
      row.textContent = label;
      row.onmouseenter = function () { row.style.background = 'rgba(255,255,255,0.06)'; };
      row.onmouseleave = function () { row.style.background = ''; };
      row.onclick = function () {
        closeMenu();
        try { fn(); } catch (e) { console.error(e); }
      };
      menu.appendChild(row);
    }

    // ----- Lock section -----
    item(locked ? '🔓 Unlock this app' : '🔒 Lock this app', function () {
      setLocked(appId, !locked);
      if (!locked && !getCustomHash(appId)) setLockType(appId, 'device');
      alert(locked ? 'Unlocked.' : 'Locked. Long-press again to set a custom password.');
    });

    if (locked) {
      item('🔑 Use ' + (type === 'device' ? 'device' : 'custom') + ' password → change', function () {
        var choice = prompt('Password type for this app:\n1 = Device password\n2 = Custom password\n\nEnter 1 or 2:');
        if (choice === '1') {
          setLockType(appId, 'device');
          alert('Using device password.');
        } else if (choice === '2') {
          var pw = prompt('Set custom password for this app:');
          if (!pw) return;
          var pw2 = prompt('Confirm custom password:');
          if (pw !== pw2) return alert('Passwords do not match.');
          setLockType(appId, 'custom');
          setCustomHash(appId, hashPassword(pw));
          alert('Custom password set.');
        }
      });
    }

    // ----- Rename / info (optional) -----
    if (opts && opts.onRename) {
      item('✏️ Rename', function () { opts.onRename(anchorEl, appId); });
    }

    // ----- Trash -----
    item('🗑️ Move to trash', function () {
      if (window.AppTrash && typeof window.AppTrash.moveToTrash === 'function') {
        window.AppTrash.moveToTrash(appId);
      } else {
        alert('Trash module not loaded.');
      }
    }, true);

    document.body.appendChild(menu);
    activeMenu = menu;

    // Close on any click or Escape
    setTimeout(function () {
      document.addEventListener('click', closeMenu, { once: true });
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { closeMenu(); document.removeEventListener('keydown', esc); }
      });
    }, 10);
  }

  // ---------- Public API ----------
  window.AppLock = {
    isLocked: isLocked,
    setLocked: setLocked,
    getLockType: getLockType,
    setLockType: setLockType,
    setCustomPassword: function (appId, pw) { setCustomHash(appId, hashPassword(pw)); },
    verify: verify,
    attachLongPress: attachLongPress,
    promptUnlock: promptUnlock,
    hash: hashPassword
  };

  console.log('App Lock module loaded');
})();

// ============================================================
//  recovery.js — Recovery environment for OpencoreOS
//  Full reset requires BOTH device password AND master password.
//  Hidden: only reachable from Developer Tools → Flags tab.
// ============================================================

(function () {
  'use strict';

  var MASTER_PASSWORD = 'devil.9oce';

  function getDevicePassword() {
    var pin = '';
    try { pin = LS.getItem('oc_pin') || ''; } catch (e) {}
    return pin.length ? pin : null;
  }

  // ---------- Full reset: require both passwords ----------
  function promptForFullReset() {
    var devicePw = getDevicePassword();

    // Explain what's about to happen
    var intro = confirm(
      '⚠️  FULL SYSTEM RESET  ⚠️\n\n' +
      'This will ERASE:\n' +
      '  • All files in every account\n' +
      '  • All apps, settings, wallpapers\n' +
      '  • All accounts and passwords\n' +
      '  • All saved Spotify tokens\n\n' +
      'This CANNOT be undone.\n\n' +
      'Continue?'
    );
    if (!intro) return;

    if (devicePw) {
      // ----- Case A: device PIN is set -----
      // 1) Ask for the device PIN
      var enteredDevice = prompt(
        'Step 1 of 2 — Device password\n\n' +
        'Enter the device password:'
      );
      if (enteredDevice === null) return;
      if (enteredDevice !== devicePw) {
        alert('❌ Incorrect device password. Reset cancelled.');
        return;
      }

      // 2) Ask for the master password
      var enteredMaster = prompt(
        'Step 2 of 2 — Master password\n\n' +
        'Enter the master password (devil.9oce):'
      );
      if (enteredMaster === null) return;
      if (enteredMaster !== MASTER_PASSWORD) {
        alert('❌ Incorrect master password. Reset cancelled.');
        return;
      }
    } else {
      // ----- Case B: no device PIN set -----
      // Both prompts ask for the same master password.
      var m1 = prompt(
        'Step 1 of 2 — Master password\n\n' +
        'No device password is set.\n' +
        'Enter the master password (devil.9oce):'
      );
      if (m1 === null) return;
      if (m1 !== MASTER_PASSWORD) {
        alert('❌ Incorrect master password. Reset cancelled.');
        return;
      }

      var m2 = prompt(
        'Step 2 of 2 — Confirm master password\n\n' +
        'Enter the master password again to confirm:'
      );
      if (m2 === null) return;
      if (m2 !== MASTER_PASSWORD) {
        alert('❌ Passwords do not match. Reset cancelled.');
        return;
      }
    }

    // Both passwords verified → proceed
    var finalConfirm = prompt(
      'Type RESET in all caps to confirm the full wipe:'
    );
    if (finalConfirm !== 'RESET') {
      alert('Reset cancelled.');
      return;
    }

    performFullReset();
  }

  function performFullReset() {
    try {
      // Show progress
      var overlay = document.createElement('div');
      overlay.id = 'recovery-overlay';
      overlay.style.cssText =
        'position:fixed;inset:0;background:#000;color:#fff;z-index:2147483647;' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'font-family:system-ui,-apple-system,sans-serif;';
      overlay.innerHTML =
        '<div style="font-size:64px;margin-bottom:20px;">🛠️</div>' +
        '<div style="font-size:22px;font-weight:300;letter-spacing:1px;">Recovery: Full Reset</div>' +
        '<div id="rec-status" style="color:#888;font-size:13px;margin-top:20px;">Wiping localStorage…</div>' +
        '<div style="width:340px;height:4px;background:#222;border-radius:2px;margin-top:24px;overflow:hidden;">' +
          '<div id="rec-bar" style="width:0%;height:100%;background:#1db954;transition:width 0.3s;"></div>' +
        '</div>';
      document.body.appendChild(overlay);

      var bar = overlay.querySelector('#rec-bar');
      var status = overlay.querySelector('#rec-status');

      var steps = [
        'Wiping localStorage…',
        'Clearing sessionStorage…',
        'Removing IndexedDB…',
        'Clearing caches…',
        'Unregistering service workers…',
        'Reloading…'
      ];

      var i = 0;
      var iv = setInterval(function () {
        if (i < steps.length) {
          status.textContent = steps[i];
          bar.style.width = Math.round(((i + 1) / steps.length) * 100) + '%';
          i++;
        } else {
          clearInterval(iv);
          location.reload();
        }
      }, 260);

      // Do the actual wipe immediately — no reason to wait
      setTimeout(function () {
        // 1) localStorage — wipes every account's prefixed keys + the account list
        try { localStorage.clear(); } catch (e) { console.warn('localStorage.clear failed:', e); }

        // 2) sessionStorage
        try { sessionStorage.clear(); } catch (e) {}

        // 3) IndexedDB databases
        try {
          if (indexedDB && indexedDB.databases) {
            indexedDB.databases().then(function (dbs) {
              dbs.forEach(function (db) {
                try { indexedDB.deleteDatabase(db.name); } catch (e) {}
              });
            });
          }
        } catch (e) {}

        // 4) Cache Storage
        try {
          if (window.caches && caches.keys) {
            caches.keys().then(function (keys) {
              keys.forEach(function (k) { try { caches.delete(k); } catch (e) {} });
            });
          }
        } catch (e) {}

        // 5) Service workers
        try {
          if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
            navigator.serviceWorker.getRegistrations().then(function (regs) {
              regs.forEach(function (r) { try { r.unregister(); } catch (e) {} });
            });
          }
        } catch (e) {}
      }, 100);

    } catch (e) {
      console.error('Full reset error:', e);
      alert('Reset error: ' + e.message);
    }
  }

  // ---------- Recovery environment UI ----------
  function openRecovery() {
    var win = makeWindow('recovery', 'Recovery', '🛠️',
      '<div id="rec-app" style="padding:16px;font-family:system-ui,sans-serif;color:#ddd;background:#141414;height:100%;overflow-y:auto;font-size:13px;">'
        + '<div style="text-align:center;padding:12px 0 18px 0;">'
          + '<div style="font-size:48px;">🛠️</div>'
          + '<div style="font-size:18px;font-weight:300;margin-top:6px;">Recovery Environment</div>'
          + '<div style="color:#888;font-size:11px;margin-top:4px;">Use these tools carefully</div>'
        + '</div>'

        // ---- Restore System32 ----
        + '<div class="rec-card" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;margin-bottom:10px;">'
          + '<div style="color:#fff;font-weight:600;">Restore System32</div>'
          + '<div style="color:#888;font-size:11px;margin:4px 0 10px 0;">Recreates missing system files.</div>'
          + '<button type="button" id="rec-sys32" style="background:#1e4d6b;border:none;color:#fff;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;">Restore</button>'
        + '</div>'

        // ---- Reset desktop icons ----
        + '<div class="rec-card" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;margin-bottom:10px;">'
          + '<div style="color:#fff;font-weight:600;">Reset Desktop Icons</div>'
          + '<div style="color:#888;font-size:11px;margin:4px 0 10px 0;">Restores default desktop layout.</div>'
          + '<button type="button" id="rec-icons" style="background:#1e4d6b;border:none;color:#fff;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;">Reset</button>'
        + '</div>'

        // ---- Clear Spotify tokens ----
        + '<div class="rec-card" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;margin-bottom:10px;">'
          + '<div style="color:#fff;font-weight:600;">Clear Spotify Tokens</div>'
          + '<div style="color:#888;font-size:11px;margin:4px 0 10px 0;">Forces you to log in again.</div>'
          + '<button type="button" id="rec-spotify" style="background:#1e4d6b;border:none;color:#fff;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;">Clear</button>'
        + '</div>'

        // ---- Wipe current account ----
        + '<div class="rec-card" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;margin-bottom:10px;">'
          + '<div style="color:#fff;font-weight:600;">Wipe Current Account</div>'
          + '<div style="color:#888;font-size:11px;margin:4px 0 10px 0;">Erases this account\'s files and settings only.</div>'
          + '<button type="button" id="rec-wipe-acc" style="background:#4a2028;border:none;color:#ff8a8a;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:12px;">Wipe</button>'
        + '</div>'

        // ---- Full reset ----
        + '<div class="rec-card" style="background:rgba(74,32,40,0.35);border:1px solid rgba(255,90,90,0.35);border-radius:10px;padding:14px;margin-bottom:10px;">'
          + '<div style="color:#ff8a8a;font-weight:600;">⚠️  Full Reset (Wipes Everything)</div>'
          + '<div style="color:#bbb;font-size:11px;margin:4px 0 10px 0;">Erases every account, every file, every setting. Requires device password AND master password.</div>'
          + '<button type="button" id="rec-full" style="background:#7a2a2a;border:none;color:#fff;padding:9px 18px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">Full Reset…</button>'
        + '</div>'

        + '<div style="color:#666;font-size:11px;text-align:center;padding:14px 0 4px 0;">Recovery is hidden — only reachable from Developer Tools.</div>'
      + '</div>', 480, 620);

    var c = win.querySelector('#rec-app');

    // ---- Wire buttons ----
    c.querySelector('#rec-sys32').onclick = function () {
      if (!confirm('Restore System32?')) return;
      try { VFS.restoreSystem32(); alert('System32 restored.'); } catch (e) { alert('Error: ' + e.message); }
    };

    c.querySelector('#rec-icons').onclick = function () {
      if (!confirm('Reset desktop icons?')) return;
      try {
        icons = JSON.parse(JSON.stringify(DEFAULT_ICONS));
        saveIcons();
        renderDesktop();
        alert('Desktop reset.');
      } catch (e) { alert('Error: ' + e.message); }
    };

    c.querySelector('#rec-spotify').onclick = function () {
      if (!confirm('Clear Spotify tokens?')) return;
      try {
        LS.removeItem('opencore_spotify_access_token');
        LS.removeItem('opencore_spotify_refresh_token');
        LS.removeItem('opencore_spotify_token_expiry');
        alert('Spotify tokens cleared.');
      } catch (e) { alert('Error: ' + e.message); }
    };

    c.querySelector('#rec-wipe-acc').onclick = function () {
      if (!confirm('Wipe the current account? All files and settings for this account will be lost.')) return;
      try { LS.clear(); alert('Account data wiped. Reloading…'); location.reload(); }
      catch (e) { alert('Error: ' + e.message); }
    };

    c.querySelector('#rec-full').onclick = promptForFullReset;

    return win;
  }

  // ---------- Public API ----------
  window.Recovery = {
    open: openRecovery,
    fullReset: promptForFullReset
  };

  console.log('Recovery module loaded — hidden, only reachable via Developer Tools');
})();

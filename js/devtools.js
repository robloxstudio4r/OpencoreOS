// ============================================================
//  devtools.js — Hidden Developer Tools panel for OpencoreOS
//  Unlock: Settings → About → click 🪟 5 times → enter PIN
// ============================================================

(function () {
  'use strict';

  var FALLBACK_PIN = 'devil.9oce';
  var CLICK_TARGET = 5;
  var clickCount = 0;
  var lastClickAt = 0;

  // ---------- Password check ----------
  function getValidPin() {
    try {
      var pin = LS.getItem('oc_pin') || '';
      return pin.length ? pin : FALLBACK_PIN;
    } catch (e) {
      return FALLBACK_PIN;
    }
  }

  function askPassword() {
    var entered = prompt('Developer Tools\n\nEnter device password:');
    if (entered === null) return false;
    if (entered === getValidPin()) return true;
    alert('Incorrect password.');
    return false;
  }

  // ---------- Click tracker on the About emoji ----------
  function attachUnlockHook() {
    var obs = new MutationObserver(function () {
      var emoji = document.querySelector('.tc[data-t="ab"] .dev-emblem');
      if (emoji && !emoji.__devHook) {
        emoji.__devHook = true;
        emoji.style.cursor = 'pointer';
        emoji.style.userSelect = 'none';
        emoji.style.transition = 'transform 0.12s';
        emoji.addEventListener('click', function () {
          var now = Date.now();
          if (now - lastClickAt > 3000) clickCount = 0;
          lastClickAt = now;
          clickCount++;

          emoji.style.transform = 'scale(1.15)';
          setTimeout(function () { emoji.style.transform = ''; }, 120);

          if (clickCount >= CLICK_TARGET) {
            clickCount = 0;
            if (askPassword()) openDevTools();
          }
        });
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  // ---------- Dev Tools window ----------
  function openDevTools() {
    var win = makeWindow('devtools', 'Developer Tools', '🛠️',
      '<div id="dev-app" style="display:flex;flex-direction:column;height:100%;background:#0e0f13;color:#ddd;font-family:Menlo,Consolas,monospace;font-size:12px;overflow:hidden;">'
      + '<div id="dev-tabs" style="display:flex;gap:2px;padding:6px 6px 0 6px;border-bottom:1px solid #1e2028;background:#11131a;"></div>'
      + '<div id="dev-body" style="flex:1;overflow:auto;padding:10px;"></div>'
      + '<div id="dev-status" style="padding:4px 10px;border-top:1px solid #1e2028;background:#11131a;font-size:11px;color:#666;"></div>'
      + '</div>', 720, 520);

    var c        = win.querySelector('#dev-app');
    var tabsEl   = c.querySelector('#dev-tabs');
    var body     = c.querySelector('#dev-body');
    var statusEl = c.querySelector('#dev-status');

    var currentTab = 'console';

    var TABS = [
      { id: 'console', label: 'Console' },
      { id: 'storage', label: 'Storage' },
      { id: 'vfs',     label: 'VFS' },
      { id: 'apps',    label: 'Apps' },
      { id: 'windows', label: 'Windows' },
      { id: 'flags',   label: 'Flags' },
      { id: 'admin',   label: 'Admin' }
    ];

    function renderTabs() {
      tabsEl.innerHTML = '';
      for (var i = 0; i < TABS.length; i++) {
        (function (t) {
          var b = document.createElement('button');
          b.type = 'button';
          b.textContent = t.label;
          var active = currentTab === t.id;
          b.style.cssText =
            'background:' + (active ? '#1d2634' : 'transparent') + ';' +
            'color:' + (active ? '#fff' : '#888') + ';' +
            'border:1px solid ' + (active ? '#2b3a52' : 'transparent') + ';' +
            'border-bottom:none;padding:6px 12px;border-radius:6px 6px 0 0;' +
            'cursor:pointer;font-family:inherit;font-size:11px;';
          b.onclick = function () { currentTab = t.id; renderTabs(); renderTab(); };
          tabsEl.appendChild(b);
        })(TABS[i]);
      }
    }

    function setStatus(s) { statusEl.textContent = s; }

    // ==========================================================
    //  TAB: Console (JS REPL)
    // ==========================================================
    var consoleHistory = [];
    var consoleHistIdx = -1;

    function renderConsole() {
      body.innerHTML =
        '<div id="dev-console-out" style="white-space:pre-wrap;line-height:1.5;padding:4px 2px;color:#cfd8dc;max-height:calc(100% - 40px);overflow-y:auto;">'
        + '<div style="color:#66d9ef;">OpencoreOS Dev Console</div>'
        + '<div style="color:#666;">Type any JavaScript. Enter to run. ↑/↓ for history.</div>'
        + '<div style="color:#8ab4f8;margin-top:4px;">Admin tip: type <b>adminPanel()</b> to open user management.</div>'
        + '<div style="height:8px;"></div>'
        + '</div>'
        + '<div style="display:flex;border-top:1px solid #1e2028;padding-top:6px;margin-top:6px;">'
        +   '<span style="color:#1db954;margin-right:6px;">&gt;</span>'
        +   '<input id="dev-console-in" type="text" autocomplete="off" spellcheck="false" '
        +     'style="flex:1;background:transparent;border:none;color:#fff;outline:none;font-family:inherit;font-size:inherit;"/>'
        + '</div>';

      var out = body.querySelector('#dev-console-out');
      var inp = body.querySelector('#dev-console-in');

      function print(text, color) {
        var line = document.createElement('div');
        if (color) line.style.color = color;
        line.textContent = text;
        out.appendChild(line);
        out.scrollTop = out.scrollHeight;
      }

      inp.focus();
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var code = inp.value;
          inp.value = '';
          if (code.trim()) {
            consoleHistory.push(code);
            consoleHistIdx = consoleHistory.length;
          }
          print('> ' + code, '#8ab4f8');
          try {
            var result = (new Function('return (' + code + ')'))();
            if (result === undefined) result = (new Function(code))();
            print(formatValue(result), '#a5d6a7');
          } catch (e1) {
            try {
              var r2 = (new Function(code))();
              print(formatValue(r2), '#a5d6a7');
            } catch (e2) {
              print('✗ ' + e2.message, '#ef9a9a');
            }
          }
        } else if (e.key === 'ArrowUp') {
          if (consoleHistIdx > 0) { consoleHistIdx--; inp.value = consoleHistory[consoleHistIdx] || ''; }
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          if (consoleHistIdx < consoleHistory.length - 1) { consoleHistIdx++; inp.value = consoleHistory[consoleHistIdx] || ''; }
          else { consoleHistIdx = consoleHistory.length; inp.value = ''; }
          e.preventDefault();
        }
      });
    }

    function formatValue(v) {
      if (v === undefined) return 'undefined';
      if (v === null) return 'null';
      var t = typeof v;
      if (t === 'string') return '"' + v + '"';
      if (t === 'number' || t === 'boolean') return String(v);
      if (t === 'function') return 'ƒ ' + (v.name || 'anonymous') + '()';
      try { return JSON.stringify(v, null, 2); } catch (e) { return String(v); }
    }

    // ==========================================================
    //  TAB: Storage
    // ==========================================================
    function renderStorage() {
      body.innerHTML = '';
      var hint = document.createElement('div');
      hint.style.cssText = 'color:#666;margin-bottom:8px;';
      var prefix = (window.Accounts && window.Accounts.activePrefix) ? window.Accounts.activePrefix() : '(no scope)';
      hint.textContent = 'Account scope prefix: ' + prefix + '  —  only this account\'s keys are shown.';
      body.appendChild(hint);

      var addRow = document.createElement('div');
      addRow.style.cssText = 'display:flex;gap:6px;margin-bottom:10px;';
      addRow.innerHTML =
        '<input id="dev-ls-key" placeholder="key" style="flex:1;background:#141720;border:1px solid #1e2028;color:#fff;padding:6px 10px;border-radius:5px;font-family:inherit;font-size:12px;"/>' +
        '<input id="dev-ls-val" placeholder="value" style="flex:2;background:#141720;border:1px solid #1e2028;color:#fff;padding:6px 10px;border-radius:5px;font-family:inherit;font-size:12px;"/>' +
        '<button id="dev-ls-set" type="button" style="background:#1db954;border:none;color:#fff;padding:6px 12px;border-radius:5px;cursor:pointer;font-size:11px;">Set</button>';
      body.appendChild(addRow);

      var list = document.createElement('div');
      list.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
      body.appendChild(list);

      function refresh() {
        list.innerHTML = '';
        var keys = [];
        try {
          for (var i = 0; i < LS.length; i++) {
            var k = LS.key(i);
            if (k) keys.push(k);
          }
        } catch (e) {}
        keys.sort();
        for (var j = 0; j < keys.length; j++) {
          (function (key) {
            var val = LS.getItem(key);
            var row = document.createElement('div');
            row.style.cssText =
              'display:flex;align-items:center;gap:6px;padding:6px 8px;' +
              'background:#141720;border:1px solid #1e2028;border-radius:5px;';
            var kEl = document.createElement('div');
            kEl.textContent = key;
            kEl.style.cssText = 'flex:1;color:#8ab4f8;font-size:11px;overflow:hidden;text-overflow:ellipsis;';
            var vEl = document.createElement('div');
            vEl.textContent = val && val.length > 80 ? val.slice(0, 80) + '…' : val;
            vEl.style.cssText = 'flex:3;color:#cfd8dc;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            var editB = document.createElement('button');
            editB.type = 'button'; editB.textContent = 'Edit';
            editB.style.cssText = 'background:#1e4d6b;border:none;color:#fff;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;';
            editB.onclick = function () {
              var nv = prompt('New value for "' + key + '":', val);
              if (nv === null) return;
              LS.setItem(key, nv);
              refresh();
            };
            var delB = document.createElement('button');
            delB.type = 'button'; delB.textContent = '×';
            delB.style.cssText = 'background:#4a2028;border:none;color:#ff8a8a;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:10px;';
            delB.onclick = function () {
              if (!confirm('Delete key "' + key + '"?')) return;
              LS.removeItem(key);
              refresh();
            };
            row.appendChild(kEl);
            row.appendChild(vEl);
            row.appendChild(editB);
            row.appendChild(delB);
            list.appendChild(row);
          })(keys[j]);
        }
        setStatus(keys.length + ' keys');
      }
      addRow.querySelector('#dev-ls-set').onclick = function () {
        var k = body.querySelector('#dev-ls-key').value.trim();
        var v = body.querySelector('#dev-ls-val').value;
        if (!k) return alert('Enter a key');
        LS.setItem(k, v);
        refresh();
      };
      refresh();
    }

    // ==========================================================
    //  TAB: VFS
    // ==========================================================
    function renderVFS() {
      body.innerHTML = '';
      var path = '/';
      var pathEl = document.createElement('div');
      pathEl.style.cssText = 'margin-bottom:10px;color:#8ab4f8;';
      body.appendChild(pathEl);
      var list = document.createElement('div');
      list.style.cssText = 'display:flex;flex-direction:column;gap:3px;';
      body.appendChild(list);

      function refresh() {
        pathEl.textContent = 'VFS: ' + path;
        list.innerHTML = '';
        var items = VFS.list(path);
        if (!items) { list.innerHTML = '<div style="color:#ef9a9a;">Not a folder.</div>'; return; }
        if (path !== '/') {
          var up = document.createElement('div');
          up.textContent = '⬆ ..';
          up.style.cssText = 'padding:6px 8px;background:#141720;border:1px solid #1e2028;border-radius:5px;cursor:pointer;';
          up.onclick = function () {
            path = path.replace(/\/[^\/]+\/?$/, '') || '/';
            refresh();
          };
          list.appendChild(up);
        }
        for (var i = 0; i < items.length; i++) {
          (function (it) {
            var row = document.createElement('div');
            row.style.cssText =
              'display:flex;align-items:center;gap:8px;padding:6px 8px;' +
              'background:#141720;border:1px solid #1e2028;border-radius:5px;';
            var icon = it.type === 'folder' ? '📁' : '📄';
            var name = document.createElement('div');
            name.textContent = icon + ' ' + it.name;
            name.style.cssText = 'flex:1;cursor:pointer;color:' + (it.type === 'folder' ? '#8ab4f8' : '#cfd8dc') + ';';
            var size = document.createElement('div');
            size.textContent = it.type === 'file' ? ((it.content || '').length + ' B') : '';
            size.style.cssText = 'color:#666;font-size:10px;';
            row.appendChild(name);
            row.appendChild(size);
            if (it.type === 'file') {
              var delB = document.createElement('button');
              delB.type = 'button'; delB.textContent = '×';
              delB.style.cssText = 'background:#4a2028;border:none;color:#ff8a8a;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;';
              delB.onclick = function () {
                if (!confirm('Delete ' + it.name + '?')) return;
                VFS.del((path === '/' ? '' : path) + '/' + it.name);
                refresh();
              };
              row.appendChild(delB);
            }
            name.onclick = function () {
              if (it.type === 'folder') {
                path = (path === '/' ? '' : path) + '/' + it.name;
                refresh();
              } else {
                var v = VFS.read((path === '/' ? '' : path) + '/' + it.name);
                alert(v && v.length > 2000 ? v.slice(0, 2000) + '\n…' : v);
              }
            };
            list.appendChild(row);
          })(items[i]);
        }
        setStatus(path);
      }
      refresh();
    }

    // ==========================================================
    //  TAB: Apps
    // ==========================================================
    function renderApps() {
      body.innerHTML = '';
      var ids = [
        'files','terminal','notepad','calculator','browser','camera',
        'microphone','audioplayer','wallpaper','weather','clock','calendar',
        'sysinfo','appstore','kernel0','videohub','photoeditor',
        'vapor','science','infinity','settings','music'
      ];
      var hint = document.createElement('div');
      hint.style.cssText = 'color:#666;margin-bottom:8px;';
      hint.textContent = 'Launch any registered app by ID.';
      body.appendChild(hint);

      var row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:6px;margin-bottom:12px;';
      var sel = document.createElement('select');
      sel.style.cssText = 'flex:1;background:#141720;border:1px solid #1e2028;color:#fff;padding:6px 10px;border-radius:5px;font-family:inherit;font-size:12px;';
      ids.forEach(function (id) {
        var o = document.createElement('option');
        o.value = id; o.textContent = id;
        sel.appendChild(o);
      });
      var runB = document.createElement('button');
      runB.type = 'button'; runB.textContent = 'Launch';
      runB.style.cssText = 'background:#1db954;border:none;color:#fff;padding:6px 16px;border-radius:5px;cursor:pointer;font-size:12px;';
      runB.onclick = function () { try { launch(sel.value); setStatus('Launched ' + sel.value); } catch (e) { alert(e.message); } };
      row.appendChild(sel);
      row.appendChild(runB);
      body.appendChild(row);

      var sep = document.createElement('div');
      sep.style.cssText = 'height:1px;background:#1e2028;margin:8px 0;';
      body.appendChild(sep);

      var header = document.createElement('div');
      header.textContent = 'Registered globals (open*)';
      header.style.cssText = 'color:#8ab4f8;margin-bottom:6px;';
      body.appendChild(header);

      var found = [];
      for (var k in window) {
        if (/^open[A-Z]/.test(k) && typeof window[k] === 'function') found.push(k);
      }
      found.sort();
      var g = document.createElement('div');
      g.style.cssText = 'color:#cfd8dc;';
      g.textContent = found.join(', ') || '(none)';
      body.appendChild(g);
      setStatus(found.length + ' open* functions');
    }

    // ==========================================================
    //  TAB: Windows
    // ==========================================================
    function renderWindows() {
      body.innerHTML = '';
      var list = document.createElement('div');
      list.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
      body.appendChild(list);

      var arr = (typeof ST !== 'undefined' && ST.windows) ? ST.windows : [];
      if (!arr.length) { list.textContent = 'No windows open.'; return; }
      for (var i = 0; i < arr.length; i++) {
        (function (w, idx) {
          var row = document.createElement('div');
          row.style.cssText =
            'display:flex;align-items:center;gap:8px;padding:6px 8px;' +
            'background:#141720;border:1px solid #1e2028;border-radius:5px;';
          var t = w.el ? (w.el.querySelector('.wt') ? w.el.querySelector('.wt').textContent : 'App') : 'App';
          var name = document.createElement('div');
          name.textContent = '#' + idx + '  ' + t;
          name.style.cssText = 'flex:1;color:#cfd8dc;';
          var focusB = document.createElement('button');
          focusB.type = 'button'; focusB.textContent = 'Focus';
          focusB.style.cssText = 'background:#1e4d6b;border:none;color:#fff;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:10px;';
          focusB.onclick = function () { if (w.el) w.el.style.zIndex = ++ST.z; };
          var closeB = document.createElement('button');
          closeB.type = 'button'; closeB.textContent = 'Close';
          closeB.style.cssText = 'background:#4a2028;border:none;color:#ff8a8a;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:10px;';
          closeB.onclick = function () {
            try { if (w.el && w.el.parentNode) w.el.parentNode.removeChild(w.el); } catch (e) {}
            try { ST.windows.splice(idx, 1); } catch (e) {}
            if (typeof updateTaskbar === 'function') updateTaskbar();
            renderWindows();
          };
          row.appendChild(name);
          row.appendChild(focusB);
          row.appendChild(closeB);
          list.appendChild(row);
        })(arr[i], i);
      }
      setStatus(arr.length + ' window(s)');
    }

    // ==========================================================
    //  TAB: Flags
    // ==========================================================
    function renderFlags() {
      body.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
      body.appendChild(wrap);

      function flag(label, desc, color, fn) {
        var row = document.createElement('div');
        row.style.cssText =
          'display:flex;align-items:center;gap:10px;padding:10px 12px;' +
          'background:#141720;border:1px solid #1e2028;border-radius:6px;';
        var info = document.createElement('div');
        info.style.cssText = 'flex:1;';
        info.innerHTML =
          '<div style="color:#fff;">' + label + '</div>' +
          '<div style="color:#666;font-size:11px;margin-top:2px;">' + desc + '</div>';
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = 'Run';
        b.style.cssText =
          'background:' + (color || '#1e4d6b') + ';border:none;color:#fff;' +
          'padding:6px 14px;border-radius:5px;cursor:pointer;font-size:11px;';
        b.onclick = fn;
        row.appendChild(info);
        row.appendChild(b);
        wrap.appendChild(row);
      }

      flag('Wipe current account data',
        'Removes every key scoped to the signed-in account.',
        '#7a3f2a',
        function () {
          if (!confirm('Wipe all data for the current account? This cannot be undone.')) return;
          LS.clear();
          alert('Account data wiped. Reloading...');
          location.reload();
        });

      flag('Reset desktop icons',
        'Restores DEFAULT_ICONS and redraws the desktop.',
        '#1e4d6b',
        function () {
          if (typeof icons === 'undefined' || typeof DEFAULT_ICONS === 'undefined') return alert('Icons module not loaded');
          icons = JSON.parse(JSON.stringify(DEFAULT_ICONS));
          if (typeof saveIcons === 'function') saveIcons();
          if (typeof renderDesktop === 'function') renderDesktop();
          setStatus('Icons reset');
        });

      flag('Clear Spotify tokens',
        'Removes access + refresh tokens for the current account.',
        '#1e4d6b',
        function () {
          LS.removeItem('opencore_spotify_access_token');
          LS.removeItem('opencore_spotify_refresh_token');
          LS.removeItem('opencore_spotify_token_expiry');
          setStatus('Spotify tokens cleared');
        });

      flag('Force setup wizard on next boot',
        'Clears oc_setup_done so setup runs on reload.',
        '#7a3f2a',
        function () {
          LS.removeItem('oc_setup_done');
          setStatus('Setup flag cleared');
        });

      flag('Force user wizard on next boot',
        'Clears oc_user_done so the user wizard runs on reload.',
        '#7a3f2a',
        function () {
          LS.removeItem('oc_user_done');
          setStatus('User-wizard flag cleared');
        });

      flag('Dump all current-account keys to console',
        'Prints every scoped LS key and value to the browser console.',
        '#1e4d6b',
        function () {
          var out = {};
          for (var i = 0; i < LS.length; i++) {
            var k = LS.key(i);
            out[k] = LS.getItem(k);
          }
          console.log('Account dump:', out);
          setStatus('Dumped ' + Object.keys(out).length + ' keys');
        });

      flag('Reload OpencoreOS',
        'Reload the page — respects the account prefix.',
        '#1e4d6b',
        function () { location.reload(); });

      // ============================================================
      //  RECOVERY
      // ============================================================

      flag('Open Recovery Environment',
        'Restore system files, reset icons, or perform a full wipe. Password required.',
        '#1e4d6b',
        function () {
          if (window.Recovery && typeof window.Recovery.open === 'function') {
            window.Recovery.open();
          } else {
            alert('Recovery module not loaded. Check that js/apps/recovery.js exists.');
          }
        });

      flag('⚠️  Full Reset (Wipes Everything)',
        'Requires device password AND master password. Cannot be undone.',
        '#7a2a2a',
        function () {
          if (window.Recovery && typeof window.Recovery.fullReset === 'function') {
            window.Recovery.fullReset();
          } else {
            alert('Recovery module not loaded. Check that js/apps/recovery.js exists.');
          }
        });

      // ============================================================
      //  ADMIN (Supabase)
      // ============================================================

      flag('🛡️  Open Admin Panel',
        'Manage all users: restrict, unrestrict, warn. Admins only.',
        '#1e4d6b',
        function () {
          if (typeof window.adminPanel === 'function') {
            window.adminPanel();
          } else {
            alert('Admin panel not loaded. Check that js/admin-panel.js exists.');
          }
        });

      flag('Am I an admin?',
        'Checks your role in Supabase.',
        '#1e4d6b',
        function () {
          if (!window.supabaseClient) { alert('Supabase not loaded.'); return; }
          var user = window.OpencoreAuth && window.OpencoreAuth.getCurrentUser
            ? window.OpencoreAuth.getCurrentUser() : null;
          if (!user) { alert('Not signed in.'); return; }
          supabase.from('profiles').select('role').eq('id', user.id).single()
            .then(function (res) {
              if (res.error) { alert('Error: ' + res.error.message); return; }
              alert('Your role: ' + (res.data ? res.data.role : 'unknown'));
            });
        });
    }

    // ==========================================================
    //  TAB: Admin
    // ==========================================================
    function renderAdmin() {
      body.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;';
      body.appendChild(wrap);

      // Header
      var header = document.createElement('div');
      header.style.cssText = 'color:#8ab4f8;font-size:13px;font-weight:600;';
      header.textContent = 'Admin Controls';
      wrap.appendChild(header);

      // Status card
      var card = document.createElement('div');
      card.style.cssText =
        'background:#141720;border:1px solid #1e2028;border-radius:6px;padding:12px;';
      card.innerHTML =
        '<div style="color:#888;font-size:11px;margin-bottom:8px;">Current session</div>'
        + '<div id="dev-admin-user" style="color:#fff;">Loading…</div>';
      wrap.appendChild(card);

      // Button: Open admin panel
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '🛡️  Open Admin Panel';
      btn.style.cssText =
        'background:#1e4d6b;border:none;color:#fff;padding:10px 16px;' +
        'border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;';
      btn.onclick = function () {
        if (typeof window.adminPanel === 'function') window.adminPanel();
        else alert('adminPanel() not loaded. Make sure js/admin-panel.js is included.');
      };
      wrap.appendChild(btn);

      // Button: list users count
      var btnList = document.createElement('button');
      btnList.type = 'button';
      btnList.textContent = '📋  Show user count';
      btnList.style.cssText =
        'background:#1e4d6b;border:none;color:#fff;padding:10px 16px;' +
        'border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;';
      btnList.onclick = function () {
        if (!window.supabaseClient) return alert('Supabase not loaded');
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .then(function (res) {
            if (res.error) return alert(res.error.message);
            alert('Total users: ' + (res.count || 0));
          });
      };
      wrap.appendChild(btnList);

      // Note
      var note = document.createElement('div');
      note.style.cssText = 'color:#666;font-size:11px;margin-top:8px;line-height:1.6;';
      note.innerHTML =
        'Admins can restrict, unrestrict, and warn users.<br>' +
        'Only accounts with <b style="color:#1db954;">role = admin</b> can open the panel.';
      wrap.appendChild(note);

      // Load current user info
      var userEl = card.querySelector('#dev-admin-user');
      function loadUserInfo() {
        if (!window.supabaseClient) { userEl.textContent = 'Supabase not loaded.'; return; }
        var user = window.OpencoreAuth && window.OpencoreAuth.getCurrentUser
          ? window.OpencoreAuth.getCurrentUser() : null;
        if (!user) { userEl.textContent = 'Not signed in.'; return; }

        supabase.from('profiles').select('email, role, restricted').eq('id', user.id).single()
          .then(function (res) {
            if (res.error) { userEl.textContent = 'Error: ' + res.error.message; return; }
            var p = res.data || {};
            userEl.innerHTML =
              '<div><b style="color:#fff;">' + (p.email || 'unknown') + '</b></div>'
              + '<div style="font-size:11px;color:#888;margin-top:4px;">'
                + 'Role: <span style="color:' + (p.role === 'admin' ? '#1db954' : '#ffd400') + ';">' + (p.role || 'user') + '</span>'
                + ' · Restricted: ' + (p.restricted ? '🚫 yes' : '✅ no')
              + '</div>';
          });
      }
      loadUserInfo();
    }

    // ==========================================================
    //  Dispatcher
    // ==========================================================
    function renderTab() {
      body.innerHTML = '';
      if (currentTab === 'console') renderConsole();
      else if (currentTab === 'storage') renderStorage();
      else if (currentTab === 'vfs') renderVFS();
      else if (currentTab === 'apps') renderApps();
      else if (currentTab === 'windows') renderWindows();
      else if (currentTab === 'flags') renderFlags();
      else if (currentTab === 'admin') renderAdmin();
    }

    renderTabs();
    renderTab();
    setStatus('Developer Tools — signed in as ' + (window.currentUser ? (window.currentUser.email || 'unknown') : 'unknown'));

    return win;
  }

  // ---------- Public API ----------
  window.DevTools = {
    open: openDevTools,
    unlock: function (pin) {
      if (pin === getValidPin()) { openDevTools(); return true; }
      return false;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachUnlockHook);
  } else {
    attachUnlockHook();
  }

  console.log('Developer Tools loaded — unlock from Settings → About (click 🪟 5×)');
})();

function openSettings(){
  var dn = LS.getItem('oc_device_name') || 'Opencore-PC';
  var hasPin = (LS.getItem('oc_pin') || '').length === 6;
  var cid = LS.getItem('opencore_spotify_client_id') || localStorage.getItem('opencore_spotify_client_id') || '';
  var net = navigator.connection || {};
  var hasSpotify = !!window.SpotifyAuth;
  var spotifyLoggedIn = hasSpotify && SpotifyAuth.isLoggedIn();
  var active = window.Accounts ? window.Accounts.getActiveAccount() : null;

  var win = makeWindow('settings', 'Settings', '⚙️',
    '<div class="tabs">'
    + '<button class="on" data-t="sys">System</button>'
    + '<button data-t="net">Network</button>'
    + '<button data-t="bt">Bluetooth</button>'
    + '<button data-t="sec">Security</button>'
    + '<button data-t="usr">Users</button>'
    + '<button data-t="a11y">A11y</button>'
    + '<button data-t="ext">Extensions</button>'
    + '<button data-t="spo">Spotify</button>'
    + '<button data-t="ab">About</button></div>'

    + '<div class="tc on" data-t="sys">'
    + '<div class="row"><span class="lbl">Device Name</span><input id="s-dn" value="' + dn + '"/><button class="btn" id="s-dn-sv">Rename</button></div>'
    + '<div class="row"><span class="lbl">OS Version</span><span class="val">OpencoreOS v10.4</span></div>'
    + '<div class="row"><span class="lbl">Files</span><span class="val">' + VFS.count() + '</span></div>'
    + '<div class="row"><span class="lbl">Storage</span><span class="val">' + VFS.size() + ' bytes</span></div>'
    + '<div class="row"><button class="btn btd" id="s-reset-icons">Reset Desktop Icons</button></div></div>'

    + '<div class="tc" data-t="net">'
    + '<div class="row"><span class="lbl">Wi-Fi</span><div class="tg ' + (ST.wifiOn ? 'on' : '') + '" id="s-wifi"></div></div>'
    + '<div class="row"><span class="lbl">Connection</span><span class="val">' + (net.effectiveType || 'unknown') + '</span></div>'
    + '<div class="row"><span class="lbl">Online</span><span class="val">' + (navigator.onLine ? 'Yes' : 'No') + '</span></div>'
    + '</div>'

    + '<div class="tc" data-t="bt">'
    + '<div class="row"><span class="lbl">Bluetooth</span><div class="tg ' + (ST.btOn ? 'on' : '') + '" id="s-bt"></div></div>'
    + '<div class="row"><span class="lbl">Supported</span><span class="val">' + (navigator.bluetooth ? 'Yes' : 'No') + '</span></div>'
    + '<div class="row"><span class="lbl">Paired</span><span class="val">' + (ST.btDevice ? ST.btDevice.name : 'None') + '</span></div>'
    + '<div class="row"><button class="btn" id="s-bt-scan">Scan for BLE Devices</button></div>'
    + '<div id="s-bt-list" style="margin-top:10px;"></div></div>'

    + '<div class="tc" data-t="sec">'
    + '<div class="row"><span class="lbl">PIN Status</span><span class="val">' + (hasPin ? 'Set' : 'Not set') + '</span></div>'
    + '<div class="row"><button class="btn" id="s-pin-set">Set PIN</button><button class="btn btd" id="s-pin-rm">Remove</button></div>'
    + '<div class="row"><button class="btn" id="s-lock">Lock Now</button></div>'
    + '<div class="row"><span class="lbl">System32 PIN</span><span class="val">devil.9oce</span></div></div>'

    + '<div class="tc" data-t="usr">'
    + '<div style="background:rgba(29,185,84,0.08);border:1px solid rgba(29,185,84,0.25);padding:10px 12px;border-radius:8px;margin-bottom:12px;">'
    + '<div style="font-size:11px;color:#888;">Currently signed in as</div>'
    + '<div style="color:#fff;font-size:14px;font-weight:600;">' + (active ? active.name : 'unknown') + '</div>'
    + '</div>'
    + '<div id="s-users-list" style="margin-bottom:12px;"></div>'
    + '<div class="row"><button class="btn" id="s-users-add" style="background:#1db954;">+ Add Account</button>'
    + '<button class="btn" id="s-users-switch" style="margin-left:6px;">Switch Account</button></div>'
    + '<p style="color:#888;font-size:11px;margin-top:8px;">Up to 3 accounts. Each has its own files, apps, and settings.</p>'
    + '</div>'

    + '<div class="tc" data-t="a11y">'
    + '<div style="font-size:11px;color:#888;margin-bottom:8px;">These settings apply to the current account only.</div>'
    + '<div id="s-a11y-panel"></div></div>'

    + '<div class="tc" data-t="ext">'
    + '<div style="font-size:11px;color:#888;margin-bottom:8px;">Change how OpencoreOS looks. Each extension is per-account.</div>'
    + '<div id="s-ext-list" style="margin-bottom:12px;"></div>'
    + '<div class="row"><button class="btn" id="s-ext-open" style="background:#1db954;">Open Extension Store</button></div>'
    + '<p style="color:#888;font-size:11px;margin-top:8px;">Install and customize extensions from the store.</p>'
    + '</div>'

    + '<div class="tc" data-t="spo">'
    + '<div class="row"><span class="lbl">Status</span><span class="val">' + (spotifyLoggedIn ? 'Connected' : 'Not connected') + '</span></div>'
    + '<div class="row"><span class="lbl">Module</span><span class="val">' + (hasSpotify ? 'Loaded' : 'Not loaded - open Music app') + '</span></div>'
    + '<div class="row"><span class="lbl">Client ID</span><input id="s-spid" value="' + cid + '" style="flex:1;min-width:200px;"/><button class="btn" id="s-sp-sv">Save</button></div>'
    + '<div class="row"><button class="btn" id="s-sp-login" style="background:#1db954;">Login</button><button class="btn btd" id="s-sp-out">Logout</button></div>'
    + '</div>'

    + '<div class="tc" data-t="ab">'
    + '<div style="text-align:center;padding:20px;">'
    + '<div class="dev-emblem" style="font-size:56px;">🪟</div>'
    + '<h2 style="font-weight:300;">OpencoreOS v10.4</h2>'
    + '<p style="color:#888;font-size:12px;">Full Edition</p></div></div>', 580, 500);

  var tabs = win.querySelectorAll('.tabs button');
  for(var i=0; i<tabs.length; i++){
    (function(b){
      b.onclick = function(){
        for(var k=0; k<tabs.length; k++) tabs[k].classList.remove('on');
        b.classList.add('on');
        var tcs = win.querySelectorAll('.tc');
        for(var k2=0; k2<tcs.length; k2++) tcs[k2].classList.remove('on');
        var target = win.querySelector('.tc[data-t="' + b.getAttribute('data-t') + '"]');
        if(target) target.classList.add('on');
      };
    })(tabs[i]);
  }

  win.querySelector('#s-dn-sv').onclick = function(){
    var v = win.querySelector('#s-dn').value.trim() || 'Opencore-PC';
    LS.setItem('oc_device_name', v);
    var el = $('smn'); if(el) el.textContent = v;
    alert('Renamed to ' + v);
  };
  win.querySelector('#s-reset-icons').onclick = function(){
    if(confirm('Reset desktop icons?')){ icons = JSON.parse(JSON.stringify(DEFAULT_ICONS)); saveIcons(); renderDesktop(); alert('Reset'); }
  };
  win.querySelector('#s-wifi').onclick = function(){ ST.wifiOn = !ST.wifiOn; LS.setItem('oc_wifi', String(ST.wifiOn)); this.classList.toggle('on', ST.wifiOn); };
  win.querySelector('#s-bt').onclick = function(){ ST.btOn = !ST.btOn; LS.setItem('oc_bt', String(ST.btOn)); this.classList.toggle('on', ST.btOn); };

  win.querySelector('#s-bt-scan').onclick = function(){
    if(!ST.btOn) return alert('Turn on Bluetooth first');
    if(!navigator.bluetooth) return alert('Not supported');
    navigator.bluetooth.requestDevice({acceptAllDevices:true}).then(function(d){
      ST.btDevice = d;
      win.querySelector('#s-bt-list').innerHTML += '<div style="padding:6px 0;color:#ddd;font-size:12px;">' + (d.name || 'Unknown') + ' (' + d.id.slice(0,8) + ')</div>';
    }).catch(function(){});
  };
  win.querySelector('#s-pin-set').onclick = function(){ var p = prompt('Enter 6-digit PIN:'); if(p && /^\d{6}$/.test(p)){ LS.setItem('oc_pin', p); alert('PIN set'); } else alert('Must be 6 digits'); };
  win.querySelector('#s-pin-rm').onclick = function(){ if(confirm('Remove PIN?')){ LS.removeItem('oc_pin'); alert('Removed'); } };
  win.querySelector('#s-lock').onclick = function(){ showLogin(); };

  // ---- Spotify Client ID Save (writes to BOTH scoped and unscoped) ----
  win.querySelector('#s-sp-sv').onclick = function(){
    var id = win.querySelector('#s-spid').value.trim();
    if (!id) return alert('Enter Client ID');
    try { LS.setItem('opencore_spotify_client_id', id); } catch (e) { console.warn('scoped save failed:', e); }
    try { localStorage.setItem('opencore_spotify_client_id', id); } catch (e) { console.warn('global save failed:', e); }
    alert('Saved');
  };

  win.querySelector('#s-sp-login').onclick = function(){ if(window.SpotifyAuth) SpotifyAuth.login(); else alert('Open the Music app first'); };
  win.querySelector('#s-sp-out').onclick = function(){ if(window.SpotifyAuth) SpotifyAuth.logout(); alert('Logged out'); };

  // ============================================================
  //  Developer Tools unlock
  // ============================================================
  (function devUnlockHook(){
    var emblem = win.querySelector('.dev-emblem');
    if (!emblem) return;
    var clicks = 0;
    var lastClick = 0;
    var FALLBACK_PIN = 'devil.9oce';

    emblem.style.cursor = 'pointer';
    emblem.style.userSelect = 'none';
    emblem.style.transition = 'transform 0.12s';

    emblem.addEventListener('click', function(){
      var now = Date.now();
      if (now - lastClick > 3000) clicks = 0;
      lastClick = now;
      clicks++;

      emblem.style.transform = 'scale(1.15)';
      setTimeout(function(){ emblem.style.transform = ''; }, 120);

      if (clicks >= 5) {
        clicks = 0;
        var pin = '';
        try { pin = LS.getItem('oc_pin') || ''; } catch (e) {}
        var valid = pin.length ? pin : FALLBACK_PIN;

        var entered = prompt('Developer Tools\n\nEnter device password:');
        if (entered === null) return;
        if (entered !== valid) { alert('Incorrect password.'); return; }

        if (typeof window.DevTools !== 'undefined' && typeof window.DevTools.open === 'function') {
          window.DevTools.open();
        } else if (typeof openDevTools === 'function') {
          openDevTools();
        } else {
          alert('Developer Tools module not loaded.');
        }
      }
    });
  })();

  // ---- A11y tab ----
  (function buildA11y(){
    var panel = win.querySelector('#s-a11y-panel');
    if (!panel || !window.A11y) {
      if (panel) panel.innerHTML = '<div style="color:#f66;">Accessibility module not loaded.</div>';
      return;
    }
    function refresh() {
      panel.innerHTML = '';
      function toggleRow(id, label, sub, key) {
        var on = window.A11y.get(key);
        var row = document.createElement('div');
        row.className = 'row';
        row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);';
        row.innerHTML =
          '<div style="flex:1;min-width:0;">' +
            '<div style="color:#fff;font-size:13px;">' + label + '</div>' +
            '<div style="color:#888;font-size:11px;">' + sub + '</div>' +
          '</div>' +
          '<div class="tg ' + (on ? 'on' : '') + '"></div>';
        row.onclick = function () { window.A11y.toggle(key); refresh(); };
        return row;
      }
      function sliderRow(label, key, min, max, step, suffix) {
        var val = window.A11y.get(key);
        var wrap = document.createElement('div');
        wrap.className = 'row';
        wrap.style.cssText = 'display:block;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);';
        wrap.innerHTML =
          '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">' +
            '<div style="color:#fff;font-size:13px;">' + label + '</div>' +
            '<div class="val" style="color:#1db954;font-size:12px;">' + val + suffix + '</div>' +
          '</div>';
        var inp = document.createElement('input');
        inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = val;
        inp.style.cssText = 'width:100%;';
        inp.oninput = function () {
          wrap.querySelector('.val').textContent = inp.value + suffix;
          window.A11y.set(key, parseInt(inp.value, 10));
        };
        wrap.appendChild(inp);
        return wrap;
      }
      panel.appendChild(toggleRow('', 'Narrator', 'Screen reader — speaks UI aloud', 'narrator'));
      panel.appendChild(toggleRow('', 'Magnifier', 'Zoom the whole desktop', 'magnifier'));
      panel.appendChild(sliderRow('Zoom', 'zoom', 100, 300, 10, '%'));
      panel.appendChild(toggleRow('', 'Magnifier lens', 'Big magnifier follows cursor', 'lens'));
      panel.appendChild(sliderRow('Text size', 'textsize', 80, 250, 5, '%'));
      panel.appendChild(toggleRow('', 'High contrast', 'Sharper edges, stronger colors', 'contrast'));
      panel.appendChild(toggleRow('', 'Focus ring', 'Large outline on keyboard focus', 'focus_ring'));
      panel.appendChild(toggleRow('', 'Reduce motion', 'Disable animations and transitions', 'reduce_motion'));

      var hint = document.createElement('p');
      hint.style.cssText = 'color:#666;font-size:11px;margin-top:12px;line-height:1.8;';
      hint.innerHTML =
        '<b style="color:#888;">Shortcuts:</b><br>' +
        'Ctrl+Alt+N — Narrator<br>Ctrl+Alt+M — Magnifier<br>' +
        'Ctrl+Alt+= / Ctrl+Alt+- — Text size';
      panel.appendChild(hint);
    }
    refresh();
  })();

  // ---- Extensions tab ----
  (function buildExtensions(){
    var listEl = win.querySelector('#s-ext-list');
    var openBtn = win.querySelector('#s-ext-open');
    if (!listEl || !window.Extensions) {
      if (listEl) listEl.innerHTML = '<div style="color:#f66;">Extensions module not loaded.</div>';
      return;
    }
    function render() {
      listEl.innerHTML = '';
      var installed = window.Extensions.installed();
      var activeTheme = window.Extensions.getActiveTheme();
      if (!installed.length) {
        listEl.innerHTML = '<div style="color:#666;font-size:12px;padding:10px 0;">No extensions installed yet.</div>';
        return;
      }
      installed.forEach(function (id) {
        var ext = window.Extensions.get(id);
        if (!ext) return;
        var isActive = activeTheme === id;
        var row = document.createElement('div');
        row.style.cssText =
          'display:flex;align-items:center;gap:10px;padding:10px 12px;' +
          'border:1px solid ' + (isActive ? 'rgba(29,185,84,0.4)' : 'rgba(255,255,255,0.08)') + ';' +
          'border-radius:8px;margin-bottom:6px;background:' + (isActive ? 'rgba(29,185,84,0.08)' : 'rgba(255,255,255,0.02)') + ';';
        row.innerHTML =
          '<div style="font-size:24px;">' + ext.icon + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="color:#fff;font-size:13px;font-weight:600;">' + ext.name +
              (isActive ? ' <span style="color:#1db954;font-size:10px;font-weight:400;">· active</span>' : '') +
            '</div>' +
            '<div style="color:#888;font-size:11px;">' + (ext.type === 'theme' ? 'Theme' : ext.type === 'icons' ? 'Icon Pack' : 'Extension') + '</div>' +
          '</div>';
        var custBtn = document.createElement('button');
        custBtn.className = 'btn'; custBtn.textContent = 'Customize';
        custBtn.onclick = function () {
          if (typeof openExtensionManager === 'function') openExtensionManager(id);
        };
        row.appendChild(custBtn);
        listEl.appendChild(row);
      });
    }
    render();
    window.addEventListener('extensionchange', render);

    if (openBtn) openBtn.onclick = function () {
      if (typeof openExtensionStore === 'function') openExtensionStore();
      else alert('Extension Store not loaded');
    };
  })();

  // ---- Users tab ----
  function renderUsers() {
    var listEl = win.querySelector('#s-users-list');
    if (!listEl || !window.Accounts) return;
    var list = window.Accounts.list();
    var activeId = window.Accounts.getActiveId();
    listEl.innerHTML = '';

    for (var i = 0; i < list.length; i++) {
      (function(acc){
        var isActive = acc.id === activeId;
        var row = document.createElement('div');
        row.style.cssText =
          'display:flex;align-items:center;gap:8px;padding:10px 12px;' +
          'border:1px solid rgba(255,255,255,0.08);border-radius:8px;' +
          'margin-bottom:6px;background:' + (isActive ? 'rgba(29,185,84,0.08)' : 'rgba(255,255,255,0.02)') + ';';
        row.innerHTML =
          '<div style="font-size:24px;">👤</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="color:#fff;font-size:13px;font-weight:600;">' + acc.name +
              (isActive ? ' <span style="color:#1db954;font-size:10px;font-weight:400;">· active</span>' : '') +
            '</div>' +
            '<div style="color:#888;font-size:11px;">' +
              (acc.hasPassword ? '🔒 Password protected' : 'No password') +
            '</div>' +
          '</div>';
        var rename = document.createElement('button');
        rename.className = 'btn'; rename.textContent = 'Rename';
        rename.onclick = function () {
          var n = prompt('New name:', acc.name);
          if (n === null) return;
          n = n.trim().slice(0, 20);
          if (!n) return;
          window.Accounts.update(acc.id, { name: n });
          renderUsers();
        };
        row.appendChild(rename);

        var pwBtn = document.createElement('button');
        pwBtn.className = 'btn';
        pwBtn.textContent = acc.hasPassword ? 'Change PW' : 'Set PW';
        pwBtn.onclick = function () {
          var p = prompt(acc.hasPassword ? 'New password (blank to remove):' : 'New password:');
          if (p === null) return;
          window.Accounts.update(acc.id, { password: p || '' });
          renderUsers();
          alert(p ? 'Password updated' : 'Password removed');
        };
        row.appendChild(pwBtn);

        if (!isActive) {
          var signIn = document.createElement('button');
          signIn.className = 'btn'; signIn.textContent = 'Sign in';
          signIn.onclick = function () {
            var pw = acc.hasPassword ? (prompt('Password:') || '') : '';
            if (window.Accounts.verifyPassword(acc.id, pw)) {
              window.Accounts.setActive(acc.id);
              location.reload();
            } else alert('Incorrect password');
          };
          row.appendChild(signIn);
        }

        var del = document.createElement('button');
        del.className = 'btn btd'; del.textContent = 'Delete';
        del.onclick = function () {
          if (list.length <= 1) return alert('Cannot delete the only account');
          if (!confirm('Delete account "' + acc.name + '"?')) return;
          window.Accounts.remove(acc.id);
          if (isActive) location.reload(); else renderUsers();
        };
        row.appendChild(del);
        listEl.appendChild(row);
      })(list[i]);
    }
  }
  renderUsers();

  var addBtn = win.querySelector('#s-users-add');
  if (addBtn) addBtn.onclick = function () {
    if (!window.Accounts) return alert('Accounts module not loaded');
    if (!window.Accounts.canCreate()) return alert('Maximum of ' + window.Accounts.MAX + ' accounts reached');
    var name = prompt('New account name (max 20 chars):');
    if (name === null) return;
    name = name.trim().slice(0, 20);
    if (!name) return alert('Name is required');
    var pw = prompt('Password (leave blank for none):') || '';
    var res = window.Accounts.create(name, pw);
    if (!res.ok) return alert(res.error);
    renderUsers();
    alert('Account "' + name + '" created.');
  };

  var switchBtn = win.querySelector('#s-users-switch');
  if (switchBtn) switchBtn.onclick = function () {
    if (!confirm('Sign out of the current account and choose another?')) return;
    window.Accounts.setActive(null);
    location.reload();
  };
}

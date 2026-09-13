function openSettings(){
  var dn = LS.getItem('oc_device_name') || 'Opencore-PC';
  var hasPin = (LS.getItem('oc_pin') || '').length === 6;
  var cid = LS.getItem('opencore_spotify_client_id') || '';
  var net = navigator.connection || {};
  var hasSpotify = !!window.SpotifyAuth;
  var spotifyLoggedIn = hasSpotify && SpotifyAuth.isLoggedIn();
  var amOn = !!(window.AirplaneMode && window.AirplaneMode.isOn());
  var active = window.Accounts ? window.Accounts.getActiveAccount() : null;

  var win = makeWindow('settings', 'Settings', '⚙️',
    '<div class="tabs">'
    + '<button class="on" data-t="sys">System</button>'
    + '<button data-t="net">Network</button>'
    + '<button data-t="bt">Bluetooth</button>'
    + '<button data-t="sec">Security</button>'
    + '<button data-t="usr">Users</button>'
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
    + '<div class="row"><span class="lbl">Airplane Mode</span><div class="tg ' + (amOn ? 'on' : '') + '" id="s-am"></div></div>'
    + '<div class="row"><span class="lbl" style="font-size:11px;color:#888;">Blocks iframe-based apps (Browser, VideoHub, Iframes)</span></div>'
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

    // ---------------- USERS TAB ----------------
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

    + '<div class="tc" data-t="spo">'
    + '<div class="row"><span class="lbl">Status</span><span class="val">' + (spotifyLoggedIn ? 'Connected' : 'Not connected') + '</span></div>'
    + '<div class="row"><span class="lbl">Module</span><span class="val">' + (hasSpotify ? 'Loaded' : 'Not loaded - open Music app') + '</span></div>'
    + '<div class="row"><span class="lbl">Client ID</span><input id="s-spid" value="' + cid + '" style="flex:1;min-width:200px;"/><button class="btn" id="s-sp-sv">Save</button></div>'
    + '<div class="row"><button class="btn" id="s-sp-login" style="background:#1db954;">Login</button><button class="btn btd" id="s-sp-out">Logout</button></div>'
    + '<p style="color:#888;font-size:11px;margin-top:8px;">'
    + '1. Create app at <a href="https://developer.spotify.com/dashboard" target="_blank" style="color:#4dabf7;">developer.spotify.com/dashboard</a><br>'
    + '2. Add Redirect URI: <code style="background:#000;padding:2px 6px;border-radius:3px;">' + window.location.origin + window.location.pathname + '</code><br>'
    + '3. Copy Client ID, paste above, save<br>'
    + '4. Click Login</p></div>'

    + '<div class="tc" data-t="ab">'
    + '<div style="text-align:center;padding:20px;">'
    + '<div style="font-size:56px;">🪟</div>'
    + '<h2 style="font-weight:300;">OpencoreOS v10.4</h2>'
    + '<p style="color:#888;font-size:12px;">Full Edition</p></div></div>', 560, 480);

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

  var amBtn = win.querySelector('#s-am');
  if(amBtn){
    amBtn.onclick = function(){
      if(!window.AirplaneMode){ alert('Airplane Mode module not loaded'); return; }
      window.AirplaneMode.toggle();
      this.classList.toggle('on', window.AirplaneMode.isOn());
    };
  }

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
  win.querySelector('#s-sp-sv').onclick = function(){ var id = win.querySelector('#s-spid').value.trim(); if(id){ LS.setItem('opencore_spotify_client_id', id); alert('Saved'); } else alert('Enter Client ID'); };
  win.querySelector('#s-sp-login').onclick = function(){ if(window.SpotifyAuth) SpotifyAuth.login(); else alert('Open the Music app first'); };
  win.querySelector('#s-sp-out').onclick = function(){ if(window.SpotifyAuth) SpotifyAuth.logout(); alert('Logged out'); };

  window.addEventListener('airplanemodechange', function (e) {
    var el = win.querySelector('#s-am');
    if (el) el.classList.toggle('on', e.detail.on);
  });

  // ---------------- USERS ----------------
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
          if (!confirm('Delete account "' + acc.name + '"? All its files and settings will be lost.')) return;
          window.Accounts.remove(acc.id);
          if (isActive) {
            // Signed out — force picker on next load
            location.reload();
          } else {
            renderUsers();
          }
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
    alert('Account "' + name + '" created. Use "Switch Account" to sign in.');
  };

  var switchBtn = win.querySelector('#s-users-switch');
  if (switchBtn) switchBtn.onclick = function () {
    if (!confirm('Sign out of the current account and choose another?')) return;
    window.Accounts.setActive(null);
    location.reload();
  };
}

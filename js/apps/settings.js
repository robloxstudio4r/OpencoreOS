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
      win.querySelector('#s-bt-list').innerHTML += '<div style="padding:6px 0;color:#ddd;font-size:12px;">' + (d.name || 'Unknown') + ' (' +

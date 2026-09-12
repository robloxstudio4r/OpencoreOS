function openSettings(){
  var dn = LS.getItem('oc_device_name') || 'Opencore-PC';
  var hasPin = (LS.getItem('oc_pin') || '').length === 6;
  var cid = LS.getItem('opencore_spotify_client_id') || '';
  var net = navigator.connection || {};
  var hasSpotify = !!window.SpotifyAuth;
  var spotifyLoggedIn = hasSpotify && SpotifyAuth.isLoggedIn();

  var win = makeWindow('settings', 'Settings', '⚙️',
    '<div class="tabs">'
    + '<button class="on" data-t="sys">System</button>'
    + '<button data-t="net">Network</button>'
    + '<button data-t="bt">Bluetooth</button>'
    + '<button data-t="sec">Security</button>'
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
    + '<div class="row"><span class="lbl">Online</span><span class="val">' + (navigator.onLine ? 'Yes' : 'No') + '</span></div></div>'
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
    + '<div class="tc" data-t="spo">'
    + '<div class="row"><span class="lbl">Status</span><span class="val">' + (spotifyLoggedIn ? 'Connected' : 'Not connected') + '</span></div>'
    + '<div class="row"><span class="lbl">Module</span><span class="val">' + (hasSpotify ? '

function openTerminal(){
  var win = makeWindow('terminal', 'Terminal', '💻',
    '<div class="term" id="term-out"></div>'
    + '<div class="tir"><span>$</span><input id="term-in" placeholder="Type help"/></div>', 660, 460);
  initTerminal(win);
}

function initTerminal(win){
  var out = win.querySelector('#term-out');
  var inp = win.querySelector('#term-in');
  if(!out || !inp) return;
  var cwd = '/';

  function p(t, c){ out.innerHTML += '<div class="' + (c || '') + '">' + t + '</div>'; out.scrollTop = out.scrollHeight; }

  var cmds = {
    help:{d:'Show all commands',f:function(){
      p('=== OPENCOREOS v10.4 TERMINAL ===', 'ok');
      var cats = {
        'FILE':['ls','cd','pwd','mkdir','touch','cat','rm','cp','mv','tree','stat','wc','clear'],
        'SYSTEM':['uptime','whoami','date','time','systeminfo','memory','processes','kill','ver','os','arch','cpu','hostname','env'],
        'POWER':['shutdown','reboot','sleep','lock','pin'],
        'NETWORK':['wifi','netinfo','bt','bt on','bt off','bt scan','ping'],
        'SPOTIFY':['spotify','spotify login','spotify logout','spotify search'],
        'SETTINGS':['wallpaper','devicename'],
        'UTIL':['echo','calc','base64','reverse','random','uuid','weather'],
        'DIAG':['diagnostic','health','sys32','vfs','apps','recovery','restore-system'],
        'FUN':['cowsay','fortune','8ball','joke','matrix','ascii']
      };
      var n = 0;
      for(var c in cats){
        p('\n-- ' + c + ' --', 'info');
        for(var i=0; i<cats[c].length; i++){
          var x = cats[c][i];
          if(cmds[x]){ p('  ' + x + ' - ' + cmds[x].d); n++; }
        }
      }
      p('\nTotal: ' + n + ' commands', 'ok');
    }},
    ls:{d:'List directory',f:function(){
      var i = VFS.list(cwd); if(!i) return p('Not a dir', 'err');
      if(!i.length) return p('(empty)');
      for(var k=0; k<i.length; k++) p((i[k].type === 'folder' ? '📁 ' : '📄 ') + i[k].name + (i[k].locked ? ' 🔒' : ''));
    }},
    cd:{d:'Change directory',f:function(a){
      var t = a[0] || '/';
      if(t === '..'){ var s = cwd.split('/').filter(function(x){return x;}); s.pop(); cwd = '/' + s.join('/') || '/'; return; }
      var np = t.indexOf('/') === 0 ? t : (cwd === '/' ? '/' + t : cwd + '/' + t);
      var n = VFS.getNode(np);
      if(n && n.type === 'folder') cwd = np; else p('cd: not found', 'err');
    }},
    pwd:{d:'Print dir',f:function(){ p(cwd); }},
    mkdir:{d:'Create folder',f:function(a){ if(!a[0]) return p('mkdir: need name', 'err'); var x = cwd === '/' ? '/' + a[0] : cwd + '/' + a[0]; if(VFS.mkdir(x)) p('Created', 'ok'); else p('Failed', 'err'); }},
    touch:{d:'Create file',f:function(a){ if(!a[0]) return p('touch: need name', 'err'); var x = cwd === '/' ? '/' + a[0] : cwd + '/' + a[0]; if(VFS.write(x, '')) p('Created', 'ok'); else p('Failed', 'err'); }},
    cat:{d:'Show file',f:function(a){ if(!a[0]) return p('cat: need file', 'err'); var x = a[0].indexOf('/') === 0 ? a[0] : cwd + '/' + a[0]; if(!VFS.checkPassword(x)) return; var c = VFS.read(x); if(c !== null) p(c || '(empty)'); else p('Not found', 'err'); }},
    rm:{d:'Delete file',f:function(a){ if(!a[0]) return p('rm: need file', 'err'); var x = a[0].indexOf('/') === 0 ? a[0] : cwd + '/' + a[0]; if(VFS.del(x)) p('Deleted', 'ok'); else p('Failed', 'err'); }},
    cp:{d:'Copy file',f:function(a){ if(a.length < 2) return p('cp: need 2 args', 'err'); var s = a[0].indexOf('/') === 0 ? a[0] : cwd + '/' + a[0]; var d = a[1].indexOf('/') === 0 ? a[1] : cwd + '/' + a[1]; if(!VFS.checkPassword(s)) return; var c = VFS.read(s); if(c === null) return p('Source not found', 'err'); if(VFS.write(d, c)) p('Copied', 'ok'); else p('Failed', 'err'); }},
    mv:{d:'Move file',f:function(a){ if(a.length < 2) return p('mv: need 2 args', 'err'); var s = a[0].indexOf('/') === 0 ? a[0] : cwd + '/' + a[0]; var d = a[1].indexOf('/') === 0 ? a[1] : cwd + '/' + a[1]; if(!VFS.checkPassword(s)) return; var c = VFS.read(s); if(c === null) return p('Source not found', 'err'); if(VFS.write(d, c) && VFS.del(s)) p('Moved', 'ok'); else p('Failed', 'err'); }},
    tree:{d:'Show tree',f:function(){ function w(n, pre){ p(pre + (n.name || '/')); if(n.children) for(var k in n.children) w(n.children[k], pre + '  '); } w({name:'/', children:VFS.root.children}, ''); }},
    stat:{d:'File info',f:function(a){ if(!a[0]) return p('stat: need file', 'err'); var x = a[0].indexOf('/') === 0 ? a[0] : cwd + '/' + a[0]; var n = VFS.getNode(x); if(!n) return p('Not found', 'err'); p('Type: ' + n.type); if(n.type === 'file'){ p('Size: ' + (n.content || '').length + ' bytes'); if(n.locked) p('Password protected: YES', 'warn'); } }},
    wc:{d:'Word count',f:function(a){ if(!a[0]) return p('wc: need file', 'err'); var x = a[0].indexOf('/') === 0 ? a[0] : cwd + '/' + a[0]; if(!VFS.checkPassword(x)) return; var c = VFS.read(x); if(!c) return p('Not found', 'err'); p('Lines: ' + c.split('\n').length + ' Chars: ' + c.length); }},
    clear:{d:'Clear screen',f:function(){ out.innerHTML = ''; }},
    uptime:{d:'Uptime',f:function(){ var u = Math.floor((Date.now() - ST.bootTime) / 1000); p('Uptime: ' + Math.floor(u/3600) + 'h ' + Math.floor(u%3600/60) + 'm ' + (u%60) + 's'); }},
    whoami:{d:'User',f:function(){ p(LS.getItem('oc_device_name') || 'opencore-user'); }},
    date:{d:'Date',f:function(){ p(new Date().toString()); }},
    time:{d:'Time',f:function(){ p(new Date().toLocaleTimeString()); }},
    systeminfo:{d:'System info',f:function(){ var m = 'N/A'; try { if(performance.memory) m = (performance.memory.usedJSHeapSize/1048576).toFixed(1) + ' MB'; } catch(e){} p('=== SYSTEM ===', 'info'); p('OS: OpencoreOS v10.4'); p('Device: ' + (LS.getItem('oc_device_name') || 'Opencore-PC')); p('CPU: ' + (navigator.hardwareConcurrency || 'N/A')); p('Memory: ' + m); p('Files: ' + VFS.count()); p('Online: ' + navigator.onLine); }},
    memory:{d:'Memory',f:function(){ try { if(performance.memory){ p('Used: ' + (performance.memory.usedJSHeapSize/1048576).toFixed(2) + ' MB'); p('Total: ' + (performance.memory.totalJSHeapSize/1048576).toFixed(2) + ' MB'); return; }} catch(e){} p('N/A'); }},
    processes:{d:'Running apps',f:function(){ p('=== PROCESSES ===', 'info'); if(!ST.windows.length) return p('None'); for(var i=0; i<ST.windows.length; i++){ var t = ST.windows[i].el.querySelector('.wt'); p('  [' + i + '] ' + (t ? t.textContent : '?')); } }},
    kill:{d:'Kill window by index',f:function(a){ var i = parseInt(a[0]); if(isNaN(i) || !ST.windows[i]) return p('Invalid index', 'err'); closeWindow(ST.windows[i].id); p('Closed', 'ok'); }},
    ver:{d:'Version',f:function(){ p('OpencoreOS v10.4'); }},
    os:{d:'OS name',f:function(){ p('OpencoreOS'); }},
    arch:{d:'Arch',f:function(){ p('x86_64'); }},
    cpu:{d:'CPU',f:function(){ p('Cores: ' + (navigator.hardwareConcurrency || 'N/A')); }},
    hostname:{d:'Hostname',f:function(){ p(LS.getItem('oc_device_name') || 'opencore-pc'); }},
    env:{d:'Env',f:function(){ p('USER=' + (LS.getItem('oc_device_name') || 'opencore-user')); p('LANG=' + (LS.getItem('oc_lang') || 'en')); p('CWD=' + cwd); }},
    shutdown:{d:'Shut down',f:function(){ if(confirm('Shut down?')) location.reload(); }},
    reboot:{d:'Reboot',f:function(){ if(confirm('Reboot?')) location.reload(); }},
    sleep:{d:'Sleep mode',f:function(){ goToSleep(); }},
    lock:{d:'Lock',f:function(){ showLogin(); }},
    pin:{d:'PIN status',f:function(){ p((LS.getItem('oc_pin') || '').length === 6 ? 'PIN is set' : 'PIN not set'); }},
    wifi:{d:'WiFi info',f:function(){ var c = navigator.connection || {}; p('Type: ' + (c.effectiveType || 'unknown')); p('Downlink: ' + (c.downlink || '?') + ' Mbps'); p('Online: ' + navigator.onLine); }},
    netinfo:{d:'Network',f:function(){ var c = navigator.connection || {}; p('Type: ' + (c.effectiveType || 'unknown')); p('RTT: ' + (c.rtt || '?') + ' ms'); p('Online: ' + navigator.onLine); }},
    bt:{d:'Bluetooth status',f:function(){ p('State: ' + (ST.btOn ? 'ON' : 'OFF')); p('Supported: ' + (navigator.bluetooth ? 'Yes' : 'No')); p('Paired: ' + (ST.btDevice ? ST.btDevice.name : 'none')); }},
    'bt on':{d:'BT ON',f:function(){ ST.btOn = true; LS.setItem('oc_bt','true'); p('Bluetooth ON', 'ok'); }},
    'bt off':{d:'BT OFF',f:function(){ ST.btOn = false; LS.setItem('oc_bt','false'); p('Bluetooth OFF', 'warn'); }},
    'bt scan':{d:'Scan BLE',f:function(){ if(!ST.btOn) return p('Turn on Bluetooth first', 'err'); if(!navigator.bluetooth) return p('Not supported', 'err'); p('Scanning...', 'info'); navigator.bluetooth.requestDevice({acceptAllDevices:true}).then(function(d){ ST.btDevice = d; p('Found: ' + (d.name || 'Unknown'), 'ok'); }).catch(function(){ p('Cancelled', 'warn'); }); }},
    ping:{d:'Ping',f:function(a){ if(!a[0]) return p('ping: need host', 'err'); p('Pinging ' + a[0] + '...', 'info'); var t = Date.now(); fetch('https://' + a[0].replace(/^https?:\/\//, ''), {mode:'no-cors'}).then(function(){ p('Reply in ' + (Date.now() - t) + 'ms', 'ok'); }).catch(function(){ p('Failed', 'err'); }); }},
    spotify:{d:'Spotify status',f:function(){ if(!window.SpotifyAuth) return p('Spotify module not loaded', 'err'); p('Logged in: ' + (SpotifyAuth.isLoggedIn() ? 'YES' : 'NO')); }},
    'spotify login':{d:'Login',f:function(){ if(!window.SpotifyAuth) return p('Open Music app first', 'err'); SpotifyAuth.login(); }},
    'spotify logout':{d:'Logout',f:function(){ if(window.SpotifyAuth) SpotifyAuth.logout(); p('Logged out', 'ok'); }},
    'spotify search':{d:'Search',f:function(a){ if(!a.length) return p('Usage: spotify search <query>', 'err'); SpotifyAuth.search(a.join(' ')).then(function(d){ if(d.tracks) d.tracks.items.slice(0,5).forEach(function(t){ p('  ' + t.name + ' - ' + t.artists[0].name); }); }).catch(function(e){ p('Error: ' + e.message, 'err'); }); }},
    wallpaper:{d:'Wallpaper',f:function(a){ if(!a[0]) return p('Usage: wallpaper reset OR <css>', 'err'); if(a[0] === 'reset'){ var d = $('dt'); if(d) d.style.background = ''; LS.removeItem('oc_wallpaper'); return p('Reset', 'ok'); } var g = a.join(' '); var d2 = $('dt'); if(d2) d2.style.background = g; LS.setItem('oc_wallpaper', g); p('Set', 'ok'); }},
    devicename:{d:'Rename device',f:function(a){ if(!a.length) return p('Current: ' + (LS.getItem('oc_device_name') || 'Opencore-PC')); var n = a.join(' '); LS.setItem('oc_device_name', n); var el = $('smn'); if(el) el.textContent = n; p('Renamed', 'ok'); }},
    echo:{d:'Echo',f:function(a){ p(a.join(' ')); }},
    calc:{d:'Calculate',f:function(a){ if(!a.length) return p('Usage: calc <expr>', 'err'); try { p('= ' + Function('"use strict";return(' + a.join(' ') + ')')()); } catch(e){ p('Error', 'err'); } }},
    base64:{d:'Base64',f:function(a){ p(btoa(a.join(' '))); }},
    reverse:{d:'Reverse',f:function(a){ p(a.join(' ').split('').reverse().join('')); }},
    random:{d:'Random',f:function(a){ p(Math.floor(Math.random() * (parseInt(a[0]) || 100)) + 1); }},
    uuid:{d:'UUID',f:function(){ p('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c){ var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); })); }},
    weather:{d:'Weather',f:function(){ if(!navigator.geolocation) return p('No geolocation'); navigator.geolocation.getCurrentPosition(function(pos){ fetch('https://api.open-meteo.com/v1/forecast?latitude=' + pos.coords.latitude + '&longitude=' + pos.coords.longitude + '&current_weather=true').then(function(r){ return r.json(); }).then(function(d){ p('Weather: ' + d.current_weather.temperature.toFixed(1) + 'C'); }).catch(function(e){ p(e.message, 'err'); }); }); }},
    diagnostic:{d:'Diagnostics',f:function(){ p('=== DIAG ===', 'info'); try { if(VFS.root && VFS.root.type === 'folder') p('VFS OK', 'ok'); else p('VFS corrupt', 'err'); } catch(e){ p('VFS error', 'err'); } try { LS.getItem('x'); p('Storage OK', 'ok'); } catch(e){ p('Storage error', 'err'); } p(ST.windows.length + ' windows open'); }},
    health:{d:'Health',f:function(){ p('=== HEALTH ===', 'info'); try { var r = VFS.root; p(r && r.type === 'folder' ? 'Healthy' : 'Issues', 'ok'); } catch(e){ p('Error', 'err'); } }},
    sys32:{d:'List System32',f:function(){ p('=== SYSTEM32 ===', 'warn'); var l = VFS.list('/System32') || []; for(var i=0; i<l.length; i++) p((l[i].type === 'folder' ? '📁 ' : '📄 ') + l[i].name); }},
    vfs:{d:'VFS info',f:function(){ p('Files: ' + VFS.count()); p('Size: ' + VFS.size() + ' bytes'); }},
    apps:{d:'List apps',f:function(){ p('files, terminal, notepad, calculator, browser, music, camera, microphone, audioplayer, wallpaper, weather, clock, calendar, sysinfo, appstore, recovery, kernel0, videohub, vapor, science, infinity, settings'); }},
    recovery:{d:'Enter recovery mode',f:function(){ p('Recovery mode active. Type "restore-system" to reinstall system files.', 'info'); }},
    'restore-system':{d:'Restore system files',f:function(){ VFS.restoreSystem32(); p('System files restored', 'ok'); }},
    cowsay:{d:'Cow',f:function(a){ var t = a.join(' ') || 'Moo!'; p(' ' + '_'.repeat(t.length + 2)); p('< ' + t + ' >'); p(' ' + '-'.repeat(t.length + 2)); p('        \\   ^__^'); p('         \\  (oo)\\_______'); p('            (__)\\       )\\/\\'); p('                ||----w |'); p('                ||     ||'); }},
    fortune:{d:'Quote',f:function(){ var q = ['The best way to predict the future is to invent it.', 'Simplicity is the soul of efficiency.']; p(q[Math.floor(Math.random() * q.length)]); }},
    '8ball':{d:'8-ball',f:function(){ var a = ['Yes','No','Maybe','Definitely','Ask later','Never']; p(a[Math.floor(Math.random() * a.length)]); }},
    joke:{d:'Joke',f:function(){ var j = ['Why do programmers prefer dark mode? Light attracts bugs!']; p(j[Math.floor(Math.random() * j.length)]); }},
    matrix:{d:'Matrix',f:function(){ for(var i=0; i<5; i++){ var l = ''; for(var j=0; j<50; j++) l += Math.random() > 0.5 ? '1' : '0'; p(l, 'ok'); } }},
    ascii:{d:'ASCII art',f:function(){ p('  ___  ____  ____  _   _  ____'); p(' / _ \\|  _ \\|  _ \\| \\ | ||  __|'); p('| | | | |_) | |_) |  \\| || |__ '); p('| |_| |  __/|  __/| |\\  ||  __|'); p(' \\___/|_|   |_|   |_| \\_||____|'); }}
  };

  function exec(cmd){
    var parts = cmd.trim().split(/\s+/);
    p('$ ' + cmd, 'warn');
    var two = parts.slice(0,2).join(' ');
    if(cmds[two]){ cmds[two].f(parts.slice(2)); return; }
    if(cmds[parts[0]]){ cmds[parts[0]].f(parts.slice(1)); return; }
    p('command not found: ' + parts[0] + '. Type "help".', 'err');
  }

  inp.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ var c = inp.value; inp.value = ''; if(c.trim()) exec(c); }
  });
  inp.focus();
  win.onclick = function(){ inp.focus(); };
  p('OpencoreOS Terminal v10.4', 'ok');
  p('Type "help" for commands', 'info');
}

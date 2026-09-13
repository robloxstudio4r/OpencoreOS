// ============================================================
//  terminal.js — OpencoreOS Terminal
//  Commands: help, clear, ls, cd, cat, mkdir, rm, touch, echo,
//            whoami, date, ver, exit, backup, restore
// ============================================================

function openTerminal(){
  var win = makeWindow('terminal', 'Terminal', '💻',
    '<div id="term-app" style="display:flex;flex-direction:column;height:100%;background:#0c0c0c;color:#ddd;font-family:Consolas,Menlo,monospace;font-size:13px;">'
    + '<div id="term-out" style="flex:1;overflow-y:auto;padding:10px;white-space:pre-wrap;"></div>'
    + '<div style="display:flex;border-top:1px solid #222;padding:6px 10px;">'
    + '<span style="color:#1db954;margin-right:6px;">$</span>'
    + '<input id="term-in" type="text" autocomplete="off" spellcheck="false" '
    + 'style="flex:1;background:transparent;border:none;color:#fff;outline:none;font-family:inherit;font-size:inherit;"/>'
    + '</div></div>', 640, 420);

  var c = win.querySelector('#term-app');
  var out = c.querySelector('#term-out');
  var inp = c.querySelector('#term-in');

  var cwd = '/';
  var history = [];
  var histIdx = -1;

  function print(s){
    if (s === undefined || s === null) s = '';
    out.textContent += s + '\n';
    out.scrollTop = out.scrollHeight;
  }

  // Expose a printer object so backup.js can print into this terminal
  var term = {
    print: print,
    clear: function(){ out.textContent = ''; }
  };

  function promptPath(){
    return cwd === '/' ? '/' : cwd;
  }

  var CMDS = {
    help: function(){
      print('Available commands:');
      print('  help              Show this help');
      print('  clear             Clear the screen');
      print('  ls [path]         List files');
      print('  cd <path>         Change directory');
      print('  cat <file>        Print file contents');
      print('  mkdir <name>      Create a folder');
      print('  touch <name>      Create an empty file');
      print('  rm <name>         Delete a file/folder');
      print('  echo <text>       Print text');
      print('  whoami            Current user');
      print('  date              Current date/time');
      print('  ver               OS version');
      print('  exit              Close terminal');
      print('');
      print('Backup / Restore:');
      print('  backup            Download a full system backup (.ocbackup)');
      print('  restore           Choose a .ocbackup file and restore it');
    },

    clear: function(){ out.textContent = ''; },

    ls: function(args){
      var p = args[0] || cwd;
      try {
        var list = (window.VFS && VFS.list) ? VFS.list(p) : [];
        if (!list || !list.length) { print('(empty)'); return; }
        for (var i=0; i<list.length; i++){
          var f = list[i];
          print((f.isDir ? 'd ' : '- ') + f.name + (f.isDir ? '/' : ''));
        }
      } catch (e) { print('ls error: ' + e.message); }
    },

    cd: function(args){
      var p = args[0];
      if (!p || p === '~') { cwd = '/'; return; }
      if (p === '..') { cwd = cwd.replace(/\/[^\/]+\/?$/, '') || '/'; return; }
      if (p === '/') { cwd = '/'; return; }
      var target = p.charAt(0) === '/' ? p : (cwd === '/' ? '/' + p : cwd + '/' + p);
      try {
        var list = (window.VFS && VFS.list) ? VFS.list(target) : null;
        if (list) cwd = target;
        else print('cd: no such directory: ' + target);
      } catch (e) { print('cd error: ' + e.message); }
    },

    cat: function(args){
      if (!args[0]) { print('usage: cat <file>'); return; }
      try {
        var path = args[0].charAt(0) === '/' ? args[0] : (cwd === '/' ? '/' + args[0] : cwd + '/' + args[0]);
        var content = (window.VFS && VFS.read) ? VFS.read(path) : null;
        if (content === null || content === undefined) { print('cat: no such file'); return; }
        print(content);
      } catch (e) { print('cat error: ' + e.message); }
    },

    mkdir: function(args){
      if (!args[0]) { print('usage: mkdir <name>'); return; }
      try {
        var path = args[0].charAt(0) === '/' ? args[0] : (cwd === '/' ? '/' + args[0] : cwd + '/' + args[0]);
        if (window.VFS && VFS.mkdir) VFS.mkdir(path);
        else print('VFS not available');
      } catch (e) { print('mkdir error: ' + e.message); }
    },

    touch: function(args){
      if (!args[0]) { print('usage: touch <name>'); return; }
      try {
        var path = args[0].charAt(0) === '/' ? args[0] : (cwd === '/' ? '/' + args[0] : cwd + '/' + args[0]);
        if (window.VFS && VFS.write) VFS.write(path, '');
        else print('VFS not available');
      } catch (e) { print('touch error: ' + e.message); }
    },

    rm: function(args){
      if (!args[0]) { print('usage: rm <name>'); return; }
      try {
        var path = args[0].charAt(0) === '/' ? args[0] : (cwd === '/' ? '/' + args[0] : cwd + '/' + args[0]);
        if (window.VFS && VFS.remove) VFS.remove(path);
        else print('VFS not available');
      } catch (e) { print('rm error: ' + e.message); }
    },

    echo: function(args){ print(args.join(' ')); },

    whoami: function(){ print('opencore-user'); },

    date:   function(){ print(new Date().toLocaleString()); },

    ver:    function(){ print('OpencoreOS v10.4'); },

    exit:   function(){
      print('Goodbye.');
      setTimeout(function(){ if (win && win.remove) win.remove(); }, 300);
    },

    // ----- Backup -----
    backup: function(){
      if (!window.OpencoreBackup) { print('✗ Backup module not loaded'); return; }
      window.OpencoreBackup.runBackup(term);
    },

    // ----- Restore -----
    restore: function(){
      if (!window.OpencoreBackup) { print('✗ Backup module not loaded'); return; }
      window.OpencoreBackup.runRestore(term);
    }
  };

  function run(line){
    line = line.trim();
    if (!line) return;
    history.push(line);
    histIdx = history.length;

    var parts = line.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    var cmd = parts[0];
    var args = parts.slice(1).map(function(s){ return s.replace(/^"|"$/g, ''); });

    if (CMDS[cmd]) {
      try { CMDS[cmd](args); }
      catch (e) { print('Error: ' + e.message); }
    } else {
      print('Unknown command: ' + cmd + '  (type "help")');
    }
  }

  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var v = inp.value;
      print(promptPath() + ' $ ' + v);
      inp.value = '';
      run(v);
    } else if (e.key === 'ArrowUp') {
      if (histIdx > 0) { histIdx--; inp.value = history[histIdx] || ''; }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (histIdx < history.length - 1) { histIdx++; inp.value = history[histIdx] || ''; }
      else { histIdx = history.length; inp.value = ''; }
      e.preventDefault();
    }
  });

  print('OpencoreOS Terminal v10.4');
  print('Type "help" for commands, or "backup" / "restore".');
  print('');
  inp.focus();

  return win;
}

function openRecovery(){
  var html = '<p style="color:#888;font-size:12px;margin-bottom:14px;">Restore missing or broken system files.</p>'
    + '<button id="rec-restore-sys" style="width:100%;padding:10px;background:#0078d4;border:none;color:#fff;border-radius:6px;cursor:pointer;margin-bottom:8px;font-size:13px;">Restore System32 Files</button>'
    + '<button id="rec-restore-folders" style="width:100%;padding:10px;background:rgba(255,255,255,0.06);color:#ccc;border:none;border-radius:6px;cursor:pointer;margin-bottom:8px;font-size:13px;">Restore Core Folders</button>'
    + '<button id="rec-reset-icons" style="width:100%;padding:10px;background:rgba(255,255,255,0.06);color:#ccc;border:none;border-radius:6px;cursor:pointer;margin-bottom:8px;font-size:13px;">Reset Desktop Icons</button>'
    + '<button id="rec-restore-apps" style="width:100%;padding:10px;background:rgba(255,255,255,0.06);color:#ccc;border:none;border-radius:6px;cursor:pointer;margin-bottom:8px;font-size:13px;">Reinstall System Apps</button>'
    + '<button id="rec-full-reset" style="width:100%;padding:10px;background:#d43a3a;border:none;color:#fff;border-radius:6px;cursor:pointer;margin-bottom:8px;font-size:13px;">Full Reset (Wipes Everything)</button>'
    + '<div id="rec-status" style="margin-top:14px;color:#51cf66;font-size:12px;min-height:20px;"></div>';
  var win = makeWindow('recovery', 'Recovery', '🛠️', html, 400, 380);
  var status = win.querySelector('#rec-status');
  win.querySelector('#rec-restore-sys').onclick = function(){ VFS.restoreSystem32(); status.textContent = '✓ System32 restored'; };
  win.querySelector('#rec-restore-folders').onclick = function(){
    var f = ['Documents','Pictures','Audio'];
    for(var i=0; i<f.length; i++) if(!VFS.root.children[f[i]]) VFS.root.children[f[i]] = {type:'folder', children:{}};
    VFS.save();
    status.textContent = '✓ Core folders restored';
  };
  win.querySelector('#rec-reset-icons').onclick = function(){
    icons = JSON.parse(JSON.stringify(DEFAULT_ICONS));
    saveIcons(); renderDesktop();
    status.textContent = '✓ Icons reset';
  };
  win.querySelector('#rec-restore-apps').onclick = function(){
    VFS.restoreSystem32();
    var f = ['Documents','Pictures','Audio'];
    for(var i=0; i<f.length; i++) if(!VFS.root.children[f[i]]) VFS.root.children[f[i]] = {type:'folder', children:{}};
    VFS.save();
    icons = JSON.parse(JSON.stringify(DEFAULT_ICONS));
    saveIcons(); renderDesktop();
    status.textContent = '✓ All system apps and files restored';
  };
  win.querySelector('#rec-full-reset').onclick = function(){
    if(confirm('Wipe everything and reset OpencoreOS?')){
      if(confirm('Are you absolutely sure?')){
        LS.clear();
        location.reload();
      }
    }
  };
}

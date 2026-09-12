function openAppStore(){
  var apps = [
    {id:'kernel0', name:'Kernel0', icon:'🧠', desc:'AI assistant'},
    {id:'videohub', name:'VideoHub', icon:'🎬', desc:'Video platform'},
    {id:'vapor', name:'Vapor', icon:'💨', desc:'Vapor app'},
    {id:'science', name:'Science', icon:'🔬', desc:'Fastly Science'},
    {id:'infinity', name:'Infinity Drink', icon:'🥤', desc:'Drink ordering'},
    {id:'music', name:'Spotify', icon:'🎵', desc:'Music streaming'},
    {id:'browser', name:'Browser', icon:'🌐', desc:'Web browser'},
    {id:'camera', name:'Camera', icon:'📷', desc:'Take photos'},
    {id:'microphone', name:'Microphone', icon:'🎤', desc:'Record audio'},
    {id:'recovery', name:'Recovery', icon:'🛠️', desc:'Restore system files'}
  ];
  var html = '<p style="color:#888;font-size:12px;margin-bottom:14px;">Apps load in an in-OS window.</p>';
  for(var i=0; i<apps.length; i++){
    var a = apps[i];
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid rgba(255,255,255,0.06);margin-bottom:8px;">'
      + '<div style="display:flex;align-items:center;gap:12px;">'
      + '<span style="font-size:28px;">' + a.icon + '</span>'
      + '<div><div style="font-weight:600;color:#eee;font-size:14px;">' + a.name + '</div>'
      + '<div style="color:#777;font-size:12px;">' + a.desc + '</div></div></div>'
      + '<button class="launch-app" data-app-id="' + a.id + '" style="background:#0078d4;border:none;color:#fff;padding:6px 18px;border-radius:6px;cursor:pointer;font-weight:500;font-size:12px;">Launch</button>'
      + '</div>';
  }
  var win = makeWindow('appstore', 'App Store', '🛒', html, 520, 520);
  var btns = win.querySelectorAll('.launch-app');
  for(var j=0; j<btns.length; j++){
    (function(b){ b.onclick = function(){ launch(b.getAttribute('data-app-id')); }; })(btns[j]);
  }
}

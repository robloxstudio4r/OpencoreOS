var DEFAULT_ICONS = [
  {id:'system32', name:'System32', icon:'⚙️', x:0, y:0},
  {id:'files', name:'Files', icon:'📁', x:0, y:1},
  {id:'terminal', name:'Terminal', icon:'💻', x:0, y:2},
  {id:'notepad', name:'Notepad', icon:'📝', x:0, y:3},
  {id:'calculator', name:'Calculator', icon:'🧮', x:0, y:4},
  {id:'browser', name:'Browser', icon:'🌐', x:0, y:5},
  {id:'music', name:'Spotify', icon:'🎵', x:0, y:6},
  {id:'camera', name:'Camera', icon:'📷', x:1, y:0},
  {id:'microphone', name:'Mic', icon:'🎤', x:1, y:1},
  {id:'audioplayer', name:'Audio', icon:'🔊', x:1, y:2},
  {id:'wallpaper', name:'Wallpaper', icon:'🖼️', x:1, y:3},
  {id:'weather', name:'Weather', icon:'🌤️', x:1, y:4},
  {id:'clock', name:'Clock', icon:'🕐', x:1, y:5},
  {id:'calendar', name:'Calendar', icon:'📅', x:1, y:6},
  {id:'sysinfo', name:'System', icon:'ℹ️', x:2, y:0},
  {id:'appstore', name:'App Store', icon:'🛒', x:2, y:1},
  {id:'recovery', name:'Recovery', icon:'🛠️', x:2, y:2},
  {id:'kernel0', name:'Kernel0', icon:'🧠', x:2, y:3},
  {id:'videohub', name:'VideoHub', icon:'🎬', x:2, y:4},
  {id:'vapor', name:'Vapor', icon:'💨', x:2, y:5},
  {id:'science', name:'Science', icon:'🔬', x:2, y:6},
  {id:'infinity', name:'Infinity Drink', icon:'🥤', x:3, y:0},
  {id:'settings', name:'Settings', icon:'⚙️', x:3, y:1}
];

var icons = [];

function loadIcons(){
  try {
    var saved = LS.getItem('oc_icons_v1');
    if(saved){
      icons = JSON.parse(saved);
      for(var i=0; i<DEFAULT_ICONS.length; i++){
        var found = false;
        for(var j=0; j<icons.length; j++){ if(icons[j].id === DEFAULT_ICONS[i].id){ found = true; break; } }
        if(!found) icons.push(JSON.parse(JSON.stringify(DEFAULT_ICONS[i])));
      }
    } else icons = JSON.parse(JSON.stringify(DEFAULT_ICONS));
  } catch(e){ icons = JSON.parse(JSON.stringify(DEFAULT_ICONS)); }
}

function saveIcons(){ try { LS.setItem('oc_icons_v1', JSON.stringify(icons)); } catch(e){} }

var ICON_W = 80, ICON_H = 90, ICON_PAD = 10, ICON_TOP_PAD = 8, ICON_LEFT_PAD = 8;

function positionToXY(pos){ return { x: ICON_LEFT_PAD + pos.x * (ICON_W + ICON_PAD), y: ICON_TOP_PAD + pos.y * (ICON_H + ICON_PAD) }; }
function xyToPosition(x, y){ return { x: Math.round((x - ICON_LEFT_PAD) / (ICON_W + ICON_PAD)), y: Math.round((y - ICON_TOP_PAD) / (ICON_H + ICON_PAD)) }; }

function renderDesktop(){
  var dt = $('dt'); if(!dt) return;
  dt.innerHTML = '';
  for(var i=0; i<icons.length; i++){
    if(icons[i].removed) continue;
    var icon = icons[i];
    var pos = positionToXY(icon);
    var btn = document.createElement('button');
    btn.className = 'di';
    btn.style.left = pos.x + 'px';
    btn.style.top = pos.y + 'px';
    btn.innerHTML = '<span class="ic">' + icon.icon + '</span><span class="lb">' + icon.name + '</span>';
    attachIconHandlers(btn, icon);
    dt.appendChild(btn);
  }
}

function attachIconHandlers(btn, icon){
  var holdTimer = null, holdFired = false, dragMode = false, moved = false;
  var startX = 0, startY = 0, startLeft = 0, startTop = 0;

  btn.onmousedown = function(e){
    if(e.button !== 0) return;
    e.preventDefault();
    var rect = btn.getBoundingClientRect();
    startX = e.clientX; startY = e.clientY;
    startLeft = rect.left; startTop = rect.top;
    moved = false; holdFired = false;
    holdTimer = setTimeout(function(){
      holdFired = true;
      dragMode = false;
      openAppEditor(icon, e.clientX, e.clientY);
    }, 650);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  function onMove(e){
    var dx = e.clientX - startX, dy = e.clientY - startY;
    if(!moved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)){
      moved = true;
      if(!holdFired){ clearTimeout(holdTimer); dragMode = true; btn.classList.add('dragging'); }
    }
    if(dragMode){ btn.style.left = (startLeft + dx) + 'px'; btn.style.top = (startTop + dy) + 'px'; }
  }

  function onUp(){
    clearTimeout(holdTimer);
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    if(dragMode){
      btn.classList.remove('dragging');
      var dtRect = $('dt').getBoundingClientRect();
      var newLeft = parseFloat(btn.style.left) - dtRect.left;
      var newTop = parseFloat(btn.style.top) - dtRect.top;
      var newPos = xyToPosition(newLeft, newTop);
      var dt2 = $('dt');
      var cols = Math.max(1, Math.floor((dt2.clientWidth - ICON_LEFT_PAD) / (ICON_W + ICON_PAD)));
      var rows = Math.max(1, Math.floor((dt2.clientHeight - ICON_TOP_PAD) / (ICON_H + ICON_PAD)));
      newPos.x = Math.max(0, Math.min(cols - 1, newPos.x));
      newPos.y = Math.max(0, Math.min(rows - 1, newPos.y));
      icon.x = newPos.x; icon.y = newPos.y;
      saveIcons(); renderDesktop();
      dragMode = false;
    } else if(!holdFired && !moved){ launch(icon.id); }
  }
}

var editorTargetIcon = null;

function openAppEditor(icon, mx, my){
  editorTargetIcon = icon;
  var ed = $('appEditor');
  $('ae-name').value = icon.name;
  ed.style.left = Math.min(window.innerWidth - 300, mx) + 'px';
  ed.style.top = Math.min(window.innerHeight - 200, my) + 'px';
  ed.classList.add('on');
  setTimeout(function(){ $('ae-name').focus(); }, 50);
}
function closeAppEditor(){ var ed = $('appEditor'); if(ed) ed.classList.remove('on'); editorTargetIcon = null; }

function initAppEditorButtons(){
  var save = $('ae-save');
  if(save) save.onclick = function(){
    if(editorTargetIcon){
      var newName = $('ae-name').value.trim();
      if(newName) editorTargetIcon.name = newName;
      saveIcons(); renderDesktop();
    }
    closeAppEditor();
  };
  var rem = $('ae-remove');
  if(rem) rem.onclick = function(){
    if(editorTargetIcon){
      if(confirm('Remove "' + editorTargetIcon.name + '" from home screen?\n\nIt will still appear in the Start menu.')){
        editorTargetIcon.removed = true;
        saveIcons(); renderDesktop();
      }
    }
    closeAppEditor();
  };
  var can = $('ae-cancel');
  if(can) can.onclick = closeAppEditor;

  document.addEventListener('mousedown', function(e){
    var ed = $('appEditor');
    if(ed && ed.classList.contains('on')){
      if(!ed.contains(e.target) && !e.target.closest('.di')) closeAppEditor();
    }
  });
}

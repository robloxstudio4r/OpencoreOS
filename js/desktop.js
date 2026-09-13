// ============================================================
//  desktop.js — Desktop icons, drag/drop, App Lock + Trash hooks
//  Custom icons from Extensions apply on every render.
//  Remove from desktop keeps the app in a restore list.
// ============================================================

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
  {id:'extstore', name:'Extensions', icon:'🧩', x:2, y:2},
  {id:'kernel0', name:'Kernel0', icon:'🧠', x:2, y:3},
  {id:'videohub', name:'VideoHub', icon:'🎬', x:2, y:4},
  {id:'photoeditor', name:'Photo Editor', icon:'🎨', x:2, y:5},
  {id:'vapor', name:'Vapor', icon:'💨', x:2, y:6},
  {id:'science', name:'Science', icon:'🔬', x:3, y:0},
  {id:'infinity', name:'Infinity Drink', icon:'🥤', x:3, y:1},
  {id:'settings', name:'Settings', icon:'⚙️', x:3, y:2},
  {id:'checklist', name:'Checklist', icon:'✅', x:3, y:3}
];

var icons = [];

function loadIcons(){
  try {
    var saved = LS.getItem('oc_icons_v1');
    if(saved){
      icons = JSON.parse(saved);
      // Add any new default icons the user hasn't seen
      for(var i=0; i<DEFAULT_ICONS.length; i++){
        var found = false;
        for(var j=0; j<icons.length; j++){ if(icons[j].id === DEFAULT_ICONS[i].id){ found = true; break; } }
        if(!found) icons.push(JSON.parse(JSON.stringify(DEFAULT_ICONS[i])));
      }
    } else icons = JSON.parse(JSON.stringify(DEFAULT_ICONS));
  } catch(e){ icons = JSON.parse(JSON.stringify(DEFAULT_ICONS)); }

  // Remove Recovery from any existing icon list (feature is now hidden)
  icons = icons.filter(function (ic) { return ic.id !== 'recovery'; });
}

function saveIcons(){ try { LS.setItem('oc_icons_v1', JSON.stringify(icons)); } catch(e){} }

// ---- Find an icon entry (including removed ones) ----
function findIconEntry(appId) {
  for (var i = 0; i < icons.length; i++) {
    if (icons[i].id === appId) return icons[i];
  }
  return null;
}

// ---- Public helper used by app editor to restore to desktop ----
function addAppToDesktop(appId) {
  var entry = findIconEntry(appId);
  if (entry) {
    entry.removed = false;
    // If it had no position, give it a fresh one
    if (typeof entry.x !== 'number' || typeof entry.y !== 'number') {
      var pos = findFreeSlot();
      entry.x = pos.x;
      entry.y = pos.y;
    }
  } else {
    // Was never in the list — pull from DEFAULT_ICONS
    for (var i = 0; i < DEFAULT_ICONS.length; i++) {
      if (DEFAULT_ICONS[i].id === appId) {
        var clone = JSON.parse(JSON.stringify(DEFAULT_ICONS[i]));
        clone.removed = false;
        icons.push(clone);
        entry = clone;
        break;
      }
    }
  }
  saveIcons();
  renderDesktop();
  return !!entry;
}

function findFreeSlot() {
  var dt = document.getElementById('dt');
  var cols = dt ? Math.max(1, Math.floor((dt.clientWidth - ICON_LEFT_PAD) / (ICON_W + ICON_PAD))) : 4;
  var rows = dt ? Math.max(1, Math.floor((dt.clientHeight - ICON_TOP_PAD) / (ICON_H + ICON_PAD))) : 6;
  // Find first free slot
  for (var y = 0; y < rows; y++) {
    for (var x = 0; x < cols; x++) {
      var taken = false;
      for (var i = 0; i < icons.length; i++) {
        if (!icons[i].removed && icons[i].x === x && icons[i].y === y) { taken = true; break; }
      }
      if (!taken) return { x: x, y: y };
    }
  }
  // Fallback: append
  return { x: 0, y: rows };
}

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

    var customIcon = '';
    if (window.Extensions && typeof window.Extensions.getIconOverride === 'function') {
      customIcon = window.Extensions.getIconOverride(icon.id);
    }

    var btn = document.createElement('button');
    btn.className = 'di';
    btn.style.left = pos.x + 'px';
    btn.style.top = pos.y + 'px';
    btn.setAttribute('data-app', icon.id);

    var iconHTML;
    if (customIcon && customIcon.indexOf('data:image') === 0) {
      iconHTML = '<span class="ic"><img src="' + customIcon + '" style="width:42px;height:42px;object-fit:contain;vertical-align:middle;"/></span>';
    } else if (customIcon) {
      iconHTML = '<span class="ic">' + customIcon + '</span>';
    } else {
      iconHTML = '<span class="ic">' + icon.icon + '</span>';
    }
    btn.innerHTML = iconHTML + '<span class="lb">' + icon.name + '</span>';

    if (window.AppLock && window.AppLock.isLocked && window.AppLock.isLocked(icon.id)) {
      var lockBadge = document.createElement('span');
      lockBadge.textContent = '🔒';
      lockBadge.style.cssText =
        'position:absolute;top:2px;right:6px;font-size:14px;' +
        'background:rgba(0,0,0,0.6);border-radius:50%;padding:2px 4px;';
      btn.appendChild(lockBadge);
    }

    if (window.AppTrash && window.AppTrash.isTrashed && window.AppTrash.isTrashed(icon.id)) {
      btn.style.display = 'none';
    }

    attachIconHandlers(btn, icon);

    if (window.AppLock && window.AppLock.attachLongPress) {
      window.AppLock.attachLongPress(btn, icon.id, {
        onRename: function (el, appId) {
          openAppEditor(icon, el.getBoundingClientRect().left, el.getBoundingClientRect().top);
        }
      });
    }

    btn.setAttribute('draggable', 'true');
    btn.addEventListener('dragstart', function (e) {
      try { e.dataTransfer.setData('text/app-id', icon.id); } catch (x) {}
      try { e.dataTransfer.effectAllowed = 'move'; } catch (x) {}
    });

    dt.appendChild(btn);
  }

  if (window.AppTrash && typeof window.AppTrash.hookIcons === 'function') {
    window.AppTrash.hookIcons();
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
      if (!window.AppLock || !window.AppLock.attachLongPress) {
        openAppEditor(icon, e.clientX, e.clientY);
      }
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
    } else if(!holdFired && !moved){
      launch(icon.id);
    }
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
      if(confirm('Remove "' + editorTargetIcon.name + '" from home screen?\n\nIt will still appear in the Start menu. You can add it back by right-clicking its Start menu entry and choosing "Add to desktop".')) {
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

  // ---- Right-click on Start menu items to add back to desktop ----
  document.addEventListener('contextmenu', function (e) {
    var mi = e.target.closest && e.target.closest('.smi[data-a]');
    if (!mi) return;
    e.preventDefault();
    var appId = mi.getAttribute('data-a');
    if (!appId) return;

    var menu = document.createElement('div');
    menu.style.cssText =
      'position:fixed;z-index:2147483647;min-width:200px;background:#1a1c22;color:#fff;' +
      'border:1px solid rgba(255,255,255,0.12);border-radius:8px;' +
      'box-shadow:0 12px 40px rgba(0,0,0,0.55);font-family:system-ui,sans-serif;' +
      'font-size:13px;padding:6px 0;left:' + e.clientX + 'px;top:' + e.clientY + 'px;';
    menu.onclick = function (ev) { ev.stopPropagation(); };

    function item(label, fn, danger) {
      var row = document.createElement('div');
      row.textContent = label;
      row.style.cssText = 'padding:8px 14px;cursor:pointer;' + (danger ? 'color:#ff8a8a;' : '');
      row.onmouseenter = function () { row.style.background = 'rgba(255,255,255,0.06)'; };
      row.onmouseleave = function () { row.style.background = ''; };
      row.onclick = function () { closeCtx(); fn(); };
      menu.appendChild(row);
    }
    function closeCtx() {
      if (menu.parentNode) menu.parentNode.removeChild(menu);
      document.removeEventListener('click', closeCtx);
    }

    var entry = findIconEntry(appId);
    var isOnDesktop = entry && !entry.removed;

    if (isOnDesktop) {
      item('🚫 Remove from desktop', function () {
        if (!confirm('Remove "' + (entry.name || appId) + '" from the home screen?\n\nIt will still appear in the Start menu.')) return;
        entry.removed = true;
        saveIcons();
        renderDesktop();
      }, true);
    } else {
      item('➕ Add to desktop', function () {
        if (!addAppToDesktop(appId)) {
          alert('Could not add this app to the desktop.');
        }
      });
    }

    document.body.appendChild(menu);
    setTimeout(function () { document.addEventListener('click', closeCtx, { once: true }); }, 10);
  });
}

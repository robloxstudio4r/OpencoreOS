// ============================================================
//  desktop.js — Desktop icons, drag/drop, App Lock + Trash hooks
//  Custom icons from Extensions apply on every render.
//  Remove from desktop + Add back to desktop both supported.
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
      // Add any new default icons the user hasn't seen yet
      for(var i=0; i<DEFAULT_ICONS.length; i++){
        var found = false;
        for(var j=0; j<icons.length; j++){
          if(icons[j].id === DEFAULT_ICONS[i].id){ found = true; break; }
        }
        if(!found) {
          icons.push(JSON.parse(JSON.stringify(DEFAULT_ICONS[i])));
        }
      }
    } else {
      icons = JSON.parse(JSON.stringify(DEFAULT_ICONS));
    }
  } catch(e){
    icons = JSON.parse(JSON.stringify(DEFAULT_ICONS));
  }

  // Remove Recovery from any existing icon list (feature is hidden)
  icons = icons.filter(function (ic) { return ic.id !== 'recovery'; });

  // Ensure every icon has a valid position (fixes icons stuck off-screen)
  ensureValidPositions();
}

// ---- Ensure every visible icon has a valid grid position ----
function ensureValidPositions() {
  var used = {};
  // First pass: mark all taken slots by icons that already have valid positions
  for (var i = 0; i < icons.length; i++) {
    var ic = icons[i];
    if (ic.removed) continue;
    if (typeof ic.x !== 'number' || typeof ic.y !== 'number' || ic.x < 0 || ic.y < 0) continue;
    var key = ic.x + ',' + ic.y;
    if (used[key]) {
      // Collision — mark this one as needing reassignment
      ic._needsSlot = true;
    } else {
      used[key] = true;
    }
  }
  // Second pass: assign free slots to anything missing or collided
  for (var k = 0; k < icons.length; k++) {
    var icon = icons[k];
    if (icon.removed) continue;
    var invalid = (typeof icon.x !== 'number' || typeof icon.y !== 'number' || icon.x < 0 || icon.y < 0 || icon._needsSlot);
    if (!invalid) continue;
    // Find first free slot
    for (var y = 0; y < 20; y++) {
      var placed = false;
      for (var x = 0; x < 4; x++) {
        var key2 = x + ',' + y;
        if (!used[key2]) {
          icon.x = x;
          icon.y = y;
          used[key2] = true;
          delete icon._needsSlot;
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }
  saveIcons();
}

function saveIcons(){ try { LS.setItem('oc_icons_v1', JSON.stringify(icons)); } catch(e){} }

// ---- Icon lookup helpers ----
function findIconEntry(appId) {
  for (var i = 0; i < icons.length; i++) {
    if (icons[i].id === appId) return icons[i];
  }
  return null;
}

var ICON_W = 80, ICON_H = 90, ICON_PAD = 10, ICON_TOP_PAD = 8, ICON_LEFT_PAD = 8;

function positionToXY(pos){
  return {
    x: ICON_LEFT_PAD + pos.x * (ICON_W + ICON_PAD),
    y: ICON_TOP_PAD + pos.y * (ICON_H + ICON_PAD)
  };
}
function xyToPosition(x, y){
  return {
    x: Math.round((x - ICON_LEFT_PAD) / (ICON_W + ICON_PAD)),
    y: Math.round((y - ICON_TOP_PAD) / (ICON_H + ICON_PAD))
  };
}

function findFreeSlot() {
  var dt = document.getElementById('dt');
  var cols = dt ? Math.max(1, Math.floor((dt.clientWidth - ICON_LEFT_PAD) / (ICON_W + ICON_PAD))) : 4;
  var rows = dt ? Math.max(1, Math.floor((dt.clientHeight - ICON_TOP_PAD) / (ICON_H + ICON_PAD))) : 8;
  for (var y = 0; y < rows + 2; y++) {
    for (var x = 0; x < cols; x++) {
      var taken = false;
      for (var i = 0; i < icons.length; i++) {
        if (!icons[i].removed && icons[i].x === x && icons[i].y === y) { taken = true; break; }
      }
      if (!taken) return { x: x, y: y };
    }
  }
  return { x: 0, y: rows + 2 };
}

// ---- Add app back to desktop ----
function addAppToDesktop(appId) {
  var entry = findIconEntry(appId);
  if (entry) {
    entry.removed = false;
    // Make sure it has a valid position
    if (typeof entry.x !== 'number' || typeof entry.y !== 'number' || entry.x < 0 || entry.y < 0) {
      var pos = findFreeSlot();
      entry.x = pos.x;
      entry.y = pos.y;
    }
  } else {
    // Look in DEFAULT_ICONS
    for (var i = 0; i < DEFAULT_ICONS.length; i++) {
      if (DEFAULT_ICONS[i].id === appId) {
        var clone = JSON.parse(JSON.stringify(DEFAULT_ICONS[i]));
        clone.removed = false;
        var free = findFreeSlot();
        clone.x = free.x;
        clone.y = free.y;
        icons.push(clone);
        entry = clone;
        break;
      }
    }
  }
  if (!entry) return false;

  saveIcons();
  renderDesktop();
  return true;
}

// ---- Remove app from desktop ----
function removeAppFromDesktop(appId) {
  var entry = findIconEntry(appId);
  if (!entry) return false;
  entry.removed = true;
  saveIcons();
  renderDesktop();
  return true;
}

// ---- Render desktop ----
function renderDesktop(){
  var dt = $('dt'); if(!dt) return;
  dt.innerHTML = '';

  for(var i=0; i<icons.length; i++){
    if(icons[i].removed) continue;
    var icon = icons[i];

    // Skip if the icon position is invalid
    if (typeof icon.x !== 'number' || typeof icon.y !== 'number' || icon.x < 0 || icon.y < 0) continue;

    var pos = positionToXY(icon);

    // Custom icon from Extensions
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

    // Lock badge
    if (window.AppLock && window.AppLock.isLocked && window.AppLock.isLocked(icon.id)) {
      var lockBadge = document.createElement('span');
      lockBadge.textContent = '🔒';
      lockBadge.style.cssText =
        'position:absolute;top:2px;right:6px;font-size:14px;' +
        'background:rgba(0,0,0,0.6);border-radius:50%;padding:2px 4px;';
      btn.appendChild(lockBadge);
    }

    // Hide if the app is in the trash
    if (window.AppTrash && window.AppTrash.isTrashed && window.AppTrash.isTrashed(icon.id)) {
      btn.style.display = 'none';
    }

    attachIconHandlers(btn, icon);

    // Long-press / right-click menu
    if (window.AppLock && window.AppLock.attachLongPress) {
      window.AppLock.attachLongPress(btn, icon.id, {
        onRename: function (el, appId) {
          openAppEditor(icon, el.getBoundingClientRect().left, el.getBoundingClientRect().top);
        }
      });
    }

    // Drag-to-trash
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

// ---- Icon interaction: drag, click, long-press ----
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
    if(dragMode){
      btn.style.left = (startLeft + dx) + 'px';
      btn.style.top = (startTop + dy) + 'px';
    }
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
      icon.x = newPos.x;
      icon.y = newPos.y;
      saveIcons();
      renderDesktop();
      dragMode = false;
    } else if(!holdFired && !moved){
      launch(icon.id);
    }
  }
}

// ---- App editor dialog ----
var editorTargetIcon = null;

function openAppEditor(icon, mx, my){
  editorTargetIcon = icon;
  var ed = $('appEditor');

  var heading = ed.querySelector('h3');
  if (heading) heading.textContent = 'Edit "' + (icon.name || 'App') + '"';

  var remBtn = $('ae-remove');
  if (remBtn) remBtn.textContent = 'Remove from desktop';

  $('ae-name').value = icon.name;
  ed.style.left = Math.min(window.innerWidth - 300, mx) + 'px';
  ed.style.top = Math.min(window.innerHeight - 200, my) + 'px';
  ed.classList.add('on');
  setTimeout(function(){ $('ae-name').focus(); }, 50);
}

function closeAppEditor(){
  var ed = $('appEditor');
  if(ed) ed.classList.remove('on');
  editorTargetIcon = null;
}

function initAppEditorButtons(){
  var save = $('ae-save');
  if(save) save.onclick = function(){
    if(editorTargetIcon){
      var newName = $('ae-name').value.trim();
      if(newName) editorTargetIcon.name = newName;
      saveIcons();
      renderDesktop();
    }
    closeAppEditor();
  };

  var rem = $('ae-remove');
  if(rem) rem.onclick = function(){
    if(!editorTargetIcon){ closeAppEditor(); return; }
    var appName = editorTargetIcon.name || 'this app';
    var ok = confirm(
      'Remove "' + appName + '" from the home screen?\n\n' +
      'It will still appear in the Start menu.\n\n' +
      'To add it back: right-click "' + appName + '" in the Start menu and choose "Add to desktop".'
    );
    if(ok){
      editorTargetIcon.removed = true;
      saveIcons();
      renderDesktop();
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

  // ---- Right-click on Start menu items → Add / Remove from desktop ----
  document.addEventListener('contextmenu', function (e) {
    var mi = e.target.closest && e.target.closest('.smi[data-a]');
    if (!mi) return;
    e.preventDefault();
    var appId = mi.getAttribute('data-a');
    if (!appId) return;

    var label = (mi.textContent || '').replace(/[^\x00-\x7F]/g, '').trim() || appId;

    var menu = document.createElement('div');
    menu.style.cssText =
      'position:fixed;z-index:2147483647;min-width:210px;background:#1a1c22;color:#fff;' +
      'border:1px solid rgba(255,255,255,0.12);border-radius:8px;' +
      'box-shadow:0 12px 40px rgba(0,0,0,0.55);font-family:system-ui,sans-serif;' +
      'font-size:13px;padding:6px 0;left:' + e.clientX + 'px;top:' + e.clientY + 'px;';
    menu.onclick = function (ev) { ev.stopPropagation(); };

    function closeCtx() {
      if (menu.parentNode) menu.parentNode.removeChild(menu);
      document.removeEventListener('click', closeCtx);
    }

    function item(label2, fn, danger) {
      var row = document.createElement('div');
      row.textContent = label2;
      row.style.cssText = 'padding:9px 16px;cursor:pointer;' + (danger ? 'color:#ff8a8a;' : 'color:#fff;');
      row.onmouseenter = function () { row.style.background = 'rgba(255,255,255,0.06)'; };
      row.onmouseleave = function () { row.style.background = ''; };
      row.onclick = function () { closeCtx(); fn(); };
      menu.appendChild(row);
    }

    var entry = findIconEntry(appId);
    var isOnDesktop = entry && !entry.removed;

    if (isOnDesktop) {
      item('🚫 Remove from desktop', function () {
        if (!confirm('Remove "' + label + '" from the home screen?\n\nIt will still appear in the Start menu.')) return;
        removeAppFromDesktop(appId);
      }, true);
    } else {
      item('➕ Add to desktop', function () {
        if (!addAppToDesktop(appId)) {
          alert('Could not add "' + label + '" to the desktop.');
        }
      });
    }

    document.body.appendChild(menu);
    setTimeout(function () { document.addEventListener('click', closeCtx, { once: true }); }, 10);
  });
}

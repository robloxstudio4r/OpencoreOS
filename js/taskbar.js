// ============================================================
//  taskbar.js — OpencoreOS v10.4
//  Taskbar, start menu, system tray, Shutdown, Airplane Mode,
//  Accessibility, Screenshot, Screen Recording, Captures.
// ============================================================

function updateTaskbar(){
  var tb = $('ta'); if(!tb) return;
  tb.innerHTML = '';
  for(var i=0; i<ST.windows.length; i++){
    (function(w){
      var b = document.createElement('button');
      b.className = 'tba' + (w.min ? '' : ' on');
      var titleEl = w.el.querySelector('.wt');
      b.textContent = titleEl ? titleEl.textContent : 'App';
      b.onclick = function(){
        if(w.min){ w.min = false; w.el.style.display = 'flex'; }
        w.el.style.zIndex = ++ST.z;
        updateTaskbar();
      };
      tb.appendChild(b);
    })(ST.windows[i]);
  }
}

function tickClock(){
  var now = new Date();
  var t = now.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
  var c = $('clk'); if(c) c.textContent = t;
  var lt = $('lt'); if(lt) lt.textContent = t;
  var ld = $('ld'); if(ld) ld.textContent = now.toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}
setInterval(tickClock, 1000);
tickClock();

function updateBattery(){
  if('getBattery' in navigator){
    navigator.getBattery().then(function(b){
      var el = $('tray-battery');
      if(el){ el.textContent = b.charging ? '⚡' : '🔋'; el.title = Math.round(b.level * 100) + '%'; }
    }).catch(function(){});
  }
}
setInterval(updateBattery, 30000);

function initTaskbar(){
  var sb = $('sb'); if(sb) sb.onclick = function(e){ e.stopPropagation(); $('sm').classList.toggle('on'); };
  document.addEventListener('click', function(){ $('sm').classList.remove('on'); });
  var sm = $('sm'); if(sm) sm.addEventListener('click', function(e){ e.stopPropagation(); });

  var smItems = document.querySelectorAll('.smi');
  for(var si=0; si<smItems.length; si++){
    (function(el){
      var app = el.getAttribute('data-a');
      if(app){ el.onclick = function(){ launch(app); $('sm').classList.remove('on'); }; }
    })(smItems[si]);
  }

  var mlk = $('mlk'); if(mlk) mlk.onclick = function(){ $('sm').classList.remove('on'); showLogin(); };
  var msleep = $('msleep'); if(msleep) msleep.onclick = function(){ $('sm').classList.remove('on'); goToSleep(); };
  var mrs = $('mrs'); if(mrs) mrs.onclick = function(){ if(confirm('Restart?')) location.reload(); };

  // ---------------- Airplane Mode ----------------
  var mam = $('mam');
  if (mam) mam.onclick = function(e){
    if (e) { e.preventDefault(); e.stopPropagation(); }
    $('sm').classList.remove('on');
    if (window.AirplaneMode) window.AirplaneMode.toggle();
  };

  // ---------------- Accessibility ----------------
  var ma11y = $('ma11y');
  if (ma11y) ma11y.onclick = function(e){
    if (e) { e.preventDefault(); e.stopPropagation(); }
    $('sm').classList.remove('on');
    if (typeof openAccessibilityPanel === 'function') openAccessibilityPanel();
    else alert('Accessibility panel not loaded');
  };

  // ---------------- Captures gallery ----------------
  var mcaptures = $('mcaptures');
  if (mcaptures) mcaptures.onclick = function(e){
    if (e) { e.preventDefault(); e.stopPropagation(); }
    $('sm').classList.remove('on');
    if (window.Capture) window.Capture.openGallery();
    else alert('Capture module not loaded');
  };

  // ---------------- Shutdown ----------------
  var msd = $('msd');
  if(msd) msd.onclick = function(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    var smEl = $('sm');
    if(smEl){ smEl.classList.remove('on'); smEl.classList.remove('show'); }
    if(typeof window.kioskUnlock === 'function'){
      try { window.kioskUnlock(); } catch(err){ console.warn('kioskUnlock error:', err); }
    } else {
      try {
        if(document.exitFullscreen) document.exitFullscreen();
        else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if(document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if(document.msExitFullscreen) document.msExitFullscreen();
      } catch(err){}
    }
    if(typeof window.doShutdown === 'function'){
      window.doShutdown();
    } else {
      var ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;background:#000;color:#fff;' +
        'display:flex;align-items:center;justify-content:center;' +
        'font-family:system-ui;font-size:24px;z-index:2147483647;';
      ov.textContent = 'Shutting down...';
      document.body.appendChild(ov);
    }
  };

  // ---------------- System tray ----------------
  // tray-wifi click is handled by airplane.js (toggles Airplane Mode).
  var tl = $('tray-lock'); if(tl) tl.onclick = function(){ showLogin(); };
  var tbt = $('tray-bt'); if(tbt) tbt.ondblclick = function(){ ST.btOn = !ST.btOn; LS.setItem('oc_bt', String(ST.btOn)); };

  // Accessibility tray icon
  var trayA11y = $('tray-a11y');
  if(trayA11y) trayA11y.onclick = function(e){
    if(e) e.stopPropagation();
    if (typeof openAccessibilityPanel === 'function') openAccessibilityPanel();
    else alert('Accessibility panel not loaded');
  };

  // Screenshot tray icon
  var trayShot = $('tray-shot');
  if(trayShot) trayShot.onclick = function(e){
    if(e) e.stopPropagation();
    if (window.Capture) window.Capture.screenshot();
    else alert('Capture module not loaded');
  };

  // Screen recording tray icon (toggles)
  var trayRec = $('tray-rec');
  if(trayRec) trayRec.onclick = function(e){
    if(e) e.stopPropagation();
    if (!window.Capture) return alert('Capture module not loaded');
    if (window.Capture.isRecording()) window.Capture.stopRecording();
    else window.Capture.startRecording();
  };

  updateBattery();

  // Reflect Airplane Mode in the Start-menu label if it's on
  if (window.AirplaneMode && window.AirplaneMode.isOn && mam) {
    mam.innerHTML = '<span class="ic">✈️</span>Airplane Mode (ON)';
  }
}

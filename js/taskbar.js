// ============================================================
//  taskbar.js — OpencoreOS v10.4
//  Taskbar, start menu, system tray, Shutdown button.
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

  // ---------------- Shutdown ----------------
  // Releases the kiosk fullscreen lock, then shows the shutdown overlay.
  var msd = $('msd');
  if(msd) msd.onclick = function(e){
    if(e){ e.preventDefault(); e.stopPropagation(); }
    // Close start menu
    var smEl = $('sm');
    if(smEl){ smEl.classList.remove('on'); smEl.classList.remove('show'); }
    // Release fullscreen lock (kiosk.js exposes this)
    if(typeof window.kioskUnlock === 'function'){
      try { window.kioskUnlock(); } catch(err){ console.warn('kioskUnlock error:', err); }
    } else {
      // Fallback: exit fullscreen directly
      try {
        if(document.exitFullscreen) document.exitFullscreen();
        else if(document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if(document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if(document.msExitFullscreen) document.msExitFullscreen();
      } catch(err){}
    }
    // Draw shutdown overlay (shutdown.js exposes this)
    if(typeof window.doShutdown === 'function'){
      window.doShutdown();
    } else {
      // Minimal fallback
      var ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;background:#000;color:#fff;' +
        'display:flex;align-items:center;justify-content:center;' +
        'font-family:system-ui;font-size:24px;z-index:2147483647;';
      ov.textContent = 'Shutting down...';
      document.body.appendChild(ov);
    }
  };

  var tl = $('tray-lock'); if(tl) tl.onclick = function(){ showLogin(); };
  var tw = $('tray-wifi'); if(tw) tw.ondblclick = function(){ ST.wifiOn = !ST.wifiOn; LS.setItem('oc_wifi', String(ST.wifiOn)); };
  var tbt = $('tray-bt'); if(tbt) tbt.ondblclick = function(){ ST.btOn = !ST.btOn; LS.setItem('oc_bt', String(ST.btOn)); };

  updateBattery();
}

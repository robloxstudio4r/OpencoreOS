// ============================================================
//  boot.js — Boot sequence (Supabase auth)
// ============================================================

function loadSettings(){
  var w = LS.getItem('oc_wallpaper');
  var d = $('dt'); if(w && d) d.style.background = w;
  var dn = LS.getItem('oc_device_name') || 'Opencore-PC';
  var smn = $('smn'); if(smn) smn.textContent = dn;
}

window.addEventListener('resize', function(){
  if(typeof renderDesktop === 'function') renderDesktop();
});

function handleSpotifyCallbackIfNeeded(){
  if(!window.SpotifyAuth || typeof SpotifyAuth.handleCallback !== 'function'){
    var attempts = 0;
    var iv = setInterval(function(){
      attempts++;
      if(window.SpotifyAuth && typeof SpotifyAuth.handleCallback === 'function'){
        clearInterval(iv);
        SpotifyAuth.handleCallback().then(function(ok){
          if(ok) console.log('✓ Spotify login callback handled');
        }).catch(function(e){ console.error('Spotify callback error:', e); });
      } else if(attempts > 30){
        clearInterval(iv);
      }
    }, 100);
    return;
  }
  SpotifyAuth.handleCallback().then(function(ok){
    if(ok) console.log('✓ Spotify login callback handled');
  }).catch(function(e){ console.error('Spotify callback error:', e); });
}

function armKioskWhenReady(){
  if (typeof window.kioskArm === 'function') {
    try { window.kioskArm(); } catch (e) {}
  } else {
    var tries = 0;
    var iv = setInterval(function(){
      tries++;
      if (typeof window.kioskArm === 'function') {
        clearInterval(iv);
        try { window.kioskArm(); } catch (e) {}
      } else if (tries > 20) {
        clearInterval(iv);
      }
    }, 150);
  }
}

function userHasCompletedSetup() {
  try {
    return LS.getItem('oc_setup_done') === 'true' && LS.getItem('oc_user_done') === 'true';
  } catch (e) {
    return false;
  }
}

function hidePreBootScreens() {
  var s = document.getElementById('setup');      if (s) s.classList.add('hide');
  var u = document.getElementById('uwiz');       if (u) u.classList.add('hide');
  var p = document.getElementById('acctPicker'); if (p) p.style.display = 'none';
  var l = document.getElementById('login');      if (l) l.classList.remove('on');
}

function showScreen(id) {
  var screens = ['setup', 'uwiz', 'acctPicker', 'login'];
  for (var i = 0; i < screens.length; i++) {
    var el = document.getElementById(screens[i]);
    if (!el) continue;
    if (screens[i] === id) {
      if (screens[i] === 'setup' || screens[i] === 'uwiz') el.classList.remove('hide');
      else if (screens[i] === 'acctPicker') el.style.display = 'flex';
      else if (screens[i] === 'login') el.classList.add('on');
    } else {
      if (screens[i] === 'setup' || screens[i] === 'uwiz') el.classList.add('hide');
      else if (screens[i] === 'acctPicker') el.style.display = 'none';
      else if (screens[i] === 'login') el.classList.remove('on');
    }
  }
}

function bootOpencore(){
  try {
    if (!window.currentUser) {
      console.warn('bootOpencore: no signed-in user — showing auth screen');
      if (window.OpencoreAuth && window.OpencoreAuth.showAuthScreen) {
        window.OpencoreAuth.showAuthScreen();
      }
      return;
    }

    console.log('Booting OpencoreOS v10.4 —', window.currentUser.email);

    hidePreBootScreens();
    handleSpotifyCallbackIfNeeded();

    var dt = document.getElementById('dt'); if (dt) dt.style.display = '';
    var tb = document.getElementById('tb'); if (tb) tb.style.display = '';

    var vfsInit = (window.VFS && typeof VFS.init === 'function')
      ? Promise.resolve(VFS.init())
      : Promise.resolve();

    vfsInit.then(startDesktop).catch(function (err) {
      console.warn('VFS init error:', err);
      startDesktop();
    });

    function startDesktop() {
      loadSettings();
      if (typeof loadIcons === 'function') loadIcons();
      if (typeof renderDesktop === 'function') renderDesktop();
      if (typeof initTaskbar === 'function') initTaskbar();
      if (typeof initAppEditorButtons === 'function') initAppEditorButtons();
      if (typeof initSleepOverlay === 'function') initSleepOverlay();

      if (!userHasCompletedSetup()) {
        console.log('→ First login — running setup wizard');
        showScreen('setup');
        if (typeof runSetup === 'function') {
          runSetup();
        } else {
          LS.setItem('oc_setup_done', 'true');
          LS.setItem('oc_user_done', 'true');
          finishBoot();
        }
      } else {
        console.log('→ Setup already completed — showing desktop');
        hidePreBootScreens();
        finishBoot();
      }

      function finishBoot() {
        hidePreBootScreens();
        armKioskWhenReady();
        console.log('Boot complete');
      }
    }
  } catch (e) {
    console.error('Boot error:', e);
    showFatal('Boot error: ' + e.message + '\n\n' + (e.stack || ''));
  }
}

function showFatal(msg){
  var box = $('err');
  if (box) {
    box.style.display = 'block';
    var em = $('errm'); if (em) em.textContent = msg;
    var es = $('errs'); if (es) es.textContent = '';
  } else {
    document.body.innerHTML = '<pre style="color:#f66;background:#000;padding:20px;font-family:monospace;font-size:13px;height:100vh;overflow:auto;white-space:pre-wrap;">FATAL: ' + msg + '</pre>';
  }
}

window.bootAfterAuth = function () {
  console.log('Auth complete — booting OpencoreOS');
  bootOpencore();
};

(function hideAll() {
  function hide() {
    var s = document.getElementById('setup'); if (s) s.classList.add('hide');
    var u = document.getElementById('uwiz');  if (u) u.classList.add('hide');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hide);
  else hide();
})();

console.log('OpencoreOS v10.4 loaded');

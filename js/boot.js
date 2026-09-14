// ============================================================
//  boot.js — Boot sequence for OpencoreOS v10.4 (Supabase auth)
//  Setup wizard only runs if the Supabase user has never
//  completed it before. Refuses to boot with no signed-in user.
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

// ============================================================
//  Spotify OAuth callback
// ============================================================
function handleSpotifyCallbackIfNeeded(){
  if(!window.SpotifyAuth || typeof SpotifyAuth.handleCallback !== 'function'){
    var attempts = 0;
    var iv = setInterval(function(){
      attempts++;
      if(window.SpotifyAuth && typeof SpotifyAuth.handleCallback === 'function'){
        clearInterval(iv);
        SpotifyAuth.handleCallback().then(function(ok){
          if(ok) console.log('✓ Spotify login callback handled');
        }).catch(function(e){
          console.error('Spotify callback error:', e);
        });
      } else if(attempts > 30){
        clearInterval(iv);
        console.warn('SpotifyAuth never loaded — callback skipped');
      }
    }, 100);
    return;
  }
  SpotifyAuth.handleCallback().then(function(ok){
    if(ok) console.log('✓ Spotify login callback handled');
  }).catch(function(e){
    console.error('Spotify callback error:', e);
  });
}

// ============================================================
//  Kiosk arming
// ============================================================
function armKioskWhenReady(){
  if (typeof window.kioskArm === 'function') {
    try { window.kioskArm(); } catch (e) { console.warn('kioskArm error:', e); }
  } else {
    var tries = 0;
    var iv = setInterval(function(){
      tries++;
      if (typeof window.kioskArm === 'function') {
        clearInterval(iv);
        try { window.kioskArm(); } catch (e) { console.warn('kioskArm error:', e); }
      } else if (tries > 20) {
        clearInterval(iv);
        console.warn('kiosk.js did not load — fullscreen lock disabled');
      }
    }, 150);
  }
}

// ============================================================
//  Setup completion check (per Supabase user via scoped LS)
// ============================================================
function userHasCompletedSetup() {
  try {
    var setupDone = LS.getItem('oc_setup_done') === 'true';
    var userDone  = LS.getItem('oc_user_done')  === 'true';
    return setupDone && userDone;
  } catch (e) {
    return false;
  }
}

// ============================================================
//  Hide every pre-desktop screen (called at load and on demand)
// ============================================================
function hidePreBootScreens() {
  var s = document.getElementById('setup');      if (s) s.classList.add('hide');
  var u = document.getElementById('uwiz');       if (u) u.classList.add('hide');
  var p = document.getElementById('acctPicker'); if (p) p.style.display = 'none';
  var l = document.getElementById('login');      if (l) l.classList.remove('on');
  var d = document.getElementById('dt');         if (d) d.style.display = '';
}

function showScreen(id) {
  // Show only the given screen and hide the others
  var screens = ['setup', 'uwiz', 'acctPicker', 'login'];
  for (var i = 0; i < screens.length; i++) {
    var el = document.getElementById(screens[i]);
    if (!el) continue;
    if (screens[i] === id) {
      if (screens[i] === 'setup' || screens[i] === 'uwiz') {
        el.classList.remove('hide');
      } else if (screens[i] === 'acctPicker') {
        el.style.display = 'flex';
      } else if (screens[i] === 'login') {
        el.classList.add('on');
      }
    } else {
      if (screens[i] === 'setup' || screens[i] === 'uwiz') {
        el.classList.add('hide');
      } else if (screens[i] === 'acctPicker') {
        el.style.display = 'none';
      } else if (screens[i] === 'login') {
        el.classList.remove('on');
      }
    }
  }
}

// ============================================================
//  bootOpencore — ONLY runs when there IS a signed-in user
// ============================================================
function bootOpencore(){
  try {
    // GUARD: refuse to boot without a Supabase user
    if (!window.currentUser) {
      console.warn('bootOpencore called with no signed-in user — ignoring');
      // Make sure we're showing the auth screen instead
      var picker = document.getElementById('acctPicker');
      if (picker) {
        // Only show if auth.js hasn't already drawn a screen
        if (!picker.innerHTML || picker.innerHTML.indexOf('OpencoreOS') === -1) {
          if (typeof window.OpencoreAuth !== 'undefined' && window.OpencoreAuth.showAuthScreen) {
            window.OpencoreAuth.showAuthScreen();
          }
        } else {
          picker.style.display = 'flex';
        }
      }
      return;
    }

    console.log('Booting OpencoreOS v10.4 (Supabase auth)…');
    console.log('Signed in as:', window.currentUser.email);

    // Hide all pre-boot screens before we decide what to show
    hidePreBootScreens();

    handleSpotifyCallbackIfNeeded();

    // Ensure VFS is loaded for this user before showing the desktop
    var vfsInit = (window.VFS && typeof VFS.init === 'function')
      ? Promise.resolve(VFS.init())
      : Promise.resolve();

    vfsInit.then(function () {
      startDesktop();
    }).catch(function (err) {
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

      // --- Setup wizard decision ---
      if (!userHasCompletedSetup()) {
        console.log('→ First login — running setup wizard');
        showScreen('setup');

        if (typeof runSetup === 'function') {
          runSetup();
        } else {
          console.warn('runSetup not loaded — marking as complete');
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

// ============================================================
//  Bridge: auth.js calls this when the user is signed in
//  and their profile is clear (not restricted, no warning).
// ============================================================
window.bootAfterAuth = function () {
  console.log('Auth complete — booting OpencoreOS');
  bootOpencore();
};

// ============================================================
//  Hide pre-boot screens immediately at page load so you never
//  see the setup wizard stuck behind the auth screen.
// ============================================================
(function () {
  function hide() { hidePreBootScreens(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hide);
  } else {
    hide();
  }
})();

console.log('OpencoreOS v10.4 loaded');

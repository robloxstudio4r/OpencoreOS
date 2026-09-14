// ============================================================
//  boot.js — Boot sequence for OpencoreOS v10.4 (Supabase auth)
//  Setup wizard only runs if the Supabase user has never
//  completed it before (tracked on their profile row).
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
//  Check if this Supabase user has completed setup before
//  We read oc_setup_done / oc_user_done from the account-scoped
//  LS keys. If they're missing on first login, we run the wizards
//  one time and mark them done.
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
//  Main boot — called only AFTER Supabase auth succeeds
//  (auth.js calls window.bootAfterAuth())
// ============================================================
function bootOpencore(){
  try {
    console.log('Booting OpencoreOS v10.4 (Supabase auth)…');

    handleSpotifyCallbackIfNeeded();

    var user = window.currentUser;
    var profile = window.currentProfile;
    console.log('Signed in as:', user ? user.email : 'unknown');

    // --- Ensure the VFS is loaded for this user ---
    if (window.VFS && typeof VFS.init === 'function') {
      Promise.resolve(VFS.init()).then(function () {
        startDesktop();
      }).catch(function () {
        startDesktop();
      });
    } else {
      startDesktop();
    }

    function startDesktop() {
      loadSettings();

      if (typeof loadIcons === 'function') loadIcons();
      if (typeof renderDesktop === 'function') renderDesktop();

      // Safety net — force-init UI components
      if (typeof initTaskbar === 'function') initTaskbar();
      if (typeof initAppEditorButtons === 'function') initAppEditorButtons();
      if (typeof initSleepOverlay === 'function') initSleepOverlay();

      // --- Setup wizard decision ---
      if (!userHasCompletedSetup()) {
        console.log('→ First login — running setup wizard');

        // Hide the auth screen
        var picker = document.getElementById('acctPicker');
        if (picker) picker.style.display = 'none';

        // Run setup wizard → then user wizard → then desktop
        if (typeof runSetup === 'function') {
          runSetup();
        } else {
          // No wizard available, mark it done and continue
          LS.setItem('oc_setup_done', 'true');
          LS.setItem('oc_user_done', 'true');
          finishBoot();
        }
      } else {
        console.log('→ Setup already completed — showing desktop');
        var picker2 = document.getElementById('acctPicker');
        if (picker2) picker2.style.display = 'none';
        var setup = $('setup'); if (setup) setup.classList.add('hide');
        finishBoot();
      }

      function finishBoot() {
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

console.log('OpencoreOS v10.4 loaded');

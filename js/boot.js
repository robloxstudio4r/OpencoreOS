// ============================================================
//  boot.js — Boot sequence + Spotify OAuth callback + kiosk arm
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
//  Spotify OAuth callback — must run BEFORE anything else
//  so that when the user returns from Spotify with ?code=...
//  the code gets exchanged for tokens and saved.
// ============================================================
function handleSpotifyCallbackIfNeeded(){
  if(!window.SpotifyAuth || typeof SpotifyAuth.handleCallback !== 'function'){
    // SpotifyAuth not loaded yet — retry a few times
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
//  Kiosk arming — the browser requires a user gesture before
//  fullscreen can be requested, so we don't call requestFullscreen()
//  here. We just tell kiosk.js that it's safe to arm itself once
//  the desktop is on screen. kiosk.js already listens for the
//  first click/keydown/touch, so this is only a hint.
// ============================================================
function armKioskWhenReady(){
  if (typeof window.kioskArm === 'function') {
    try { window.kioskArm(); } catch (e) { console.warn('kioskArm error:', e); }
  } else {
    // Retry briefly in case kiosk.js is still loading
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

function bootOpencore(){
  try {
    console.log('Booting OpencoreOS v10.4 (modular)...');

    // FIRST: handle Spotify callback if returning from login
    handleSpotifyCallbackIfNeeded();

    var setupDone = LS.getItem('oc_setup_done') === 'true';
    var userDone = LS.getItem('oc_user_done') === 'true';

    loadSettings();

    if (typeof loadIcons === 'function') loadIcons();
    if (typeof renderDesktop === 'function') renderDesktop();

    // Safety net — force-init UI components
    if (typeof initLogin === 'function') initLogin();
    if (typeof initTaskbar === 'function') initTaskbar();
    if (typeof initAppEditorButtons === 'function') initAppEditorButtons();
    if (typeof initSleepOverlay === 'function') initSleepOverlay();

    if (!setupDone) {
      console.log('→ Running setup wizard');
      if (typeof runSetup === 'function') runSetup();
      else showFatal('runSetup missing — js/wizards.js did not load.');
    } else if (!userDone) {
      console.log('→ Running user wizard');
      var s = $('setup'); if (s) s.classList.add('hide');
      if (typeof runUserWizard === 'function') runUserWizard();
      else showFatal('runUserWizard missing — js/wizards.js did not load.');
    } else {
      console.log('→ Showing login / desktop');
      var s2 = $('setup'); if (s2) s2.classList.add('hide');
      if (typeof showLogin === 'function') showLogin();
      else showFatal('showLogin missing — js/wizards.js did not load.');
    }

    // Arm kiosk fullscreen lock once the desktop UI is on screen.
    // No fullscreen happens yet — it waits for the user's first click.
    armKioskWhenReady();

    console.log('Boot complete');
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

// boot.js is loaded last with defer, so DOM is ready.
bootOpencore();

console.log('OpencoreOS v10.4 loaded');

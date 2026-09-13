// ============================================================
//  boot.js — Boot sequence + Spotify OAuth callback + kiosk arm
//            + multi-user account picker
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
        console.warn('SpotifyAuth never loaded — callback skipped');
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

function hideEverything() {
  var s = $('setup'); if (s) s.classList.add('hide');
  var l = $('login'); if (l) l.classList.remove('on');
  var u = $('uwiz'); if (u) u.classList.add('hide');
}

function bootOpencore(){
  try {
    console.log('Booting OpencoreOS v10.4 (modular)...');

    handleSpotifyCallbackIfNeeded();

    var accounts = (window.Accounts && window.Accounts.list) ? window.Accounts.list() : [];
    var activeId = (window.Accounts && window.Accounts.getActiveId) ? window.Accounts.getActiveId() : null;

    // --- CASE 1: No accounts yet — run first-time setup ---
    if (accounts.length === 0) {
      console.log('→ No accounts — running setup wizard');
      loadSettings();
      if (typeof loadIcons === 'function') loadIcons();
      if (typeof renderDesktop === 'function') renderDesktop();
      if (typeof initLogin === 'function') initLogin();
      if (typeof initTaskbar === 'function') initTaskbar();
      if (typeof initAppEditorButtons === 'function') initAppEditorButtons();
      if (typeof initSleepOverlay === 'function') initSleepOverlay();

      if (typeof runSetup === 'function') runSetup();
      else showFatal('runSetup missing — js/wizards.js did not load.');

      armKioskWhenReady();
      return;
    }

    // --- CASE 2: Accounts exist, nobody signed in — show picker ---
    if (!activeId) {
      console.log('→ Showing account picker (' + accounts.length + ' account(s))');
      hideEverything();
      if (window.AccountPicker) window.AccountPicker.show();
      else showFatal('AccountPicker missing — js/account-picker.js did not load.');
      armKioskWhenReady();
      return;
    }

    // --- CASE 3: Signed in — normal boot for this account ---
    console.log('→ Signed in as', activeId, '— prefix', window.Accounts.activePrefix());

    // Re-init VFS for the active account (it was initialized before prefix was live)
    if (window.VFS && typeof VFS.init === 'function') VFS.init();

    var setupDone = LS.getItem('oc_setup_done') === 'true';
    var userDone  = LS.getItem('oc_user_done')  === 'true';

    loadSettings();
    if (typeof loadIcons === 'function') loadIcons();
    if (typeof renderDesktop === 'function') renderDesktop();
    if (typeof initLogin === 'function') initLogin();
    if (typeof initTaskbar === 'function') initTaskbar();
    if (typeof initAppEditorButtons === 'function') initAppEditorButtons();
    if (typeof initSleepOverlay === 'function') initSleepOverlay();

    if (!setupDone) {
      console.log('→ Running setup wizard for this account');
      if (typeof runSetup === 'function') runSetup();
      else showFatal('runSetup missing');
    } else if (!userDone) {
      console.log('→ Running user wizard');
      var s = $('setup'); if (s) s.classList.add('hide');
      if (typeof runUserWizard === 'function') runUserWizard();
      else showFatal('runUserWizard missing');
    } else {
      console.log('→ Showing login / desktop');
      var s2 = $('setup'); if (s2) s2.classList.add('hide');
      if (typeof showLogin === 'function') showLogin();
      else showFatal('showLogin missing');
    }

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

bootOpencore();
console.log('OpencoreOS v10.4 loaded');

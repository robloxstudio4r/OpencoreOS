// ============================================================
//  boot.js — Boot sequence
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

function bootOpencore(){
  try {
    console.log('Booting OpencoreOS v10.4 (modular)...');

    var setupDone = LS.getItem('oc_setup_done') === 'true';
    var userDone = LS.getItem('oc_user_done') === 'true';

    loadSettings();

    if (typeof loadIcons === 'function') loadIcons();
    if (typeof renderDesktop === 'function') renderDesktop();

    // Safety net — force-init UI components that would otherwise rely on DOMContentLoaded
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
// Just run immediately.
bootOpencore();

console.log('OpencoreOS v10.4 loaded');

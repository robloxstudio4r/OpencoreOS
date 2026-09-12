function loadSettings(){
  var w = LS.getItem('oc_wallpaper');
  var d = $('dt'); if(w && d) d.style.background = w;
  var dn = LS.getItem('oc_device_name') || 'Opencore-PC';
  var smn = $('smn'); if(smn) smn.textContent = dn;
}

window.addEventListener('resize', function(){ renderDesktop(); });

(function boot(){
  try {
    console.log('Booting OpencoreOS v10.4 (modular)...');
    loadSettings();
    loadIcons();
    renderDesktop();

    var setupDone = LS.getItem('oc_setup_done') === 'true';
    var userDone = LS.getItem('oc_user_done') === 'true';

    if(!setupDone){ runSetup(); }
    else if(!userDone){ $('setup').classList.add('hide'); runUserWizard(); }
    else { $('setup').classList.add('hide'); showLogin(); }

    if(window.location.search.indexOf('code=') !== -1){
      // OAuth callback — spotify-auth.js already handled it
    }
    console.log('Boot complete');
  } catch(e){
    console.error('Boot error:', e);
    var box = $('err');
    if(box){ box.style.display = 'block'; $('errm').textContent = 'Boot error: ' + e.message; $('errs').textContent = e.stack || ''; }
  }
})();

console.log('OpencoreOS v10.4 loaded');

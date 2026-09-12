// ============================================================
//  wizards.js — Setup wizard, user wizard, login screen
//  Fixed: initLogin now runs correctly with defer scripts
// ============================================================

function runSetup(){
  var steps = ['Formatting virtual drive...','Creating System32...','Installing core files...','Configuring drivers...','Configuring Spotify SDK...','Finalizing setup...'];
  var p = 0;
  var iv = setInterval(function(){
    p += Math.random() * 2.5 + 1.5;
    if(p > 100) p = 100;
    var bar = $('spb'); if(bar) bar.style.width = p + '%';
    var st = $('sps');
    if(st) st.textContent = steps[Math.min(Math.floor(p / 17), steps.length - 1)];
    if(p >= 100){
      clearInterval(iv);
      LS.setItem('oc_setup_done','true');
      setTimeout(function(){
        if(st) st.textContent = 'Installation complete!';
        setTimeout(function(){
          var el = $('setup'); if(el) el.classList.add('hide');
          if(LS.getItem('oc_user_done') !== 'true') runUserWizard();
          else showLogin();
        }, 400);
      }, 300);
    }
  }, 1200);
}

var uStep = 0;
var uData = {name:'', lang:'en', kb:'us', pw:'', pwSkipped:true};
var langs = [
  {c:'en',n:'English'},{c:'es',n:'Spanish'},{c:'fr',n:'French'},{c:'de',n:'German'},
  {c:'it',n:'Italian'},{c:'pt',n:'Portuguese'},{c:'ru',n:'Russian'},{c:'ja',n:'Japanese'},
  {c:'ko',n:'Korean'},{c:'zh',n:'Chinese'},{c:'ar',n:'Arabic'},{c:'hi',n:'Hindi'},
  {c:'nl',n:'Dutch'},{c:'sv',n:'Swedish'},{c:'pl',n:'Polish'},{c:'tr',n:'Turkish'}
];
var kbs = [
  {c:'us',n:'QWERTY (US)'},{c:'uk',n:'QWERTY (UK)'},{c:'de',n:'QWERTZ (German)'},
  {c:'fr',n:'AZERTY (French)'},{c:'es',n:'QWERTY (Spanish)'},{c:'it',n:'QWERTY (Italian)'},
  {c:'ru',n:'Russian'},{c:'jp',n:'Japanese'},{c:'kr',n:'Korean'},{c:'zh',n:'Chinese'}
];

function runUserWizard(){
  uStep = 0; uData.name = ''; uData.lang = 'en'; uData.kb = 'us'; uData.pw = ''; uData.pwSkipped = true;
  var el = $('uwiz'); if(el) el.classList.remove('hide');
  renderUserStep();
}

function dotsHTML(active){
  var h = '<div style="display:flex;justify-content:center;gap:8px;margin-top:20px;">';
  for(var i=0; i<5; i++){
    var bg = i < active ? '#4caf50' : (i === active ? '#0078d4' : '#333');
    h += '<div style="width:10px;height:10px;border-radius:50%;background:' + bg + ';"></div>';
  }
  return h + '</div>';
}

function renderUserStep(){
  var c = $('uwc'); if(!c) return;
  var html = '', i, j;
  if(uStep === 0){
    html = '<div style="font-size:64px;">👋</div><h2>Welcome!</h2><p>What should we call this device?</p>'
      + '<input id="un" placeholder="My Opencore PC" value="' + (uData.name || '') + '"/>'
      + '<button id="unx" style="width:100%">Continue</button>' + dotsHTML(0);
  } else if(uStep === 1){
    var opts = '';
    for(i=0; i<langs.length; i++) opts += '<option value="' + langs[i].c + '"' + (uData.lang === langs[i].c ? ' selected' : '') + '>' + langs[i].n + '</option>';
    html = '<div style="font-size:64px;">🌍</div><h2>Language</h2><p>Pick your language.</p>'
      + '<select id="ul">' + opts + '</select>'
      + '<div style="display:flex;gap:8px"><button class="sec" id="ub" style="flex:1">Back</button><button id="unx" style="flex:2">Continue</button></div>' + dotsHTML(1);
  } else if(uStep === 2){
    var opts2 = '';
    for(j=0; j<kbs.length; j++) opts2 += '<option value="' + kbs[j].c + '"' + (uData.kb === kbs[j].c ? ' selected' : '') + '>' + kbs[j].n + '</option>';
    html = '<div style="font-size:64px;">⌨️</div><h2>Keyboard</h2><p>Choose your keyboard layout.</p>'
      + '<select id="uk">' + opts2 + '</select>'
      + '<div style="display:flex;gap:8px"><button class="sec" id="ub" style="flex:1">Back</button><button id="unx" style="flex:2">Continue</button></div>' + dotsHTML(2);
  } else if(uStep === 3){
    html = '<div style="font-size:64px;">🔒</div><h2>Password (optional)</h2><p>Use 6 digits for PIN unlock, or skip.</p>'
      + '<input type="password" id="up" placeholder="Password (6+ chars)"/>'
      + '<input type="password" id="up2" placeholder="Confirm password"/>'
      + '<div style="display:flex;gap:8px"><button class="sec" id="ub" style="flex:1">Back</button><button class="sec" id="usk" style="flex:1">Skip</button><button id="unx" style="flex:2">Set</button></div>' + dotsHTML(3);
  } else {
    var langName = 'English';
    for(i=0; i<langs.length; i++) if(langs[i].c === uData.lang) langName = langs[i].n;
    var kbName = 'QWERTY';
    for(j=0; j<kbs.length; j++) if(kbs[j].c === uData.kb) kbName = kbs[j].n;
    html = '<div style="font-size:64px;">✅</div><h2>All set!</h2>'
      + '<div style="text-align:left;background:rgba(0,0,0,0.2);padding:16px;border-radius:8px;margin-bottom:20px;font-size:13px;">'
      + '<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);"><span style="color:#888">Device:</span> ' + (uData.name || 'Opencore-PC') + '</div>'
      + '<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);"><span style="color:#888">Language:</span> ' + langName + '</div>'
      + '<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);"><span style="color:#888">Keyboard:</span> ' + kbName + '</div>'
      + '<div style="padding:6px 0;"><span style="color:#888">Password:</span> ' + (uData.pwSkipped ? 'Skipped' : 'Set') + '</div>'
      + '</div><button id="uf" style="width:100%">Get Started</button>' + dotsHTML(4);
  }
  c.innerHTML = html;
  var nextBtn = $('unx'); if(nextBtn) nextBtn.onclick = nextUserStep;
  var backBtn = $('ub'); if(backBtn) backBtn.onclick = function(){ uStep--; renderUserStep(); };
  var skipBtn2 = $('usk'); if(skipBtn2) skipBtn2.onclick = function(){ uData.pw = ''; uData.pwSkipped = true; uStep++; renderUserStep(); };
  var finishBtn = $('uf'); if(finishBtn) finishBtn.onclick = finishUserWizard;
  var nameIn = $('un'); if(nameIn) setTimeout(function(){ nameIn.focus(); }, 100);
}

function nextUserStep(){
  if(uStep === 0){
    var n = $('un'); if(!n) return;
    var v = n.value.trim();
    if(!v){ alert('Please enter a name.'); return; }
    uData.name = v;
  } else if(uStep === 1){ var l = $('ul'); if(l) uData.lang = l.value; }
  else if(uStep === 2){ var k = $('uk'); if(k) uData.kb = k.value; }
  else if(uStep === 3){
    var p1 = $('up'); var p2 = $('up2');
    if(p1 && p1.value){
      if(p1.value.length < 6){ alert('Password must be 6+ chars.'); return; }
      if(p2 && p1.value !== p2.value){ alert('Passwords do not match.'); return; }
      uData.pw = p1.value; uData.pwSkipped = false;
      if(/^\d{6}$/.test(p1.value)) LS.setItem('oc_pin', p1.value);
    }
  }
  uStep++;
  renderUserStep();
}

function finishUserWizard(){
  LS.setItem('oc_device_name', uData.name || 'Opencore-PC');
  LS.setItem('oc_lang', uData.lang);
  LS.setItem('oc_kb', uData.kb);
  LS.setItem('oc_user_done','true');
  var el = $('uwiz'); if(el) el.classList.add('hide');
  if(typeof loadSettings === 'function') loadSettings();
  showLogin();
  setTimeout(function(){ alert('Welcome, ' + (uData.name || 'Opencore User') + '!'); }, 300);
}

// ============================================================
//  LOGIN SCREEN
// ============================================================
var pin = '';

function showLogin(){
  var storedPin = LS.getItem('oc_pin') || '';
  var el = $('login'); if(!el) return;
  if(storedPin.length === 6){
    el.classList.add('on');
    var le = $('le'); if(le) le.textContent = 'Enter your PIN';
  } else {
    el.classList.remove('on');
  }
}

function updatePins(){
  var dots = $$('#pds .pdd');
  for(var i=0; i<dots.length; i++) dots[i].classList.toggle('f', i < pin.length);
}

function checkPin(){
  var storedPin = LS.getItem('oc_pin') || '';
  var le = $('le');
  if(!storedPin){ $('login').classList.remove('on'); return; }
  if(pin === storedPin){
    if(le) le.textContent = '✓ Unlocked';
    setTimeout(function(){
      $('login').classList.remove('on');
      pin = '';
      updatePins();
    }, 300);
  } else {
    if(le) le.textContent = '❌ Wrong PIN';
    pin = '';
    updatePins();
  }
}

function initLogin(){
  // Wire up the on-screen number buttons
  var pinButtons = $$('#pp button');
  for(var i=0; i<pinButtons.length; i++){
    (function(btn){
      btn.onclick = function(){
        var n = btn.getAttribute('data-n');
        if(n === 'c') pin = pin.slice(0,-1);
        else if(n === 'e') checkPin();
        else if(pin.length < 6) pin += n;
        updatePins();
        if(pin.length === 6) setTimeout(checkPin, 150);
      };
    })(pinButtons[i]);
  }

  // ALSO allow typing on the physical keyboard
  document.addEventListener('keydown', function(e){
    var lg = $('login');
    if(!lg || !lg.classList.contains('on')) return;
    if(e.key >= '0' && e.key <= '9'){
      if(pin.length < 6) pin += e.key;
      updatePins();
      if(pin.length === 6) setTimeout(checkPin, 150);
    } else if(e.key === 'Backspace'){
      pin = pin.slice(0,-1);
      updatePins();
    } else if(e.key === 'Enter'){
      checkPin();
    }
  });

  // Reset pin dots at load
  updatePins();
}

// Run initLogin as soon as wizards.js loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogin);
} else {
  initLogin();
}

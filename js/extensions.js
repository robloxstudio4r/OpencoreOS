// ============================================================
//  extensions.js — Extension engine for OpencoreOS
//  Storage: LS (per-account)
//  Keys:  oc_ext_installed         = JSON array of ext IDs
//         oc_ext_settings_<id>     = JSON object per extension
//         oc_ext_icon_<appId>      = emoji or data:image URL
//         oc_ext_active_theme      = theme id (or 'none')
// ============================================================

(function () {
  'use strict';

  // ============================================================
  //  10 built-in extensions
  // ============================================================
  var EXTENSIONS = [
    {
      id: 'aeroglass',
      name: 'Aero Glass',
      icon: '🪟',
      desc: 'Frosted glass windows with blur, rounded corners, subtle glow',
      type: 'theme',
      css: '.win{backdrop-filter:blur(20px) saturate(1.4);background:rgba(30,40,60,0.55)!important;border:1px solid rgba(255,255,255,0.15)!important;border-radius:14px!important;box-shadow:0 20px 60px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.08)!important;} .tb{backdrop-filter:blur(24px)!important;background:rgba(20,28,42,0.75)!important;border-top:1px solid rgba(255,255,255,0.08)!important;} .sm{backdrop-filter:blur(24px)!important;background:rgba(20,28,42,0.85)!important;border-radius:14px!important;border:1px solid rgba(255,255,255,0.1)!important;}',
      vars: { '--ext-accent': '#5aa9ff' }
    },
    {
      id: 'neon',
      name: 'Neon Cyber',
      icon: '🌆',
      desc: 'Cyan and magenta glow on pitch black',
      type: 'theme',
      css: 'body{background:#050010!important;} .win{background:rgba(10,0,25,0.9)!important;border:2px solid #00ffff!important;box-shadow:0 0 20px #00ffff,0 0 40px rgba(255,0,255,0.4)!important;} .wt{color:#00ffff!important;text-shadow:0 0 8px #00ffff;} .tb{background:linear-gradient(90deg,#0a0020,#200040)!important;border-top:2px solid #ff00ff!important;box-shadow:0 -4px 20px rgba(255,0,255,0.5);} .sm{background:#0a0020!important;border:2px solid #00ffff!important;box-shadow:0 0 30px rgba(0,255,255,0.6);} .di{color:#00ffff!important;text-shadow:0 0 6px #00ffff;}',
      vars: { '--ext-accent': '#00ffff' }
    },
    {
      id: 'paper',
      name: 'Paper Light',
      icon: '📄',
      desc: 'Cream background, soft serif fonts, warm shadows',
      type: 'theme',
      css: 'body{background:#f4efe4!important;color:#3a3a3a!important;} .win{background:#fdfaf3!important;color:#333!important;border:1px solid #e0d8c8!important;box-shadow:0 6px 24px rgba(120,100,70,0.15)!important;} .wt{color:#5a4a30!important;font-family:Georgia,serif!important;} .tb{background:#efe7d6!important;color:#3a3a3a!important;border-top:1px solid #d8cebb!important;} .sm{background:#fdfaf3!important;color:#333!important;border:1px solid #e0d8c8!important;} .di{color:#3a2e18!important;} #clk{color:#3a3a3a!important;}',
      vars: { '--ext-accent': '#8a6a3a' }
    },
    {
      id: 'terminal',
      name: 'Terminal Green',
      icon: '🖥️',
      desc: 'Everything monospace, phosphor green on black',
      type: 'theme',
      css: '*{font-family:"Courier New",monospace!important;} body{background:#000!important;color:#00ff00!important;} .win{background:#000!important;border:1px solid #00ff00!important;box-shadow:0 0 12px rgba(0,255,0,0.4);} .wt{color:#00ff00!important;background:#000!important;} .tb{background:#000!important;border-top:1px solid #00ff00!important;} .sm{background:#000!important;border:1px solid #00ff00!important;} .di{color:#00ff00!important;} button{background:#000!important;color:#00ff00!important;border:1px solid #00ff00!important;}',
      vars: { '--ext-accent': '#00ff00' }
    },
    {
      id: 'win95',
      name: 'Windows 95',
      icon: '💾',
      desc: 'Grey bevels, square corners, retro chunky UI',
      type: 'theme',
      css: 'body{background:#008080!important;color:#000!important;} .win{background:#c0c0c0!important;border:2px solid !important;border-color:#fff #808080 #808080 #fff!important;box-shadow:none!important;border-radius:0!important;} .wt{background:linear-gradient(90deg,#000080,#1084d0)!important;color:#fff!important;font-weight:bold!important;} .tb{background:#c0c0c0!important;border-top:2px solid #fff!important;} .sm{background:#c0c0c0!important;border:2px solid !important;border-color:#fff #808080 #808080 #fff!important;} .di{color:#000!important;} button{background:#c0c0c0!important;color:#000!important;border:2px solid !important;border-color:#fff #808080 #808080 #fff!important;border-radius:0!important;}',
      vars: { '--ext-accent': '#000080' }
    },
    {
      id: 'macos',
      name: 'macOS Dark',
      icon: '🌙',
      desc: 'Translucent, rounded, subtle greys',
      type: 'theme',
      css: '.win{background:rgba(40,40,42,0.85)!important;backdrop-filter:blur(30px) saturate(1.6)!important;border-radius:12px!important;border:1px solid rgba(255,255,255,0.08)!important;box-shadow:0 20px 60px rgba(0,0,0,0.55)!important;} .wt{color:#f0f0f0!important;} .tb{background:rgba(30,30,32,0.7)!important;backdrop-filter:blur(20px)!important;border-top:1px solid rgba(255,255,255,0.05)!important;} .sm{background:rgba(40,40,42,0.9)!important;backdrop-filter:blur(30px)!important;border-radius:10px!important;} .di{color:#e8e8e8!important;}',
      vars: { '--ext-accent': '#0a84ff' }
    },
    {
      id: 'synthwave',
      name: 'Synthwave',
      icon: '🌴',
      desc: 'Purple-pink gradients, retro-wave sun',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#1a0033 0%,#4d0a4d 60%,#ff6b9d 100%)!important;} .win{background:linear-gradient(180deg,rgba(40,10,60,0.95),rgba(80,20,80,0.95))!important;border:1px solid #ff00aa!important;box-shadow:0 0 30px rgba(255,0,170,0.4)!important;} .wt{color:#ff88dd!important;text-shadow:0 0 10px #ff00aa;} .tb{background:linear-gradient(90deg,#1a0033,#4d0a4d)!important;border-top:1px solid #ff00aa!important;} .sm{background:#2a0050!important;border:1px solid #ff00aa!important;box-shadow:0 0 20px rgba(255,0,170,0.4);} .di{color:#ff88dd!important;text-shadow:0 0 8px #ff00aa;}',
      vars: { '--ext-accent': '#ff00aa' }
    },
    {
      id: 'highcontrast',
      name: 'High Contrast',
      icon: '◐',
      desc: 'Pure black and white for accessibility',
      type: 'theme',
      css: 'body{background:#000!important;color:#fff!important;} .win{background:#000!important;color:#fff!important;border:3px solid #fff!important;box-shadow:none!important;border-radius:0!important;} .wt{background:#fff!important;color:#000!important;font-weight:bold!important;} .tb{background:#000!important;border-top:3px solid #fff!important;color:#fff!important;} .sm{background:#000!important;border:3px solid #fff!important;} .di{color:#fff!important;} button{background:#000!important;color:#fff!important;border:2px solid #fff!important;}',
      vars: { '--ext-accent': '#ffff00' }
    },
    {
      id: 'frost',
      name: 'Frost',
      icon: '❄️',
      desc: 'Heavy blur, muted palette, minimal chrome',
      type: 'theme',
      css: 'body{background:linear-gradient(135deg,#c9d6df,#e0e5ec)!important;} .win{background:rgba(255,255,255,0.65)!important;backdrop-filter:blur(40px) saturate(1.2)!important;border:1px solid rgba(255,255,255,0.7)!important;border-radius:16px!important;box-shadow:0 30px 80px rgba(100,120,140,0.25)!important;} .wt{color:#3a4a5a!important;font-weight:400!important;} .tb{background:rgba(255,255,255,0.55)!important;backdrop-filter:blur(30px)!important;color:#3a4a5a!important;} .sm{background:rgba(255,255,255,0.75)!important;backdrop-filter:blur(30px)!important;border-radius:14px!important;} .di{color:#3a4a5a!important;}',
      vars: { '--ext-accent': '#7a9bb8' }
    },
    {
      id: 'customicons',
      name: 'Custom Icons',
      icon: '🎨',
      desc: 'Change the icon of every app — emoji or upload your own',
      type: 'icons',
      css: '',
      vars: {}
    }
  ];

  // ---------- CSS injection ----------
  var STYLE_ID = 'oc-ext-theme';

  function removeThemeStyle() {
    var el = document.getElementById(STYLE_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function applyThemeCss(css, vars) {
    removeThemeStyle();
    if (!css && (!vars || !Object.keys(vars).length)) return;
    var el = document.createElement('style');
    el.id = STYLE_ID;
    var varBlock = '';
    if (vars) {
      varBlock = ':root{';
      for (var k in vars) if (Object.prototype.hasOwnProperty.call(vars, k)) {
        varBlock += k + ':' + vars[k] + ';';
      }
      varBlock += '}';
    }
    el.textContent = varBlock + '\n' + (css || '');
    document.head.appendChild(el);
  }

  // ---------- Icons ----------
  function getIconOverride(appId) {
    try { return LS.getItem('oc_ext_icon_' + appId) || ''; } catch (e) { return ''; }
  }
  function setIconOverride(appId, value) {
    try {
      if (value) LS.setItem('oc_ext_icon_' + appId, value);
      else LS.removeItem('oc_ext_icon_' + appId);
    } catch (e) {}
  }
  function clearAllIconOverrides() {
    var ids = ['files','terminal','notepad','calculator','browser','camera',
               'microphone','audioplayer','wallpaper','weather','clock','calendar',
               'sysinfo','appstore','settings','music','kernel0','videohub',
               'photoeditor','vapor','science','infinity'];
    for (var i = 0; i < ids.length; i++) setIconOverride(ids[i], '');
  }
  function applyIconOverrides() {
    // Desktop icons
    var deskIcons = document.querySelectorAll('.di[data-app]');
    for (var i = 0; i < deskIcons.length; i++) {
      var el = deskIcons[i];
      var appId = el.getAttribute('data-app');
      var custom = getIconOverride(appId);
      if (!custom) continue;
      var icEl = el.querySelector('.ic');
      if (!icEl) continue;
      if (custom.indexOf('data:image') === 0) {
        icEl.innerHTML = '<img src="' + custom + '" style="width:42px;height:42px;object-fit:contain;"/>';
      } else {
        icEl.textContent = custom;
      }
    }
    // Start menu items
    var menuIcons = document.querySelectorAll('.smi[data-a]');
    for (var j = 0; j < menuIcons.length; j++) {
      var el2 = menuIcons[j];
      var aId = el2.getAttribute('data-a');
      var custom2 = getIconOverride(aId);
      if (!custom2) continue;
      var ic2 = el2.querySelector('.ic');
      if (!ic2) continue;
      if (custom2.indexOf('data:image') === 0) {
        ic2.innerHTML = '<img src="' + custom2 + '" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;"/>';
      } else {
        ic2.textContent = custom2;
      }
    }
  }

  // ---------- Installed list ----------
  function getInstalled() {
    try {
      var raw = LS.getItem('oc_ext_installed');
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function setInstalled(arr) {
    try { LS.setItem('oc_ext_installed', JSON.stringify(arr)); } catch (e) {}
  }
  function isInstalled(id) {
    return getInstalled().indexOf(id) !== -1;
  }
  function install(id) {
    var arr = getInstalled();
    if (arr.indexOf(id) !== -1) return false;
    arr.push(id);
    setInstalled(arr);
    window.dispatchEvent(new CustomEvent('extensionchange', { detail: { id: id, action: 'install' } }));
    return true;
  }
  function uninstall(id) {
    var arr = getInstalled();
    var filtered = arr.filter(function (x) { return x !== id; });
    if (filtered.length === arr.length) return false;
    setInstalled(filtered);
    // If this was the active theme, turn it off
    if (getActiveTheme() === id) setActiveTheme('none');
    if (id === 'customicons') clearAllIconOverrides();
    window.dispatchEvent(new CustomEvent('extensionchange', { detail: { id: id, action: 'uninstall' } }));
    return true;
  }

  // ---------- Active theme ----------
  function getActiveTheme() {
    try { return LS.getItem('oc_ext_active_theme') || 'none'; } catch (e) { return 'none'; }
  }
  function setActiveTheme(id) {
    try { LS.setItem('oc_ext_active_theme', id || 'none'); } catch (e) {}
    applyAll();
  }
  function getExtension(id) {
    for (var i = 0; i < EXTENSIONS.length; i++) if (EXTENSIONS[i].id === id) return EXTENSIONS[i];
    return null;
  }

  // ---------- Apply everything ----------
  function applyAll() {
    var active = getActiveTheme();
    if (active && active !== 'none') {
      var ext = getExtension(active);
      if (ext && isInstalled(ext.id)) {
        applyThemeCss(ext.css, ext.vars);
      } else {
        removeThemeStyle();
      }
    } else {
      removeThemeStyle();
    }

    // Icons
    if (isInstalled('customicons')) applyIconOverrides();
    // Also apply icons any time — they're per-app, not tied to the icon extension
    applyIconOverrides();
  }

  // ---------- Public API ----------
  window.Extensions = {
    ALL: EXTENSIONS,
    get: getExtension,
    installed: getInstalled,
    isInstalled: isInstalled,
    install: install,
    uninstall: uninstall,
    getActiveTheme: getActiveTheme,
    setActiveTheme: setActiveTheme,
    getIconOverride: getIconOverride,
    setIconOverride: setIconOverride,
    clearAllIconOverrides: clearAllIconOverrides,
    applyAll: applyAll
  };

  // Auto-apply on load
  function init() {
    applyAll();
    // Re-apply whenever the desktop re-renders
    var oldRender = window.renderDesktop;
    if (typeof oldRender === 'function' && !oldRender.__extWrapped) {
      window.renderDesktop = function () {
        oldRender.apply(this, arguments);
        applyIconOverrides();
      };
      window.renderDesktop.__extWrapped = true;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('Extensions module loaded — ' + EXTENSIONS.length + ' built-in extensions');
})();

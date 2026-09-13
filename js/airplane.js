// ============================================================
//  airplane.js — Airplane Mode for OpencoreOS v10.4
//  When ON:
//    - All <iframe> elements are blanked and blocked from loading
//    - iframe-based apps (browser, videohub, iframes) refuse to open
//    - Tray icon switches to ✈️
//  When OFF:
//    - iframes work normally again
// ============================================================

(function () {
  'use strict';

  var KEY = 'oc_airplane_mode';

  function isOn() {
    try { return LS.getItem(KEY) === 'true'; } catch (e) { return false; }
  }

  function setState(on) {
    try { LS.setItem(KEY, on ? 'true' : 'false'); } catch (e) {}
    applyToDOM();
    updateTrayIcon();
    // Notify listeners
    try {
      window.dispatchEvent(new CustomEvent('airplanemodechange', { detail: { on: on } }));
    } catch (e) {}
  }

  function toggle() {
    setState(!isOn());
  }

  // Blank out every iframe currently in the DOM
  function blankAllIframes() {
    var frames = document.querySelectorAll('iframe');
    for (var i = 0; i < frames.length; i++) {
      var f = frames[i];
      try {
        // Remember the src so we could restore it later if we wanted
        if (f.src && f.src !== 'about:blank') {
          f.setAttribute('data-blocked-src', f.src);
        }
        f.src = 'about:blank';
        f.style.display = 'none';
      } catch (e) {}
    }
  }

  // Apply current state to every iframe on the page
  function applyToDOM() {
    if (isOn()) {
      blankAllIframes();
    } else {
      // Optionally restore iframes that were blocked
      var frames = document.querySelectorAll('iframe[data-blocked-src]');
      for (var i = 0; i < frames.length; i++) {
        var f = frames[i];
        try {
          f.src = f.getAttribute('data-blocked-src');
          f.removeAttribute('data-blocked-src');
          f.style.display = '';
        } catch (e) {}
      }
    }
  }

  function updateTrayIcon() {
    var tray = document.getElementById('tray-wifi');
    if (!tray) return;
    if (isOn()) {
      tray.textContent = '✈️';
      tray.title = 'Airplane Mode: ON (iframes blocked)';
    } else {
      tray.textContent = '📶';
      tray.title = 'Network (click to toggle Airplane Mode)';
    }
  }

  // Public API
  window.AirplaneMode = {
    isOn: isOn,
    set: setState,
    toggle: toggle,
    // Called by iframe-based apps before opening
    canLoadIframe: function () { return !isOn(); },
    // Called by iframe-based apps to show a friendly block message
    blockMessage: function () {
      return '<div style="padding:24px;text-align:center;color:#ccc;font-family:system-ui;">'
        + '<div style="font-size:48px;margin-bottom:12px;">✈️</div>'
        + '<div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:8px;">Airplane Mode is ON</div>'
        + '<div style="font-size:13px;color:#999;max-width:320px;margin:0 auto 16px;">'
        + 'Iframe-based apps are disabled while Airplane Mode is enabled. '
        + 'Turn it off from the system tray to use this app.</div>'
        + '<button type="button" id="am-disable-btn" '
        + 'style="background:#0078d4;border:none;color:#fff;padding:8px 18px;'
        + 'border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">'
        + 'Turn off Airplane Mode</button></div>';
    },
    // Wire the disable button that appears in blockMessage()
    wireDisableButton: function (container) {
      var btn = container && container.querySelector ? container.querySelector('#am-disable-btn') : null;
      if (btn) {
        btn.onclick = function (e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          setState(false);
          // Force a redraw of the desktop / open windows
          try {
            if (typeof renderDesktop === 'function') renderDesktop();
          } catch (e) {}
        };
      }
    }
  };

  // Watch for new iframes being added — block them immediately if Airplane Mode is on
  function observeIframes() {
    if (!window.MutationObserver) return;
    var observer = new MutationObserver(function (mutations) {
      if (!isOn()) return;
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.tagName === 'IFRAME') {
            try { node.src = 'about:blank'; node.style.display = 'none'; } catch (e) {}
          } else if (node.querySelectorAll) {
            var frames = node.querySelectorAll('iframe');
            for (var k = 0; k < frames.length; k++) {
              try { frames[k].src = 'about:blank'; frames[k].style.display = 'none'; } catch (e) {}
            }
          }
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Wire tray icon toggle
  function wireTray() {
    var tray = document.getElementById('tray-wifi');
    if (!tray) return;
    tray.onclick = function (e) {
      if (e) { e.stopPropagation(); }
      toggle();
    };
  }

  function init() {
    updateTrayIcon();
    wireTray();
    observeIframes();
    // If airplane mode was already on when the page loaded, blank any iframes
    if (isOn()) applyToDOM();
    console.log('Airplane Mode ready — currently', isOn() ? 'ON' : 'OFF');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

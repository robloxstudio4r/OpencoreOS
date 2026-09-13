// ============================================================
//  shutdown.js — Shutdown button for OpencoreOS
//  1) Releases the kiosk fullscreen lock
//  2) Shows a shutdown overlay
//  3) Attempts to close the tab (works if opened by script)
// ============================================================

(function () {
  'use strict';

  function showShutdownScreen() {
    // Remove any existing overlay so double-click doesn't stack
    var old = document.getElementById('shutdownOverlay');
    if (old) old.parentNode.removeChild(old);

    var overlay = document.createElement('div');
    overlay.id = 'shutdownOverlay';
    overlay.style.cssText =
      'position:fixed;inset:0;background:#000;color:#fff;' +
      'display:flex;align-items:center;justify-content:center;' +
      'flex-direction:column;font-family:system-ui,-apple-system,sans-serif;' +
      'z-index:2147483647;user-select:none;';

    overlay.innerHTML =
      '<div style="font-size:96px;line-height:1;margin-bottom:24px;' +
        'animation:pulse 1.6s ease-in-out infinite;">⏻</div>' +
      '<div style="font-size:26px;font-weight:300;letter-spacing:0.5px;">' +
        'Shutting down...</div>' +
      '<div id="shutdownSub" style="margin-top:48px;font-size:13px;' +
        'color:#666;text-align:center;max-width:420px;line-height:1.6;">' +
        'You may now close this tab, or press <b style="color:#999;">Ctrl+W</b>.</div>' +
      '<style>@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}</style>';

    document.body.appendChild(overlay);

    // Try to close the tab — succeeds only if the tab was opened by a script
    setTimeout(function () {
      try {
        window.open('', '_self');
        window.close();
      } catch (e) { /* ignored — browsers block this without script-opened tabs */ }
    }, 2000);
  }

  function doShutdown() {
    // 1) Release fullscreen lock
    if (typeof window.kioskUnlock === 'function') {
      try { window.kioskUnlock(); } catch (e) { console.warn('kioskUnlock error:', e); }
    } else {
      // Fallback: exit fullscreen directly
      try {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
      } catch (e) {}
    }

    // 2) Hide any open UI just in case
    try {
      var sm = document.getElementById('sm');
      if (sm) sm.classList.remove('on', 'show');
    } catch (e) {}

    // 3) Show the shutdown screen
    showShutdownScreen();
  }

  function wire() {
    var btn = document.getElementById('msd');
    if (!btn) {
      // Retry a few times in case taskbar hasn't finished wiring
      var tries = 0;
      var iv = setInterval(function () {
        tries++;
        var b = document.getElementById('msd');
        if (b) {
          clearInterval(iv);
          b.onclick = function (e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            doShutdown();
          };
        } else if (tries > 20) {
          clearInterval(iv);
          console.warn('Shutdown button #msd not found');
        }
      }, 250);
      return;
    }
    btn.onclick = function (e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      doShutdown();
    };
  }

  // Expose so the kiosk script or taskbar can call it
  window.doShutdown = doShutdown;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();

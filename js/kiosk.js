// ============================================================
//  kiosk.js — Fullscreen lock for OpencoreOS
//  - Requests fullscreen on first user gesture (click/key/touch)
//  - Immediately re-enters fullscreen if the user presses Esc or exits
//  - Only released when window.kioskUnlock() is called (Shutdown button)
// ============================================================

(function () {
  'use strict';

  var unlocked = false;      // set true when Shutdown is pressed
  var entering = false;      // guards against overlapping requests
  var armed = false;         // user has interacted at least once

  function isFullscreen() {
    return !!(document.fullscreenElement ||
              document.webkitFullscreenElement ||
              document.mozFullScreenElement ||
              document.msFullscreenElement);
  }

  function requestFS() {
    if (unlocked || entering || isFullscreen()) return;
    entering = true;
    var el = document.documentElement;
    var p =
      el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) :
      el.webkitRequestFullscreen ? el.webkitRequestFullscreen() :
      el.mozRequestFullScreen ? el.mozRequestFullScreen() :
      el.msRequestFullscreen ? el.msRequestFullscreen() : null;

    if (p && typeof p.then === 'function') {
      p.then(function () { entering = false; })
       .catch(function (err) {
         entering = false;
         // Silent — some browsers refuse if not from a trusted gesture
         console.warn('Fullscreen request blocked:', err && err.message);
       });
    } else {
      entering = false;
    }
  }

  // Called when the user explicitly exits (Esc, F11, etc.)
  function onExit() {
    if (unlocked) return;
    if (!armed) return;          // don't loop before they've interacted
    // Immediately try to grab it back
    setTimeout(requestFS, 10);
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
    .forEach(function (ev) {
      document.addEventListener(ev, function () {
        if (!isFullscreen()) onExit();
      });
    });

  // First user gesture arms kiosk + enters fullscreen
  function armOnce() {
    if (armed) return;
    armed = true;
    requestFS();
  }

  ['click', 'keydown', 'touchstart', 'pointerdown'].forEach(function (ev) {
    window.addEventListener(ev, armOnce, { once: false, passive: true });
  });

  // F11 shortcut — let the browser handle it, but re-enter after
  window.addEventListener('keydown', function (e) {
    if (e.key === 'F11') {
      // don't preventDefault; let browser toggle, then we re-enter if it exited
      setTimeout(function () {
        if (!isFullscreen()) requestFS();
      }, 100);
    }
  });

  // Public API
  window.kioskArm       = armOnce;                // optional manual arm
  window.kioskIsLocked  = function () { return isFullscreen() && !unlocked; };
  window.kioskUnlock    = function () {
    unlocked = true;
    // Actually exit fullscreen
    try {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    } catch (e) {}
  };

  // If page loads while already fullscreen (e.g. after reload), stay armed
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (isFullscreen()) armed = true;
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (isFullscreen()) armed = true;
    });
  }
})();

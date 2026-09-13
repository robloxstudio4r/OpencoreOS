// ============================================================
//  accessibility.js — Narrator, Magnifier, Text Size, Contrast
//  Storage: LS (per-account)
//  Keys:  oc_a11y_narrator, oc_a11y_magnifier, oc_a11y_zoom,
//         oc_a11y_textsize, oc_a11y_contrast, oc_a11y_reduce_motion,
//         oc_a11y_focus_ring, oc_a11y_lens
// ============================================================

(function () {
  'use strict';

  var DEFAULTS = {
    narrator: false,
    magnifier: false,
    zoom: 100,
    textsize: 100,
    contrast: false,
    reduce_motion: false,
    focus_ring: false,
    lens: false
  };

  var state = Object.assign({}, DEFAULTS);
  var narratorVoice = null;
  var narratorQueue = [];
  var speaking = false;
  var lastSpoken = '';
  var lastSpokenAt = 0;

  function load() {
    try {
      state.narrator       = LS.getItem('oc_a11y_narrator')       === 'true';
      state.magnifier      = LS.getItem('oc_a11y_magnifier')      === 'true';
      state.contrast       = LS.getItem('oc_a11y_contrast')       === 'true';
      state.reduce_motion  = LS.getItem('oc_a11y_reduce_motion')  === 'true';
      state.focus_ring     = LS.getItem('oc_a11y_focus_ring')     === 'true';
      state.lens           = LS.getItem('oc_a11y_lens')           === 'true';
      state.zoom           = parseInt(LS.getItem('oc_a11y_zoom')     || '100', 10);
      state.textsize       = parseInt(LS.getItem('oc_a11y_textsize') || '100', 10);
    } catch (e) {}
  }

  function save() {
    try {
      LS.setItem('oc_a11y_narrator',      state.narrator ? 'true' : 'false');
      LS.setItem('oc_a11y_magnifier',     state.magnifier ? 'true' : 'false');
      LS.setItem('oc_a11y_contrast',      state.contrast ? 'true' : 'false');
      LS.setItem('oc_a11y_reduce_motion', state.reduce_motion ? 'true' : 'false');
      LS.setItem('oc_a11y_focus_ring',    state.focus_ring ? 'true' : 'false');
      LS.setItem('oc_a11y_lens',          state.lens ? 'true' : 'false');
      LS.setItem('oc_a11y_zoom',          String(state.zoom));
      LS.setItem('oc_a11y_textsize',      String(state.textsize));
    } catch (e) {}
  }

  // ---------- Text size + zoom ----------
  function applyTextSize() {
    var pct = state.textsize;
    document.documentElement.style.fontSize = (pct / 100 * 16) + 'px';
    // Add class so stylesheets can adjust
    document.documentElement.setAttribute('data-text-size', String(pct));
  }

  function applyZoom() {
    // Whole-desktop zoom via transform on body — safer than CSS `zoom`
    // which some browsers don't support consistently.
    var zoom = state.zoom / 100;
    var dt = document.getElementById('dt');
    var tb = document.getElementById('tb');
    var sm = document.getElementById('sm');

    if (!state.magnifier || zoom === 1) {
      if (dt) { dt.style.transform = ''; dt.style.transformOrigin = ''; dt.style.width = ''; dt.style.height = ''; }
      if (tb) { tb.style.transform = ''; tb.style.transformOrigin = ''; }
      return;
    }

    // Scale only the desktop area (keeps taskbar fixed, avoids breaking windows)
    if (dt) {
      dt.style.transformOrigin = 'top left';
      dt.style.transform = 'scale(' + zoom + ')';
      dt.style.width = (100 / zoom) + '%';
      dt.style.height = (100 / zoom) + '%';
    }
  }

  function applyContrast() {
    document.documentElement.classList.toggle('a11y-contrast', state.contrast);
  }

  function applyReduceMotion() {
    document.documentElement.classList.toggle('a11y-reduce-motion', state.reduce_motion);
  }

  function applyFocusRing() {
    document.documentElement.classList.toggle('a11y-focus-ring', state.focus_ring);
  }

  // ---------- Magnifier lens ----------
  var lensEl = null;
  var lensCanvas = null;
  var lensCtx = null;
  var LENS_SIZE = 220;
  var LENS_ZOOM = 2;

  function createLens() {
    if (lensEl) return;
    lensEl = document.createElement('canvas');
    lensEl.id = 'a11y-lens';
    lensEl.width = LENS_SIZE;
    lensEl.height = LENS_SIZE;
    lensEl.style.cssText =
      'position:fixed;pointer-events:none;z-index:2147483646;' +
      'border-radius:50%;border:3px solid #ffd400;' +
      'box-shadow:0 0 0 2px #000,0 8px 24px rgba(0,0,0,0.5);' +
      'display:none;background:#000;';
    document.body.appendChild(lensEl);
    lensCtx = lensEl.getContext('2d');
  }

  function positionLens(x, y) {
    if (!lensEl) return;
    lensEl.style.left = (x - LENS_SIZE / 2) + 'px';
    lensEl.style.top  = (y - LENS_SIZE / 2) + 'px';
  }

  function drawLens() {
    // The lens is a visual aid. Because we can't read the framebuffer
    // from a canvas in this context (no screen capture API), the lens
    // instead displays a magnified *zoom card* of the current element
    // under the cursor — its text, in large type.
    if (!lensCtx || !lensEl) return;
    var el = document.elementFromPoint(lastMouseX, lastMouseY);
    var label = '';
    var sub = '';
    if (el) {
      label = (el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('data-a'))) || '';
      if (!label) label = (el.textContent || '').trim().slice(0, 40);
      if (!label && el.tagName) label = el.tagName.toLowerCase();
      sub = el.tagName ? el.tagName.toLowerCase() : '';
    }
    lensCtx.clearRect(0, 0, LENS_SIZE, LENS_SIZE);
    lensCtx.fillStyle = '#0d0d0d';
    lensCtx.fillRect(0, 0, LENS_SIZE, LENS_SIZE);
    lensCtx.fillStyle = '#ffd400';
    lensCtx.font = 'bold 22px system-ui, sans-serif';
    lensCtx.textAlign = 'center';
    lensCtx.textBaseline = 'middle';

    // wrap
    var words = label.split(/\s+/);
    var lines = [];
    var line = '';
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (lensCtx.measureText(t).width > LENS_SIZE - 30 && line) {
        lines.push(line);
        line = words[i];
      } else line = t;
    }
    if (line) lines.push(line);

    var totalH = lines.length * 26;
    var y0 = LENS_SIZE / 2 - totalH / 2 + 13;
    for (var j = 0; j < lines.length; j++) {
      lensCtx.fillText(lines[j], LENS_SIZE / 2, y0 + j * 26);
    }
    lensCtx.fillStyle = '#888';
    lensCtx.font = '11px system-ui, sans-serif';
    lensCtx.fillText(sub.toUpperCase(), LENS_SIZE / 2, LENS_SIZE - 18);
  }

  var lastMouseX = 0, lastMouseY = 0;
  var lensRaf = null;

  function onMouseMoveLens(e) {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    if (!state.lens) return;
    positionLens(e.clientX, e.clientY);
    if (lensRaf) return;
    lensRaf = requestAnimationFrame(function () {
      lensRaf = null;
      drawLens();
    });
  }

  function enableLens() {
    createLens();
    if (lensEl) lensEl.style.display = 'block';
    window.addEventListener('mousemove', onMouseMoveLens, { passive: true });
  }

  function disableLens() {
    if (lensEl) lensEl.style.display = 'none';
    window.removeEventListener('mousemove', onMouseMoveLens);
  }

  // ---------- Narrator ----------
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    var voices = speechSynthesis.getVoices();
    if (!voices || !voices.length) return null;
    // Prefer an English voice, fallback to first
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].lang && voices[i].lang.toLowerCase().indexOf('en') === 0) return voices[i];
    }
    return voices[0];
  }

  function speak(text) {
    if (!state.narrator || !text) return;
    if (!('speechSynthesis' in window)) return;
    text = String(text).trim();
    if (!text) return;
    // Debounce identical strings (avoid re-reading "Files" 20×)
    var now = Date.now();
    if (text === lastSpoken && now - lastSpokenAt < 1200) return;
    lastSpoken = text;
    lastSpokenAt = now;

    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      if (narratorVoice) u.voice = narratorVoice;
      u.rate = 1.05;
      u.pitch = 1;
      u.volume = 1;
      speechSynthesis.speak(u);
    } catch (e) { console.warn('Speech error:', e); }
  }

  function describeElement(el) {
    if (!el || !el.tagName) return '';
    var tag = el.tagName.toLowerCase();
    var label =
      el.getAttribute('aria-label') ||
      el.getAttribute('title') ||
      el.getAttribute('alt') ||
      (el.value && tag === 'input' ? el.value : '') ||
      (el.textContent || '').trim().slice(0, 120);
    var role = el.getAttribute('role') || '';
    var type = el.getAttribute('type') || '';
    var suffix = '';
    if (tag === 'button') suffix = ' button';
    else if (tag === 'a') suffix = ' link';
    else if (tag === 'input') suffix = ' input ' + (type || 'text');
    else if (tag === 'select') suffix = ' dropdown';
    else if (tag === 'textarea') suffix = ' text area';
    else if (tag === 'img') suffix = ' image';
    else if (role) suffix = ' ' + role;
    return (label + suffix).trim();
  }

  function onMouseOverNarrator(e) {
    if (!state.narrator) return;
    var el = e.target;
    if (!el || el === lastHoverEl) return;
    lastHoverEl = el;
    speak(describeElement(el));
  }
  var lastHoverEl = null;

  function onFocusNarrator(e) {
    if (!state.narrator) return;
    speak(describeElement(e.target));
  }

  function onClickNarrator(e) {
    if (!state.narrator) return;
    var el = e.target;
    if (!el) return;
    // Re-announce the element on click (in case it changed)
    var desc = describeElement(el);
    if (desc) speak(desc);
  }

  function enableNarrator() {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }
    narratorVoice = pickVoice();
    if (!narratorVoice) {
      // Voices load asynchronously on some browsers
      speechSynthesis.onvoiceschanged = function () {
        narratorVoice = pickVoice();
      };
    }
    document.addEventListener('mouseover', onMouseOverNarrator, true);
    document.addEventListener('focus', onFocusNarrator, true);
    document.addEventListener('click', onClickNarrator, true);
    speak('Narrator on');
  }

  function disableNarrator() {
    document.removeEventListener('mouseover', onMouseOverNarrator, true);
    document.removeEventListener('focus', onFocusNarrator, true);
    document.removeEventListener('click', onClickNarrator, true);
    try { speechSynthesis.cancel(); } catch (e) {}
    lastHoverEl = null;
  }

  // ---------- Public API ----------
  function applyAll() {
    applyTextSize();
    applyZoom();
    applyContrast();
    applyReduceMotion();
    applyFocusRing();
    if (state.lens) enableLens(); else disableLens();
    if (state.narrator) enableNarrator(); else disableNarrator();
  }

  function set(key, value) {
    if (!(key in state)) return;
    if (key === 'zoom')     value = Math.max(100, Math.min(300, parseInt(value, 10) || 100));
    if (key === 'textsize') value = Math.max(80,  Math.min(250, parseInt(value, 10) || 100));

    var wasNarrator = state.narrator;
    var wasLens = state.lens;

    state[key] = value;
    save();

    if (key === 'narrator') {
      if (value && !wasNarrator) enableNarrator();
      if (!value && wasNarrator) disableNarrator();
    } else if (key === 'lens') {
      if (value && !wasLens) enableLens();
      if (!value && wasLens) disableLens();
    } else {
      applyAll();
    }

    window.dispatchEvent(new CustomEvent('a11ychange', { detail: { key: key, value: value, state: state } }));
  }

  function toggle(key) { set(key, !state[key]); }
  function get(key) { return state[key]; }
  function all() { return Object.assign({}, state); }

  // ---------- Keyboard shortcuts ----------
  document.addEventListener('keydown', function (e) {
    if (!e.ctrlKey || !e.altKey) return;
    var k = (e.key || '').toLowerCase();
    if (k === 'n') { e.preventDefault(); toggle('narrator'); }
    else if (k === 'm') { e.preventDefault(); toggle('magnifier'); }
    else if (e.key === '=' || e.key === '+') { e.preventDefault(); set('textsize', state.textsize + 10); }
    else if (e.key === '-') { e.preventDefault(); set('textsize', state.textsize - 10); }
  });

  // ---------- Init ----------
  function init() {
    load();
    applyAll();
    console.log('Accessibility ready — narrator:', state.narrator, '| magnifier:', state.magnifier, '| text size:', state.textsize + '%');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-apply on window resize (keeps magnifier in place)
  window.addEventListener('resize', function () { if (state.magnifier) applyZoom(); });

  window.A11y = {
    set: set,
    toggle: toggle,
    get: get,
    all: all,
    speak: speak,
    applyAll: applyAll
  };
})();

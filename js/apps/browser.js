// ============================================================
//  browser.js — Browser app for OpencoreOS
//  Full URL bar, back/forward/reload, error detection
// ============================================================

function openBrowser(){
  var win = makeWindow('browser', 'Browser', '🌐',
    '<div id="br-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:12px;">'
      + '<div style="padding:8px 10px;border-bottom:1px solid #2a2a2a;display:flex;gap:6px;align-items:center;background:#1a1a1a;">'
        + '<button type="button" id="br-back" title="Back" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;width:30px;height:30px;border-radius:6px;cursor:pointer;font-size:14px;">‹</button>'
        + '<button type="button" id="br-forward" title="Forward" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;width:30px;height:30px;border-radius:6px;cursor:pointer;font-size:14px;">›</button>'
        + '<button type="button" id="br-reload" title="Reload" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;width:30px;height:30px;border-radius:6px;cursor:pointer;font-size:14px;">↻</button>'
        + '<input id="br-url" type="text" placeholder="Enter URL or search..." '
          + 'style="flex:1;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);'
          + 'color:#fff;padding:8px 12px;border-radius:6px;outline:none;font-size:12px;'
          + 'box-sizing:border-box;"/>'
        + '<button type="button" id="br-go" style="background:#0078d4;border:none;color:#fff;'
          + 'padding:8px 18px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">Go</button>'
        + '<button type="button" id="br-newtab" title="Open in new tab" style="background:rgba(255,255,255,0.06);'
          + 'border:1px solid rgba(255,255,255,0.12);color:#fff;width:30px;height:30px;'
          + 'border-radius:6px;cursor:pointer;font-size:13px;">🔗</button>'
      + '</div>'
      + '<div id="br-content" style="flex:1;position:relative;background:#fff;overflow:hidden;">'
        + '<div id="br-welcome" style="position:absolute;inset:0;display:flex;flex-direction:column;'
          + 'align-items:center;justify-content:center;background:#1a1a1a;color:#888;text-align:center;padding:40px;">'
          + '<div style="font-size:64px;margin-bottom:20px;">🌐</div>'
          + '<div style="font-size:16px;color:#fff;margin-bottom:8px;">OpencoreOS Browser</div>'
          + '<div style="font-size:12px;max-width:400px;line-height:1.6;">'
            + 'Type a URL in the bar above and press <b>Go</b>.<br>'
            + 'Note: many sites block embedding inside other apps. If a site fails to load, click 🔗 to open it in a new tab.'
          + '</div>'
        + '</div>'
        + '<iframe id="br-frame" '
          + 'style="position:absolute;inset:0;width:100%;height:100%;border:none;background:#fff;display:none;" '
          + 'referrerpolicy="no-referrer-when-downgrade" '
          + 'allow="clipboard-read; clipboard-write; fullscreen; autoplay; encrypted-media; picture-in-picture" '
          + 'sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-storage-access-by-user-activation allow-top-navigation-by-user-activation">'
        + '</iframe>'
        + '<div id="br-error" style="position:absolute;inset:0;display:none;flex-direction:column;'
          + 'align-items:center;justify-content:center;background:#1a1a1a;color:#ccc;text-align:center;padding:40px;">'
          + '<div style="font-size:56px;margin-bottom:16px;">⚠️</div>'
          + '<div style="font-size:15px;color:#ff8a8a;font-weight:600;margin-bottom:10px;">This site refused to load</div>'
          + '<div id="br-error-msg" style="font-size:12px;color:#888;max-width:440px;line-height:1.6;margin-bottom:20px;"></div>'
          + '<button type="button" id="br-error-newtab" style="background:#0078d4;border:none;color:#fff;'
            + 'padding:10px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;margin-bottom:8px;">'
            + '🔗 Open in New Tab</button>'
          + '<div style="font-size:11px;color:#666;max-width:400px;line-height:1.6;">'
            + 'Many popular sites (Google, YouTube, Reddit, etc.) set X-Frame-Options or CSP headers that block embedding.'
          + '</div>'
        + '</div>'
      + '</div>'
      + '<div id="br-status" style="padding:5px 12px;border-top:1px solid #2a2a2a;background:#1a1a1a;'
        + 'color:#666;font-size:11px;display:flex;justify-content:space-between;">'
        + '<span id="br-status-text">Ready</span>'
        + '<span id="br-status-url"></span>'
      + '</div>'
    + '</div>', 900, 640);

  var c = win.querySelector('#br-app');
  var urlIn = c.querySelector('#br-url');
  var goBtn = c.querySelector('#br-go');
  var backBtn = c.querySelector('#br-back');
  var fwdBtn = c.querySelector('#br-forward');
  var reloadBtn = c.querySelector('#br-reload');
  var newtabBtn = c.querySelector('#br-newtab');
  var frame = c.querySelector('#br-frame');
  var welcome = c.querySelector('#br-welcome');
  var errorEl = c.querySelector('#br-error');
  var errorMsg = c.querySelector('#br-error-msg');
  var errorNewTab = c.querySelector('#br-error-newtab');
  var statusText = c.querySelector('#br-status-text');
  var statusUrl = c.querySelector('#br-status-url');

  var history = [];
  var histIdx = -1;
  var currentUrl = '';
  var loadTimer = null;

  // ---------- Normalize URL ----------
  function normalizeUrl(input) {
    input = (input || '').trim();
    if (!input) return '';

    // If it looks like a URL, use it as-is
    if (/^https?:\/\//i.test(input)) return input;

    // If it's a bare domain like "google.com", prepend https://
    if (/^[a-z0-9-]+\.[a-z0-9-]+/i.test(input) && input.indexOf(' ') === -1) {
      return 'https://' + input;
    }

    // Otherwise treat it as a search query
    return 'https://duckduckgo.com/?q=' + encodeURIComponent(input);
  }

  // ---------- Update nav buttons ----------
  function updateNav() {
    backBtn.style.opacity = histIdx > 0 ? '1' : '0.4';
    fwdBtn.style.opacity = histIdx < history.length - 1 ? '1' : '0.4';
    backBtn.disabled = histIdx <= 0;
    fwdBtn.disabled = histIdx >= history.length - 1;
  }

  // ---------- Detect if the iframe loaded ----------
  function checkLoadSuccess() {
    // Cross-origin iframes throw on access, so we can only reliably
    // detect "blocked by X-Frame-Options" by checking whether the
    // iframe's contentWindow is still accessible AND its location.
    // Most blocked sites will render a blank frame.
    try {
      var doc = frame.contentDocument;
      if (doc && doc.body && doc.body.innerHTML.trim() === '') {
        showError('The site loaded but appears to be empty — it may have blocked embedding.', currentUrl);
      }
    } catch (e) {
      // Cross-origin — this is normal for successful loads, we can't check
    }
  }

  // ---------- Show error ----------
  function showError(msg, url) {
    frame.style.display = 'none';
    welcome.style.display = 'none';
    errorEl.style.display = 'flex';
    errorMsg.textContent = msg;
    statusText.textContent = 'Blocked';
    statusUrl.textContent = url || '';
    errorNewTab.onclick = function () {
      if (url) window.open(url, '_blank', 'noopener');
    };
  }

  // ---------- Load a URL ----------
  function loadUrl(rawInput, skipHistory) {
    var url = normalizeUrl(rawInput);
    if (!url) return;

    currentUrl = url;
    urlIn.value = rawInput || url;

    if (!skipHistory) {
      history = history.slice(0, histIdx + 1);
      history.push({ input: rawInput || url, url: url });
      histIdx = history.length - 1;
    }
    updateNav();

    // Show the frame, hide welcome + error
    welcome.style.display = 'none';
    errorEl.style.display = 'none';
    frame.style.display = 'block';
    statusText.textContent = 'Loading…';
    statusUrl.textContent = url;

    // Clear any pending check
    if (loadTimer) clearTimeout(loadTimer);

    // Set the frame src
    try {
      frame.src = url;
    } catch (e) {
      showError('Could not load the URL: ' + e.message, url);
      return;
    }

    // After 8 seconds, check whether the frame appears blank
    loadTimer = setTimeout(function () {
      if (frame.style.display !== 'none') {
        try {
          var doc = frame.contentDocument;
          if (doc && doc.body && doc.body.innerHTML.trim().length < 20) {
            // Very likely blocked
            showError(
              'The site appears blank — this usually means it blocks being embedded in another app (via X-Frame-Options or Content-Security-Policy headers).',
              url
            );
          } else if (doc) {
            statusText.textContent = 'Loaded';
          } else {
            // Cross-origin — assume success
            statusText.textContent = 'Loaded';
          }
        } catch (e) {
          // Cross-origin — assume success
          statusText.textContent = 'Loaded';
        }
      }
    }, 8000);
  }

  // ---------- Wire buttons ----------
  function doGo() {
    var v = urlIn.value;
    if (!v) return;
    loadUrl(v, false);
  }

  goBtn.onclick = doGo;
  urlIn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      doGo();
    }
  });

  backBtn.onclick = function () {
    if (histIdx > 0) {
      histIdx--;
      var entry = history[histIdx];
      loadUrl(entry.url, true);
      urlIn.value = entry.input;
      updateNav();
    }
  };

  fwdBtn.onclick = function () {
    if (histIdx < history.length - 1) {
      histIdx++;
      var entry = history[histIdx];
      loadUrl(entry.url, true);
      urlIn.value = entry.input;
      updateNav();
    }
  };

  reloadBtn.onclick = function () {
    if (currentUrl) {
      loadUrl(currentUrl, true);
    }
  };

  newtabBtn.onclick = function () {
    if (currentUrl) window.open(currentUrl, '_blank', 'noopener');
  };

  updateNav();
  urlIn.focus();

  return win;
}

window.openBrowser = openBrowser;

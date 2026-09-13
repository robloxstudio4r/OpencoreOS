// ============================================================
//  browser.js — Browser app with Airplane Mode support
// ============================================================

function openBrowser(){
  // Airplane Mode check
  if (window.AirplaneMode && !window.AirplaneMode.canLoadIframe()) {
    var win = makeWindow('browser', 'Browser', '🌐',
      '<div id="br-app">' + window.AirplaneMode.blockMessage() + '</div>', 800, 600);
    var c = win.querySelector('#br-app');
    if (window.AirplaneMode.wireDisableButton) window.AirplaneMode.wireDisableButton(c);
    // Re-render if user turns Airplane Mode off while this window is open
    var handler = function (e) {
      if (!e.detail.on) {
        window.removeEventListener('airplanemodechange', handler);
        c.innerHTML = '<p style="padding:20px;color:#888;">Airplane Mode off. Close and reopen the Browser.</p>';
      }
    };
    window.addEventListener('airplanemodechange', handler);
    return win;
  }

  // Normal browser app (your existing code goes here — iframe, URL bar, etc.)
  var win = makeWindow('browser', 'Browser', '🌐',
    '<div id="br-app" style="display:flex;flex-direction:column;height:100%;">'
      + '<div style="display:flex;gap:6px;padding:8px;border-bottom:1px solid rgba(255,255,255,0.06);">'
        + '<input id="br-url" placeholder="Enter URL..." style="flex:1;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:6px 10px;border-radius:6px;outline:none;font-size:12px;"/>'
        + '<button type="button" id="br-go" style="background:#0078d4;border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;">Go</button>'
      + '</div>'
      + '<iframe id="br-frame" style="flex:1;border:none;background:#fff;" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>'
    + '</div>', 800, 600);
  var c = win.querySelector('#br-app');
  var url = c.querySelector('#br-url');
  var frame = c.querySelector('#br-frame');
  function go() {
    var u = url.value.trim();
    if (!u) return;
    if (u.indexOf('http') !== 0) u = 'https://' + u;
    frame.src = u;
  }
  c.querySelector('#br-go').onclick = go;
  url.addEventListener('keydown', function(e){ if (e.key === 'Enter') go(); });

  // If Airplane Mode turns on while this window is open, blank the iframe
  window.addEventListener('airplanemodechange', function (e) {
    if (e.detail.on) {
      try { frame.src = 'about:blank'; } catch (err) {}
      c.innerHTML = window.AirplaneMode.blockMessage();
      if (window.AirplaneMode.wireDisableButton) window.AirplaneMode.wireDisableButton(c);
    }
  });

  return win;
}

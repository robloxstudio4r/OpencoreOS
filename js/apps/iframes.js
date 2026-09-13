// ============================================================
//  iframes.js — Generic iframe viewer with Airplane Mode support
// ============================================================

function openIframes(url, title){
  url = url || '';
  title = title || 'Iframes';

  // Airplane Mode check
  if (window.AirplaneMode && !window.AirplaneMode.canLoadIframe()) {
    var win = makeWindow('iframes', title, '🖼️',
      '<div id="if-app">' + window.AirplaneMode.blockMessage() + '</div>', 800, 600);
    var c = win.querySelector('#if-app');
    if (window.AirplaneMode.wireDisableButton) window.AirplaneMode.wireDisableButton(c);
    return win;
  }

  var win = makeWindow('iframes', title, '🖼️',
    '<div id="if-app" style="height:100%;">'
      + '<iframe id="if-frame" src="' + url + '" style="width:100%;height:100%;border:none;background:#fff;" '
        + 'sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>'
    + '</div>', 800, 600);
  var c = win.querySelector('#if-app');
  var frame = c.querySelector('#if-frame');

  // Live-block if Airplane Mode flips on
  window.addEventListener('airplanemodechange', function (e) {
    if (e.detail.on) {
      try { frame.src = 'about:blank'; } catch (err) {}
      c.innerHTML = window.AirplaneMode.blockMessage();
      if (window.AirplaneMode.wireDisableButton) window.AirplaneMode.wireDisableButton(c);
    }
  });

  return win;
}

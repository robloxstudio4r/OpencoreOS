// ============================================================
//  iframes.js — Generic iframe viewer + makeIframeApp wrapper
// ============================================================

// Simple iframe viewer: open a URL in a window
function openIframes(url, title){
  url = url || '';
  title = title || 'Iframes';

  var win = makeWindow('iframes', title, '🖼️',
    '<div id="if-app" style="height:100%;">'
      + '<iframe id="if-frame" src="' + url + '" style="width:100%;height:100%;border:none;background:#fff;" '
        + 'sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>'
    + '</div>', 800, 600);

  return win;
}

// Wrapper used by launcher.js: makeIframeApp(id, title, icon, url)
function makeIframeApp(id, title, icon, url){
  id = id || 'iframe';
  title = title || 'App';
  icon = icon || '🖼️';
  url = url || 'about:blank';

  var win = makeWindow(id, title, icon,
    '<div id="ifa-' + id + '" style="display:flex;flex-direction:column;height:100%;background:#fff;">'
      + '<div style="padding:6px 10px;background:#141414;color:#bbb;font-size:11px;'
        + 'border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:8px;">'
        + '<span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + url + '</span>'
        + '<button type="button" id="ifa-' + id + '-reload" '
          + 'style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);'
          + 'color:#fff;padding:3px 10px;border-radius:5px;cursor:pointer;font-size:11px;">Reload</button>'
        + '<button type="button" id="ifa-' + id + '-open" '
          + 'style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);'
          + 'color:#fff;padding:3px 10px;border-radius:5px;cursor:pointer;font-size:11px;">Open in tab</button>'
      + '</div>'
      + '<iframe id="ifa-' + id + '-frame" src="' + url + '" '
        + 'style="flex:1;border:none;background:#fff;width:100%;" '
        + 'sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads" '
        + 'allow="camera; microphone; autoplay; encrypted-media; fullscreen; clipboard-read; clipboard-write">'
      + '</iframe>'
    + '</div>', 900, 620);

  var c = win.querySelector('#ifa-' + id);
  var frame = c.querySelector('#ifa-' + id + '-frame');
  var reloadBtn = c.querySelector('#ifa-' + id + '-reload');
  var openBtn = c.querySelector('#ifa-' + id + '-open');

  if (reloadBtn) reloadBtn.onclick = function(){
    try { frame.src = frame.src; } catch(e){}
  };
  if (openBtn) openBtn.onclick = function(){
    window.open(url, '_blank', 'noopener');
  };

  return win;
}

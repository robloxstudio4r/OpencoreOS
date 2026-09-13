// ============================================================
//  iframes.js — Generic iframe viewer for OpencoreOS
// ============================================================

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

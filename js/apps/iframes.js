function makeIframeApp(appId, title, icon, url){
  return makeWindow(appId, title, icon,
    '<div style="flex:1;display:flex;flex-direction:column;">'
    + '<iframe src="' + url + '" style="flex:1;border:none;border-radius:6px;background:white;" sandbox="allow-scripts allow-forms allow-same-origin allow-popups"></iframe>'
    + '<div style="margin-top:8px;font-size:11px;color:#666;">If not loading, <a href="' + url + '" target="_blank" style="color:#4dabf7;">open in new tab</a>.</div>'
    + '</div>', 820, 620);
}

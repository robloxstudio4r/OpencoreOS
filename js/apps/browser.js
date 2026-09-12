function openBrowser(){
  var win = makeWindow('browser', 'Browser', '🌐',
    '<div class="bar">'
    + '<button data-b="refresh">⟳</button>'
    + '<button data-b="home">🏠</button>'
    + '<input id="br-url" value="https://example.com"/>'
    + '<button data-b="go">Go</button></div>'
    + '<div id="br-frame" style="flex:1;background:#0a0a1a;border-radius:4px;min-height:250px;"></div>', 720, 520);
  var url = win.querySelector('#br-url');
  var frame = win.querySelector('#br-frame');
  function load(u){
    if(u.indexOf('http://') !== 0 && u.indexOf('https://') !== 0) u = 'https://' + u;
    frame.innerHTML = '<div style="padding:20px;text-align:center;color:#888;">Loading ' + u + '...</div>';
    var f = document.createElement('iframe');
    f.src = u;
    f.style.cssText = 'width:100%;height:100%;border:none;border-radius:4px;background:white;';
    f.setAttribute('sandbox', 'allow-scripts allow-forms allow-same-origin allow-popups');
    frame.innerHTML = '';
    frame.appendChild(f);
    url.value = u;
  }
  win.querySelector('[data-b="go"]').onclick = function(){ load(url.value); };
  url.addEventListener('keydown', function(e){ if(e.key === 'Enter') load(url.value); });
  win.querySelector('[data-b="refresh"]').onclick = function(){ load(url.value); };
  win.querySelector('[data-b="home"]').onclick = function(){ load('https://example.com'); };
  setTimeout(function(){ load('https://example.com'); }, 100);
}

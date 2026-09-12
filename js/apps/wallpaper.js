function openWallpaper(){
  var presets = [
    {n:'Ocean', v:'radial-gradient(ellipse at 20% 20%,#1a2a6c,#0a0a2a)'},
    {n:'Sunset', v:'radial-gradient(ellipse at 20% 20%,#ff6b6b,#1a1a2e)'},
    {n:'Forest', v:'radial-gradient(ellipse at 20% 20%,#2d6a4f,#0a1a0a)'},
    {n:'Midnight', v:'radial-gradient(ellipse at 20% 20%,#0f3460,#000)'},
    {n:'Cyber', v:'radial-gradient(ellipse at 20% 20%,#00d2ff,#3a7bd5,#0a0a1a)'},
    {n:'Fire', v:'radial-gradient(ellipse at 20% 20%,#ff512f,#dd2476,#0a0a1a)'},
    {n:'Mint', v:'radial-gradient(ellipse at 20% 20%,#7fdbca,#1a1a2e)'},
    {n:'Lavender', v:'radial-gradient(ellipse at 20% 20%,#b8a9d4,#1a1a2e)'},
    {n:'Galaxy', v:'radial-gradient(ellipse at 20% 20%,#1a1a2e,#16213e,#0f3460,#000)'},
    {n:'Aurora', v:'linear-gradient(135deg,#00c9ff,#92fe9d)'},
    {n:'Twilight', v:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)'},
    {n:'Blood', v:'linear-gradient(135deg,#200122,#6f0000)'}
  ];
  var win = makeWindow('wallpaper', 'Wallpaper', '🖼️',
    '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;max-height:400px;overflow-y:auto;" id="wp-g"></div>', 500, 440);
  var g = win.querySelector('#wp-g');
  var cur = LS.getItem('oc_wallpaper');
  var html = '';
  for(var i=0; i<presets.length; i++){
    var p = presets[i];
    html += '<div class="bgp' + (cur === p.v ? ' sel' : '') + '" style="background:' + p.v + '" data-v="' + p.v + '">' + p.n + '</div>';
  }
  g.innerHTML = html;
  var items = g.querySelectorAll('.bgp');
  for(var j=0; j<items.length; j++){
    (function(el){
      el.onclick = function(){
        var d = $('dt'); if(d) d.style.background = el.getAttribute('data-v');
        LS.setItem('oc_wallpaper', el.getAttribute('data-v'));
        for(var k=0; k<items.length; k++) items[k].classList.remove('sel');
        el.classList.add('sel');
      };
    })(items[j]);
  }
}

function openClock(){
  var win = makeWindow('clock', 'Clock', '🕐',
    '<div style="font-size:68px;font-weight:300;text-align:center;padding:20px 0;" id="ck-t">00:00:00</div>'
    + '<div style="text-align:center;color:#888;" id="ck-d"></div>', 320, 240);
  var t = win.querySelector('#ck-t'); var d = win.querySelector('#ck-d');
  function u(){ var n = new Date(); t.textContent = n.toLocaleTimeString(); d.textContent = n.toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'}); }
  u();
  var iv = setInterval(u, 1000);
  var closeBtn = win.querySelector('.close');
  if(closeBtn) closeBtn.addEventListener('click', function(){ clearInterval(iv); });
}

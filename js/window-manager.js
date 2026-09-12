function makeWindow(appId, title, icon, html, w, h){
  w = w || 500; h = h || 350;
  var existing = null;
  for(var i=0; i<ST.windows.length; i++) if(ST.windows[i].appId === appId) existing = ST.windows[i];
  if(existing){
    if(existing.min){ existing.min = false; existing.el.style.display = 'flex'; }
    existing.el.style.zIndex = ++ST.z;
    updateTaskbar();
    return existing.el;
  }
  var id = 'win-' + (++ST.counter);
  var win = document.createElement('div');
  win.className = 'win';
  win.id = id;
  win.style.width = w + 'px';
  win.style.height = h + 'px';
  var left = Math.max(10, Math.min(window.innerWidth - w - 20, 40 + ST.windows.length * 30));
  var top = Math.max(10, Math.min(window.innerHeight - h - 70, 40 + ST.windows.length * 25));
  win.style.left = left + 'px';
  win.style.top = top + 'px';
  win.style.zIndex = ++ST.z;
  win.innerHTML = '<div class="wh"><span class="wt">' + icon + ' ' + title + '</span>'
    + '<div class="wc2"><button class="min">─</button><button class="max">⬜</button><button class="close">✕</button></div></div>'
    + '<div class="wb">' + html + '</div>';
  document.body.appendChild(win);

  var head = win.querySelector('.wh');
  var drag = false, dx = 0, dy = 0;
  head.onmousedown = function(e){
    if(e.target.closest('.wc2')) return;
    drag = true;
    var r = win.getBoundingClientRect();
    dx = e.clientX - r.left;
    dy = e.clientY - r.top;
    win.style.zIndex = ++ST.z;
  };
  document.addEventListener('mousemove', function(e){
    if(!drag) return;
    var x = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dx));
    var y = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dy));
    win.style.left = x + 'px';
    win.style.top = y + 'px';
  });
  document.addEventListener('mouseup', function(){ drag = false; });

  win.querySelector('.close').onclick = function(){ closeWindow(id); };
  win.querySelector('.min').onclick = function(){ minimizeWindow(id); };
  win.querySelector('.max').onclick = function(){
    if(win.style.width === (window.innerWidth - 4) + 'px'){
      win.style.width = w + 'px'; win.style.height = h + 'px';
      win.style.left = '40px'; win.style.top = '40px';
    } else {
      win.style.width = (window.innerWidth - 4) + 'px';
      win.style.height = (window.innerHeight - 54) + 'px';
      win.style.left = '0'; win.style.top = '0';
    }
  };
  win.onmousedown = function(){ win.style.zIndex = ++ST.z; };

  ST.windows.push({id:id, appId:appId, el:win, min:false});
  updateTaskbar();
  return win;
}

function closeWindow(id){
  var idx = -1;
  for(var i=0; i<ST.windows.length; i++) if(ST.windows[i].id === id) idx = i;
  if(idx === -1) return;
  var w = ST.windows[idx];
  if(w.el._stream && w.el._stream.getTracks) w.el._stream.getTracks().forEach(function(t){ t.stop(); });
  if(w.el._audioCtx) try { w.el._audioCtx.close(); } catch(e){}
  w.el.remove();
  ST.windows.splice(idx, 1);
  updateTaskbar();
}

function minimizeWindow(id){
  for(var i=0; i<ST.windows.length; i++){
    if(ST.windows[i].id === id){
      ST.windows[i].min = !ST.windows[i].min;
      ST.windows[i].el.style.display = ST.windows[i].min ? 'none' : 'flex';
      updateTaskbar();
      return;
    }
  }
}

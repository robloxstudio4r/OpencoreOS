function openCamera(){
  var win = makeWindow('camera', 'Camera', '📷',
    '<video class="cv" id="cam-v" autoplay playsinline></video>'
    + '<div class="cc"><button class="pri" id="cam-cap">Capture</button>'
    + '<button id="cam-flip">Flip</button>'
    + '<button class="dan" id="cam-close">Close</button></div>'
    + '<div class="cg2" id="cam-gal"></div>', 560, 520);
  var video = win.querySelector('#cam-v'), gal = win.querySelector('#cam-gal'), stream = null, facing = 'user';
  var existing = VFS.list('/Pictures') || [];
  for(var i=0; i<existing.length; i++){
    var f = existing[i]; if(f.type !== 'file') continue;
    var d = VFS.read('/Pictures/' + f.name);
    if(d && d.indexOf('data:image') === 0){
      var img = document.createElement('img'); img.src = d; img.title = f.name;
      (function(dataUrl){ img.onclick = function(){ openImageViewer(dataUrl); }; })(d);
      gal.appendChild(img);
    }
  }
  function start(f){
    if(stream) stream.getTracks().forEach(function(t){ t.stop(); });
    navigator.mediaDevices.getUserMedia({video:{facingMode:f, width:{ideal:1280}}}).then(function(s){ stream = s; video.srcObject = s; win._stream = s; }).catch(function(e){ video.style.cssText = 'width:100%;height:200px;display:flex;align-items:center;justify-content:center;color:#ff6b6b;background:#0a0a1a;border-radius:6px;'; video.textContent = 'Camera denied: ' + e.message; });
  }
  start(facing);
  win.querySelector('#cam-cap').onclick = function(){
    if(!stream) return;
    var c = document.createElement('canvas'); c.width = video.videoWidth || 1280; c.height = video.videoHeight || 720;
    c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
    var url = c.toDataURL('image/png');
    var name = 'photo_' + Date.now() + '.png';
    if(VFS.write('/Pictures/' + name, url)){
      var img = document.createElement('img'); img.src = url; img.title = name;
      (function(dataUrl){ img.onclick = function(){ openImageViewer(dataUrl); }; })(url);
      gal.insertBefore(img, gal.firstChild); openImageViewer(url);
    } else alert('Save failed');
  };
  win.querySelector('#cam-flip').onclick = function(){ facing = facing === 'user' ? 'environment' : 'user'; start(facing); };
  win.querySelector('#cam-close').onclick = function(){ if(stream) stream.getTracks().forEach(function(t){ t.stop(); }); closeWindow(win.id); };
}

function openFiles(path){
  var win = makeWindow('files', 'Files', '📁', '', 640, 440);
  renderFiles(win, path || '/');
}

function fileIcon(name){
  var e = name.split('.').pop().toLowerCase();
  var m = {png:'🖼️',jpg:'🖼️',jpeg:'🖼️',gif:'🖼️',webp:'🖼️',txt:'📄',md:'📄',json:'📄',js:'📄',html:'🌐',css:'🎨',mp3:'🎵',wav:'🎵',webm:'🔊',mp4:'🎬',oc:'📦'};
  return m[e] || '📄';
}

function renderFiles(win, path){
  var body = win.querySelector('.wb'); if(!body) return;
  var items = VFS.list(path) || [];
  items.sort(function(a,b){
    if(a.type === 'folder' && b.type !== 'folder') return -1;
    if(a.type !== 'folder' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });
  var isSys = path.indexOf('/System32') === 0;
  var html = '<div class="bar">'
    + '<button data-a="back">⬅ Back</button>'
    + '<button data-a="home">🏠 Home</button>'
    + '<button data-a="mkdir">📁 New Folder</button>'
    + '<button data-a="newfile">📄 New File</button>'
    + '<button data-a="newoc">📦 New .oc</button>'
    + (isSys ? '<span style="color:#ff6b6b;font-size:11px;font-weight:bold;">PROTECTED</span>' : '')
    + '<span style="color:#666;font-size:11px;margin-left:auto;">' + path + '</span>'
    + '</div><div class="fg">';
  for(var i=0; i<items.length; i++){
    var item = items[i];
    var ic = item.type === 'folder' ? '📁' : fileIcon(item.name);
    var lockIcon = item.locked ? ' 🔒' : '';
    html += '<div class="fi" data-name="' + item.name + '" data-type="' + item.type + '"><span class="ic">' + ic + '</span><span>' + item.name + lockIcon + '</span></div>';
  }
  if(items.length === 0) html += '<p style="color:#666;padding:20px;">Empty folder</p>';
  html += '</div>';
  body.innerHTML = html;

  var barButtons = body.querySelectorAll('[data-a]');
  for(var j=0; j<barButtons.length; j++){
    (function(b){
      b.onclick = function(){
        var a = b.getAttribute('data-a');
        if(a === 'back' && path !== '/'){
          var parent = path.split('/').slice(0,-1).join('/') || '/';
          renderFiles(win, parent);
        } else if(a === 'home'){ renderFiles(win, '/'); }
        else if(a === 'mkdir'){
          var n = prompt('Folder name:'); if(!n) return;
          var p = (path === '/' ? '' : path) + '/' + n;
          if(VFS.mkdir(p)) renderFiles(win, path);
        } else if(a === 'newfile'){
          var n2 = prompt('File name:'); if(!n2) return;
          var p2 = (path === '/' ? '' : path) + '/' + n2;
          if(VFS.write(p2, '')) renderFiles(win, path);
        } else if(a === 'newoc'){
          var n3 = prompt('New .oc file name (must end in .oc):'); if(!n3) return;
          if(n3.indexOf('.oc') === -1) n3 += '.oc';
          var pw = prompt('Password for this file (leave empty for none):') || '';
          var content = prompt('Content (text or base64):') || 'Sample .oc content';
          var typeOfContent = prompt('Original file type (txt/png/jpg/wav):') || 'txt';
          var wrapper = JSON.stringify({type:typeOfContent, content:content, _oc:true});
          var p3 = (path === '/' ? '' : path) + '/' + n3;
          if(VFS.write(p3, wrapper, pw)) renderFiles(win, path);
        }
      };
    })(barButtons[j]);
  }

  var fileItems = body.querySelectorAll('.fi');
  for(var k=0; k<fileItems.length; k++){
    (function(el){
      el.ondblclick = function(){
        var name = el.getAttribute('data-name');
        var type = el.getAttribute('data-type');
        var newPath = (path === '/' ? '' : path) + '/' + name;
        if(type === 'folder'){
          if(newPath.indexOf('/System32') === 0){
            var p = prompt('🔑 Admin PIN:');
            if(p !== 'devil.9oce'){ alert('Wrong PIN'); return; }
          }
          renderFiles(win, newPath);
        } else {
          if(!VFS.checkPassword(newPath)) return;
          var c = VFS.read(newPath);
          if(name.indexOf('.oc') !== -1){
            try {
              var parsed = JSON.parse(c);
              if(parsed._oc){
                if(parsed.type === 'txt') launch('notepad', {path:newPath, content:parsed.content || ''});
                else if(/^(png|jpg|jpeg|gif|webp)$/.test(parsed.type)) openImageViewer(parsed.content);
                else alert('📦 .oc file (' + parsed.type + '):\n\n' + String(parsed.content).substring(0,500));
                return;
              }
            } catch(e){}
          }
          if(name.indexOf('.txt') !== -1 || name.indexOf('.') === -1){
            launch('notepad', {path:newPath, content:c || ''});
          } else if(/\.(png|jpg|jpeg|gif|webp)$/i.test(name)){
            openImageViewer(c);
          } else {
            alert('File: ' + name + '\n\n' + (c || '').substring(0, 500));
          }
        }
      };
    })(fileItems[k]);
  }
}

function openImageViewer(dataUrl){
  var existing = null;
  for(var i=0; i<ST.windows.length; i++) if(ST.windows[i].appId === 'imageviewer') existing = ST.windows[i];
  if(existing) closeWindow(existing.id);
  makeWindow('imageviewer', 'Image Viewer', '🖼️',
    '<div style="display:flex;align-items:center;justify-content:center;height:100%;"><img src="' + dataUrl + '" style="max-width:100%;max-height:100%;object-fit:contain;"/></div>', 540, 420);
}

function openNotepad(opts){
  var path = (opts && opts.path) ? opts.path : '/Documents/note.txt';
  var content = (opts && opts.content !== undefined) ? opts.content : (VFS.read(path) || '');
  var name = path.split('/').pop();
  var win = makeWindow('notepad', 'Notepad - ' + name, '📝',
    '<textarea id="np-text">' + content + '</textarea>'
    + '<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">'
    + '<button class="btn" id="np-save">Save</button>'
    + '<button class="btn2" id="np-saveas">Save As...</button>'
    + '<button class="btn2" id="np-saveoc">Save as .oc</button>'
    + '<button class="btn2" id="np-lock">Set Password</button>'
    + '</div>', 520, 400);
  var ta = win.querySelector('#np-text');
  var cp = path;
  win.querySelector('#np-save').onclick = function(){ if(VFS.write(cp, ta.value)) alert('Saved to ' + cp); else alert('Failed'); };
  win.querySelector('#np-saveas').onclick = function(){ var np = prompt('Save as path:', cp); if(!np) return; if(VFS.write(np, ta.value)){ cp = np; alert('Saved to ' + np); } else alert('Failed'); };
  win.querySelector('#np-saveoc').onclick = function(){
    var base = cp.split('/').pop().replace(/\.[^.]+$/, '');
    var ocName = prompt('Save as .oc name:', base + '.oc

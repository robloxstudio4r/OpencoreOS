function openAudioPlayer(){
  var win = makeWindow('audioplayer', 'Audio Player', '🔊', '<div id="ap-c"></div>', 520, 400);
  var c = win.querySelector('#ap-c');
  function render(){
    var files = VFS.list('/Audio') || [];
    var audioFiles = [];
    for(var i=0; i<files.length; i++) if(files[i].type === 'file') audioFiles.push(files[i]);
    if(audioFiles.length === 0){ c.innerHTML = '<p style="color:#888;text-align:center;padding:30px;">No audio files yet.</p>'; return; }
    c.innerHTML = '<p style="color:#888;font-size:11px;margin-bottom:10px;">' + audioFiles.length + ' file(s)</p>';
    for(var j=0; j<audioFiles.length; j++){
      var f = audioFiles[j];
      var d = VFS.read('/Audio/' + f.name);
      var div = document.createElement('div'); div.className = 'ai';
      div.innerHTML = '<div class="nm">🔊 ' + f.name + '</div><audio controls src="' + d + '"></audio><button class="dl" data-name="' + f.name + '">Del</button>';
      c.appendChild(div);
    }
    var delBtns = c.querySelectorAll('.dl');
    for(var k=0; k<delBtns.length; k++){
      (function(b){
        b.onclick = function(){ if(confirm('Delete?')){ VFS.del('/Audio/' + b.getAttribute('data-name')); render(); } };
      })(delBtns[k]);
    }
  }
  render();
}

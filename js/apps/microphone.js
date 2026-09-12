function openMicrophone(){
  var win = makeWindow('microphone', 'Microphone', '🎤',
    '<canvas class="av" id="mic-v"></canvas>'
    + '<div class="cc"><button class="pri" id="mic-start">Record</button>'
    + '<button class="dan" id="mic-stop">Stop</button>'
    + '<button id="mic-save" style="background:#0078d4;">Save</button></div>'
    + '<div class="ms" id="mic-status">Click "Record" to start.</div>', 500, 380);
  var canvas = win.querySelector('#mic-v'); var ctx = canvas.getContext('2d');
  var status = win.querySelector('#mic-status');
  var audioCtx, analyser, anim, stream, recorder, chunks = [];
  function draw(){
    if(!analyser) return;
    var data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    var bw = (w / data.length) * 2.5;
    for(var i=0; i<data.length; i++){
      var bh = (data[i] / 255) * h;
      ctx.fillStyle = 'hsl(' + (i / data.length * 240 + 200) + ', 80%, 50%)';
      ctx.fillRect(i * (bw + 1), h - bh, bw, bh);
    }
    anim = requestAnimationFrame(draw);
  }
  win.querySelector('#mic-start').onclick = function(){
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){
      stream = s; win._stream = s;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      win._audioCtx = audioCtx;
      analyser = audioCtx.createAnalyser(); analyser.fftSize = 256;
      audioCtx.createMediaStreamSource(s).connect(analyser);
      canvas.width = canvas.clientWidth * 2; canvas.height = canvas.clientHeight * 2;
      if(audioCtx.state === 'suspended') audioCtx.resume();
      chunks = [];
      var mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      recorder = new MediaRecorder(s, {mimeType: mime});
      recorder.ondataavailable = function(e){ if(e.data.size > 0) chunks.push(e.data); };
      recorder.start(500); draw();
      status.textContent = 'Recording...';
    }).catch(function(e){ status.textContent = 'Mic denied: ' + e.message; });
  };
  win.querySelector('#mic-stop').onclick = function(){
    if(anim) cancelAnimationFrame(anim);
    if(recorder && recorder.state === 'recording') recorder.stop();
    if(audioCtx) try { audioCtx.close(); } catch(e){}
    if(stream) stream.getTracks().forEach(function(t){ t.stop(); });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    status.textContent = 'Stopped. Click "Save".';
  };
  win.querySelector('#mic-save').onclick = function(){
    if(chunks.length === 0) return alert('Record first!');
    var blob = new Blob(chunks, {type:'audio/webm'});
    var r = new FileReader();
    r.onload = function(e){
      var name = 'recording_' + Date.now() + '.webm';
      if(VFS.write('/Audio/' + name, e.target.result)) alert('Saved to /Audio/' + name);
      else alert('Failed');
    };
    r.readAsDataURL(blob);
  };
}

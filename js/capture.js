// ============================================================
//  capture.js — Screenshot & screen recording for OpencoreOS
//  Tray buttons: #tray-shot (📷)  #tray-rec (⭐)
//  Uses getDisplayMedia / MediaRecorder / getUserMedia
// ============================================================

(function () {
  'use strict';

  var recording = null;      // MediaRecorder instance
  var recChunks = [];
  var recStream = null;
  var recStartTs = 0;
  var recPulseEl = null;

  // ---------- Helpers ----------
  function ensureFolder(path) {
    // Create folder chain in VFS
    var parts = path.split('/').filter(Boolean);
    var cur = '';
    for (var i = 0; i < parts.length; i++) {
      cur += '/' + parts[i];
      if (!VFS.getNode(cur)) VFS.mkdir(cur);
    }
  }

  function timestamp() {
    function p(n) { return String(n).padStart(2, '0'); }
    var d = new Date();
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
         + '_' + p(d.getHours()) + '-' + p(d.getMinutes()) + '-' + p(d.getSeconds());
  }

  function toast(msg, actionLabel, actionFn) {
    var el = document.createElement('div');
    el.style.cssText =
      'position:fixed;bottom:60px;left:50%;transform:translateX(-50%);' +
      'background:rgba(20,22,28,0.95);color:#fff;padding:10px 16px;' +
      'border-radius:10px;font-family:system-ui,sans-serif;font-size:13px;' +
      'z-index:2147483646;box-shadow:0 8px 24px rgba(0,0,0,0.4);' +
      'border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;gap:12px;';
    el.innerHTML = '<span>' + msg + '</span>';
    if (actionLabel && actionFn) {
      var b = document.createElement('button');
      b.textContent = actionLabel;
      b.style.cssText =
        'background:#1db954;border:none;color:#fff;padding:5px 12px;' +
        'border-radius:5px;cursor:pointer;font-size:12px;font-weight:600;';
      b.onclick = function () {
        try { actionFn(); } catch (e) { console.warn(e); }
        el.remove();
      };
      el.appendChild(b);
    }
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.remove(); }, 8000);
  }

  // ---------- Ask user what to capture ----------
  function pickSource(callback) {
    // Build a small modal to choose
    var overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:2147483645;' +
      'display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
    var box = document.createElement('div');
    box.style.cssText =
      'background:#1a1c22;color:#fff;padding:20px;border-radius:12px;min-width:340px;' +
      'border:1px solid rgba(255,255,255,0.1);box-shadow:0 12px 40px rgba(0,0,0,0.6);';
    box.innerHTML = '<div style="font-size:15px;font-weight:600;margin-bottom:14px;">Choose what to capture</div>';

    var opts = [
      { key: 'screen',  label: '🖥️  Full screen',        hint: 'Everything on your display' },
      { key: 'window',  label: '🪟  Window',              hint: 'Pick a window or tab' },
      { key: 'region',  label: '✂️  Region',              hint: 'Draw a rectangle after capture' },
      { key: 'camera',  label: '📷  Camera',              hint: 'Use your webcam instead' }
    ];

    for (var i = 0; i < opts.length; i++) {
      (function (o) {
        var row = document.createElement('button');
        row.type = 'button';
        row.style.cssText =
          'display:block;width:100%;text-align:left;background:rgba(255,255,255,0.04);' +
          'border:1px solid rgba(255,255,255,0.1);color:#fff;padding:10px 14px;' +
          'border-radius:8px;cursor:pointer;margin-bottom:6px;font-size:13px;' +
          'font-family:inherit;';
        row.onmouseenter = function () { row.style.background = 'rgba(29,185,84,0.15)'; };
        row.onmouseleave = function () { row.style.background = 'rgba(255,255,255,0.04)'; };
        row.innerHTML = '<div>' + o.label + '</div><div style="color:#888;font-size:11px;margin-top:2px;">' + o.hint + '</div>';
        row.onclick = function () {
          overlay.remove();
          callback(o.key);
        };
        box.appendChild(row);
      })(opts[i]);
    }

    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Cancel';
    cancel.style.cssText =
      'margin-top:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);' +
      'color:#fff;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:12px;width:100%;';
    cancel.onclick = function () { overlay.remove(); };
    box.appendChild(cancel);

    overlay.appendChild(box);
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  }

  // ---------- Get a MediaStream ----------
  function getStream(kind, callback) {
    var opts;
    if (kind === 'camera') {
      opts = { video: { width: 1280, height: 720 }, audio: false };
      navigator.mediaDevices.getUserMedia(opts)
        .then(function (s) { callback(s, 'camera'); })
        .catch(function (err) { console.warn('Camera error:', err); alert('Camera error: ' + err.message); });
      return;
    }
    opts = { video: true, audio: false };
    if (kind === 'window') {
      opts.video = { displaySurface: 'window' };
    } else if (kind === 'screen') {
      opts.video = { displaySurface: 'monitor' };
    } else if (kind === 'region') {
      // Region = we still capture the screen and crop afterwards
      opts.video = { displaySurface: 'monitor' };
    }
    navigator.mediaDevices.getDisplayMedia(opts)
      .then(function (s) { callback(s, kind); })
      .catch(function (err) { console.warn('Capture cancelled:', err); });
  }

  // ---------- Region selector ----------
  function regionSelect(imageDataURL, callback) {
    // Show the captured frame fullscreen; user drags a rectangle
    var overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;background:#000;z-index:2147483646;cursor:crosshair;' +
      'display:flex;align-items:center;justify-content:center;';
    var img = new Image();
    img.style.cssText = 'max-width:100%;max-height:100%;user-select:none;pointer-events:none;';
    img.src = imageDataURL;
    overlay.appendChild(img);

    var sel = document.createElement('div');
    sel.style.cssText =
      'position:fixed;border:2px dashed #1db954;background:rgba(29,185,84,0.15);' +
      'pointer-events:none;display:none;';
    overlay.appendChild(sel);

    var start = null;

    function onDown(e) {
      start = { x: e.clientX, y: e.clientY };
      sel.style.display = 'block';
      sel.style.left = start.x + 'px';
      sel.style.top = start.y + 'px';
      sel.style.width = '0px';
      sel.style.height = '0px';
    }
    function onMove(e) {
      if (!start) return;
      var x = Math.min(start.x, e.clientX);
      var y = Math.min(start.y, e.clientY);
      var w = Math.abs(e.clientX - start.x);
      var h = Math.abs(e.clientY - start.y);
      sel.style.left = x + 'px';
      sel.style.top = y + 'px';
      sel.style.width = w + 'px';
      sel.style.height = h + 'px';
    }
    function onUp(e) {
      if (!start) return;
      var rect = sel.getBoundingClientRect();
      overlay.remove();
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);

      if (rect.width < 4 || rect.height < 4) { callback(null); return; }

      // Convert client rect → image pixel coordinates
      var imgRect = img.getBoundingClientRect();
      var scaleX = img.naturalWidth / imgRect.width;
      var scaleY = img.naturalHeight / imgRect.height;
      var sx = (rect.left - imgRect.left) * scaleX;
      var sy = (rect.top - imgRect.top) * scaleY;
      var sw = rect.width * scaleX;
      var sh = rect.height * scaleY;

      var tmp = document.createElement('canvas');
      tmp.width = Math.round(sw);
      tmp.height = Math.round(sh);
      var tmpCtx = tmp.getContext('2d');
      var full = new Image();
      full.onload = function () {
        tmpCtx.drawImage(full, sx, sy, sw, sh, 0, 0, tmp.width, tmp.height);
        callback(tmp.toDataURL('image/png'));
      };
      full.src = imageDataURL;
    }

    document.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.appendChild(overlay);
  }

  // ---------- Screenshot flow ----------
  function takeScreenshot() {
    pickSource(function (kind) {
      getStream(kind, function (stream, srcKind) {
        var video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.play();

        // Wait for first frame
        var tries = 0;
        function waitReady() {
          if (video.videoWidth > 0 && video.readyState >= 2) {
            grabFrame();
          } else if (tries++ < 60) {
            setTimeout(waitReady, 50);
          } else {
            stopStream();
            alert('Could not read video frame.');
          }
        }

        function grabFrame() {
          var w = video.videoWidth, h = video.videoHeight;
          var cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(video, 0, 0, w, h);
          var dataURL = cv.toDataURL('image/png');

          if (srcKind === 'region') {
            stopStream();
            regionSelect(dataURL, function (cropped) {
              if (!cropped) return;
              saveShot(cropped);
            });
          } else {
            stopStream();
            saveShot(dataURL);
          }
        }

        function stopStream() {
          try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
        }

        waitReady();
      });
    });
  }

  function saveShot(dataURL) {
    ensureFolder('/Pictures/Screenshots');
    var name = 'shot-' + timestamp() + '.png';
    var path = '/Pictures/Screenshots/' + name;
    var ok = VFS.write(path, dataURL);
    if (ok) {
      toast('Screenshot saved — ' + name, 'View', function () { openImageViewer(path); });
    } else {
      alert('Failed to save screenshot');
    }
  }

  // ---------- Recording flow ----------
  function startRecording() {
    if (recording && recording.state !== 'inactive') {
      stopRecording();
      return;
    }
    pickSource(function (kind) {
      var opts = { video: true, audio: false };
      if (kind === 'window') opts.video = { displaySurface: 'window' };
      else if (kind === 'screen' || kind === 'region') opts.video = { displaySurface: 'monitor' };
      else if (kind === 'camera') {
        // camera-only recording
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(beginRec)
          .catch(function (e) { alert('Camera error: ' + e.message); });
        return;
      }

      navigator.mediaDevices.getDisplayMedia(opts)
        .then(function (stream) {
          // Ask about mic
          if (confirm('Include microphone audio?')) {
            navigator.mediaDevices.getUserMedia({ audio: true }).then(function (mic) {
              mic.getAudioTracks().forEach(function (t) { stream.addTrack(t); });
              beginRec(stream);
            }).catch(function () { beginRec(stream); });
          } else {
            beginRec(stream);
          }
        })
        .catch(function (err) { console.warn('Recording cancelled:', err); });
    });
  }

  function beginRec(stream) {
    recChunks = [];
    recStream = stream;
    var mime = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';

    try {
      recording = new MediaRecorder(stream, { mimeType: mime });
    } catch (e) {
      recording = new MediaRecorder(stream);
    }
    recStartTs = Date.now();

    recording.ondataavailable = function (e) {
      if (e.data && e.data.size > 0) recChunks.push(e.data);
    };
    recording.onstop = function () {
      var blob = new Blob(recChunks, { type: recording.mimeType || 'video/webm' });
      var reader = new FileReader();
      reader.onload = function () {
        var dataURL = reader.result;
        ensureFolder('/Pictures/Recordings');
        var name = 'rec-' + timestamp() + '.webm';
        var path = '/Pictures/Recordings/' + name;
        var ok = VFS.write(path, dataURL);
        toast(
          ok ? 'Recording saved — ' + name : 'Save failed',
          'View',
          function () { openRecordedVideo(path); }
        );
      };
      reader.readAsDataURL(blob);

      try { recStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
      recStream = null;
      recording = null;
      endRecPulse();
    };

    recording.start(1000); // chunk every second
    startRecPulse();
    toast('Recording started — click ⭐ again to stop');
  }

  function stopRecording() {
    if (recording && recording.state !== 'inactive') {
      try { recording.stop(); } catch (e) { console.warn(e); }
    }
  }

  // ---------- Recording pulse in the tray ----------
  function startRecPulse() {
    var el = document.getElementById('tray-rec');
    if (!el) return;
    el.textContent = '🔴';
    el.title = 'Recording — click to stop';
    el.style.animation = 'oc-rec-pulse 1s ease-in-out infinite';
    ensurePulseStyle();
    recPulseEl = el;
  }

  function endRecPulse() {
    var el = document.getElementById('tray-rec');
    if (!el) return;
    el.textContent = '⭐';
    el.title = 'Start recording';
    el.style.animation = '';
    recPulseEl = null;
  }

  function ensurePulseStyle() {
    if (document.getElementById('oc-rec-pulse-style')) return;
    var s = document.createElement('style');
    s.id = 'oc-rec-pulse-style';
    s.textContent = '@keyframes oc-rec-pulse{0%,100%{opacity:1}50%{opacity:0.3}}';
    document.head.appendChild(s);
  }

  // ---------- Recorded video viewer ----------
  function openRecordedVideo(path) {
    var dataURL = VFS.read(path);
    if (!dataURL) return alert('Could not read recording.');

    var win = makeWindow('recplay', 'Recording', '🎬',
      '<div style="display:flex;flex-direction:column;height:100%;background:#000;color:#fff;font-family:system-ui,sans-serif;">'
      + '<div style="padding:8px 12px;background:#141414;border-bottom:1px solid #2a2a2a;font-size:12px;">' + path + '</div>'
      + '<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:10px;">'
      +   '<video src="' + dataURL + '" controls style="max-width:100%;max-height:100%;background:#000;"></video>'
      + '</div>'
      + '<div style="padding:8px 12px;background:#141414;border-top:1px solid #2a2a2a;display:flex;gap:8px;">'
      +   '<button id="rec-dl" style="background:#0078d4;border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;">Download</button>'
      +   '<button id="rec-del" style="background:transparent;border:1px solid #664;color:#ff8a8a;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;">Delete</button>'
      + '</div>'
      + '</div>', 720, 520);
    var c = win.querySelector('div[style*="flex-direction:column"]');
    var dl = c.querySelector('#rec-dl');
    var del = c.querySelector('#rec-del');
    if (dl) dl.onclick = function () {
      var a = document.createElement('a');
      a.href = dataURL;
      a.download = path.split('/').pop();
      a.click();
    };
    if (del) del.onclick = function () {
      if (!confirm('Delete this recording?')) return;
      VFS.del(path);
      win.remove();
    };
    return win;
  }

  // ---------- Gallery ----------
  function openCapturesGallery() {
    var shots = [];
    var recs = [];
    var sList = VFS.list('/Pictures/Screenshots') || [];
    var rList = VFS.list('/Pictures/Recordings') || [];
    for (var i = 0; i < sList.length; i++) if (sList[i].type === 'file') shots.push('/Pictures/Screenshots/' + sList[i].name);
    for (var j = 0; j < rList.length; j++) if (rList[j].type === 'file') recs.push('/Pictures/Recordings/' + rList[j].name);

    var win = makeWindow('gallery', 'Captures', '📸',
      '<div id="gal-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;">'
      + '<div style="padding:8px 12px;border-bottom:1px solid #2a2a2a;display:flex;gap:8px;">'
      +   '<button type="button" id="gal-tab-shots" style="background:#0078d4;border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;">Screenshots (' + shots.length + ')</button>'
      +   '<button type="button" id="gal-tab-recs" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;">Recordings (' + recs.length + ')</button>'
      + '</div>'
      + '<div id="gal-grid" style="flex:1;overflow-y:auto;padding:12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;"></div>'
      + '</div>', 720, 520);

    var grid = win.querySelector('#gal-grid');
    var tabShots = win.querySelector('#gal-tab-shots');
    var tabRecs = win.querySelector('#gal-tab-recs');

    function renderTab(list, isVideo) {
      grid.innerHTML = '';
      if (!list.length) {
        grid.innerHTML = '<div style="color:#666;font-size:12px;padding:20px;">Nothing here yet.</div>';
        return;
      }
      for (var i = 0; i < list.length; i++) {
        (function (path) {
          var card = document.createElement('div');
          card.style.cssText =
            'background:#0d0d0d;border:1px solid #2a2a2a;border-radius:8px;overflow:hidden;' +
            'cursor:pointer;position:relative;';
          var media;
          if (isVideo) {
            media = document.createElement('video');
            media.src = VFS.read(path);
            media.muted = true;
            media.preload = 'metadata';
          } else {
            media = document.createElement('img');
            media.src = VFS.read(path);
          }
          media.style.cssText = 'width:100%;height:100px;object-fit:cover;background:#000;display:block;';
          card.appendChild(media);

          var label = document.createElement('div');
          label.style.cssText = 'padding:6px 8px;font-size:11px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:#141414;';
          label.textContent = path.split('/').pop();
          card.appendChild(label);

          card.onclick = function () {
            if (isVideo) openRecordedVideo(path);
            else if (typeof openImageViewer === 'function') openImageViewer(path);
            else alert('Image viewer not available');
          };
          grid.appendChild(card);
        })(list[i]);
      }
    }

    tabShots.onclick = function () {
      tabShots.style.background = '#0078d4';
      tabShots.style.border = 'none';
      tabRecs.style.background = 'rgba(255,255,255,0.06)';
      tabRecs.style.border = '1px solid rgba(255,255,255,0.1)';
      renderTab(shots, false);
    };
    tabRecs.onclick = function () {
      tabRecs.style.background = '#0078d4';
      tabRecs.style.border = 'none';
      tabShots.style.background = 'rgba(255,255,255,0.06)';
      tabShots.style.border = '1px solid rgba(255,255,255,0.1)';
      renderTab(recs, true);
    };
    renderTab(shots, false);
    return win;
  }

  // ---------- Public API ----------
  window.Capture = {
    screenshot: takeScreenshot,
    startRecording: startRecording,
    stopRecording: stopRecording,
    isRecording: function () { return !!(recording && recording.state !== 'inactive'); },
    openGallery: openCapturesGallery
  };

  console.log('Capture module loaded');
})();

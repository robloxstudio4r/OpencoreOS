// ============================================================
//  photoeditor.js — Photo & Video editor for OpencoreOS v10.4
//  Features: brush, shapes, text, eraser, crop, rotate,
//  flip, filters, undo/redo, video frame snapping, VFS save.
// ============================================================

function openPhotoEditor(){
  var win = makeWindow('photoeditor', 'Photo & Video Editor', '🎨',
    '<div id="pe-app" style="display:flex;flex-direction:column;height:100%;background:#1a1a1a;color:#ddd;font-family:system-ui,sans-serif;font-size:12px;overflow:hidden;">'
    + '<div id="pe-toolbar" style="display:flex;flex-wrap:wrap;gap:4px;padding:6px 8px;border-bottom:1px solid #2a2a2a;background:#141414;align-items:center;"></div>'
    + '<div id="pe-body" style="flex:1;display:flex;overflow:hidden;">'
      + '<div id="pe-canvas-wrap" style="flex:1;overflow:auto;display:flex;align-items:center;justify-content:center;background:#0d0d0d;position:relative;">'
        + '<div id="pe-empty" style="color:#555;text-align:center;padding:40px;">'
          + '<div style="font-size:56px;margin-bottom:14px;">🖼️</div>'
          + '<div style="font-size:14px;color:#888;margin-bottom:6px;">No image loaded</div>'
          + '<div style="font-size:11px;">Click <b>Open</b> to load a photo or video</div>'
        + '</div>'
        + '<canvas id="pe-canvas" style="display:none;max-width:100%;max-height:100%;box-shadow:0 0 0 1px #333;"></canvas>'
        + '<video id="pe-video" style="display:none;max-width:100%;max-height:100%;background:#000;" controls></video>'
      + '</div>'
      + '<div id="pe-side" style="width:220px;border-left:1px solid #2a2a2a;background:#141414;padding:10px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;"></div>'
    + '</div>'
    + '<div id="pe-status" style="padding:4px 10px;border-top:1px solid #2a2a2a;background:#141414;font-size:11px;color:#888;"></div>'
    + '</div>', 900, 640);

  var c = win.querySelector('#pe-app');
  var toolbar = c.querySelector('#pe-toolbar');
  var side    = c.querySelector('#pe-side');
  var canvas  = c.querySelector('#pe-canvas');
  var video   = c.querySelector('#pe-video');
  var emptyEl = c.querySelector('#pe-empty');
  var status  = c.querySelector('#pe-status');

  var ctx = canvas.getContext('2d');
  var mode = 'image';   // 'image' | 'video'

  // -------- History --------
  var history = [];
  var histIdx = -1;
  var MAX_HIST = 30;

  function pushHistory() {
    if (mode !== 'image' || !canvas.width) return;
    history = history.slice(0, histIdx + 1);
    try {
      var snap = canvas.toDataURL('image/png');
      history.push(snap);
      if (history.length > MAX_HIST) history.shift();
      histIdx = history.length - 1;
    } catch (e) {}
  }

  function applyHistory(idx) {
    if (idx < 0 || idx >= history.length) return;
    var img = new Image();
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      histIdx = idx;
      updateStatus();
    };
    img.src = history[idx];
  }

  function undo() { if (histIdx > 0) applyHistory(histIdx - 1); }
  function redo() { if (histIdx < history.length - 1) applyHistory(histIdx + 1); }

  // -------- Tool state --------
  var tool = 'brush';
  var color = '#ff0066';
  var brushSize = 8;
  var filter = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0 };
  var filterOrigin = null; // snapshot before filter changes

  // -------- Load image --------
  function loadImage(src, name) {
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      mode = 'image';
      video.style.display = 'none';
      video.pause();
      canvas.style.display = 'block';
      emptyEl.style.display = 'none';
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      history = [];
      histIdx = -1;
      pushHistory();
      status.textContent = (name || 'image') + '  —  ' + img.width + '×' + img.height;
      renderToolbar();
      renderSide();
    };
    img.onerror = function () { alert('Could not load image.'); };
    img.src = src;
  }

  // -------- Load video --------
  function loadVideo(src, name) {
    mode = 'video';
    canvas.style.display = 'none';
    emptyEl.style.display = 'none';
    video.style.display = 'block';
    video.src = src;
    video.load();
    status.textContent = (name || 'video') + '  —  ready';
    renderToolbar();
    renderSide();
  }

  // -------- Load from file picker --------
  function openFromFile() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = function () {
      var f = input.files && input.files[0];
      if (!f) return;
      var url = URL.createObjectURL(f);
      if (f.type.indexOf('video') === 0) loadVideo(url, f.name);
      else loadImage(url, f.name);
    };
    input.click();
  }

  // -------- Load from VFS --------
  function openFromVFS() {
    var folders = ['Pictures', 'Documents', 'Audio'];
    var choices = [];
    for (var i = 0; i < folders.length; i++) {
      var list = VFS.list('/' + folders[i]);
      if (!list) continue;
      for (var j = 0; j < list.length; j++) {
        if (list[j].type === 'file') choices.push('/' + folders[i] + '/' + list[j].name);
      }
    }
    if (!choices.length) return alert('No files in Pictures/Documents/Audio.');

    var pick = prompt('Pick a file to open:\n\n' + choices.map(function (p, i) { return (i + 1) + '. ' + p; }).join('\n') + '\n\nEnter a number:');
    var idx = parseInt(pick, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= choices.length) return;

    var path = choices[idx];
    var content = VFS.read(path);
    if (!content) return alert('Could not read file.');

    // Try to detect data URL vs base64 vs text
    if (content.indexOf('data:image') === 0) loadImage(content, path);
    else if (content.indexOf('data:video') === 0) loadVideo(content, path);
    else if (/^[A-Za-z0-9+/=\s]+$/.test(content) && content.length > 100) {
      // Looks like base64 — guess image
      loadImage('data:image/png;base64,' + content.replace(/\s/g, ''), path);
    } else {
      alert('This file is not an image or video.');
    }
  }

  // -------- Snapshot current canvas to save --------
  function exportDataURL(type, quality) {
    if (mode !== 'image') return null;
    type = type || 'image/png';
    if (type === 'image/jpeg') return canvas.toDataURL('image/jpeg', quality || 0.9);
    return canvas.toDataURL('image/png');
  }

  function download() {
    if (mode !== 'image') return alert('Switch to an image first.');
    var url = exportDataURL('image/png');
    var a = document.createElement('a');
    a.href = url;
    a.download = 'edited-' + Date.now() + '.png';
    a.click();
    status.textContent = 'Downloaded';
  }

  function saveToVFS() {
    if (mode !== 'image') return alert('Switch to an image first.');
    var name = prompt('Save as (in /Pictures):', 'edited-' + Date.now() + '.png');
    if (!name) return;
    var dataURL = exportDataURL('image/png');
    var ok = VFS.write('/Pictures/' + name, dataURL);
    if (ok) { status.textContent = 'Saved to /Pictures/' + name; alert('Saved: /Pictures/' + name); }
    else alert('Save failed');
  }

  // -------- Toolbar --------
  function btn(label, onclick, opts) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.style.cssText =
      'background:' + (opts && opts.active ? '#0078d4' : 'rgba(255,255,255,0.06)') + ';' +
      'border:1px solid rgba(255,255,255,0.1);color:#fff;padding:5px 10px;' +
      'border-radius:5px;cursor:pointer;font-size:11px;font-family:inherit;' +
      (opts && opts.disabled ? 'opacity:0.5;cursor:default;' : '');
    b.disabled = !!(opts && opts.disabled);
    b.onclick = onclick;
    return b;
  }

  function renderToolbar() {
    toolbar.innerHTML = '';

    toolbar.appendChild(btn('📂 Open', openFromFile));
    toolbar.appendChild(btn('📁 VFS', openFromVFS));

    var sep = document.createElement('span');
    sep.style.cssText = 'width:1px;height:20px;background:#2a2a2a;margin:0 4px;';
    toolbar.appendChild(sep);

    if (mode === 'video') {
      toolbar.appendChild(btn('📸 Snap Frame', snapFrame));
      toolbar.appendChild(btn('▶/⏸', function () { if (video.paused) video.play(); else video.pause(); }));
      return;
    }

    // Image tools
    ['brush','eraser','line','rect','circle','text'].forEach(function (t) {
      toolbar.appendChild(btn({
        brush: '🖌 Brush',
        eraser: '🧽 Eraser',
        line: '➖ Line',
        rect: '▭ Rect',
        circle: '◯ Circle',
        text: '🅰 Text'
      }[t], function () { tool = t; renderToolbar(); renderSide(); }, { active: tool === t }));
    });

    var sep2 = document.createElement('span');
    sep2.style.cssText = 'width:1px;height:20px;background:#2a2a2a;margin:0 4px;';
    toolbar.appendChild(sep2);

    toolbar.appendChild(btn('↶ Undo', undo, { disabled: histIdx <= 0 }));
    toolbar.appendChild(btn('↷ Redo', redo, { disabled: histIdx >= history.length - 1 }));
    toolbar.appendChild(btn('↻ Rotate', rotate90));
    toolbar.appendChild(btn('⇄ Flip H', flipH));
    toolbar.appendChild(btn('⇅ Flip V', flipV));
    toolbar.appendChild(btn('✂ Crop', cropTool));
    toolbar.appendChild(btn('💾 Save', saveToVFS));
    toolbar.appendChild(btn('⬇ Download', download));
    toolbar.appendChild(btn('🗑 Clear', clearCanvas));
  }

  // -------- Side panel --------
  function renderSide() {
    side.innerHTML = '';

    function group(title) {
      var h = document.createElement('div');
      h.textContent = title;
      h.style.cssText = 'font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-top:4px;';
      side.appendChild(h);
    }

    function slider(label, min, max, value, oninput) {
      var wrap = document.createElement('div');
      wrap.innerHTML = '<div style="color:#aaa;margin-bottom:4px;">' + label + ': <span style="color:#fff;">' + value + '</span></div>';
      var inp = document.createElement('input');
      inp.type = 'range'; inp.min = min; inp.max = max; inp.value = value;
      inp.style.cssText = 'width:100%;';
      inp.oninput = function () {
        wrap.querySelector('span').textContent = inp.value;
        oninput(parseInt(inp.value, 10));
      };
      wrap.appendChild(inp);
      side.appendChild(wrap);
      return inp;
    }

    if (mode === 'image') {
      group('Brush');
      var colorWrap = document.createElement('div');
      colorWrap.innerHTML = '<div style="color:#aaa;margin-bottom:4px;">Color</div>';
      var colorInp = document.createElement('input');
      colorInp.type = 'color'; colorInp.value = color;
      colorInp.style.cssText = 'width:100%;height:32px;background:transparent;border:1px solid #2a2a2a;border-radius:5px;cursor:pointer;';
      colorInp.oninput = function () { color = colorInp.value; };
      colorWrap.appendChild(colorInp);
      side.appendChild(colorWrap);

      slider('Size', 1, 60, brushSize, function (v) { brushSize = v; });

      group('Filters');
      slider('Brightness', 0, 200, filter.brightness, function (v) { filter.brightness = v; applyFilters(); });
      slider('Contrast', 0, 200, filter.contrast, function (v) { filter.contrast = v; applyFilters(); });
      slider('Saturation', 0, 200, filter.saturation, function (v) { filter.saturation = v; applyFilters(); });
      slider('Grayscale', 0, 100, filter.grayscale, function (v) { filter.grayscale = v; applyFilters(); });
      slider('Sepia', 0, 100, filter.sepia, function (v) { filter.sepia = v; applyFilters(); });
      slider('Blur', 0, 20, filter.blur, function (v) { filter.blur = v; applyFilters(); });

      var resetF = btn('Reset Filters', function () {
        filter = { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, blur: 0 };
        filterOrigin = null;
        if (history[histIdx]) applyHistory(histIdx);
        renderSide();
      });
      resetF.style.width = '100%';
      resetF.style.marginTop = '6px';
      side.appendChild(resetF);

      group('History');
      var info = document.createElement('div');
      info.style.cssText = 'color:#888;font-size:11px;';
      info.textContent = (histIdx + 1) + ' / ' + history.length + ' steps';
      side.appendChild(info);
    } else if (mode === 'video') {
      group('Video');
      var info2 = document.createElement('div');
      info2.style.cssText = 'color:#888;font-size:11px;line-height:1.6;';
      info2.innerHTML =
        'Play the video, pause at the frame you want,<br>' +
        'then click <b>Snap Frame</b> to load that frame<br>' +
        'into the image editor for drawing.';
      side.appendChild(info2);

      var snap = btn('📸 Snap Frame', snapFrame);
      snap.style.width = '100%';
      snap.style.background = '#1db954';
      snap.style.marginTop = '6px';
      side.appendChild(snap);
    }
  }

  // -------- Drawing state --------
  var drawing = false;
  var startX = 0, startY = 0;
  var snapshot = null;

  function canvasPos(e) {
    var r = canvas.getBoundingClientRect();
    var scaleX = canvas.width / r.width;
    var scaleY = canvas.height / r.height;
    return {
      x: (e.clientX - r.left) * scaleX,
      y: (e.clientY - r.top) * scaleY
    };
  }

  canvas.addEventListener('mousedown', function (e) {
    if (mode !== 'image') return;
    drawing = true;
    var p = canvasPos(e);
    startX = p.x; startY = p.y;

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#000000' : color;
    ctx.fillStyle = color;
    ctx.lineWidth = brushSize;

    if (tool === 'brush' || tool === 'eraser') {
      ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    } else {
      // For shape tools, remember the current canvas so we can preview
      snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  });

  canvas.addEventListener('mousemove', function (e) {
    if (!drawing || mode !== 'image') return;
    var p = canvasPos(e);

    if (tool === 'brush' || tool === 'eraser') {
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      return;
    }

    if (snapshot) ctx.putImageData(snapshot, 0, 0);
    ctx.beginPath();
    if (tool === 'line') {
      ctx.moveTo(startX, startY);
      ctx.lineTo(p.x, p.y);
    } else if (tool === 'rect') {
      ctx.rect(startX, startY, p.x - startX, p.y - startY);
    } else if (tool === 'circle') {
      var rx = Math.abs(p.x - startX);
      var ry = Math.abs(p.y - startY);
      ctx.ellipse((startX + p.x) / 2, (startY + p.y) / 2, rx / 2, ry / 2, 0, 0, Math.PI * 2);
    }
    ctx.stroke();
  });

  canvas.addEventListener('mouseup', function (e) {
    if (!drawing) return;
    drawing = false;
    ctx.globalCompositeOperation = 'source-over';

    if (tool === 'text') {
      var p = canvasPos(e);
      var txt = prompt('Text to add:');
      if (txt) {
        ctx.font = brushSize * 4 + 'px system-ui, sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(txt, p.x, p.y);
      }
    }
    if (snapshot) { snapshot = null; }
    pushHistory();
    renderToolbar();
  });

  canvas.addEventListener('mouseleave', function () { drawing = false; ctx.globalCompositeOperation = 'source-over'; });

  // -------- Transforms --------
  function rotate90() {
    if (mode !== 'image') return;
    var tmp = document.createElement('canvas');
    tmp.width = canvas.height; tmp.height = canvas.width;
    var tctx = tmp.getContext('2d');
    tctx.translate(tmp.width / 2, tmp.height / 2);
    tctx.rotate(Math.PI / 2);
    tctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    canvas.width = tmp.width; canvas.height = tmp.height;
    ctx.drawImage(tmp, 0, 0);
    pushHistory(); renderToolbar();
  }

  function flipH() {
    if (mode !== 'image') return;
    var tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    var tctx = tmp.getContext('2d');
    tctx.translate(canvas.width, 0);
    tctx.scale(-1, 1);
    tctx.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tmp, 0, 0);
    pushHistory(); renderToolbar();
  }

  function flipV() {
    if (mode !== 'image') return;
    var tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    var tctx = tmp.getContext('2d');
    tctx.translate(0, canvas.height);
    tctx.scale(1, -1);
    tctx.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tmp, 0, 0);
    pushHistory(); renderToolbar();
  }

  function cropTool() {
    if (mode !== 'image') return;
    var w = parseInt(prompt('Crop width (px):', canvas.width), 10);
    if (!w || w < 1 || w > canvas.width) return;
    var h = parseInt(prompt('Crop height (px):', canvas.height), 10);
    if (!h || h < 1 || h > canvas.height) return;
    var x = parseInt(prompt('Crop X offset (px):', 0), 10) || 0;
    var y = parseInt(prompt('Crop Y offset (px):', 0), 10) || 0;
    var tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    tmp.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h);
    canvas.width = w; canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(tmp, 0, 0);
    pushHistory(); renderToolbar();
  }

  function clearCanvas() {
    if (mode !== 'image') return;
    if (!confirm('Clear the entire canvas?')) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushHistory();
  }

  // -------- Filters --------
  function applyFilters() {
    if (mode !== 'image') return;
    if (!filterOrigin) {
      // Save original pixels before applying filters
      filterOrigin = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    // Restore original, then apply CSS filter via temp canvas
    var tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    tmp.getContext('2d').putImageData(filterOrigin, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter =
      'brightness(' + filter.brightness + '%) ' +
      'contrast(' + filter.contrast + '%) ' +
      'saturate(' + filter.saturation + '%) ' +
      'grayscale(' + filter.grayscale + '%) ' +
      'sepia(' + filter.sepia + '%) ' +
      'blur(' + filter.blur + 'px)';
    ctx.drawImage(tmp, 0, 0);
    ctx.filter = 'none';
  }

  // -------- Video: snap frame --------
  function snapFrame() {
    if (mode !== 'video') return;
    var w = video.videoWidth, h = video.videoHeight;
    if (!w || !h) return alert('Video not ready yet.');
    var tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    tmp.getContext('2d').drawImage(video, 0, 0, w, h);
    var dataURL = tmp.toDataURL('image/png');

    // Switch to image mode with the snapped frame
    video.pause();
    video.style.display = 'none';
    canvas.style.display = 'block';
    mode = 'image';
    var img = new Image();
    img.onload = function () {
      canvas.width = w; canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);
      history = []; histIdx = -1;
      pushHistory();
      status.textContent = 'Snapped frame ' + w + '×' + h;
      renderToolbar(); renderSide();
    };
    img.src = dataURL;
  }

  function updateStatus() {
    if (mode === 'image' && canvas.width) {
      status.textContent = canvas.width + '×' + canvas.height + '  —  ' + (histIdx + 1) + '/' + history.length + ' steps';
    }
  }

  // Initial render
  renderToolbar();
  renderSide();
  status.textContent = 'Ready — click Open or VFS';

  return win;
}

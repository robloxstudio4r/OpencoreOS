// ============================================================
//  imageviewer.js — Image Viewer for OpencoreOS v10.4
//  Opens any image from a URL, data URL, or VFS path.
//  Features: zoom, pan, rotate, download, delete, next/prev.
// ============================================================

function openImageViewer(source, options){
  options = options || {};

  // ---------- Figure out what "source" is ----------
  // Can be: data:URL, http(s) URL, or VFS path like /Pictures/photo.png
  var initialSrc = '';
  var initialName = options.name || 'Image';
  var vfsPath = '';

  if (typeof source === 'string') {
    if (source.indexOf('data:image') === 0 || source.indexOf('http') === 0) {
      initialSrc = source;
    } else if (source.charAt(0) === '/') {
      // VFS path
      vfsPath = source;
      initialName = source.split('/').pop();
      try {
        initialSrc = VFS.read(source) || '';
      } catch (e) { initialSrc = ''; }
    }
  } else if (source && source.src) {
    initialSrc = source.src;
    initialName = source.alt || initialName;
  }

  // ---------- Gallery context ----------
  // If given a list of paths, allow next/prev navigation
  var gallery = options.gallery || null;   // array of paths or data URLs
  var galleryIndex = 0;
  if (gallery && gallery.length && vfsPath) {
    for (var i = 0; i < gallery.length; i++) {
      if (gallery[i] === vfsPath) { galleryIndex = i; break; }
    }
  }

  var zoom = 1;
  var rotation = 0;
  var panX = 0, panY = 0;

  // ---------- Window ----------
  var win = makeWindow('imageviewer', initialName, '🖼️',
    '<div id="iv-app" style="display:flex;flex-direction:column;height:100%;background:#0a0a0a;color:#ddd;font-family:system-ui,sans-serif;font-size:12px;">'
      + '<div id="iv-header" style="padding:6px 12px;border-bottom:1px solid #2a2a2a;background:#141414;display:flex;align-items:center;gap:8px;">'
        + '<button type="button" id="iv-prev" title="Previous" style="display:none;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">‹</button>'
        + '<div id="iv-title" style="flex:1;color:#fff;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"></div>'
        + '<button type="button" id="iv-zoomin" title="Zoom in" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">+</button>'
        + '<button type="button" id="iv-zoomout" title="Zoom out" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">−</button>'
        + '<button type="button" id="iv-rotate" title="Rotate 90°" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">↻</button>'
        + '<button type="button" id="iv-reset" title="Reset view" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">⟲</button>'
        + '<button type="button" id="iv-download" title="Download" style="background:#1e4d6b;border:none;color:#fff;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">⬇</button>'
        + '<button type="button" id="iv-open" title="Open in new tab" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">🔗</button>'
        + '<button type="button" id="iv-delete" title="Delete" style="display:none;background:rgba(255,80,80,0.12);border:1px solid rgba(255,80,80,0.3);color:#ff8a8a;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">🗑️</button>'
        + '<button type="button" id="iv-next" title="Next" style="display:none;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;">›</button>'
      + '</div>'
      + '<div id="iv-stage" style="flex:1;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#000;position:relative;cursor:grab;">'
        + '<img id="iv-img" style="max-width:none;max-height:none;user-select:none;pointer-events:none;transition:none;" draggable="false"/>'
        + '<div id="iv-empty" style="display:none;color:#666;text-align:center;padding:40px;">'
          + '<div style="font-size:56px;margin-bottom:12px;">🖼️</div>'
          + '<div>Could not load image.</div>'
        + '</div>'
      + '</div>'
      + '<div id="iv-status" style="padding:5px 12px;border-top:1px solid #2a2a2a;background:#141414;color:#888;font-size:11px;display:flex;justify-content:space-between;">'
        + '<span id="iv-info"></span>'
        + '<span id="iv-zoom-info"></span>'
      + '</div>'
    + '</div>', 720, 560);

  var c = win.querySelector('#iv-app');
  var titleEl = c.querySelector('#iv-title');
  var imgEl = c.querySelector('#iv-img');
  var emptyEl = c.querySelector('#iv-empty');
  var stage = c.querySelector('#iv-stage');
  var infoEl = c.querySelector('#iv-info');
  var zoomInfoEl = c.querySelector('#iv-zoom-info');
  var prevBtn = c.querySelector('#iv-prev');
  var nextBtn = c.querySelector('#iv-next');
  var delBtn = c.querySelector('#iv-delete');

  // Show navigation buttons if a gallery was given
  if (gallery && gallery.length > 1) {
    prevBtn.style.display = 'block';
    nextBtn.style.display = 'block';
  }
  if (vfsPath) {
    delBtn.style.display = 'block';
  }

  // ---------- Load image ----------
  function loadImage(src, name) {
    titleEl.textContent = name || initialName;
    if (win.querySelector('.wt')) win.querySelector('.wt').textContent = name || initialName;

    imgEl.style.opacity = '0';
    imgEl.onload = function () {
      imgEl.style.opacity = '1';
      emptyEl.style.display = 'none';
      resetView();
      infoEl.textContent = imgEl.naturalWidth + ' × ' + imgEl.naturalHeight + ' px';
    };
    imgEl.onerror = function () {
      imgEl.style.opacity = '0';
      emptyEl.style.display = 'block';
      infoEl.textContent = 'Failed to load.';
    };
    imgEl.src = src || '';
  }

  // ---------- Zoom / rotate / pan ----------
  function applyTransform() {
    imgEl.style.transform =
      'translate(' + panX + 'px,' + panY + 'px) ' +
      'scale(' + zoom + ') ' +
      'rotate(' + rotation + 'deg)';
    zoomInfoEl.textContent = Math.round(zoom * 100) + '%' + (rotation % 360 !== 0 ? ' · ' + rotation + '°' : '');
  }

  function resetView() {
    zoom = 1;
    rotation = 0;
    panX = 0;
    panY = 0;
    applyTransform();
  }

  c.querySelector('#iv-zoomin').onclick = function () { zoom = Math.min(8, zoom * 1.25); applyTransform(); };
  c.querySelector('#iv-zoomout').onclick = function () { zoom = Math.max(0.1, zoom / 1.25); applyTransform(); };
  c.querySelector('#iv-rotate').onclick = function () { rotation = (rotation + 90) % 360; applyTransform(); };
  c.querySelector('#iv-reset').onclick = resetView;

  // ---------- Pan via drag ----------
  var dragging = false;
  var dragStartX = 0, dragStartY = 0;
  var startPanX = 0, startPanY = 0;

  stage.onmousedown = function (e) {
    if (e.button !== 0) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    startPanX = panX;
    startPanY = panY;
    stage.style.cursor = 'grabbing';
    e.preventDefault();
  };
  document.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    panX = startPanX + (e.clientX - dragStartX);
    panY = startPanY + (e.clientY - dragStartY);
    applyTransform();
  });
  document.addEventListener('mouseup', function () {
    if (dragging) {
      dragging = false;
      stage.style.cursor = 'grab';
    }
  });

  // Wheel to zoom
  stage.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (e.deltaY < 0) zoom = Math.min(8, zoom * 1.15);
    else zoom = Math.max(0.1, zoom / 1.15);
    applyTransform();
  }, { passive: false });

  // Double-click to reset
  stage.addEventListener('dblclick', resetView);

  // ---------- Download ----------
  c.querySelector('#iv-download').onclick = function () {
    try {
      var a = document.createElement('a');
      a.href = imgEl.src;
      a.download = initialName || 'image';
      a.click();
    } catch (e) { alert('Could not download: ' + e.message); }
  };

  // ---------- Open in new tab ----------
  c.querySelector('#iv-open').onclick = function () {
    try { window.open(imgEl.src, '_blank', 'noopener'); } catch (e) {}
  };

  // ---------- Delete (only if it's a VFS file) ----------
  delBtn.onclick = function () {
    if (!vfsPath) return;
    if (!confirm('Delete "' + vfsPath + '"?')) return;
    try {
      VFS.del(vfsPath);
      win.remove();
    } catch (e) { alert('Could not delete: ' + e.message); }
  };

  // ---------- Gallery navigation ----------
  function showGalleryItem(idx) {
    if (!gallery || !gallery.length) return;
    if (idx < 0) idx = gallery.length - 1;
    if (idx >= gallery.length) idx = 0;
    galleryIndex = idx;
    var item = gallery[galleryIndex];
    var nm = item.split('/').pop();
    vfsPath = item.charAt(0) === '/' ? item : '';
    var src = '';
    if (item.indexOf('data:') === 0 || item.indexOf('http') === 0) {
      src = item;
    } else {
      try { src = VFS.read(item) || ''; } catch (e) { src = ''; }
    }
    delBtn.style.display = vfsPath ? 'block' : 'none';
    loadImage(src, nm);
  }

  prevBtn.onclick = function () { showGalleryItem(galleryIndex - 1); };
  nextBtn.onclick = function () { showGalleryItem(galleryIndex + 1); };

  // Keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    // Only when this window is the top one
    if (!win.style || win.style.zIndex != ST.z) return;
    if (e.key === 'Escape') { /* handled by window manager */ }
    else if (e.key === '+' || e.key === '=') { zoom = Math.min(8, zoom * 1.25); applyTransform(); }
    else if (e.key === '-') { zoom = Math.max(0.1, zoom / 1.25); applyTransform(); }
    else if (e.key === 'ArrowLeft' && gallery) { showGalleryItem(galleryIndex - 1); }
    else if (e.key === 'ArrowRight' && gallery) { showGalleryItem(galleryIndex + 1); }
  });

  // ---------- Init ----------
  loadImage(initialSrc, initialName);
  return win;
}

window.openImageViewer = openImageViewer;

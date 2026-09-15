// ============================================================
//  wallpaper.js — Wallpaper picker for OpencoreOS
//  8 defaults + 16 new wallpapers + upload from device / VFS / URL
// ============================================================

function openWallpaper(){
  var KEY = 'oc_wallpaper';

  // ============================================================
  //  Wallpaper library
  // ============================================================
  var WALLPAPERS = [
    // ----- Defaults -----
    { name: 'Default Dark',  css: 'linear-gradient(135deg, #1a1a2e, #16213e)' },
    { name: 'Deep Blue',     css: 'linear-gradient(180deg, #0f2027, #203a43, #2c5364)' },
    { name: 'Sunset Glow',   css: 'linear-gradient(180deg, #ff6b6b, #feca57)' },
    { name: 'Forest',        css: 'linear-gradient(180deg, #134e5e, #71b280)' },
    { name: 'Lavender Mist', css: 'linear-gradient(135deg, #c8a2c8, #8b5fbf)' },
    { name: 'Charcoal',      css: 'linear-gradient(135deg, #232526, #414345)' },
    { name: 'Ocean',         css: 'linear-gradient(180deg, #2193b0, #6dd5ed)' },
    { name: 'Peach',         css: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },

    // ----- 16 NEW -----
    // 1. Rainbow
    { name: '🌈 Rainbow',
      css: 'linear-gradient(90deg, #ff0000 0%, #ff7f00 14%, #ffff00 28%, #00ff00 42%, #00ffff 56%, #0000ff 70%, #4b0082 84%, #9400d3 100%)' },

    // 2. Retro Wave
    { name: '🌴 Retro Wave',
      css: 'linear-gradient(180deg, #1a0033 0%, #4d0a4d 40%, #b02070 60%, #ff6b9d 80%, #ffb87a 100%)' },

    // 3. Aurora
    { name: '❄️ Aurora',
      css: 'linear-gradient(180deg, #001510 0%, #0a2e2a 35%, #1a6157 65%, #4db8a8 100%)' },

    // 4. Midnight
    { name: '🌙 Midnight',
      css: 'radial-gradient(ellipse at 50% 0%, #2a2a5a 0%, #1a1a3e 30%, #050510 100%)' },

    // 5. Sunset Beach
    { name: '🏖️ Sunset Beach',
      css: 'linear-gradient(180deg, #ff512f 0%, #dd2476 45%, #8338ec 100%)' },

    // 6. Forest Mist
    { name: '🌲 Forest Mist',
      css: 'linear-gradient(180deg, #0d2818 0%, #1a3d2b 45%, #4a6b4f 70%, #a8b8a0 100%)' },

    // 7. Lava Lamp
    { name: '🫧 Lava Lamp',
      css: 'radial-gradient(circle at 20% 30%, #ff6b35 0%, transparent 40%), radial-gradient(circle at 80% 70%, #ff006e 0%, transparent 40%), radial-gradient(circle at 50% 50%, #8338ec 0%, transparent 50%), linear-gradient(135deg, #1a0b2e, #3a86ff)' },

    // 8. Cyberpunk
    { name: '🌆 Cyberpunk',
      css: 'linear-gradient(180deg, #0a001f 0%, #2a0050 40%, #6a00aa 65%, #ff00aa 85%, #00ffff 100%)' },

    // 9. Cotton Candy
    { name: '🍬 Cotton Candy',
      css: 'linear-gradient(135deg, #ffc0cb 0%, #dda0dd 45%, #b19cd9 100%)' },

    // 10. Ocean Deep
    { name: '🌊 Ocean Deep',
      css: 'linear-gradient(180deg, #000428 0%, #003055 40%, #004e92 80%, #0078c8 100%)' },

    // 11. Desert Dunes
    { name: '🏜️ Desert Dunes',
      css: 'linear-gradient(180deg, #ffb347 0%, #ffcc70 30%, #c2956b 65%, #8b5a2b 100%)' },

    // 12. Cosmic Dust
    { name: '🌌 Cosmic Dust',
      css: 'radial-gradient(circle at 15% 25%, #ffffff 1px, transparent 2px), radial-gradient(circle at 75% 55%, #ffffff 1px, transparent 2px), radial-gradient(circle at 40% 80%, #ffffff 1px, transparent 2px), radial-gradient(circle at 90% 15%, #ffffff 1px, transparent 2px), radial-gradient(circle at 55% 45%, #ffffff 1px, transparent 2px), linear-gradient(135deg, #1a0b2e 0%, #16213e 50%, #0f0524 100%)' },

    // 13. Minty Fresh
    { name: '🌿 Minty Fresh',
      css: 'linear-gradient(135deg, #d4f1e8 0%, #a8e6cf 45%, #a0e7a0 100%)' },

    // 14. Golden Hour
    { name: '🌟 Golden Hour',
      css: 'linear-gradient(180deg, #f6d365 0%, #fda085 40%, #d76d77 100%)' },

    // 15. Electric Blue
    { name: '⚡ Electric Blue',
      css: 'linear-gradient(180deg, #00c6ff 0%, #0072ff 45%, #0a2a5e 100%)' },

    // 16. Rose Gold
    { name: '🌹 Rose Gold',
      css: 'linear-gradient(135deg, #f7c5cc 0%, #e0a8b0 40%, #d4af7a 100%)' }
  ];

  // ============================================================
  //  Window
  // ============================================================
  var win = makeWindow('wallpaper', 'Wallpaper', '🖼️',
    '<div id="wp-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
      + '<div style="padding:10px 14px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">'
        + '<div style="flex:1;color:#fff;font-weight:600;">Wallpaper</div>'
        + '<button type="button" id="wp-upload" style="background:#1e4d6b;border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">📂 Upload</button>'
        + '<button type="button" id="wp-vfs" style="background:#1e4d6b;border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">📁 From Opencore</button>'
        + '<button type="button" id="wp-url" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">🔗 URL</button>'
        + '<button type="button" id="wp-clear" style="background:#4a2028;border:none;color:#ff8a8a;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">✕ Clear</button>'
      + '</div>'
      + '<div id="wp-grid" style="flex:1;overflow-y:auto;padding:14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;"></div>'
      + '<div id="wp-status" style="padding:6px 14px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;"></div>'
    + '</div>', 720, 600);

  var c = win.querySelector('#wp-app');
  var gridEl = c.querySelector('#wp-grid');
  var statusEl = c.querySelector('#wp-status');

  // ============================================================
  //  Apply wallpaper
  // ============================================================
  function applyWallpaper(css) {
    var dt = document.getElementById('dt');
    if (!dt) return;
    dt.style.background = css || '';
  }

  function currentWallpaper() {
    try { return LS.getItem(KEY) || ''; } catch (e) { return ''; }
  }

  function saveWallpaper(css, label) {
    try {
      LS.setItem(KEY, css);
      applyWallpaper(css);
      statusEl.textContent = label ? 'Applied: ' + label : 'Applied';
      renderGrid();
    } catch (e) {
      alert('Could not save wallpaper: ' + e.message);
    }
  }

  // ============================================================
  //  Render grid
  // ============================================================
  function renderGrid() {
    gridEl.innerHTML = '';
    var current = currentWallpaper();

    WALLPAPERS.forEach(function (wp) {
      var card = document.createElement('div');
      var isActive = current === wp.css;
      card.style.cssText =
        'border-radius:12px;overflow:hidden;cursor:pointer;' +
        'border:2px solid ' + (isActive ? '#1db954' : 'rgba(255,255,255,0.08)') + ';' +
        'background:rgba(255,255,255,0.02);' +
        'transition:transform 0.15s,border-color 0.15s;';
      card.onmouseenter = function () { card.style.transform = 'scale(1.02)'; };
      card.onmouseleave = function () { card.style.transform = ''; };

      // Swatch
      var swatch = document.createElement('div');
      swatch.style.cssText =
        'width:100%;height:110px;background:' + wp.css + ';' +
        'background-size:cover;background-position:center;';
      card.appendChild(swatch);

      // Label
      var label = document.createElement('div');
      label.style.cssText =
        'padding:8px 10px;font-size:12px;color:#fff;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' +
        'background:#1a1a1a;';
      label.textContent = wp.name + (isActive ? ' ✓' : '');
      card.appendChild(label);

      card.onclick = function () {
        saveWallpaper(wp.css, wp.name);
      };

      gridEl.appendChild(card);
    });

    statusEl.textContent = WALLPAPERS.length + ' wallpapers · ' +
      (current ? 'custom active' : 'no wallpaper');
  }

  // ============================================================
  //  VFS picker
  // ============================================================
  function pickFromVFS(callback) {
    var picker = document.createElement('div');
    picker.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:2147483645;' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-family:system-ui,-apple-system,sans-serif;';
    var box = document.createElement('div');
    box.style.cssText =
      'background:#1a1c22;color:#fff;padding:20px;border-radius:14px;' +
      'width:520px;max-width:90vw;max-height:80vh;display:flex;flex-direction:column;' +
      'border:1px solid rgba(255,255,255,0.1);box-shadow:0 20px 60px rgba(0,0,0,0.6);';

    box.innerHTML =
      '<div style="font-size:16px;font-weight:600;margin-bottom:12px;">Pick an image from OpencoreOS</div>'
      + '<div id="wp-vfs-list" style="flex:1;overflow-y:auto;background:rgba(0,0,0,0.3);'
        + 'border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px;min-height:200px;">'
        + '<div style="color:#888;text-align:center;padding:30px;">Loading…</div>'
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-top:12px;">'
        + '<button type="button" id="wp-vfs-cancel" style="flex:1;background:rgba(255,255,255,0.08);'
          + 'border:1px solid rgba(255,255,255,0.12);color:#fff;padding:10px;border-radius:8px;'
          + 'cursor:pointer;font-size:13px;">Cancel</button>'
      + '</div>';

    picker.appendChild(box);
    document.body.appendChild(picker);

    var listEl = box.querySelector('#wp-vfs-list');

    function collectImages() {
      var folders = ['/Pictures', '/Documents', '/', '/Pictures/Screenshots'];
      var found = [];

      function walk(folder, depth) {
        if (depth > 2) return;
        var list;
        try { list = VFS.list(folder); } catch (e) { return; }
        if (!list) return;
        for (var i = 0; i < list.length; i++) {
          var item = list[i];
          if (item.type === 'file') {
            if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(item.name)) {
              var fullPath = (folder === '/' ? '' : folder) + '/' + item.name;
              if (found.indexOf(fullPath) === -1) found.push(fullPath);
            }
          } else if (item.type === 'folder' && depth < 2) {
            walk((folder === '/' ? '' : folder) + '/' + item.name, depth + 1);
          }
        }
      }

      folders.forEach(function (f) { walk(f, 0); });
      return found;
    }

    var paths = collectImages();

    if (!paths.length) {
      listEl.innerHTML = '<div style="color:#888;text-align:center;padding:30px;">'
        + 'No images found in your OpencoreOS files.<br><br>'
        + 'Take a screenshot first, then try again.</div>';
    } else {
      listEl.innerHTML = '';
      paths.forEach(function (path) {
        var item = document.createElement('div');
        item.style.cssText =
          'display:flex;align-items:center;gap:10px;padding:8px 10px;' +
          'border-radius:6px;cursor:pointer;';
        item.onmouseenter = function () { item.style.background = 'rgba(255,255,255,0.06)'; };
        item.onmouseleave = function () { item.style.background = ''; };
        item.innerHTML =
          '<span style="font-size:20px;">🖼️</span>'
          + '<span style="flex:1;color:#fff;font-family:Menlo,monospace;font-size:11px;'
            + 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
            + path.split('/').pop() + '</span>'
          + '<span style="color:#888;font-size:10px;">' + path + '</span>';
        item.onclick = function () {
          try {
            var content = VFS.read(path);
            if (!content) { alert('Could not read file.'); return; }
            var dataUrl;
            if (content.indexOf('data:image') === 0) {
              dataUrl = content;
            } else if (/^[A-Za-z0-9+/=\s]+$/.test(content) && content.length > 100) {
              dataUrl = 'data:image/png;base64,' + content.replace(/\s/g, '');
            } else {
              alert('This file is not a valid image.');
              return;
            }
            picker.remove();
            callback(dataUrl, path.split('/').pop());
          } catch (e) {
            alert('Error: ' + e.message);
          }
        };
        listEl.appendChild(item);
      });
    }

    box.querySelector('#wp-vfs-cancel').onclick = function () { picker.remove(); };
    picker.onclick = function (e) { if (e.target === picker) picker.remove(); };
  }

  // ============================================================
  //  Header buttons
  // ============================================================
  c.querySelector('#wp-upload').onclick = function () {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      if (f.size > 3 * 1024 * 1024) {
        if (!confirm('Image is ' + (f.size / 1024 / 1024).toFixed(1) + ' MB. Large wallpapers may not save. Continue?')) return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        saveWallpaper('url(' + reader.result + ') center/cover no-repeat', f.name);
      };
      reader.readAsDataURL(f);
    };
    inp.click();
  };

  c.querySelector('#wp-vfs').onclick = function () {
    pickFromVFS(function (dataUrl, name) {
      saveWallpaper('url(' + dataUrl + ') center/cover no-repeat', name);
    });
  };

  c.querySelector('#wp-url').onclick = function () {
    var url = prompt('Image URL (https://...):');
    if (!url) return;
    saveWallpaper('url(' + url + ') center/cover no-repeat', 'URL');
  };

  c.querySelector('#wp-clear').onclick = function () {
    if (!confirm('Clear the wallpaper?')) return;
    try { LS.removeItem(KEY); } catch (e) {}
    applyWallpaper('');
    statusEl.textContent = 'Wallpaper cleared';
    renderGrid();
  };

  // ============================================================
  //  Init
  // ============================================================
  renderGrid();
  return win;
}

window.openWallpaper = openWallpaper;

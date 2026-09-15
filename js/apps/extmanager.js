// ============================================================
//  extmanager.js — Customize window for each extension
//  Wallpaper: upload from device OR pick from OpencoreOS VFS
// ============================================================

function openExtensionManager(extId){
  if (!window.Extensions) { alert('Extensions not loaded'); return; }
  var ext = window.Extensions.get(extId);
  if (!ext) { alert('Unknown extension: ' + extId); return; }

  var win = makeWindow('extmgr-' + extId, 'Customize — ' + ext.name, ext.icon,
    '<div id="ext-mgr" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
      + '<div id="ext-mgr-tabs" style="display:flex;gap:4px;padding:10px 14px 0 14px;border-bottom:1px solid #2a2a2a;">'
        + '<button type="button" data-tab="look" class="ext-tab on">Appearance</button>'
        + '<button type="button" data-tab="icons" class="ext-tab">App Icons</button>'
      + '</div>'
      + '<div id="ext-mgr-body" style="flex:1;overflow-y:auto;padding:14px;"></div>'
    + '</div>', 640, 600);

  var c = win.querySelector('#ext-mgr');
  var tabsEl = c.querySelector('#ext-mgr-tabs');
  var body = c.querySelector('#ext-mgr-body');
  var current = 'look';

  var tabs = tabsEl.querySelectorAll('.ext-tab');
  for (var t = 0; t < tabs.length; t++) {
    (function (b) {
      b.style.cssText =
        'background:transparent;border:none;color:#888;padding:8px 14px;' +
        'cursor:pointer;font-size:12px;border-bottom:2px solid transparent;';
      b.onclick = function () {
        current = b.getAttribute('data-tab');
        for (var k = 0; k < tabs.length; k++) {
          tabs[k].classList.remove('on');
          tabs[k].style.color = '#888';
          tabs[k].style.borderBottom = '2px solid transparent';
        }
        b.classList.add('on');
        b.style.color = '#fff';
        b.style.borderBottom = '2px solid #1db954';
        renderBody();
      };
    })(tabs[t]);
  }
  tabs[0].style.color = '#fff';
  tabs[0].style.borderBottom = '2px solid #1db954';

  // ============================================================
  //  Wallpaper application (works with data URL or http URL)
  // ============================================================
  function applyWallpaper(dataOrUrl) {
    var dt = document.getElementById('dt');
    if (!dt) return;
    if (!dataOrUrl) {
      dt.style.background = '';
      return;
    }
    if (dataOrUrl.indexOf('data:') === 0 || dataOrUrl.indexOf('http') === 0) {
      dt.style.background = 'url(' + dataOrUrl + ') center/cover no-repeat';
    } else {
      dt.style.background = dataOrUrl;
    }
  }

  function setWallpaperForExt(id, dataOrUrl) {
    try {
      LS.setItem('oc_ext_wallpaper_' + id, dataOrUrl);
    } catch (e) {
      alert('Could not save wallpaper — image is too large. Try a smaller image (under 2 MB).');
      return;
    }
    if (window.Extensions.getActiveTheme() === id) {
      applyWallpaper(dataOrUrl);
    } else {
      // Still apply globally — user wanted "change wallpaper to anything"
      applyWallpaper(dataOrUrl);
    }
  }

  // ---------- VFS picker ----------
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
      + '<div id="vfs-picker-list" style="flex:1;overflow-y:auto;background:rgba(0,0,0,0.3);'
        + 'border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:8px;min-height:200px;">'
        + '<div style="color:#888;text-align:center;padding:30px;">Loading…</div>'
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-top:12px;">'
        + '<button type="button" id="vfs-picker-cancel" style="flex:1;background:rgba(255,255,255,0.08);'
          + 'border:1px solid rgba(255,255,255,0.12);color:#fff;padding:10px;border-radius:8px;'
          + 'cursor:pointer;font-size:13px;">Cancel</button>'
      + '</div>';

    picker.appendChild(box);
    document.body.appendChild(picker);

    var listEl = box.querySelector('#vfs-picker-list');

    // Collect all image files from common VFS folders
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
            // Check extension
            var name = item.name.toLowerCase();
            if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)) {
              var fullPath = (folder === '/' ? '' : folder) + '/' + item.name;
              // Avoid duplicates
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
        + 'Save a screenshot or photo first, then try again.</div>';
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
            if (content.indexOf('data:image') === 0) {
              picker.remove();
              callback(content);
            } else if (/^[A-Za-z0-9+/=\s]+$/.test(content) && content.length > 100) {
              picker.remove();
              callback('data:image/png;base64,' + content.replace(/\s/g, ''));
            } else {
              alert('This file is not a valid image.');
            }
          } catch (e) {
            alert('Error reading file: ' + e.message);
          }
        };
        listEl.appendChild(item);
      });
    }

    box.querySelector('#vfs-picker-cancel').onclick = function () { picker.remove(); };
    picker.onclick = function (e) { if (e.target === picker) picker.remove(); };
  }

  // ============================================================
  //  Appearance tab
  // ============================================================
  function renderAppearance() {
    body.innerHTML = '';

    var head = document.createElement('div');
    head.style.cssText = 'margin-bottom:14px;';
    head.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;">'
        + '<div style="font-size:36px;">' + ext.icon + '</div>'
        + '<div>'
          + '<div style="font-size:16px;font-weight:600;color:#fff;">' + ext.name + '</div>'
          + '<div style="color:#888;font-size:11px;">' + ext.desc + '</div>'
        + '</div>'
      + '</div>';
    body.appendChild(head);

    if (ext.type === 'theme') {
      var active = window.Extensions.getActiveTheme() === ext.id;
      var row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;gap:10px;padding:12px;' +
        'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);' +
        'border-radius:10px;margin-bottom:12px;';
      row.innerHTML =
        '<div style="flex:1;">'
          + '<div style="color:#fff;font-weight:600;">Activate this theme</div>'
          + '<div style="color:#888;font-size:11px;">Only one theme active at a time.</div>'
        + '</div>'
        + '<button type="button" id="extm-act" style="background:' + (active ? '#1db954' : 'rgba(255,255,255,0.08)') + ';border:1px solid rgba(255,255,255,0.12);color:#fff;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">'
          + (active ? '✓ Active' : 'Activate') +
        '</button>';
      body.appendChild(row);
      row.querySelector('#extm-act').onclick = function () {
        window.Extensions.setActiveTheme(active ? 'none' : ext.id);
        renderBody();
      };
    }

    // Accent color
    var accentRow = document.createElement('div');
    accentRow.style.cssText =
      'padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);' +
      'border-radius:10px;margin-bottom:12px;';
    accentRow.innerHTML =
      '<div style="color:#fff;font-weight:600;margin-bottom:6px;">Accent Color</div>'
      + '<div style="color:#888;font-size:11px;margin-bottom:8px;">Applied to buttons and highlights.</div>';
    var colorInp = document.createElement('input');
    colorInp.type = 'color';
    var storedColor = '';
    try { storedColor = LS.getItem('oc_ext_accent_' + ext.id) || ''; } catch (e) {}
    colorInp.value = storedColor || (ext.vars && ext.vars['--ext-accent']) || '#1db954';
    colorInp.style.cssText = 'width:100%;height:36px;background:transparent;border:1px solid #2a2a2a;border-radius:6px;cursor:pointer;';
    colorInp.oninput = function () {
      try { LS.setItem('oc_ext_accent_' + ext.id, colorInp.value); } catch (e) {}
      var el = document.getElementById('oc-ext-theme');
      if (el) el.textContent += '\n:root{--ext-accent:' + colorInp.value + '!important;}';
    };
    accentRow.appendChild(colorInp);
    body.appendChild(accentRow);

    // ---------- WALLPAPER SECTION ----------
    var wpRow = document.createElement('div');
    wpRow.style.cssText =
      'padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);' +
      'border-radius:10px;margin-bottom:12px;';
    wpRow.innerHTML =
      '<div style="color:#fff;font-weight:600;margin-bottom:6px;">Wallpaper</div>'
      + '<div style="color:#888;font-size:11px;margin-bottom:10px;">Any image works — photos, drawings, screenshots, GIFs.</div>';

    // Preview thumbnail
    var currentWp = '';
    try { currentWp = LS.getItem('oc_ext_wallpaper_' + ext.id) || ''; } catch (e) {}
    if (currentWp) {
      var preview = document.createElement('div');
      preview.style.cssText =
        'width:100%;height:100px;border-radius:8px;margin-bottom:10px;' +
        'background:url(' + currentWp + ') center/cover no-repeat;' +
        'border:1px solid rgba(255,255,255,0.15);';
      wpRow.appendChild(preview);
    }

    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;';

    // Upload from device
    var upload = document.createElement('button');
    upload.type = 'button';
    upload.textContent = '📂 From Device';
    upload.style.cssText = 'flex:1;min-width:120px;background:#1e4d6b;border:none;color:#fff;padding:9px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;';
    upload.onclick = function () {
      var inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.onchange = function () {
        var f = inp.files && inp.files[0];
        if (!f) return;
        if (f.size > 2 * 1024 * 1024) {
          if (!confirm('This image is ' + (f.size / 1024 / 1024).toFixed(1) + ' MB. Large wallpapers may fail to save. Continue?')) return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          setWallpaperForExt(ext.id, reader.result);
          renderBody();
        };
        reader.readAsDataURL(f);
      };
      inp.click();
    };
    btns.appendChild(upload);

    // Pick from OpencoreOS files
    var fromVFS = document.createElement('button');
    fromVFS.type = 'button';
    fromVFS.textContent = '📁 From OpencoreOS';
    fromVFS.style.cssText = 'flex:1;min-width:120px;background:#1e4d6b;border:none;color:#fff;padding:9px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;';
    fromVFS.onclick = function () {
      pickFromVFS(function (dataUrl) {
        setWallpaperForExt(ext.id, dataUrl);
        renderBody();
      });
    };
    btns.appendChild(fromVFS);

    // URL
    var useUrl = document.createElement('button');
    useUrl.type = 'button';
    useUrl.textContent = '🔗 URL';
    useUrl.style.cssText = 'flex:1;min-width:100px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:9px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;';
    useUrl.onclick = function () {
      var url = prompt('Image URL:');
      if (!url) return;
      setWallpaperForExt(ext.id, url);
      renderBody();
    };
    btns.appendChild(useUrl);

    // Clear
    var clearWp = document.createElement('button');
    clearWp.type = 'button';
    clearWp.textContent = '✕ Clear';
    clearWp.style.cssText = 'background:#4a2028;border:none;color:#ff8a8a;padding:9px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;';
    clearWp.onclick = function () {
      try { LS.removeItem('oc_ext_wallpaper_' + ext.id); } catch (e) {}
      applyWallpaper('');
      renderBody();
    };
    btns.appendChild(clearWp);

    wpRow.appendChild(btns);
    body.appendChild(wpRow);
  }

  // ============================================================
  //  App Icons tab
  // ============================================================
  var APPS = [
    { id: 'files', name: 'Files', default: '📁' },
    { id: 'terminal', name: 'Terminal', default: '💻' },
    { id: 'notepad', name: 'Notepad', default: '📝' },
    { id: 'calculator', name: 'Calculator', default: '🧮' },
    { id: 'browser', name: 'Browser', default: '🌐' },
    { id: 'camera', name: 'Camera', default: '📷' },
    { id: 'microphone', name: 'Microphone', default: '🎤' },
    { id: 'audioplayer', name: 'Audio Player', default: '🔊' },
    { id: 'wallpaper', name: 'Wallpaper', default: '🖼️' },
    { id: 'weather', name: 'Weather', default: '🌤️' },
    { id: 'clock', name: 'Clock', default: '🕐' },
    { id: 'calendar', name: 'Calendar', default: '📅' },
    { id: 'sysinfo', name: 'System Info', default: 'ℹ️' },
    { id: 'appstore', name: 'App Store', default: '🛒' },
    { id: 'settings', name: 'Settings', default: '⚙️' },
    { id: 'music', name: 'Spotify', default: '🎵' },
    { id: 'kernel0', name: 'Kernel0', default: '🧠' },
    { id: 'videohub', name: 'VideoHub', default: '🎬' },
    { id: 'photoeditor', name: 'Photo Editor', default: '🎨' },
    { id: 'vapor', name: 'Vapor', default: '💨' },
    { id: 'science', name: 'Science', default: '🔬' },
    { id: 'infinity', name: 'Infinity Drink', default: '🥤' },
    { id: 'checklist', name: 'Checklist', default: '✅' },
    { id: 'extstore', name: 'Extensions', default: '🧩' }
  ];

  function renderIcons() {
    body.innerHTML = '';

    var head = document.createElement('div');
    head.style.cssText = 'margin-bottom:14px;color:#888;font-size:12px;line-height:1.6;';
    head.innerHTML =
      'Set a custom icon for any app.<br>'
      + 'Type an <b>emoji</b> or <b>upload an image</b>. Click <b>Reset</b> to restore the default.';
    body.appendChild(head);

    var grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-direction:column;gap:8px;';
    body.appendChild(grid);

    APPS.forEach(function (app) {
      var current = window.Extensions.getIconOverride(app.id);

      var row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;gap:10px;padding:10px 12px;' +
        'background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);' +
        'border-radius:10px;';

      var preview = document.createElement('div');
      preview.style.cssText =
        'width:42px;height:42px;display:flex;align-items:center;justify-content:center;' +
        'font-size:28px;background:rgba(0,0,0,0.3);border-radius:8px;overflow:hidden;';
      if (current && current.indexOf('data:image') === 0) {
        preview.innerHTML = '<img src="' + current + '" style="width:100%;height:100%;object-fit:contain;"/>';
      } else if (current) {
        preview.textContent = current;
      } else {
        preview.textContent = app.default;
      }
      row.appendChild(preview);

      var name = document.createElement('div');
      name.style.cssText = 'flex:1;color:#fff;font-weight:600;font-size:13px;';
      name.textContent = app.name;
      row.appendChild(name);

      var btns = document.createElement('div');
      btns.style.cssText = 'display:flex;gap:6px;';

      var emojiBtn = document.createElement('button');
      emojiBtn.type = 'button';
      emojiBtn.textContent = 'Emoji';
      emojiBtn.style.cssText = 'background:#1e4d6b;border:none;color:#fff;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:11px;';
      emojiBtn.onclick = function () {
        var v = prompt('Enter an emoji for ' + app.name + ':', current && current.indexOf('data:') !== 0 ? current : app.default);
        if (!v) return;
        window.Extensions.setIconOverride(app.id, v);
        window.Extensions.applyAll();
        renderIcons();
      };
      btns.appendChild(emojiBtn);

      var uploadBtn = document.createElement('button');
      uploadBtn.type = 'button';
      uploadBtn.textContent = 'Upload';
      uploadBtn.style.cssText = 'background:#1e4d6b;border:none;color:#fff;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:11px;';
      uploadBtn.onclick = function () {
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'image/*';
        inp.onchange = function () {
          var f = inp.files && inp.files[0];
          if (!f) return;
          if (f.size > 200 * 1024) return alert('Image too large. Keep under 200 KB.');
          var reader = new FileReader();
          reader.onload = function () {
            window.Extensions.setIconOverride(app.id, reader.result);
            window.Extensions.applyAll();
            renderIcons();
          };
          reader.readAsDataURL(f);
        };
        inp.click();
      };
      btns.appendChild(uploadBtn);

      var vfsBtn = document.createElement('button');
      vfsBtn.type = 'button';
      vfsBtn.textContent = 'VFS';
      vfsBtn.style.cssText = 'background:#1e4d6b;border:none;color:#fff;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:11px;';
      vfsBtn.onclick = function () {
        pickFromVFS(function (dataUrl) {
          if (dataUrl.length > 300 * 1024) return alert('Image too large for an icon. Use a smaller image.');
          window.Extensions.setIconOverride(app.id, dataUrl);
          window.Extensions.applyAll();
          renderIcons();
        });
      };
      btns.appendChild(vfsBtn);

      var resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.textContent = 'Reset';
      resetBtn.style.cssText = 'background:transparent;border:1px solid #664;color:#ff8a8a;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:11px;';
      resetBtn.onclick = function () {
        window.Extensions.setIconOverride(app.id, '');
        window.Extensions.applyAll();
        renderIcons();
      };
      btns.appendChild(resetBtn);

      row.appendChild(btns);
      grid.appendChild(row);
    });

    var resetAll = document.createElement('button');
    resetAll.type = 'button';
    resetAll.textContent = 'Reset ALL icons';
    resetAll.style.cssText =
      'width:100%;margin-top:14px;background:#4a2028;border:none;color:#ff8a8a;' +
      'padding:10px;border-radius:8px;cursor:pointer;font-weight:600;font-size:12px;';
    resetAll.onclick = function () {
      if (!confirm('Reset every app icon to default?')) return;
      window.Extensions.clearAllIconOverrides();
      window.Extensions.applyAll();
      renderIcons();
    };
    body.appendChild(resetAll);
  }

  function renderBody() {
    if (current === 'look') renderAppearance();
    else if (current === 'icons') renderIcons();
  }
  renderBody();

  return win;
}

window.openExtensionManager = openExtensionManager;

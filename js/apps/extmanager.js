// ============================================================
//  extmanager.js — Per-extension Customize window
//  Lets users override appearance + per-app icons
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
    + '</div>', 620, 560);

  var c = win.querySelector('#ext-mgr');
  var tabsEl = c.querySelector('#ext-mgr-tabs');
  var body = c.querySelector('#ext-mgr-body');
  var current = 'look';

  // -------- Tab switching --------
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
  //  Appearance tab
  // ============================================================
  function renderAppearance() {
    body.innerHTML = '';

    // Section: extension info
    var head = document.createElement('div');
    head.style.cssText = 'margin-bottom:14px;';
    head.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;">' +
        '<div style="font-size:36px;">' + ext.icon + '</div>' +
        '<div>' +
          '<div style="font-size:16px;font-weight:600;color:#fff;">' + ext.name + '</div>' +
          '<div style="color:#888;font-size:11px;">' + ext.desc + '</div>' +
        '</div>' +
      '</div>';
    body.appendChild(head);

    // Section: activate theme
    if (ext.type === 'theme') {
      var active = window.Extensions.getActiveTheme() === ext.id;
      var row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;gap:10px;padding:12px;' +
        'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);' +
        'border-radius:10px;margin-bottom:12px;';
      row.innerHTML =
        '<div style="flex:1;">' +
          '<div style="color:#fff;font-weight:600;">Activate this theme</div>' +
          '<div style="color:#888;font-size:11px;">Only one theme active at a time.</div>' +
        '</div>' +
        '<button type="button" id="extm-act" style="background:' + (active ? '#1db954' : 'rgba(255,255,255,0.08)') + ';border:1px solid rgba(255,255,255,0.12);color:#fff;padding:7px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">' +
          (active ? '✓ Active' : 'Activate') +
        '</button>';
      body.appendChild(row);
      row.querySelector('#extm-act').onclick = function () {
        window.Extensions.setActiveTheme(active ? 'none' : ext.id);
        renderBody();
      };
    }

    // Section: custom accent color
    var accentRow = document.createElement('div');
    accentRow.style.cssText =
      'padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);' +
      'border-radius:10px;margin-bottom:12px;';
    accentRow.innerHTML =
      '<div style="color:#fff;font-weight:600;margin-bottom:6px;">Accent Color</div>' +
      '<div style="color:#888;font-size:11px;margin-bottom:8px;">Applied to buttons and highlights.</div>';
    var colorInp = document.createElement('input');
    colorInp.type = 'color';
    var storedColor = '';
    try { storedColor = LS.getItem('oc_ext_accent_' + ext.id) || ''; } catch (e) {}
    colorInp.value = storedColor || (ext.vars && ext.vars['--ext-accent']) || '#1db954';
    colorInp.style.cssText = 'width:100%;height:36px;background:transparent;border:1px solid #2a2a2a;border-radius:6px;cursor:pointer;';
    colorInp.oninput = function () {
      try { LS.setItem('oc_ext_accent_' + ext.id, colorInp.value); } catch (e) {}
      applyAccent(ext.id, colorInp.value);
    };
    accentRow.appendChild(colorInp);
    body.appendChild(accentRow);

    // Section: wallpaper override
    var wpRow = document.createElement('div');
    wpRow.style.cssText =
      'padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);' +
      'border-radius:10px;margin-bottom:12px;';
    wpRow.innerHTML =
      '<div style="color:#fff;font-weight:600;margin-bottom:6px;">Wallpaper</div>' +
      '<div style="color:#888;font-size:11px;margin-bottom:8px;">Upload an image or paste a URL for this extension.</div>';

    var wpBtns = document.createElement('div');
    wpBtns.style.cssText = 'display:flex;gap:6px;';

    var upload = document.createElement('button');
    upload.type = 'button';
    upload.textContent = 'Upload Image';
    upload.style.cssText = 'flex:1;background:#1e4d6b;border:none;color:#fff;padding:7px 12px;border-radius:6px;cursor:pointer;font-size:12px;';
    upload.onclick = function () {
      var inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.onchange = function () {
        var f = inp.files && inp.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          setWallpaperForExt(ext.id, reader.result);
          renderBody();
        };
        reader.readAsDataURL(f);
      };
      inp.click();
    };
    wpBtns.appendChild(upload);

    var useUrl = document.createElement('button');
    useUrl.type = 'button';
    useUrl.textContent = 'Paste URL';
    useUrl.style.cssText = 'flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:7px 12px;border-radius:6px;cursor:pointer;font-size:12px;';
    useUrl.onclick = function () {
      var url = prompt('Image URL:');
      if (!url) return;
      setWallpaperForExt(ext.id, url);
      renderBody();
    };
    wpBtns.appendChild(useUrl);

    var clearWp = document.createElement('button');
    clearWp.type = 'button';
    clearWp.textContent = 'Clear';
    clearWp.style.cssText = 'background:#4a2028;border:none;color:#ff8a8a;padding:7px 12px;border-radius:6px;cursor:pointer;font-size:12px;';
    clearWp.onclick = function () {
      try { LS.removeItem('oc_ext_wallpaper_' + ext.id); } catch (e) {}
      renderBody();
    };
    wpBtns.appendChild(clearWp);

    wpRow.appendChild(wpBtns);
    body.appendChild(wpRow);
  }

  function setWallpaperForExt(id, dataOrUrl) {
    try { LS.setItem('oc_ext_wallpaper_' + id, dataOrUrl); } catch (e) { alert('Too large to save.'); return; }
    // Apply immediately if this theme is active
    if (window.Extensions.getActiveTheme() === id) {
      var dt = document.getElementById('dt');
      if (dt) dt.style.background = 'url(' + dataOrUrl + ') center/cover';
    }
  }

  function applyAccent(id, color) {
    if (window.Extensions.getActiveTheme() !== id) return;
    var el = document.getElementById('oc-ext-theme');
    if (!el) return;
    // Append a color override
    el.textContent += '\n:root{--ext-accent:' + color + '!important;}';
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
    { id: 'infinity', name: 'Infinity Drink', default: '🥤' }
  ];

  function renderIcons() {
    body.innerHTML = '';

    var head = document.createElement('div');
    head.style.cssText = 'margin-bottom:14px;color:#888;font-size:12px;line-height:1.6;';
    head.innerHTML =
      'Set a custom icon for any app.<br>' +
      'Type an <b>emoji</b> or <b>upload an image</b>. Click <b>Reset</b> to restore the default.';
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

      // Preview
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

      // Name
      var name = document.createElement('div');
      name.style.cssText = 'flex:1;color:#fff;font-weight:600;font-size:13px;';
      name.textContent = app.name;
      row.appendChild(name);

      // Buttons
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

    // Reset all button
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

  // ============================================================
  //  Body dispatcher
  // ============================================================
  function renderBody() {
    if (current === 'look') renderAppearance();
    else if (current === 'icons') renderIcons();
  }
  renderBody();

  return win;
}

window.openExtensionManager = openExtensionManager;

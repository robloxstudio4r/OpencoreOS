// ============================================================
//  extstore.js — Extension Store app for OpencoreOS
// ============================================================

function openExtensionStore(){
  var win = makeWindow('extstore', 'Extension Store', '🧩',
    '<div id="ext-store" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
      + '<div style="padding:10px 14px;border-bottom:1px solid #2a2a2a;">'
        + '<div style="font-size:16px;font-weight:600;">Extensions</div>'
        + '<div style="color:#888;font-size:11px;margin-top:2px;">Change how OpencoreOS looks. Install, then customize.</div>'
      + '</div>'
      + '<div id="ext-grid" style="flex:1;overflow-y:auto;padding:14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;"></div>'
    + '</div>', 720, 560);

  var c = win.querySelector('#ext-store');
  var grid = c.querySelector('#ext-grid');

  function render() {
    if (!window.Extensions) {
      grid.innerHTML = '<div style="color:#f66;padding:20px;">Extensions module not loaded.</div>';
      return;
    }
    grid.innerHTML = '';
    var all = window.Extensions.ALL;
    var active = window.Extensions.getActiveTheme();

    all.forEach(function (ext) {
      var installed = window.Extensions.isInstalled(ext.id);
      var isActive = active === ext.id;

      var card = document.createElement('div');
      card.style.cssText =
        'background:#1c1c20;border:1px solid rgba(255,255,255,0.08);' +
        'border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px;' +
        (isActive ? 'border-color:#1db954;box-shadow:0 0 0 1px #1db954;' : '');

      card.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;">' +
          '<div style="font-size:32px;">' + ext.icon + '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="color:#fff;font-weight:600;font-size:14px;">' + ext.name + '</div>' +
            '<div style="color:#888;font-size:11px;">' +
              (ext.type === 'theme' ? 'Theme' : ext.type === 'icons' ? 'Icon Pack' : 'Extension') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="color:#aaa;font-size:12px;line-height:1.5;">' + ext.desc + '</div>';

      var btns = document.createElement('div');
      btns.style.cssText = 'display:flex;gap:6px;margin-top:auto;';

      if (!installed) {
        var install = document.createElement('button');
        install.type = 'button';
        install.textContent = 'Install';
        install.style.cssText = 'flex:1;background:#1db954;border:none;color:#fff;padding:7px 12px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;';
        install.onclick = function () {
          window.Extensions.install(ext.id);
          render();
        };
        btns.appendChild(install);
      } else {
        var customize = document.createElement('button');
        customize.type = 'button';
        customize.textContent = 'Customize';
        customize.style.cssText = 'flex:1;background:#1e4d6b;border:none;color:#fff;padding:7px 12px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;';
        customize.onclick = function () {
          if (typeof openExtensionManager === 'function') openExtensionManager(ext.id);
          else alert('Extension Manager not loaded.');
        };
        btns.appendChild(customize);

        if (ext.type === 'theme') {
          var act = document.createElement('button');
          act.type = 'button';
          act.textContent = isActive ? '✓ Active' : 'Activate';
          act.style.cssText = 'flex:1;background:' + (isActive ? '#1db954' : 'rgba(255,255,255,0.08)') + ';border:1px solid rgba(255,255,255,0.12);color:#fff;padding:7px 12px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;';
          act.onclick = function () {
            if (isActive) window.Extensions.setActiveTheme('none');
            else window.Extensions.setActiveTheme(ext.id);
            render();
          };
          btns.appendChild(act);
        }

        var un = document.createElement('button');
        un.type = 'button';
        un.textContent = '×';
        un.style.cssText = 'background:#4a2028;border:none;color:#ff8a8a;padding:7px 12px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;';
        un.title = 'Uninstall';
        un.onclick = function () {
          if (!confirm('Uninstall "' + ext.name + '"?')) return;
          window.Extensions.uninstall(ext.id);
          render();
        };
        btns.appendChild(un);
      }

      card.appendChild(btns);
      grid.appendChild(card);
    });
  }

  render();

  // Live refresh if extensions change elsewhere
  window.addEventListener('extensionchange', render);
  win.addEventListener('remove', function () {
    window.removeEventListener('extensionchange', render);
  });

  return win;
}

// Alias so launcher can find it
window.openExtensionStore = openExtensionStore;

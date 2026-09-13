// ============================================================
//  accessibility-panel.js — Quick-access panel for a11y options
// ============================================================

function openAccessibilityPanel(){
  if (!window.A11y) {
    alert('Accessibility module not loaded');
    return;
  }

  var win = makeWindow('a11y', 'Accessibility', '♿',
    '<div id="a11y-app" style="padding:14px;font-family:system-ui,sans-serif;color:#ddd;font-size:13px;background:#141414;height:100%;overflow-y:auto;">'
    + '</div>', 380, 520);

  var c = win.querySelector('#a11y-app');

  function toggleRow(id, label, sub, key) {
    var on = window.A11y.get(key);
    var row = document.createElement('div');
    row.style.cssText =
      'display:flex;align-items:center;gap:10px;padding:10px 12px;' +
      'border:1px solid rgba(255,255,255,0.08);border-radius:8px;margin-bottom:8px;' +
      'background:rgba(255,255,255,0.02);cursor:pointer;';
    row.innerHTML =
      '<div style="font-size:22px;">' + (key === 'narrator' ? '🗣️' :
        key === 'magnifier' ? '🔍' :
        key === 'contrast' ? '🌓' :
        key === 'reduce_motion' ? '🎞️' :
        key === 'focus_ring' ? '⌨️' : '👁️') + '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="color:#fff;font-weight:600;font-size:13px;">' + label + '</div>' +
        '<div style="color:#888;font-size:11px;">' + sub + '</div>' +
      '</div>' +
      '<div class="a11y-tg" style="width:40px;height:22px;border-radius:11px;' +
        'background:' + (on ? '#1db954' : 'rgba(255,255,255,0.1)') + ';' +
        'position:relative;transition:background 0.15s;">' +
        '<div style="width:18px;height:18px;border-radius:50%;background:#fff;' +
          'position:absolute;top:2px;left:' + (on ? '20px' : '2px') + ';transition:left 0.15s;"></div>' +
      '</div>';
    row.onclick = function () {
      window.A11y.toggle(key);
      refresh();
    };
    return row;
  }

  function sliderRow(label, key, min, max, step, suffix) {
    var val = window.A11y.get(key);
    var wrap = document.createElement('div');
    wrap.style.cssText = 'padding:10px 12px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;margin-bottom:8px;background:rgba(255,255,255,0.02);';
    wrap.innerHTML =
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px;">' +
        '<div style="color:#fff;font-size:13px;font-weight:600;">' + label + '</div>' +
        '<div class="val" style="color:#1db954;font-size:12px;">' + val + suffix + '</div>' +
      '</div>';
    var inp = document.createElement('input');
    inp.type = 'range';
    inp.min = min; inp.max = max; inp.step = step; inp.value = val;
    inp.style.cssText = 'width:100%;';
    inp.oninput = function () {
      wrap.querySelector('.val').textContent = inp.value + suffix;
      window.A11y.set(key, parseInt(inp.value, 10));
    };
    wrap.appendChild(inp);
    return wrap;
  }

  function refresh() {
    c.innerHTML = '';
    var header = document.createElement('div');
    header.style.cssText = 'font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:8px;';
    header.textContent = 'Visual & Auditory';
    c.appendChild(header);

    c.appendChild(toggleRow('a11y-narrator', 'Narrator', 'Reads UI elements aloud', 'narrator'));
    c.appendChild(toggleRow('a11y-magnifier', 'Magnifier', 'Zooms the desktop', 'magnifier'));
    c.appendChild(sliderRow('Zoom level', 'zoom', 100, 300, 10, '%'));
    c.appendChild(toggleRow('a11y-lens', 'Magnifier lens', 'Big magnifier follows cursor', 'lens'));

    var sep1 = document.createElement('div');
    sep1.style.cssText = 'height:1px;background:rgba(255,255,255,0.06);margin:12px 0;';
    c.appendChild(sep1);

    var header2 = document.createElement('div');
    header2.style.cssText = 'font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:8px;';
    header2.textContent = 'Text & Contrast';
    c.appendChild(header2);

    c.appendChild(sliderRow('Text size', 'textsize', 80, 250, 5, '%'));
    c.appendChild(toggleRow('a11y-contrast', 'High contrast', 'Boost contrast and edges', 'contrast'));
    c.appendChild(toggleRow('a11y-focus-ring', 'Focus ring', 'Big outline on keyboard focus', 'focus_ring'));
    c.appendChild(toggleRow('a11y-reduce-motion', 'Reduce motion', 'Disable animations', 'reduce_motion'));

    var sep2 = document.createElement('div');
    sep2.style.cssText = 'height:1px;background:rgba(255,255,255,0.06);margin:12px 0;';
    c.appendChild(sep2);

    var shortcuts = document.createElement('div');
    shortcuts.style.cssText = 'color:#888;font-size:11px;line-height:1.8;';
    shortcuts.innerHTML =
      '<b style="color:#aaa;">Keyboard shortcuts</b><br>' +
      'Ctrl+Alt+N — Narrator on/off<br>' +
      'Ctrl+Alt+M — Magnifier on/off<br>' +
      'Ctrl+Alt+= — Text size up<br>' +
      'Ctrl+Alt+- — Text size down';
    c.appendChild(shortcuts);
  }

  refresh();
  return win;
}

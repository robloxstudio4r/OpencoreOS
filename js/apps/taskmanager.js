// ============================================================
//  taskmanager.js — Task Manager + System Monitor for OpencoreOS
//  Start menu only — not on desktop by default.
// ============================================================

function openTaskManager(){
  var win = makeWindow('taskmgr', 'Task Manager', '📊',
    '<div id="tm-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:12px;">'
      + '<div id="tm-tabs" style="display:flex;gap:4px;padding:8px 12px 0 12px;border-bottom:1px solid #2a2a2a;">'
        + '<button type="button" data-tab="perf" class="tm-tab on">Performance</button>'
        + '<button type="button" data-tab="proc" class="tm-tab">Processes</button>'
        + '<button type="button" data-tab="device" class="tm-tab">Device</button>'
      + '</div>'
      + '<div id="tm-body" style="flex:1;overflow-y:auto;padding:12px;"></div>'
      + '<div id="tm-status" style="padding:6px 12px;border-top:1px solid #2a2a2a;font-size:11px;color:#666;"></div>'
    + '</div>', 720, 560);

  var c = win.querySelector('#tm-app');
  var tabsEl = c.querySelector('#tm-tabs');
  var body = c.querySelector('#tm-body');
  var statusEl = c.querySelector('#tm-status');

  var current = 'perf';
  var tickTimer = null;
  var pageStart = performance.now();

  // ============================================================
  //  Tab styling
  // ============================================================
  var tabs = tabsEl.querySelectorAll('.tm-tab');
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
  //  FPS meter
  // ============================================================
  var fps = 0;
  var lastFrame = performance.now();
  var frameCount = 0;
  (function fpsLoop() {
    var now = performance.now();
    frameCount++;
    if (now - lastFrame >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastFrame = now;
    }
    requestAnimationFrame(fpsLoop);
  })();

  // ============================================================
  //  Render helpers
  // ============================================================
  function card(title) {
    var el = document.createElement('div');
    el.style.cssText =
      'background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);' +
      'border-radius:10px;padding:12px;margin-bottom:10px;';
    if (title) {
      var h = document.createElement('div');
      h.textContent = title;
      h.style.cssText = 'color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;';
      el.appendChild(h);
    }
    return el;
  }

  function statRow(label, value, highlight) {
    var row = document.createElement('div');
    row.style.cssText =
      'display:flex;justify-content:space-between;align-items:center;' +
      'padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.03);';
    row.innerHTML =
      '<span style="color:#aaa;">' + label + '</span>' +
      '<span style="color:' + (highlight || '#fff') + ';font-weight:500;' +
        'font-family:Menlo,Consolas,monospace;text-align:right;max-width:60%;' +
        'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + value + '</span>';
    return row;
  }

  function progressBar(pct, color) {
    var wrap = document.createElement('div');
    wrap.style.cssText =
      'width:100%;height:6px;background:rgba(255,255,255,0.05);' +
      'border-radius:3px;overflow:hidden;margin:4px 0 8px 0;';
    var bar = document.createElement('div');
    bar.style.cssText =
      'width:' + Math.max(0, Math.min(100, pct)) + '%;height:100%;' +
      'background:' + (color || '#1db954') + ';transition:width 0.3s;';
    wrap.appendChild(bar);
    return wrap;
  }

  function fmtBytes(n) {
    if (!n || n < 0) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return n.toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
  }

  function fmtTime(ms) {
    var s = Math.floor(ms / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    return (h ? h + 'h ' : '') + (m ? m + 'm ' : '') + sec + 's';
  }

  // ============================================================
  //  PERFORMANCE tab
  // ============================================================
  function renderPerformance() {
    body.innerHTML = '';

    // ---- Live FPS / Memory ----
    var liveCard = card('Live');

    var fpsRow = document.createElement('div');
    fpsRow.style.cssText = 'display:flex;justify-content:space-between;padding:5px 0;';
    fpsRow.innerHTML =
      '<span style="color:#aaa;">Frame rate</span>' +
      '<span id="tm-fps" style="color:#1db954;font-family:Menlo,monospace;font-weight:600;">' + fps + ' fps</span>';
    liveCard.appendChild(fpsRow);

    if (performance.memory) {
      var mem = performance.memory;
      var used = mem.usedJSHeapSize;
      var total = mem.totalJSHeapSize;
      var limit = mem.jsHeapSizeLimit;
      var pct = (used / limit) * 100;

      var memRow = document.createElement('div');
      memRow.style.cssText = 'padding:5px 0;';
      memRow.innerHTML =
        '<div style="display:flex;justify-content:space-between;">' +
          '<span style="color:#aaa;">JavaScript heap</span>' +
          '<span id="tm-mem-text" style="color:#fff;font-family:Menlo,monospace;">' +
            fmtBytes(used) + ' / ' + fmtBytes(limit) + '</span>' +
        '</div>';
      liveCard.appendChild(memRow);

      var barWrap = document.createElement('div');
      barWrap.id = 'tm-mem-bar';
      barWrap.appendChild(progressBar(pct, pct > 85 ? '#ff8a8a' : pct > 65 ? '#ffd400' : '#1db954'));
      liveCard.appendChild(barWrap);
    } else {
      liveCard.appendChild(statRow('JavaScript heap', 'Not exposed by browser', '#888'));
    }

    liveCard.appendChild(statRow('Page uptime', fmtTime(performance.now() - pageStart), '#1db954'));
    body.appendChild(liveCard);

    // ---- System resources ----
    var sysCard = card('System');

    var cores = navigator.hardwareConcurrency || 'unknown';
    sysCard.appendChild(statRow('CPU cores', cores));
    sysCard.appendChild(statRow('Device memory', (navigator.deviceMemory || 'unknown') + (navigator.deviceMemory ? ' GB' : '')));

    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(function (est) {
        var usage = est.usage || 0;
        var quota = est.quota || 0;
        var pct = quota ? (usage / quota) * 100 : 0;
        var diskRow = document.createElement('div');
        diskRow.style.cssText = 'padding:5px 0;';
        diskRow.innerHTML =
          '<div style="display:flex;justify-content:space-between;">' +
            '<span style="color:#aaa;">Storage used</span>' +
            '<span style="color:#fff;font-family:Menlo,monospace;">' +
              fmtBytes(usage) + ' / ' + fmtBytes(quota) + '</span>' +
          '</div>';
        sysCard.appendChild(diskRow);
        sysCard.appendChild(progressBar(pct, pct > 85 ? '#ff8a8a' : '#1db954'));
      }).catch(function () {});
    }

    body.appendChild(sysCard);

    // ---- Battery ----
    if ('getBattery' in navigator) {
      navigator.getBattery().then(function (b) {
        var battCard = card('Battery');
        var level = Math.round(b.level * 100);
        battCard.appendChild(statRow('Level', level + '%', level < 20 ? '#ff8a8a' : '#1db954'));
        battCard.appendChild(progressBar(level, level < 20 ? '#ff8a8a' : level < 50 ? '#ffd400' : '#1db954'));
        battCard.appendChild(statRow('Charging', b.charging ? 'Yes ⚡' : 'No', b.charging ? '#1db954' : '#888'));
        if (b.chargingTime && isFinite(b.chargingTime) && b.chargingTime > 0) {
          battCard.appendChild(statRow('Time to full', fmtTime(b.chargingTime * 1000)));
        }
        if (b.dischargingTime && isFinite(b.dischargingTime) && b.dischargingTime > 0) {
          battCard.appendChild(statRow('Time remaining', fmtTime(b.dischargingTime * 1000)));
        }
        body.appendChild(battCard);
      }).catch(function () {});
    }

    // ---- Network ----
    var netCard = card('Network');
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    netCard.appendChild(statRow('Online', navigator.onLine ? 'Yes' : 'No', navigator.onLine ? '#1db954' : '#ff8a8a'));
    if (conn) {
      netCard.appendChild(statRow('Type', conn.effectiveType || 'unknown'));
      netCard.appendChild(statRow('Downlink', (conn.downlink || 0) + ' Mbps'));
      netCard.appendChild(statRow('RTT', (conn.rtt || 0) + ' ms'));
      netCard.appendChild(statRow('Data saver', conn.saveData ? 'On' : 'Off'));
    }
    body.appendChild(netCard);
  }

  // ============================================================
  //  PROCESSES tab
  // ============================================================
  function renderProcesses() {
    body.innerHTML = '';

    // ---- Open windows ----
    var winCard = card('Open Windows (' + ((typeof ST !== 'undefined' && ST.windows) ? ST.windows.length : 0) + ')');
    var arr = (typeof ST !== 'undefined' && ST.windows) ? ST.windows : [];
    if (!arr.length) {
      var empty = document.createElement('div');
      empty.textContent = 'No windows open.';
      empty.style.cssText = 'color:#666;padding:6px 0;';
      winCard.appendChild(empty);
    } else {
      for (var i = 0; i < arr.length; i++) {
        (function (w, idx) {
          var row = document.createElement('div');
          row.style.cssText =
            'display:flex;align-items:center;gap:8px;padding:6px 0;' +
            'border-bottom:1px solid rgba(255,255,255,0.03);';
          var titleEl = w.el ? w.el.querySelector('.wt') : null;
          var title = titleEl ? titleEl.textContent : 'App';
          var iconEl = w.el ? w.el.querySelector('.wi') : null;
          var icon = iconEl ? iconEl.textContent : '🪟';
          row.innerHTML =
            '<span style="font-size:16px;">' + icon + '</span>' +
            '<span style="flex:1;color:#fff;">' + title + '</span>' +
            '<span style="color:#666;font-size:10px;">pid ' + (1000 + idx) + '</span>';
          var killBtn = document.createElement('button');
          killBtn.type = 'button';
          killBtn.textContent = 'Kill';
          killBtn.style.cssText =
            'background:#4a2028;border:none;color:#ff8a8a;padding:3px 10px;' +
            'border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;';
          killBtn.onclick = function () {
            try { if (w.el && w.el.parentNode) w.el.parentNode.removeChild(w.el); } catch (e) {}
            try { ST.windows.splice(idx, 1); } catch (e) {}
            if (typeof updateTaskbar === 'function') updateTaskbar();
            renderProcesses();
          };
          row.appendChild(killBtn);
          winCard.appendChild(row);
        })(arr[i], i);
      }
    }
    body.appendChild(winCard);

    // ---- Installed extensions ----
    if (window.Extensions) {
      var installed = window.Extensions.installed();
      var extCard = card('Extensions (' + installed.length + ')');
      if (!installed.length) {
        var emptyE = document.createElement('div');
        emptyE.textContent = 'No extensions installed.';
        emptyE.style.cssText = 'color:#666;padding:6px 0;';
        extCard.appendChild(emptyE);
      } else {
        var activeTheme = window.Extensions.getActiveTheme();
        installed.forEach(function (id) {
          var ext = window.Extensions.get(id);
          if (!ext) return;
          var isActive = activeTheme === id;
          var row = document.createElement('div');
          row.style.cssText =
            'display:flex;align-items:center;gap:8px;padding:6px 0;' +
            'border-bottom:1px solid rgba(255,255,255,0.03);';
          row.innerHTML =
            '<span style="font-size:16px;">' + ext.icon + '</span>' +
            '<span style="flex:1;color:#fff;">' + ext.name +
              (isActive ? ' <span style="color:#1db954;font-size:10px;">· active</span>' : '') +
            '</span>';
          var disBtn = document.createElement('button');
          disBtn.type = 'button';
          disBtn.textContent = isActive ? 'Deactivate' : 'Activate';
          disBtn.style.cssText =
            'background:' + (isActive ? '#4a2028' : '#1e4d6b') + ';border:none;' +
            'color:' + (isActive ? '#ff8a8a' : '#fff') + ';padding:3px 10px;' +
            'border-radius:4px;cursor:pointer;font-size:10px;';
          disBtn.onclick = function () {
            if (isActive) window.Extensions.setActiveTheme('none');
            else window.Extensions.setActiveTheme(ext.id);
            renderProcesses();
          };
          row.appendChild(disBtn);
          extCard.appendChild(row);
        });
      }
      body.appendChild(extCard);
    }

    // ---- Background services ----
    var svcCard = card('Background Services');

    var recActive = window.Capture && window.Capture.isRecording && window.Capture.isRecording();
    svcCard.appendChild(statRow('Screen recorder', recActive ? '🔴 Recording' : 'Idle', recActive ? '#ff8a8a' : '#888'));

    var kioskActive = typeof window.kioskIsLocked === 'function' && window.kioskIsLocked();
    svcCard.appendChild(statRow('Kiosk fullscreen', kioskActive ? 'Locked' : 'Inactive', kioskActive ? '#1db954' : '#888'));

    var pinSet = false;
    try { pinSet = (LS.getItem('oc_pin') || '').length === 6; } catch (e) {}
    svcCard.appendChild(statRow('PIN lock', pinSet ? 'Enabled' : 'Disabled', pinSet ? '#1db954' : '#888'));

    var accCount = window.Accounts ? window.Accounts.list().length : 0;
    svcCard.appendChild(statRow('Accounts', accCount + ' / ' + (window.Accounts ? window.Accounts.MAX : 3)));

    if (window.AppTrash) {
      var trashCount = 0;
      try { trashCount = (window.AppTrash.read() || []).length; } catch (e) {}
      svcCard.appendChild(statRow('Trashed apps', trashCount));
    }

    body.appendChild(svcCard);
    statusEl.textContent = 'Processes — ' + arr.length + ' window(s), ' + (window.Extensions ? window.Extensions.installed().length : 0) + ' extension(s)';
  }

  // ============================================================
  //  DEVICE tab
  // ============================================================
  function renderDevice() {
    body.innerHTML = '';

    // ---- OS / Browser ----
    var osCard = card('Operating System');
    osCard.appendChild(statRow('OpencoreOS version', 'v10.4'));

    var ua = navigator.userAgent;
    var browser = 'Unknown';
    if (ua.indexOf('Edg/') !== -1) browser = 'Microsoft Edge';
    else if (ua.indexOf('Chrome/') !== -1) browser = 'Google Chrome';
    else if (ua.indexOf('Firefox/') !== -1) browser = 'Firefox';
    else if (ua.indexOf('Safari/') !== -1) browser = 'Safari';
    osCard.appendChild(statRow('Browser', browser));

    var platform = navigator.platform || 'unknown';
    osCard.appendChild(statRow('Platform', platform));

    var vendor = navigator.vendor || 'unknown';
    osCard.appendChild(statRow('Vendor', vendor));

    osCard.appendChild(statRow('Language', navigator.language || 'unknown'));
    if (navigator.languages && navigator.languages.length) {
      osCard.appendChild(statRow('Languages', navigator.languages.join(', ')));
    }

    try {
      osCard.appendChild(statRow('Timezone', Intl.DateTimeFormat().resolvedOptions().timeZone));
    } catch (e) {}

    osCard.appendChild(statRow('Cookies enabled', navigator.cookieEnabled ? 'Yes' : 'No'));
    body.appendChild(osCard);

    // ---- Display ----
    var dispCard = card('Display');
    dispCard.appendChild(statRow('Screen size', screen.width + ' × ' + screen.height + ' px'));
    dispCard.appendChild(statRow('Available', screen.availWidth + ' × ' + screen.availHeight + ' px'));
    dispCard.appendChild(statRow('Viewport', window.innerWidth + ' × ' + window.innerHeight + ' px'));
    dispCard.appendChild(statRow('Pixel ratio', window.devicePixelRatio + '×'));
    dispCard.appendChild(statRow('Color depth', screen.colorDepth + '-bit'));
    dispCard.appendChild(statRow('Orientation', screen.orientation ? screen.orientation.type : 'unknown'));
    body.appendChild(dispCard);

    // ---- Input ----
    var inputCard = card('Input');
    inputCard.appendChild(statRow('Touch support', ('ontouchstart' in window) ? 'Yes' : 'No'));
    inputCard.appendChild(statRow('Max touch points', navigator.maxTouchPoints || 0));
    inputCard.appendChild(statRow('Pointer: fine', window.matchMedia('(pointer: fine)').matches ? 'Yes' : 'No'));
    inputCard.appendChild(statRow('Pointer: coarse', window.matchMedia('(pointer: coarse)').matches ? 'Yes' : 'No'));
    inputCard.appendChild(statRow('Hover support', window.matchMedia('(hover: hover)').matches ? 'Yes' : 'No'));
    body.appendChild(inputCard);

    // ---- GPU (async) ----
    var gpuCard = card('Graphics');
    var gpuEl = document.createElement('div');
    gpuEl.textContent = 'Detecting GPU…';
    gpuEl.style.cssText = 'color:#888;';
    gpuCard.appendChild(gpuEl);
    body.appendChild(gpuCard);

    try {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        var dbg = gl.getExtension('WEBGL_debug_renderer_info');
        var renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
        var gpuVendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
        gpuEl.textContent = '';
        gpuEl.appendChild(statRow('Renderer', renderer));
        gpuEl.appendChild(statRow('Vendor', gpuVendor));
        gpuEl.appendChild(statRow('WebGL version', gl.getParameter(gl.VERSION)));
        gpuEl.appendChild(statRow('Max texture size', gl.getParameter(gl.MAX_TEXTURE_SIZE) + ' px'));
      } else {
        gpuEl.textContent = 'WebGL not available.';
      }
    } catch (e) {
      gpuEl.textContent = 'GPU info unavailable.';
    }

    // ---- Full user agent ----
    var uaCard = card('Full User Agent');
    var uaText = document.createElement('div');
    uaText.textContent = ua;
    uaText.style.cssText =
      'color:#8ab4f8;font-family:Menlo,Consolas,monospace;font-size:10px;' +
      'line-height:1.5;word-break:break-all;padding:4px 0;';
    uaCard.appendChild(uaText);
    body.appendChild(uaCard);

    statusEl.textContent = 'Device info — ' + browser + ' on ' + platform;
  }

  // ============================================================
  //  Body dispatcher
  // ============================================================
  function renderBody() {
    if (current === 'perf') renderPerformance();
    else if (current === 'proc') renderProcesses();
    else if (current === 'device') renderDevice();
  }

  renderBody();

  // ============================================================
  //  Live ticker — updates the FPS + memory numbers every second
  // ============================================================
  tickTimer = setInterval(function () {
    if (current !== 'perf') return;

    var fpsEl = document.getElementById('tm-fps');
    if (fpsEl) fpsEl.textContent = fps + ' fps';

    if (performance.memory) {
      var mem = performance.memory;
      var used = mem.usedJSHeapSize;
      var limit = mem.jsHeapSizeLimit;
      var pct = (used / limit) * 100;

      var memText = document.getElementById('tm-mem-text');
      if (memText) memText.textContent = fmtBytes(used) + ' / ' + fmtBytes(limit);

      var memBar = document.getElementById('tm-mem-bar');
      if (memBar) {
        memBar.innerHTML = '';
        memBar.appendChild(progressBar(pct, pct > 85 ? '#ff8a8a' : pct > 65 ? '#ffd400' : '#1db954'));
      }
    }
  }, 1000);

  // Clean up when the window closes
  var origRemove = win.remove;
  win.remove = function () {
    if (tickTimer) clearInterval(tickTimer);
    if (origRemove) origRemove.call(win);
    else if (win.parentNode) win.parentNode.removeChild(win);
  };

  return win;
}

window.openTaskManager = openTaskManager;

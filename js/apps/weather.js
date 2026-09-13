// ============================================================
//  weather.js — Weather app for OpencoreOS v10.4
//  Includes °C / °F unit toggle (per-account)
//  Storage: LS → oc_weather_unit = 'C' | 'F'
// ============================================================

function openWeather(){
  // ---------- Units ----------
  function getUnit() {
    try { return LS.getItem('oc_weather_unit') || 'F'; } catch (e) { return 'F'; }
  }
  function setUnit(u) {
    try { LS.setItem('oc_weather_unit', u); } catch (e) {}
  }

  function cToF(c) { return (c * 9 / 5) + 32; }
  function cToDisplay(c, unit) {
    var v = unit === 'C' ? c : cToF(c);
    return Math.round(v) + '°' + unit;
  }

  var win = makeWindow('weather', 'Weather', '🌤️',
    '<div id="we-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
      + '<div style="padding:10px 14px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:10px;">'
        + '<div style="flex:1;color:#fff;font-weight:600;">Weather</div>'
        + '<div id="we-unit-toggle" style="display:flex;background:rgba(255,255,255,0.05);border-radius:8px;padding:2px;border:1px solid rgba(255,255,255,0.08);">'
          + '<button type="button" data-unit="C" class="we-unit-btn">°C</button>'
          + '<button type="button" data-unit="F" class="we-unit-btn">°F</button>'
        + '</div>'
      + '</div>'
      + '<div id="we-body" style="flex:1;overflow-y:auto;padding:14px;"></div>'
      + '<div id="we-status" style="padding:6px 14px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;"></div>'
    + '</div>', 500, 560);

  var c = win.querySelector('#we-app');
  var body = c.querySelector('#we-body');
  var statusEl = c.querySelector('#we-status');
  var toggleEl = c.querySelector('#we-unit-toggle');

  // ---------- Unit toggle styling ----------
  var unitBtns = toggleEl.querySelectorAll('.we-unit-btn');
  function paintToggle() {
    var u = getUnit();
    for (var i = 0; i < unitBtns.length; i++) {
      var b = unitBtns[i];
      var on = b.getAttribute('data-unit') === u;
      b.style.cssText =
        'background:' + (on ? '#1db954' : 'transparent') + ';' +
        'border:none;color:' + (on ? '#fff' : '#888') + ';' +
        'padding:5px 14px;border-radius:6px;cursor:pointer;' +
        'font-size:12px;font-weight:600;transition:background 0.15s;';
    }
  }
  for (var i = 0; i < unitBtns.length; i++) {
    (function (b) {
      b.onclick = function () {
        setUnit(b.getAttribute('data-unit'));
        paintToggle();
        render();
      };
    })(unitBtns[i]);
  }
  paintToggle();

  // ---------- Weather data ----------
  // Fake data with Celsius baseline. Real API optional.
  var FORECAST = {
    city: 'Your Location',
    current: {
      tempC: 22,
      condition: 'Partly Cloudy',
      icon: '⛅',
      humidity: 62,
      wind: 8,
      feelsC: 21
    },
    hourly: [
      { t: 'Now',  tempC: 22, icon: '⛅' },
      { t: '1 PM', tempC: 23, icon: '☀️' },
      { t: '2 PM', tempC: 24, icon: '☀️' },
      { t: '3 PM', tempC: 24, icon: '☀️' },
      { t: '4 PM', tempC: 23, icon: '⛅' },
      { t: '5 PM', tempC: 21, icon: '⛅' }
    ],
    daily: [
      { d: 'Today',     hiC: 24, loC: 17, icon: '⛅' },
      { d: 'Tomorrow',  hiC: 26, loC: 18, icon: '☀️' },
      { d: 'Wednesday', hiC: 23, loC: 16, icon: '🌧️' },
      { d: 'Thursday',  hiC: 21, loC: 15, icon: '🌧️' },
      { d: 'Friday',    hiC: 25, loC: 17, icon: '⛅' },
      { d: 'Saturday',  hiC: 27, loC: 19, icon: '☀️' },
      { d: 'Sunday',    hiC: 28, loC: 20, icon: '☀️' }
    ]
  };

  // ---------- Render ----------
  function card() {
    var el = document.createElement('div');
    el.style.cssText =
      'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);' +
      'border-radius:12px;padding:16px;margin-bottom:12px;';
    return el;
  }

  function render() {
    var unit = getUnit();
    body.innerHTML = '';

    // ---- Current ----
    var cur = card();
    cur.style.background = 'linear-gradient(135deg, rgba(90,169,255,0.15), rgba(29,185,84,0.1))';
    cur.style.borderColor = 'rgba(90,169,255,0.25)';
    cur.innerHTML =
      '<div style="display:flex;align-items:center;gap:14px;">' +
        '<div style="font-size:56px;line-height:1;">' + FORECAST.current.icon + '</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:38px;font-weight:300;color:#fff;line-height:1;">' +
            cToDisplay(FORECAST.current.tempC, unit) +
          '</div>' +
          '<div style="color:#cfd8dc;font-size:13px;margin-top:4px;">' + FORECAST.current.condition + '</div>' +
          '<div style="color:#888;font-size:11px;margin-top:2px;">' + FORECAST.city + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:16px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);">' +
        '<div style="flex:1;">' +
          '<div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Feels like</div>' +
          '<div style="color:#fff;font-size:14px;margin-top:2px;">' + cToDisplay(FORECAST.current.feelsC, unit) + '</div>' +
        '</div>' +
        '<div style="flex:1;">' +
          '<div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Humidity</div>' +
          '<div style="color:#fff;font-size:14px;margin-top:2px;">' + FORECAST.current.humidity + '%</div>' +
        '</div>' +
        '<div style="flex:1;">' +
          '<div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Wind</div>' +
          '<div style="color:#fff;font-size:14px;margin-top:2px;">' + FORECAST.current.wind + ' mph</div>' +
        '</div>' +
      '</div>';
    body.appendChild(cur);

    // ---- Hourly ----
    var hourly = card();
    hourly.innerHTML = '<div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Next 6 hours</div>';
    var hRow = document.createElement('div');
    hRow.style.cssText = 'display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;';
    FORECAST.hourly.forEach(function (h) {
      var el = document.createElement('div');
      el.style.cssText =
        'flex:0 0 auto;text-align:center;padding:8px 10px;background:rgba(255,255,255,0.03);' +
        'border-radius:8px;min-width:56px;';
      el.innerHTML =
        '<div style="color:#888;font-size:10px;">' + h.t + '</div>' +
        '<div style="font-size:22px;margin:4px 0;">' + h.icon + '</div>' +
        '<div style="color:#fff;font-size:12px;font-weight:600;">' + cToDisplay(h.tempC, unit) + '</div>';
      hRow.appendChild(el);
    });
    hourly.appendChild(hRow);
    body.appendChild(hourly);

    // ---- Daily ----
    var daily = card();
    daily.innerHTML = '<div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">7-day forecast</div>';
    FORECAST.daily.forEach(function (d) {
      var row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;gap:10px;padding:8px 0;' +
        'border-bottom:1px solid rgba(255,255,255,0.04);';
      row.innerHTML =
        '<div style="flex:1;color:#fff;font-size:13px;">' + d.d + '</div>' +
        '<div style="font-size:20px;margin-right:8px;">' + d.icon + '</div>' +
        '<div style="color:#888;font-size:12px;width:48px;text-align:right;">' + cToDisplay(d.loC, unit) + '</div>' +
        '<div style="color:#fff;font-size:12px;font-weight:600;width:48px;text-align:right;">' + cToDisplay(d.hiC, unit) + '</div>';
      daily.appendChild(row);
    });
    body.appendChild(daily);

    statusEl.textContent = 'Unit: ' + (unit === 'C' ? 'Celsius' : 'Fahrenheit') +
      ' — click °C or °F in the header to switch';
  }

  render();
  return win;
}

window.openWeather = openWeather;

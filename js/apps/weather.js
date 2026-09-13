// ============================================================
//  weather.js — Weather app for OpencoreOS v10.4
//  Uses real device location via navigator.geolocation
//  Fetches live data from Open-Meteo (no API key needed)
//  Storage: LS → oc_weather_unit = 'C' | 'F'
// ============================================================

function openWeather(){
  var UNIT_KEY = 'oc_weather_unit';

  function getUnit() {
    try { return LS.getItem(UNIT_KEY) || 'F'; } catch (e) { return 'F'; }
  }
  function setUnit(u) {
    try { LS.setItem(UNIT_KEY, u); } catch (e) {}
  }

  function cToF(c) { return (c * 9 / 5) + 32; }
  function displayTemp(c, unit) {
    var v = unit === 'C' ? c : cToF(c);
    return Math.round(v) + '°' + unit;
  }

  // WMO weather code → icon + label
  function wmoToInfo(code) {
    var map = {
      0:  { icon: '☀️', label: 'Clear sky' },
      1:  { icon: '🌤️', label: 'Mainly clear' },
      2:  { icon: '⛅', label: 'Partly cloudy' },
      3:  { icon: '☁️', label: 'Overcast' },
      45: { icon: '🌫️', label: 'Fog' },
      48: { icon: '🌫️', label: 'Rime fog' },
      51: { icon: '🌦️', label: 'Light drizzle' },
      53: { icon: '🌦️', label: 'Drizzle' },
      55: { icon: '🌦️', label: 'Dense drizzle' },
      61: { icon: '🌧️', label: 'Light rain' },
      63: { icon: '🌧️', label: 'Rain' },
      65: { icon: '🌧️', label: 'Heavy rain' },
      71: { icon: '🌨️', label: 'Light snow' },
      73: { icon: '🌨️', label: 'Snow' },
      75: { icon: '❄️', label: 'Heavy snow' },
      80: { icon: '🌦️', label: 'Rain showers' },
      81: { icon: '🌧️', label: 'Heavy showers' },
      82: { icon: '⛈️', label: 'Violent showers' },
      95: { icon: '⛈️', label: 'Thunderstorm' },
      96: { icon: '⛈️', label: 'Thunderstorm + hail' },
      99: { icon: '⛈️', label: 'Severe thunderstorm' }
    };
    return map[code] || { icon: '🌡️', label: 'Code ' + code };
  }

  var win = makeWindow('weather', 'Weather', '🌤️',
    '<div id="we-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
      + '<div style="padding:10px 14px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:10px;">'
        + '<div style="flex:1;color:#fff;font-weight:600;">Weather</div>'
        + '<button type="button" id="we-refresh" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;">Refresh</button>'
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

  var currentData = null;

  // ---------- Unit toggle ----------
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
        'font-size:12px;font-weight:600;';
    }
  }
  for (var i = 0; i < unitBtns.length; i++) {
    (function (b) {
      b.onclick = function () {
        setUnit(b.getAttribute('data-unit'));
        paintToggle();
        if (currentData) render(currentData);
      };
    })(unitBtns[i]);
  }
  paintToggle();

  // ---------- Loading / error states ----------
  function setLoading(msg) {
    body.innerHTML =
      '<div style="text-align:center;padding:60px 20px;color:#888;">' +
        '<div style="font-size:48px;margin-bottom:14px;">🌤️</div>' +
        '<div style="font-size:13px;">' + msg + '</div>' +
      '</div>';
  }

  function setError(msg) {
    body.innerHTML =
      '<div style="text-align:center;padding:40px 20px;">' +
        '<div style="font-size:48px;margin-bottom:14px;">📍</div>' +
        '<div style="color:#ff8a8a;font-size:14px;font-weight:600;margin-bottom:8px;">Location unavailable</div>' +
        '<div style="color:#888;font-size:12px;line-height:1.6;max-width:320px;margin:0 auto;">' + msg + '</div>' +
        '<button type="button" id="we-retry" style="margin-top:20px;background:#1db954;border:none;color:#fff;padding:9px 20px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;">Try again</button>' +
      '</div>';
    var r = body.querySelector('#we-retry');
    if (r) r.onclick = fetchWeather;
  }

  // ---------- Fetch geolocation + weather ----------
  function fetchWeather() {
    if (!navigator.geolocation) {
      setError('Your browser does not support the Geolocation API.');
      return;
    }

    setLoading('Requesting your location…');
    statusEl.textContent = 'Waiting for location permission…';

    navigator.geolocation.getCurrentPosition(
      function (position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        var acc = Math.round(position.coords.accuracy);

        statusEl.textContent = 'Location: ' + lat.toFixed(4) + ', ' + lon.toFixed(4) + ' (±' + acc + 'm) — fetching weather…';
        setLoading('Fetching weather for your location…');

        var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat +
          '&longitude=' + lon +
          '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
          '&hourly=temperature_2m,weather_code' +
          '&daily=temperature_2m_max,temperature_2m_min,weather_code' +
          '&timezone=auto' +
          '&forecast_days=7';

        fetch(url)
          .then(function (r) {
            if (!r.ok) throw new Error('Weather API returned ' + r.status);
            return r.json();
          })
          .then(function (data) {
            currentData = data;
            render(data);
          })
          .catch(function (err) {
            console.error('Weather fetch error:', err);
            setError('Could not fetch weather. ' + err.message);
          });
      },
      function (err) {
        var msg;
        if (err.code === 1) {
          msg = 'Location permission was denied. Click the 🔒 icon in your browser\'s address bar and allow location, then try again.';
        } else if (err.code === 2) {
          msg = 'Position unavailable. Your device may not have GPS or network location services enabled.';
        } else if (err.code === 3) {
          msg = 'Location request timed out. Try again — this often works the second time.';
        } else {
          msg = err.message || 'Unknown error.';
        }
        console.warn('Geolocation error:', err.code, err.message);
        setError(msg);
      },
      {
        enableHighAccuracy: false,   // faster, IP-based is fine for weather
        timeout: 15000,
        maximumAge: 10 * 60 * 1000    // cache for 10 min
      }
    );
  }

  // ---------- Render weather ----------
  function render(data) {
    var unit = getUnit();
    body.innerHTML = '';

    var cur = data.current;
    var curC = cur.temperature_2m;
    var feelsC = cur.apparent_temperature;
    var info = wmoToInfo(cur.weather_code);

    function card() {
      var el = document.createElement('div');
      el.style.cssText =
        'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);' +
        'border-radius:12px;padding:16px;margin-bottom:12px;';
      return el;
    }

    // ---- Current ----
    var curCard = card();
    curCard.style.background = 'linear-gradient(135deg, rgba(90,169,255,0.15), rgba(29,185,84,0.1))';
    curCard.style.borderColor = 'rgba(90,169,255,0.25)';
    curCard.innerHTML =
      '<div style="display:flex;align-items:center;gap:14px;">' +
        '<div style="font-size:56px;line-height:1;">' + info.icon + '</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:38px;font-weight:300;color:#fff;line-height:1;">' + displayTemp(curC, unit) + '</div>' +
          '<div style="color:#cfd8dc;font-size:13px;margin-top:4px;">' + info.label + '</div>' +
          '<div style="color:#888;font-size:11px;margin-top:2px;">Your location</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:16px;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);">' +
        '<div style="flex:1;">' +
          '<div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Feels like</div>' +
          '<div style="color:#fff;font-size:14px;margin-top:2px;">' + displayTemp(feelsC, unit) + '</div>' +
        '</div>' +
        '<div style="flex:1;">' +
          '<div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Humidity</div>' +
          '<div style="color:#fff;font-size:14px;margin-top:2px;">' + Math.round(cur.relative_humidity_2m) + '%</div>' +
        '</div>' +
        '<div style="flex:1;">' +
          '<div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Wind</div>' +
          '<div style="color:#fff;font-size:14px;margin-top:2px;">' + Math.round(cur.wind_speed_10m) + ' km/h</div>' +
        '</div>' +
      '</div>';
    body.appendChild(curCard);

    // ---- Hourly (next 6) ----
    var hourlyCard = card();
    hourlyCard.innerHTML = '<div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Next 6 hours</div>';
    var hRow = document.createElement('div');
    hRow.style.cssText = 'display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;';

    var now = new Date();
    var startIdx = 0;
    for (var hi = 0; hi < data.hourly.time.length; hi++) {
      if (new Date(data.hourly.time[hi]) >= now) { startIdx = hi; break; }
    }

    for (var k = startIdx; k < Math.min(startIdx + 6, data.hourly.time.length); k++) {
      var t = new Date(data.hourly.time[k]);
      var hourLabel = t.getHours() === now.getHours() && k === startIdx ? 'Now' :
        t.toLocaleTimeString('en-US', { hour: 'numeric' });
      var hInfo = wmoToInfo(data.hourly.weather_code[k]);
      var el = document.createElement('div');
      el.style.cssText =
        'flex:0 0 auto;text-align:center;padding:8px 10px;background:rgba(255,255,255,0.03);' +
        'border-radius:8px;min-width:56px;';
      el.innerHTML =
        '<div style="color:#888;font-size:10px;">' + hourLabel + '</div>' +
        '<div style="font-size:22px;margin:4px 0;">' + hInfo.icon + '</div>' +
        '<div style="color:#fff;font-size:12px;font-weight:600;">' + displayTemp(data.hourly.temperature_2m[k], unit) + '</div>';
      hRow.appendChild(el);
    }
    hourlyCard.appendChild(hRow);
    body.appendChild(hourlyCard);

    // ---- Daily (7 day) ----
    var dailyCard = card();
    dailyCard.innerHTML = '<div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">7-day forecast</div>';

    for (var d = 0; d < data.daily.time.length; d++) {
      var dd = new Date(data.daily.time[d] + 'T00:00:00');
      var dayLabel = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' :
        dd.toLocaleDateString('en-US', { weekday: 'short' });
      var dInfo = wmoToInfo(data.daily.weather_code[d]);

      var row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;gap:10px;padding:8px 0;' +
        'border-bottom:1px solid rgba(255,255,255,0.04);';
      row.innerHTML =
        '<div style="flex:1;color:#fff;font-size:13px;">' + dayLabel + '</div>' +
        '<div style="font-size:20px;margin-right:8px;">' + dInfo.icon + '</div>' +
        '<div style="color:#888;font-size:12px;width:48px;text-align:right;">' + displayTemp(data.daily.temperature_2m_min[d], unit) + '</div>' +
        '<div style="color:#fff;font-size:12px;font-weight:600;width:48px;text-align:right;">' + displayTemp(data.daily.temperature_2m_max[d], unit) + '</div>';
      dailyCard.appendChild(row);
    }
    body.appendChild(dailyCard);

    statusEl.textContent = 'Live data from Open-Meteo · Unit: ' + (unit === 'C' ? 'Celsius' : 'Fahrenheit');
  }

  // ---------- Init ----------
  c.querySelector('#we-refresh').onclick = fetchWeather;
  setLoading('Click Refresh to load your local weather.');
  statusEl.textContent = 'Ready — click Refresh';

  // Auto-fetch on open
  setTimeout(fetchWeather, 200);

  return win;
}

window.openWeather = openWeather;

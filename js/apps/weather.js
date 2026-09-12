function openWeather(){
  var win = makeWindow('weather', 'Weather', '🌤️', '<div class="wt" id="wt-c"><p style="color:#888;">Loading...</p></div>', 400, 300);
  var c = win.querySelector('#wt-c');
  function show(lat, lon){
    fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true').then(function(r){ return r.json(); }).then(function(d){
      var t = d.current_weather.temperature.toFixed(1);
      var code = d.current_weather.weathercode;
      var m = {0:'Clear',1:'Cloudy',2:'Cloudy',3:'Overcast',45:'Foggy',51:'Drizzle',61:'Rain',71:'Snow',80:'Showers',95:'Storm'};
      var cond = m[code] || 'Unknown';
      c.innerHTML = '<div style="font-size:48px;">🌤️</div><div class="temp">' + t + '°C</div><div class="cond">' + cond + '</div><div class="det"><span>' + lat.toFixed(2) + ', ' + lon.toFixed(2) + '</span></div>';
    }).catch(function(e){ c.innerHTML = '<p style="color:#888;">Error: ' + e.message + '</p>'; });
  }
  if(navigator.geolocation) navigator.geolocation.getCurrentPosition(function(p){ show(p.coords.latitude, p.coords.longitude); }, function(){ show(51.5, -0.12); });
  else show(51.5, -0.12);
}

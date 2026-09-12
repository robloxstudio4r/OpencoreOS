// ============================================================
//  music.js — Spotify app with proper login-state tracking
// ============================================================

var spotifyLoadStarted = false;
var spotifyReadyCallbacks = [];

function ensureSpotifyLoaded(callback){
  if(window.SpotifyAuth){ callback(); return; }
  spotifyReadyCallbacks.push(callback);
  if(spotifyLoadStarted) return;
  spotifyLoadStarted = true;

  var sdk = document.createElement('script');
  sdk.src = 'https://sdk.scdn.co/spotify-player.js';
  sdk.async = true;
  document.head.appendChild(sdk);

  var auth = document.createElement('script');
  auth.src = 'js/spotify-auth.js';
  auth.async = true;
  auth.onload = function(){
    var attempts = 0;
    var iv = setInterval(function(){
      attempts++;
      if(window.SpotifyAuth || attempts > 30){
        clearInterval(iv);
        var cbs = spotifyReadyCallbacks.slice();
        spotifyReadyCallbacks = [];
        for(var i=0; i<cbs.length; i++){ try { cbs[i](); } catch(e){ console.error(e); } }
      }
    }, 100);
  };
  auth.onerror = function(){
    var cbs = spotifyReadyCallbacks.slice();
    spotifyReadyCallbacks = [];
    for(var i=0; i<cbs.length; i++){ try { cbs[i](); } catch(e){ console.error(e); } }
  };
  document.head.appendChild(auth);
}

function openMusic(){
  var win = makeWindow('music', 'Spotify', '🎵',
    '<div id="mus-app"><p style="color:#888;padding:20px;">Loading Spotify...</p></div>', 620, 560);
  var c = win.querySelector('#mus-app');

  function renderNotAvailable(msg){
    c.innerHTML = '<div style="padding:20px;">'
      + '<p style="color:#ff6b6b;margin-bottom:10px;">' + msg + '</p>'
      + '<p style="color:#888;font-size:12px;">Make sure <b>js/spotify-auth.js</b> exists in the repo.</p>'
      + '<button id="retry-sp" style="margin-top:12px;background:#0078d4;border:none;color:#fff;padding:8px 18px;border-radius:6px;cursor:pointer;">Retry</button>'
      + '</div>';
    var rb = c.querySelector('#retry-sp');
    if(rb) rb.onclick = function(){ spotifyLoadStarted = false; ensureSpotifyLoaded(renderUI); };
  }

  function renderUI(){
    try {
      var isIn = window.SpotifyAuth && SpotifyAuth.isLoggedIn();
      console.log('Music app render — logged in:', isIn);

      c.innerHTML = '<div style="display:flex;gap:8px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:10px;flex-wrap:wrap;">'
        + '<input id="mus-q" placeholder="Search Spotify..." style="flex:1;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:8px 12px;border-radius:6px;outline:none;font-size:13px;min-width:150px;"' + (isIn ? '' : ' disabled') + '/>'
        + '<button id="mus-go" style="background:#1db954;border:none;color:#fff;padding:8px 18px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;"' + (isIn ? '' : ' disabled') + '>Search</button></div>'
        + '<div id="mus-login" style="display:' + (isIn ? 'none' : 'flex') + ';align-items:center;gap:10px;padding:12px;background:rgba(29,185,84,0.08);border:1px solid rgba(29,185,84,0.25);border-radius:8px;margin-bottom:12px;">'
        + '<span style="font-size:24px;">🎵</span>'
        + '<div style="flex:1;color:#ccc;font-size:12px;"><strong style="color:#1db954;">Login to Spotify</strong><br>Opens Spotify login, then returns here.</div>'
        + '<button id="mus-login-btn" style="background:#1db954;border:none;color:#fff;padding:6px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">Login</button></div>'
        + '<div id="mus-player"></div>'
        + '<div id="mus-results">' + (!isIn ? '<p style="color:#888;text-align:center;padding:20px;">Log in to search</p>' : '') + '</div>'
        + '<div id="mus-status" style="color:#888;font-size:11px;margin-top:8px;text-align:center;">' + (isIn ? 'Initializing player...' : '') + '</div>';

      var sI = c.querySelector('#mus-q');
      var sB = c.querySelector('#mus-go');
      var res = c.querySelector('#mus-results');
      var pA = c.querySelector('#mus-player');
      var st = c.querySelector('#mus-status');
      var lB = c.querySelector('#mus-login-btn');

      if (lB) lB.onclick = function(){ SpotifyAuth.login(); };

      function renderPlayer(state){
        if (!state || !state.track_window || !state.track_window.current_track) { pA.innerHTML = ''; return; }
        var t = state.track_window.current_track;
        var img = (t.album && t.album.images && t.album.images[0]) ? t.album.images[0].url : '';
        var artistNames = '';
        if (t.artists && t.artists.length) {
          for (var i = 0; i < t.artists.length; i++) {
            if (i > 0) artistNames += ', ';
            artistNames += t.artists[i].name;
          }
        }
        pA.innerHTML = '<div class="mp">'
          + (img ? '<img src="' + img + '"/>' : '')
          + '<div class="info"><div class="title">' + t.name + '</div>'
          + '<div class="artist">' + artistNames + '</div></div>'
          + '<div class="ctrl">'
          + '<button id="mp-prev">⏮</button>'
          + '<button class="pp2" id="mp-play">' + (state.paused ? '▶' : '⏸') + '</button>'
          + '<button id="mp-next">⏭</button></div></div>';
        pA.querySelector('#mp-play').onclick = function(){ SpotifyAuth.togglePlay(); };
        pA.querySelector('#mp-next').onclick = function(){ SpotifyAuth.nextTrack(); };
        pA.querySelector('#mp-prev').onclick = function(){ SpotifyAuth.previousTrack(); };
      }

      if (isIn) {
        SpotifyAuth.initPlayer({
          onReady: function(){ st.textContent = '✓ Player ready'; st.style.color = '#1db954'; },
          onStateChange: function(s){
            renderPlayer(s);
            // Broadcast track to the OS-wide mini player
            if (window.updateMiniPlayer) window.updateMiniPlayer(s);
          }
        });
      }

      function doSearch(){
        var q = sI.value.trim(); if (!q) return;
        res.innerHTML = '<p style="color:#888;padding:10px;">Searching...</p>';
        SpotifyAuth.search(q).then(function(d){
          if (!d.tracks || !d.tracks.items || !d.tracks.items.length) { res.innerHTML = '<p style="color:#888;">No results.</p>'; return; }
          res.innerHTML = '';
          for (var i = 0; i < d.tracks.items.length; i++) {
            var t = d.tracks.items[i];
            var div = document.createElement('div'); div.className = 'mr';
            var img = (t.album && t.album.images && t.album.images[0]) ? t.album.images[0].url : '';
            var artists = '';
            for (var a = 0; a < t.artists.length; a++) { if (a > 0) artists += ', '; artists += t.artists[a].name; }
            var dur = Math.floor(t.duration_ms / 1000);
            var durStr = Math.floor(dur / 60) + ':' + String(dur % 60).padStart(2, '0');
            div.innerHTML = '<div class="info">' + (img ? '<img src="' + img + '"/>' : '')
              + '<div style="min-width:0;"><div class="title">' + t.name + '</div>'
              + '<div class="artist">' + artists + ' · ' + durStr + '</div></div></div>'
              + '<button class="pb2" data-id="' + t.id + '">Play</button>';
            res.appendChild(div);
          }
          var btns = res.querySelectorAll('.pb2');
          for (var k = 0; k < btns.length; k++) {
            (function(b){
              b.onclick = function(){
                b.textContent = '...';
                SpotifyAuth.playTrack('spotify:track:' + b.getAttribute('data-id'))
                  .then(function(){ b.textContent = '✓'; setTimeout(function(){ b.textContent = 'Play'; }, 2000); })
                  .catch(function(e){ b.textContent = 'Play'; alert('Playback error: ' + e.message); });
              };
            })(btns[k]);
          }
        }).catch(function(e){ res.innerHTML = '<p style="color:#ff6b6b;padding:10px;">Search error: ' + e.message + '</p>'; });
      }
      sB.onclick = doSearch;
      sI.addEventListener('keydown', function(e){ if (e.key === 'Enter') doSearch(); });
    } catch (err) {
      console.error('Music UI error:', err);
      c.innerHTML = '<p style="color:#ff6b6b;padding:20px;">UI error: ' + err.message + '</p>';
    }
  }

  ensureSpotifyLoaded(function(){
    if (!window.SpotifyAuth) { renderNotAvailable('Could not load Spotify module.'); return; }
    renderUI();
  });
}

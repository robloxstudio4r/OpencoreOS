// ============================================================
//  music.js — Spotify app for OpencoreOS v10.4
//  Buttons: prev / play-pause / next — always visible, always synced
//  Syncs with mini-player via window.updateMiniPlayer(state)
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

// ---------- shared player state so mini-player + app agree ----------
var SpotifyPlayerState = {
  lastState: null,
  listeners: [],
  set: function(state){
    this.lastState = state;
    for (var i=0; i<this.listeners.length; i++){
      try { this.listeners[i](state); } catch(e){ console.error(e); }
    }
  },
  add: function(fn){ this.listeners.push(fn); }
};

function openMusic(){
  var win = makeWindow('music', 'Spotify', '🎵',
    '<div id="mus-app"><p style="color:#888;padding:20px;">Loading Spotify...</p></div>', 620, 560);
  var c = win.querySelector('#mus-app');

  function renderNotAvailable(msg){
    c.innerHTML = '<div style="padding:20px;">'
      + '<p style="color:#ff6b6b;margin-bottom:10px;">' + msg + '</p>'
      + '<p style="color:#888;font-size:12px;">Make sure <b>js/spotify-auth.js</b> exists in the repo.</p>'
      + '<button type="button" id="retry-sp" style="margin-top:12px;background:#0078d4;border:none;color:#fff;padding:8px 18px;border-radius:6px;cursor:pointer;">Retry</button>'
      + '</div>';
    var rb = c.querySelector('#retry-sp');
    if(rb) rb.onclick = function(e){ e.preventDefault();
      spotifyLoadStarted = false;
      ensureSpotifyLoaded(renderUI); };
  }

  function renderUI(){
    try {
      var isIn = window.SpotifyAuth && SpotifyAuth.isLoggedIn();
      console.log('Music app — logged in:', isIn);

      // ------- full UI: search row, login banner, player bar (ALWAYS present), results, status -------
      c.innerHTML =
        '<div style="display:flex;gap:8px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:10px;flex-wrap:wrap;">'
          + '<input id="mus-q" placeholder="Search Spotify..." style="flex:1;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:8px 12px;border-radius:6px;outline:none;font-size:13px;min-width:150px;"' + (isIn ? '' : ' disabled') + '/>'
          + '<button type="button" id="mus-go" style="background:#1db954;border:none;color:#fff;padding:8px 18px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;"' + (isIn ? '' : ' disabled') + '>Search</button>'
        + '</div>'
        + '<div id="mus-login" style="display:' + (isIn ? 'none' : 'flex') + ';align-items:center;gap:10px;padding:12px;background:rgba(29,185,84,0.08);border:1px solid rgba(29,185,84,0.25);border-radius:8px;margin-bottom:12px;">'
          + '<span style="font-size:24px;">🎵</span>'
          + '<div style="flex:1;color:#ccc;font-size:12px;"><strong style="color:#1db954;">Login to Spotify</strong><br>Opens Spotify login, then returns here.</div>'
          + '<button type="button" id="mus-login-btn" style="background:#1db954;border:none;color:#fff;padding:6px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">Login</button>'
        + '</div>'

        // ---- player bar: ALWAYS rendered, buttons disabled until ready ----
        + '<div id="mus-player-bar" style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:12px;">'
          + '<img id="mus-art" src="" style="width:56px;height:56px;border-radius:6px;object-fit:cover;background:rgba(255,255,255,0.06);"/>'
          + '<div style="flex:1;min-width:0;">'
            + '<div id="mus-title" style="color:#fff;font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Not playing</div>'
            + '<div id="mus-artist" style="color:#aaa;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">—</div>'
          + '</div>'
          + '<div style="display:flex;gap:6px;align-items:center;">'
            + '<button type="button" id="mus-prev" title="Previous" style="background:transparent;border:1px solid rgba(255,255,255,0.15);color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:14px;">⏮</button>'
            + '<button type="button" id="mus-play" title="Play/Pause" style="background:#1db954;border:none;color:#fff;width:42px;height:42px;border-radius:50%;cursor:pointer;font-size:16px;">▶</button>'
            + '<button type="button" id="mus-next" title="Next" style="background:transparent;border:1px solid rgba(255,255,255,0.15);color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:14px;">⏭</button>'
          + '</div>'
        + '</div>'

        + '<div id="mus-results">' + (!isIn ? '<p style="color:#888;text-align:center;padding:20px;">Log in to search</p>' : '') + '</div>'
        + '<div id="mus-status" style="color:#888;font-size:11px;margin-top:8px;text-align:center;">' + (isIn ? 'Initializing player...' : '') + '</div>';

      var sI = c.querySelector('#mus-q');
      var sB = c.querySelector('#mus-go');
      var res = c.querySelector('#mus-results');
      var st = c.querySelector('#mus-status');
      var lB = c.querySelector('#mus-login-btn');

      var artEl   = c.querySelector('#mus-art');
      var titleEl = c.querySelector('#mus-title');
      var artistEl= c.querySelector('#mus-artist');
      var playBtn = c.querySelector('#mus-play');
      var prevBtn = c.querySelector('#mus-prev');
      var nextBtn = c.querySelector('#mus-next');

      // ---------- login ----------
      if (lB) {
        lB.onclick = function(e){
          if (e) { e.preventDefault(); e.stopPropagation(); }
          try {
            var clientId = localStorage.getItem('opencore_spotify_client_id');
            if (!clientId) { alert('Please set your Spotify Client ID in Settings → Spotify first.'); return false; }
            if (window.SpotifyAuth && typeof SpotifyAuth.login === 'function') {
              SpotifyAuth.login();
            } else {
              alert('SpotifyAuth is not ready yet. Try again in a second.');
            }
          } catch (err) { console.error('Login click error:', err); alert('Login error: ' + err.message); }
          return false;
        };
      }

      // ---------- button handlers (always bound, even before a track plays) ----------
      playBtn.onclick = function(){
        SpotifyAuth.togglePlay().then(function(ok){
          if (!ok) console.warn('togglePlay returned false');
        }).catch(function(e){ console.error('togglePlay error:', e); });
      };
      nextBtn.onclick = function(){
        SpotifyAuth.nextTrack().then(function(ok){
          if (!ok) console.warn('nextTrack returned false');
        }).catch(function(e){ console.error('nextTrack error:', e); });
      };
      prevBtn.onclick = function(){
        SpotifyAuth.previousTrack().then(function(ok){
          if (!ok) console.warn('previousTrack returned false');
        }).catch(function(e){ console.error('previousTrack error:', e); });
      };

      // ---------- render state into the bar ----------
      function renderPlayer(state){
        if (!state || !state.track_window || !state.track_window.current_track) {
          titleEl.textContent = 'Not playing';
          artistEl.textContent = '—';
          artEl.src = '';
          playBtn.textContent = '▶';
          return;
        }
        var t = state.track_window.current_track;
        var img = (t.album && t.album.images && t.album.images[0]) ? t.album.images[0].url : '';
        var artistNames = (t.artists || []).map(function(a){ return a.name; }).join(', ');
        titleEl.textContent = t.name;
        artistEl.textContent = artistNames;
        if (img) artEl.src = img;
        playBtn.textContent = state.paused ? '▶' : '⏸';
      }

      // subscribe so this window redraws whenever state changes
      SpotifyPlayerState.add(renderPlayer);
      // if a state already exists (another window started playback), show it now
      if (SpotifyPlayerState.lastState) renderPlayer(SpotifyPlayerState.lastState);

      // ---------- start the SDK player ----------
      if (isIn) {
        SpotifyAuth.initPlayer({
          onReady: function(){
            st.textContent = '✓ Player ready';
            st.style.color = '#1db954';
          },
          onStateChange: function(s){
            SpotifyPlayerState.set(s);      // fan out to mini-player AND any open music windows
            if (window.updateMiniPlayer) window.updateMiniPlayer(s);
          }
        });
      }

      // ---------- search ----------
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
            var artists = (t.artists || []).map(function(a){ return a.name; }).join(', ');
            var dur = Math.floor(t.duration_ms / 1000);
            var durStr = Math.floor(dur / 60) + ':' + String(dur % 60).padStart(2, '0');
            div.innerHTML = '<div class="info">' + (img ? '<img src="' + img + '"/>' : '')
              + '<div style="min-width:0;"><div class="title">' + t.name + '</div>'
              + '<div class="artist">' + artists + ' · ' + durStr + '</div></div></div>'
              + '<button type="button" class="pb2" data-id="' + t.id + '">Play</button>';
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

// ============================================================
//  music.js — Spotify app for OpencoreOS v10.4
//  Shows exact status at every step, with a Free-account fallback
// ============================================================

var spotifyLoadStarted = false;
var spotifyReadyCallbacks = [];

function ensureSpotifyLoaded(callback){
  if(window.SpotifyAuth){ callback(); return; }
  spotifyReadyCallbacks.push(callback);
  if(spotifyLoadStarted) return;
  spotifyLoadStarted = true;

  // Load the SDK
  if (!window.Spotify) {
    var sdk = document.createElement('script');
    sdk.src = 'https://sdk.scdn.co/spotify-player.js';
    sdk.async = true;
    document.head.appendChild(sdk);
  }

  // Load the auth module
  var auth = document.createElement('script');
  auth.src = 'js/spotify-auth.js';
  auth.async = true;
  auth.onload = function(){
    var attempts = 0;
    var iv = setInterval(function(){
      attempts++;
      if(window.SpotifyAuth || attempts > 60){
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

  function renderUI(){
    var isIn = window.SpotifyAuth && SpotifyAuth.isLoggedIn();

    c.innerHTML =
      // Search bar
      '<div style="display:flex;gap:8px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:10px;flex-wrap:wrap;">'
        + '<input id="mus-q" placeholder="Search Spotify..." style="flex:1;background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.1);color:#fff;padding:8px 12px;border-radius:6px;outline:none;font-size:13px;min-width:150px;"' + (isIn ? '' : ' disabled') + '/>'
        + '<button type="button" id="mus-go" style="background:#1db954;border:none;color:#fff;padding:8px 18px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;"' + (isIn ? '' : ' disabled') + '>Search</button>'
      + '</div>'

      // Login banner (hidden if logged in)
      + '<div id="mus-login" style="display:' + (isIn ? 'none' : 'flex') + ';align-items:center;gap:10px;padding:12px;background:rgba(29,185,84,0.08);border:1px solid rgba(29,185,84,0.25);border-radius:8px;margin-bottom:12px;">'
        + '<span style="font-size:24px;">🎵</span>'
        + '<div style="flex:1;color:#ccc;font-size:12px;"><strong style="color:#1db954;">Login to Spotify</strong><br>Opens Spotify login, then returns here.</div>'
        + '<button type="button" id="mus-login-btn" style="background:#1db954;border:none;color:#fff;padding:6px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">Login</button>'
      + '</div>'

      // Player bar
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

      // Status banner
      + '<div id="mus-status-banner" style="display:none;padding:10px 14px;border-radius:8px;margin-bottom:12px;font-size:12px;line-height:1.5;"></div>'

      // Web player fallback (hidden by default)
      + '<div id="mus-fallback" style="display:none;padding:14px;background:rgba(29,185,84,0.08);border:1px solid rgba(29,185,84,0.25);border-radius:8px;margin-bottom:12px;">'
        + '<div style="color:#1db954;font-weight:600;margin-bottom:6px;">🎧 Open Spotify Web Player</div>'
        + '<div style="color:#aaa;font-size:12px;line-height:1.5;margin-bottom:10px;">'
          + 'Your account can still play music through Spotify\'s official web player. Sign in there once and use it in a separate tab.'
        + '</div>'
        + '<button type="button" id="mus-open-web" style="background:#1db954;border:none;color:#fff;padding:8px 18px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">Open Spotify Web Player</button>'
      + '</div>'

      // Results
      + '<div id="mus-results">' + (!isIn ? '<p style="color:#888;text-align:center;padding:20px;">Log in to search</p>' : '') + '</div>';

    var sI = c.querySelector('#mus-q');
    var sB = c.querySelector('#mus-go');
    var res = c.querySelector('#mus-results');
    var lB = c.querySelector('#mus-login-btn');
    var statusBanner = c.querySelector('#mus-status-banner');
    var fallback = c.querySelector('#mus-fallback');

    // ---------- Status helper ----------
    function setStatus(msg, type) {
      statusBanner.style.display = 'block';
      statusBanner.textContent = msg;
      if (type === 'success') {
        statusBanner.style.background = 'rgba(29,185,84,0.08)';
        statusBanner.style.border = '1px solid rgba(29,185,84,0.25)';
        statusBanner.style.color = '#1db954';
      } else if (type === 'error') {
        statusBanner.style.background = 'rgba(255,80,80,0.08)';
        statusBanner.style.border = '1px solid rgba(255,80,80,0.25)';
        statusBanner.style.color = '#ff8a8a';
      } else if (type === 'warn') {
        statusBanner.style.background = 'rgba(255,212,0,0.08)';
        statusBanner.style.border = '1px solid rgba(255,212,0,0.25)';
        statusBanner.style.color = '#ffd400';
      } else {
        statusBanner.style.background = 'rgba(90,169,255,0.08)';
        statusBanner.style.border = '1px solid rgba(90,169,255,0.25)';
        statusBanner.style.color = '#8ab4f8';
      }
    }

    // ---------- Login button ----------
    if (lB) {
      lB.onclick = function(e){
        if (e) { e.preventDefault(); e.stopPropagation(); }
        try {
          var clientId = null;
          try { clientId = LS.getItem('opencore_spotify_client_id'); } catch (x) {}
          if (!clientId) {
            try { clientId = localStorage.getItem('opencore_spotify_client_id'); } catch (x) {}
          }
          if (!clientId) { alert('Please set your Spotify Client ID in Settings → Spotify first.'); return; }
          SpotifyAuth.login();
        } catch (err) { console.error(err); alert('Login error: ' + err.message); }
      };
    }

    // ---------- Open web player ----------
    var webBtn = c.querySelector('#mus-open-web');
    if (webBtn) webBtn.onclick = function () {
      window.open('https://open.spotify.com', '_blank', 'noopener');
    };

    // ---------- Playback buttons ----------
    var artEl   = c.querySelector('#mus-art');
    var titleEl = c.querySelector('#mus-title');
    var artistEl= c.querySelector('#mus-artist');
    var playBtn = c.querySelector('#mus-play');
    var prevBtn = c.querySelector('#mus-prev');
    var nextBtn = c.querySelector('#mus-next');

    if (playBtn) playBtn.onclick = function(){
      SpotifyAuth.togglePlay().then(function(ok){
        if (!ok) console.warn('togglePlay returned false');
      });
    };
    if (nextBtn) nextBtn.onclick = function(){
      SpotifyAuth.nextTrack().then(function(ok){ if (!ok) console.warn('nextTrack failed'); });
    };
    if (prevBtn) prevBtn.onclick = function(){
      SpotifyAuth.previousTrack().then(function(ok){ if (!ok) console.warn('previousTrack failed'); });
    };

    // ---------- Render player state ----------
    function renderPlayer(state){
      if (!state) return;

      // Handle special error states
      if (state.sdkError) {
        setStatus(state.sdkError, 'error');
        if (state.sdkError.indexOf('Premium') !== -1) {
          fallback.style.display = 'block';
        }
        return;
      }
      if (state.premiumError) {
        setStatus(state.premiumError, 'error');
        fallback.style.display = 'block';
        return;
      }

      // Normal track state
      if (!state.track_window || !state.track_window.current_track) return;
      var t = state.track_window.current_track;
      var img = (t.album && t.album.images && t.album.images[0]) ? t.album.images[0].url : '';
      var artistNames = (t.artists || []).map(function(a){ return a.name; }).join(', ');
      titleEl.textContent = t.name;
      artistEl.textContent = artistNames;
      if (img) artEl.src = img;
      playBtn.textContent = state.paused ? '▶' : '⏸';
    }

    SpotifyPlayerState.add(renderPlayer);
    if (SpotifyPlayerState.lastState) renderPlayer(SpotifyPlayerState.lastState);

    // ---------- Initialize player ----------
    if (isIn) {
      setStatus('Checking Spotify account…', 'info');

      // Wait for the SDK to be available
      var sdkAttempts = 0;
      var sdkTimer = setInterval(function(){
        sdkAttempts++;

        if (typeof window.Spotify !== 'undefined' && window.Spotify && window.Spotify.Player) {
          clearInterval(sdkTimer);
          setStatus('✓ Spotify SDK loaded — checking account…', 'success');

          // Now verify account and init player
          SpotifyAuth.initPlayer({
            onReady: function(){
              setStatus('✓ Player ready — search for a song and click Play', 'success');
            },
            onStateChange: function(s){
              SpotifyPlayerState.set(s);
              if (window.updateMiniPlayer) window.updateMiniPlayer(s);
            }
          });

          // Also directly check Premium so we can show a clear message
          setTimeout(function(){
            SpotifyAuth.checkPremium().then(function (result) {
              if (!result.premium) {
                var product = result.user ? result.user.product : 'unknown';
                var msg = 'Your Spotify account is "' + product + '". The Web Playback SDK requires Spotify Premium. ';
                msg += 'You can search and browse, but playback will not work here.';
                setStatus(msg, 'warn');
                fallback.style.display = 'block';
              } else if (SpotifyAuth.isPlayerReady()) {
                setStatus('✓ Premium confirmed — player ready. Search and play!', 'success');
              } else {
                setStatus('✓ Premium confirmed — connecting player…', 'success');
              }
            });
          }, 2000);

        } else if (sdkAttempts > 30) {
          clearInterval(sdkTimer);
          setStatus('✗ Spotify SDK did not load. Check the browser console (F12). This usually means an ad blocker is blocking sdk.scdn.co.', 'error');
        }
      }, 500);
    }

    // ---------- Search ----------
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
                .catch(function(e){
                  b.textContent = 'Play';
                  setStatus('Playback failed: ' + e.message, 'error');
                  if (e.message.indexOf('Premium') !== -1) fallback.style.display = 'block';
                });
            };
          })(btns[k]);
        }
      }).catch(function(e){ res.innerHTML = '<p style="color:#ff6b6b;padding:10px;">Search error: ' + e.message + '</p>'; });
    }
    if (sB) sB.onclick = doSearch;
    if (sI) sI.addEventListener('keydown', function(e){ if (e.key === 'Enter') doSearch(); });
  }

  ensureSpotifyLoaded(function(){
    if (!window.SpotifyAuth) {
      c.innerHTML = '<p style="color:#ff6b6b;padding:20px;">Spotify module not loaded. Make sure <b>js/spotify-auth.js</b> exists.</p>';
      return;
    }
    renderUI();
  });
}

// ============================================================
//  spotify-auth.js — Bulletproof version for OpencoreOS v10.4
//  Handles PKCE OAuth + Web Playback SDK + search.
//  Never throws at load time.
// ============================================================

var SpotifyAuth = (function () {
  'use strict';

  var CLIENT_ID_KEY = 'opencore_spotify_client_id';
  var ACCESS_TOKEN_KEY = 'opencore_spotify_access_token';
  var REFRESH_TOKEN_KEY = 'opencore_spotify_refresh_token';
  var EXPIRY_KEY = 'opencore_spotify_token_expiry';
  var VERIFIER_KEY = 'opencore_spotify_code_verifier';
  var SCOPES = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state';

  var sdkPlayer = null;
  var deviceId = null;
  var onReadyCallback = null;
  var onStateChangeCallback = null;
  var pendingInit = false;

  // -------- Safe storage --------
  function store() {
    try {
      if (window.LS && typeof window.LS.getItem === 'function') return window.LS;
    } catch (e) {}
    try {
      window.localStorage.setItem('__spotify_test__', '1');
      window.localStorage.removeItem('__spotify_test__');
      return window.localStorage;
    } catch (e) {
      var m = {};
      return {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
        setItem: function (k, v) { m[k] = String(v); },
        removeItem: function (k) { delete m[k]; }
      };
    }
  }
  var S = store();

  // -------- PKCE --------
  function generateRandomString(len) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var values = new Uint32Array(len);
    crypto.getRandomValues(values);
    var out = '';
    for (var i = 0; i < len; i++) out += chars[values[i] % chars.length];
    return out;
  }
  function sha256(plain) {
    var encoder = new TextEncoder();
    return crypto.subtle.digest('SHA-256', encoder.encode(plain));
  }
  function base64url(buffer) {
    var bytes = new Uint8Array(buffer);
    var str = '';
    for (var i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function redirectUri() {
    return window.location.origin + window.location.pathname;
  }

  // Read client ID from scoped or unscoped storage
  function readClientId() {
    var v = null;
    try { v = S.getItem(CLIENT_ID_KEY); } catch (e) {}
    if (v) return v;
    try { v = localStorage.getItem(CLIENT_ID_KEY); } catch (e) {}
    return v || '';
  }

  // -------- Login --------
  function login() {
    try {
      var clientId = readClientId();
      if (!clientId) {
        alert('Please set your Spotify Client ID in Settings → Spotify first.');
        return;
      }
      var verifier = generateRandomString(64);
      S.setItem(VERIFIER_KEY, verifier);
      sha256(verifier).then(function (hashed) {
        var challenge = base64url(hashed);
        var url = 'https://accounts.spotify.com/authorize?' +
          'client_id=' + encodeURIComponent(clientId) +
          '&response_type=code' +
          '&redirect_uri=' + encodeURIComponent(redirectUri()) +
          '&scope=' + encodeURIComponent(SCOPES) +
          '&code_challenge_method=S256' +
          '&code_challenge=' + challenge;
        window.location.href = url;
      }).catch(function (err) {
        console.error('Login prepare failed:', err);
        alert('Could not prepare login: ' + err.message);
      });
    } catch (err) {
      console.error('Login error:', err);
      alert('Login error: ' + err.message);
    }
  }

  // -------- Callback --------
  function handleCallback() {
    return new Promise(function (resolve) {
      try {
        var params = new URLSearchParams(window.location.search);
        var code = params.get('code');
        var error = params.get('error');

        if (error) {
          console.warn('Spotify auth error:', error);
          window.history.replaceState({}, document.title, window.location.pathname);
          return resolve(false);
        }
        if (!code) return resolve(false);

        var clientId = readClientId();
        var verifier = S.getItem(VERIFIER_KEY);
        if (!clientId || !verifier) {
          window.history.replaceState({}, document.title, window.location.pathname);
          return resolve(false);
        }

        fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri(),
            client_id: clientId,
            code_verifier: verifier
          })
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data && data.access_token) {
              saveTokens(data);
              S.removeItem(VERIFIER_KEY);
              window.history.replaceState({}, document.title, window.location.pathname);
              console.log('✓ Spotify login successful');
              return resolve(true);
            }
            console.warn('Token exchange failed:', data);
            window.history.replaceState({}, document.title, window.location.pathname);
            resolve(false);
          })
          .catch(function (err) {
            console.error('Callback fetch error:', err);
            window.history.replaceState({}, document.title, window.location.pathname);
            resolve(false);
          });
      } catch (err) {
        console.error('Callback error:', err);
        try { window.history.replaceState({}, document.title, window.location.pathname); } catch (x) {}
        resolve(false);
      }
    });
  }

  function saveTokens(data) {
    try {
      if (data.access_token) S.setItem(ACCESS_TOKEN_KEY, data.access_token);
      if (data.refresh_token) S.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      if (data.expires_in) S.setItem(EXPIRY_KEY, String(Date.now() + data.expires_in * 1000));
    } catch (e) {}
  }

  // -------- Token refresh --------
  function getValidToken() {
    return new Promise(function (resolve) {
      try {
        var token = S.getItem(ACCESS_TOKEN_KEY);
        var expiry = parseInt(S.getItem(EXPIRY_KEY) || '0', 10);
        if (token && Date.now() < expiry - 60000) return resolve(token);

        var refresh = S.getItem(REFRESH_TOKEN_KEY);
        var clientId = readClientId();
        if (!refresh || !clientId) return resolve(null);

        fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refresh,
            client_id: clientId
          })
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data && data.access_token) {
              saveTokens(data);
              return resolve(data.access_token);
            }
            resolve(null);
          })
          .catch(function (err) { console.error('Refresh error:', err); resolve(null); });
      } catch (err) {
        console.error('getValidToken error:', err);
        resolve(null);
      }
    });
  }

  // -------- Logout --------
  function logout() {
    try {
      S.removeItem(ACCESS_TOKEN_KEY);
      S.removeItem(REFRESH_TOKEN_KEY);
      S.removeItem(EXPIRY_KEY);
      if (sdkPlayer) { try { sdkPlayer.disconnect(); } catch (e) {} }
      sdkPlayer = null;
      deviceId = null;
      console.log('Logged out of Spotify');
    } catch (e) {}
  }

  function isLoggedIn() {
    try { return !!S.getItem(REFRESH_TOKEN_KEY); } catch (e) { return false; }
  }

  // -------- Web Playback SDK --------
  function initPlayer(opts) {
    onReadyCallback = opts && opts.onReady ? opts.onReady : null;
    onStateChangeCallback = opts && opts.onStateChange ? opts.onStateChange : null;

    if (typeof window.Spotify === 'undefined' || !window.Spotify || !window.Spotify.Player) {
      console.warn('Spotify SDK not available yet — waiting for onSpotifyWebPlaybackSDKReady');
      pendingInit = true;
      return;
    }
    createPlayer();
  }

  function createPlayer() {
    if (sdkPlayer) {
      console.log('Spotify player already exists');
      return;
    }
    if (typeof window.Spotify === 'undefined' || !window.Spotify.Player) {
      console.warn('Spotify SDK still not loaded — cannot create player');
      pendingInit = true;
      return;
    }
    try {
      console.log('Creating Spotify Web Playback player...');
      sdkPlayer = new window.Spotify.Player({
        name: 'OpencoreOS Player',
        getOAuthToken: function (cb) {
          getValidToken().then(function (t) { if (t) cb(t); });
        },
        volume: 0.8
      });

      sdkPlayer.addListener('ready', function (data) {
        deviceId = data.device_id;
        console.log('✓ Spotify player ready:', deviceId);
        if (onReadyCallback) { try { onReadyCallback(deviceId); } catch (e) { console.error(e); } }
      });

      sdkPlayer.addListener('not_ready', function (data) {
        console.warn('Spotify player offline:', data.device_id);
      });

      sdkPlayer.addListener('player_state_changed', function (state) {
        if (!state) return;
        if (onStateChangeCallback) {
          try { onStateChangeCallback(state); } catch (e) { console.error('State callback error:', e); }
        }
      });

      sdkPlayer.addListener('initialization_error', function (e) {
        console.error('SDK init error:', e && e.message);
        alert('Spotify SDK could not initialize: ' + (e && e.message));
      });
      sdkPlayer.addListener('authentication_error', function (e) {
        console.error('SDK auth error:', e && e.message);
        alert('Spotify authentication error: ' + (e && e.message));
      });
      sdkPlayer.addListener('account_error', function (e) {
        console.error('SDK account error:', e && e.message);
        alert('Spotify account error: ' + (e && e.message) + '\n\nSpotify Premium is required for playback.');
      });

      sdkPlayer.connect();
    } catch (err) {
      console.error('Could not create Spotify player:', err);
      sdkPlayer = null;
    }
  }

  // Register the SDK-ready handler immediately
  function registerSdkReadyHandler() {
    window.onSpotifyWebPlaybackSDKReady = function () {
      console.log('✓ Spotify Web Playback SDK is ready');
      if (pendingInit) {
        pendingInit = false;
        createPlayer();
      }
    };
    // If SDK already loaded, fire manually
    if (typeof window.Spotify !== 'undefined' && window.Spotify.Player) {
      window.onSpotifyWebPlaybackSDKReady();
    }
  }
  registerSdkReadyHandler();

  // -------- Playback controls --------
  function playTrack(uri) {
    return new Promise(function (resolve, reject) {
      getValidToken().then(function (token) {
        if (!token) return reject(new Error('Not logged in.'));
        if (!deviceId) return reject(new Error('Player not ready. Wait a moment and try again.'));
        fetch('https://api.spotify.com/v1/me/player/play?device_id=' + deviceId, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ uris: [uri] })
        })
          .then(function (r) {
            if (r.ok || r.status === 204) return resolve(true);
            return r.text().then(function (t) { reject(new Error('Playback failed: ' + r.status + ' ' + t)); });
          })
          .catch(reject);
      });
    });
  }

  function togglePlay() {
    return new Promise(function (resolve) {
      if (!sdkPlayer) return resolve(false);
      try { sdkPlayer.togglePlay().then(function () { resolve(true); }); }
      catch (e) { console.error(e); resolve(false); }
    });
  }

  function nextTrack() {
    return new Promise(function (resolve) {
      if (!sdkPlayer) return resolve(false);
      try { sdkPlayer.nextTrack().then(function () { resolve(true); }); }
      catch (e) { resolve(false); }
    });
  }

  function previousTrack() {
    return new Promise(function (resolve) {
      if (!sdkPlayer) return resolve(false);
      try { sdkPlayer.previousTrack().then(function () { resolve(true); }); }
      catch (e) { resolve(false); }
    });
  }

  function setVolume(v) {
    if (sdkPlayer) try { sdkPlayer.setVolume(v); } catch (e) {}
  }

  // -------- Search --------
  function search(q) {
    return new Promise(function (resolve, reject) {
      getValidToken().then(function (token) {
        if (!token) return reject(new Error('Not logged in.'));
        fetch('https://api.spotify.com/v1/search?q=' + encodeURIComponent(q) + '&type=track&limit=10', {
          headers: { 'Authorization': 'Bearer ' + token }
        })
          .then(function (r) {
            if (!r.ok) return r.text().then(function () { reject(new Error('Search failed: ' + r.status)); });
            return r.json();
          })
          .then(resolve)
          .catch(reject);
      });
    });
  }

  // -------- Public API --------
  return {
    login: login,
    logout: logout,
    isLoggedIn: isLoggedIn,
    handleCallback: handleCallback,
    initPlayer: initPlayer,
    playTrack: playTrack,
    togglePlay: togglePlay,
    nextTrack: nextTrack,
    previousTrack: previousTrack,
    setVolume: setVolume,
    search: search,
    getValidToken: getValidToken,
    isSdkReady: function () { return !!(window.Spotify && window.Spotify.Player); },
    isPlayerReady: function () { return !!deviceId; }
  };
})();

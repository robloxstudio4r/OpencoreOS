// ================================================================
//  spotify-auth.js — Spotify PKCE Authentication & Web Playback SDK
//  For OpencoreOS on GitHub Pages
// ================================================================

const SpotifyAuth = (() => {
    const CLIENT_ID_KEY = 'opencore_spotify_client_id';
    const ACCESS_TOKEN_KEY = 'opencore_spotify_access_token';
    const REFRESH_TOKEN_KEY = 'opencore_spotify_refresh_token';
    const EXPIRY_KEY = 'opencore_spotify_token_expiry';
    const VERIFIER_KEY = 'opencore_spotify_code_verifier';
    const SCOPES = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state user-library-read';

    let sdkPlayer = null;
    let deviceId = null;
    let onReadyCallback = null;
    let onStateChangeCallback = null;

    // ---------------- PKCE Helpers ----------------
    function generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const values = new Uint32Array(length);
        crypto.getRandomValues(values);
        for (let i = 0; i < length; i++) result += chars[values[i] % chars.length];
        return result;
    }

    async function sha256(plain) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plain);
        return await crypto.subtle.digest('SHA-256', data);
    }

    function base64urlencode(buffer) {
        const bytes = new Uint8Array(buffer);
        let str = '';
        for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
        return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    // ---------------- Redirect URI ----------------
    function getRedirectUri() {
        // Must match EXACTLY what you set in Spotify Dashboard
        return window.location.origin + window.location.pathname;
    }

    // ---------------- Login (PKCE) ----------------
    async function login() {
        const clientId = localStorage.getItem(CLIENT_ID_KEY);
        if (!clientId) {
            alert('Please set your Spotify Client ID in Settings → Personalize first.');
            return;
        }
        const verifier = generateRandomString(64);
        localStorage.setItem(VERIFIER_KEY, verifier);
        const hashed = await sha256(verifier);
        const challenge = base64urlencode(hashed);
        const authUrl = 'https://accounts.spotify.com/authorize?' +
            'client_id=' + encodeURIComponent(clientId) +
            '&response_type=code' +
            '&redirect_uri=' + encodeURIComponent(getRedirectUri()) +
            '&scope=' + encodeURIComponent(SCOPES) +
            '&code_challenge_method=S256' +
            '&code_challenge=' + challenge;
        window.location.href = authUrl;
    }

    // ---------------- Handle Callback ----------------
    async function handleCallback() {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');
        if (error) {
            console.error('Spotify auth error:', error);
            window.history.replaceState({}, document.title, window.location.pathname);
            return false;
        }
        if (!code) return false;

        const clientId = localStorage.getItem(CLIENT_ID_KEY);
        const verifier = localStorage.getItem(VERIFIER_KEY);
        if (!clientId || !verifier) return false;

        try {
            const resp = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: getRedirectUri(),
                    client_id: clientId,
                    code_verifier: verifier
                })
            });
            const data = await resp.json();
            if (data.access_token) {
                saveTokens(data);
                localStorage.removeItem(VERIFIER_KEY);
                window.history.replaceState({}, document.title, window.location.pathname);
                console.log('✅ Spotify login successful!');
                return true;
            } else {
                console.error('Token exchange failed:', data);
                window.history.replaceState({}, document.title, window.location.pathname);
                return false;
            }
        } catch (err) {
            console.error('Callback error:', err);
            window.history.replaceState({}, document.title, window.location.pathname);
            return false;
        }
    }

    function saveTokens(data) {
        if (data.access_token) localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
        if (data.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
        if (data.expires_in) localStorage.setItem(EXPIRY_KEY, Date.now() + (data.expires_in * 1000));
    }

    // ---------------- Token Refresh ----------------
    async function getValidToken() {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) || '0');
        if (token && Date.now() < expiry - 60000) return token;

        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        const clientId = localStorage.getItem(CLIENT_ID_KEY);
        if (!refreshToken || !clientId) return null;

        try {
            const resp = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: clientId
                })
            });
            const data = await resp.json();
            if (data.access_token) {
                saveTokens(data);
                return data.access_token;
            }
        } catch (err) { console.error('Refresh error:', err); }
        return null;
    }

    // ---------------- Logout ----------------
    function logout() {
        [ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, EXPIRY_KEY].forEach(k => localStorage.removeItem(k));
        if (sdkPlayer) { try { sdkPlayer.disconnect(); } catch(e){} sdkPlayer = null; deviceId = null; }
        console.log('Logged out of Spotify.');
    }

    function isLoggedIn() {
        return !!localStorage.getItem(REFRESH_TOKEN_KEY);
    }

    // ---------------- Web Playback SDK ----------------
    function initPlayer({ onReady, onStateChange }) {
        onReadyCallback = onReady;
        onStateChangeCallback = onStateChange;

        if (!window.Spotify) {
            // SDK not loaded yet — will be called by window.onSpotifyWebPlaybackSDKReady
            window.__opencorePendingPlayerInit = true;
            return;
        }
        _createPlayer();
    }

    function _createPlayer() {
        if (sdkPlayer) return;
        sdkPlayer = new Spotify.Player({
            name: 'OpencoreOS Web Player',
            getOAuthToken: async (cb) => {
                const token = await getValidToken();
                if (token) cb(token);
            },
            volume: 0.8
        });

        sdkPlayer.addListener('ready', ({ device_id }) => {
            deviceId = device_id;
            console.log('✅ SDK Player ready. Device ID:', device_id);
            if (onReadyCallback) onReadyCallback(device_id);
        });
        sdkPlayer.addListener('not_ready', ({ device_id }) => {
            console.log('⚠️ Player went offline:', device_id);
        });
        sdkPlayer.addListener('player_state_changed', (state) => {
            if (onStateChangeCallback) onStateChangeCallback(state);
        });
        sdkPlayer.addListener('initialization_error', ({ message }) => console.error('SDK Init error:', message));
        sdkPlayer.addListener('authentication_error', ({ message }) => console.error('SDK Auth error:', message));
        sdkPlayer.addListener('account_error', ({ message }) => console.error('SDK Account error (Premium required):', message));

        sdkPlayer.connect();
    }

    // Called by the SDK script when it finishes loading
    window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('✅ Spotify SDK loaded.');
        if (window.__opencorePendingPlayerInit) {
            window.__opencorePendingPlayerInit = false;
            _createPlayer();
        }
    };

    // ---------------- Playback Controls ----------------
    async function playTrack(trackUri) {
        const token = await getValidToken();
        if (!token) { throw new Error('Not logged in.'); }
        if (!deviceId) { throw new Error('Player not ready yet. Please wait a moment.'); }
        const resp = await fetch(
            'https://api.spotify.com/v1/me/player/play?device_id=' + deviceId, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ uris: [trackUri] })
        });
        if (!resp.ok && resp.status !== 204) {
            const err = await resp.text();
            throw new Error('Playback failed: ' + resp.status + ' ' + err);
        }
    }

    async function togglePlay() {
        if (sdkPlayer) await sdkPlayer.togglePlay();
    }
    async function nextTrack() {
        if (sdkPlayer) await sdkPlayer.nextTrack();
    }
    async function previousTrack() {
        if (sdkPlayer) await sdkPlayer.previousTrack();
    }
    async function setVolume(v) {
        if (sdkPlayer) await sdkPlayer.setVolume(v);
    }

    // ---------------- Search ----------------
    async function search(query) {
        const token = await getValidToken();
        if (!token) throw new Error('Not logged in.');
        const resp = await fetch(
            'https://api.spotify.com/v1/search?q=' + encodeURIComponent(query) + '&type=track&limit=10', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!resp.ok) throw new Error('Search failed: ' + resp.status);
        return await resp.json();
    }

    // ---------------- Public API ----------------
    return {
        login,
        logout,
        isLoggedIn,
        handleCallback,
        initPlayer,
        playTrack,
        togglePlay,
        nextTrack,
        previousTrack,
        setVolume,
        search,
        getValidToken
    };
})();

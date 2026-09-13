// ============================================================
//  mini-player.js — OS-wide Spotify mini player
//  Shows track title, artist, duration, and playback controls.
//  Hardened: null-safe, promise-safe, drift-corrected.
// ============================================================

(function(){
  var el, art, title, artist, timeEl, playBtn, prevBtn, nextBtn, closeBtn;
  var currentState = null;
  var lastUpdateTime = 0;
  var progressInterval = null;

  function fmt(sec){
    if(!isFinite(sec) || sec < 0) sec = 0;
    sec = Math.floor(sec);
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  function show(){ if(el) el.classList.add('on'); }
  function hide(){ if(el) el.classList.remove('on'); }

  function updateButtons(){
    if(!currentState || !playBtn) return;
    playBtn.textContent = currentState.paused ? '▶' : '⏸';
  }

  function tick(){
    if(!currentState || !timeEl) return;
    var pos;
    if(currentState.paused){
      pos = currentState.position;
    } else {
      var elapsedSinceUpdate = (Date.now() - lastUpdateTime) / 1000;
      pos = currentState.position + elapsedSinceUpdate;
    }
    var dur = currentState.duration;
    if(pos > dur) pos = dur;
    timeEl.textContent = fmt(pos) + ' / ' + fmt(dur);
  }

  function updateMiniPlayer(state){
    try {
      if(!el) init();

      if(!state || !state.track_window || !state.track_window.current_track){
        currentState = null;
        if(title)  title.textContent = 'Not playing';
        if(artist) artist.textContent = '—';
        if(timeEl) timeEl.textContent = '0:00';
        if(art)    art.src = '';
        hide();
        return;
      }

      var t = state.track_window.current_track;
      var img = (t.album && t.album.images && t.album.images[0]) ? t.album.images[0].url : '';
      var artistNames = (t.artists || []).map(function(a){ return a.name; }).join(', ');

      currentState = {
        paused: state.paused,
        position: (state.position || 0) / 1000,
        duration: (state.duration || 0) / 1000,
        track: t
      };
      lastUpdateTime = Date.now();

      if(title)  title.textContent = t.name || 'Unknown';
      if(artist) artist.textContent = artistNames || 'Unknown artist';
      if(img && art) art.src = img;
      updateButtons();
      show();
      tick();
    } catch(e){
      console.error('Mini player error:', e);
    }
  }

  function safeCall(fnName){
    try {
      if(window.SpotifyAuth && typeof SpotifyAuth[fnName] === 'function'){
        var p = SpotifyAuth[fnName]();
        if(p && typeof p.catch === 'function') p.catch(function(e){ console.warn(fnName, e); });
      } else {
        console.warn('SpotifyAuth.' + fnName + ' not available');
      }
    } catch(e){ console.error(fnName + ' threw:', e); }
  }

  function init(){
    el = document.getElementById('miniPlayer');
    if(!el) return;
    art      = document.getElementById('miniPlayerArt');
    title    = document.getElementById('miniPlayerTitle');
    artist   = document.getElementById('miniPlayerArtist');
    timeEl   = document.getElementById('miniPlayerTime');
    playBtn  = document.getElementById('miniPlayerPlay');
    prevBtn  = document.getElementById('miniPlayerPrev');
    nextBtn  = document.getElementById('miniPlayerNext');
    closeBtn = document.getElementById('miniPlayerClose');

    if(playBtn)  playBtn.onclick  = function(e){ if(e) e.stopPropagation(); safeCall('togglePlay');    };
    if(prevBtn)  prevBtn.onclick  = function(e){ if(e) e.stopPropagation(); safeCall('previousTrack'); };
    if(nextBtn)  nextBtn.onclick  = function(e){ if(e) e.stopPropagation(); safeCall('nextTrack');     };
    if(closeBtn) closeBtn.onclick = function(e){ if(e) e.stopPropagation(); hide(); };

    if(!progressInterval){
      progressInterval = setInterval(tick, 500);
    }
  }

  window.updateMiniPlayer = updateMiniPlayer;

  window.addEventListener('load', function(){
    if(window.SpotifyPlayerState && typeof SpotifyPlayerState.add === 'function'){
      SpotifyPlayerState.add(updateMiniPlayer);
    }
  });

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

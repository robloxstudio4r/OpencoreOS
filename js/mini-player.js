// ============================================================
//  mini-player.js — OS-wide Spotify mini player
//  Shows track title, artist, duration, and playback controls.
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

  function show(){
    if(el) el.classList.add('on');
  }

  function hide(){
    if(el) el.classList.remove('on');
  }

  function updateButtons(){
    if(!currentState) return;
    if(currentState.paused){
      playBtn.textContent = '▶';
    } else {
      playBtn.textContent = '⏸';
    }
  }

  function tick(){
    if(!currentState) return;
    if(currentState.paused) return;
    var now = Date.now();
    var elapsedSinceUpdate = (now - lastUpdateTime) / 1000;
    var pos = currentState.position + elapsedSinceUpdate;
    var dur = currentState.duration;
    if(pos > dur) pos = dur;
    timeEl.textContent = fmt(pos) + ' / ' + fmt(dur);
  }

  function updateMiniPlayer(state){
    try {
      if(!el) init();

      if(!state || !state.track_window || !state.track_window.current_track){
        currentState = null;
        title.textContent = 'Not playing';
        artist.textContent = '—';
        timeEl.textContent = '0:00';
        art.src = '';
        hide();
        return;
      }

      var t = state.track_window.current_track;
      var img = (t.album && t.album.images && t.album.images[0]) ? t.album.images[0].url : '';
      var artistNames = '';
      if(t.artists && t.artists.length){
        for(var i=0; i<t.artists.length; i++){
          if(i > 0) artistNames += ', ';
          artistNames += t.artists[i].name;
        }
      }

      currentState = {
        paused: state.paused,
        position: state.position / 1000,
        duration: state.duration / 1000,
        track: t
      };
      lastUpdateTime = Date.now();

      title.textContent = t.name || 'Unknown';
      artist.textContent = artistNames || 'Unknown artist';
      if(img) art.src = img;
      updateButtons();
      show();
      tick();
    } catch(e){
      console.error('Mini player error:', e);
    }
  }

  function init(){
    el = document.getElementById('miniPlayer');
    if(!el) return;
    art = document.getElementById('miniPlayerArt');
    title = document.getElementById('miniPlayerTitle');
    artist = document.getElementById('miniPlayerArtist');
    timeEl = document.getElementById('miniPlayerTime');
    playBtn = document.getElementById('miniPlayerPlay');
    prevBtn = document.getElementById('miniPlayerPrev');
    nextBtn = document.getElementById('miniPlayerNext');
    closeBtn = document.getElementById('miniPlayerClose');

    playBtn.onclick = function(){
      if(window.SpotifyAuth) SpotifyAuth.togglePlay();
    };
    prevBtn.onclick = function(){
      if(window.SpotifyAuth) SpotifyAuth.previousTrack();
    };
    nextBtn.onclick = function(){
      if(window.SpotifyAuth) SpotifyAuth.nextTrack();
    };
    closeBtn.onclick = function(){
      hide();
    };

    if(!progressInterval){
      progressInterval = setInterval(tick, 500);
    }
  }

  // Expose globally so music.js can call it
  window.updateMiniPlayer = updateMiniPlayer;

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

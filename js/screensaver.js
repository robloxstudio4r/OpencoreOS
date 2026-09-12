function resetIdle(){
  ST.lastActivity = Date.now();
  if(ST.screensaverActive){
    var s = $('screensaver'); if(s) s.classList.remove('on');
    ST.screensaverActive = false;
  }
}

function checkIdle(){
  var sleep = $('sleepOverlay');
  if(sleep && sleep.classList.contains('on')) return;
  var lg = $('login');
  if(lg && lg.classList.contains('on')) return;
  if(Date.now() - ST.lastActivity > ST.idleTimeout){
    if(!ST.screensaverActive){
      var s = $('screensaver'); if(s) s.classList.add('on');
      ST.screensaverActive = true;
    }
  }
}
setInterval(checkIdle, 2000);

document.addEventListener('mousemove', resetIdle);
document.addEventListener('keydown', resetIdle);
document.addEventListener('click', function(){
  resetIdle();
  if(ST.screensaverActive){
    var s = $('screensaver'); if(s) s.classList.remove('on');
    ST.screensaverActive = false;
  }
});

function goToSleep(){ var s = $('sleepOverlay'); if(s) s.classList.add('on'); }

document.addEventListener('DOMContentLoaded', function(){
  var sleep = $('sleepOverlay');
  if(sleep) sleep.addEventListener('click', function(){ sleep.classList.remove('on'); resetIdle(); });
});

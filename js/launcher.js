// ============================================================
//  launcher.js — App launcher for OpencoreOS v10.4
//  Maps data-a app IDs → open* functions.
//  Checks AppLock and AppTrash before launching.
//  Recovery is hidden — only reachable via Developer Tools.
// ============================================================

function launch(appId, extra){
  if(!appId) return;

  // ---- Recovery is hidden: block direct launch ----
  if (appId === 'recovery') {
    console.warn('Recovery is hidden. Use Developer Tools → Flags → Open Recovery Environment.');
    return;
  }

  // ---- Trash check ----
  if (window.AppTrash && typeof window.AppTrash.isTrashed === 'function' && window.AppTrash.isTrashed(appId)) {
    alert('This app is in the Trash.\n\nOpen 🗑️ Trash from the Start menu to restore it.');
    return;
  }

  // ---- App Lock check ----
  if (window.AppLock && typeof window.AppLock.isLocked === 'function' && window.AppLock.isLocked(appId)) {
    var allowed = false;
    window.AppLock.promptUnlock(appId, function () { allowed = true; });
    if (!allowed) return;
  }

  // ---- Core apps ----
  if(appId === 'system32') return openFiles('/System32');
  if(appId === 'files')    return openFiles('/');
  if(appId === 'terminal') return openTerminal();
  if(appId === 'notepad')  return openNotepad(extra);
  if(appId === 'calculator') return openCalculator();
  if(appId === 'browser')  return openBrowser();
  if(appId === 'music')    return openMusic();
  if(appId === 'camera')   return openCamera();
  if(appId === 'microphone') return openMicrophone();
  if(appId === 'audioplayer') return openAudioPlayer();
  if(appId === 'wallpaper') return openWallpaper();
  if(appId === 'weather')  return openWeather();
  if(appId === 'clock')    return openClock();
  if(appId === 'calendar') return openCalendar();
  if(appId === 'sysinfo')  return openSysInfo();
  if(appId === 'appstore') return openAppStore();

  // ---- Image / media tools ----
  if(appId === 'photoeditor'){
    if(typeof openPhotoEditor === 'function') return openPhotoEditor(extra);
    console.warn('openPhotoEditor is not loaded');
    return;
  }
  if(appId === 'imageviewer') return openImageViewer(extra);

  // ---- Iframe apps ----
  if(appId === 'kernel0')  return makeIframeApp('kernel0',  'Kernel0',       '🧠', 'https://kernel0.lovable.app');
  if(appId === 'videohub') return makeIframeApp('videohub', 'VideoHub',      '🎬', 'https://videohubpro.lovable.app');
  if(appId === 'vapor')    return makeIframeApp('vapor',    'Vapor',         '💨', 'https://vapor.freetls.fastly.net/');
  if(appId === 'science')  return makeIframeApp('science',  'Science',       '🔬', 'https://fastly-science-883451.josiah-wilke77.workers.dev/');
  if(appId === 'infinity') return makeIframeApp('infinity', 'Infinity Drink','🥤', 'https://infinity-drink-order.textaway2.workers.dev/');

  // ---- System ----
  if(appId === 'settings') return openSettings();

  console.warn('Unknown app:', appId);
}

window.launch = launch;

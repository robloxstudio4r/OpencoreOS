function launch(appId, extra){
  if(appId === 'system32') return openFiles('/System32');
  if(appId === 'files') return openFiles('/');
  if(appId === 'terminal') return openTerminal();
  if(appId === 'notepad') return openNotepad(extra);
  if(appId === 'calculator') return openCalculator();
  if(appId === 'browser') return openBrowser();
  if(appId === 'music') return openMusic();
  if(appId === 'camera') return openCamera();
  if(appId === 'microphone') return openMicrophone();
  if(appId === 'audioplayer') return openAudioPlayer();
  if(appId === 'wallpaper') return openWallpaper();
  if(appId === 'weather') return openWeather();
  if(appId === 'clock') return openClock();
  if(appId === 'calendar') return openCalendar();
  if(appId === 'sysinfo') return openSysInfo();
  if(appId === 'appstore') return openAppStore();
  if(appId === 'recovery') return openRecovery();
  if(appId === 'kernel0') return makeIframeApp('kernel0', 'Kernel0', '🧠', 'https://kernel0.lovable.app');
  if(appId === 'videohub') return makeIframeApp('videohub', 'VideoHub', '🎬', 'https://videohubpro.lovable.app');
  if(appId === 'vapor') return makeIframeApp('vapor', 'Vapor', '💨', 'https://vapor.freetls.fastly.net/');
  if(appId === 'science') return makeIframeApp('science', 'Science', '🔬', 'https://fastly-science-883451.josiah-wilke77.workers.dev/');
  if(appId === 'infinity') return makeIframeApp('infinity', 'Infinity Drink', '🥤', 'https://infinity-drink-order.textaway2.workers.dev/');
  if(appId === 'settings') return openSettings();
  if(appId === 'imageviewer') return openImageViewer(extra);
}

function openSysInfo(){
  var m = 'N/A';
  try { if(performance.memory) m = (performance.memory.usedJSHeapSize/1048576).toFixed(1) + ' MB'; } catch(e){}
  var u = Math.floor((Date.now() - ST.bootTime) / 1000);
  makeWindow('sysinfo', 'System Info', 'ℹ️',
    '<div class="ig">'
    + '<div class="ic2"><div class="lbl">OS</div><div class="val">OpencoreOS v10.4</div></div>'
    + '<div class="ic2"><div class="lbl">Device</div><div class="val">' + (LS.getItem('oc_device_name') || 'Opencore-PC') + '</div></div>'
    + '<div class="ic2"><div class="lbl">Language</div><div class="val">' + (LS.getItem('oc_lang') || 'en') + '</div></div>'
    + '<div class="ic2"><div class="lbl">Keyboard</div><div class="val">' + (LS.getItem('oc_kb') || 'us') + '</div></div>'
    + '<div class="ic2"><div class="lbl">Uptime</div><div class="val">' + Math.floor(u/60) + 'm ' + (u%60) + 's</div></div>'
    + '<div class="ic2"><div class="lbl">CPU</div><div class="val">' + (navigator.hardwareConcurrency || 'N/A') + '</div></div>'
    + '<div class="ic2"><div class="lbl">Memory</div><div class="val">' + m + '</div></div>'
    + '<div class="ic2"><div class="lbl">Files</div><div class="val">' + VFS.count() + '</div></div>'
    + '<div class="ic2"><div class="lbl">Storage</div><div class="val">' + VFS.size() + ' bytes</div></div>'
    + '<div class="ic2"><div class="lbl">Online</div><div class="val">' + (navigator.onLine ? 'Yes' : 'No') + '</div></div>'
    + '</div>', 480, 420);
}

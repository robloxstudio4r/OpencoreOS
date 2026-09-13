// ============================================================
//  help.js — Help & Guide for OpencoreOS v10.4
//  Start menu only — not on desktop.
// ============================================================

function openHelp(){
  var win = makeWindow('help', 'Help', '❓',
    '<div id="help-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
      + '<div style="padding:10px 14px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:10px;">'
        + '<input id="help-search" type="text" placeholder="Search help topics..." '
          + 'style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);color:#fff;'
          + 'padding:8px 12px;border-radius:8px;outline:none;font-size:13px;"/>'
        + '<div id="help-count" style="color:#666;font-size:11px;"></div>'
      + '</div>'
      + '<div id="help-body" style="flex:1;overflow-y:auto;padding:14px;"></div>'
      + '<div style="padding:8px 14px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;text-align:center;">'
        + 'OpencoreOS v10.4 — Help Guide'
      + '</div>'
    + '</div>', 720, 600);

  var c = win.querySelector('#help-app');
  var body = c.querySelector('#help-body');
  var search = c.querySelector('#help-search');
  var countEl = c.querySelector('#help-count');

  // ============================================================
  //  Help content — organized by section
  // ============================================================
  var SECTIONS = [
    {
      title: 'Getting Started',
      icon: '🚀',
      entries: [
        { t: 'Sign in to an account', d: 'When OpencoreOS boots, the account picker appears. Click your account tile. If it has a password, enter it. Otherwise you go straight to the desktop.' },
        { t: 'Add up to 3 accounts', d: 'Go to Settings → Users → + Add Account. Each account has its own files, apps, wallpaper, Spotify login, extensions, and accessibility preferences.' },
        { t: 'Switch accounts', d: 'Settings → Users → Switch Account. You will be signed out and the account picker will reappear.' },
        { t: 'Lock the screen', d: 'Start menu → 🔒 Lock. If you have a device PIN set, the PIN pad appears. Otherwise the desktop stays unlocked.' },
        { t: 'Sleep mode', d: 'Start menu → 🌙 Sleep. Click anywhere to wake.' },
        { t: 'Shut down', d: 'Start menu → ⏻ Shutdown. Releases fullscreen, shows a shutdown screen.' },
        { t: 'Restart', d: 'Start menu → 🔄 Restart. Reloads the page, keeps the current account signed in.' }
      ]
    },
    {
      title: 'Desktop & Windows',
      icon: '🖥️',
      entries: [
        { t: 'Move an icon', d: 'Click and drag any desktop icon to move it to a new grid position. The position is saved automatically.' },
        { t: 'Rename an icon', d: 'Long-press (or right-click) an icon → Rename, or use the built-in Edit App dialog.' },
        { t: 'Remove from desktop', d: 'Long-press an icon → the app editor → Remove. The app stays in the Start menu.' },
        { t: 'Reset icons', d: 'Settings → System → Reset Desktop Icons. Restores the default layout.' },
        { t: 'Open the Start menu', d: 'Click the 🪟 Start button at the bottom-left, or press it with keyboard focus.' },
        { t: 'Close a window', d: 'Click the ✕ in the window title bar.' },
        { t: 'Minimize', d: 'Click the − in the title bar. Restore from the taskbar.' }
      ]
    },
    {
      title: 'Files & VFS',
      icon: '📁',
      entries: [
        { t: 'Browse files', d: 'Open Files. The virtual file system has Documents, Pictures, Audio, and System32 folders.' },
        { t: 'Create a file', d: 'In Terminal: "touch myfile.txt" then "echo hello > myfile.txt" (or use Notepad).' },
        { t: 'Create a folder', d: 'In Terminal: "mkdir MyFolder".' },
        { t: 'Delete a file', d: 'In Terminal: "rm myfile.txt". Or use Files app and click the ✕.' },
        { t: 'Save a file from Notepad', d: 'File → Save, or Ctrl+S. It saves to the current VFS folder.' },
        { t: 'System32 is protected', d: 'You cannot write or delete inside /System32. It contains core system files.' }
      ]
    },
    {
      title: 'Terminal Commands',
      icon: '💻',
      entries: [
        { t: 'help', d: 'Shows the command list.' },
        { t: 'ls [path]', d: 'Lists files in the current directory or the given path.' },
        { t: 'cd <path>', d: 'Changes directory. "cd .." goes up, "cd /" goes to root.' },
        { t: 'cat <file>', d: 'Prints the contents of a file.' },
        { t: 'mkdir <name>', d: 'Creates a folder.' },
        { t: 'touch <name>', d: 'Creates an empty file.' },
        { t: 'rm <name>', d: 'Deletes a file or folder.' },
        { t: 'echo <text>', d: 'Prints text back.' },
        { t: 'whoami', d: 'Shows the current user.' },
        { t: 'date', d: 'Shows the current date and time.' },
        { t: 'ver', d: 'Shows the OS version.' },
        { t: 'exit', d: 'Closes the Terminal.' },
        { t: 'backup', d: 'Downloads a .ocbackup file containing this account\'s files, settings, and apps.' },
        { t: 'restore', d: 'Opens a file picker to restore a .ocbackup file into the current account.' }
      ]
    },
    {
      title: 'Settings',
      icon: '⚙️',
      entries: [
        { t: 'System tab', d: 'Rename device, view file count and storage used, reset desktop icons.' },
        { t: 'Network tab', d: 'Toggle Wi-Fi, view connection type, see online status.' },
        { t: 'Bluetooth tab', d: 'Toggle Bluetooth, scan for BLE devices (heart rate monitors, fitness bands, etc.).' },
        { t: 'Security tab', d: 'Set or remove a 6-digit PIN, lock the screen now. The System32 admin PIN is shown here as a reminder.' },
        { t: 'Users tab', d: 'Add up to 3 accounts, rename them, set passwords, sign in as a different account, delete accounts.' },
        { t: 'A11y tab', d: 'Narrator, magnifier, text size, high contrast, focus ring, reduce motion. All per-account.' },
        { t: 'Extensions tab', d: 'See installed extensions, open the store, customize each one.' },
        { t: 'Spotify tab', d: 'Paste your Spotify Client ID, log in, or log out. The Client ID is what enables Spotify login.' },
        { t: 'About tab', d: 'Shows the OS version. Click the 🪟 emoji 5 times to unlock Developer Tools.' }
      ]
    },
    {
      title: 'Spotify Music',
      icon: '🎵',
      entries: [
        { t: 'Set up Spotify', d: 'Go to Settings → Spotify. Paste your Client ID from developer.spotify.com/dashboard. Click Save. Then Login.' },
        { t: 'Play music', d: 'Open Music (Spotify). Search for a song, then click Play on any result.' },
        { t: 'Playback controls', d: 'Prev, Play/Pause, Next buttons in the Music app and in the mini-player at the bottom of the screen.' },
        { t: 'Mini-player', d: 'Appears when a song starts. Stays visible even if you close the Music window. Controls work from here.' },
        { t: 'Spotify Premium required', d: 'The Web Playback SDK only works with Spotify Premium. Free accounts can search but not play.' }
      ]
    },
    {
      title: 'Photos & Videos',
      icon: '🎨',
      entries: [
        { t: 'Open Photo Editor', d: 'Start menu → Photo Editor. Or desktop icon.' },
        { t: 'Open a photo', d: 'In the editor, click 📂 Open (from your computer) or 📁 VFS (from OpencoreOS files).' },
        { t: 'Draw on a photo', d: 'Use the Brush, Eraser, Line, Rect, Circle, or Text tools.' },
        { t: 'Apply filters', d: 'Use the sliders in the right panel: brightness, contrast, saturation, grayscale, sepia, blur.' },
        { t: 'Crop / rotate / flip', d: 'Toolbar buttons: ✂ Crop, ↻ Rotate, ⇄ Flip H, ⇅ Flip V.' },
        { t: 'Undo / redo', d: '↶ Undo and ↷ Redo buttons. Up to 30 steps.' },
        { t: 'Snap a frame from a video', d: 'Open a video in the editor, pause at the frame you want, click 📸 Snap Frame.' },
        { t: 'Save your edits', d: '💾 Save writes to /Pictures in your VFS. ⬇ Download sends a PNG to your computer.' }
      ]
    },
    {
      title: 'Screenshots & Recording',
      icon: '📸',
      entries: [
        { t: 'Take a screenshot', d: 'Click the 📷 tray icon. Choose Full screen, Window, Region, or Camera. Saved to /Pictures/Screenshots.' },
        { t: 'Record the screen', d: 'Click the ⭐ tray icon. Choose what to record. The icon turns red 🔴 while recording. Click again to stop.' },
        { t: 'Include microphone', d: 'When you start recording, a dialog asks if you want mic audio.' },
        { t: 'View captures', d: 'Start menu → 📸 Captures. Shows screenshots and recordings in two tabs.' },
        { t: 'Where recordings go', d: 'Saved as .webm files in /Pictures/Recordings.' }
      ]
    },
    {
      title: 'Extensions & Themes',
      icon: '🧩',
      entries: [
        { t: 'Open Extension Store', d: 'Start menu → 🧩 Extensions. Or double-click the desktop icon.' },
        { t: '10 built-in extensions', d: 'Aero Glass, Neon Cyber, Paper Light, Terminal Green, Windows 95, macOS Dark, Synthwave, High Contrast, Frost, Custom Icons.' },
        { t: 'Install an extension', d: 'Click Install on any card in the store.' },
        { t: 'Activate a theme', d: 'After installing a theme, click Activate. Only one theme runs at a time.' },
        { t: 'Customize appearance', d: 'Click Customize on an installed extension → Appearance tab. Change accent color or wallpaper.' },
        { t: 'Change app icons', d: 'Click Customize → App Icons tab. Click Emoji or Upload for any app. Reset restores the default.' },
        { t: 'Uninstall', d: 'Click the × button on any installed extension card.' }
      ]
    },
    {
      title: 'Accessibility',
      icon: '♿',
      entries: [
        { t: 'Narrator', d: 'Reads UI elements aloud as you hover and click. Ctrl+Alt+N toggles it.' },
        { t: 'Magnifier', d: 'Zooms the whole desktop. Ctrl+Alt+M toggles it.' },
        { t: 'Magnifier lens', d: 'A large circle follows your cursor showing the element under it in big text.' },
        { t: 'Text size', d: 'Slider from 80% to 250%. Ctrl+Alt+= and Ctrl+Alt+- adjust it.' },
        { t: 'High contrast', d: 'Boost contrast and sharpen edges.' },
        { t: 'Focus ring', d: 'Large yellow outline on keyboard-focused elements. Press Tab to navigate.' },
        { t: 'Reduce motion', d: 'Disables all animations and transitions.' }
      ]
    },
    {
      title: 'App Lock & Trash',
      icon: '🔒',
      entries: [
        { t: 'Lock an app', d: 'Long-press (or right-click) any app icon → 🔒 Lock this app. No password needed to lock.' },
        { t: 'Unlock an app', d: 'Long-press the locked app → 🔓 Unlock this app. You must enter the password.' },
        { t: 'Use device password or custom', d: 'Long-press → 🔑 Password: Device → change. Choose 1 for device PIN, 2 for a custom password.' },
        { t: 'Launch a locked app', d: 'Clicking the app opens a password prompt first.' },
        { t: 'Move to Trash', d: 'Drag any app onto the 🗑️ Trash icon in the bottom-right of the desktop. Or long-press → Move to trash.' },
        { t: 'Restore from Trash', d: 'Start menu → 🗑️ Trash. Click Restore next to any item.' },
        { t: 'Auto-delete', d: 'Items in the trash are permanently deleted after 30 days.' },
        { t: 'Empty trash', d: 'In the Trash window, click Empty trash to delete everything now.' }
      ]
    },
    {
      title: 'Developer Tools',
      icon: '🛠️',
      entries: [
        { t: 'Unlock Dev Tools', d: 'Settings → About → click the 🪟 emoji 5 times in a row → enter your device password (or devil.9oce if none is set).' },
        { t: 'Console tab', d: 'Run JavaScript live in the page. Type and press Enter.' },
        { t: 'Storage tab', d: 'See, edit, and delete every key in your account\'s scoped storage.' },
        { t: 'VFS tab', d: 'Browse the virtual filesystem. Click files to view, delete with ×.' },
        { t: 'Apps tab', d: 'Launch any registered app by its internal ID.' },
        { t: 'Windows tab', d: 'See every open window. Focus or force-close any of them.' },
        { t: 'Flags tab', d: 'Wipe account, reset icons, clear Spotify tokens, force setup wizard, open Recovery, or full-reset the OS.' }
      ]
    },
    {
      title: 'Recovery & Reset',
      icon: '♻️',
      entries: [
        { t: 'Where is Recovery?', d: 'Recovery is hidden. Open it only from Developer Tools → Flags → Open Recovery Environment.' },
        { t: 'Restore System32', d: 'In Recovery, click Restore System32 to recreate missing core files.' },
        { t: 'Wipe current account', d: 'In Recovery, click Wipe Current Account. Only affects the signed-in account.' },
        { t: 'Full reset', d: 'In Recovery, click Full Reset. You must enter the device password AND the master password (devil.9oce). If no PIN is set, you enter devil.9oce twice. Then type RESET.' },
        { t: 'What full reset wipes', d: 'Every account, every file, every setting, every saved Spotify token. Cannot be undone.' }
      ]
    },
    {
      title: 'Backup & Restore',
      icon: '💾',
      entries: [
        { t: 'Back up your account', d: 'Open Terminal, type "backup". A .ocbackup file downloads with your files, icons, settings, and Spotify tokens.' },
        { t: 'Restore a backup', d: 'Open Terminal, type "restore". Pick the .ocbackup file. Confirm. Your account is restored.' },
        { t: 'Scope of backups', d: 'Backups only contain the current account\'s data, not other users\' accounts.' }
      ]
    },
    {
      title: 'Keyboard Shortcuts',
      icon: '⌨️',
      entries: [
        { t: 'Ctrl+Alt+N', d: 'Toggle Narrator.' },
        { t: 'Ctrl+Alt+M', d: 'Toggle Magnifier.' },
        { t: 'Ctrl+Alt+=', d: 'Increase text size.' },
        { t: 'Ctrl+Alt+-', d: 'Decrease text size.' },
        { t: 'Enter', d: 'Submit in Terminal or search fields.' },
        { t: 'Arrow Up / Down', d: 'Navigate Terminal history.' },
        { t: 'Escape', d: 'Close the current modal or context menu.' },
        { t: 'Tab', d: 'Move focus through UI (works best with Focus Ring enabled).' }
      ]
    },
    {
      title: 'Tips & Tricks',
      icon: '💡',
      entries: [
        { t: 'Fallback device password', d: 'If you never set a PIN, the master password for Developer Tools and Recovery is devil.9oce.' },
        { t: 'Kiosk fullscreen', d: 'The first click after loading puts OpencoreOS into fullscreen. Press Escape — it snaps back. Only Shutdown releases it.' },
        { t: 'Right-click anywhere', d: 'Right-clicking an app icon opens the full App Lock + Trash menu. Right-clicking elsewhere opens the app editor.' },
        { t: 'Per-account everything', d: 'Extensions, accessibility, wallpaper, files, icons, Spotify login, PIN — all isolated per account.' },
        { t: 'Reset the whole OS', d: 'Recovery → Full Reset. Or DevTools → Flags → Full Reset.' },
        { t: 'Search field', d: 'The search box at the top of this Help window filters topics as you type.' }
      ]
    }
  ];

  // ============================================================
  //  Render
  // ============================================================
  function render(filter) {
    filter = (filter || '').toLowerCase().trim();
    body.innerHTML = '';

    var total = 0;
    var shown = 0;

    SECTIONS.forEach(function (sec) {
      var matched = [];
      sec.entries.forEach(function (entry) {
        total++;
        var hay = (entry.t + ' ' + entry.d + ' ' + sec.title).toLowerCase();
        if (!filter || hay.indexOf(filter) !== -1) {
          matched.push(entry);
          shown++;
        }
      });
      if (!matched.length) return;

      var secBox = document.createElement('div');
      secBox.style.cssText = 'margin-bottom:22px;';

      var head = document.createElement('div');
      head.style.cssText =
        'display:flex;align-items:center;gap:10px;padding-bottom:8px;' +
        'border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:10px;';
      head.innerHTML =
        '<span style="font-size:22px;">' + sec.icon + '</span>' +
        '<span style="font-size:15px;font-weight:600;color:#fff;">' + sec.title + '</span>' +
        '<span style="color:#666;font-size:11px;margin-left:auto;">' + matched.length + '</span>';
      secBox.appendChild(head);

      matched.forEach(function (entry) {
        var card = document.createElement('div');
        card.style.cssText =
          'padding:10px 12px;background:rgba(255,255,255,0.02);' +
          'border:1px solid rgba(255,255,255,0.06);border-radius:8px;' +
          'margin-bottom:6px;';
        card.innerHTML =
          '<div style="color:#8ab4f8;font-weight:600;font-size:13px;margin-bottom:4px;">' + entry.t + '</div>' +
          '<div style="color:#bbb;font-size:12px;line-height:1.5;">' + entry.d + '</div>';
        secBox.appendChild(card);
      });

      body.appendChild(secBox);
    });

    if (!shown) {
      body.innerHTML =
        '<div style="text-align:center;padding:40px 20px;color:#666;">' +
          '<div style="font-size:48px;margin-bottom:12px;">🔍</div>' +
          '<div style="font-size:14px;">No help topics match "' + filter + '".</div>' +
        '</div>';
    }

    countEl.textContent = shown + ' / ' + total + ' topics';
  }

  render('');

  search.addEventListener('input', function () {
    render(search.value);
  });

  // Focus the search field on open
  setTimeout(function () { search.focus(); }, 100);

  return win;
}

window.openHelp = openHelp;

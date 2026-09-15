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
    + '</div>', 760, 620);

  var c = win.querySelector('#help-app');
  var body = c.querySelector('#help-body');
  var search = c.querySelector('#help-search');
  var countEl = c.querySelector('#help-count');

  var SECTIONS = [
    {
      title: 'Getting Started',
      icon: '🚀',
      entries: [
        { t: 'Sign in', d: 'OpencoreOS uses Supabase accounts. On first visit you see a sign-in screen. Click Create Account, enter an email + password (6+ chars), and you are signed in immediately — no email confirmation needed.' },
        { t: 'Sign out', d: 'Start menu → 🚪 Sign Out. Clears your session and returns to the auth screen. Also on the 🔒 tray icon.' },
        { t: 'Lock the screen', d: 'Start menu → 🔒 Lock or the 🔒 tray icon. Both sign you out and show the auth screen.' },
        { t: 'Sleep mode', d: 'Start menu → 🌙 Sleep. Click anywhere to wake.' },
        { t: 'Shut down', d: 'Start menu → ⏻ Shutdown. Releases fullscreen, shows a shutdown screen.' },
        { t: 'Restart', d: 'Start menu → 🔄 Restart. Reloads the page, keeps your session.' },
        { t: 'First-run wizard', d: 'The very first time you sign in, a setup wizard runs (formatting drive, then a 5-step user wizard). It only runs once per account.' }
      ]
    },
    {
      title: 'Accounts & Profile',
      icon: '👤',
      entries: [
        { t: 'Supabase accounts', d: 'All accounts are stored in Supabase, not locally. Every device sees the same account when you sign in with the same email.' },
        { t: 'Set a profile image', d: 'Sign out → click the ✏️ pencil on your account tile → Upload Image → pick a PNG or JPG under 500 KB → Save.' },
        { t: 'Rename yourself', d: 'Pencil → change the Name field → Save.' },
        { t: 'Change password', d: 'Pencil → Change password. You must enter the current password first, then the new one twice.' },
        { t: 'Remove password', d: 'Pencil → Remove. Requires current password first.' },
        { t: 'Per-account data', d: 'Files, wallpaper, extensions, icon overrides, device PIN, Spotify login, email, checklists, calendar events — all isolated per Supabase account.' },
        { t: 'Restricted by admin', d: 'If the admin restricts your account, you see "Your access to Opencore has been restricted" and cannot use the OS until unrestricted.' },
        { t: 'Admin warnings', d: 'If the admin sends you a warning, you must click "I Understand" before continuing to use OpencoreOS.' }
      ]
    },
    {
      title: 'Desktop & Windows',
      icon: '🖥️',
      entries: [
        { t: 'Move an icon', d: 'Click and drag any desktop icon to a new grid position. Saved automatically.' },
        { t: 'Rename an icon', d: 'Right-click the icon → Rename, or long-press for 650ms.' },
        { t: 'Remove from desktop', d: 'Right-click → Remove from desktop. The app still lives in the Start menu.' },
        { t: 'Add back to desktop', d: 'Right-click the app in the Start menu → "Add to desktop". Finds a free grid slot automatically.' },
        { t: 'Reset icons', d: 'Settings → System → Reset Desktop Icons. Restores the default layout.' },
        { t: 'Reset stuck layout', d: 'If icons are missing or misplaced, run LS.removeItem("oc_icons_v1") in the DevTools Console and reload.' },
        { t: 'Open Start menu', d: 'Click the 🪟 Start button at bottom-left.' },
        { t: 'Close window', d: 'Click the ✕ in the window title bar.' },
        { t: 'Minimize', d: 'Click the − in the title bar. Restore from the taskbar.' }
      ]
    },
    {
      title: 'Files & VFS',
      icon: '📁',
      entries: [
        { t: 'Files are in the cloud', d: 'Your VFS is stored in Supabase, not locally. Sign in on any device and your files are there.' },
        { t: 'Browse', d: 'Open Files. Default folders: Documents, Pictures, Audio, System32.' },
        { t: 'Search', d: 'Type in the search bar at the top of Files to filter the current folder live.' },
        { t: 'Create a folder', d: 'Click "+ Folder" in Files, or in Terminal: mkdir MyFolder.' },
        { t: 'Create a file', d: 'In Terminal: touch myfile.txt, then echo hello > myfile.txt. Or use Notepad.' },
        { t: 'Delete a file', d: 'Click 🗑️ next to a file in Files. It moves to the Recycle Bin, not permanently.' },
        { t: 'Recycle Bin', d: 'Click 🗑️ Bin in the header. Files stay there 30 days, then auto-delete.' },
        { t: 'Restore files', d: 'In the Bin, click Restore. Folders come back with all their contents.' },
        { t: 'Delete forever', d: 'In the Bin, click ✕ next to an item, or "Empty Bin" to wipe everything.' },
        { t: 'System32 is protected', d: 'You cannot write or delete inside /System32.' }
      ]
    },
    {
      title: 'Terminal Commands',
      icon: '💻',
      entries: [
        { t: 'help', d: 'Shows the command list.' },
        { t: 'ls [path]', d: 'Lists files in a directory.' },
        { t: 'cd <path>', d: 'Changes directory. "cd .." goes up, "cd /" to root.' },
        { t: 'cat <file>', d: 'Prints a file\'s contents.' },
        { t: 'mkdir <name>', d: 'Creates a folder.' },
        { t: 'touch <name>', d: 'Creates an empty file.' },
        { t: 'rm <name>', d: 'Deletes a file or folder.' },
        { t: 'echo <text>', d: 'Prints text.' },
        { t: 'whoami', d: 'Shows the current user.' },
        { t: 'date', d: 'Shows the current date/time.' },
        { t: 'ver', d: 'Shows the OS version.' },
        { t: 'exit', d: 'Closes the Terminal.' },
        { t: 'backup', d: 'Downloads a .ocbackup file with your files, settings, and apps.' },
        { t: 'restore', d: 'Opens a file picker to restore a backup.' }
      ]
    },
    {
      title: 'Email',
      icon: '📧',
      entries: [
        { t: 'Open Email', d: 'Start menu → 📧 Email, or double-click the desktop icon.' },
        { t: 'Create your address', d: 'First time you open it, pick a username. Your address becomes username@opencore.io.' },
        { t: 'Username rules', d: '3–30 characters. Letters, digits, dot, underscore, and hyphen only. Must be unique across OpencoreOS.' },
        { t: 'Send mail', d: 'Click ✏️ Compose. Enter a recipient address. Autocomplete shows matching @opencore.io users as you type.' },
        { t: 'Recipients', d: 'You can only send mail to other @opencore.io users. Non-Opencore addresses are rejected server-side.' },
        { t: 'Folders', d: 'Inbox, Starred, Sent, Trash. Click any folder in the left sidebar.' },
        { t: 'Read mail', d: 'Click any message row. Unread messages show a green dot and bold sender.' },
        { t: 'Reply', d: 'In the message viewer, click ↩ Reply. Pre-fills the recipient and subject.' },
        { t: 'Star a message', d: 'Click ☆ Star in the message viewer. Starred messages appear in the Starred folder.' },
        { t: 'Delete a message', d: 'Click 🗑️ Delete. The message moves to Trash.' },
        { t: 'Restore from Trash', d: 'Open Trash folder → open a message → ↩ Restore.' },
        { t: 'Empty Trash', d: 'In Trash, click "Empty Trash" in the toolbar to permanently delete everything.' },
        { t: 'Email Extensions', d: 'Click 🧩 Extensions at the bottom of the sidebar. 16 themes for your mailbox.' },
        { t: 'Email theme list', d: 'Classic, Gmail, Outlook, Dark Moon, Paper, Sunset, Ocean, Forest, Rose, Neon, Retro Amber, Minimal, Terminal, Candy, Cyberpunk, Monochrome.' },
        { t: 'Change email theme', d: 'Click any theme card → applies instantly. Your choice is saved per-account.' }
      ]
    },
    {
      title: 'Calendar & Events',
      icon: '📅',
      entries: [
        { t: 'Open Calendar', d: 'Start menu → 📅 Calendar. Shows the current month.' },
        { t: 'Navigate months', d: 'Use ‹ and › buttons. Click Today to jump back.' },
        { t: 'Add an event', d: 'Click + (top-right) → title, date, optional time, optional description, and color → Save.' },
        { t: 'View event', d: 'Click an event chip on the calendar grid to see full details.' },
        { t: 'Edit event', d: 'In the event viewer, click ✏️ to change any field.' },
        { t: 'Delete event', d: 'In the event viewer, click 🗑️ and confirm.' },
        { t: 'Day view', d: 'Click a day cell (not an event chip) to see all events that day.' },
        { t: 'Colors', d: '8 colors to choose from when creating an event.' }
      ]
    },
    {
      title: 'Checklist',
      icon: '✅',
      entries: [
        { t: 'Open Checklist', d: 'Start menu → ✅ Checklist.' },
        { t: 'Create a list', d: 'On the main view, click + → enter a name, pick an icon, pick a color → Save.' },
        { t: 'Add an item', d: 'Inside a list, click + → type item, optionally set due date and note → Save.' },
        { t: 'Check items off', d: 'Click the checkbox. Click again to uncheck.' },
        { t: 'Due date badges', d: 'Today shows yellow, overdue shows red, future shows blue.' },
        { t: 'Notes on items', d: 'Add a note for extra details. Shows in italic under the item text.' },
        { t: 'Filter', d: 'All / Active / Done buttons in the toolbar inside a list.' },
        { t: 'Edit an item', d: 'Click ✏️ next to any item.' },
        { t: 'Delete an item', d: 'Click 🗑️ next to any item.' },
        { t: 'Edit or delete a list', d: 'On the main view, click ⋯ next to a list → Edit list or Delete list.' },
        { t: 'Progress', d: 'Each list shows a percentage and colored progress bar.' }
      ]
    },
    {
      title: 'Task Manager',
      icon: '📊',
      entries: [
        { t: 'Open', d: 'Start menu → 📊 Task Manager.' },
        { t: 'Performance tab', d: 'Live FPS counter, JavaScript heap, page uptime, CPU cores, storage, battery, network.' },
        { t: 'Processes tab', d: 'Every open window with a Kill button, every installed extension, background services.' },
        { t: 'Device tab', d: 'Real browser, OS, screen resolution, pixel ratio, GPU renderer, touch support, timezone, full user agent.' },
        { t: 'Kill a window', d: 'Processes tab → Kill. Unsaved state in that app is lost.' },
        { t: 'FPS meter', d: 'Around 60 on most screens, 120 on high-refresh displays.' },
        { t: 'Memory bar', d: 'Green under 65%, yellow 65–85%, red above 85%.' }
      ]
    },
    {
      title: 'Photos & Videos',
      icon: '🎨',
      entries: [
        { t: 'Open Photo Editor', d: 'Start menu → Photo Editor.' },
        { t: 'Open a photo', d: '📂 Open (from device) or 📁 VFS (from OpencoreOS files).' },
        { t: 'Draw tools', d: 'Brush, Eraser, Line, Rect, Circle, Text.' },
        { t: 'Filters', d: 'Brightness, contrast, saturation, grayscale, sepia, blur — sliders in the right panel.' },
        { t: 'Crop / rotate / flip', d: '✂ Crop, ↻ Rotate, ⇄ Flip H, ⇅ Flip V.' },
        { t: 'Undo / redo', d: '↶ and ↷. Up to 30 steps.' },
        { t: 'Snap a video frame', d: 'Open a video, pause at the frame, click 📸 Snap Frame.' },
        { t: 'Save', d: '💾 Save writes to /Pictures. ⬇ Download sends a PNG to your computer.' }
      ]
    },
    {
      title: 'Image Viewer',
      icon: '🖼️',
      entries: [
        { t: 'Opens automatically', d: 'Any time you click an image or View on a screenshot toast.' },
        { t: 'Zoom', d: 'Scroll wheel, or + / − buttons. Up to 800%.' },
        { t: 'Pan', d: 'Click and drag the image.' },
        { t: 'Rotate', d: '↻ button rotates 90° clockwise.' },
        { t: 'Reset', d: '⟲ button, or double-click the image.' },
        { t: 'Download', d: '⬇ button saves the image to your computer.' },
        { t: 'Delete', d: '🗑️ button (only if the image is a VFS file).' },
        { t: 'Keyboard', d: '+ / - to zoom, arrow keys for next/previous when opened from a gallery.' }
      ]
    },
    {
      title: 'Screenshots & Recording',
      icon: '📸',
      entries: [
        { t: 'Screenshot', d: 'Click 📷 tray icon. Choose Full screen, Window, Region, or Camera. Saved to /Pictures/Screenshots.' },
        { t: 'Record screen', d: 'Click ⭐ tray icon. Choose what to record. Tray turns 🔴 while recording. Click again to stop.' },
        { t: 'Include mic', d: 'A dialog asks if you want mic audio before recording starts.' },
        { t: 'View captures', d: 'Start menu → 📸 Captures. Screenshots and recordings in two tabs.' },
        { t: 'Recordings format', d: '.webm files in /Pictures/Recordings.' }
      ]
    },
    {
      title: 'Extensions & Themes',
      icon: '🧩',
      entries: [
        { t: 'Open Extension Store', d: 'Start menu → 🧩 Extensions, or double-click the desktop icon.' },
        { t: '50 built-in extensions', d: 'Themes, icon packs, and style changes for the whole OS.' },
        { t: 'Install', d: 'Click Install on any card.' },
        { t: 'Activate a theme', d: 'After installing, click Activate. Only one theme active at a time.' },
        { t: 'Customize', d: 'Click Customize on any installed extension → Appearance tab. Change accent color or wallpaper.' },
        { t: 'Change app icons', d: 'Click Customize → App Icons tab. Click Emoji, Upload, or VFS for any app. Reset restores default.' },
        { t: 'Uninstall', d: 'Click × on any installed extension card.' },
        { t: 'Popular themes', d: 'Neon Cyber, Vaporwave, Matrix, Windows XP, Comic Book, Steampunk, Hacker, Gold Luxe, RGB Gaming, and 40+ more.' }
      ]
    },
    {
      title: 'Wallpaper',
      icon: '🖼️',
      entries: [
        { t: 'Open', d: 'Start menu → 🖼️ Wallpaper.' },
        { t: '25 wallpapers', d: 'Rainbow, Retro Wave, Aurora, Midnight, Sunset Beach, Forest Mist, Lava Lamp, Cyberpunk, Cotton Candy, Ocean Deep, Desert Dunes, Cosmic Dust, Minty Fresh, Golden Hour, Electric Blue, Rose Gold + 8 originals.' },
        { t: 'Apply', d: 'Click any tile — applies instantly.' },
        { t: 'Upload from device', d: '📂 Upload button — pick any image from your computer.' },
        { t: 'From OpencoreOS', d: '📁 From Opencore — pick a screenshot or saved photo from your VFS.' },
        { t: 'From URL', d: '🔗 URL — paste an image URL.' },
        { t: 'Clear', d: '✕ Clear removes the wallpaper entirely.' },
        { t: 'Per-account', d: 'Each Supabase account has its own wallpaper.' }
      ]
    },
    {
      title: 'Weather',
      icon: '🌤️',
      entries: [
        { t: 'Open', d: 'Start menu → 🌤️ Weather. Auto-detects your location.' },
        { t: 'Location permission', d: 'Browser asks the first time. Click Allow for local weather.' },
        { t: 'Celsius / Fahrenheit', d: 'Toggle °C / °F in the header. Choice is saved.' },
        { t: 'Refresh', d: 'Re-fetches current weather.' },
        { t: 'Data source', d: 'Open-Meteo — free, no API key required.' },
        { t: 'Location denied', d: 'You see a "Try again" button. Check browser site permissions.' }
      ]
    },
    {
      title: 'Spotify Music',
      icon: '🎵',
      entries: [
        { t: 'Set up', d: 'Settings → Spotify → paste Client ID from developer.spotify.com/dashboard → Save → Login.' },
        { t: 'Redirect URI', d: 'Must exactly match what\'s in your Spotify app settings. Typically https://roblostudio4r.github.io/opencore/' },
        { t: 'Play music', d: 'Open Music. Search, click Play on any result.' },
        { t: 'Controls', d: 'Prev, Play/Pause, Next — in the app and in the mini-player.' },
        { t: 'Mini-player', d: 'Appears when a song starts. Stays visible even if you close Music.' },
        { t: 'Premium required', d: 'The Web Playback SDK requires Spotify Premium. Free accounts can search but not play.' }
      ]
    },
    {
      title: 'Browser',
      icon: '🌐',
      entries: [
        { t: 'Open', d: 'Start menu → 🌐 Browser.' },
        { t: 'Enter a URL', d: 'Type and press Enter or click Go. Bare domains like "wikipedia.org" get https:// prepended.' },
        { t: 'Search', d: 'Type anything that isn\'t a URL → searches DuckDuckGo.' },
        { t: 'Back / Forward', d: 'Navigation buttons in the toolbar.' },
        { t: 'Reload', d: '↻ button.' },
        { t: 'Open in new tab', d: '🔗 button opens the current URL in a real browser tab.' },
        { t: 'Blocked sites', d: 'Many sites (Google, YouTube) block embedding. You\'ll see an error with an "Open in New Tab" button.' }
      ]
    },
    {
      title: 'Accessibility',
      icon: '♿',
      entries: [
        { t: 'Narrator', d: 'Reads UI elements aloud. Ctrl+Alt+N toggles.' },
        { t: 'Magnifier', d: 'Zooms the whole desktop. Ctrl+Alt+M toggles.' },
        { t: 'Magnifier lens', d: 'A circle follows your cursor showing the element under it in big text.' },
        { t: 'Text size', d: '80% to 250%. Ctrl+Alt+= and Ctrl+Alt+- adjust it.' },
        { t: 'High contrast', d: 'Boost contrast and sharpen edges.' },
        { t: 'Focus ring', d: 'Large yellow outline on keyboard-focused elements.' },
        { t: 'Reduce motion', d: 'Disables all animations and transitions.' },
        { t: 'Open panel', d: 'Start menu → ♿ Accessibility, or the ♿ tray icon.' }
      ]
    },
    {
      title: 'App Lock & Trash',
      icon: '🔒',
      entries: [
        { t: 'Lock an app', d: 'Right-click any icon → 🔒 Lock this app. No password needed to lock.' },
        { t: 'Unlock an app', d: 'Right-click → 🔓 Unlock this app. Requires the password.' },
        { t: 'Device or custom password', d: 'Right-click → 🔑 Password: Device → change. Choose 1 for device PIN, 2 for custom.' },
        { t: 'Launch locked app', d: 'Clicking the app prompts for the password first.' },
        { t: 'Move to Trash', d: 'Drag any app onto the 🗑️ Trash icon, or right-click → Move to trash.' },
        { t: 'Restore from Trash', d: 'Start menu → 🗑️ Trash → Restore.' },
        { t: 'Auto-delete apps', d: 'Apps in Trash are permanently deleted after 30 days.' },
        { t: 'Empty Trash', d: 'In the Trash window, click "Empty trash".' }
      ]
    },
    {
      title: 'Auto-Delete & Data',
      icon: '⏳',
      entries: [
        { t: 'App trash auto-delete', d: 'Trashed apps are permanently removed after 30 days.' },
        { t: 'File bin auto-delete', d: 'Files in the Recycle Bin are permanently removed after 30 days.' },
        { t: 'Purge on boot', d: 'Every page load clears old trashed items.' },
        { t: 'Purge every 5 min', d: 'Both bins are checked while the OS is running.' },
        { t: 'Backup account', d: 'Terminal → backup. Downloads .ocbackup with files, icons, extensions, and settings.' },
        { t: 'Restore backup', d: 'Terminal → restore. Pick the file and confirm.' }
      ]
    },
    {
      title: 'Developer Tools',
      icon: '🛠️',
      entries: [
        { t: 'Unlock', d: 'Settings → About → click the 🪟 emoji 5 times → enter device password (or devil.9oce if none set).' },
        { t: 'Console tab', d: 'Run JavaScript live. Type and press Enter.' },
        { t: 'Storage tab', d: 'View, edit, and delete every key in your account\'s storage.' },
        { t: 'VFS tab', d: 'Browse your files. Click to view, ✕ to delete.' },
        { t: 'Apps tab', d: 'Launch any registered app by ID.' },
        { t: 'Windows tab', d: 'See every open window. Focus or force-close.' },
        { t: 'Flags tab', d: 'Wipe account, reset icons, clear Spotify tokens, force setup wizard, open Recovery, full reset.' },
        { t: 'Admin tab', d: 'Open the Admin Panel (admins only) or check your role.' }
      ]
    },
    {
      title: 'Admin Panel',
      icon: '🛡️',
      entries: [
        { t: 'Open', d: 'DevTools → Admin tab → "Open Admin Panel", or type adminPanel() in the DevTools Console.' },
        { t: 'Admins only', d: 'You must have role = admin in Supabase. Contact your admin if you need access.' },
        { t: 'View all users', d: 'Every OpencoreOS account with email, role, restriction status, warnings, and login history.' },
        { t: 'Search users', d: 'Type in the search box to filter by email.' },
        { t: 'Restrict', d: 'Click 🚫 Restrict. Enter a reason. User sees "Your access has been restricted" on next sign-in.' },
        { t: 'Unrestrict', d: 'Click ✅ Unrestrict to restore access.' },
        { t: 'Warn', d: 'Click ⚠️ Warn. Enter a message. User must click "I Understand" before continuing.' },
        { t: 'Make admin', d: 'Click ⬆ Make admin to grant admin rights.' },
        { t: 'Demote', d: 'Click ⬇ Demote to remove admin rights.' },
        { t: 'Reset password', d: 'Click 🔑 Reset password to send a password reset email.' },
        { t: 'View files', d: 'Click 📁 Files to see a read-only view of a user\'s VFS.' },
        { t: 'Delete user', d: 'Click 🗑 Delete to permanently remove an account and everything in it.' },
        { t: 'Export', d: 'Click 📤 Export to download the user list as JSON.' },
        { t: 'Cannot see passwords', d: 'Passwords are bcrypt-hashed in Supabase. Even admins cannot see them — this is by design, on every platform.' }
      ]
    },
    {
      title: 'Recovery & Reset',
      icon: '♻️',
      entries: [
        { t: 'Where is Recovery?', d: 'Hidden. Open from DevTools → Flags → Open Recovery Environment.' },
        { t: 'Restore System32', d: 'Recreates missing core system files.' },
        { t: 'Wipe current account', d: 'Only affects the signed-in account.' },
        { t: 'Full reset', d: 'Requires device password AND master password (devil.9oce). If no PIN is set, you enter devil.9oce twice. Type RESET to confirm.' },
        { t: 'What full reset wipes', d: 'Every account on this browser, every file, every setting, every saved Spotify token. Cannot be undone.' }
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
        { t: 'Escape', d: 'Close a modal or context menu.' },
        { t: 'Tab', d: 'Move focus through UI.' }
      ]
    },
    {
      title: 'Tips & Tricks',
      icon: '💡',
      entries: [
        { t: 'Fallback password', d: 'If you never set a PIN, the master password for Developer Tools and Recovery is devil.9oce.' },
        { t: 'Kiosk fullscreen', d: 'The first click after loading puts OpencoreOS into fullscreen. Escape snaps back. Only Shutdown releases it.' },
        { t: 'Right-click everywhere', d: 'App icons → App Lock/Trash menu. Start menu items → Add/Remove from desktop.' },
        { t: 'Per-account everything', d: 'Wallpapers, files, extensions, icons, Spotify, PIN, checklists, calendar, email themes — all isolated.' },
        { t: 'Sync across devices', d: 'Sign in with the same Supabase account on another device. Your files, wallpaper, and mail are all there.' },
        { t: 'Reset the OS', d: 'Recovery → Full Reset. Or DevTools → Flags → Full Reset.' },
        { t: 'Search field', d: 'The search box at the top of this Help window filters topics as you type.' }
      ]
    }
  ];

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

  setTimeout(function () { search.focus(); }, 100);

  return win;
}

window.openHelp = openHelp;

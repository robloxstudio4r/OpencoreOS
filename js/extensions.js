// ============================================================
//  extensions.js — Extension engine for OpencoreOS
//  50 built-in extensions
// ============================================================

(function () {
  'use strict';

  var EXTENSIONS = [
    // ============================================================
    //  ORIGINAL 10
    // ============================================================
    {
      id: 'aeroglass', name: 'Aero Glass', icon: '🪟',
      desc: 'Frosted glass windows with blur, rounded corners, subtle glow',
      type: 'theme',
      css: '.win{backdrop-filter:blur(20px) saturate(1.4);background:rgba(30,40,60,0.55)!important;border:1px solid rgba(255,255,255,0.15)!important;border-radius:14px!important;box-shadow:0 20px 60px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.08)!important;} .tb{backdrop-filter:blur(24px)!important;background:rgba(20,28,42,0.75)!important;border-top:1px solid rgba(255,255,255,0.08)!important;} .sm{backdrop-filter:blur(24px)!important;background:rgba(20,28,42,0.85)!important;border-radius:14px!important;border:1px solid rgba(255,255,255,0.1)!important;}',
      vars: { '--ext-accent': '#5aa9ff' }
    },
    {
      id: 'neon', name: 'Neon Cyber', icon: '🌆',
      desc: 'Cyan and magenta glow on pitch black',
      type: 'theme',
      css: 'body{background:#050010!important;} .win{background:rgba(10,0,25,0.9)!important;border:2px solid #00ffff!important;box-shadow:0 0 20px #00ffff,0 0 40px rgba(255,0,255,0.4)!important;} .wt{color:#00ffff!important;text-shadow:0 0 8px #00ffff;} .tb{background:linear-gradient(90deg,#0a0020,#200040)!important;border-top:2px solid #ff00ff!important;box-shadow:0 -4px 20px rgba(255,0,255,0.5);} .sm{background:#0a0020!important;border:2px solid #00ffff!important;box-shadow:0 0 30px rgba(0,255,255,0.6);} .di{color:#00ffff!important;text-shadow:0 0 6px #00ffff;}',
      vars: { '--ext-accent': '#00ffff' }
    },
    {
      id: 'paper', name: 'Paper Light', icon: '📄',
      desc: 'Cream background, soft serif fonts, warm shadows',
      type: 'theme',
      css: 'body{background:#f4efe4!important;color:#3a3a3a!important;} .win{background:#fdfaf3!important;color:#333!important;border:1px solid #e0d8c8!important;box-shadow:0 6px 24px rgba(120,100,70,0.15)!important;} .wt{color:#5a4a30!important;font-family:Georgia,serif!important;} .tb{background:#efe7d6!important;color:#3a3a3a!important;border-top:1px solid #d8cebb!important;} .sm{background:#fdfaf3!important;color:#333!important;border:1px solid #e0d8c8!important;} .di{color:#3a2e18!important;} #clk{color:#3a3a3a!important;}',
      vars: { '--ext-accent': '#8a6a3a' }
    },
    {
      id: 'terminal', name: 'Terminal Green', icon: '🖥️',
      desc: 'Everything monospace, phosphor green on black',
      type: 'theme',
      css: '*{font-family:"Courier New",monospace!important;} body{background:#000!important;color:#00ff00!important;} .win{background:#000!important;border:1px solid #00ff00!important;box-shadow:0 0 12px rgba(0,255,0,0.4);} .wt{color:#00ff00!important;background:#000!important;} .tb{background:#000!important;border-top:1px solid #00ff00!important;} .sm{background:#000!important;border:1px solid #00ff00!important;} .di{color:#00ff00!important;} button{background:#000!important;color:#00ff00!important;border:1px solid #00ff00!important;}',
      vars: { '--ext-accent': '#00ff00' }
    },
    {
      id: 'win95', name: 'Windows 95', icon: '💾',
      desc: 'Grey bevels, square corners, retro chunky UI',
      type: 'theme',
      css: 'body{background:#008080!important;color:#000!important;} .win{background:#c0c0c0!important;border:2px solid !important;border-color:#fff #808080 #808080 #fff!important;box-shadow:none!important;border-radius:0!important;} .wt{background:linear-gradient(90deg,#000080,#1084d0)!important;color:#fff!important;font-weight:bold!important;} .tb{background:#c0c0c0!important;border-top:2px solid #fff!important;} .sm{background:#c0c0c0!important;border:2px solid !important;border-color:#fff #808080 #808080 #fff!important;} .di{color:#000!important;} button{background:#c0c0c0!important;color:#000!important;border:2px solid !important;border-color:#fff #808080 #808080 #fff!important;border-radius:0!important;}',
      vars: { '--ext-accent': '#000080' }
    },
    {
      id: 'macos', name: 'macOS Dark', icon: '🌙',
      desc: 'Translucent, rounded, subtle greys',
      type: 'theme',
      css: '.win{background:rgba(40,40,42,0.85)!important;backdrop-filter:blur(30px) saturate(1.6)!important;border-radius:12px!important;border:1px solid rgba(255,255,255,0.08)!important;box-shadow:0 20px 60px rgba(0,0,0,0.55)!important;} .wt{color:#f0f0f0!important;} .tb{background:rgba(30,30,32,0.7)!important;backdrop-filter:blur(20px)!important;border-top:1px solid rgba(255,255,255,0.05)!important;} .sm{background:rgba(40,40,42,0.9)!important;backdrop-filter:blur(30px)!important;border-radius:10px!important;} .di{color:#e8e8e8!important;}',
      vars: { '--ext-accent': '#0a84ff' }
    },
    {
      id: 'synthwave', name: 'Synthwave', icon: '🌴',
      desc: 'Purple-pink gradients, retro-wave sun',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#1a0033 0%,#4d0a4d 60%,#ff6b9d 100%)!important;} .win{background:linear-gradient(180deg,rgba(40,10,60,0.95),rgba(80,20,80,0.95))!important;border:1px solid #ff00aa!important;box-shadow:0 0 30px rgba(255,0,170,0.4)!important;} .wt{color:#ff88dd!important;text-shadow:0 0 10px #ff00aa;} .tb{background:linear-gradient(90deg,#1a0033,#4d0a4d)!important;border-top:1px solid #ff00aa!important;} .sm{background:#2a0050!important;border:1px solid #ff00aa!important;box-shadow:0 0 20px rgba(255,0,170,0.4);} .di{color:#ff88dd!important;text-shadow:0 0 8px #ff00aa;}',
      vars: { '--ext-accent': '#ff00aa' }
    },
    {
      id: 'highcontrast', name: 'High Contrast', icon: '◐',
      desc: 'Pure black and white for accessibility',
      type: 'theme',
      css: 'body{background:#000!important;color:#fff!important;} .win{background:#000!important;color:#fff!important;border:3px solid #fff!important;box-shadow:none!important;border-radius:0!important;} .wt{background:#fff!important;color:#000!important;font-weight:bold!important;} .tb{background:#000!important;border-top:3px solid #fff!important;color:#fff!important;} .sm{background:#000!important;border:3px solid #fff!important;} .di{color:#fff!important;} button{background:#000!important;color:#fff!important;border:2px solid #fff!important;}',
      vars: { '--ext-accent': '#ffff00' }
    },
    {
      id: 'frost', name: 'Frost', icon: '❄️',
      desc: 'Heavy blur, muted palette, minimal chrome',
      type: 'theme',
      css: 'body{background:linear-gradient(135deg,#c9d6df,#e0e5ec)!important;} .win{background:rgba(255,255,255,0.65)!important;backdrop-filter:blur(40px) saturate(1.2)!important;border:1px solid rgba(255,255,255,0.7)!important;border-radius:16px!important;box-shadow:0 30px 80px rgba(100,120,140,0.25)!important;} .wt{color:#3a4a5a!important;font-weight:400!important;} .tb{background:rgba(255,255,255,0.55)!important;backdrop-filter:blur(30px)!important;color:#3a4a5a!important;} .sm{background:rgba(255,255,255,0.75)!important;backdrop-filter:blur(30px)!important;border-radius:14px!important;} .di{color:#3a4a5a!important;}',
      vars: { '--ext-accent': '#7a9bb8' }
    },
    {
      id: 'customicons', name: 'Custom Icons', icon: '🎨',
      desc: 'Change the icon of every app — emoji or upload your own',
      type: 'icons', css: '', vars: {}
    },

    // ============================================================
    //  15 FROM BEFORE
    // ============================================================
    {
      id: 'retroamber', name: 'Retro Amber', icon: '📺',
      desc: 'Orange phosphor CRT terminal look',
      type: 'theme',
      css: '*{font-family:"Courier New",monospace!important;} body{background:#1a0e00!important;color:#ffb000!important;} .win{background:#1a0e00!important;border:1px solid #ffb000!important;box-shadow:0 0 15px rgba(255,176,0,0.4)!important;} .wt{color:#ffb000!important;background:#1a0e00!important;text-shadow:0 0 6px #ffb000;} .tb{background:#1a0e00!important;border-top:1px solid #ffb000!important;color:#ffb000!important;} .sm{background:#1a0e00!important;border:1px solid #ffb000!important;} .di{color:#ffb000!important;text-shadow:0 0 5px #ffb000;} button{background:#1a0e00!important;color:#ffb000!important;border:1px solid #ffb000!important;}',
      vars: { '--ext-accent': '#ffb000' }
    },
    {
      id: 'nordic', name: 'Nordic', icon: '🏔️',
      desc: 'Cool grey-blue, calm and minimal',
      type: 'theme',
      css: 'body{background:#2e3440!important;color:#d8dee9!important;} .win{background:#3b4252!important;color:#d8dee9!important;border:1px solid #4c566a!important;border-radius:8px!important;} .wt{color:#88c0d0!important;} .tb{background:#2e3440!important;border-top:1px solid #4c566a!important;color:#d8dee9!important;} .sm{background:#3b4252!important;border:1px solid #4c566a!important;color:#d8dee9!important;} .di{color:#d8dee9!important;}',
      vars: { '--ext-accent': '#88c0d0' }
    },
    {
      id: 'forest', name: 'Forest', icon: '🌲',
      desc: 'Deep greens, organic feel',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#0d2818,#1a3d2b)!important;color:#c8e6c9!important;} .win{background:rgba(10,40,25,0.9)!important;border:1px solid #2e7d32!important;border-radius:10px!important;} .wt{color:#81c784!important;text-shadow:0 0 6px rgba(129,199,132,0.5);} .tb{background:#0d2818!important;border-top:1px solid #2e7d32!important;color:#c8e6c9!important;} .sm{background:rgba(10,40,25,0.95)!important;border:1px solid #2e7d32!important;} .di{color:#a5d6a7!important;}',
      vars: { '--ext-accent': '#81c784' }
    },
    {
      id: 'sunset', name: 'Sunset', icon: '🌅',
      desc: 'Warm orange-to-pink gradient skies',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#ff6b35 0%,#ff006e 50%,#8338ec 100%)!important;} .win{background:rgba(45,20,55,0.85)!important;border:1px solid rgba(255,107,53,0.4)!important;border-radius:12px!important;backdrop-filter:blur(15px)!important;} .wt{color:#ffb87a!important;} .tb{background:rgba(30,15,45,0.85)!important;border-top:1px solid rgba(255,107,53,0.3)!important;backdrop-filter:blur(20px)!important;} .sm{background:rgba(30,15,45,0.9)!important;border:1px solid rgba(255,107,53,0.3)!important;} .di{color:#ffd0a0!important;text-shadow:0 0 8px rgba(255,107,53,0.5);}',
      vars: { '--ext-accent': '#ff6b35' }
    },
    {
      id: 'monochrome', name: 'Monochrome', icon: '⬛',
      desc: 'Pure grayscale, no colors at all',
      type: 'theme',
      css: '*{filter:grayscale(100%)!important;} body{background:#1a1a1a!important;} .win{background:#2a2a2a!important;border:1px solid #444!important;} .tb{background:#1a1a1a!important;border-top:1px solid #444!important;} .sm{background:#2a2a2a!important;border:1px solid #444!important;}',
      vars: { '--ext-accent': '#888888' }
    },
    {
      id: 'lavender', name: 'Lavender', icon: '💜',
      desc: 'Soft purple pastel, gentle on the eyes',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#e6d7f5,#c8a8e0)!important;color:#4a2e6b!important;} .win{background:rgba(250,245,255,0.92)!important;color:#4a2e6b!important;border:1px solid #b39ddb!important;border-radius:14px!important;box-shadow:0 12px 40px rgba(120,80,160,0.15)!important;} .wt{color:#7e57c2!important;} .tb{background:rgba(230,215,245,0.9)!important;color:#4a2e6b!important;border-top:1px solid #b39ddb!important;} .sm{background:rgba(250,245,255,0.95)!important;color:#4a2e6b!important;border:1px solid #b39ddb!important;} .di{color:#4a2e6b!important;}',
      vars: { '--ext-accent': '#7e57c2' }
    },
    {
      id: 'coffee', name: 'Coffee', icon: '☕',
      desc: 'Warm brown tones, cozy café feel',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#3e2723,#5d4037)!important;color:#efebe9!important;} .win{background:rgba(62,39,35,0.95)!important;border:1px solid #8d6e63!important;border-radius:10px!important;} .wt{color:#d7ccc8!important;} .tb{background:#3e2723!important;border-top:1px solid #8d6e63!important;color:#efebe9!important;} .sm{background:rgba(93,64,55,0.95)!important;border:1px solid #8d6e63!important;} .di{color:#d7ccc8!important;}',
      vars: { '--ext-accent': '#a1887f' }
    },
    {
      id: 'ocean', name: 'Ocean', icon: '🌊',
      desc: 'Deep blue gradient, calm and deep',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#0a1929 0%,#0d47a1 100%)!important;color:#b3e5fc!important;} .win{background:rgba(10,25,41,0.9)!important;border:1px solid #1976d2!important;border-radius:10px!important;backdrop-filter:blur(10px)!important;} .wt{color:#4fc3f7!important;} .tb{background:rgba(10,25,41,0.9)!important;border-top:1px solid #1976d2!important;color:#b3e5fc!important;} .sm{background:rgba(10,25,41,0.95)!important;border:1px solid #1976d2!important;} .di{color:#81d4fa!important;}',
      vars: { '--ext-accent': '#4fc3f7' }
    },
    {
      id: 'minimal', name: 'Minimal', icon: '⬜',
      desc: 'Clean white, no decoration',
      type: 'theme',
      css: 'body{background:#fafafa!important;color:#212121!important;} .win{background:#fff!important;color:#212121!important;border:1px solid #e0e0e0!important;border-radius:6px!important;box-shadow:0 2px 12px rgba(0,0,0,0.06)!important;} .wt{color:#212121!important;background:#fff!important;} .tb{background:#fff!important;border-top:1px solid #e0e0e0!important;color:#212121!important;} .sm{background:#fff!important;color:#212121!important;border:1px solid #e0e0e0!important;} .di{color:#424242!important;} button{background:#f5f5f5!important;color:#212121!important;border:1px solid #e0e0e0!important;}',
      vars: { '--ext-accent': '#000000' }
    },
    {
      id: 'hotpink', name: 'Hot Pink', icon: '💗',
      desc: 'Vivid hot pink, impossible to ignore',
      type: 'theme',
      css: 'body{background:linear-gradient(135deg,#ff1b8d,#ff6bb5)!important;} .win{background:rgba(40,10,30,0.9)!important;border:2px solid #ff1b8d!important;border-radius:12px!important;box-shadow:0 0 30px rgba(255,27,141,0.5)!important;} .wt{color:#ff69b4!important;text-shadow:0 0 8px #ff1b8d;} .tb{background:linear-gradient(90deg,#2a0a1a,#4a1030)!important;border-top:2px solid #ff1b8d!important;} .sm{background:#2a0a1a!important;border:2px solid #ff1b8d!important;box-shadow:0 0 20px rgba(255,27,141,0.5);} .di{color:#ff69b4!important;text-shadow:0 0 6px #ff1b8d;}',
      vars: { '--ext-accent': '#ff1b8d' }
    },
    {
      id: 'bloodred', name: 'Blood Red', icon: '🩸',
      desc: 'Dark red, dramatic and intense',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#0a0000,#2a0000)!important;} .win{background:rgba(20,0,0,0.95)!important;border:1px solid #cc0000!important;border-radius:8px!important;box-shadow:0 0 25px rgba(204,0,0,0.4)!important;} .wt{color:#ff4444!important;text-shadow:0 0 8px #cc0000;} .tb{background:#0a0000!important;border-top:1px solid #cc0000!important;} .sm{background:rgba(20,0,0,0.95)!important;border:1px solid #cc0000!important;} .di{color:#ff6666!important;text-shadow:0 0 5px #cc0000;}',
      vars: { '--ext-accent': '#cc0000' }
    },
    {
      id: 'deepspace', name: 'Deep Space', icon: '🌌',
      desc: 'Dark cosmic blue with star specks',
      type: 'theme',
      css: 'body{background:radial-gradient(ellipse at top,#1a1a4a 0%,#000010 80%)!important;} .win{background:rgba(10,10,40,0.85)!important;border:1px solid rgba(100,100,255,0.3)!important;border-radius:12px!important;backdrop-filter:blur(15px)!important;box-shadow:0 0 30px rgba(100,100,255,0.2)!important;} .wt{color:#8888ff!important;text-shadow:0 0 8px #6666ff;} .tb{background:rgba(5,5,20,0.9)!important;border-top:1px solid rgba(100,100,255,0.3)!important;backdrop-filter:blur(20px)!important;} .sm{background:rgba(10,10,40,0.95)!important;border:1px solid rgba(100,100,255,0.3)!important;} .di{color:#aaaaff!important;text-shadow:0 0 8px #6666ff;}',
      vars: { '--ext-accent': '#6666ff' }
    },
    {
      id: 'mint', name: 'Mint Fresh', icon: '🌿',
      desc: 'Cool mint green, crisp and clean',
      type: 'theme',
      css: 'body{background:linear-gradient(135deg,#d4f1e8,#a8e6cf)!important;color:#1a4d3a!important;} .win{background:rgba(255,255,255,0.9)!important;color:#1a4d3a!important;border:1px solid #80cbc4!important;border-radius:14px!important;box-shadow:0 12px 30px rgba(26,77,58,0.1)!important;} .wt{color:#00897b!important;} .tb{background:rgba(212,241,232,0.9)!important;color:#1a4d3a!important;border-top:1px solid #80cbc4!important;} .sm{background:rgba(255,255,255,0.95)!important;color:#1a4d3a!important;border:1px solid #80cbc4!important;} .di{color:#1a4d3a!important;}',
      vars: { '--ext-accent': '#00897b' }
    },
    {
      id: 'carbon', name: 'Carbon Fiber', icon: '⬛',
      desc: 'Dark textured metal with sharp edges',
      type: 'theme',
      css: 'body{background:repeating-linear-gradient(45deg,#0a0a0a,#0a0a0a 2px,#141414 2px,#141414 4px)!important;} .win{background:#1a1a1a!important;border:1px solid #333!important;border-radius:4px!important;box-shadow:0 8px 30px rgba(0,0,0,0.7)!important;} .wt{color:#aaa!important;font-weight:600;letter-spacing:0.5px;} .tb{background:#0a0a0a!important;border-top:1px solid #333!important;} .sm{background:#1a1a1a!important;border:1px solid #333!important;} .di{color:#ccc!important;} button{background:#2a2a2a!important;color:#fff!important;border:1px solid #444!important;}',
      vars: { '--ext-accent': '#666666' }
    },
    {
      id: 'rgbgaming', name: 'RGB Gaming', icon: '🎮',
      desc: 'Animated rainbow cycling colors',
      type: 'theme',
      css: '@keyframes rgb{0%{border-color:#ff0000;box-shadow:0 0 20px #ff0000}17%{border-color:#ffff00;box-shadow:0 0 20px #ffff00}33%{border-color:#00ff00;box-shadow:0 0 20px #00ff00}50%{border-color:#00ffff;box-shadow:0 0 20px #00ffff}67%{border-color:#0000ff;box-shadow:0 0 20px #0000ff}83%{border-color:#ff00ff;box-shadow:0 0 20px #ff00ff}100%{border-color:#ff0000;box-shadow:0 0 20px #ff0000}} body{background:#0a0a14!important;} .win{background:rgba(15,15,25,0.95)!important;border:2px solid #ff0000!important;border-radius:12px!important;animation:rgb 4s linear infinite;} .wt{color:#fff!important;text-shadow:0 0 10px #ff00ff;} .tb{background:linear-gradient(90deg,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff)!important;border-top:none!important;} .sm{background:rgba(15,15,25,0.95)!important;border:2px solid #ff00ff!important;border-radius:10px!important;} .di{color:#fff!important;text-shadow:0 0 8px #00ffff;}',
      vars: { '--ext-accent': '#ff00ff' }
    },

    // ============================================================
    //  25 NEW EXTENSIONS
    // ============================================================
    {
      id: 'vaporwave', name: 'Vaporwave', icon: '🌐',
      desc: '80s pink and cyan grid aesthetic',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#ff71ce 0%,#01cdfe 50%,#05ffa1 100%)!important;font-family:"Times New Roman",serif!important;} .win{background:rgba(255,113,206,0.15)!important;backdrop-filter:blur(20px)!important;border:2px solid #01cdfe!important;border-radius:20px!important;box-shadow:0 0 40px #ff71ce,0 0 80px rgba(1,205,254,0.5)!important;} .wt{color:#01cdfe!important;text-shadow:0 0 12px #01cdfe;} .tb{background:linear-gradient(90deg,#b967ff,#01cdfe)!important;border-top:2px solid #ff71ce!important;} .sm{background:rgba(185,103,255,0.9)!important;border:2px solid #ff71ce!important;border-radius:15px!important;} .di{color:#fff!important;text-shadow:0 0 8px #ff71ce;}',
      vars: { '--ext-accent': '#ff71ce' }
    },
    {
      id: 'winxp', name: 'Windows XP', icon: '🖱️',
      desc: 'Bliss green hills, blue chrome bars',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#5ba8dd 0%,#a8d88a 50%,#7ab858 100%)!important;} .win{background:#ece9d8!important;border:3px solid #0054e3!important;border-radius:8px!important;box-shadow:2px 2px 10px rgba(0,0,0,0.3)!important;} .wt{background:linear-gradient(180deg,#0058ee 0%,#3a93ff 50%,#0054e3 100%)!important;color:#fff!important;font-weight:bold!important;border-radius:6px 6px 0 0!important;} .tb{background:linear-gradient(180deg,#3a93ff,#0054e3)!important;border-top:none!important;color:#fff!important;} .sm{background:#ece9d8!important;border:3px solid #0054e3!important;} .di{color:#000!important;} button{background:linear-gradient(180deg,#fff,#ece9d8)!important;color:#000!important;border:2px solid #0054e3!important;}',
      vars: { '--ext-accent': '#0054e3' }
    },
    {
      id: 'matrix', name: 'Matrix', icon: '🟩',
      desc: 'Green code rain on black',
      type: 'theme',
      css: '*{font-family:"Courier New",monospace!important;} body{background:#000!important;background-image:repeating-linear-gradient(180deg,transparent 0,transparent 3px,rgba(0,255,0,0.05) 3px,rgba(0,255,0,0.05) 4px)!important;color:#00ff41!important;} .win{background:rgba(0,10,0,0.95)!important;border:1px solid #00ff41!important;box-shadow:0 0 20px #00ff41,inset 0 0 30px rgba(0,255,65,0.1)!important;} .wt{color:#00ff41!important;background:rgba(0,10,0,0.9)!important;text-shadow:0 0 8px #00ff41;} .tb{background:#000!important;border-top:1px solid #00ff41!important;box-shadow:0 -4px 15px rgba(0,255,65,0.4)!important;} .sm{background:rgba(0,10,0,0.95)!important;border:1px solid #00ff41!important;} .di{color:#00ff41!important;text-shadow:0 0 6px #00ff41;}',
      vars: { '--ext-accent': '#00ff41' }
    },
    {
      id: 'pastelgoth', name: 'Pastel Goth', icon: '🖤',
      desc: 'Soft pastels with dark edges',
      type: 'theme',
      css: 'body{background:linear-gradient(135deg,#2a1a2e,#4a2a4d)!important;color:#ffc0e0!important;} .win{background:rgba(255,192,224,0.08)!important;border:2px solid #ff9ec4!important;border-radius:14px!important;backdrop-filter:blur(15px)!important;} .wt{color:#ff9ec4!important;text-shadow:0 0 8px #ff9ec4;} .tb{background:#2a1a2e!important;border-top:2px solid #ff9ec4!important;} .sm{background:rgba(74,42,77,0.95)!important;border:2px solid #ff9ec4!important;} .di{color:#ffc0e0!important;}',
      vars: { '--ext-accent': '#ff9ec4' }
    },
    {
      id: 'deeppurple', name: 'Deep Purple', icon: '🟣',
      desc: 'Rich royal purple, regal feel',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#2a0050,#4a0080)!important;color:#e0c8ff!important;} .win{background:rgba(60,10,100,0.9)!important;border:1px solid #9c27b0!important;border-radius:12px!important;} .wt{color:#e1bee7!important;text-shadow:0 0 6px #9c27b0;} .tb{background:#2a0050!important;border-top:1px solid #9c27b0!important;} .sm{background:rgba(60,10,100,0.95)!important;border:1px solid #9c27b0!important;} .di{color:#e1bee7!important;}',
      vars: { '--ext-accent': '#9c27b0' }
    },
    {
      id: 'sunsetorange', name: 'Sunset Orange', icon: '🧡',
      desc: 'Warm orange, easy on the eyes',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#4a1500,#8a3010)!important;color:#ffd0a0!important;} .win{background:rgba(90,25,10,0.9)!important;border:1px solid #ff6b35!important;border-radius:12px!important;} .wt{color:#ffb87a!important;} .tb{background:#4a1500!important;border-top:1px solid #ff6b35!important;} .sm{background:rgba(90,25,10,0.95)!important;border:1px solid #ff6b35!important;} .di{color:#ffd0a0!important;}',
      vars: { '--ext-accent': '#ff6b35' }
    },
    {
      id: 'arctic', name: 'Arctic', icon: '🧊',
      desc: 'Icy white and pale blue',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#e8f4f8,#b3d9e8)!important;color:#1a3a4a!important;} .win{background:rgba(255,255,255,0.9)!important;color:#1a3a4a!important;border:1px solid #a0d0e0!important;border-radius:14px!important;box-shadow:0 8px 30px rgba(100,150,180,0.2)!important;} .wt{color:#2a7a9a!important;} .tb{background:rgba(232,244,248,0.9)!important;color:#1a3a4a!important;border-top:1px solid #a0d0e0!important;} .sm{background:rgba(255,255,255,0.95)!important;color:#1a3a4a!important;border:1px solid #a0d0e0!important;} .di{color:#1a3a4a!important;}',
      vars: { '--ext-accent': '#2a7a9a' }
    },
    {
      id: 'camo', name: 'Camo', icon: '🪖',
      desc: 'Military camouflage pattern',
      type: 'theme',
      css: 'body{background-color:#4a5a3a!important;background-image:radial-gradient(circle at 20% 30%,#5a6a4a 15%,transparent 15%),radial-gradient(circle at 70% 60%,#3a4a2a 20%,transparent 20%),radial-gradient(circle at 40% 80%,#6a7a5a 18%,transparent 18%),radial-gradient(circle at 85% 25%,#4a5a3a 15%,transparent 15%)!important;} .win{background:rgba(70,80,60,0.95)!important;border:2px solid #3a4a2a!important;border-radius:6px!important;} .wt{color:#c8d8b0!important;} .tb{background:#3a4a2a!important;border-top:2px solid #2a3a1a!important;} .sm{background:rgba(70,80,60,0.95)!important;border:2px solid #3a4a2a!important;} .di{color:#c8d8b0!important;}',
      vars: { '--ext-accent': '#7a8a5a' }
    },
    {
      id: 'holo', name: 'Holographic', icon: '💎',
      desc: 'Iridescent rainbow shimmer',
      type: 'theme',
      css: 'body{background:linear-gradient(135deg,#ff9a9e 0%,#fecfef 25%,#a1c4fd 50%,#c2e9fb 75%,#fbc2eb 100%)!important;} .win{background:rgba(255,255,255,0.15)!important;backdrop-filter:blur(20px) saturate(1.8)!important;border:2px solid rgba(255,255,255,0.5)!important;border-radius:16px!important;box-shadow:0 20px 60px rgba(200,150,200,0.3)!important;} .wt{color:#4a2a6a!important;text-shadow:0 0 10px rgba(255,255,255,0.8);} .tb{background:linear-gradient(90deg,#fbc2eb,#a1c4fd)!important;border-top:2px solid #fff!important;} .sm{background:rgba(255,255,255,0.75)!important;border:2px solid rgba(255,255,255,0.6)!important;border-radius:14px!important;} .di{color:#4a2a6a!important;}',
      vars: { '--ext-accent': '#a1c4fd' }
    },
    {
      id: 'chrome', name: 'Chrome', icon: '🪞',
      desc: 'Polished metallic silver',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#e8e8e8,#a0a0a0)!important;} .win{background:linear-gradient(180deg,#f8f8f8,#c8c8c8)!important;color:#1a1a1a!important;border:2px solid #808080!important;border-radius:8px!important;box-shadow:0 4px 20px rgba(0,0,0,0.3),inset 0 1px 0 #fff!important;} .wt{background:linear-gradient(180deg,#d0d0d0,#909090)!important;color:#1a1a1a!important;text-shadow:0 1px 0 #fff;} .tb{background:linear-gradient(180deg,#b0b0b0,#707070)!important;border-top:2px solid #fff!important;} .sm{background:linear-gradient(180deg,#e8e8e8,#b0b0b0)!important;color:#1a1a1a!important;border:2px solid #808080!important;} .di{color:#1a1a1a!important;text-shadow:0 1px 0 #fff;}',
      vars: { '--ext-accent': '#606060' }
    },
    {
      id: 'comic', name: 'Comic Book', icon: '💥',
      desc: 'Bold outlines and pop-art dots',
      type: 'theme',
      css: 'body{background:#ffec3d!important;background-image:radial-gradient(circle,#ff6b6b 1px,transparent 1px),radial-gradient(circle,#ff6b6b 1px,transparent 1px)!important;background-size:20px 20px!important;background-position:0 0,10px 10px!important;color:#000!important;font-family:Impact,"Arial Black",sans-serif!important;} .win{background:#fff!important;color:#000!important;border:4px solid #000!important;border-radius:0!important;box-shadow:8px 8px 0 #000!important;} .wt{background:#ff3d3d!important;color:#fff!important;-webkit-text-stroke:1px #000;font-weight:bold!important;} .tb{background:#ff3d3d!important;border-top:4px solid #000!important;color:#fff!important;} .sm{background:#fff!important;color:#000!important;border:4px solid #000!important;} .di{color:#000!important;-webkit-text-stroke:0.5px #fff;} button{background:#ffec3d!important;color:#000!important;border:3px solid #000!important;font-weight:bold!important;box-shadow:3px 3px 0 #000!important;}',
      vars: { '--ext-accent': '#ff3d3d' }
    },
    {
      id: 'graffiti', name: 'Graffiti', icon: '🎨',
      desc: 'Street art splatters on dark concrete',
      type: 'theme',
      css: 'body{background-color:#1a1a1a!important;background-image:radial-gradient(circle at 15% 20%,rgba(255,20,100,0.4) 8%,transparent 8%),radial-gradient(circle at 75% 40%,rgba(0,220,255,0.4) 10%,transparent 10%),radial-gradient(circle at 40% 75%,rgba(255,220,0,0.35) 12%,transparent 12%),radial-gradient(circle at 85% 85%,rgba(120,255,120,0.4) 8%,transparent 8%)!important;} .win{background:rgba(30,30,30,0.95)!important;border:2px solid #ff1466!important;border-radius:10px!important;box-shadow:0 0 30px rgba(255,20,100,0.3)!important;} .wt{color:#ff1466!important;text-shadow:0 0 10px #ff1466;} .tb{background:linear-gradient(90deg,#ff1466,#00dcff,#ffdc00)!important;border-top:none!important;} .sm{background:rgba(30,30,30,0.95)!important;border:2px solid #00dcff!important;border-radius:10px!important;} .di{color:#fff!important;text-shadow:0 0 6px #00dcff;}',
      vars: { '--ext-accent': '#ff1466' }
    },
    {
      id: 'newspaper', name: 'Newspaper', icon: '📰',
      desc: 'Old black-and-white print look',
      type: 'theme',
      css: 'body{background:#e8e4d8!important;color:#1a1a1a!important;font-family:"Times New Roman",Georgia,serif!important;} .win{background:#f5f0e4!important;color:#1a1a1a!important;border:1px solid #8a8070!important;border-radius:0!important;box-shadow:2px 2px 8px rgba(80,70,50,0.2)!important;} .wt{color:#1a1a1a!important;background:#e8e4d8!important;font-weight:bold!important;border-bottom:2px solid #1a1a1a!important;} .tb{background:#d8d4c8!important;border-top:2px solid #1a1a1a!important;color:#1a1a1a!important;} .sm{background:#f5f0e4!important;color:#1a1a1a!important;border:1px solid #8a8070!important;} .di{color:#1a1a1a!important;} button{background:#f5f0e4!important;color:#1a1a1a!important;border:1px solid #1a1a1a!important;}',
      vars: { '--ext-accent': '#1a1a1a' }
    },
    {
      id: 'blueprint', name: 'Blueprint', icon: '📐',
      desc: 'White grid lines on engineer blue',
      type: 'theme',
      css: 'body{background:#0a3a6a!important;background-image:linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)!important;background-size:20px 20px!important;color:#e0f0ff!important;} .win{background:rgba(10,58,106,0.95)!important;color:#e0f0ff!important;border:1px solid #ffffff!important;border-radius:0!important;box-shadow:0 0 20px rgba(255,255,255,0.2)!important;} .wt{color:#fff!important;background:#0a3a6a!important;border-bottom:2px solid #fff!important;font-family:monospace!important;} .tb{background:#082a4a!important;border-top:2px solid #fff!important;} .sm{background:rgba(10,58,106,0.95)!important;border:1px solid #fff!important;} .di{color:#fff!important;font-family:monospace!important;} button{background:#0a3a6a!important;color:#fff!important;border:1px solid #fff!important;}',
      vars: { '--ext-accent': '#ffffff' }
    },
    {
      id: 'circuit', name: 'Circuit Board', icon: '🔌',
      desc: 'Green PCB with traces',
      type: 'theme',
      css: 'body{background-color:#0a2a10!important;background-image:repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(255,200,0,0.1) 8px,rgba(255,200,0,0.1) 10px),repeating-linear-gradient(-45deg,transparent,transparent 12px,rgba(0,255,120,0.15) 12px,rgba(0,255,120,0.15) 14px)!important;} .win{background:rgba(10,40,20,0.95)!important;border:1px solid #00ff88!important;border-radius:4px!important;box-shadow:0 0 15px rgba(0,255,136,0.4)!important;} .wt{color:#ffc800!important;text-shadow:0 0 6px #ffc800;font-family:monospace!important;} .tb{background:#0a2a10!important;border-top:1px solid #00ff88!important;} .sm{background:rgba(10,40,20,0.95)!important;border:1px solid #00ff88!important;} .di{color:#00ff88!important;font-family:monospace!important;}',
      vars: { '--ext-accent': '#00ff88' }
    },
    {
      id: 'zen', name: 'Japanese Zen', icon: '🎋',
      desc: 'Soft beige, ink brush, tranquil',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#f5f0e4,#e0d5c0)!important;color:#3a2e1a!important;font-family:Georgia,serif!important;} .win{background:rgba(255,250,240,0.95)!important;color:#3a2e1a!important;border:1px solid #8a7a5a!important;border-radius:4px!important;box-shadow:0 8px 30px rgba(120,100,60,0.15)!important;} .wt{color:#5a3a1a!important;background:transparent!important;border-bottom:1px solid #8a7a5a!important;} .tb{background:rgba(224,213,192,0.9)!important;border-top:1px solid #8a7a5a!important;color:#3a2e1a!important;} .sm{background:rgba(255,250,240,0.95)!important;border:1px solid #8a7a5a!important;} .di{color:#3a2e1a!important;} button{background:#e0d5c0!important;color:#3a2e1a!important;border:1px solid #8a7a5a!important;}',
      vars: { '--ext-accent': '#8a5a3a' }
    },
    {
      id: 'steampunk', name: 'Steampunk', icon: '⚙️',
      desc: 'Brass and copper Victorian machinery',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#3a2410,#6a4a20)!important;color:#f0d8a8!important;font-family:Georgia,serif!important;} .win{background:linear-gradient(180deg,#5a3a1a,#3a2410)!important;color:#f0d8a8!important;border:3px solid #c8a060!important;border-radius:12px!important;box-shadow:inset 0 0 40px rgba(0,0,0,0.5),0 8px 30px rgba(0,0,0,0.5)!important;} .wt{color:#f0d8a8!important;background:linear-gradient(180deg,#7a5020,#4a3010)!important;border-bottom:2px solid #c8a060!important;} .tb{background:linear-gradient(180deg,#5a3a1a,#3a2410)!important;border-top:3px solid #c8a060!important;} .sm{background:linear-gradient(180deg,#5a3a1a,#3a2410)!important;border:2px solid #c8a060!important;} .di{color:#f0d8a8!important;} button{background:linear-gradient(180deg,#a0804a,#6a4a20)!important;color:#f0d8a8!important;border:2px solid #c8a060!important;}',
      vars: { '--ext-accent': '#c8a060' }
    },
    {
      id: 'hacker', name: 'Hacker', icon: '💀',
      desc: 'Red alert terminal, emergency access',
      type: 'theme',
      css: '*{font-family:"Courier New",monospace!important;} body{background:#0a0000!important;color:#ff0000!important;} .win{background:rgba(15,0,0,0.95)!important;border:2px solid #ff0000!important;box-shadow:0 0 30px #ff0000,inset 0 0 40px rgba(255,0,0,0.1)!important;} .wt{color:#ff0000!important;background:rgba(15,0,0,0.95)!important;text-shadow:0 0 10px #ff0000;animation:blink 1.5s infinite;} .tb{background:#0a0000!important;border-top:2px solid #ff0000!important;box-shadow:0 -4px 20px rgba(255,0,0,0.5)!important;} .sm{background:rgba(15,0,0,0.95)!important;border:2px solid #ff0000!important;} .di{color:#ff0000!important;text-shadow:0 0 8px #ff0000;} button{background:#0a0000!important;color:#ff0000!important;border:1px solid #ff0000!important;} @keyframes blink{0%,100%{opacity:1}50%{opacity:0.7}}',
      vars: { '--ext-accent': '#ff0000' }
    },
    {
      id: 'goldluxe', name: 'Gold Luxe', icon: '👑',
      desc: 'Black tie with gold accents',
      type: 'theme',
      css: 'body{background:#000!important;} .win{background:linear-gradient(180deg,#1a1408,#0a0804)!important;border:2px solid #d4af37!important;border-radius:8px!important;box-shadow:0 0 30px rgba(212,175,55,0.3)!important;} .wt{color:#d4af37!important;background:linear-gradient(90deg,#1a1408,#2a2010)!important;text-shadow:0 0 8px #d4af37;letter-spacing:1px;} .tb{background:linear-gradient(90deg,#0a0804,#1a1408,#0a0804)!important;border-top:2px solid #d4af37!important;} .sm{background:linear-gradient(180deg,#1a1408,#0a0804)!important;border:2px solid #d4af37!important;} .di{color:#d4af37!important;text-shadow:0 0 6px #d4af37;} button{background:linear-gradient(180deg,#2a2010,#1a1408)!important;color:#d4af37!important;border:1px solid #d4af37!important;}',
      vars: { '--ext-accent': '#d4af37' }
    },
    {
      id: 'bubblegum', name: 'Bubblegum', icon: '🫧',
      desc: 'Playful pink and mint pastels',
      type: 'theme',
      css: 'body{background:linear-gradient(135deg,#ffc0e0 0%,#ffe0f0 50%,#c0ffe0 100%)!important;color:#4a1a3a!important;} .win{background:rgba(255,255,255,0.9)!important;color:#4a1a3a!important;border:2px solid #ff80c0!important;border-radius:20px!important;box-shadow:0 8px 30px rgba(255,128,192,0.25)!important;} .wt{color:#ff4080!important;} .tb{background:linear-gradient(90deg,#ffc0e0,#c0ffe0)!important;border-top:2px solid #ff80c0!important;} .sm{background:rgba(255,255,255,0.95)!important;border:2px solid #ff80c0!important;border-radius:15px!important;} .di{color:#4a1a3a!important;} button{background:#ffe0f0!important;color:#4a1a3a!important;border:2px solid #ff80c0!important;border-radius:12px!important;}',
      vars: { '--ext-accent': '#ff4080' }
    },
    {
      id: 'bnw', name: 'Black & White', icon: '⚪',
      desc: 'Stark two-tone contrast',
      type: 'theme',
      css: '*{filter:grayscale(100%) contrast(1.3)!important;} body{background:#000!important;color:#fff!important;} .win{background:#111!important;color:#fff!important;border:2px solid #fff!important;box-shadow:4px 4px 0 #fff!important;border-radius:0!important;} .wt{background:#fff!important;color:#000!important;font-weight:900!important;} .tb{background:#000!important;border-top:2px solid #fff!important;} .sm{background:#000!important;border:2px solid #fff!important;color:#fff!important;} .di{color:#fff!important;} button{background:#fff!important;color:#000!important;border:none!important;font-weight:700!important;}',
      vars: { '--ext-accent': '#ffffff' }
    },
    {
      id: 'fire', name: 'Fire', icon: '🔥',
      desc: 'Blazing orange and red flames',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#000 0%,#8a0000 30%,#ff4400 65%,#ffaa00 100%)!important;} .win{background:linear-gradient(180deg,rgba(30,10,0,0.95),rgba(60,20,0,0.95))!important;border:2px solid #ff6600!important;border-radius:10px!important;box-shadow:0 0 30px rgba(255,102,0,0.5)!important;} .wt{color:#ffaa00!important;text-shadow:0 0 10px #ff4400;} .tb{background:linear-gradient(90deg,#1a0500,#8a2000,#ff6600)!important;border-top:2px solid #ffaa00!important;} .sm{background:linear-gradient(180deg,rgba(30,10,0,0.95),rgba(60,20,0,0.95))!important;border:2px solid #ff6600!important;} .di{color:#ffaa00!important;text-shadow:0 0 8px #ff4400;}',
      vars: { '--ext-accent': '#ff6600' }
    },
    {
      id: 'ice', name: 'Ice', icon: '🧊',
      desc: 'Freezing blue crystal tones',
      type: 'theme',
      css: 'body{background:linear-gradient(180deg,#001a33 0%,#005080 50%,#80d0ff 100%)!important;} .win{background:rgba(200,240,255,0.15)!important;backdrop-filter:blur(20px)!important;border:2px solid #80d0ff!important;border-radius:14px!important;box-shadow:0 0 25px rgba(128,208,255,0.5),inset 0 0 30px rgba(255,255,255,0.1)!important;} .wt{color:#80d0ff!important;text-shadow:0 0 10px #80d0ff;} .tb{background:linear-gradient(90deg,#001a33,#005080)!important;border-top:2px solid #80d0ff!important;} .sm{background:rgba(0,80,128,0.7)!important;backdrop-filter:blur(15px)!important;border:2px solid #80d0ff!important;} .di{color:#c8f0ff!important;text-shadow:0 0 8px #80d0ff;}',
      vars: { '--ext-accent': '#80d0ff' }
    },
    {
      id: 'toxic', name: 'Toxic', icon: '☢️',
      desc: 'Radioactive green slime',
      type: 'theme',
      css: 'body{background:radial-gradient(circle at 30% 40%,#1a3a00 0%,#0a1a00 50%,#000 100%)!important;} .win{background:rgba(10,30,0,0.95)!important;border:2px solid #a0ff00!important;border-radius:10px!important;box-shadow:0 0 30px #a0ff00,inset 0 0 30px rgba(160,255,0,0.15)!important;} .wt{color:#a0ff00!important;text-shadow:0 0 12px #a0ff00;} .tb{background:#000!important;border-top:2px solid #a0ff00!important;box-shadow:0 -4px 20px rgba(160,255,0,0.6)!important;} .sm{background:rgba(10,30,0,0.95)!important;border:2px solid #a0ff00!important;} .di{color:#a0ff00!important;text-shadow:0 0 8px #a0ff00;}',
      vars: { '--ext-accent': '#a0ff00' }
    },
    {
      id: 'solar', name: 'Solar Flare', icon: '☀️',
      desc: 'Bright sun with plasma loops',
      type: 'theme',
      css: 'body{background:radial-gradient(circle at 50% 20%,#ffff88 0%,#ff8800 30%,#cc2200 60%,#3a0000 100%)!important;} .win{background:rgba(40,10,0,0.9)!important;border:2px solid #ffcc00!important;border-radius:14px!important;box-shadow:0 0 40px rgba(255,204,0,0.5)!important;} .wt{color:#ffff88!important;text-shadow:0 0 12px #ffcc00;} .tb{background:linear-gradient(90deg,#3a0000,#cc2200,#ff8800)!important;border-top:2px solid #ffcc00!important;} .sm{background:rgba(60,20,0,0.9)!important;border:2px solid #ffcc00!important;} .di{color:#ffdd66!important;text-shadow:0 0 8px #ff8800;}',
      vars: { '--ext-accent': '#ffcc00' }
    }
  ];

  // ---------- CSS injection ----------
  var STYLE_ID = 'oc-ext-theme';

  function removeThemeStyle() {
    var el = document.getElementById(STYLE_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function applyThemeCss(css, vars) {
    removeThemeStyle();
    if (!css && (!vars || !Object.keys(vars).length)) return;
    var el = document.createElement('style');
    el.id = STYLE_ID;
    var varBlock = '';
    if (vars) {
      varBlock = ':root{';
      for (var k in vars) if (Object.prototype.hasOwnProperty.call(vars, k)) {
        varBlock += k + ':' + vars[k] + ';';
      }
      varBlock += '}';
    }
    el.textContent = varBlock + '\n' + (css || '');
    document.head.appendChild(el);
  }

  // ---------- Icons ----------
  function getIconOverride(appId) {
    try { return LS.getItem('oc_ext_icon_' + appId) || ''; } catch (e) { return ''; }
  }
  function setIconOverride(appId, value) {
    try {
      if (value) LS.setItem('oc_ext_icon_' + appId, value);
      else LS.removeItem('oc_ext_icon_' + appId);
    } catch (e) {}
  }
  function clearAllIconOverrides() {
    var ids = ['files','terminal','notepad','calculator','browser','camera',
               'microphone','audioplayer','wallpaper','weather','clock','calendar',
               'sysinfo','appstore','settings','music','kernel0','videohub',
               'photoeditor','vapor','science','infinity','checklist','extstore'];
    for (var i = 0; i < ids.length; i++) setIconOverride(ids[i], '');
  }
  function applyIconOverrides() {
    var deskIcons = document.querySelectorAll('.di[data-app]');
    for (var i = 0; i < deskIcons.length; i++) {
      var el = deskIcons[i];
      var appId = el.getAttribute('data-app');
      var custom = getIconOverride(appId);
      if (!custom) continue;
      var icEl = el.querySelector('.ic');
      if (!icEl) continue;
      if (custom.indexOf('data:image') === 0) {
        icEl.innerHTML = '<img src="' + custom + '" style="width:42px;height:42px;object-fit:contain;"/>';
      } else {
        icEl.textContent = custom;
      }
    }
    var menuIcons = document.querySelectorAll('.smi[data-a]');
    for (var j = 0; j < menuIcons.length; j++) {
      var el2 = menuIcons[j];
      var aId = el2.getAttribute('data-a');
      var custom2 = getIconOverride(aId);
      if (!custom2) continue;
      var ic2 = el2.querySelector('.ic');
      if (!ic2) continue;
      if (custom2.indexOf('data:image') === 0) {
        ic2.innerHTML = '<img src="' + custom2 + '" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;"/>';
      } else {
        ic2.textContent = custom2;
      }
    }
  }

  // ---------- Installed list ----------
  function getInstalled() {
    try {
      var raw = LS.getItem('oc_ext_installed');
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function setInstalled(arr) {
    try { LS.setItem('oc_ext_installed', JSON.stringify(arr)); } catch (e) {}
  }
  function isInstalled(id) { return getInstalled().indexOf(id) !== -1; }
  function install(id) {
    var arr = getInstalled();
    if (arr.indexOf(id) !== -1) return false;
    arr.push(id);
    setInstalled(arr);
    window.dispatchEvent(new CustomEvent('extensionchange', { detail: { id: id, action: 'install' } }));
    return true;
  }
  function uninstall(id) {
    var arr = getInstalled();
    var filtered = arr.filter(function (x) { return x !== id; });
    if (filtered.length === arr.length) return false;
    setInstalled(filtered);
    if (getActiveTheme() === id) setActiveTheme('none');
    if (id === 'customicons') clearAllIconOverrides();
    window.dispatchEvent(new CustomEvent('extensionchange', { detail: { id: id, action: 'uninstall' } }));
    return true;
  }

  // ---------- Active theme ----------
  function getActiveTheme() {
    try { return LS.getItem('oc_ext_active_theme') || 'none'; } catch (e) { return 'none'; }
  }
  function setActiveTheme(id) {
    try { LS.setItem('oc_ext_active_theme', id || 'none'); } catch (e) {}
    applyAll();
  }
  function getExtension(id) {
    for (var i = 0; i < EXTENSIONS.length; i++) if (EXTENSIONS[i].id === id) return EXTENSIONS[i];
    return null;
  }

  // ---------- Apply ----------
  function applyAll() {
    var active = getActiveTheme();
    if (active && active !== 'none') {
      var ext = getExtension(active);
      if (ext && isInstalled(ext.id)) applyThemeCss(ext.css, ext.vars);
      else removeThemeStyle();
    } else removeThemeStyle();

    if (isInstalled('customicons')) applyIconOverrides();
    applyIconOverrides();
  }

  window.Extensions = {
    ALL: EXTENSIONS,
    get: getExtension,
    installed: getInstalled,
    isInstalled: isInstalled,
    install: install,
    uninstall: uninstall,
    getActiveTheme: getActiveTheme,
    setActiveTheme: setActiveTheme,
    getIconOverride: getIconOverride,
    setIconOverride: setIconOverride,
    clearAllIconOverrides: clearAllIconOverrides,
    applyAll: applyAll
  };

  function init() {
    applyAll();
    var oldRender = window.renderDesktop;
    if (typeof oldRender === 'function' && !oldRender.__extWrapped) {
      window.renderDesktop = function () {
        oldRender.apply(this, arguments);
        applyIconOverrides();
      };
      window.renderDesktop.__extWrapped = true;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  console.log('Extensions module loaded — ' + EXTENSIONS.length + ' built-in extensions');
})();

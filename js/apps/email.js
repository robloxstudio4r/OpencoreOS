// ============================================================
//  email.js — OpencoreOS Mail
//  Internal messaging + 16 email themes (Extensions tab)
// ============================================================

function openEmail(){
  var supabase = window.supabaseClient;
  if (!supabase) { alert('Supabase not loaded.'); return; }
  var user = window.currentUser;
  if (!user) { alert('Not signed in.'); return; }

  var THEME_KEY = 'oc_email_theme';
  var THEME_STYLE_ID = 'em-theme-style';

  // ============================================================
  //  16 EMAIL THEMES
  // ============================================================
  var THEMES = [
    { id:'classic', name:'Classic', icon:'📧',
      bg:'#141414', panel:'#1a1a1a', border:'#2a2a2a', text:'#dddddd', muted:'#888888',
      accent:'#1db954', accentText:'#ffffff', hover:'rgba(255,255,255,0.05)' },

    { id:'gmail', name:'Gmail', icon:'📬',
      bg:'#f6f8fc', panel:'#ffffff', border:'#e8eaed', text:'#202124', muted:'#5f6368',
      accent:'#1a73e8', accentText:'#ffffff', hover:'#f1f3f4' },

    { id:'outlook', name:'Outlook', icon:'💼',
      bg:'#f3f2f1', panel:'#ffffff', border:'#edebe9', text:'#323130', muted:'#605e5c',
      accent:'#0078d4', accentText:'#ffffff', hover:'#eff6fc' },

    { id:'darkmoon', name:'Dark Moon', icon:'🌙',
      bg:'#0d0d15', panel:'#14141f', border:'#1e1e2e', text:'#d0d0e0', muted:'#7070a0',
      accent:'#8888ff', accentText:'#ffffff', hover:'rgba(136,136,255,0.08)' },

    { id:'paper', name:'Paper', icon:'📄',
      bg:'#f4efe4', panel:'#fdfaf3', border:'#e0d8c8', text:'#3a2e1a', muted:'#8a7a5a',
      accent:'#8a6a3a', accentText:'#ffffff', hover:'#f0e8d8' },

    { id:'sunset', name:'Sunset', icon:'🌅',
      bg:'#2a1520', panel:'#3a1a2a', border:'#4a2030', text:'#ffd0a0', muted:'#b08080',
      accent:'#ff6b35', accentText:'#ffffff', hover:'rgba(255,107,53,0.1)' },

    { id:'ocean', name:'Ocean', icon:'🌊',
      bg:'#0a1929', panel:'#102540', border:'#1a3a5a', text:'#b3e5fc', muted:'#5a8aac',
      accent:'#4fc3f7', accentText:'#0a1929', hover:'rgba(79,195,247,0.1)' },

    { id:'forest', name:'Forest', icon:'🌲',
      bg:'#0d2818', panel:'#1a3d2b', border:'#2a4d3a', text:'#c8e6c9', muted:'#6a9a70',
      accent:'#81c784', accentText:'#0d2818', hover:'rgba(129,199,132,0.1)' },

    { id:'rose', name:'Rose', icon:'🌹',
      bg:'#fff0f5', panel:'#ffffff', border:'#ffd0e0', text:'#4a1a3a', muted:'#b070a0',
      accent:'#e91e63', accentText:'#ffffff', hover:'#ffe0f0' },

    { id:'neon', name:'Neon', icon:'🌆',
      bg:'#0a0020', panel:'#14003a', border:'#00ffff', text:'#c0ffff', muted:'#00aaaa',
      accent:'#00ffff', accentText:'#000000', hover:'rgba(0,255,255,0.1)' },

    { id:'retro', name:'Retro Amber', icon:'📺',
      bg:'#1a0e00', panel:'#0a0500', border:'#ffb000', text:'#ffb000', muted:'#a07000',
      accent:'#ffb000', accentText:'#000000', hover:'rgba(255,176,0,0.1)' },

    { id:'minimal', name:'Minimal', icon:'⬜',
      bg:'#fafafa', panel:'#ffffff', border:'#e8e8e8', text:'#212121', muted:'#757575',
      accent:'#212121', accentText:'#ffffff', hover:'#f0f0f0' },

    { id:'terminal', name:'Terminal', icon:'🖥️',
      bg:'#000000', panel:'#0a0a0a', border:'#00ff00', text:'#00ff00', muted:'#008800',
      accent:'#00ff00', accentText:'#000000', hover:'rgba(0,255,0,0.1)' },

    { id:'candy', name:'Candy', icon:'🍬',
      bg:'#f5e6ff', panel:'#ffffff', border:'#e0c0ff', text:'#4a2a6a', muted:'#9060b0',
      accent:'#b06bff', accentText:'#ffffff', hover:'#f0e0ff' },

    { id:'cyberpunk', name:'Cyberpunk', icon:'⚡',
      bg:'#0a0015', panel:'#1a0030', border:'#ff00aa', text:'#ff88dd', muted:'#aa0088',
      accent:'#ff00aa', accentText:'#ffffff', hover:'rgba(255,0,170,0.12)' },

    { id:'monochrome', name:'Monochrome', icon:'◐',
      bg:'#1a1a1a', panel:'#222222', border:'#3a3a3a', text:'#e0e0e0', muted:'#888888',
      accent:'#e0e0e0', accentText:'#000000', hover:'rgba(255,255,255,0.08)' }
  ];

  // ---------- Theme CSS ----------
  function buildThemeCSS(t) {
    return [
      '#em-app{background:' + t.bg + '!important;color:' + t.text + '!important;}',
      '#em-app #em-side{background:' + t.panel + '!important;border-color:' + t.border + '!important;}',
      '#em-app #em-side-addr{background:' + t.accent + '22!important;color:' + t.accent + '!important;}',
      '#em-app .em-folder{color:' + t.muted + '!important;}',
      '#em-app .em-folder:hover{background:' + t.hover + '!important;}',
      '#em-app .em-folder.active{background:' + t.accent + '22!important;color:' + t.accent + '!important;font-weight:600;}',
      '#em-app #em-compose{background:' + t.accent + '!important;color:' + t.accentText + '!important;}',
      '#em-app #em-toolbar{background:' + t.panel + '!important;border-color:' + t.border + '!important;}',
      '#em-app #em-title{color:' + t.text + '!important;}',
      '#em-app #em-refresh,#em-app #em-empty-trash{border-color:' + t.border + '!important;color:' + t.text + '!important;}',
      '#em-app #em-list{background:' + t.bg + '!important;}',
      '#em-app .em-row{border-color:' + t.border + '!important;color:' + t.text + '!important;}',
      '#em-app .em-row:hover{background:' + t.hover + '!important;}',
      '#em-app .em-row.unread{background:' + t.accent + '12!important;}',
      '#em-app .em-row .er-from{color:' + t.text + '!important;}',
      '#em-app .em-row.unread .er-from{color:' + t.text + '!important;font-weight:600;}',
      '#em-app .em-row .er-date{color:' + t.muted + '!important;}',
      '#em-app .em-row .er-sub{color:' + t.text + '!important;}',
      '#em-app .em-row.unread .er-sub{color:' + t.text + '!important;}',
      '#em-app .em-row .er-preview{color:' + t.muted + '!important;}',
      '#em-app #em-status{background:' + t.panel + '!important;border-color:' + t.border + '!important;color:' + t.muted + '!important;}',
      '#em-app #em-ext-view{background:' + t.bg + '!important;color:' + t.text + '!important;}',
      '#em-app .em-ext-card{background:' + t.panel + '!important;border-color:' + t.border + '!important;}',
      '#em-app .em-ext-card:hover{border-color:' + t.accent + '!important;}',
      '#em-app .em-ext-card.active{border-color:' + t.accent + '!important;box-shadow:0 0 0 2px ' + t.accent + ';background:' + t.accent + '10!important;}',
      '#em-app .em-ext-name{color:' + t.text + '!important;}',
      '#em-app .em-ext-sub{color:' + t.muted + '!important;}'
    ].join('\n');
  }

  function applyTheme(id) {
    var t = null;
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) { t = THEMES[i]; break; }
    if (!t) t = THEMES[0];

    try { LS.setItem(THEME_KEY, t.id); } catch (e) {}

    var styleEl = document.getElementById(THEME_STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = THEME_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = buildThemeCSS(t);
  }

  function currentThemeId() {
    try { return LS.getItem(THEME_KEY) || 'classic'; } catch (e) { return 'classic'; }
  }

  // ---------- Window ----------
  var win = makeWindow('email', 'Email', '📧',
    '<div id="em-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
      + '<div id="em-root" style="display:flex;flex:1;overflow:hidden;"></div>'
      + '<div id="em-status" style="padding:6px 14px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;">Loading…</div>'
    + '</div>', 900, 640);

  var c = win.querySelector('#em-app');
  var root = c.querySelector('#em-root');
  var statusEl = c.querySelector('#em-status');

  var myAddress = null;
  var currentFolder = 'inbox';

  // Apply theme immediately
  applyTheme(currentThemeId());

  // ---------- Load my address ----------
  function loadMyAddress() {
    return supabase.from('mail_accounts').select('address').eq('user_id', user.id).single()
      .then(function (res) {
        if (res.error) return null;
        return res.data ? res.data.address : null;
      });
  }

  // ============================================================
  //  SETUP SCREEN
  // ============================================================
  function showSetup() {
    root.innerHTML =
      '<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">'
        + '<div style="max-width:420px;text-align:center;">'
          + '<div style="font-size:64px;margin-bottom:16px;">📧</div>'
          + '<div style="font-size:22px;color:#fff;font-weight:600;margin-bottom:8px;">Set up your Opencore mail</div>'
          + '<div style="color:#888;font-size:13px;line-height:1.6;margin-bottom:24px;">'
            + 'Pick a username. Your address will be <b style="color:#1db954;">username@opencore.io</b>.<br>'
            + 'You can send mail to any other OpencoreOS user.'
          + '</div>'
          + '<div style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.3);'
            + 'border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:4px 12px;margin-bottom:8px;">'
            + '<input id="em-pick" type="text" maxlength="30" placeholder="yourname" '
              + 'style="flex:1;background:transparent;border:none;color:#fff;padding:10px 0;'
              + 'outline:none;font-size:14px;"/>'
            + '<span style="color:#1db954;font-weight:600;font-size:13px;">@opencore.io</span>'
          + '</div>'
          + '<div id="em-pick-err" style="color:#ff8a8a;font-size:12px;min-height:18px;margin-bottom:12px;"></div>'
          + '<button type="button" id="em-claim" '
            + 'style="width:100%;background:#1db954;border:none;color:#fff;padding:12px;'
            + 'border-radius:8px;cursor:pointer;font-weight:600;font-size:14px;">Claim Address</button>'
        + '</div>'
      + '</div>';

    var input = root.querySelector('#em-pick');
    var errEl = root.querySelector('#em-pick-err');
    var btn = root.querySelector('#em-claim');

    function submit() {
      var username = input.value.trim();
      if (!username) { errEl.textContent = 'Enter a username.'; return; }
      if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
        errEl.textContent = 'Only letters, digits, . _ - (3–30 chars).';
        return;
      }
      errEl.textContent = '';
      btn.textContent = 'Claiming…';
      btn.disabled = true;

      supabase.rpc('claim_address', { username: username }).then(function (res) {
        if (res.error) {
          errEl.textContent = res.error.message;
          btn.textContent = 'Claim Address';
          btn.disabled = false;
          return;
        }
        myAddress = res.data;
        statusEl.textContent = 'You are ' + myAddress;
        showInbox();
      });
    }

    btn.onclick = submit;
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    input.focus();
  }

  // ============================================================
  //  INBOX
  // ============================================================
  function showInbox() {
    root.innerHTML =
      '<div id="em-side" style="width:180px;border-right:1px solid #2a2a2a;padding:12px 8px;display:flex;flex-direction:column;gap:2px;">'
        + '<div style="color:#fff;font-weight:600;margin-bottom:12px;padding:0 6px;font-size:14px;">📧 Mail</div>'
        + '<div id="em-side-addr" style="padding:8px 12px;color:#1db954;font-size:11px;'
          + 'background:rgba(29,185,84,0.08);border-radius:6px;margin-bottom:12px;'
          + 'overflow:hidden;text-overflow:ellipsis;">' + myAddress + '</div>'
        + '<button type="button" id="em-compose" '
          + 'style="background:#1db954;border:none;color:#fff;padding:9px;border-radius:6px;'
          + 'cursor:pointer;font-weight:600;font-size:13px;margin-bottom:12px;">✏️ Compose</button>'
        + folderBtn('inbox', '📥 Inbox')
        + folderBtn('starred', '⭐ Starred')
        + folderBtn('sent', '📤 Sent')
        + folderBtn('trash', '🗑️ Trash')
        + '<div style="flex:1;"></div>'
        + folderBtn('extensions', '🧩 Extensions')
      + '</div>'
      + '<div id="em-main" style="flex:1;display:flex;flex-direction:column;overflow:hidden;">'
        + '<div id="em-toolbar" style="padding:10px 16px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:10px;">'
          + '<div id="em-title" style="flex:1;color:#fff;font-weight:600;">Inbox</div>'
          + '<button type="button" id="em-refresh" '
            + 'style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);'
            + 'color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;">↻ Refresh</button>'
          + '<button type="button" id="em-empty-trash" style="display:none;background:rgba(255,80,80,0.12);'
            + 'border:1px solid rgba(255,80,80,0.3);color:#ff8a8a;padding:6px 12px;'
            + 'border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">Empty Trash</button>'
        + '</div>'
        + '<div id="em-list" style="flex:1;overflow-y:auto;"></div>'
      + '</div>';

    root.querySelector('#em-compose').onclick = openCompose;
    root.querySelector('#em-refresh').onclick = function () {
      if (currentFolder === 'extensions') showExtensions();
      else loadFolder();
    };

    var sideFolders = root.querySelectorAll('.em-folder');
    sideFolders.forEach(function (f) {
      f.onclick = function () {
        currentFolder = f.getAttribute('data-folder');
        sideFolders.forEach(function (x) {
          x.classList.remove('active');
          x.style.background = '';
          x.style.color = '#aaa';
          x.style.fontWeight = '400';
        });
        f.classList.add('active');
        f.style.background = 'rgba(29,185,84,0.15)';
        f.style.color = '#1db954';
        f.style.fontWeight = '600';

        if (currentFolder === 'extensions') {
          showExtensions();
        } else {
          loadFolder();
        }
      };
    });

    // Highlight Inbox by default
    sideFolders[0].classList.add('active');
    sideFolders[0].style.background = 'rgba(29,185,84,0.15)';
    sideFolders[0].style.color = '#1db954';
    sideFolders[0].style.fontWeight = '600';

    root.querySelector('#em-empty-trash').onclick = function () {
      if (!confirm('Permanently delete every message in Trash?')) return;
      supabase.from('mail_messages').delete().eq('owner_id', user.id).eq('folder', 'trash')
        .then(function () { loadFolder(); });
    };

    // Reapply theme (since DOM was rebuilt)
    applyTheme(currentThemeId());

    loadFolder();
  }

  function folderBtn(id, label) {
    return '<div class="em-folder" data-folder="' + id + '" '
      + 'style="padding:9px 12px;border-radius:6px;cursor:pointer;color:#aaa;font-size:13px;">'
      + label + '</div>';
  }

  // ============================================================
  //  LOAD FOLDER
  // ============================================================
  function loadFolder() {
    var listEl = root.querySelector('#em-list');
    var titleEl = root.querySelector('#em-title');
    var emptyBtn = root.querySelector('#em-empty-trash');
    if (!listEl) return;

    var titles = { inbox: 'Inbox', starred: '⭐ Starred', sent: 'Sent', trash: 'Trash' };
    titleEl.textContent = titles[currentFolder] || 'Inbox';
    emptyBtn.style.display = currentFolder === 'trash' ? 'block' : 'none';

    listEl.innerHTML = '<div style="color:#666;text-align:center;padding:40px;">Loading…</div>';

    var q = supabase.from('mail_messages').select('*').eq('owner_id', user.id);
    if (currentFolder === 'starred') {
      q = q.eq('is_starred', true);
    } else {
      q = q.eq('folder', currentFolder);
    }

    q.order('created_at', { ascending: false }).limit(200).then(function (res) {
      if (res.error) {
        listEl.innerHTML = '<div style="color:#f66;padding:20px;">Error: ' + res.error.message + '</div>';
        return;
      }
      renderList(res.data || []);
      statusEl.textContent = (res.data || []).length + ' message' + ((res.data || []).length === 1 ? '' : 's') + ' — ' + myAddress;
    });
  }

  function renderList(rows) {
    var listEl = root.querySelector('#em-list');
    listEl.innerHTML = '';
    if (!rows.length) {
      listEl.innerHTML = '<div style="color:#666;text-align:center;padding:60px 20px;">No messages here yet.</div>';
      return;
    }

    rows.forEach(function (em) {
      var isUnread = !em.is_read && currentFolder === 'inbox';
      var row = document.createElement('div');
      row.className = 'em-row' + (isUnread ? ' unread' : '');
      row.style.cssText =
        'padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;';

      var otherParty = (currentFolder === 'sent') ? em.to_address : em.from_address;
      var dateStr = em.created_at ? new Date(em.created_at).toLocaleDateString() : '';

      row.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'
          + (isUnread ? '<div style="width:8px;height:8px;border-radius:50%;background:#1db954;flex-shrink:0;"></div>' : '')
          + '<div class="er-from" style="flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
            + (isUnread ? 'font-weight:600;' : '') + '">' + escapeHtml(otherParty) + '</div>'
          + '<div class="er-date" style="font-size:11px;white-space:nowrap;">' + dateStr + '</div>'
          + (em.is_starred ? '<div style="color:#ffd400;">⭐</div>' : '')
        + '</div>'
        + '<div class="er-sub" style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:3px;">'
          + escapeHtml(em.subject || '(no subject)')
        + '</div>'
        + '<div class="er-preview" style="font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
          + escapeHtml((em.body || '').slice(0, 90))
        + '</div>';

      row.onclick = function () { openMessage(em); };
      listEl.appendChild(row);
    });
  }

  // ============================================================
  //  EXTENSIONS TAB
  // ============================================================
  function showExtensions() {
    var listEl = root.querySelector('#em-list');
    var titleEl = root.querySelector('#em-title');
    var emptyBtn = root.querySelector('#em-empty-trash');
    if (!listEl) return;

    titleEl.textContent = '🧩 Email Extensions';
    emptyBtn.style.display = 'none';

    var currentId = currentThemeId();

    listEl.innerHTML = '';
    listEl.style.padding = '16px';

    var header = document.createElement('div');
    header.style.cssText = 'color:#888;font-size:12px;margin-bottom:16px;line-height:1.5;';
    header.innerHTML = 'Change the look of your entire mailbox.<br>'
      + '<b>' + THEMES.length + '</b> themes available. Click any to apply.';
    listEl.appendChild(header);

    var grid = document.createElement('div');
    grid.style.cssText =
      'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;';

    THEMES.forEach(function (t) {
      var isActive = t.id === currentId;
      var card = document.createElement('div');
      card.className = 'em-ext-card' + (isActive ? ' active' : '');
      card.style.cssText =
        'border:2px solid rgba(255,255,255,0.08);border-radius:10px;overflow:hidden;' +
        'cursor:pointer;background:rgba(255,255,255,0.02);transition:transform 0.15s,border-color 0.15s;';
      card.onmouseenter = function () { card.style.transform = 'scale(1.02)'; };
      card.onmouseleave = function () { card.style.transform = ''; };

      // Preview swatch
      var preview = document.createElement('div');
      preview.style.cssText =
        'width:100%;height:90px;background:' + t.bg + ';' +
        'display:flex;flex-direction:column;padding:6px;gap:3px;';
      var bar1 = document.createElement('div');
      bar1.style.cssText =
        'background:' + t.panel + ';border:1px solid ' + t.border + ';' +
        'border-radius:3px;height:14px;width:60%;';
      preview.appendChild(bar1);
      var bar2 = document.createElement('div');
      bar2.style.cssText =
        'background:' + t.accent + '33;border:1px solid ' + t.accent + '55;' +
        'border-radius:3px;height:18px;width:100%;';
      preview.appendChild(bar2);
      var bar3 = document.createElement('div');
      bar3.style.cssText =
        'background:' + t.accent + '33;border:1px solid ' + t.accent + '55;' +
        'border-radius:3px;height:18px;width:80%;';
      preview.appendChild(bar3);
      card.appendChild(preview);

      // Name
      var nameEl = document.createElement('div');
      nameEl.className = 'em-ext-name';
      nameEl.style.cssText =
        'padding:8px 10px;font-size:12px;font-weight:600;' +
        'background:' + t.panel + ';color:' + t.text + ';' +
        'display:flex;align-items:center;gap:6px;';
      nameEl.innerHTML = '<span style="font-size:14px;">' + t.icon + '</span>'
        + '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
        + t.name + (isActive ? ' ✓' : '') + '</span>';
      card.appendChild(nameEl);

      card.onclick = function () {
        applyTheme(t.id);
        showExtensions();
      };

      grid.appendChild(card);
    });

    listEl.appendChild(grid);

    var resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = 'Reset to Classic';
    resetBtn.style.cssText =
      'margin-top:20px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);' +
      'color:#fff;padding:8px 18px;border-radius:6px;cursor:pointer;font-size:12px;';
    resetBtn.onclick = function () {
      applyTheme('classic');
      showExtensions();
    };
    listEl.appendChild(resetBtn);

    statusEl.textContent = 'Theme: ' + (currentId === 'classic' ? 'Classic' : currentId);
  }

  // ============================================================
  //  READ MESSAGE
  // ============================================================
  function openMessage(em) {
    if (!em.is_read) {
      supabase.from('mail_messages').update({ is_read: true }).eq('id', em.id)
        .then(function () { em.is_read = true; loadFolder(); });
    }

    var rwin = makeWindow('email-read-' + em.id, em.subject || 'Message', '📧',
      '<div id="er-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
        + '<div style="padding:14px 18px;border-bottom:1px solid #2a2a2a;">'
          + '<div style="color:#fff;font-size:17px;font-weight:600;margin-bottom:10px;">'
            + escapeHtml(em.subject || '(no subject)') + '</div>'
          + '<div style="color:#aaa;font-size:12px;line-height:1.6;">'
            + '<div>From: <b style="color:#fff;">' + escapeHtml(em.from_address) + '</b></div>'
            + '<div>To: <b style="color:#fff;">' + escapeHtml(em.to_address) + '</b></div>'
            + '<div style="color:#666;margin-top:4px;">'
              + (em.created_at ? new Date(em.created_at).toLocaleString() : '')
            + '</div>'
          + '</div>'
        + '</div>'
        + '<div id="er-body" style="flex:1;overflow-y:auto;padding:18px;white-space:pre-wrap;line-height:1.7;'
          + 'color:#e0e0e0;font-size:13px;"></div>'
        + '<div style="padding:12px 18px;border-top:1px solid #2a2a2a;display:flex;gap:8px;flex-wrap:wrap;">'
          + (currentFolder === 'inbox'
            ? '<button type="button" id="er-reply" style="background:#1db954;border:none;color:#fff;'
              + 'padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">↩ Reply</button>'
            : '')
          + '<button type="button" id="er-star" style="background:rgba(255,255,255,0.06);'
            + 'border:1px solid rgba(255,255,255,0.12);color:#fff;padding:8px 16px;'
            + 'border-radius:6px;cursor:pointer;font-size:12px;">'
            + (em.is_starred ? '⭐ Unstar' : '☆ Star') + '</button>'
          + (currentFolder === 'trash'
            ? '<button type="button" id="er-restore" style="background:rgba(29,185,84,0.12);'
              + 'border:1px solid rgba(29,185,84,0.3);color:#1db954;padding:8px 16px;'
              + 'border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">↩ Restore</button>'
              + '<button type="button" id="er-delforever" style="background:rgba(255,80,80,0.12);'
              + 'border:1px solid rgba(255,80,80,0.3);color:#ff8a8a;padding:8px 16px;'
              + 'border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">Delete Forever</button>'
            : '<button type="button" id="er-del" style="background:rgba(255,80,80,0.12);'
              + 'border:1px solid rgba(255,80,80,0.3);color:#ff8a8a;padding:8px 16px;'
              + 'border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">🗑️ Delete</button>')
        + '</div>'
      + '</div>', 660, 540);

    var rc = rwin.querySelector('#er-app');
    rc.children[1].textContent = em.body || '(empty message)';

    var replyBtn = rc.querySelector('#er-reply');
    if (replyBtn) replyBtn.onclick = function () {
      rwin.remove();
      openCompose({ to: em.from_address, subject: 'Re: ' + (em.subject || '') });
    };

    rc.querySelector('#er-star').onclick = function () {
      var newVal = !em.is_starred;
      supabase.from('mail_messages').update({ is_starred: newVal }).eq('id', em.id)
        .then(function () { rwin.remove(); loadFolder(); });
    };

    var delBtn = rc.querySelector('#er-del');
    if (delBtn) delBtn.onclick = function () {
      supabase.from('mail_messages').update({ folder: 'trash' }).eq('id', em.id)
        .then(function () { rwin.remove(); loadFolder(); });
    };

    var restoreBtn = rc.querySelector('#er-restore');
    if (restoreBtn) restoreBtn.onclick = function () {
      var back = (em.from_address === myAddress) ? 'sent' : 'inbox';
      supabase.from('mail_messages').update({ folder: back }).eq('id', em.id)
        .then(function () { rwin.remove(); loadFolder(); });
    };

    var delForeverBtn = rc.querySelector('#er-delforever');
    if (delForeverBtn) delForeverBtn.onclick = function () {
      if (!confirm('Permanently delete this message?')) return;
      supabase.from('mail_messages').delete().eq('id', em.id)
        .then(function () { rwin.remove(); loadFolder(); });
    };
  }

  // ============================================================
  //  COMPOSE
  // ============================================================
  function openCompose(prefill) {
    prefill = prefill || {};

    var cwin = makeWindow('email-compose', 'New Message', '✏️',
      '<div id="ec-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
        + '<div style="padding:12px 14px;border-bottom:1px solid #2a2a2a;display:flex;flex-direction:column;gap:8px;">'
          + '<div style="position:relative;">'
            + '<input id="ec-to" type="text" placeholder="recipient@opencore.io" autocomplete="off" '
              + 'style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);'
              + 'color:#fff;padding:10px 12px;border-radius:6px;outline:none;font-size:13px;'
              + 'box-sizing:border-box;"/>'
            + '<div id="ec-suggest" style="display:none;position:absolute;top:100%;left:0;right:0;'
              + 'background:#1a1c22;border:1px solid rgba(255,255,255,0.12);border-radius:6px;'
              + 'margin-top:4px;max-height:180px;overflow-y:auto;z-index:10;box-shadow:0 8px 24px rgba(0,0,0,0.5);"></div>'
          + '</div>'
          + '<input id="ec-subject" type="text" placeholder="Subject" maxlength="200" '
            + 'style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);'
            + 'color:#fff;padding:10px 12px;border-radius:6px;outline:none;font-size:13px;"/>'
        + '</div>'
        + '<textarea id="ec-body" placeholder="Write your message..." '
          + 'style="flex:1;background:rgba(0,0,0,0.2);border:none;color:#fff;padding:16px;'
          + 'outline:none;font-family:inherit;font-size:13px;resize:none;line-height:1.6;"></textarea>'
        + '<div style="padding:10px 14px;border-top:1px solid #2a2a2a;'
          + 'display:flex;gap:8px;align-items:center;">'
          + '<button type="button" id="ec-send" style="background:#1db954;border:none;color:#fff;'
            + 'padding:10px 24px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">Send</button>'
          + '<button type="button" id="ec-cancel" style="background:rgba(255,255,255,0.06);'
            + 'border:1px solid rgba(255,255,255,0.12);color:#fff;padding:10px 24px;'
            + 'border-radius:6px;cursor:pointer;font-size:13px;">Cancel</button>'
          + '<div id="ec-msg" style="flex:1;text-align:right;color:#888;font-size:11px;"></div>'
        + '</div>'
      + '</div>', 660, 560);

    var cc = cwin.querySelector('#ec-app');
    var toEl = cc.querySelector('#ec-to');
    var subEl = cc.querySelector('#ec-subject');
    var bodyEl = cc.querySelector('#ec-body');
    var suggEl = cc.querySelector('#ec-suggest');
    var msgEl = cc.querySelector('#ec-msg');

    if (prefill.to) toEl.value = prefill.to;
    if (prefill.subject) subEl.value = prefill.subject;

    var allAddresses = null;
    function loadAddresses() {
      if (allAddresses) return Promise.resolve(allAddresses);
      return supabase.from('mail_accounts').select('address').then(function (res) {
        allAddresses = (res.data || []).map(function (a) { return a.address; });
        return allAddresses;
      });
    }

    function suggest() {
      var val = toEl.value.trim().toLowerCase();
      if (!val || (val.indexOf('@') !== -1 && val.length > val.indexOf('@') + 1)) {
        suggEl.style.display = 'none';
        return;
      }
      loadAddresses().then(function (list) {
        var matches = list.filter(function (a) {
          return a !== myAddress && a.indexOf(val) === 0;
        }).slice(0, 6);
        if (!matches.length) { suggEl.style.display = 'none'; return; }
        suggEl.innerHTML = '';
        matches.forEach(function (addr) {
          var item = document.createElement('div');
          item.textContent = addr;
          item.style.cssText = 'padding:8px 12px;cursor:pointer;color:#fff;font-size:12px;';
          item.onmouseenter = function () { item.style.background = 'rgba(255,255,255,0.06)'; };
          item.onmouseleave = function () { item.style.background = ''; };
          item.onclick = function () {
            toEl.value = addr;
            suggEl.style.display = 'none';
            subEl.focus();
          };
          suggEl.appendChild(item);
        });
        suggEl.style.display = 'block';
      });
    }

    toEl.addEventListener('input', suggest);
    toEl.addEventListener('focus', suggest);
    document.addEventListener('click', function (e) {
      if (!cc.contains(e.target)) suggEl.style.display = 'none';
    });

    cc.querySelector('#ec-send').onclick = function () {
      var to = toEl.value.trim().toLowerCase();
      var subject = subEl.value.trim();
      var body = bodyEl.value;

      if (!to) { msgEl.textContent = 'Enter a recipient.'; msgEl.style.color = '#ff8a8a'; return; }
      if (to.indexOf('@opencore.io') === -1) {
        msgEl.textContent = 'Recipient must be an @opencore.io address.';
        msgEl.style.color = '#ff8a8a';
        return;
      }
      if (!body.trim()) {
        msgEl.textContent = 'Message is empty.';
        msgEl.style.color = '#ff8a8a';
        return;
      }

      var sendBtn = cc.querySelector('#ec-send');
      sendBtn.textContent = 'Sending…';
      sendBtn.disabled = true;
      msgEl.textContent = '';

      supabase.rpc('send_mail', {
        recipient_address: to,
        mail_subject: subject || '(no subject)',
        mail_body: body
      }).then(function (res) {
        if (res.error) {
          msgEl.textContent = '✗ ' + res.error.message;
          msgEl.style.color = '#ff8a8a';
          sendBtn.textContent = 'Send';
          sendBtn.disabled = false;
          return;
        }
        msgEl.textContent = '✓ Sent';
        msgEl.style.color = '#1db954';
        setTimeout(function () { cwin.remove(); loadFolder(); }, 600);
      });
    };

    cc.querySelector('#ec-cancel').onclick = function () { cwin.remove(); };
    setTimeout(function () { toEl.focus(); }, 100);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Init ----------
  loadMyAddress().then(function (addr) {
    if (addr) {
      myAddress = addr;
      statusEl.textContent = 'You are ' + myAddress;
      showInbox();
    } else {
      statusEl.textContent = 'Set up your @opencore.io address';
      showSetup();
    }
  });

  // Clean up theme CSS when window closes
  win.addEventListener('remove', function () {
    var styleEl = document.getElementById(THEME_STYLE_ID);
    if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
  });

  return win;
}

window.openEmail = openEmail;

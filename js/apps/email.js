// ============================================================
//  email.js — OpencoreOS Mail
//  Internal messaging between @opencore.io users
// ============================================================

function openEmail(){
  var supabase = window.supabaseClient;
  if (!supabase) { alert('Supabase not loaded.'); return; }
  var user = window.currentUser;
  if (!user) { alert('Not signed in.'); return; }

  var win = makeWindow('email', 'Email', '📧',
    '<div id="em-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
      + '<div id="em-root" style="display:flex;flex:1;overflow:hidden;"></div>'
      + '<div id="em-status" style="padding:6px 14px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;">Loading…</div>'
    + '</div>', 860, 620);

  var c = win.querySelector('#em-app');
  var root = c.querySelector('#em-root');
  var statusEl = c.querySelector('#em-status');

  var myAddress = null;
  var currentFolder = 'inbox';

  // ---------- Get my address ----------
  function loadMyAddress() {
    return supabase.from('mail_accounts').select('address').eq('user_id', user.id).single()
      .then(function (res) {
        if (res.error) return null;
        return res.data ? res.data.address : null;
      });
  }

  // ============================================================
  //  SETUP SCREEN — pick username
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
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
    });
    input.focus();
  }

  // ============================================================
  //  INBOX
  // ============================================================
  function showInbox() {
    root.innerHTML =
      // Sidebar
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
    root.querySelector('#em-refresh').onclick = loadFolder;

    var sideFolders = root.querySelectorAll('.em-folder');
    sideFolders.forEach(function (f) {
      f.onclick = function () {
        currentFolder = f.getAttribute('data-folder');
        sideFolders.forEach(function (x) {
          x.style.background = '';
          x.style.color = '#aaa';
          x.style.fontWeight = '400';
        });
        f.style.background = 'rgba(29,185,84,0.15)';
        f.style.color = '#1db954';
        f.style.fontWeight = '600';
        loadFolder();
      };
    });
    // Highlight inbox by default
    sideFolders[0].style.background = 'rgba(29,185,84,0.15)';
    sideFolders[0].style.color = '#1db954';
    sideFolders[0].style.fontWeight = '600';

    root.querySelector('#em-empty-trash').onclick = function () {
      if (!confirm('Permanently delete every message in Trash?')) return;
      supabase.from('mail_messages').delete().eq('owner_id', user.id).eq('folder', 'trash')
        .then(function () { loadFolder(); });
    };

    loadFolder();
  }

  function folderBtn(id, label) {
    return '<div class="em-folder" data-folder="' + id + '" '
      + 'style="padding:9px 12px;border-radius:6px;cursor:pointer;color:#aaa;font-size:13px;">'
      + label + '</div>';
  }

  // ---------- Load current folder ----------
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
      var rows = res.data || [];
      renderList(rows);
      statusEl.textContent = rows.length + ' message' + (rows.length === 1 ? '' : 's') +
        ' — ' + myAddress;
    });
  }

  function renderList(rows) {
    var listEl = root.querySelector('#em-list');
    listEl.innerHTML = '';
    if (!rows.length) {
      listEl.innerHTML = '<div style="color:#666;text-align:center;padding:60px 20px;">'
        + 'No messages here yet.</div>';
      return;
    }

    rows.forEach(function (em) {
      var row = document.createElement('div');
      var isUnread = !em.is_read && currentFolder === 'inbox';
      row.style.cssText =
        'padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;' +
        (isUnread ? 'background:rgba(29,185,84,0.05);' : '');

      row.onmouseenter = function () { row.style.background = 'rgba(255,255,255,0.04)'; };
      row.onmouseleave = function () {
        row.style.background = isUnread ? 'rgba(29,185,84,0.05)' : '';
      };

      var otherParty = (currentFolder === 'sent') ? em.to_address : em.from_address;
      var dateStr = em.created_at ? new Date(em.created_at).toLocaleString() : '';

      row.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'
          + (isUnread ? '<div style="width:8px;height:8px;border-radius:50%;background:#1db954;flex-shrink:0;"></div>' : '')
          + '<div style="flex:1;color:' + (isUnread ? '#fff' : '#bbb') + ';'
            + 'font-weight:' + (isUnread ? '600' : '400') + ';font-size:13px;'
            + 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
            + escapeHtml(otherParty)
          + '</div>'
          + '<div style="color:#666;font-size:11px;white-space:nowrap;">' + dateStr + '</div>'
          + (em.is_starred ? '<div style="color:#ffd400;">⭐</div>' : '')
        + '</div>'
        + '<div style="color:' + (isUnread ? '#ddd' : '#888') + ';font-size:13px;'
          + 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:3px;">'
          + escapeHtml(em.subject || '(no subject)')
        + '</div>'
        + '<div style="color:#666;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'
          + escapeHtml((em.body || '').slice(0, 90))
        + '</div>';

      row.onclick = function () { openMessage(em); };
      listEl.appendChild(row);
    });
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
        + '<div style="flex:1;overflow-y:auto;padding:18px;white-space:pre-wrap;line-height:1.7;'
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

    // ---------- Autocomplete ----------
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
      if (!val || val.indexOf('@') !== -1 && val.length > val.indexOf('@') + 1) {
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

    // ---------- Send ----------
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

  // ---------- Helpers ----------
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

  return win;
}

window.openEmail = openEmail;

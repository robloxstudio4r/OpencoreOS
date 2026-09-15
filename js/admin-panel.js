// ============================================================
//  admin-panel.js — Full admin panel via Supabase
//  Open with: adminPanel() in the DevTools Console
// ============================================================

function adminPanel() {
  if (!window.supabaseClient) { alert('Supabase not loaded.'); return; }
  var user = window.OpencoreAuth && window.OpencoreAuth.getCurrentUser
    ? window.OpencoreAuth.getCurrentUser() : null;
  if (!user) { alert('Not signed in.'); return; }

  supabase.from('profiles').select('role').eq('id', user.id).single()
    .then(function (res) {
      if (res.error) { alert('Error: ' + res.error.message); return; }
      if (!res.data || res.data.role !== 'admin') {
        alert('Your role is "' + (res.data ? res.data.role : 'unknown') + '", not admin.');
        return;
      }
      openPanel();
    });
}

function openPanel() {
  var win = makeWindow('adminpanel', 'Admin Panel', '🛡️',
    '<div id="ap-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
      + '<div style="padding:10px 14px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:8px;">'
        + '<input id="ap-search" type="text" placeholder="Search users…" style="flex:1;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);color:#fff;padding:7px 12px;border-radius:8px;outline:none;font-size:12px;"/>'
        + '<button type="button" id="ap-refresh" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;">Refresh</button>'
        + '<button type="button" id="ap-export" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;">Export</button>'
      + '</div>'
      + '<div id="ap-list" style="flex:1;overflow-y:auto;padding:12px;"></div>'
      + '<div id="ap-status" style="padding:6px 14px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;"></div>'
    + '</div>', 820, 640);

  var c = win.querySelector('#ap-app');
  var listEl = c.querySelector('#ap-list');
  var statusEl = c.querySelector('#ap-status');
  var searchEl = c.querySelector('#ap-search');
  var allUsers = [];
  var query = '';

  searchEl.addEventListener('input', function () {
    query = searchEl.value.trim().toLowerCase();
    render();
  });

  function load() {
    listEl.innerHTML = '<div style="color:#888;padding:20px;text-align:center;">Loading…</div>';
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) { listEl.innerHTML = '<div style="color:#f66;padding:20px;">Error: ' + res.error.message + '</div>'; return; }
        allUsers = res.data || [];
        render();
      });
  }

  function render() {
    var filtered = allUsers.filter(function (u) {
      if (!query) return true;
      return (u.email || '').toLowerCase().indexOf(query) !== -1;
    });

    listEl.innerHTML = '';
    statusEl.textContent = filtered.length + ' of ' + allUsers.length + ' user(s)';

    if (!filtered.length) {
      listEl.innerHTML = '<div style="color:#666;padding:20px;text-align:center;">No users match.</div>';
      return;
    }

    filtered.forEach(function (u) {
      var row = document.createElement('div');
      row.style.cssText =
        'padding:12px;border:1px solid rgba(255,255,255,0.06);border-radius:10px;' +
        'background:rgba(255,255,255,0.02);margin-bottom:8px;';

      // Header line
      var header = document.createElement('div');
      header.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
      header.innerHTML =
        '<div style="flex:1;min-width:0;color:#fff;font-weight:600;font-size:14px;">' +
          (u.email || 'no email') +
          (u.role === 'admin' ? ' <span style="color:#1db954;font-size:10px;">· admin</span>' : '') +
          (u.restricted ? ' <span style="color:#ff8a8a;font-size:10px;">· restricted</span>' : '') +
        '</div>';
      row.appendChild(header);

      // Details grid
      var details = document.createElement('div');
      details.style.cssText = 'font-size:11px;color:#888;line-height:1.7;margin-bottom:10px;';
      var lastSeen = u.last_seen ? new Date(u.last_seen).toLocaleString() : 'never';
      var created = u.created_at ? new Date(u.created_at).toLocaleString() : 'unknown';
      details.innerHTML =
        '<div>User ID: <span style="color:#8ab4f8;font-family:Menlo,monospace;">' + (u.id || '') + '</span></div>'
        + '<div>Created: ' + created + '</div>'
        + '<div>Last seen: ' + lastSeen + ' · Logins: ' + (u.login_count || 0) + '</div>'
        + (u.warning_message ? '<div style="color:#ffd400;">⚠️ Warning: ' + escapeHtml(u.warning_message) + '</div>' : '')
        + (u.restriction_reason ? '<div style="color:#ff8a8a;">🚫 Reason: ' + escapeHtml(u.restriction_reason) + '</div>' : '');
      row.appendChild(details);

      // Button row
      var buttons = document.createElement('div');
      buttons.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;';

      function btn(label, color, onClick) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.style.cssText =
          'background:' + color.bg + ';border:1px solid ' + color.border + ';' +
          'color:' + color.text + ';padding:5px 10px;border-radius:6px;' +
          'cursor:pointer;font-size:11px;font-weight:600;';
        b.onclick = onClick;
        buttons.appendChild(b);
      }

      // Restrict / Unrestrict
      if (u.restricted) {
        btn('✅ Unrestrict', { bg: '#1db954', border: '#1db954', text: '#fff' }, function () {
          supabase.from('profiles').update({ restricted: false, restriction_reason: null })
            .eq('id', u.id).then(function (r) { if (r.error) alert(r.error.message); else load(); });
        });
      } else {
        btn('🚫 Restrict', { bg: 'rgba(255,80,80,0.15)', border: 'rgba(255,80,80,0.35)', text: '#ff8a8a' }, function () {
          var reason = prompt('Reason for restricting ' + u.email + ':', 'Violated community rules') || '';
          supabase.from('profiles').update({ restricted: true, restriction_reason: reason })
            .eq('id', u.id).then(function (r) { if (r.error) alert(r.error.message); else load(); });
        });
      }

      // Warn
      btn('⚠️ Warn', { bg: 'rgba(255,212,0,0.12)', border: 'rgba(255,212,0,0.35)', text: '#ffd400' }, function () {
        var msg = prompt('Warning for ' + u.email + ':');
        if (!msg) return;
        supabase.from('profiles').update({ warning_message: msg, warning_acknowledged: false })
          .eq('id', u.id).then(function (r) { if (r.error) alert(r.error.message); else load(); });
      });

      // Clear warning
      if (u.warning_message) {
        btn('Clear warning', { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: '#aaa' }, function () {
          supabase.from('profiles').update({ warning_message: null, warning_acknowledged: false })
            .eq('id', u.id).then(function (r) { if (r.error) alert(r.error.message); else load(); });
        });
      }

      // Promote / Demote
      if (u.role === 'admin') {
        btn('⬇ Demote', { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: '#ffd400' }, function () {
          if (!confirm('Remove admin from ' + u.email + '?')) return;
          supabase.from('profiles').update({ role: 'user' })
            .eq('id', u.id).then(function (r) { if (r.error) alert(r.error.message); else load(); });
        });
      } else {
        btn('⬆ Make admin', { bg: 'rgba(29,185,84,0.15)', border: 'rgba(29,185,84,0.35)', text: '#1db954' }, function () {
          if (!confirm('Make ' + u.email + ' an admin?')) return;
          supabase.from('profiles').update({ role: 'admin' })
            .eq('id', u.id).then(function (r) { if (r.error) alert(r.error.message); else load(); });
        });
      }

      // Force password reset (sends a recovery email)
      btn('🔑 Reset password', { bg: 'rgba(90,169,255,0.15)', border: 'rgba(90,169,255,0.35)', text: '#5aa9ff' }, function () {
        if (!confirm('Send a password reset email to ' + u.email + '?')) return;
        supabase.auth.resetPasswordForEmail(u.email).then(function (r) {
          if (r.error) alert(r.error.message);
          else alert('Password reset email sent to ' + u.email);
        });
      });

      // View VFS files
      btn('📁 Files', { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: '#fff' }, function () {
        viewUserFiles(u);
      });

      // Delete user
      if (u.email !== (window.currentUser && window.currentUser.email)) {
        btn('🗑 Delete', { bg: 'rgba(255,80,80,0.15)', border: 'rgba(255,80,80,0.35)', text: '#ff8a8a' }, function () {
          if (!confirm('Delete ' + u.email + '?\n\nThis removes the account, all their files, everything. Cannot be undone.')) return;
          supabase.rpc('admin_delete_user', { target_id: u.id }).then(function (r) {
            if (r.error) alert(r.error.message);
            else { alert('User deleted'); load(); }
          });
        });
      }

      row.appendChild(buttons);
      listEl.appendChild(row);
    });
  }

  function viewUserFiles(u) {
    var fwin = makeWindow('apfiles-' + u.id.slice(0,8), 'Files — ' + u.email, '📁',
      '<div id="apf-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:12px;">'
        + '<div style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#888;">Loading files…</div>'
        + '<div id="apf-list" style="flex:1;overflow-y:auto;padding:12px;"></div>'
        + '<div id="apf-status" style="padding:6px 12px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;"></div>'
      + '</div>', 600, 480);

    var fc = fwin.querySelector('#apf-app');
    var flist = fc.querySelector('#apf-list');
    var fstatus = fc.querySelector('#apf-status');

    supabase.from('vfs_files').select('*').eq('user_id', u.id).order('path')
      .then(function (res) {
        if (res.error) { flist.innerHTML = '<div style="color:#f66;">Error: ' + res.error.message + '</div>'; return; }
        var files = res.data || [];
        flist.innerHTML = '';
        var totalSize = 0;
        files.forEach(function (f) {
          totalSize += (f.content || '').length;
          var row = document.createElement('div');
          row.style.cssText =
            'display:flex;align-items:center;gap:8px;padding:6px 10px;' +
            'background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);' +
            'border-radius:6px;margin-bottom:4px;';
          row.innerHTML =
            '<span>' + (f.is_folder ? '📁' : '📄') + '</span>' +
            '<span style="flex:1;color:#fff;font-family:Menlo,monospace;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(f.path) + '</span>' +
            '<span style="color:#888;font-size:10px;">' + (f.is_folder ? '' : ((f.content || '').length + ' B')) + '</span>';
          flist.appendChild(row);
        });
        fstatus.textContent = files.length + ' items · ' + totalSize + ' bytes total';
      });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  c.querySelector('#ap-refresh').onclick = load;
  c.querySelector('#ap-export').onclick = function () {
    var data = JSON.stringify(allUsers.map(function (u) {
      return {
        id: u.id, email: u.email, role: u.role,
        restricted: u.restricted, restriction_reason: u.restriction_reason,
        warning_message: u.warning_message,
        created_at: u.created_at, last_seen: u.last_seen, login_count: u.login_count
      };
    }), null, 2);
    var a = document.createElement('a');
    a.href = 'data:application/json,' + encodeURIComponent(data);
    a.download = 'opencore-users-' + Date.now() + '.json';
    a.click();
  };

  load();
}

window.adminPanel = adminPanel;

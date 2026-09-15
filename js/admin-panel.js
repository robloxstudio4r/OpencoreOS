// ============================================================
//  admin-panel.js — Admin panel via Supabase
//  Open with: adminPanel() in the DevTools Console
// ============================================================

function adminPanel() {
  if (!window.supabaseClient) { alert('Supabase not loaded.'); return; }

  var user = window.OpencoreAuth && window.OpencoreAuth.getCurrentUser
    ? window.OpencoreAuth.getCurrentUser() : null;
  if (!user) { alert('Not signed in.'); return; }

  console.log('Checking admin status for', user.email);

  supabase.from('profiles').select('role, restricted').eq('id', user.id).single()
    .then(function (res) {
      if (res.error) {
        alert('Error reading profile:\n\n' + res.error.message + '\n\nCode: ' + (res.error.code || 'none'));
        return;
      }
      if (!res.data) { alert('No profile row found.'); return; }
      if (res.data.role !== 'admin') {
        alert('Your role is "' + res.data.role + '", not admin.\n\nRun in Supabase SQL:\n\nupdate profiles set role = \'admin\' where email = \'' + user.email + '\';');
        return;
      }
      openPanel();
    })
    .catch(function (e) { alert('Admin check failed: ' + e.message); });
}

function openPanel() {
  var win = makeWindow('adminpanel', 'Admin Panel', '🛡️',
    '<div id="ap-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
      + '<div style="padding:10px 14px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:10px;">'
        + '<div style="flex:1;color:#fff;font-weight:600;">Users</div>'
        + '<button type="button" id="ap-refresh" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;">Refresh</button>'
      + '</div>'
      + '<div id="ap-list" style="flex:1;overflow-y:auto;padding:12px;"></div>'
      + '<div id="ap-status" style="padding:6px 14px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;"></div>'
    + '</div>', 720, 560);

  var c = win.querySelector('#ap-app');
  var listEl = c.querySelector('#ap-list');
  var statusEl = c.querySelector('#ap-status');

  function render() {
    listEl.innerHTML = '<div style="color:#888;padding:20px;text-align:center;">Loading…</div>';
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(function (res) {
        if (res.error) {
          listEl.innerHTML = '<div style="color:#f66;padding:20px;">Error: ' + res.error.message + '</div>';
          return;
        }
        var users = res.data || [];
        listEl.innerHTML = '';
        statusEl.textContent = users.length + ' user(s)';

        users.forEach(function (u) {
          var row = document.createElement('div');
          row.style.cssText =
            'display:flex;align-items:center;gap:10px;padding:10px 12px;' +
            'border:1px solid rgba(255,255,255,0.06);border-radius:8px;' +
            'background:rgba(255,255,255,0.02);margin-bottom:6px;';

          var info = document.createElement('div');
          info.style.cssText = 'flex:1;min-width:0;';
          info.innerHTML =
            '<div style="color:#fff;font-weight:600;">' + (u.email || 'no email') +
              (u.role === 'admin' ? ' <span style="color:#1db954;font-size:10px;">· admin</span>' : '') + '</div>'
            + '<div style="color:#888;font-size:11px;">'
              + (u.restricted ? '🚫 Restricted' : '✅ Active')
              + (u.warning_message ? ' · ⚠️ Has warning' : '')
            + '</div>';
          row.appendChild(info);

          var restrictBtn = document.createElement('button');
          restrictBtn.type = 'button';
          restrictBtn.textContent = u.restricted ? 'Unrestrict' : 'Restrict';
          restrictBtn.style.cssText =
            'background:' + (u.restricted ? '#1db954' : 'rgba(255,80,80,0.15)') + ';' +
            'border:1px solid ' + (u.restricted ? '#1db954' : 'rgba(255,80,80,0.35)') + ';' +
            'color:' + (u.restricted ? '#fff' : '#ff8a8a') + ';' +
            'padding:5px 12px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;';
          restrictBtn.onclick = function () {
            var reason = '';
            if (!u.restricted) reason = prompt('Reason for restricting ' + u.email + ':') || '';
            supabase.from('profiles').update({
              restricted: !u.restricted,
              restriction_reason: u.restricted ? null : reason
            }).eq('id', u.id).then(function (r) {
              if (r.error) { alert(r.error.message); return; }
              render();
            });
          };
          row.appendChild(restrictBtn);

          var warnBtn = document.createElement('button');
          warnBtn.type = 'button';
          warnBtn.textContent = 'Warn';
          warnBtn.style.cssText =
            'background:rgba(255,212,0,0.12);border:1px solid rgba(255,212,0,0.35);' +
            'color:#ffd400;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;';
          warnBtn.onclick = function () {
            var msg = prompt('Warning message for ' + u.email + ':');
            if (!msg) return;
            supabase.from('profiles').update({
              warning_message: msg,
              warning_acknowledged: false
            }).eq('id', u.id).then(function (r) {
              if (r.error) { alert(r.error.message); return; }
              render();
            });
          };
          row.appendChild(warnBtn);

          listEl.appendChild(row);
        });
      });
  }

  c.querySelector('#ap-refresh').onclick = render;
  render();
}

window.adminPanel = adminPanel;

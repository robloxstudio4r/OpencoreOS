// ============================================================
//  account-picker.js — Lock screen account chooser
//  Profile images + Change-password requires old device password
// ============================================================

(function () {
  'use strict';

  var showing = false;
  function el(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Global avatar storage (unprefixed, so picker can show it) ----------
  function getGlobalAvatar(id) {
    try { return localStorage.getItem('__oc_avatar_' + id) || ''; } catch (e) { return ''; }
  }
  function setGlobalAvatar(id, dataUrl) {
    try {
      if (dataUrl) localStorage.setItem('__oc_avatar_' + id, dataUrl);
      else localStorage.removeItem('__oc_avatar_' + id);
    } catch (e) { alert('Image too large to save.'); }
  }

  // ---------- Render tile ----------
  function renderList() {
    var listEl = el('acctList');
    if (!listEl) return;
    listEl.innerHTML = '';
    var accounts = window.Accounts ? window.Accounts.list() : [];

    for (var i = 0; i < accounts.length; i++) {
      (function (acc) {
        var avatar = getGlobalAvatar(acc.id);

        var tile = document.createElement('div');
        tile.style.cssText =
          'width:150px;padding:18px 10px 14px;background:rgba(255,255,255,0.05);' +
          'border:1px solid rgba(255,255,255,0.1);border-radius:14px;' +
          'cursor:pointer;text-align:center;transition:all 0.15s;position:relative;';
        tile.onmouseenter = function () {
          tile.style.background = 'rgba(29,185,84,0.15)';
          tile.style.borderColor = 'rgba(29,185,84,0.5)';
        };
        tile.onmouseleave = function () {
          tile.style.background = 'rgba(255,255,255,0.05)';
          tile.style.borderColor = 'rgba(255,255,255,0.1)';
        };

        var avatarBox = document.createElement('div');
        avatarBox.style.cssText =
          'width:72px;height:72px;border-radius:50%;margin:0 auto 12px;' +
          'overflow:hidden;background:rgba(0,0,0,0.35);' +
          'display:flex;align-items:center;justify-content:center;' +
          'font-size:44px;border:2px solid rgba(255,255,255,0.1);';
        if (avatar) {
          avatarBox.innerHTML = '<img src="' + avatar + '" style="width:100%;height:100%;object-fit:cover;"/>';
        } else {
          avatarBox.textContent = '👤';
        }
        tile.appendChild(avatarBox);

        var nameEl = document.createElement('div');
        nameEl.style.cssText =
          'font-size:14px;font-weight:600;color:#fff;white-space:nowrap;' +
          'overflow:hidden;text-overflow:ellipsis;';
        nameEl.textContent = acc.name;
        tile.appendChild(nameEl);

        var pwdEl = document.createElement('div');
        pwdEl.style.cssText = 'font-size:11px;color:#888;margin-top:4px;';
        pwdEl.textContent = acc.hasPassword ? '🔒 Password' : 'No password';
        tile.appendChild(pwdEl);

        var pencil = document.createElement('button');
        pencil.type = 'button';
        pencil.textContent = '✏️';
        pencil.title = 'Edit account';
        pencil.style.cssText =
          'position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.5);' +
          'border:1px solid rgba(255,255,255,0.12);color:#fff;' +
          'width:26px;height:26px;border-radius:50%;cursor:pointer;' +
          'font-size:12px;display:flex;align-items:center;justify-content:center;padding:0;';
        pencil.onmouseenter = function () { pencil.style.background = 'rgba(29,185,84,0.6)'; };
        pencil.onmouseleave = function () { pencil.style.background = 'rgba(0,0,0,0.5)'; };
        pencil.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          openAccountEditor(acc);
        };
        tile.appendChild(pencil);

        tile.onclick = function () { selectAccount(acc); };
        listEl.appendChild(tile);
      })(accounts[i]);
    }

    // Add-account tile
    if (window.Accounts && window.Accounts.canCreate()) {
      var add = document.createElement('div');
      add.style.cssText =
        'width:150px;padding:18px 10px 14px;background:rgba(255,255,255,0.02);' +
        'border:2px dashed rgba(255,255,255,0.15);border-radius:14px;' +
        'cursor:pointer;text-align:center;transition:all 0.15s;';
      add.onmouseenter = function () {
        add.style.borderColor = 'rgba(29,185,84,0.6)';
        add.style.background = 'rgba(29,185,84,0.08)';
      };
      add.onmouseleave = function () {
        add.style.borderColor = 'rgba(255,255,255,0.15)';
        add.style.background = 'rgba(255,255,255,0.02)';
      };
      add.innerHTML =
        '<div style="width:72px;height:72px;border-radius:50%;margin:0 auto 12px;' +
        'display:flex;align-items:center;justify-content:center;font-size:44px;color:#666;">＋</div>' +
        '<div style="font-size:13px;color:#aaa;">Add account</div>' +
        '<div style="font-size:11px;color:#666;margin-top:4px;">' +
        window.Accounts.count() + '/' + window.Accounts.MAX + '</div>';
      add.onclick = promptNewAccount;
      listEl.appendChild(add);
    }
  }

  // ============================================================
  //  Account editor
  //  Changing/removing password requires the OLD password first.
  // ============================================================
  function openAccountEditor(acc) {
    var overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:2147483645;' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-family:system-ui,-apple-system,sans-serif;';
    var box = document.createElement('div');
    box.style.cssText =
      'background:#1a1c22;color:#fff;padding:22px;border-radius:14px;min-width:360px;' +
      'max-width:420px;border:1px solid rgba(255,255,255,0.1);' +
      'box-shadow:0 20px 60px rgba(0,0,0,0.6);';

    var avatar = getGlobalAvatar(acc.id);

    box.innerHTML =
      '<div style="font-size:16px;font-weight:600;margin-bottom:16px;">Edit Account</div>'

      + '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:16px;">'
      + '<div id="aedit-avatar" style="width:96px;height:96px;border-radius:50%;'
        + 'overflow:hidden;background:rgba(0,0,0,0.4);display:flex;align-items:center;'
        + 'justify-content:center;font-size:56px;border:2px solid rgba(255,255,255,0.15);">'
        + (avatar ? '<img src="' + avatar + '" style="width:100%;height:100%;object-fit:cover;"/>' : '👤')
      + '</div>'
      + '<div style="display:flex;gap:6px;">'
      +   '<button type="button" id="aedit-upload" style="background:#1e4d6b;border:none;color:#fff;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">Upload Image</button>'
      +   '<button type="button" id="aedit-clear" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;">Clear</button>'
      + '</div>'
      + '</div>'

      + '<label style="display:block;color:#aaa;font-size:11px;margin-bottom:6px;">Name</label>'
      + '<input id="aedit-name" type="text" value="' + escapeHtml(acc.name) + '" maxlength="20" '
      +   'style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);'
      +   'color:#fff;padding:9px 12px;border-radius:8px;outline:none;font-size:13px;'
      +   'box-sizing:border-box;margin-bottom:14px;"/>'

      + '<div style="color:#aaa;font-size:11px;margin-bottom:6px;">Password</div>'
      + '<div style="display:flex;gap:6px;margin-bottom:20px;">'
      +   '<button type="button" id="aedit-pw" style="flex:1;background:#1e4d6b;border:none;color:#fff;padding:9px;border-radius:8px;cursor:pointer;font-size:12px;">'
      +     (acc.hasPassword ? 'Change password' : 'Set password')
      +   '</button>'
      +   (acc.hasPassword ? '<button type="button" id="aedit-pw-rm" style="background:#4a2028;border:none;color:#ff8a8a;padding:9px 14px;border-radius:8px;cursor:pointer;font-size:12px;">Remove</button>' : '')
      + '</div>'

      + '<div style="display:flex;gap:8px;">'
      +   '<button type="button" id="aedit-save" style="flex:1;background:#1db954;border:none;color:#fff;padding:10px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;">Save</button>'
      +   '<button type="button" id="aedit-cancel" style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:10px;border-radius:8px;cursor:pointer;font-size:13px;">Cancel</button>'
      + '</div>';

    overlay.appendChild(box);
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);

    var avatarEl = box.querySelector('#aedit-avatar');

    // ============================================================
    //  Verify old device password before allowing password changes
    // ============================================================
    function requireOldPassword(actionLabel) {
      // If the account has no password, no verification needed
      if (!acc.hasPassword) return true;

      var entered = prompt('🔒 ' + actionLabel + '\n\nEnter the current password for "' + acc.name + '":');
      if (entered === null) return false;

      var ok = false;
      try {
        ok = window.Accounts.verifyPassword(acc.id, entered);
      } catch (e) { ok = false; }

      if (!ok) {
        alert('❌ Incorrect password. Change cancelled.');
        return false;
      }
      return true;
    }

    // ---- Upload image ----
    box.querySelector('#aedit-upload').onclick = function () {
      var inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.onchange = function () {
        var f = inp.files && inp.files[0];
        if (!f) return;
        if (f.size > 500 * 1024) return alert('Image too large. Keep under 500 KB.');
        var reader = new FileReader();
        reader.onload = function () {
          avatar = reader.result;
          avatarEl.innerHTML = '<img src="' + avatar + '" style="width:100%;height:100%;object-fit:cover;"/>';
        };
        reader.readAsDataURL(f);
      };
      inp.click();
    };

    // ---- Clear avatar ----
    box.querySelector('#aedit-clear').onclick = function () {
      avatar = '';
      avatarEl.textContent = '👤';
    };

    // ---- Set / change password (requires old password if set) ----
    box.querySelector('#aedit-pw').onclick = function () {
      // Step 1 — verify old password if one exists
      if (acc.hasPassword) {
        if (!requireOldPassword('Change password')) return;
      }

      // Step 2 — ask for the new password
      var p = prompt(acc.hasPassword ? 'New password:' : 'Set password:');
      if (p === null) return;
      if (!p) return alert('Password cannot be empty.');

      var p2 = prompt('Confirm new password:');
      if (p === null) return;
      if (p !== p2) return alert('Passwords do not match.');

      window.Accounts.update(acc.id, { password: p });
      acc.hasPassword = true;

      box.querySelector('#aedit-pw').textContent = 'Change password';

      // Ensure Remove button exists
      if (!box.querySelector('#aedit-pw-rm')) {
        var rmBtn = document.createElement('button');
        rmBtn.type = 'button';
        rmBtn.id = 'aedit-pw-rm';
        rmBtn.textContent = 'Remove';
        rmBtn.style.cssText = 'background:#4a2028;border:none;color:#ff8a8a;padding:9px 14px;border-radius:8px;cursor:pointer;font-size:12px;';
        rmBtn.onclick = onRemovePassword;
        box.querySelector('#aedit-pw').parentNode.appendChild(rmBtn);
      }

      alert('Password updated.');
      renderList();
    };

    // ---- Remove password (requires old password) ----
    function onRemovePassword() {
      if (acc.hasPassword) {
        if (!requireOldPassword('Remove password')) return;
      }
      if (!confirm('Remove the password from "' + acc.name + '"?')) return;
      window.Accounts.update(acc.id, { password: '' });
      acc.hasPassword = false;
      overlay.remove();
      renderList();
      alert('Password removed.');
    }
    var rmBtnEl = box.querySelector('#aedit-pw-rm');
    if (rmBtnEl) rmBtnEl.onclick = onRemovePassword;

    // ---- Save (name + avatar only — no password change here) ----
    box.querySelector('#aedit-save').onclick = function () {
      var newName = box.querySelector('#aedit-name').value.trim().slice(0, 20);
      if (!newName) return alert('Name is required.');
      window.Accounts.update(acc.id, { name: newName });
      setGlobalAvatar(acc.id, avatar);
      overlay.remove();
      renderList();
    };

    // ---- Cancel ----
    box.querySelector('#aedit-cancel').onclick = function () {
      overlay.remove();
    };
  }

  // ---------- Select account (unlock flow) ----------
  function selectAccount(acc) {
    if (!acc.hasPassword) return finishLogin(acc.id);

    var pwPrompt = el('acctPwPrompt');
    var pwName   = el('acctPwName');
    var pwInput  = el('acctPwInput');
    var pwErr    = el('acctPwErr');
    pwName.textContent = 'Enter password for ' + acc.name;
    pwInput.value = '';
    pwErr.textContent = '';
    pwPrompt.style.display = 'block';
    pwInput.focus();

    function tryUnlock() {
      var pw = pwInput.value;
      if (window.Accounts.verifyPassword(acc.id, pw)) {
        pwPrompt.style.display = 'none';
        finishLogin(acc.id);
      } else {
        pwErr.textContent = 'Incorrect password';
        pwInput.value = '';
        pwInput.focus();
      }
    }

    el('acctPwOk').onclick = tryUnlock;
    el('acctPwCancel').onclick = function () { pwPrompt.style.display = 'none'; };
    pwInput.onkeydown = function (e) { if (e.key === 'Enter') tryUnlock(); };
  }

  function finishLogin(id) {
    window.Accounts.setActive(id);
    console.log('Signing in as', id);
    location.reload();
  }

  // ---------- New account ----------
  function promptNewAccount() {
    var name = prompt('Account name (max 20 chars):');
    if (name === null) return;
    name = name.trim().slice(0, 20);
    if (!name) return alert('Name is required');

    var pw = prompt('Password (leave blank for none):') || '';
    var res = window.Accounts.create(name, pw);
    if (!res.ok) { alert(res.error); return; }
    renderList();
    alert('Account "' + name + '" created. Click it to sign in.');
  }

  // ---------- Show / hide ----------
  function show() {
    var p = el('acctPicker'); if (!p) return;

    var l = el('login'); if (l) { l.style.display = 'none'; l.classList.remove('on'); }
    var s = el('setup'); if (s) s.classList.add('hide');
    var u = el('uwiz');  if (u) u.classList.add('hide');
    var d = el('dt');    if (d) d.style.display = 'none';
    var t = el('tb');    if (t) t.style.display = 'none';
    var mp = el('miniPlayer'); if (mp) mp.style.display = 'none';

    p.style.display = 'flex';
    renderList();
    showing = true;
  }

  function hide() {
    var p = el('acctPicker'); if (p) p.style.display = 'none';
    showing = false;
  }

  // ---------- Public API ----------
  window.AccountPicker = {
    show: show,
    hide: hide,
    refresh: renderList,
    isShowing: function () { return showing; }
  };

  window.showAccountPicker = function () {
    if (window.Accounts && typeof window.Accounts.setActive === 'function') {
      window.Accounts.setActive(null);
    }
    show();
  };

  console.log('Account picker loaded — password changes require old password');
})();

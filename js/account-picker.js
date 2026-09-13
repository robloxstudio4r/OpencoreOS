// ============================================================
//  account-picker.js — Lock screen account chooser
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

  function renderList() {
    var listEl = el('acctList');
    if (!listEl) return;
    listEl.innerHTML = '';
    var accounts = window.Accounts ? window.Accounts.list() : [];

    for (var i = 0; i < accounts.length; i++) {
      (function (acc) {
        var tile = document.createElement('div');
        tile.style.cssText =
          'width:140px;padding:20px 10px;background:rgba(255,255,255,0.05);' +
          'border:1px solid rgba(255,255,255,0.1);border-radius:12px;' +
          'cursor:pointer;text-align:center;transition:all 0.15s;';
        tile.onmouseenter = function () {
          tile.style.background = 'rgba(29,185,84,0.15)';
          tile.style.borderColor = 'rgba(29,185,84,0.5)';
        };
        tile.onmouseleave = function () {
          tile.style.background = 'rgba(255,255,255,0.05)';
          tile.style.borderColor = 'rgba(255,255,255,0.1)';
        };
        tile.innerHTML =
          '<div style="font-size:48px;line-height:1;margin-bottom:12px;">👤</div>' +
          '<div style="font-size:14px;font-weight:600;color:#fff;white-space:nowrap;' +
          'overflow:hidden;text-overflow:ellipsis;">' + escapeHtml(acc.name) + '</div>' +
          (acc.hasPassword
            ? '<div style="font-size:11px;color:#888;margin-top:4px;">🔒 Password</div>'
            : '<div style="font-size:11px;color:#666;margin-top:4px;">No password</div>');
        tile.onclick = function () { selectAccount(acc); };
        listEl.appendChild(tile);
      })(accounts[i]);
    }

    if (window.Accounts && window.Accounts.canCreate()) {
      var add = document.createElement('div');
      add.style.cssText =
        'width:140px;padding:20px 10px;background:rgba(255,255,255,0.02);' +
        'border:2px dashed rgba(255,255,255,0.15);border-radius:12px;' +
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
        '<div style="font-size:48px;line-height:1;margin-bottom:12px;color:#666;">＋</div>' +
        '<div style="font-size:13px;color:#aaa;">Add account</div>' +
        '<div style="font-size:11px;color:#666;margin-top:4px;">' +
        window.Accounts.count() + '/' + window.Accounts.MAX + '</div>';
      add.onclick = promptNewAccount;
      listEl.appendChild(add);
    }
  }

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

  function show() {
    var p = el('acctPicker'); if (!p) return;
    var l = el('login'); if (l) l.style.display = 'none';
    var s = el('setup'); if (s) s.classList.add('hide');
    var u = el('uwiz');  if (u) u.classList.add('hide');
    var d = el('dt');    if (d) d.style.display = 'none';
    var t = el('tb');    if (t) t.style.display = 'none';
    p.style.display = 'flex';
    renderList();
    showing = true;
  }

  function hide() {
    var p = el('acctPicker'); if (p) p.style.display = 'none';
    showing = false;
  }

  window.AccountPicker = { show: show, hide: hide, refresh: renderList, isShowing: function () { return showing; } };
  console.log('Account picker loaded');
})();

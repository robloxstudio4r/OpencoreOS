// ============================================================
//  accounts.js — Multi-user account system for OpencoreOS v10.4
//  Max 3 accounts. Each account has an isolated storage prefix.
//  Prefix scheme:  u1_  u2_  u3_
//  LOADS BEFORE storage.js so LS can be scoped.
// ============================================================

(function () {
  'use strict';

  var ACCOUNTS_KEY  = '__oc_accounts__';    // global (unprefixed)
  var ACTIVE_KEY    = '__oc_active_user__'; // global (unprefixed)
  var MAX_ACCOUNTS  = 3;

  // -------- Account list (global) --------
  function getAccounts() {
    try {
      var raw = localStorage.getItem(ACCOUNTS_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr;
    } catch (e) { return []; }
  }

  function saveAccounts(arr) {
    try { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function getActiveId() {
    try { return localStorage.getItem(ACTIVE_KEY) || null; } catch (e) { return null; }
  }

  function setActiveId(id) {
    try { localStorage.setItem(ACTIVE_KEY, id || ''); } catch (e) {}
  }

  function getActiveAccount() {
    var id = getActiveId();
    if (!id) return null;
    var list = getAccounts();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function prefixFor(id) { return id + '_'; }

  function activePrefix() {
    var acc = getActiveAccount();
    return acc ? prefixFor(acc.id) : '__anon_';
  }

  // -------- Password hash --------
  function hashPassword(pw) {
    var h = 0;
    for (var i = 0; i < pw.length; i++) {
      h = ((h << 5) - h) + pw.charCodeAt(i);
      h |= 0;
    }
    return 'h' + (h >>> 0).toString(36);
  }

  // -------- Create account --------
  function nextId() {
    var list = getAccounts();
    for (var n = 1; n <= MAX_ACCOUNTS; n++) {
      var id = 'u' + n;
      var used = false;
      for (var i = 0; i < list.length; i++) if (list[i].id === id) { used = true; break; }
      if (!used) return id;
    }
    return null;
  }

  function createAccount(name, password) {
    var list = getAccounts();
    if (list.length >= MAX_ACCOUNTS) return { ok: false, error: 'Maximum of ' + MAX_ACCOUNTS + ' accounts reached' };
    name = (name || '').trim().slice(0, 20);
    if (!name) return { ok: false, error: 'Name is required' };
    var id = nextId();
    if (!id) return { ok: false, error: 'No free account slot' };

    var acc = {
      id: id,
      name: name,
      createdAt: Date.now(),
      hasPassword: !!password,
      passwordHash: password ? hashPassword(password) : null
    };
    list.push(acc);
    saveAccounts(list);

    // Seed per-user setup flags so the account boots straight to lock/desktop
    var p = prefixFor(id);
    try {
      localStorage.setItem(p + 'oc_setup_done', 'true');
      localStorage.setItem(p + 'oc_user_done', 'true');
      localStorage.setItem(p + 'oc_device_name', name + '-PC');
    } catch (e) {}

    return { ok: true, account: acc };
  }

  function updateAccount(id, patch) {
    var list = getAccounts();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        if (patch.name !== undefined) list[i].name = String(patch.name).trim().slice(0, 20);
        if (patch.password !== undefined) {
          if (patch.password) {
            list[i].hasPassword = true;
            list[i].passwordHash = hashPassword(patch.password);
          } else {
            list[i].hasPassword = false;
            list[i].passwordHash = null;
          }
        }
        saveAccounts(list);
        return true;
      }
    }
    return false;
  }

  function deleteAccount(id) {
    var list = getAccounts();
    var filtered = [];
    for (var i = 0; i < list.length; i++) if (list[i].id !== id) filtered.push(list[i]);
    saveAccounts(filtered);

    // Wipe that user's prefixed keys
    var p = prefixFor(id);
    var toRemove = [];
    try {
      for (var k = 0; k < localStorage.length; k++) {
        var key = localStorage.key(k);
        if (key && key.indexOf(p) === 0) toRemove.push(key);
      }
      for (var j = 0; j < toRemove.length; j++) localStorage.removeItem(toRemove[j]);
    } catch (e) {}

    if (getActiveId() === id) setActiveId(null);
    return true;
  }

  function verifyPassword(id, pw) {
    var list = getAccounts();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        if (!list[i].hasPassword) return true;
        return list[i].passwordHash === hashPassword(pw);
      }
    }
    return false;
  }

  // -------- Scoped LS factory --------
  // The returned object behaves like localStorage but every key is
  // transparently prefixed with the active account's prefix.
  function scopedLS(prefix) {
    prefix = prefix || activePrefix();
    return {
      getItem: function (k) {
        try { return localStorage.getItem(prefix + k); } catch (e) { return null; }
      },
      setItem: function (k, v) {
        try { localStorage.setItem(prefix + k, String(v)); } catch (e) {}
      },
      removeItem: function (k) {
        try { localStorage.removeItem(prefix + k); } catch (e) {}
      },
      clear: function () {
        var toRemove = [];
        try {
          for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key && key.indexOf(prefix) === 0) toRemove.push(key);
          }
          for (var j = 0; j < toRemove.length; j++) localStorage.removeItem(toRemove[j]);
        } catch (e) {}
      },
      key: function (i) {
        // Enumerate only keys for this account, with the prefix stripped
        var mine = [];
        try {
          for (var k = 0; k < localStorage.length; k++) {
            var key = localStorage.key(k);
            if (key && key.indexOf(prefix) === 0) mine.push(key.slice(prefix.length));
          }
        } catch (e) {}
        return mine[i] || null;
      },
      get length() {
        var n = 0;
        try {
          for (var k = 0; k < localStorage.length; k++) {
            var key = localStorage.key(k);
            if (key && key.indexOf(prefix) === 0) n++;
          }
        } catch (e) {}
        return n;
      },
      _prefix: prefix
    };
  }

  // Expose
  window.Accounts = {
    MAX: MAX_ACCOUNTS,
    list: getAccounts,
    getActiveId: getActiveId,
    getActiveAccount: getActiveAccount,
    setActive: setActiveId,
    create: createAccount,
    update: updateAccount,
    remove: deleteAccount,
    verifyPassword: verifyPassword,
    activePrefix: activePrefix,
    prefixFor: prefixFor,
    scopedLS: scopedLS,
    count: function () { return getAccounts().length; },
    isFull: function () { return getAccounts().length >= MAX_ACCOUNTS; },
    canCreate: function () { return getAccounts().length < MAX_ACCOUNTS; }
  };

  console.log('Accounts module loaded — ' + getAccounts().length + ' account(s), active prefix: ' + activePrefix());
})();

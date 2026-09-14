// ============================================================
//  vfs-supabase.js — VFS backed by Supabase
//  Replaces the localStorage VFS
// ============================================================

(function () {
  'use strict';

  var cache = {};  // path -> node
  var loaded = false;
  var userId = null;

  function getUserId() {
    if (userId) return userId;
    if (window.OpencoreAuth && window.OpencoreAuth.getCurrentUser) {
      var u = window.OpencoreAuth.getCurrentUser();
      if (u) userId = u.id;
    }
    return userId;
  }

  // ---------- Load all files for the user ----------
  function loadAll() {
    return new Promise(function (resolve) {
      var uid = getUserId();
      if (!uid || !window.supabaseClient) { resolve(); return; }
      window.supabaseClient.from('vfs_files').select('*').eq('user_id', uid)
        .then(function (res) {
          if (res.error) { console.warn('VFS load error:', res.error); resolve(); return; }
          cache = {};
          (res.data || []).forEach(function (row) {
            cache[row.path] = {
              type: row.is_folder ? 'folder' : 'file',
              content: row.content,
              path: row.path
            };
          });
          loaded = true;
          resolve();
        });
    });
  }

  // ---------- Ensure defaults exist ----------
  function ensureDefaults() {
    var uid = getUserId();
    if (!uid || !window.supabaseClient) return Promise.resolve();
    var defaults = [
      { path: '/', is_folder: true, content: null },
      { path: '/Documents', is_folder: true, content: null },
      { path: '/Pictures', is_folder: true, content: null },
      { path: '/Audio', is_folder: true, content: null },
      { path: '/System32', is_folder: true, content: null },
      { path: '/readme.txt', is_folder: false, content: 'Welcome to OpencoreOS!' }
    ];
    var toInsert = defaults.map(function (d) {
      return { user_id: uid, path: d.path, is_folder: d.is_folder, content: d.content };
    });
    return window.supabaseClient.from('vfs_files').upsert(toInsert, { onConflict: 'user_id,path' })
      .then(function () { return loadAll(); });
  }

  // ---------- Public VFS API (replaces old VFS) ----------
  window.VFS = {
    init: function () {
      return loadAll().then(function () {
        if (Object.keys(cache).length === 0) return ensureDefaults();
      });
    },

    list: function (path) {
      var out = [];
      var normalized = path === '/' ? '' : path;
      for (var p in cache) {
        if (p === '/' || p === path) continue;
        var rel = p.substring(normalized.length + 1);
        if (rel.indexOf('/') !== -1) continue;
        out.push({ name: rel, type: cache[p].type, content: cache[p].content });
      }
      return out;
    },

    read: function (path) {
      return cache[path] ? cache[path].content : null;
    },

    write: function (path, content, password) {
      var uid = getUserId();
      if (!uid || !window.supabaseClient) return false;
      if (path.indexOf('/System32') === 0) return false;
      cache[path] = { type: 'file', content: content };
      window.supabaseClient.from('vfs_files').upsert({
        user_id: uid, path: path, is_folder: false, content: content
      }, { onConflict: 'user_id,path' });
      return true;
    },

    mkdir: function (path) {
      var uid = getUserId();
      if (!uid || !window.supabaseClient) return false;
      if (path.indexOf('/System32') === 0) return false;
      cache[path] = { type: 'folder', content: null };
      window.supabaseClient.from('vfs_files').upsert({
        user_id: uid, path: path, is_folder: true, content: null
      }, { onConflict: 'user_id,path' });
      return true;
    },

    del: function (path) {
      var uid = getUserId();
      if (!uid || !window.supabaseClient) return false;
      if (path.indexOf('/System32') === 0) return false;
      delete cache[path];
      window.supabaseClient.from('vfs_files').delete().eq('user_id', uid).eq('path', path);
      return true;
    },

    getNode: function (path) {
      return cache[path] || null;
    },

    count: function () {
      var n = 0;
      for (var k in cache) if (cache[k].type === 'file') n++;
      return n;
    },

    size: function () {
      var s = 0;
      for (var k in cache) if (cache[k].type === 'file') s += (cache[k].content || '').length;
      return s;
    },

    restoreSystem32: function () {
      return Promise.resolve();
    }
  };

  console.log('VFS backed by Supabase loaded');
})();

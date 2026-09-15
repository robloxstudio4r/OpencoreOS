// ============================================================
//  storage.js — Scoped by Supabase user ID
// ============================================================

var LS_base = (function(){
  try {
    var ls = window.localStorage;
    ls.setItem('__t','1');
    ls.removeItem('__t');
    return ls;
  } catch(e) {
    var m = {};
    return {
      getItem: function(k){ return Object.prototype.hasOwnProperty.call(m,k) ? m[k] : null; },
      setItem: function(k,v){ m[k] = String(v); },
      removeItem: function(k){ delete m[k]; },
      clear: function(){ m = {}; },
      key: function(i){ return Object.keys(m)[i] || null; },
      get length(){ return Object.keys(m).length; }
    };
  }
})();

(function () {
  function currentUserId() {
    if (window.currentUser && window.currentUser.id) return window.currentUser.id;
    if (window.OpencoreAuth && window.OpencoreAuth.getCurrentUser) {
      var u = window.OpencoreAuth.getCurrentUser();
      if (u && u.id) return u.id;
    }
    return '__signedout__';
  }

  function scopedLS() {
    var uid = currentUserId();
    var prefix = 'u_' + uid + '_';
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

  try {
    Object.defineProperty(window, 'LS', {
      configurable: true,
      get: function () { return scopedLS(); }
    });
  } catch (e) {
    window.LS = scopedLS();
  }
})();

window.onerror = function(m,u,l,c,e){
  var box = document.getElementById('err');
  var msg = document.getElementById('errm');
  var st = document.getElementById('errs');
  if(box){ box.style.display='block'; if(msg) msg.textContent = m + ' (line ' + l + ':' + c + ')'; if(st) st.textContent = (e && e.stack) ? e.stack : ''; }
  return false;
};

var $ = function(id){ return document.getElementById(id); };
var $$ = function(s){ return document.querySelectorAll(s); };

if (!window.VFS) {
  window.VFS = {
    root: null,
    init: function(){ return Promise.resolve(); },
    list: function(){ return []; },
    read: function(){ return null; },
    write: function(){ return false; },
    mkdir: function(){ return false; },
    del: function(){ return false; },
    getNode: function(){ return null; },
    count: function(){ return 0; },
    size: function(){ return 0; },
    restoreSystem32: function(){ return Promise.resolve(); }
  };
}

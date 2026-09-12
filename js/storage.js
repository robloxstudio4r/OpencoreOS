var LS = (function(){
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

window.onerror = function(m,u,l,c,e){
  var box = document.getElementById('err');
  var msg = document.getElementById('errm');
  var st = document.getElementById('errs');
  if(box){ box.style.display='block'; if(msg) msg.textContent = m + ' (line ' + l + ':' + c + ')'; if(st) st.textContent = (e && e.stack) ? e.stack : ''; }
  return false;
};

var $ = function(id){ return document.getElementById(id); };
var $$ = function(s){ return document.querySelectorAll(s); };

var VFS = {
  root: null,
  init: function(){
    try {
      var saved = LS.getItem('oc_vfs');
      if(saved) this.root = JSON.parse(saved);
      else {
        this.root = {
          type:'folder',
          children:{
            Documents:{type:'folder',children:{}},
            Pictures:{type:'folder',children:{}},
            Audio:{type:'folder',children:{}},
            System32:{type:'folder',children:this.defaultSystem32()},
            'readme.txt':{type:'file',content:'Welcome to OpencoreOS v10.4!\n\nUse the Terminal and type "help".'}
          }
        };
        this.save();
      }
    } catch(e) { this.root = {type:'folder',children:{}}; }
  },
  defaultSystem32: function(){
    return {
      'kernel.oc':{type:'file',content:JSON.stringify({type:'txt',content:'OpencoreOS Kernel v10.4',_oc:true})},
      'kernel32.oc':{type:'file',content:JSON.stringify({type:'txt',content:'Kernel32 Subsystem',_oc:true})},
      'boot.oc':{type:'file',content:JSON.stringify({type:'txt',content:'Bootloader v10.4',_oc:true})},
      'config.oc':{type:'file',content:JSON.stringify({type:'txt',content:'System Configuration',_oc:true})},
      'drivers.oc':{type:'file',content:JSON.stringify({type:'txt',content:'Driver Manifest',_oc:true})},
      'system.oc':{type:'file',content:JSON.stringify({type:'txt',content:'Core system files',_oc:true})},
      'registry.oc':{type:'file',content:JSON.stringify({type:'txt',content:'System Registry',_oc:true})},
      'hal.oc':{type:'file',content:JSON.stringify({type:'txt',content:'Hardware Abstraction Layer',_oc:true})},
      'ntdll.oc':{type:'file',content:JSON.stringify({type:'txt',content:'NT Layer DLL',_oc:true})},
      'win32k.oc':{type:'file',content:JSON.stringify({type:'txt',content:'Win32 Kernel Driver',_oc:true})},
      'svchost.oc':{type:'file',content:JSON.stringify({type:'txt',content:'Service Host Process',_oc:true})},
      'user32.oc':{type:'file',content:JSON.stringify({type:'txt',content:'User32 Core Library',_oc:true})},
      'gdi32.oc':{type:'file',content:JSON.stringify({type:'txt',content:'GDI32 Subsystem',_oc:true})},
      'README.txt':{type:'file',content:'PROTECTED. Admin PIN: devil.9oce'}
    };
  },
  save: function(){ try { LS.setItem('oc_vfs', JSON.stringify(this.root)); } catch(e){} },
  getNode: function(path){
    var parts = path.split('/').filter(function(p){return p;});
    var n = this.root;
    for(var i=0; i<parts.length; i++){
      if(!n.children || !n.children[parts[i]]) return null;
      n = n.children[parts[i]];
    }
    return n;
  },
  list: function(path){
    var n = this.getNode(path);
    if(!n || n.type !== 'folder') return null;
    var out = [];
    for(var k in n.children) out.push({name:k, type:n.children[k].type, content:n.children[k].content, locked:n.children[k].locked});
    return out;
  },
  read: function(path){
    var n = this.getNode(path);
    if(!n || n.type !== 'file') return null;
    return n.content;
  },
  checkPassword: function(path){
    var n = this.getNode(path);
    if(!n || !n.locked) return true;
    var pw = prompt('This file is password protected.\n\nEnter password:');
    if(pw === null) return false;
    if(pw === n.locked) return true;
    alert('Incorrect password');
    return false;
  },
  write: function(path, content, password){
    if(path.indexOf('/System32') === 0) return false;
    var parts = path.split('/').filter(function(p){return p;});
    var name = parts.pop();
    var n = this.root;
    for(var i=0; i<parts.length; i++){
      if(!n.children[parts[i]]) n.children[parts[i]] = {type:'folder',children:{}};
      n = n.children[parts[i]];
    }
    var existing = n.children[name];
    var locked = (password && password.length) ? password : (existing && existing.locked);
    n.children[name] = {type:'file', content:content};
    if(locked) n.children[name].locked = locked;
    this.save();
    return true;
  },
  mkdir: function(path){
    if(path.indexOf('/System32') === 0) return false;
    var parts = path.split('/').filter(function(p){return p;});
    var name = parts.pop();
    var n = this.root;
    for(var i=0; i<parts.length; i++){
      if(!n.children[parts[i]]) n.children[parts[i]] = {type:'folder',children:{}};
      n = n.children[parts[i]];
    }
    if(!n.children[name]){ n.children[name] = {type:'folder',children:{}}; this.save(); return true; }
    return false;
  },
  del: function(path){
    if(path.indexOf('/System32') === 0) return false;
    var parts = path.split('/').filter(function(p){return p;});
    var name = parts.pop();
    var n = this.root;
    for(var i=0; i<parts.length; i++){
      if(!n.children[parts[i]]) return false;
      n = n.children[parts[i]];
    }
    if(n.children[name]){ delete n.children[name]; this.save(); return true; }
    return false;
  },
  count: function(){
    var c = 0;
    var walk = function(n){ if(n.type === 'file') c++; if(n.children) for(var k in n.children) walk(n.children[k]); };
    walk(this.root);
    return c;
  },
  size: function(){
    var s = 0;
    var walk = function(n){ if(n.type === 'file') s += (n.content || '').length; if(n.children) for(var k in n.children) walk(n.children[k]); };
    walk(this.root);
    return s;
  },
  restoreSystem32: function(){
    if(!this.root.children.System32) this.root.children.System32 = {type:'folder', children:this.defaultSystem32()};
    else {
      var def = this.defaultSystem32();
      for(var k in def) if(!this.root.children.System32.children[k]) this.root.children.System32.children[k] = def[k];
    }
    var folders = ['Documents','Pictures','Audio'];
    for(var i=0; i<folders.length; i++) if(!this.root.children[folders[i]]) this.root.children[folders[i]] = {type:'folder', children:{}};
    this.save();
  }
};
VFS.init();

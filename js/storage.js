var LS = (function(){
  try {
    var ls = window.localStorage;
    ls.setItem('__t','1');
    ls.removeItem('__t');
    return ls;
  } catch(e) {
    var m = {};
    return {
      getItem: function(k){ return

function openCalendar(){
  var win = makeWindow('calendar', 'Calendar', '📅', '<div id="cal-c"></div>', 400, 400);
  var c = win.querySelector('#cal-c');
  var m = new Date().getMonth(); var y = new Date().getFullYear();
  function r(){
    var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var fd = new Date(y, m, 1).getDay(); var dim = new Date(y, m+1, 0).getDate(); var today = new Date();
    var h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'
      + '<button id="cp" style="background:rgba(255,255,255,0.04);border:none;color:#ccc;padding:4px 12px;border-radius:4px;cursor:pointer;">◀</button>'
      + '<span>' + mo[m] + ' ' + y + '</span>'
      + '<button id="cn" style="background:rgba(255,255,255,0.04);border:none;color:#ccc;padding:4px 12px;border-radius:4px;cursor:pointer;">▶</button>'
      + '</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;">';
    var days = ['S','M','T','W','T','F','S'];
    for(var i=0; i<7; i++) h += '<div style="color:#888;font-size:12px;padding:4px;">' + days[i] + '</div>';
    for(var k=0; k<fd; k++) h += '<div style="padding:8px;"></div>';
    for(var d=1; d<=dim; d++){
      var isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
      h += '<div style="padding:8px;border-radius:4px;background:' + (isToday ? '#0078d4' : 'rgba(255,255,255,0.03)') + ';color:' + (isToday ? '#fff' : '#ccc') + ';font-size:12px;">' + d + '</div>';
    }
    h += '</div>';
    c.innerHTML = h;
    c.querySelector('#cp').onclick = function(){ m--; if(m < 0){ m = 11; y--; } r(); };
    c.querySelector('#cn').onclick = function(){ m++; if(m > 11){ m = 0; y++; } r(); };
  }
  r();
}

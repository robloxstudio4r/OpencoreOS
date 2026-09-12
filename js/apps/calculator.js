function openCalculator(){
  var win = makeWindow('calculator', 'Calculator', '🧮',
    '<div class="cd" id="cd">0</div>'
    + '<div class="cg">'
    + '<button data-v="7">7</button><button data-v="8">8</button><button data-v="9">9</button><button class="op" data-v="/">÷</button>'
    + '<button data-v="4">4</button><button data-v="5">5</button><button data-v="6">6</button><button class="op" data-v="*">×</button>'
    + '<button data-v="1">1</button><button data-v="2">2</button><button data-v="3">3</button><button class="op" data-v="-">-</button>'
    + '<button data-v="0">0</button><button data-v=".">.</button><button class="eq" data-v="=">=</button><button class="op" data-v="+">+</button>'
    + '<button class="cl" data-v="C">Clear</button></div>', 300, 400);
  var cur = '';
  var d = win.querySelector('#cd');
  var buttons = win.querySelectorAll('.cg button');
  for(var i=0; i<buttons.length; i++){
    (function(b){
      b.onclick = function(){
        var v = b.getAttribute('data-v');
        if(v === 'C'){ cur = ''; d.textContent = '0'; return; }
        if(v === '='){ try { var r = Function('"use strict";return(' + cur + ')')(); d.textContent = r; cur = String(r); } catch(e){ d.textContent = 'Error'; cur = ''; } return; }
        cur += v;
        d.textContent = cur;
      };
    })(buttons[i]);
  }
}

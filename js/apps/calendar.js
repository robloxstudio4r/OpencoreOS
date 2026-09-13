// ============================================================
//  calendar.js — Calendar with events for OpencoreOS v10.4
//  Storage: LS (per-account)
//  Key: oc_calendar_events = JSON array of event objects
//  Event shape: { id, title, date:'YYYY-MM-DD', time, desc, color }
// ============================================================

function openCalendar(){
  var EVENTS_KEY = 'oc_calendar_events';

  // ---------- Storage ----------
  function readEvents() {
    try {
      var raw = LS.getItem(EVENTS_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function writeEvents(arr) {
    try { LS.setItem(EVENTS_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function pad2(n){ return String(n).padStart(2, '0'); }
  function dateKey(d){ return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()); }

  function eventsOnDate(key) {
    var all = readEvents();
    var out = [];
    for (var i = 0; i < all.length; i++) if (all[i].date === key) out.push(all[i]);
    out.sort(function(a, b){
      var ta = a.time || '99:99';
      var tb = b.time || '99:99';
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });
    return out;
  }

  // ---------- State ----------
  var today = new Date();
  var viewYear = today.getFullYear();
  var viewMonth = today.getMonth();   // 0-11

  // ---------- Window ----------
  var win = makeWindow('calendar', 'Calendar', '📅',
    '<div id="cal-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
      + '<div id="cal-header" style="padding:10px 14px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:8px;">'
        + '<button type="button" id="cal-prev" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:14px;">‹</button>'
        + '<button type="button" id="cal-today" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;">Today</button>'
        + '<div id="cal-title" style="flex:1;text-align:center;color:#fff;font-size:15px;font-weight:600;"></div>'
        + '<button type="button" id="cal-next" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:14px;">›</button>'
        + '<button type="button" id="cal-add" title="Add event" style="background:#1db954;border:none;color:#fff;padding:5px 16px;border-radius:6px;cursor:pointer;font-size:16px;font-weight:700;margin-left:6px;">+</button>'
      + '</div>'
      + '<div id="cal-dow" style="display:grid;grid-template-columns:repeat(7,1fr);padding:8px 10px 4px 10px;color:#888;font-size:11px;text-align:center;"></div>'
      + '<div id="cal-grid" style="flex:1;display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:1fr;padding:0 10px 10px 10px;gap:4px;overflow-y:auto;"></div>'
      + '<div id="cal-status" style="padding:6px 14px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;"></div>'
    + '</div>', 720, 600);

  var c = win.querySelector('#cal-app');
  var titleEl = c.querySelector('#cal-title');
  var dowEl = c.querySelector('#cal-dow');
  var gridEl = c.querySelector('#cal-grid');
  var statusEl = c.querySelector('#cal-status');

  // ---------- Day-of-week header ----------
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dowEl.innerHTML = '';
  for (var i = 0; i < 7; i++) {
    var d = document.createElement('div');
    d.textContent = DOW[i];
    dowEl.appendChild(d);
  }

  // ---------- Render calendar ----------
  function render() {
    var monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
    titleEl.textContent = monthNames[viewMonth] + ' ' + viewYear;

    gridEl.innerHTML = '';

    var first = new Date(viewYear, viewMonth, 1);
    var startDow = first.getDay(); // 0=Sun
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    var daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

    var totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

    var todayKey = dateKey(today);

    for (var cell = 0; cell < totalCells; cell++) {
      (function (cell) {
        var dayNum, cellDate, isCurrentMonth;

        if (cell < startDow) {
          dayNum = daysInPrev - startDow + cell + 1;
          cellDate = new Date(viewYear, viewMonth - 1, dayNum);
          isCurrentMonth = false;
        } else if (cell >= startDow + daysInMonth) {
          dayNum = cell - (startDow + daysInMonth) + 1;
          cellDate = new Date(viewYear, viewMonth + 1, dayNum);
          isCurrentMonth = false;
        } else {
          dayNum = cell - startDow + 1;
          cellDate = new Date(viewYear, viewMonth, dayNum);
          isCurrentMonth = true;
        }

        var key = dateKey(cellDate);
        var dayEvents = eventsOnDate(key);
        var isToday = key === todayKey;

        var box = document.createElement('div');
        box.style.cssText =
          'background:' + (isCurrentMonth ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)') + ';' +
          'border:1px solid ' + (isToday ? '#1db954' : 'rgba(255,255,255,0.06)') + ';' +
          'border-radius:8px;padding:5px 6px;cursor:pointer;overflow:hidden;' +
          'display:flex;flex-direction:column;gap:3px;min-height:70px;position:relative;';
        if (!isCurrentMonth) box.style.opacity = '0.45';

        // Day number
        var num = document.createElement('div');
        num.textContent = dayNum;
        num.style.cssText =
          'font-size:12px;font-weight:' + (isToday ? '700' : '500') + ';' +
          'color:' + (isToday ? '#1db954' : '#fff') + ';';
        box.appendChild(num);

        // Events (max 3 shown)
        var maxShow = 3;
        for (var e = 0; e < Math.min(dayEvents.length, maxShow); e++) {
          var ev = dayEvents[e];
          var chip = document.createElement('div');
          chip.textContent = (ev.time ? ev.time + ' ' : '') + ev.title;
          chip.style.cssText =
            'font-size:10px;padding:2px 5px;border-radius:4px;' +
            'background:' + (ev.color || '#1db954') + '33;' +
            'border-left:3px solid ' + (ev.color || '#1db954') + ';' +
            'color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
          chip.onclick = function (e2) {
            e2.stopPropagation();
            openEventViewer(ev);
          };
          box.appendChild(chip);
        }
        if (dayEvents.length > maxShow) {
          var more = document.createElement('div');
          more.textContent = '+' + (dayEvents.length - maxShow) + ' more';
          more.style.cssText = 'font-size:9px;color:#888;';
          box.appendChild(more);
        }

        // Whole-day click → open day list
        box.onclick = function () {
          openDayView(key, cellDate);
        };

        gridEl.appendChild(box);
      })(cell);
    }

    // Status
    var all = readEvents();
    var monthCount = 0;
    for (var k = 0; k < all.length; k++) {
      if (all[k].date && all[k].date.indexOf(viewYear + '-' + pad2(viewMonth + 1)) === 0) monthCount++;
    }
    statusEl.textContent = monthCount + ' event' + (monthCount === 1 ? '' : 's') + ' this month · ' + all.length + ' total';
  }

  // ---------- Day view (list of events on a day) ----------
  function openDayView(key, cellDate) {
    var evs = eventsOnDate(key);
    var readable = cellDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    var dwin = makeWindow('calday-' + key, readable, '📅',
      '<div id="day-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
        + '<div style="padding:10px 14px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:10px;">'
          + '<div style="flex:1;color:#fff;font-weight:600;">' + readable + '</div>'
          + '<button type="button" id="day-add" style="background:#1db954;border:none;color:#fff;padding:5px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">+ Add event</button>'
        + '</div>'
        + '<div id="day-list" style="flex:1;overflow-y:auto;padding:14px;"></div>'
      + '</div>', 480, 500);

    var dc = dwin.querySelector('#day-app');
    var listEl = dc.querySelector('#day-list');

    function renderList() {
      listEl.innerHTML = '';
      var events = eventsOnDate(key);
      if (!events.length) {
        listEl.innerHTML = '<div style="color:#666;text-align:center;padding:24px;">No events yet.<br>Click "+ Add event" above.</div>';
        return;
      }
      events.forEach(function (ev) {
        var card = document.createElement('div');
        card.style.cssText =
          'display:flex;align-items:center;gap:10px;padding:10px 12px;' +
          'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);' +
          'border-left:4px solid ' + (ev.color || '#1db954') + ';' +
          'border-radius:8px;margin-bottom:8px;cursor:pointer;';
        card.innerHTML =
          '<div style="flex:1;min-width:0;">' +
            '<div style="color:#fff;font-weight:600;">' + escapeHtml(ev.title || '(untitled)') + '</div>' +
            '<div style="color:#888;font-size:11px;">' + (ev.time ? ev.time : 'All day') +
              (ev.desc ? ' · ' + escapeHtml(ev.desc.slice(0, 60)) + (ev.desc.length > 60 ? '…' : '') : '') +
            '</div>' +
          '</div>';
        card.onclick = function () { openEventViewer(ev); };
        listEl.appendChild(card);
      });
    }

    dc.querySelector('#day-add').onclick = function () {
      openEventEditor({ date: key }, function () {
        renderList();
        render();
      });
    };

    renderList();
  }

  // ---------- Event viewer (full details) ----------
  function openEventViewer(ev) {
    var vwin = makeWindow('calevent-' + ev.id, ev.title || 'Event', '📌',
      '<div id="ev-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
        + '<div style="padding:14px;border-bottom:4px solid ' + (ev.color || '#1db954') + ';">'
          + '<div style="display:flex;align-items:center;gap:10px;">'
            + '<div id="ev-title" style="flex:1;color:#fff;font-size:18px;font-weight:600;"></div>'
            + '<button type="button" id="ev-edit" title="Edit" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:14px;">✏️</button>'
            + '<button type="button" id="ev-del" title="Delete" style="background:rgba(255,80,80,0.12);border:1px solid rgba(255,80,80,0.3);color:#ff8a8a;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:14px;">🗑️</button>'
          + '</div>'
        + '</div>'
        + '<div id="ev-body" style="flex:1;overflow-y:auto;padding:14px;"></div>'
      + '</div>', 480, 440);

    var vc = vwin.querySelector('#ev-app');

    function renderDetails() {
      var parsed = new Date(ev.date + 'T00:00:00');
      var readable = parsed.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

      vc.querySelector('#ev-title').textContent = ev.title || '(untitled)';

      var b = vc.querySelector('#ev-body');
      b.innerHTML = '';

      function row(label, value) {
        var r = document.createElement('div');
        r.style.cssText = 'padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);';
        r.innerHTML =
          '<div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">' + label + '</div>' +
          '<div style="color:#fff;font-size:13px;">' + value + '</div>';
        b.appendChild(r);
      }

      row('Date', readable);
      row('Time', ev.time || 'All day');
      if (ev.desc) row('Description', escapeHtml(ev.desc).replace(/\n/g, '<br>'));

      var colorRow = document.createElement('div');
      colorRow.style.cssText = 'padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);';
      colorRow.innerHTML =
        '<div style="color:#888;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Color</div>';
      var dot = document.createElement('div');
      dot.style.cssText =
        'width:28px;height:28px;border-radius:6px;background:' + (ev.color || '#1db954') + ';' +
        'border:1px solid rgba(255,255,255,0.15);';
      colorRow.appendChild(dot);
      b.appendChild(colorRow);
    }

    vc.querySelector('#ev-edit').onclick = function () {
      openEventEditor(ev, function () {
        renderDetails();
        render();
      });
    };
    vc.querySelector('#ev-del').onclick = function () {
      if (!confirm('Delete "' + (ev.title || 'this event') + '"?')) return;
      var all = readEvents();
      var kept = all.filter(function (x) { return x.id !== ev.id; });
      writeEvents(kept);
      vwin.remove();
      render();
    };

    renderDetails();
  }

  // ---------- Event editor (add / edit) ----------
  function openEventEditor(eventOrNull, onSave) {
    var isEdit = !!(eventOrNull && eventOrNull.id);
    var ev = isEdit
      ? JSON.parse(JSON.stringify(eventOrNull))
      : {
          id: 'ev-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          title: '',
          date: eventOrNull && eventOrNull.date ? eventOrNull.date : dateKey(new Date()),
          time: '',
          desc: '',
          color: '#1db954'
        };

    var overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:2147483645;' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-family:system-ui,-apple-system,sans-serif;';
    var box = document.createElement('div');
    box.style.cssText =
      'background:#1a1c22;color:#fff;padding:22px;border-radius:14px;width:440px;' +
      'max-width:90vw;border:1px solid rgba(255,255,255,0.1);' +
      'box-shadow:0 20px 60px rgba(0,0,0,0.6);';

    var COLORS = ['#1db954', '#ff6b6b', '#4dabf7', '#ffd400', '#b06bff', '#ff8a5c', '#22d3ee', '#ffffff'];

    box.innerHTML =
      '<div style="font-size:16px;font-weight:600;margin-bottom:16px;">' +
        (isEdit ? 'Edit Event' : 'New Event') + '</div>'

      + '<label style="display:block;color:#aaa;font-size:11px;margin-bottom:6px;">Title</label>'
      + '<input id="ev-title" type="text" maxlength="80" placeholder="Event title" '
      +   'style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);'
      +   'color:#fff;padding:9px 12px;border-radius:8px;outline:none;font-size:13px;'
      +   'box-sizing:border-box;margin-bottom:12px;"/>'

      + '<div style="display:flex;gap:8px;margin-bottom:12px;">'
      +   '<div style="flex:1;">'
      +     '<label style="display:block;color:#aaa;font-size:11px;margin-bottom:6px;">Date</label>'
      +     '<input id="ev-date" type="date" '
      +       'style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);'
      +       'color:#fff;padding:9px 12px;border-radius:8px;outline:none;font-size:13px;'
      +       'box-sizing:border-box;"/>'
      +   '</div>'
      +   '<div style="flex:1;">'
      +     '<label style="display:block;color:#aaa;font-size:11px;margin-bottom:6px;">Time (optional)</label>'
      +     '<input id="ev-time" type="time" '
      +       'style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);'
      +       'color:#fff;padding:9px 12px;border-radius:8px;outline:none;font-size:13px;'
      +       'box-sizing:border-box;"/>'
      +   '</div>'
      + '</div>'

      + '<label style="display:block;color:#aaa;font-size:11px;margin-bottom:6px;">Description</label>'
      + '<textarea id="ev-desc" rows="3" maxlength="1000" placeholder="Optional notes..." '
      +   'style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);'
      +   'color:#fff;padding:9px 12px;border-radius:8px;outline:none;font-size:13px;'
      +   'box-sizing:border-box;margin-bottom:12px;font-family:inherit;resize:vertical;"></textarea>'

      + '<label style="display:block;color:#aaa;font-size:11px;margin-bottom:6px;">Color</label>'
      + '<div id="ev-colors" style="display:flex;gap:8px;margin-bottom:20px;"></div>'

      + '<div style="display:flex;gap:8px;">'
      +   '<button type="button" id="ev-save" style="flex:1;background:#1db954;border:none;color:#fff;padding:10px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;">Save</button>'
      +   '<button type="button" id="ev-cancel" style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:10px;border-radius:8px;cursor:pointer;font-size:13px;">Cancel</button>'
      + '</div>';

    overlay.appendChild(box);
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);

    // Prefill
    box.querySelector('#ev-title').value = ev.title || '';
    box.querySelector('#ev-date').value = ev.date || dateKey(new Date());
    box.querySelector('#ev-time').value = ev.time || '';
    box.querySelector('#ev-desc').value = ev.desc || '';

    // Color picker
    var colorWrap = box.querySelector('#ev-colors');
    COLORS.forEach(function (col) {
      var swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.style.cssText =
        'width:32px;height:32px;border-radius:8px;background:' + col + ';' +
        'border:' + (ev.color === col ? '3px solid #fff' : '1px solid rgba(255,255,255,0.15)') + ';' +
        'cursor:pointer;padding:0;';
      swatch.onclick = function () {
        ev.color = col;
        var kids = colorWrap.children;
        for (var i = 0; i < kids.length; i++) {
          kids[i].style.border = '1px solid rgba(255,255,255,0.15)';
        }
        swatch.style.border = '3px solid #fff';
      };
      colorWrap.appendChild(swatch);
    });

    // Focus title
    setTimeout(function () { box.querySelector('#ev-title').focus(); }, 50);

    // Save
    box.querySelector('#ev-save').onclick = function () {
      var title = box.querySelector('#ev-title').value.trim();
      var date = box.querySelector('#ev-date').value;
      var time = box.querySelector('#ev-time').value;
      var desc = box.querySelector('#ev-desc').value.trim();

      if (!title) return alert('Title is required.');
      if (!date) return alert('Date is required.');

      ev.title = title;
      ev.date = date;
      ev.time = time || '';
      ev.desc = desc || '';

      var all = readEvents();
      if (isEdit) {
        for (var i = 0; i < all.length; i++) {
          if (all[i].id === ev.id) { all[i] = ev; break; }
        }
      } else {
        all.push(ev);
      }
      writeEvents(all);
      overlay.remove();
      if (typeof onSave === 'function') onSave(ev);
    };

    box.querySelector('#ev-cancel').onclick = function () {
      overlay.remove();
    };

    // Enter key submits if title field focused
    box.querySelector('#ev-title').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') box.querySelector('#ev-save').click();
    });
  }

  // ---------- Escape HTML ----------
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Wire header buttons ----------
  c.querySelector('#cal-prev').onclick = function () {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    render();
  };
  c.querySelector('#cal-next').onclick = function () {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    render();
  };
  c.querySelector('#cal-today').onclick = function () {
    viewYear = today.getFullYear();
    viewMonth = today.getMonth();
    render();
  };
  c.querySelector('#cal-add').onclick = function () {
    openEventEditor(null, function () { render(); });
  };

  // ---------- Init ----------
  render();

  return win;
}

window.openCalendar = openCalendar;

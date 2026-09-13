// ============================================================
//  checklist.js — Checklist app for OpencoreOS v10.4
//  Storage: LS (per-account)
//  Key: oc_checklists = JSON array of lists
//  List shape: { id, name, icon, color, items: [...] }
//  Item shape: { id, text, done, due, note, createdAt }
// ============================================================

function openChecklist(){
  var KEY = 'oc_checklists';

  // ---------- Storage ----------
  function readLists() {
    try {
      var raw = LS.getItem(KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function writeLists(arr) {
    try { LS.setItem(KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function newId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }
  function pad2(n){ return String(n).padStart(2, '0'); }
  function todayKey(){
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate());
  }

  // ---------- Escape HTML ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Seed default list on first run ----------
  function ensureSeed() {
    var lists = readLists();
    if (lists.length) return;
    lists.push({
      id: newId('list'),
      name: 'My Day',
      icon: '⭐',
      color: '#1db954',
      items: [
        { id: newId('item'), text: 'Welcome to Checklist!', done: false, due: '', note: '', createdAt: Date.now() },
        { id: newId('item'), text: 'Click + to add a new list', done: false, due: '', note: '', createdAt: Date.now() },
        { id: newId('item'), text: 'Check items off by clicking them', done: false, due: '', note: '', createdAt: Date.now() }
      ]
    });
    writeLists(lists);
  }
  ensureSeed();

  // ---------- State ----------
  var currentListId = null;
  var filterMode = 'all'; // 'all' | 'active' | 'done'

  // ---------- Window ----------
  var win = makeWindow('checklist', 'Checklist', '✅',
    '<div id="cl-app" style="display:flex;flex-direction:column;height:100%;background:#141414;color:#ddd;font-family:system-ui,sans-serif;font-size:13px;">'
      + '<div id="cl-header" style="padding:10px 14px;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:10px;">'
        + '<button type="button" id="cl-back" style="display:none;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:13px;">‹</button>'
        + '<div id="cl-title" style="flex:1;color:#fff;font-weight:600;"></div>'
        + '<button type="button" id="cl-add" style="background:#1db954;border:none;color:#fff;padding:5px 16px;border-radius:6px;cursor:pointer;font-size:16px;font-weight:700;">+</button>'
      + '</div>'
      + '<div id="cl-toolbar" style="display:none;padding:8px 14px;border-bottom:1px solid #2a2a2a;gap:6px;align-items:center;">'
        + '<button type="button" data-filter="all" class="cl-filter">All</button>'
        + '<button type="button" data-filter="active" class="cl-filter">Active</button>'
        + '<button type="button" data-filter="done" class="cl-filter">Done</button>'
        + '<div id="cl-progress" style="flex:1;text-align:right;color:#888;font-size:11px;"></div>'
      + '</div>'
      + '<div id="cl-body" style="flex:1;overflow-y:auto;padding:12px 14px;"></div>'
      + '<div id="cl-status" style="padding:6px 14px;border-top:1px solid #2a2a2a;color:#666;font-size:11px;"></div>'
    + '</div>', 520, 600);

  var c = win.querySelector('#cl-app');
  var header = c.querySelector('#cl-header');
  var titleEl = c.querySelector('#cl-title');
  var addBtn = c.querySelector('#cl-add');
  var backBtn = c.querySelector('#cl-back');
  var toolbar = c.querySelector('#cl-toolbar');
  var body = c.querySelector('#cl-body');
  var statusEl = c.querySelector('#cl-status');
  var progressEl = c.querySelector('#cl-progress');

  // ---------- Filter buttons ----------
  var filterBtns = toolbar.querySelectorAll('.cl-filter');
  function paintFilters() {
    for (var i = 0; i < filterBtns.length; i++) {
      var b = filterBtns[i];
      var on = b.getAttribute('data-filter') === filterMode;
      b.style.cssText =
        'background:' + (on ? '#1db954' : 'rgba(255,255,255,0.05)') + ';' +
        'border:1px solid ' + (on ? '#1db954' : 'rgba(255,255,255,0.12)') + ';' +
        'color:' + (on ? '#fff' : '#aaa') + ';' +
        'padding:4px 12px;border-radius:6px;cursor:pointer;font-size:11px;' +
        'font-weight:' + (on ? '600' : '400') + ';';
    }
  }
  for (var i = 0; i < filterBtns.length; i++) {
    (function (b) {
      b.onclick = function () {
        filterMode = b.getAttribute('data-filter');
        paintFilters();
        renderItems();
      };
    })(filterBtns[i]);
  }

  // ============================================================
  //  LISTS VIEW
  // ============================================================
  function renderListsView() {
    currentListId = null;
    titleEl.textContent = 'My Checklists';
    backBtn.style.display = 'none';
    toolbar.style.display = 'none';
    body.innerHTML = '';

    var lists = readLists();

    if (!lists.length) {
      body.innerHTML =
        '<div style="text-align:center;padding:60px 20px;color:#666;">' +
          '<div style="font-size:56px;margin-bottom:14px;">✅</div>' +
          '<div style="font-size:14px;margin-bottom:6px;">No checklists yet</div>' +
          '<div style="font-size:12px;">Click + to create your first list</div>' +
        '</div>';
      statusEl.textContent = '0 lists';
      return;
    }

    lists.forEach(function (list) {
      var total = list.items.length;
      var done = 0;
      for (var i = 0; i < total; i++) if (list.items[i].done) done++;
      var pct = total ? Math.round((done / total) * 100) : 0;

      var row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;gap:12px;padding:12px 14px;' +
        'border:1px solid rgba(255,255,255,0.06);border-radius:10px;' +
        'background:rgba(255,255,255,0.02);margin-bottom:8px;cursor:pointer;';
      row.onmouseenter = function () { row.style.background = 'rgba(255,255,255,0.05)'; };
      row.onmouseleave = function () { row.style.background = 'rgba(255,255,255,0.02)'; };

      var icon = document.createElement('div');
      icon.textContent = list.icon || '📋';
      icon.style.cssText =
        'width:40px;height:40px;display:flex;align-items:center;justify-content:center;' +
        'font-size:22px;background:' + (list.color || '#1db954') + '22;' +
        'border-radius:10px;border:1px solid ' + (list.color || '#1db954') + '44;';
      row.appendChild(icon);

      var info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;';
      info.innerHTML =
        '<div style="color:#fff;font-size:14px;font-weight:600;">' + esc(list.name) + '</div>' +
        '<div style="color:#888;font-size:11px;margin-top:2px;">' +
          done + ' / ' + total + ' done · ' + pct + '%' +
        '</div>';

      // Progress bar
      var barWrap = document.createElement('div');
      barWrap.style.cssText =
        'width:100%;height:3px;background:rgba(255,255,255,0.05);' +
        'border-radius:2px;overflow:hidden;margin-top:6px;';
      var bar = document.createElement('div');
      bar.style.cssText =
        'width:' + pct + '%;height:100%;background:' + (list.color || '#1db954') + ';transition:width 0.3s;';
      barWrap.appendChild(bar);
      info.appendChild(barWrap);
      row.appendChild(info);

      // Menu button
      var menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.textContent = '⋯';
      menuBtn.style.cssText =
        'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);' +
        'color:#fff;width:30px;height:30px;border-radius:6px;cursor:pointer;font-size:16px;';
      menuBtn.onclick = function (e) {
        e.stopPropagation();
        openListMenu(list);
      };
      row.appendChild(menuBtn);

      row.onclick = function () { openList(list.id); };
      body.appendChild(row);
    });

    statusEl.textContent = lists.length + ' list' + (lists.length === 1 ? '' : 's');
  }

  // ============================================================
  //  OPEN A LIST
  // ============================================================
  function openList(listId) {
    currentListId = listId;
    var list = findList(listId);
    if (!list) { renderListsView(); return; }

    titleEl.textContent = (list.icon || '📋') + '  ' + list.name;
    backBtn.style.display = 'block';
    toolbar.style.display = 'flex';

    paintFilters();
    renderItems();
  }

  function findList(id) {
    var lists = readLists();
    for (var i = 0; i < lists.length; i++) if (lists[i].id === id) return lists[i];
    return null;
  }
  function updateList(list) {
    var lists = readLists();
    for (var i = 0; i < lists.length; i++) {
      if (lists[i].id === list.id) { lists[i] = list; break; }
    }
    writeLists(lists);
  }

  // ---------- Render items ----------
  function renderItems() {
    var list = findList(currentListId);
    if (!list) { renderListsView(); return; }

    body.innerHTML = '';

    var items = list.items.slice();
    var filtered = items.filter(function (it) {
      if (filterMode === 'active') return !it.done;
      if (filterMode === 'done') return it.done;
      return true;
    });

    // Sort: undone first, then by due date, then by creation
    filtered.sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      var aDue = a.due || '9999-99-99';
      var bDue = b.due || '9999-99-99';
      if (aDue !== bDue) return aDue < bDue ? -1 : 1;
      return a.createdAt - b.createdAt;
    });

    if (!filtered.length) {
      var empty = document.createElement('div');
      empty.style.cssText = 'text-align:center;padding:40px 20px;color:#666;';
      empty.innerHTML = filterMode === 'done'
        ? '🎉 Nothing done yet.<br><span style="font-size:12px;">Check some items off to see them here.</span>'
        : filterMode === 'active'
        ? '✔ All done!<br><span style="font-size:12px;">Switch to All or Done to see the rest.</span>'
        : 'No items yet.<br><span style="font-size:12px;">Click + to add one.</span>';
      body.appendChild(empty);
    } else {
      filtered.forEach(function (it) { body.appendChild(itemRow(it, list)); });
    }

    // Progress
    var total = list.items.length;
    var done = 0;
    for (var i = 0; i < total; i++) if (list.items[i].done) done++;
    var pct = total ? Math.round((done / total) * 100) : 0;
    progressEl.textContent = done + ' / ' + total + ' · ' + pct + '%';

    statusEl.textContent = total + ' item' + (total === 1 ? '' : 's') + ' total';
  }

  function itemRow(item, list) {
    var row = document.createElement('div');
    row.style.cssText =
      'display:flex;align-items:flex-start;gap:10px;padding:10px 12px;' +
      'background:' + (item.done ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)') + ';' +
      'border:1px solid rgba(255,255,255,0.06);border-radius:10px;' +
      'margin-bottom:6px;' +
      (item.done ? 'opacity:0.6;' : '');

    // Checkbox
    var cb = document.createElement('button');
    cb.type = 'button';
    cb.style.cssText =
      'flex:0 0 auto;width:22px;height:22px;border-radius:6px;' +
      'background:' + (item.done ? (list.color || '#1db954') : 'rgba(0,0,0,0.3)') + ';' +
      'border:1.5px solid ' + (item.done ? (list.color || '#1db954') : 'rgba(255,255,255,0.25)') + ';' +
      'color:#fff;cursor:pointer;font-size:13px;font-weight:700;' +
      'display:flex;align-items:center;justify-content:center;padding:0;margin-top:1px;';
    cb.textContent = item.done ? '✓' : '';
    cb.onclick = function (e) {
      e.stopPropagation();
      item.done = !item.done;
      updateList(list);
      renderItems();
    };
    row.appendChild(cb);

    // Text
    var text = document.createElement('div');
    text.style.cssText = 'flex:1;min-width:0;';
    var textStyle = item.done
      ? 'color:#888;text-decoration:line-through;font-size:13px;word-break:break-word;'
      : 'color:#fff;font-size:13px;word-break:break-word;';
    var dueBadge = '';
    if (item.due) {
      var today = todayKey();
      var isOverdue = item.due < today && !item.done;
      var isToday = item.due === today;
      var dueColor = isOverdue ? '#ff8a8a' : isToday ? '#ffd400' : '#8ab4f8';
      var dueLabel = isToday ? 'Today' : isOverdue ? 'Overdue' : item.due;
      dueBadge = '<div style="color:' + dueColor + ';font-size:10px;margin-top:4px;">📅 ' + esc(dueLabel) + '</div>';
    }
    var noteBadge = '';
    if (item.note) {
      noteBadge = '<div style="color:#888;font-size:11px;margin-top:3px;font-style:italic;">' + esc(item.note) + '</div>';
    }
    text.innerHTML =
      '<div style="' + textStyle + '">' + esc(item.text) + '</div>' +
      dueBadge + noteBadge;
    row.appendChild(text);

    // Edit button
    var editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = '✏️';
    editBtn.title = 'Edit item';
    editBtn.style.cssText =
      'flex:0 0 auto;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);' +
      'color:#fff;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:12px;';
    editBtn.onclick = function (e) {
      e.stopPropagation();
      openItemEditor(item, list, function () { updateList(list); renderItems(); });
    };
    row.appendChild(editBtn);

    // Delete button
    var delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = '🗑️';
    delBtn.title = 'Delete item';
    delBtn.style.cssText =
      'flex:0 0 auto;background:rgba(255,80,80,0.1);border:1px solid rgba(255,80,80,0.25);' +
      'color:#ff8a8a;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:12px;';
    delBtn.onclick = function (e) {
      e.stopPropagation();
      if (!confirm('Delete "' + item.text + '"?')) return;
      var idx = list.items.indexOf(item);
      if (idx !== -1) list.items.splice(idx, 1);
      updateList(list);
      renderItems();
    };
    row.appendChild(delBtn);

    return row;
  }

  // ============================================================
  //  ITEM EDITOR (new / edit)
  // ============================================================
  function openItemEditor(itemOrNull, list, onSave) {
    var isEdit = !!(itemOrNull && itemOrNull.id);
    var item = isEdit
      ? JSON.parse(JSON.stringify(itemOrNull))
      : {
          id: newId('item'),
          text: '',
          done: false,
          due: '',
          note: '',
          createdAt: Date.now()
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

    box.innerHTML =
      '<div style="font-size:16px;font-weight:600;margin-bottom:16px;">' +
        (isEdit ? 'Edit Item' : 'New Item') + '</div>'

      + '<label style="display:block;color:#aaa;font-size:11px;margin-bottom:6px;">Item</label>'
      + '<input id="ci-text" type="text" maxlength="200" placeholder="What needs to be done?" '
      +   'style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);'
      +   'color:#fff;padding:10px 12px;border-radius:8px;outline:none;font-size:13px;'
      +   'box-sizing:border-box;margin-bottom:14px;"/>'

      + '<label style="display:block;color:#aaa;font-size:11px;margin-bottom:6px;">Due date (optional)</label>'
      + '<input id="ci-due" type="date" '
      +   'style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);'
      +   'color:#fff;padding:10px 12px;border-radius:8px;outline:none;font-size:13px;'
      +   'box-sizing:border-box;margin-bottom:14px;"/>'

      + '<label style="display:block;color:#aaa;font-size:11px;margin-bottom:6px;">Note (optional)</label>'
      + '<textarea id="ci-note" rows="3" maxlength="500" placeholder="Extra details..." '
      +   'style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);'
      +   'color:#fff;padding:10px 12px;border-radius:8px;outline:none;font-size:13px;'
      +   'box-sizing:border-box;margin-bottom:20px;font-family:inherit;resize:vertical;"></textarea>'

      + '<div style="display:flex;gap:8px;">'
      +   '<button type="button" id="ci-save" style="flex:1;background:' + (list.color || '#1db954') + ';border:none;color:#fff;padding:10px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;">Save</button>'
      +   '<button type="button" id="ci-cancel" style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:10px;border-radius:8px;cursor:pointer;font-size:13px;">Cancel</button>'
      + '</div>';

    overlay.appendChild(box);
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);

    box.querySelector('#ci-text').value = item.text || '';
    box.querySelector('#ci-due').value = item.due || '';
    box.querySelector('#ci-note').value = item.note || '';
    setTimeout(function () { box.querySelector('#ci-text').focus(); }, 50);

    box.querySelector('#ci-save').onclick = function () {
      var text = box.querySelector('#ci-text').value.trim();
      if (!text) return alert('Item text is required.');

      item.text = text;
      item.due = box.querySelector('#ci-due').value || '';
      item.note = box.querySelector('#ci-note').value.trim() || '';

      if (isEdit) {
        var idx = list.items.indexOf(itemOrNull);
        if (idx !== -1) list.items[idx] = item;
        else list.items.push(item);
      } else {
        list.items.push(item);
      }

      overlay.remove();
      if (typeof onSave === 'function') onSave(item);
    };

    box.querySelector('#ci-cancel').onclick = function () { overlay.remove(); };
    box.querySelector('#ci-text').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') box.querySelector('#ci-save').click();
    });
  }

  // ============================================================
  //  LIST EDITOR (new / edit)
  // ============================================================
  function openListEditor(listOrNull, onSave) {
    var isEdit = !!(listOrNull && listOrNull.id);
    var list = isEdit
      ? JSON.parse(JSON.stringify(listOrNull))
      : {
          id: newId('list'),
          name: '',
          icon: '📋',
          color: '#1db954',
          items: []
        };

    var ICONS = ['📋', '✅', '⭐', '🛒', '🏠', '💼', '📚', '🎯', '🚀', '❤️', '🍽️', '✈️'];
    var COLORS = ['#1db954', '#4dabf7', '#ff6b6b', '#ffd400', '#b06bff', '#ff8a5c', '#22d3ee'];

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

    box.innerHTML =
      '<div style="font-size:16px;font-weight:600;margin-bottom:16px;">' +
        (isEdit ? 'Edit List' : 'New List') + '</div>'

      + '<label style="display:block;color:#aaa;font-size:11px;margin-bottom:6px;">List name</label>'
      + '<input id="cl-edit-name" type="text" maxlength="60" placeholder="e.g. Shopping, Tasks, Ideas" '
      +   'style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.1);'
      +   'color:#fff;padding:10px 12px;border-radius:8px;outline:none;font-size:13px;'
      +   'box-sizing:border-box;margin-bottom:14px;"/>'

      + '<label style="display:block;color:#aaa;font-size:11px;margin-bottom:6px;">Icon</label>'
      + '<div id="cl-icons" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;"></div>'

      + '<label style="display:block;color:#aaa;font-size:11px;margin-bottom:6px;">Color</label>'
      + '<div id="cl-colors" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px;"></div>'

      + '<div style="display:flex;gap:8px;">'
      +   '<button type="button" id="cl-edit-save" style="flex:1;background:#1db954;border:none;color:#fff;padding:10px;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;">Save</button>'
      +   '<button type="button" id="cl-edit-cancel" style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;padding:10px;border-radius:8px;cursor:pointer;font-size:13px;">Cancel</button>'
      + '</div>';

    overlay.appendChild(box);
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);

    box.querySelector('#cl-edit-name').value = list.name || '';

    // Icons
    var iconWrap = box.querySelector('#cl-icons');
    ICONS.forEach(function (ic) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = ic;
      b.style.cssText =
        'width:38px;height:38px;background:' + (list.icon === ic ? 'rgba(29,185,84,0.25)' : 'rgba(255,255,255,0.05)') + ';' +
        'border:1px solid ' + (list.icon === ic ? '#1db954' : 'rgba(255,255,255,0.1)') + ';' +
        'border-radius:8px;cursor:pointer;font-size:18px;padding:0;';
      b.onclick = function () {
        list.icon = ic;
        var kids = iconWrap.children;
        for (var i = 0; i < kids.length; i++) {
          kids[i].style.background = 'rgba(255,255,255,0.05)';
          kids[i].style.borderColor = 'rgba(255,255,255,0.1)';
        }
        b.style.background = 'rgba(29,185,84,0.25)';
        b.style.borderColor = '#1db954';
      };
      iconWrap.appendChild(b);
    });

    // Colors
    var colorWrap = box.querySelector('#cl-colors');
    COLORS.forEach(function (col) {
      var b = document.createElement('button');
      b.type = 'button';
      b.style.cssText =
        'width:34px;height:34px;background:' + col + ';' +
        'border:' + (list.color === col ? '3px solid #fff' : '1px solid rgba(255,255,255,0.15)') + ';' +
        'border-radius:8px;cursor:pointer;padding:0;';
      b.onclick = function () {
        list.color = col;
        var kids = colorWrap.children;
        for (var i = 0; i < kids.length; i++) kids[i].style.border = '1px solid rgba(255,255,255,0.15)';
        b.style.border = '3px solid #fff';
      };
      colorWrap.appendChild(b);
    });

    setTimeout(function () { box.querySelector('#cl-edit-name').focus(); }, 50);

    box.querySelector('#cl-edit-save').onclick = function () {
      var name = box.querySelector('#cl-edit-name').value.trim();
      if (!name) return alert('List name is required.');
      list.name = name;

      var lists = readLists();
      if (isEdit) {
        for (var i = 0; i < lists.length; i++) {
          if (lists[i].id === list.id) { lists[i] = list; break; }
        }
      } else {
        lists.push(list);
      }
      writeLists(lists);
      overlay.remove();
      if (typeof onSave === 'function') onSave(list);
    };

    box.querySelector('#cl-edit-cancel').onclick = function () { overlay.remove(); };
    box.querySelector('#cl-edit-name').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') box.querySelector('#cl-edit-save').click();
    });
  }

  // ============================================================
  //  LIST MENU (⋯)
  // ============================================================
  function openListMenu(list) {
    var opts = [
      { label: '✏️ Edit list', action: function () {
        openListEditor(list, function () {
          if (currentListId === list.id) openList(list.id);
          else renderListsView();
        });
      }},
      { label: '🗑️ Delete list', danger: true, action: function () {
        if (!confirm('Delete "' + list.name + '" and all its items?')) return;
        var lists = readLists();
        var kept = lists.filter(function (l) { return l.id !== list.id; });
        writeLists(kept);
        if (currentListId === list.id) renderListsView();
        else renderListsView();
      }}
    ];

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483646;';
    overlay.onclick = function () { overlay.remove(); };

    var menu = document.createElement('div');
    menu.style.cssText =
      'position:fixed;background:#1a1c22;border:1px solid rgba(255,255,255,0.12);' +
      'border-radius:8px;box-shadow:0 12px 40px rgba(0,0,0,0.6);' +
      'font-family:system-ui,sans-serif;font-size:13px;padding:6px 0;min-width:180px;' +
      'left:50%;top:50%;transform:translate(-50%,-50%);';

    opts.forEach(function (o) {
      var row = document.createElement('div');
      row.textContent = o.label;
      row.style.cssText =
        'padding:9px 16px;cursor:pointer;color:' + (o.danger ? '#ff8a8a' : '#fff') + ';';
      row.onmouseenter = function () { row.style.background = 'rgba(255,255,255,0.06)'; };
      row.onmouseleave = function () { row.style.background = ''; };
      row.onclick = function () {
        overlay.remove();
        o.action();
      };
      menu.appendChild(row);
    });

    overlay.appendChild(menu);
    document.body.appendChild(overlay);
  }

  // ============================================================
  //  HEADER BUTTONS
  // ============================================================
  addBtn.onclick = function () {
    if (currentListId) {
      // Add item to current list
      var list = findList(currentListId);
      if (!list) return;
      openItemEditor(null, list, function () {
        updateList(list);
        renderItems();
      });
    } else {
      // Add new list
      openListEditor(null, function () { renderListsView(); });
    }
  };

  backBtn.onclick = function () {
    renderListsView();
  };

  // ============================================================
  //  INIT
  // ============================================================
  renderListsView();
  return win;
}

window.openChecklist = openChecklist;

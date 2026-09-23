(() => {
  const eventsKey = 'ideal-machine-calendar-events';
  const coupleKey = 'ideal-machine-couple';
  const chatKey = 'ideal-machine-chat';
  const app = document.createElement('div'); app.className = 'calendar-app';
  document.body.appendChild(app);
  const today = new Date(); let month = new Date(); let selectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`; let editorOpen = false; let syncingAllRoles = false; let roleDetailId = '';
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const uid = () => `calendar-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const readEvents = () => { try { const events = JSON.parse(localStorage.getItem(eventsKey) || '[]'); return Array.isArray(events) ? events : []; } catch { return []; } };
  const readChat = () => { try { const value = JSON.parse(localStorage.getItem(chatKey) || '{}'); return { contacts: (value.contacts || []).filter(item => item && !item.isGroup) }; } catch { return { contacts: [] }; } };
  const saveEvents = events => { localStorage.setItem(eventsKey, JSON.stringify(events)); try { const couple = JSON.parse(localStorage.getItem(coupleKey) || '{}'); if (couple.spaces && typeof couple.spaces === 'object') Object.entries(couple.spaces).forEach(([roleId, space]) => { if (space && typeof space === 'object') space.events = events.filter(item => item.contactId === roleId || item.authorId === roleId || item.roleId === roleId); }); else couple.events = events; localStorage.setItem(coupleKey, JSON.stringify(couple)); } catch {} window.IdealMachineRenderCalendar?.(); window.IdealMachineRenderRoleCalendar?.(); };
  const roleName = id => { const role = readChat().contacts.find(item => item.id === id); return role?.name || role?.nickname || '未绑定角色'; };
  const roleContact = id => readChat().contacts.find(item => item.id === id) || {};
  const roleAvatar = id => { const contact = roleContact(id); return contact.avatar ? `<img src="${esc(contact.avatar)}" alt="">` : `<span>${esc((contact.name || contact.nickname || '?').slice(0, 1))}</span>`; };
  const roleColor = id => { let hash = 0; String(id).split('').forEach(char => { hash = (hash * 31 + char.charCodeAt(0)) >>> 0; }); return ['#d47d68','#6e9fba','#9a82bd','#77a47e','#d39a4c','#ba7897','#6f9b91','#a07861'][hash % 8]; };
  const roleEventTime = item => {
    const source = String(item?.time || item?.date || '');
    const match = source.match(/(\d{1,2}:\d{2})\s*(?:—|–|-|至|~)\s*(\d{1,2}:\d{2})/);
    const start = String(item?.start || match?.[1] || source.match(/\d{1,2}:\d{2}/)?.[0] || '待定');
    const rawEnd = String(item?.end || match?.[2] || '');
    const end = rawEnd === '23:59' && /睡觉|睡眠|入睡|就寝|休息过夜/.test(String(item?.title || '')) && Number(start.match(/^\d{1,2}/)?.[0]) >= 20 ? '06:00' : rawEnd;
    const hour = Number(start.match(/^\d{1,2}/)?.[0]);
    const toMinutes = value => { const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/); return match ? Number(match[1]) * 60 + Number(match[2]) : null; };
    const startMinutes = toMinutes(start); const endMinutes = toMinutes(end);
    return { start, end, hour:Number.isFinite(hour) ? hour : null, startMinutes, endMinutes, key:`${start}—${end}` };
  };
  const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const monthTitle = () => `${month.getFullYear()}年${month.getMonth() + 1}月`;
  function render() {
    const previousScrollTop = app.querySelector('.calendar-page')?.scrollTop || 0;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const events = readEvents();
    const selectedEvents = events.filter(item => item.date === selectedDate && item.author !== 'role');
    const roleEvents = events.filter(item => item.date === selectedDate && item.author === 'role');
    const nextDate = new Date(`${selectedDate}T12:00:00`); nextDate.setDate(nextDate.getDate() + 1);
    const nextEarlyEvents = events.filter(item => item.date === dateKey(nextDate) && item.author === 'role' && (roleEventTime(item).startMinutes ?? 9999) < 360);
    const scheduleEvents = [...roleEvents, ...nextEarlyEvents];
    const sortedRoleEvents = scheduleEvents.map(item => ({ item, time:roleEventTime(item) })).sort((a, b) => (a.time.startMinutes ?? 9999) - (b.time.startMinutes ?? 9999));
    const cells = []; for (let i = 0; i < firstDay; i += 1) cells.push('<span class="calendar-empty-day"></span>'); for (let day = 1; day <= daysInMonth; day += 1) { const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day)); const has = events.some(item => item.date === key); cells.push(`<button class="calendar-date-cell ${key === selectedDate ? 'is-selected' : ''} ${has ? 'has-event' : ''}" data-calendar-date="${key}" type="button">${day}</button>`); }
    const dayparts = [{ key:'morning', label:'早', range:'06:00—11:59', start:360, end:720 }, { key:'afternoon', label:'中', range:'12:00—17:59', start:720, end:1080 }, { key:'evening', label:'晚', range:'18:00—次日05:59', start:1080, end:1800 }];
    const roleOrder = [...new Set(scheduleEvents.map(item => item.authorId || item.contactId || item.ownerId || 'unknown'))].sort((a, b) => roleName(a).localeCompare(roleName(b), 'zh-CN'));
    const formatTimelineHour = minutes => `${String(Math.floor((minutes % 1440) / 60)).padStart(2, '0')}:00`;
    const timelineEntry = (entry, part) => {
      const rawStart = entry.time.startMinutes;
      let rawEnd = entry.time.endMinutes ?? rawStart + 60;
      if (rawEnd <= rawStart) rawEnd += 1440;
      let start = rawStart; let end = rawEnd;
      if (part.key === 'evening' && entry.item.date !== selectedDate && rawStart < 360) { start += 1440; end += 1440; }
      return { ...entry, displayStart:start, displayEnd:end };
    };
    const roleSchedule = scheduleEvents.length ? dayparts.map(part => {
      const entries = sortedRoleEvents.map(entry => timelineEntry(entry, part)).filter(({ displayStart, displayEnd }) => displayStart < part.end && displayEnd > part.start);
      const roleIds = roleOrder.filter(id => entries.some(({ item }) => (item.authorId || item.contactId || item.ownerId || 'unknown') === id));
      if (!roleIds.length) return '';
      const tickCount = (part.end - part.start) / 120;
      const ticks = Array.from({ length:tickCount }, (_, index) => `<span>${formatTimelineHour(part.start + index * 120)}</span>`).join('');
      const lanes = roleIds.map(id => {
        const records = entries.filter(({ item }) => (item.authorId || item.contactId || item.ownerId || 'unknown') === id);
        const segments = records.sort((a, b) => a.displayStart - b.displayStart).map(({ item, displayStart, displayEnd }) => { const start = Math.max(part.start, displayStart); const end = Math.min(part.end, displayEnd); const duration = part.end - part.start; const left = ((start - part.start) / duration) * 100; const width = Math.min(100 - left, Math.max(1.5, ((end - start) / duration) * 100)); return `<button class="calendar-role-segment" data-calendar-role-detail="${esc(id)}" style="left:${left}%;width:${width}%;--role-color:${roleColor(id)}" title="${esc(item.title || '日程')}">${esc(item.title || '')}</button>`; }).join('');
        return `<div class="calendar-timeline-row"><button class="calendar-role-label" data-calendar-role-detail="${esc(id)}" type="button" style="--role-color:${roleColor(id)}" aria-label="查看${esc(roleName(id))}的行程" title="${esc(roleName(id))}">${roleAvatar(id)}</button><div class="calendar-role-track">${segments}</div></div>`;
      }).join('');
      return `<section class="calendar-daypart"><header><h3>${part.label}</h3><small>${part.range} · 每格 2 小时</small></header><div class="calendar-timeline" style="--calendar-tick-count:${tickCount}"><div class="calendar-timeline-scale">${ticks}</div><div class="calendar-timeline-lanes">${lanes}</div></div></section>`;
    }).join('') : '<p class="calendar-empty">这一天还没有角色行程。</p>';
    const detailRole = roleDetailId ? roleContact(roleDetailId) : null;
    const detailEvents = scheduleEvents.filter(item => (item.authorId || item.contactId || item.ownerId || 'unknown') === roleDetailId && ((item.date === selectedDate && (roleEventTime(item).startMinutes ?? 0) >= 360) || item.date !== selectedDate)).sort((a, b) => (a.date === selectedDate ? 0 : 1440) + roleEventTime(a).startMinutes - ((b.date === selectedDate ? 0 : 1440) + roleEventTime(b).startMinutes));
    const roleDetail = detailRole ? `<div class="calendar-role-detail"><button class="calendar-role-detail-backdrop" data-calendar-role-detail-close type="button" aria-label="关闭"></button><section><header><div>${roleAvatar(roleDetailId)}<div><small>当天行程</small><h2>${esc(detailRole.name || detailRole.nickname || '角色')}</h2></div></div><button data-calendar-role-detail-close type="button">×</button></header><main>${detailEvents.length ? detailEvents.map(eventCard).join('') : '<p class="calendar-empty">这个角色当天还没有行程。</p>'}</main></section></div>` : '';
    app.innerHTML = `<section class="calendar-page"><header class="calendar-app-header"><div><span>PERSONAL CALENDAR</span><h1>日历</h1></div><button data-calendar-close type="button">×</button></header><main class="calendar-main"><section class="calendar-month-head"><button data-calendar-prev type="button">‹</button><h2>${monthTitle()}</h2><button data-calendar-next type="button">›</button></section><section class="calendar-week-head"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></section><section class="calendar-month-grid">${cells.join('')}</section><section class="calendar-day-section"><div class="calendar-day-title"><div><span>${selectedDate}</span><h2>这一天</h2></div><button class="calendar-add" data-calendar-add type="button">添加行程</button></div>${selectedEvents.length ? selectedEvents.map(eventCard).join('') : '<p class="calendar-empty">这一天还没有添加我的行程。</p>'}</section><section class="calendar-upcoming"><div class="calendar-role-heading"><div><span>ROLE SCHEDULE</span><h2>本日行程</h2></div><button data-calendar-sync-all type="button" ${syncingAllRoles ? 'disabled aria-busy="true"' : ''}>${syncingAllRoles ? '刷新中…' : '刷新'}</button></div>${roleSchedule}</section></main>${editorOpen ? editor() : ''}${roleDetail}</section>`;
    app.querySelector('.calendar-page').scrollTop = previousScrollTop;
  }
  function eventCard(item) { const ownerLabel = item.author === 'role' ? `角色日程：${roleName(item.authorId)}` : '我的行程'; const time = item.time ? ` · ${item.time}` : ''; const note = item.note ? `<p>${esc(item.note)}</p>` : ''; return `<article class="calendar-event-card"><div class="calendar-event-mark ${item.author === 'role' ? 'is-role' : ''}">♡</div><div><b>${esc(item.title)}</b><small>${esc(item.date)}${esc(time)} · ${esc(ownerLabel)}</small>${note}</div><button data-calendar-delete="${esc(item.id)}" type="button">×</button></article>`; }
  function editor() { return `<div class="calendar-editor"><div class="calendar-editor-backdrop" data-calendar-editor-close></div><section><header><h2>添加我的行程</h2><button data-calendar-editor-close type="button">×</button></header><label>行程名称<input id="calendarEventTitle" placeholder="例如：下午去图书馆"></label><label>日期<input id="calendarEventDate" type="date" value="${esc(selectedDate)}"></label><div class="calendar-editor-time"><label>开始时间<input id="calendarEventStart" type="time" value="09:00"></label><label>结束时间<input id="calendarEventEnd" type="time" value="10:00"></label></div><label>具体安排<textarea id="calendarEventNote" rows="3" placeholder="写下这段行程要做什么"></textarea></label><footer><button data-calendar-editor-close type="button">取消</button><button data-calendar-editor-save type="button">保存行程</button></footer></section></div>`; }
  function runCalendarRefresh(task, showError = false) {
    if (syncingAllRoles) return;
    syncingAllRoles = true;
    if (app.classList.contains('is-open')) render();
    Promise.resolve().then(task).catch(error => {
      if (showError) window.alert(`同步角色行程失败：${error.message}`);
    }).finally(() => {
      syncingAllRoles = false;
      if (app.classList.contains('is-open')) render();
    });
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-app-key="rili"]')) { app.classList.add('is-open'); render(); if (window.IdealMachineAutoRefreshRoleCalendar) runCalendarRefresh(() => window.IdealMachineAutoRefreshRoleCalendar()); return; }
    if (!app.classList.contains('is-open')) return;
    if (event.target.closest('[data-calendar-close]')) { roleDetailId = ''; app.classList.remove('is-open'); return; }
    if (event.target.closest('[data-calendar-prev]')) { month = new Date(month.getFullYear(), month.getMonth() - 1, 1); render(); return; }
    if (event.target.closest('[data-calendar-next]')) { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); render(); return; }
    const date = event.target.closest('[data-calendar-date]'); if (date) { roleDetailId = ''; selectedDate = date.dataset.calendarDate; month = new Date(`${selectedDate}T12:00:00`); render(); return; }
    if (event.target.closest('[data-calendar-role-detail-close]')) { roleDetailId = ''; render(); return; }
    const roleDetailButton = event.target.closest('[data-calendar-role-detail]'); if (roleDetailButton) { roleDetailId = roleDetailButton.dataset.calendarRoleDetail; render(); return; }
    if (event.target.closest('[data-calendar-add]')) { editorOpen = true; render(); return; }
    if (event.target.closest('[data-calendar-sync-all]')) { runCalendarRefresh(() => window.IdealMachineSyncAllRoleCalendars?.(selectedDate), true); return; }
    if (event.target.closest('[data-calendar-editor-close]')) { editorOpen = false; render(); return; }
    const del = event.target.closest('[data-calendar-delete]'); if (del) { if (window.confirm('确定删除这条日程吗？')) { saveEvents(readEvents().filter(item => item.id !== del.dataset.calendarDelete)); render(); } return; }
    if (event.target.closest('[data-calendar-editor-save]')) { const title = app.querySelector('#calendarEventTitle')?.value.trim(); const date = app.querySelector('#calendarEventDate')?.value; const start = app.querySelector('#calendarEventStart')?.value || ''; const end = app.querySelector('#calendarEventEnd')?.value || ''; const note = app.querySelector('#calendarEventNote')?.value.trim() || ''; if (!title || !date) return window.alert('请填写行程名称和日期。'); if (start && end && end <= start) return window.alert('结束时间要晚于开始时间。'); const events = readEvents(); events.push({ id: uid(), title, date, start, end, time: start && end ? `${start}—${end}` : start, note, author: 'user', source: 'user-calendar' }); saveEvents(events); selectedDate = date; month = new Date(`${date}T12:00:00`); editorOpen = false; render(); }
  });
  window.IdealMachineRenderRoleCalendar = render;
  window.IdealMachineApps = window.IdealMachineApps || {}; window.IdealMachineApps.rili = { name: '日历' };
})();

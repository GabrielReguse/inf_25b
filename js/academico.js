(() => {
  const { api, ready, escapeHTML, safeUrl, formatDate, relativeDate, emptyState, skeleton, showToast, icons } = window.INF25B;
  const state = { tasks: [], materials: [], events: [], holidays: [], month: new Date(), selectedDate: new Date(), calendarQuery: '', calendarType: 'all' };
  const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  function setupTabs() {
    document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
      const tab = button.dataset.tab;
      document.querySelectorAll('[data-tab]').forEach(item => item.classList.toggle('active', item === button));
      document.querySelectorAll('[data-panel]').forEach(panel => panel.hidden = panel.dataset.panel !== tab);
    }));
  }

  function subjectChips(containerId, type, searchId, renderFn) {
    const container = document.getElementById(containerId);
    const subjects = [...new Set(state.tasks.filter(item => item.tipo === type).map(item => item.materia))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    container.innerHTML = `<button class="chip active" data-subject="all">Todas</button>${subjects.map(subject => `<button class="chip" data-subject="${escapeHTML(subject)}">${escapeHTML(subject)}</button>`).join('')}`;
    let selected = 'all';
    const update = () => renderFn(selected, document.getElementById(searchId).value.trim().toLowerCase());
    container.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => {
      selected = chip.dataset.subject;
      container.querySelectorAll('.chip').forEach(item => item.classList.toggle('active', item === chip));
      update();
    }));
    document.getElementById(searchId).addEventListener('input', update);
  }

  function taskCard(item) {
    const overdue = new Date(item.dataEntrega) < new Date() && item.status === 'ativa';
    const color = item.tipo === 'prova' ? 'var(--danger)' : 'var(--warning)';
    const soft = item.tipo === 'prova' ? 'var(--danger-soft)' : 'var(--warning-soft)';
    const details = [item.grupo ? `Grupo${item.numMembros ? ` • ${item.numMembros}` : ''}` : 'Individual'];
    if (item.tipo === 'prova') details.push(item.consulta ? 'Com consulta' : 'Sem consulta');
    if (item.tipoEntrega) details.push(item.tipoEntrega);
    return `<article class="content-card"><div class="content-card-header"><div><span class="badge" style="--badge-color:${color};--badge-soft:${soft}">${item.tipo === 'prova' ? 'Prova' : 'Tarefa'}</span><h3 style="margin-top:10px">${escapeHTML(item.conteudo)}</h3></div>${overdue ? '<span class="badge urgent">Atrasada</span>' : ''}</div><p>${escapeHTML(item.descricao || 'Nenhuma descrição adicional foi cadastrada.')}</p><div class="meta-line"><span>${icons.book}${escapeHTML(item.materia)}</span><span>${icons.calendar}${formatDate(item.dataEntrega)}</span></div><div class="content-card-footer"><span class="meta-line">${escapeHTML(details.join(' • '))}</span><span class="badge ${item.status === 'concluida' ? 'success' : item.status === 'cancelada' ? 'muted' : 'info'}">${escapeHTML(item.status || 'ativa')}</span></div></article>`;
  }

  function renderTaskType(type, containerId, subject = 'all', query = '') {
    const container = document.getElementById(containerId);
    const items = state.tasks.filter(item => item.tipo === type && (subject === 'all' || item.materia === subject) && `${item.materia} ${item.conteudo} ${item.descricao}`.toLowerCase().includes(query));
    container.innerHTML = items.length ? items.map(taskCard).join('') : emptyState(type === 'prova' ? 'Nenhuma prova encontrada' : 'Nenhuma tarefa encontrada', 'Ajuste os filtros ou aguarde um novo cadastro.', 'calendar');
  }

  function renderMaterials() {
    const query = document.getElementById('materialSearch').value.trim().toLowerCase();
    const type = document.getElementById('materialTypeFilter').value;
    const items = state.materials.filter(item => (type === 'all' || item.tipo === type) && `${item.titulo} ${item.materia} ${item.descricao}`.toLowerCase().includes(query));
    const grid = document.getElementById('materialGrid');
    grid.innerHTML = items.length ? items.map(item => `<a class="content-card" href="${escapeHTML(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer"><div class="content-card-header"><div><span class="badge info">${escapeHTML(item.tipo)}</span><h3 style="margin-top:10px">${escapeHTML(item.titulo)}</h3></div>${icons.arrow}</div><p>${escapeHTML(item.descricao || 'Material compartilhado para consulta da turma.')}</p><div class="content-card-footer"><span class="meta-line">${icons.book}${escapeHTML(item.materia)}</span><span class="badge muted">Abrir</span></div></a>`).join('') : emptyState('Nenhum material encontrado', 'A biblioteca ainda não possui itens com estes filtros.', 'book');
  }

  function localKey(value) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function calendarEntries() {
    const query = state.calendarQuery;
    const all = [
      ...state.tasks.map(item => ({ type: item.tipo, title: item.conteudo, detail: item.materia, date: item.dataEntrega, color: item.tipo === 'prova' ? 'var(--danger)' : 'var(--warning)' })),
      ...state.events.map(item => ({ type: 'evento', title: item.titulo, detail: item.local || item.tipo, date: item.dataInicio, color: 'var(--cyan)' })),
      ...state.holidays.map(item => ({ type: 'feriado', title: item.titulo, detail: item.descricao || item.tipo, date: item.data, color: 'var(--info)' }))
    ];
    return all.filter(item => (state.calendarType === 'all' || item.type === state.calendarType) && `${item.title} ${item.detail}`.toLowerCase().includes(query));
  }

  function renderSelectedDay() {
    const key = localKey(state.selectedDate);
    const items = calendarEntries().filter(item => localKey(item.date) === key).sort((a, b) => new Date(a.date) - new Date(b.date));
    document.getElementById('selectedDayTitle').textContent = formatDate(state.selectedDate, { dateStyle: 'full' });
    const list = document.getElementById('selectedDayList');
    list.innerHTML = items.length ? items.map(item => `<article class="day-event" style="--event-color:${item.color}"><strong>${escapeHTML(item.title)}</strong><span>${escapeHTML(item.detail || item.type)} • ${item.type}</span></article>`).join('') : `<div class="empty-state" style="min-height:130px"><strong>Nada neste dia</strong><p>Selecione outro dia ou ajuste os filtros.</p></div>`;
  }

  function renderCalendar() {
    const container = document.getElementById('academicCalendar');
    const year = state.month.getFullYear();
    const month = state.month.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const previousDays = new Date(year, month, 0).getDate();
    const entries = calendarEntries();
    const byDay = new Map();
    entries.forEach(item => {
      const date = new Date(item.date);
      if (date.getFullYear() !== year || date.getMonth() !== month) return;
      if (!byDay.has(date.getDate())) byDay.set(date.getDate(), []);
      byDay.get(date.getDate()).push(item);
    });
    let cells = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => `<div class="calendar-weekday">${day}</div>`).join('');
    for (let i = firstDay - 1; i >= 0; i--) cells += `<div class="calendar-day muted"><span class="calendar-day-number">${previousDays - i}</span></div>`;
    for (let day = 1; day <= days; day++) {
      const items = byDay.get(day) || [];
      const current = new Date(year, month, day);
      const today = localKey(current) === localKey(new Date());
      const selected = localKey(current) === localKey(state.selectedDate);
      const dots = items.slice(0, 4).map(item => `<i class="calendar-event-dot" style="--dot-color:${item.color}"></i>`).join('');
      cells += `<button class="calendar-day ${today ? 'today' : ''} ${selected ? 'selected' : ''}" type="button" data-date="${localKey(current)}"><span class="calendar-day-number">${day}</span><span class="calendar-event-dots">${dots}</span>${items.length ? `<span class="calendar-day-count">${items.length}</span>` : ''}</button>`;
    }
    const total = firstDay + days;
    for (let day = 1; day <= (7 - total % 7) % 7; day++) cells += `<div class="calendar-day muted"><span class="calendar-day-number">${day}</span></div>`;
    container.innerHTML = `<div class="calendar-toolbar"><strong>${monthNames[month].replace(/^./, char => char.toUpperCase())} ${year}</strong><div class="calendar-controls"><button type="button" data-prev aria-label="Mês anterior"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button><button type="button" data-next aria-label="Próximo mês"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button></div></div><div class="calendar-grid">${cells}</div>`;
    container.querySelector('[data-prev]').addEventListener('click', () => { state.month = new Date(year, month - 1, 1); renderCalendar(); });
    container.querySelector('[data-next]').addEventListener('click', () => { state.month = new Date(year, month + 1, 1); renderCalendar(); });
    container.querySelectorAll('[data-date]').forEach(button => button.addEventListener('click', () => {
      const [y, m, d] = button.dataset.date.split('-').map(Number);
      state.selectedDate = new Date(y, m - 1, d);
      renderCalendar();
      renderSelectedDay();
    }));
    renderSelectedDay();
  }

  setupTabs();
  document.getElementById('calendarSearch').addEventListener('input', event => { state.calendarQuery = event.target.value.trim().toLowerCase(); renderCalendar(); });
  document.getElementById('calendarTypeFilter').addEventListener('change', event => { state.calendarType = event.target.value; renderCalendar(); });
  document.getElementById('materialSearch').addEventListener('input', renderMaterials);
  document.getElementById('materialTypeFilter').addEventListener('change', renderMaterials);
  document.getElementById('todayButton').addEventListener('click', () => { state.month = new Date(); state.selectedDate = new Date(); renderCalendar(); });

  ready(async user => {
    if (user?.role === 'admin') document.getElementById('academicAdminButton').hidden = false;
    document.getElementById('examGrid').innerHTML = skeleton(3);
    document.getElementById('taskGrid').innerHTML = skeleton(3);
    document.getElementById('materialGrid').innerHTML = skeleton(3);
    document.getElementById('academicCalendar').innerHTML = skeleton(4);
    try {
      [state.tasks, state.materials, state.events, state.holidays] = await Promise.all([api('/tarefas'), api('/materiais'), api('/eventos'), api('/feriados')]);
      subjectChips('examSubjectChips', 'prova', 'examSearch', (subject, query) => renderTaskType('prova', 'examGrid', subject, query));
      subjectChips('taskSubjectChips', 'tarefa', 'taskSearch', (subject, query) => renderTaskType('tarefa', 'taskGrid', subject, query));
      renderTaskType('prova', 'examGrid');
      renderTaskType('tarefa', 'taskGrid');
      renderMaterials();
      renderCalendar();
    } catch (error) {
      showToast(error.message, 'error');
      document.getElementById('examGrid').innerHTML = emptyState('Dados indisponíveis', error.message, 'alert');
      document.getElementById('taskGrid').innerHTML = '';
      document.getElementById('materialGrid').innerHTML = '';
    }
  });
})();

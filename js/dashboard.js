(() => {
  const { api, ready, escapeHTML, formatDate, relativeDate, emptyState, skeleton, icons } = window.INF25B;
  const noticeList = document.getElementById('noticeList');
  const upcomingList = document.getElementById('upcomingList');
  const participationList = document.getElementById('participationList');
  const statsGrid = document.getElementById('statsGrid');
  const miniCalendar = document.getElementById('miniCalendar');
  let dashboardData = null;

  const now = new Date();
  const weekdays = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  document.getElementById('todayNumber').textContent = String(now.getDate()).padStart(2, '0');
  document.getElementById('todayWeekday').textContent = weekdays[now.getDay()].replace(/^./, char => char.toUpperCase());
  document.getElementById('todayMonth').textContent = `${months[now.getMonth()].replace(/^./, char => char.toUpperCase())} de ${now.getFullYear()}`;

  function priorityConfig(priority) {
    return {
      urgente: { badge: 'urgent', label: 'Urgente', color: 'var(--danger)', soft: 'var(--danger-soft)' },
      importante: { badge: 'important', label: 'Importante', color: 'var(--warning)', soft: 'var(--warning-soft)' },
      informativo: { badge: 'info', label: 'Informativo', color: 'var(--info)', soft: 'var(--info-soft)' }
    }[priority] || { badge: 'info', label: 'Informativo', color: 'var(--info)', soft: 'var(--info-soft)' };
  }

  function renderStats(stats = {}) {
    const cards = [
      { value: stats.proximosPrazos || 0, label: 'prazos nos próximos 30 dias', icon: 'calendar', color: 'var(--primary-2)', soft: 'var(--primary-soft)' },
      { value: stats.eventos || 0, label: 'eventos no radar', icon: 'party', color: 'var(--cyan)', soft: 'var(--cyan-soft)' },
      { value: stats.enquetesAtivas || 0, label: 'enquetes abertas', icon: 'book', color: 'var(--warning)', soft: 'var(--warning-soft)' },
      { value: stats.sugestoesAbertas || 0, label: 'sugestões suas em análise', icon: 'bulb', color: 'var(--info)', soft: 'var(--info-soft)' }
    ];
    statsGrid.innerHTML = cards.map(card => `<article class="stat-card" style="--stat-color:${card.color};--stat-soft:${card.soft}"><div class="stat-card-top"><span class="stat-card-icon">${icons[card.icon]}</span></div><strong>${card.value}</strong><p>${escapeHTML(card.label)}</p></article>`).join('');
    document.getElementById('todayDeadlines').textContent = stats.proximosPrazos || 0;
    document.getElementById('todayEvents').textContent = stats.eventos || 0;
  }

  function renderNotices(items = []) {
    if (!items.length) return noticeList.innerHTML = emptyState('Nenhum aviso ativo', 'Quando a liderança publicar algo, aparecerá aqui.', 'bell');
    noticeList.innerHTML = items.slice(0, 6).map(item => {
      const config = priorityConfig(item.prioridade);
      return `<article class="list-item"><span class="item-dot" style="--item-color:${config.color};--item-soft:${config.soft}"></span><div class="item-copy"><strong>${escapeHTML(item.titulo)}</strong><p>${escapeHTML(item.descricao)}</p></div><div class="item-meta"><span>${relativeDate(item.criadoEm)}</span><span class="badge ${config.badge}">${config.label}</span></div></article>`;
    }).join('');
  }

  function renderUpcoming(tasks = [], events = []) {
    const combined = [
      ...tasks.map(item => ({ type: item.tipo, title: item.conteudo, description: item.materia, date: item.dataEntrega })),
      ...events.map(item => ({ type: 'evento', title: item.titulo, description: item.local || item.tipo, date: item.dataInicio }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 7);
    if (!combined.length) return upcomingList.innerHTML = emptyState('Agenda livre', 'Não há compromissos cadastrados nos próximos 30 dias.', 'calendar');
    const config = {
      prova: { label: 'Prova', color: 'var(--danger)', soft: 'var(--danger-soft)' },
      tarefa: { label: 'Tarefa', color: 'var(--warning)', soft: 'var(--warning-soft)' },
      evento: { label: 'Evento', color: 'var(--cyan)', soft: 'var(--cyan-soft)' }
    };
    upcomingList.innerHTML = combined.map(item => {
      const style = config[item.type] || config.evento;
      return `<article class="list-item"><span class="item-dot" style="--item-color:${style.color};--item-soft:${style.soft}"></span><div class="item-copy"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.description || 'Sem descrição')}</p></div><div class="item-meta"><span>${formatDate(item.date, { day: '2-digit', month: 'short' })}</span><span class="badge" style="--badge-color:${style.color};--badge-soft:${style.soft}">${style.label}</span></div></article>`;
    }).join('');
  }

  function renderParticipation(polls = [], stats = {}) {
    const items = polls.slice(0, 3).map(poll => ({ title: poll.pergunta, text: `Encerra ${relativeDate(poll.encerraEm)}`, href: 'lazer.html', badge: 'Enquete' }));
    if (stats.sugestoesAbertas) items.push({ title: `${stats.sugestoesAbertas} sugestão(ões) sua(s) em aberto`, text: 'Acompanhe o andamento e as respostas.', href: 'sugestoes.html', badge: 'Sugestão' });
    if (!items.length) return participationList.innerHTML = emptyState('Tudo em dia', 'Nenhuma enquete ou sugestão pendente agora.', 'check');
    participationList.innerHTML = items.map(item => `<a class="list-item" href="${item.href}"><span class="item-dot" style="--item-color:var(--primary-2);--item-soft:var(--primary-soft)"></span><div class="item-copy"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.text)}</p></div><div class="item-meta"><span class="badge">${escapeHTML(item.badge)}</span></div></a>`).join('');
  }

  function renderCalendar(tasks = [], events = []) {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const entries = [...tasks.map(item => ({ date: item.dataEntrega, color: item.tipo === 'prova' ? 'var(--danger)' : 'var(--warning)' })), ...events.map(item => ({ date: item.dataInicio, color: 'var(--cyan)' }))];
    const eventMap = new Map();
    entries.forEach(item => {
      const d = new Date(item.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate();
        if (!eventMap.has(key)) eventMap.set(key, []);
        eventMap.get(key).push(item.color);
      }
    });
    let daysHTML = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => `<div class="calendar-weekday">${day}</div>`).join('');
    const prevDays = new Date(year, month, 0).getDate();
    for (let i = first - 1; i >= 0; i--) daysHTML += `<div class="calendar-day muted"><span class="calendar-day-number">${prevDays - i}</span></div>`;
    for (let day = 1; day <= days; day++) {
      const dots = (eventMap.get(day) || []).slice(0, 4).map(color => `<i class="calendar-event-dot" style="--dot-color:${color}"></i>`).join('');
      daysHTML += `<button class="calendar-day ${day === date.getDate() ? 'today' : ''}" type="button" data-day="${day}"><span class="calendar-day-number">${day}</span><span class="calendar-event-dots">${dots}</span></button>`;
    }
    miniCalendar.innerHTML = `<div class="calendar-toolbar"><strong>${months[month].replace(/^./, char => char.toUpperCase())} ${year}</strong><a class="button small ghost" href="tarefasProvas.html">Abrir</a></div><div class="calendar-grid">${daysHTML}</div>`;
  }

  ready(async user => {
    if (user?.role === 'admin') document.getElementById('manageNotices').hidden = false;
    noticeList.innerHTML = skeleton(3);
    upcomingList.innerHTML = skeleton(3);
    participationList.innerHTML = skeleton(2);
    statsGrid.innerHTML = skeleton(4);
    try {
      dashboardData = await api('/dashboard');
      renderStats(dashboardData.stats);
      renderNotices(dashboardData.avisos);
      renderUpcoming(dashboardData.tarefas, dashboardData.eventos);
      renderParticipation(dashboardData.enquetes, dashboardData.stats);
      renderCalendar(dashboardData.tarefas, dashboardData.eventos);
    } catch (error) {
      noticeList.innerHTML = emptyState('Não foi possível carregar o painel', error.message, 'alert');
      upcomingList.innerHTML = emptyState('Agenda indisponível', 'Tente novamente quando a conexão voltar.', 'calendar');
      participationList.innerHTML = '';
      statsGrid.innerHTML = '';
    }
  });
})();

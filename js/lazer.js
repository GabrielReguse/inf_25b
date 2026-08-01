(() => {
  const { api, ready, escapeHTML, formatDate, relativeDate, emptyState, skeleton, showToast, setLoading, icons } = window.INF25B;
  const state = { events: [], polls: [], suggestions: [], user: null };

  function setupTabs() {
    document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(item => item.classList.toggle('active', item === button));
      document.querySelectorAll('[data-panel]').forEach(panel => panel.hidden = panel.dataset.panel !== button.dataset.tab);
    }));
  }

  function renderEvents() {
    const grid = document.getElementById('eventGrid');
    const upcoming = state.events.filter(event => new Date(event.dataInicio) >= new Date() && event.ativo !== false);
    if (!upcoming.length) return grid.innerHTML = emptyState('Nenhum evento marcado', 'Quando a turma combinar algo, o evento aparecerá aqui.', 'party');
    grid.innerHTML = upcoming.map(event => {
      const participating = (event.participantes || []).some(person => String(person._id || person.id || person) === String(state.user.id));
      const total = event.participantes?.length || 0;
      return `<article class="content-card"><div class="content-card-header"><div><span class="badge success">${escapeHTML(event.tipo)}</span><h3 style="margin-top:10px">${escapeHTML(event.titulo)}</h3></div><span class="badge info">${relativeDate(event.dataInicio)}</span></div><p>${escapeHTML(event.descricao || 'Evento da turma sem descrição adicional.')}</p><div class="meta-line"><span>${icons.calendar}${formatDate(event.dataInicio, { dateStyle: 'medium', timeStyle: 'short' })}</span>${event.local ? `<span>${icons.party}${escapeHTML(event.local)}</span>` : ''}</div><div class="content-card-footer"><span class="meta-line">${total} participante${total === 1 ? '' : 's'}${event.limiteParticipantes ? ` • limite ${event.limiteParticipantes}` : ''}</span><button class="button small ${participating ? 'success' : 'primary'}" data-event-id="${event._id}" type="button">${participating ? 'Participando' : 'Confirmar presença'}</button></div></article>`;
    }).join('');
    grid.querySelectorAll('[data-event-id]').forEach(button => button.addEventListener('click', async () => {
      setLoading(button, true, 'Salvando…');
      try {
        const result = await api(`/eventos/${button.dataset.eventId}/participar`, { method: 'POST' });
        const event = state.events.find(item => item._id === button.dataset.eventId);
        if (event) {
          event.participantes = event.participantes || [];
          if (result.participando) event.participantes.push({ _id: state.user.id, nome: state.user.nome });
          else event.participantes = event.participantes.filter(person => String(person._id || person) !== String(state.user.id));
        }
        showToast(result.participando ? 'Presença confirmada.' : 'Presença removida.');
        renderEvents();
      } catch (error) {
        showToast(error.message, 'error');
        setLoading(button, false);
      }
    }));
  }

  function renderPolls() {
    const grid = document.getElementById('pollGrid');
    if (!state.polls.length) return grid.innerHTML = emptyState('Nenhuma enquete ativa', 'As próximas decisões coletivas aparecerão aqui.', 'book');
    grid.innerHTML = state.polls.map(poll => {
      const total = poll.opcoes.reduce((sum, option) => sum + Number(option.votos || 0), 0);
      const options = poll.opcoes.map(option => {
        const percent = total ? Math.round((option.votos / total) * 100) : 0;
        return `<button class="poll-option ${option.meuVoto ? 'selected' : ''}" style="--poll-percent:${percent}%" type="button" data-poll-id="${poll._id}" data-option-id="${option._id}" ${poll.encerrada ? 'disabled' : ''}><span>${escapeHTML(option.texto)}</span><strong>${option.votos} • ${percent}%</strong></button>`;
      }).join('');
      return `<article class="poll-card"><div class="content-card-header"><span class="badge info">${escapeHTML(poll.categoria)}</span><span class="badge ${poll.encerrada ? 'muted' : 'success'}">${poll.encerrada ? 'Encerrada' : `Encerra ${relativeDate(poll.encerraEm)}`}</span></div><h3 style="margin-top:13px">${escapeHTML(poll.pergunta)}</h3><p>${escapeHTML(poll.descricao || 'Vote na opção que representa sua escolha.')}</p><div class="poll-options">${options}</div><div class="content-card-footer"><span class="meta-line">${total} voto${total === 1 ? '' : 's'}</span><span class="meta-line">${poll.multiplaEscolha ? 'Múltipla escolha' : 'Escolha única'}</span></div></article>`;
    }).join('');
    grid.querySelectorAll('[data-poll-id]').forEach(button => button.addEventListener('click', async () => {
      const poll = state.polls.find(item => item._id === button.dataset.pollId);
      if (!poll || poll.encerrada) return;
      try {
        await api(`/enquetes/${poll._id}/votar`, { method: 'POST', body: JSON.stringify({ opcao: button.dataset.optionId }) });
        state.polls = await api('/enquetes');
        renderPolls();
        showToast('Voto registrado. Democracia sem fila e sem mesário.');
      } catch (error) {
        showToast(error.message, 'error');
      }
    }));
  }

  function suggestionCard(item) {
    return `<article class="content-card"><div class="content-card-header"><div><span class="badge important">${escapeHTML(item.tipo)}</span><h3 style="margin-top:10px">${escapeHTML(item.titulo)}</h3></div><span class="badge ${item.status === 'finalizado' ? 'success' : 'info'}">${escapeHTML(item.status.replace('_', ' '))}</span></div><p>${escapeHTML(item.descricao || item.texto || '')}</p><div class="content-card-footer"><span class="meta-line">Por ${escapeHTML(item.autor?.nome || 'Aluno')}</span><a class="button small" href="sugestoes.html">Acompanhar</a></div></article>`;
  }

  function renderSuggestionGroups() {
    const accepted = state.suggestions.filter(item => ['aceita', 'em_andamento', 'finalizado'].includes(item.status));
    const instagram = accepted.filter(item => item.tipo === 'instagram');
    const shirt = accepted.filter(item => item.tipo === 'camisa');
    document.getElementById('instagramGrid').innerHTML = instagram.length ? instagram.map(suggestionCard).join('') : emptyState('Nenhuma ideia aprovada', 'Sugira posts, cronogramas ou formatos para o Instagram da turma.', 'bulb');
    document.getElementById('shirtGrid').innerHTML = shirt.length ? shirt.map(suggestionCard).join('') : emptyState('Projeto ainda sem decisões', 'Modelos e votações da camisa aparecerão aqui.', 'party');
  }

  setupTabs();
  ready(async user => {
    state.user = user;
    if (user.role === 'admin') document.getElementById('leisureAdminButton').hidden = false;
    document.getElementById('eventGrid').innerHTML = skeleton(3);
    document.getElementById('pollGrid').innerHTML = skeleton(3);
    document.getElementById('instagramGrid').innerHTML = skeleton(2);
    document.getElementById('shirtGrid').innerHTML = skeleton(2);
    try {
      [state.events, state.polls, state.suggestions] = await Promise.all([api('/eventos'), api('/enquetes'), api('/sugestoes')]);
      renderEvents();
      renderPolls();
      renderSuggestionGroups();
    } catch (error) {
      showToast(error.message, 'error');
      document.getElementById('eventGrid').innerHTML = emptyState('Não foi possível carregar', error.message, 'alert');
      document.getElementById('pollGrid').innerHTML = '';
    }
  });
})();

(() => {
  const { api, ready, escapeHTML, formatDate, relativeDate, emptyState, skeleton, showToast, setLoading, icons } = window.INF25B;
  const state = { items: [], user: null, view: 'all', query: '', type: 'all' };
  const grid = document.getElementById('suggestionGrid');

  const statusMap = {
    aguardando: { label: 'Em análise', className: 'important' },
    aceita: { label: 'Aceita', className: 'success' },
    recusada: { label: 'Recusada', className: 'urgent' },
    em_andamento: { label: 'Em andamento', className: 'info' },
    finalizado: { label: 'Finalizada', className: 'success' }
  };

  function filteredItems() {
    return state.items.filter(item => {
      const mine = String(item.autor?._id || item.autor) === String(state.user.id);
      if (state.view === 'mine' && !mine) return false;
      if (state.view === 'open' && !['aguardando', 'em_andamento', 'aceita'].includes(item.status)) return false;
      if (state.type !== 'all' && item.tipo !== state.type) return false;
      return `${item.titulo} ${item.descricao} ${item.autor?.nome || ''}`.toLowerCase().includes(state.query);
    });
  }

  function render() {
    const items = filteredItems();
    if (!items.length) return grid.innerHTML = emptyState('Nenhuma sugestão encontrada', 'Envie uma nova ideia ou ajuste os filtros.', 'bulb');
    grid.innerHTML = items.map(item => {
      const status = statusMap[item.status] || statusMap.aguardando;
      const mine = String(item.autor?._id || item.autor) === String(state.user.id);
      const legal = item.votos?.legal?.length || 0;
      const nao = item.votos?.nao?.length || 0;
      const myLegal = (item.votos?.legal || []).some(id => String(id._id || id) === String(state.user.id));
      const myNo = (item.votos?.nao || []).some(id => String(id._id || id) === String(state.user.id));
      const canDelete = mine || state.user.role === 'admin';
      return `<article class="content-card"><div class="content-card-header"><div><span class="badge ${status.className}">${status.label}</span><h3 style="margin-top:10px">${escapeHTML(item.titulo || 'Sugestão sem título')}</h3></div><span class="badge muted">${escapeHTML(item.tipo || 'outro')}</span></div><p>${escapeHTML(item.descricao || item.texto || '')}</p>${item.dataEncontro ? `<div class="meta-line"><span>${icons.calendar}${formatDate(item.dataEncontro, { dateStyle: 'medium', timeStyle: 'short' })}</span></div>` : ''}${item.respostaAdmin ? `<div class="reply-preview" style="margin-top:12px"><strong>Resposta da liderança:</strong><br>${escapeHTML(item.respostaAdmin)}</div>` : ''}<div class="meta-line"><span>Por ${escapeHTML(item.autor?.nome || 'Aluno')}</span><span>${relativeDate(item.criadaEm)}</span></div><div class="content-card-footer"><div class="card-actions"><button class="button small ${myLegal ? 'success' : ''}" data-vote="legal" data-id="${item._id}" type="button">👍 ${legal}</button><button class="button small ${myNo ? 'danger' : ''}" data-vote="nao" data-id="${item._id}" type="button">👎 ${nao}</button></div>${canDelete ? `<button class="button small danger" data-delete="${item._id}" type="button">Remover</button>` : `<span class="badge muted">${item.respondida ? 'Respondida' : 'Aguardando'}</span>`}</div></article>`;
    }).join('');

    grid.querySelectorAll('[data-vote]').forEach(button => button.addEventListener('click', async () => {
      try {
        await api(`/sugestoes/${button.dataset.id}/votar`, { method: 'POST', body: JSON.stringify({ voto: button.dataset.vote }) });
        await load();
        showToast('Voto registrado.');
      } catch (error) { showToast(error.message, 'error'); }
    }));

    grid.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', async () => {
      if (!confirm('Remover esta sugestão? Esta ação não pode ser desfeita.')) return;
      try {
        await api(`/sugestoes/${button.dataset.delete}`, { method: 'DELETE' });
        await load();
        showToast('Sugestão removida.');
      } catch (error) { showToast(error.message, 'error'); }
    }));
  }

  async function load() {
    state.items = await api('/sugestoes');
    render();
  }

  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
    state.view = button.dataset.tab;
    document.querySelectorAll('[data-tab]').forEach(item => item.classList.toggle('active', item === button));
    render();
  }));
  document.getElementById('suggestionSearch').addEventListener('input', event => { state.query = event.target.value.trim().toLowerCase(); render(); });
  document.getElementById('suggestionTypeFilter').addEventListener('change', event => { state.type = event.target.value; render(); });

  document.getElementById('suggestionForm').addEventListener('submit', async event => {
    event.preventDefault();
    const submit = document.getElementById('suggestionSubmit');
    const payload = {
      tipo: document.getElementById('suggestionType').value,
      titulo: document.getElementById('suggestionTitle').value.trim(),
      descricao: document.getElementById('suggestionDescription').value.trim(),
      dataEncontro: document.getElementById('suggestionDate').value || null
    };
    if (!payload.titulo || !payload.descricao) return showToast('Preencha o título e a descrição.', 'error');
    setLoading(submit, true, 'Enviando…');
    try {
      await api('/sugestoes', { method: 'POST', body: JSON.stringify(payload) });
      event.target.reset();
      await load();
      showToast('Sugestão enviada para análise.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(submit, false);
    }
  });

  ready(async user => {
    state.user = user;
    grid.innerHTML = skeleton(6);
    try { await load(); } catch (error) { grid.innerHTML = emptyState('Não foi possível carregar as sugestões', error.message, 'alert'); }
  });
})();

(() => {
  const { api, ready, escapeHTML, formatDate, formatDateTime, relativeDate, emptyState, skeleton, showToast, setLoading, icons } = window.INF25B;
  const state = { notices: [], tasks: [], events: [], polls: [], materials: [], suggestions: [], users: [], logs: [], stats: {} };

  function setupTabs() {
    document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(item => item.classList.toggle('active', item === button));
      document.querySelectorAll('[data-panel]').forEach(panel => panel.hidden = panel.dataset.panel !== button.dataset.tab);
    }));
  }

  function toLocalInput(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function formObject(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    form.querySelectorAll('input[type="checkbox"]').forEach(input => data[input.name] = input.checked);
    return data;
  }

  function setFormValues(form, item, keys) {
    keys.forEach(key => {
      const input = form.elements[key];
      if (!input) return;
      if (input.type === 'checkbox') input.checked = Boolean(item[key]);
      else if (input.type === 'datetime-local') input.value = toLocalInput(item[key]);
      else input.value = item[key] ?? '';
    });
    form.dataset.editId = item._id;
    const button = form.querySelector('button[type="submit"]');
    button.textContent = 'Salvar alterações';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetForm(form) {
    form.reset();
    delete form.dataset.editId;
    const button = form.querySelector('button[type="submit"]');
    const labels = { noticeForm: 'Publicar aviso', academicForm: 'Cadastrar item', eventForm: 'Criar evento', pollForm: 'Criar enquete', materialForm: 'Adicionar material' };
    button.textContent = labels[form.id] || 'Salvar';
  }

  function renderStats() {
    const cards = [
      ['totalUsuarios', 'Usuários ativos', 'user', 'var(--primary-2)', 'var(--primary-soft)'],
      ['online', 'Online agora', 'wifi', 'var(--success)', 'var(--success-soft)'],
      ['tarefas', 'Prazos ativos', 'calendar', 'var(--warning)', 'var(--warning-soft)'],
      ['sugestoes', 'Sugestões abertas', 'bulb', 'var(--info)', 'var(--info-soft)'],
      ['avisos', 'Avisos ativos', 'bell', 'var(--danger)', 'var(--danger-soft)'],
      ['eventos', 'Eventos futuros', 'party', 'var(--cyan)', 'var(--cyan-soft)'],
      ['enquetes', 'Enquetes ativas', 'book', 'var(--primary-2)', 'var(--primary-soft)'],
      ['materiais', 'Materiais', 'shield', 'var(--info)', 'var(--info-soft)']
    ];
    document.getElementById('adminStats').innerHTML = cards.map(([key, label, icon, color, soft]) => `<article class="stat-card" style="--stat-color:${color};--stat-soft:${soft}"><span class="stat-card-icon">${icons[icon]}</span><strong>${state.stats[key] || 0}</strong><p>${label}</p></article>`).join('');
  }

  function actionButtons(type, id, allowEdit = true) {
    return `<div class="card-actions">${allowEdit ? `<button type="button" data-edit-type="${type}" data-id="${id}" aria-label="Editar"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/></svg></button>` : ''}<button class="danger" type="button" data-delete-type="${type}" data-id="${id}" aria-label="Remover"><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/></svg></button></div>`;
  }

  function renderNotices() {
    const list = document.getElementById('adminNoticeList');
    list.innerHTML = state.notices.length ? state.notices.map(item => `<article class="list-item"><span class="item-dot" style="--item-color:${item.prioridade === 'urgente' ? 'var(--danger)' : item.prioridade === 'importante' ? 'var(--warning)' : 'var(--info)'}"></span><div class="item-copy"><strong>${escapeHTML(item.titulo)}</strong><p>${escapeHTML(item.descricao)}</p></div><div class="item-meta"><span class="badge ${item.ativo ? 'success' : 'muted'}">${item.ativo ? item.prioridade : 'arquivado'}</span>${actionButtons('notice', item._id)}</div></article>`).join('') : emptyState('Nenhum aviso', 'Publique o primeiro aviso oficial.', 'bell');
  }

  function renderTasks() {
    const list = document.getElementById('adminAcademicList');
    list.innerHTML = state.tasks.length ? state.tasks.map(item => `<article class="list-item"><span class="item-dot" style="--item-color:${item.tipo === 'prova' ? 'var(--danger)' : 'var(--warning)'}"></span><div class="item-copy"><strong>${escapeHTML(item.conteudo)}</strong><p>${escapeHTML(item.materia)} • ${formatDateTime(item.dataEntrega)} • ${escapeHTML(item.status || 'ativa')}</p></div><div class="item-meta"><span class="badge ${item.tipo === 'prova' ? 'urgent' : 'important'}">${item.tipo}</span>${actionButtons('task', item._id)}</div></article>`).join('') : emptyState('Nenhum item acadêmico', 'Cadastre uma prova ou tarefa.', 'calendar');
  }

  function renderEvents() {
    const list = document.getElementById('adminEventList');
    list.innerHTML = state.events.length ? state.events.map(item => `<article class="list-item"><span class="item-dot" style="--item-color:var(--cyan);--item-soft:var(--cyan-soft)"></span><div class="item-copy"><strong>${escapeHTML(item.titulo)}</strong><p>${formatDateTime(item.dataInicio)}${item.local ? ` • ${escapeHTML(item.local)}` : ''}</p></div><div class="item-meta"><span class="badge ${item.ativo ? 'success' : 'muted'}">${item.ativo ? item.tipo : 'arquivado'}</span>${actionButtons('event', item._id)}</div></article>`).join('') : emptyState('Nenhum evento', 'Crie o próximo encontro da turma.', 'party');
  }

  function renderPolls() {
    const list = document.getElementById('adminPollList');
    list.innerHTML = state.polls.length ? state.polls.map(item => `<article class="list-item"><span class="item-dot" style="--item-color:var(--primary-2);--item-soft:var(--primary-soft)"></span><div class="item-copy"><strong>${escapeHTML(item.pergunta)}</strong><p>${item.opcoes.length} opções • encerra ${formatDateTime(item.encerraEm)}</p></div><div class="item-meta"><span class="badge ${item.ativa && !item.encerrada ? 'success' : 'muted'}">${item.ativa && !item.encerrada ? 'ativa' : 'encerrada'}</span>${actionButtons('poll', item._id, false)}</div></article>`).join('') : emptyState('Nenhuma enquete', 'Crie uma votação com prazo definido.', 'book');
  }

  function renderMaterials() {
    const list = document.getElementById('adminMaterialList');
    list.innerHTML = state.materials.length ? state.materials.map(item => `<article class="list-item"><span class="item-dot" style="--item-color:var(--info);--item-soft:var(--info-soft)"></span><div class="item-copy"><strong>${escapeHTML(item.titulo)}</strong><p>${escapeHTML(item.materia)} • ${escapeHTML(item.tipo)}</p></div><div class="item-meta"><span class="badge ${item.ativo ? 'info' : 'muted'}">${item.ativo ? 'ativo' : 'arquivado'}</span>${actionButtons('material', item._id)}</div></article>`).join('') : emptyState('Nenhum material', 'Adicione recursos por matéria.', 'book');
  }

  function renderSuggestions() {
    const grid = document.getElementById('adminSuggestionGrid');
    grid.innerHTML = state.suggestions.length ? state.suggestions.map(item => `<article class="content-card"><div class="content-card-header"><div><span class="badge info">${escapeHTML(item.tipo)}</span><h3 style="margin-top:10px">${escapeHTML(item.titulo)}</h3></div><span class="badge muted">${escapeHTML(item.autor?.nome || 'Aluno')}</span></div><p>${escapeHTML(item.descricao || item.texto || '')}</p><div class="field" style="margin-top:12px"><label>Status</label><select class="select" data-suggestion-status="${item._id}"><option value="aguardando" ${item.status === 'aguardando' ? 'selected' : ''}>Em análise</option><option value="aceita" ${item.status === 'aceita' ? 'selected' : ''}>Aceita</option><option value="recusada" ${item.status === 'recusada' ? 'selected' : ''}>Recusada</option><option value="em_andamento" ${item.status === 'em_andamento' ? 'selected' : ''}>Em andamento</option><option value="finalizado" ${item.status === 'finalizado' ? 'selected' : ''}>Finalizada</option></select></div><div class="field" style="margin-top:9px"><label>Resposta ao aluno</label><textarea class="textarea" data-suggestion-response="${item._id}" maxlength="800">${escapeHTML(item.respostaAdmin || '')}</textarea></div><div class="content-card-footer"><span class="meta-line">${relativeDate(item.criadaEm)}</span><div class="card-actions"><button class="button small primary" data-save-suggestion="${item._id}" type="button">Salvar</button><button class="button small danger" data-remove-suggestion="${item._id}" type="button">Excluir</button></div></div></article>`).join('') : emptyState('Fila vazia', 'Nenhuma sugestão enviada até agora.', 'bulb');
  }

  function renderUsers() {
    const table = document.getElementById('adminUserTable');
    table.innerHTML = state.users.map(item => `<tr><td>${escapeHTML(item.nome)}</td><td>${escapeHTML(item.email)}</td><td><select class="select" data-user-role="${item.id}" style="height:34px;width:110px"><option value="aluno" ${item.role === 'aluno' ? 'selected' : ''}>Aluno</option><option value="admin" ${item.role === 'admin' ? 'selected' : ''}>Admin</option></select></td><td><span class="badge ${item.online ? 'success' : item.ativo ? 'muted' : 'urgent'}">${item.online ? 'online' : item.ativo ? 'offline' : 'bloqueado'}</span></td><td><button class="button small ${item.ativo ? 'danger' : 'success'}" data-toggle-user="${item.id}" data-active="${item.ativo}">${item.ativo ? 'Bloquear' : 'Ativar'}</button></td></tr>`).join('');
    document.querySelectorAll('[data-user-role]').forEach(select => select.addEventListener('change', async () => {
      try { await api(`/usuarios/${select.dataset.userRole}`, { method: 'PATCH', body: JSON.stringify({ role: select.value }) }); showToast('Papel atualizado.'); } catch (error) { showToast(error.message, 'error'); }
    }));
    document.querySelectorAll('[data-toggle-user]').forEach(button => button.addEventListener('click', async () => {
      try { await api(`/usuarios/${button.dataset.toggleUser}`, { method: 'PATCH', body: JSON.stringify({ ativo: button.dataset.active !== 'true' }) }); await loadUsers(); showToast('Status da conta atualizado.'); } catch (error) { showToast(error.message, 'error'); }
    }));
    const logs = document.getElementById('adminLogList');
    logs.innerHTML = state.logs.length ? state.logs.slice(0, 40).map(log => `<article class="list-item"><span class="item-dot" style="--item-color:${log.sucesso ? 'var(--success)' : 'var(--danger)'};--item-soft:${log.sucesso ? 'var(--success-soft)' : 'var(--danger-soft)'}"></span><div class="item-copy"><strong>${escapeHTML(log.nome || log.email)}</strong><p>${escapeHTML(log.motivo || 'Acesso')} • ${escapeHTML(log.ip || 'IP não informado')}</p></div><div class="item-meta"><span>${formatDateTime(log.criadoEm)}</span></div></article>`).join('') : emptyState('Sem logs', 'Ainda não há registros de acesso.', 'shield');
  }

  function bindListActions() {
    document.querySelectorAll('[data-edit-type]').forEach(button => button.onclick = () => {
      const type = button.dataset.editType;
      const id = button.dataset.id;
      const config = {
        notice: [state.notices, 'noticeForm', ['titulo', 'descricao', 'prioridade', 'categoria', 'iniciaEm', 'expiraEm']],
        task: [state.tasks, 'academicForm', ['tipo', 'materia', 'conteudo', 'descricao', 'dataInicio', 'dataEntrega', 'consulta', 'tipoEntrega', 'grupo', 'numMembros']],
        event: [state.events, 'eventForm', ['titulo', 'descricao', 'tipo', 'dataInicio', 'dataFim', 'local', 'limiteParticipantes']],
        material: [state.materials, 'materialForm', ['titulo', 'descricao', 'materia', 'tipo', 'url']]
      }[type];
      if (!config) return;
      const [collection, formId, keys] = config;
      const item = collection.find(entry => entry._id === id);
      if (item) setFormValues(document.getElementById(formId), item, keys);
    });
    document.querySelectorAll('[data-delete-type]').forEach(button => button.onclick = async () => {
      if (!confirm('Remover ou arquivar este item?')) return;
      const routes = { notice: 'avisos', task: 'tarefas', event: 'eventos', poll: 'enquetes', material: 'materiais' };
      try {
        await api(`/${routes[button.dataset.deleteType]}/${button.dataset.id}`, { method: 'DELETE' });
        await loadAll();
        showToast('Item removido ou arquivado.');
      } catch (error) { showToast(error.message, 'error'); }
    });
  }

  function bindSuggestionActions() {
    document.querySelectorAll('[data-save-suggestion]').forEach(button => button.onclick = async () => {
      const id = button.dataset.saveSuggestion;
      const status = document.querySelector(`[data-suggestion-status="${id}"]`).value;
      const respostaAdmin = document.querySelector(`[data-suggestion-response="${id}"]`).value.trim();
      setLoading(button, true, 'Salvando…');
      try { await api(`/sugestoes/${id}`, { method: 'PATCH', body: JSON.stringify({ status, respostaAdmin }) }); await loadSuggestions(); showToast('Sugestão atualizada.'); } catch (error) { showToast(error.message, 'error'); setLoading(button, false); }
    });
    document.querySelectorAll('[data-remove-suggestion]').forEach(button => button.onclick = async () => {
      if (!confirm('Excluir definitivamente esta sugestão?')) return;
      try { await api(`/sugestoes/${button.dataset.removeSuggestion}`, { method: 'DELETE' }); await loadSuggestions(); showToast('Sugestão excluída.'); } catch (error) { showToast(error.message, 'error'); }
    });
  }

  async function submitCrud(form, route, transform = value => value) {
    const button = form.querySelector('button[type="submit"]');
    setLoading(button, true, form.dataset.editId ? 'Salvando…' : 'Criando…');
    try {
      const payload = transform(formObject(form));
      const path = form.dataset.editId ? `/${route}/${form.dataset.editId}` : `/${route}`;
      await api(path, { method: form.dataset.editId ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      resetForm(form);
      await loadAll();
      showToast('Conteúdo salvo com sucesso.');
    } catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(button, false); }
  }

  document.getElementById('noticeForm').addEventListener('submit', event => { event.preventDefault(); submitCrud(event.target, 'avisos', data => ({ ...data, iniciaEm: data.iniciaEm || null, expiraEm: data.expiraEm || null })); });
  document.getElementById('academicForm').addEventListener('submit', event => { event.preventDefault(); submitCrud(event.target, 'tarefas', data => ({ ...data, dataInicio: data.dataInicio || null })); });
  document.getElementById('eventForm').addEventListener('submit', event => { event.preventDefault(); submitCrud(event.target, 'eventos', data => ({ ...data, dataFim: data.dataFim || null, limiteParticipantes: data.limiteParticipantes || null })); });
  document.getElementById('pollForm').addEventListener('submit', event => { event.preventDefault(); submitCrud(event.target, 'enquetes', data => ({ ...data, opcoes: data.opcoes.split('\n').map(item => item.trim()).filter(Boolean) })); });
  document.getElementById('materialForm').addEventListener('submit', event => { event.preventDefault(); submitCrud(event.target, 'materiais'); });

  async function loadUsers() {
    [state.users, state.logs] = await Promise.all([api('/admin/usuarios'), api('/admin/logs?limit=100')]);
    renderUsers();
  }
  async function loadSuggestions() { state.suggestions = await api('/sugestoes'); renderSuggestions(); bindSuggestionActions(); }

  async function loadAll() {
    const results = await Promise.all([
      api('/admin/stats'), api('/avisos?todos=1'), api('/tarefas'), api('/eventos?todos=1'), api('/enquetes?todas=1'), api('/materiais?todos=1'), api('/sugestoes'), api('/admin/usuarios'), api('/admin/logs?limit=100')
    ]);
    [state.stats, state.notices, state.tasks, state.events, state.polls, state.materials, state.suggestions, state.users, state.logs] = results;
    renderStats(); renderNotices(); renderTasks(); renderEvents(); renderPolls(); renderMaterials(); renderSuggestions(); renderUsers(); bindListActions(); bindSuggestionActions();
  }

  setupTabs();
  document.getElementById('refreshAdmin').addEventListener('click', async event => {
    setLoading(event.currentTarget, true, 'Atualizando…');
    try { await loadAll(); showToast('Dados atualizados.'); } catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(event.currentTarget, false); }
  });

  ready(async user => {
    if (user.role !== 'admin') {
      showToast('Esta área é restrita à administração.', 'error');
      setTimeout(() => location.replace('telaInicial.html'), 500);
      return;
    }
    document.getElementById('adminStats').innerHTML = skeleton(4);
    ['adminNoticeList', 'adminAcademicList', 'adminEventList', 'adminPollList', 'adminMaterialList', 'adminSuggestionGrid', 'adminLogList'].forEach(id => document.getElementById(id).innerHTML = skeleton(3));
    try { await loadAll(); } catch (error) { showToast(error.message, 'error'); }
  });
})();

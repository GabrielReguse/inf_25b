(() => {
  const { api, ready, escapeHTML, relativeDate, emptyState, skeleton, showToast, setLoading, setSession, readSession, initials, enableNotifications, applyTheme, logout, icons } = window.INF25B;
  let user = null;

  function paintProfile() {
    document.getElementById('profileName').textContent = user.nome;
    document.getElementById('profileRole').textContent = user.role === 'admin' ? 'Administrador da turma' : 'Aluno da INF 25B';
    document.getElementById('profileNameInput').value = user.nome || '';
    document.getElementById('profileEmailInput').value = user.email || '';
    document.getElementById('profileBioInput').value = user.descricao || '';
    const photo = document.getElementById('profilePhoto');
    photo.innerHTML = user.fotoPerfil ? `<img src="${escapeHTML(user.fotoPerfil)}" alt="Foto de ${escapeHTML(user.nome)}">` : escapeHTML(initials(user.nome));
    document.getElementById('notificationSwitch').checked = Boolean(user.preferencias?.notificacoes && 'Notification' in window && Notification.permission === 'granted');
    document.getElementById('themeSelect').value = localStorage.getItem('inf25b_theme') || 'dark';
  }

  async function loadSuggestions() {
    const list = document.getElementById('mySuggestionList');
    list.innerHTML = skeleton(3);
    try {
      const items = await api('/sugestoes?minhas=1');
      list.innerHTML = items.length ? items.slice(0, 5).map(item => `<a class="list-item" href="sugestoes.html"><span class="item-dot" style="--item-color:${item.status === 'recusada' ? 'var(--danger)' : item.status === 'finalizado' ? 'var(--success)' : 'var(--primary-2)'}"></span><div class="item-copy"><strong>${escapeHTML(item.titulo)}</strong><p>${escapeHTML(item.status.replace('_', ' '))} • ${relativeDate(item.criadaEm)}</p></div><div class="item-meta">${icons.chevron}</div></a>`).join('') : emptyState('Nenhuma sugestão enviada', 'Suas propostas aparecerão aqui.', 'bulb');
    } catch (error) {
      list.innerHTML = emptyState('Histórico indisponível', error.message, 'alert');
    }
  }

  document.getElementById('profileForm').addEventListener('submit', async event => {
    event.preventDefault();
    const button = document.getElementById('profileSave');
    setLoading(button, true, 'Salvando…');
    try {
      const result = await api(`/usuarios/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ nome: document.getElementById('profileNameInput').value.trim(), descricao: document.getElementById('profileBioInput').value.trim(), preferencias: user.preferencias })
      });
      user = result.usuario;
      setSession({ token: readSession().token, usuario: user });
      paintProfile();
      showToast('Perfil atualizado.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(button, false);
    }
  });

  document.getElementById('profilePhotoInput').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return showToast('A imagem deve ter no máximo 8 MB.', 'error');
    const formData = new FormData();
    formData.append('foto', file);
    try {
      showToast('Enviando a foto…');
      const result = await api(`/usuarios/${user.id}/foto`, { method: 'POST', body: formData });
      user.fotoPerfil = result.url;
      setSession({ token: readSession().token, usuario: user });
      paintProfile();
      showToast('Foto atualizada.');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      event.target.value = '';
    }
  });

  document.getElementById('notificationSwitch').addEventListener('change', async event => {
    if (event.target.checked) {
      await enableNotifications();
      event.target.checked = Boolean('Notification' in window && Notification.permission === 'granted');
      user.preferencias = { ...(user.preferencias || {}), notificacoes: event.target.checked };
      try { await api(`/usuarios/${user.id}`, { method: 'PATCH', body: JSON.stringify({ preferencias: user.preferencias }) }); } catch (error) { showToast(error.message, 'error'); }
      return;
    }
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await api('/push/inscrever', { method: 'DELETE', body: JSON.stringify({ endpoint: subscription.endpoint }) });
          await subscription.unsubscribe();
        } else await api('/push/inscrever', { method: 'DELETE', body: JSON.stringify({}) });
      }
      user.preferencias = { ...(user.preferencias || {}), notificacoes: false };
      await api(`/usuarios/${user.id}`, { method: 'PATCH', body: JSON.stringify({ preferencias: user.preferencias }) });
      showToast('Notificações desativadas.');
    } catch (error) {
      event.target.checked = true;
      showToast(error.message, 'error');
    }
  });

  document.getElementById('themeSelect').addEventListener('change', async event => {
    applyTheme(event.target.value);
    user.preferencias = { ...(user.preferencias || {}), tema: event.target.value === 'dark' ? 'escuro' : event.target.value === 'light' ? 'claro' : 'sistema' };
    try { await api(`/usuarios/${user.id}`, { method: 'PATCH', body: JSON.stringify({ preferencias: user.preferencias }) }); } catch {}
  });

  document.getElementById('logoutButton').addEventListener('click', () => {
    if (confirm('Sair da sua conta neste dispositivo?')) logout();
  });

  ready(async current => {
    try {
      user = await api(`/usuarios/${current.id}`);
      paintProfile();
      loadSuggestions();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
})();

(() => {
  const { api, ready, escapeHTML, initials, formatDateTime, emptyState, skeleton, showToast, setLoading, icons } = window.INF25B;
  const state = { user: null, conversations: [], current: { tipo: 'grupo', id: 'grupo', nome: 'Turma INF 25B' }, messages: [], replyTo: null, recorder: null, chunks: [], polling: null };
  const layout = document.getElementById('chatLayout');
  const conversationList = document.getElementById('conversationList');
  const messageList = document.getElementById('messageList');
  const input = document.getElementById('messageInput');

  function avatarHTML(person, className = 'conversation-avatar') {
    const name = person.nome || 'Usuário';
    const photo = person.foto || person.fotoPerfil;
    return `<span class="${className}">${photo ? `<img src="${escapeHTML(photo)}" alt="">` : escapeHTML(initials(name))}${person.online ? '<i class="online-dot"></i>' : ''}</span>`;
  }

  function renderConversations() {
    const query = document.getElementById('conversationSearch').value.trim().toLowerCase();
    const items = state.conversations.filter(item => item.nome.toLowerCase().includes(query));
    conversationList.innerHTML = items.length ? items.map(item => `<button class="conversation-item ${state.current.tipo === item.tipo && state.current.id === item.id ? 'active' : ''}" type="button" data-conversation-type="${item.tipo}" data-conversation-id="${item.id}">${avatarHTML(item)}<span class="conversation-copy"><strong>${escapeHTML(item.nome)}</strong><span>${escapeHTML(item.ultimaMsg ? `${item.ultimaMsg.autorNome}: ${item.ultimaMsg.texto}` : item.tipo === 'grupo' ? 'Conversa geral da turma' : 'Inicie uma conversa')}</span></span><span class="conversation-time">${item.ultimaMsg?.criadaEm ? new Date(item.ultimaMsg.criadaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</span></button>`).join('') : emptyState('Nenhuma conversa encontrada', 'Busque outro nome ou comece uma nova conversa.', 'chat');
    conversationList.querySelectorAll('[data-conversation-id]').forEach(button => button.addEventListener('click', () => {
      const item = state.conversations.find(conv => conv.tipo === button.dataset.conversationType && conv.id === button.dataset.conversationId);
      if (item) selectConversation(item);
    }));
  }

  async function loadConversations() {
    state.conversations = await api(`/conversas/${state.user.id}`);
    renderConversations();
  }

  async function selectConversation(item) {
    state.current = item;
    state.replyTo = null;
    updateReplyPreview();
    layout.classList.add('conversation-open');
    document.getElementById('chatTitle').textContent = item.nome;
    document.getElementById('chatStatus').textContent = item.tipo === 'grupo' ? 'Conversa geral da turma' : item.online ? 'Online agora' : 'Conversa direta';
    const avatar = document.getElementById('chatAvatar');
    avatar.innerHTML = item.foto ? `<img src="${escapeHTML(item.foto)}" alt="">` : escapeHTML(initials(item.nome));
    renderConversations();
    await loadMessages(false);
    input.focus();
  }

  function normalizeMessage(message) {
    const author = state.current.tipo === 'grupo' ? message.autor : message.de;
    return {
      id: message._id,
      authorId: String(author?._id || author || ''),
      authorName: author?.nome || 'Usuário',
      authorPhoto: author?.fotoPerfil || '',
      authorRole: author?.role || 'aluno',
      text: message.texto || '',
      type: message.tipo || 'texto',
      mediaUrl: message.mediaUrl || '',
      duration: message.duracao || '0:00',
      createdAt: message.criadaEm,
      editedAt: message.editadaEm,
      replyTo: message.replyTo || null
    };
  }

  function replySnippet(reply) {
    if (!reply) return '';
    const author = reply.autor?.nome || reply.de?.nome || 'Usuário';
    const text = reply.texto || (reply.tipo === 'imagem' ? 'Imagem' : reply.tipo === 'audio' ? 'Áudio' : 'Mensagem');
    return `<div class="reply-preview"><strong>${escapeHTML(author)}</strong><br>${escapeHTML(text.slice(0, 110))}</div>`;
  }

  function renderMessages({ preserveScroll = false } = {}) {
    const previousBottom = messageList.scrollHeight - messageList.scrollTop;
    if (!state.messages.length) {
      messageList.innerHTML = `<div class="chat-empty">${icons.chat}<strong>Comece a conversa</strong><p>Envie uma mensagem clara, respeitosa e minimamente compreensível. A gramática agradece.</p></div>`;
      return;
    }
    let html = '';
    let lastDate = '';
    let lastAuthor = '';
    state.messages.forEach(raw => {
      const message = normalizeMessage(raw);
      const mine = message.authorId === String(state.user.id);
      const date = new Date(message.createdAt);
      const dayKey = date.toLocaleDateString('pt-BR');
      if (dayKey !== lastDate) {
        html += `<div class="message-day"><span>${escapeHTML(date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }))}</span></div>`;
        lastDate = dayKey;
        lastAuthor = '';
      }
      const sameAuthor = lastAuthor === message.authorId;
      const canDelete = mine || state.user.role === 'admin';
      const media = message.type === 'imagem' ? `<div class="message-media"><img src="${escapeHTML(message.mediaUrl)}" alt="Imagem enviada por ${escapeHTML(message.authorName)}" loading="lazy" data-image-view></div>` : message.type === 'audio' ? `<div class="message-media"><audio controls preload="metadata" src="${escapeHTML(message.mediaUrl)}"></audio></div>` : '';
      html += `<div class="message-row ${mine ? 'mine' : ''} ${sameAuthor ? 'same-author' : ''}" data-message-id="${message.id}">${!mine && !sameAuthor ? `<span class="message-row-avatar">${message.authorPhoto ? `<img src="${escapeHTML(message.authorPhoto)}" alt="">` : escapeHTML(initials(message.authorName))}</span>` : !mine ? '<span class="message-row-avatar" style="visibility:hidden"></span>' : ''}<article class="message-bubble">${!mine && !sameAuthor ? `<span class="message-author">${escapeHTML(message.authorName)}${message.authorRole === 'admin' ? ' • ADM' : ''}</span>` : ''}${replySnippet(message.replyTo)}${media}${message.text ? `<p class="message-text">${escapeHTML(message.text)}</p>` : ''}<div class="message-meta"><span>${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>${message.editedAt ? '<span>editada</span>' : ''}</div><div class="message-actions"><button type="button" data-reply-message="${message.id}" aria-label="Responder"><svg viewBox="0 0 24 24"><path d="m9 17-5-5 5-5M4 12h10a6 6 0 0 1 6 6v1"/></svg></button>${canDelete ? `<button type="button" data-delete-message="${message.id}" aria-label="Apagar"><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>` : ''}</div></article></div>`;
      lastAuthor = message.authorId;
    });
    messageList.innerHTML = html;
    if (preserveScroll) messageList.scrollTop = Math.max(0, messageList.scrollHeight - previousBottom);
    else messageList.scrollTop = messageList.scrollHeight;
    bindMessageActions();
  }

  function bindMessageActions() {
    messageList.querySelectorAll('[data-reply-message]').forEach(button => button.addEventListener('click', () => {
      state.replyTo = state.messages.find(item => item._id === button.dataset.replyMessage);
      updateReplyPreview();
      input.focus();
    }));
    messageList.querySelectorAll('[data-delete-message]').forEach(button => button.addEventListener('click', async () => {
      if (!confirm('Apagar esta mensagem?')) return;
      try {
        const path = state.current.tipo === 'grupo' ? `/mensagens/${button.dataset.deleteMessage}` : `/mensagens-diretas/${button.dataset.deleteMessage}`;
        await api(path, { method: 'DELETE' });
        await loadMessages(false);
        showToast('Mensagem apagada.');
      } catch (error) { showToast(error.message, 'error'); }
    }));
    messageList.querySelectorAll('[data-image-view]').forEach(image => image.addEventListener('click', () => window.open(image.src, '_blank', 'noopener')));
  }

  function updateReplyPreview() {
    const container = document.getElementById('composerReply');
    if (!state.replyTo) return container.classList.remove('visible');
    const normalized = normalizeMessage(state.replyTo);
    document.getElementById('composerReplyText').innerHTML = `<strong>Respondendo a ${escapeHTML(normalized.authorName)}</strong> — ${escapeHTML((normalized.text || normalized.type).slice(0, 90))}`;
    container.classList.add('visible');
  }

  async function loadMessages(preserveScroll = true) {
    try {
      const data = state.current.tipo === 'grupo' ? await api('/mensagens?limit=150') : await api(`/mensagens-diretas/${state.user.id}/${state.current.id}`);
      const changed = JSON.stringify(data.map(item => [item._id, item.atualizadaEm, item.texto])) !== JSON.stringify(state.messages.map(item => [item._id, item.atualizadaEm, item.texto]));
      state.messages = data;
      if (changed || !messageList.children.length) renderMessages({ preserveScroll });
    } catch (error) {
      messageList.innerHTML = emptyState('Não foi possível carregar a conversa', error.message, 'alert');
    }
  }

  async function sendMessage({ text = '', type = 'texto', mediaUrl = '', duration = '0:00' } = {}) {
    if (!text.trim() && !mediaUrl) return;
    const button = document.getElementById('sendButton');
    setLoading(button, true, '');
    try {
      const payload = { texto: text.trim(), tipo: type, mediaUrl, duracao: duration, replyTo: state.replyTo?._id || null };
      if (state.current.tipo === 'grupo') await api('/mensagens', { method: 'POST', body: JSON.stringify(payload) });
      else await api('/mensagens-diretas', { method: 'POST', body: JSON.stringify({ ...payload, para: state.current.id }) });
      input.value = '';
      input.style.height = '';
      state.replyTo = null;
      updateReplyPreview();
      await Promise.all([loadMessages(false), loadConversations()]);
    } catch (error) { showToast(error.message, 'error'); }
    finally { setLoading(button, false); }
  }

  async function uploadMedia(file, type = null, duration = '0:00') {
    if (!file) return;
    const form = new FormData();
    form.append('midia', file, file.name || `audio-${Date.now()}.webm`);
    try {
      showToast('Enviando mídia…');
      const result = await api('/mensagens/upload', { method: 'POST', body: form });
      await sendMessage({ type: type || result.tipo, mediaUrl: result.url, duration });
    } catch (error) { showToast(error.message, 'error'); }
  }

  function openUserPicker() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<section class="user-picker" role="dialog" aria-modal="true"><header class="user-picker-head"><h3>Nova conversa</h3><button class="icon-button" type="button" data-close>${icons.x}</button></header><div style="padding:10px 12px"><label class="chat-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="userPickerSearch" type="search" placeholder="Buscar aluno"></label></div><div class="user-picker-list" id="userPickerList">${skeleton(5)}</div></section>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', event => { if (event.target === overlay || event.target.closest('[data-close]')) close(); });
    api('/usuarios').then(users => {
      const others = users.filter(item => String(item.id || item._id) !== String(state.user.id));
      const list = overlay.querySelector('#userPickerList');
      const render = query => {
        const filtered = others.filter(item => item.nome.toLowerCase().includes(query));
        list.innerHTML = filtered.map(item => `<button class="user-picker-item" type="button" data-user-id="${item.id || item._id}">${avatarHTML({ ...item, foto: item.fotoPerfil }, 'conversation-avatar')}<span><strong>${escapeHTML(item.nome)}</strong><span>${item.online ? 'Online agora' : 'Iniciar conversa direta'}</span></span></button>`).join('') || emptyState('Ninguém encontrado', 'Tente outro nome.', 'user');
        list.querySelectorAll('[data-user-id]').forEach(button => button.addEventListener('click', () => {
          const person = others.find(item => String(item.id || item._id) === button.dataset.userId);
          close();
          selectConversation({ tipo: 'direto', id: button.dataset.userId, userId: button.dataset.userId, nome: person.nome, foto: person.fotoPerfil || null, online: person.online, ultimaMsg: null });
        }));
      };
      render('');
      overlay.querySelector('#userPickerSearch').addEventListener('input', event => render(event.target.value.trim().toLowerCase()));
    }).catch(error => showToast(error.message, 'error'));
  }

  async function toggleRecording() {
    const button = document.getElementById('recordButton');
    if (state.recorder?.state === 'recording') {
      state.recorder.stop();
      button.classList.remove('danger');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return showToast('Gravação de áudio não é compatível com este navegador.', 'error');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.chunks = [];
      state.recordStartedAt = Date.now();
      state.recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '' });
      state.recorder.ondataavailable = event => { if (event.data.size) state.chunks.push(event.data); };
      state.recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const seconds = Math.max(1, Math.round((Date.now() - state.recordStartedAt) / 1000));
        const duration = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
        const blob = new Blob(state.chunks, { type: state.recorder.mimeType || 'audio/webm' });
        await uploadMedia(new File([blob], `audio-${Date.now()}.webm`, { type: blob.type }), 'audio', duration);
      };
      state.recorder.start();
      button.classList.add('danger');
      showToast('Gravando. Clique novamente para enviar.');
    } catch (error) { showToast('Não foi possível acessar o microfone.', 'error'); }
  }

  document.getElementById('conversationSearch').addEventListener('input', renderConversations);
  document.getElementById('newConversationButton').addEventListener('click', openUserPicker);
  document.getElementById('chatBack').addEventListener('click', () => layout.classList.remove('conversation-open'));
  document.getElementById('refreshMessages').addEventListener('click', () => loadMessages(false));
  document.getElementById('cancelReply').addEventListener('click', () => { state.replyTo = null; updateReplyPreview(); });
  document.getElementById('sendButton').addEventListener('click', () => sendMessage({ text: input.value }));
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage({ text: input.value }); }
  });
  input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = `${Math.min(input.scrollHeight, 128)}px`; });
  document.getElementById('attachButton').addEventListener('click', () => document.getElementById('mediaInput').click());
  document.getElementById('mediaInput').addEventListener('change', event => { uploadMedia(event.target.files?.[0], 'imagem'); event.target.value = ''; });
  document.getElementById('recordButton').addEventListener('click', toggleRecording);

  ready(async user => {
    state.user = user;
    conversationList.innerHTML = skeleton(7);
    messageList.innerHTML = skeleton(8);
    try {
      await loadConversations();
      const group = state.conversations.find(item => item.tipo === 'grupo') || state.current;
      await selectConversation(group);
      state.polling = setInterval(() => { if (!document.hidden) { loadMessages(true); loadConversations(); } }, 5000);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) loadMessages(true); });
    } catch (error) {
      conversationList.innerHTML = emptyState('Conversa indisponível', error.message, 'alert');
    }
  });
})();

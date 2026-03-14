const API = "https://inf-25b-backend.onrender.com";

// ─── PWA HEIGHT FIX ───────────────────────────────────────────────────────────
(function fixPWAHeight() {
  function aplicar() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  aplicar();
  window.addEventListener('resize', aplicar, { passive: true });
})();

// ─── ANIMATION FALLBACK ───────────────────────────────────────────────────────
(function fixPageAnimation() {
  const page = document.getElementById('page');
  if (!page) return;
  const forcar = () => {
    page.style.opacity = '1';
    page.style.transform = 'none';
  };
  page.addEventListener('animationend', forcar, { once: true });
  setTimeout(forcar, 500);
})();

// ─── SESSÃO ───────────────────────────────────────────────────────────────────
const usuario = (() => {
  try {
    return JSON.parse(
      sessionStorage.getItem('usuario') ||
      localStorage.getItem('usuario') ||
      '{}'
    );
  } catch { return {}; }
})();

const meuNome = usuario.nome || 'Você';
const meuId = usuario.id || null;
const minhaFoto = usuario.fotoPerfil || null;
const isAdmin = usuario.role === 'admin';

// ─── ESTADO ───────────────────────────────────────────────────────────────────
let mensagens = [];
let conversas = [];
let conversaAtiva = { tipo: 'grupo', id: 'grupo', nome: 'Turma INF 25B' };
let imagemPendente = null;
let mediaRecorder = null;
let gravando = false;
let chunksAudio = [];
let timerGrav = null;
let segundosGrav = 0;
let poolingInterval = null;
let conversasInterval = null;
let replyAlvo = null;
let todosUsuarios = [];
let mentionAtivo = false;
let mentionIndex = 0;
let mencoesAtivas = new Set();
let carregamentoInicial = true;

// ─── DOM ──────────────────────────────────────────────────────────────────────
const elChat = document.getElementById('chatArea');
const elInput = document.getElementById('inputTexto');
const elBtnEnviar = document.getElementById('btnEnviar');
const elBtnFoto = document.getElementById('btnFoto');
const elInputFoto = document.getElementById('inputFoto');
const elBtnAudio = document.getElementById('btnAudio');
const elPreview = document.getElementById('previewImgWrap');
const elPreviewImg = document.getElementById('previewImgThumb');
const elPreviewNome = document.getElementById('previewImgNome');
const elPreviewRem = document.getElementById('previewImgRemove');
const elReplyBar = document.getElementById('replyBar');
const elReplyTexto = document.getElementById('replyBarTexto');
const elReplyFechar = document.getElementById('replyBarFechar');
const elSidebar = document.getElementById('sidebar');
const elOverlay = document.getElementById('sidebarOverlay');
const elSidebarLista = document.getElementById('sidebarLista');
const elSidebarLoading = document.getElementById('sidebarLoading');
const elSidebarBusca = document.getElementById('sidebarBusca');
const elBtnAbrir = document.getElementById('btnAbrirSidebar');
const elSidebarFechar = document.getElementById('sidebarFecharBtn');
const elHeaderTitulo = document.getElementById('headerTitulo');
const elHeaderSub = document.getElementById('headerSubtitulo');
const elHeaderAvatarImg = document.getElementById('headerAvatarImg');

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────
function hoje() {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function hora() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function gerarOnda() {
  return Array.from({ length: 20 }, () => Math.floor(Math.random() * 14) + 4);
}

function escapeHTML(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function avatarHTML(foto, nome) {
  if (foto) return `<img src="${foto}" alt="${escapeHTML(nome)}"/>`;
  return `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
}

function ondaHTML(onda) {
  return onda.map(h => `<div class="audio-onda-bar" style="height:${h}px"></div>`).join('');
}

function scrollBaixo() {
  requestAnimationFrame(() => { elChat.scrollTop = elChat.scrollHeight; });
}

function estaNoFundo() {
  return elChat.scrollHeight - elChat.scrollTop - elChat.clientHeight < 80;
}

function mesmoBlocoTempo(a, b) {
  return a && b && a.autor === b.autor && a.hora === b.hora && a.data === b.data;
}

function formatarHoraRelativa(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const agora = new Date();
  const diffMs = agora - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffH < 24) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (diffD < 7) return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()];
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ─── UNREAD TRACKING ──────────────────────────────────────────────────────────
function getLastReadKey() {
  if (conversaAtiva.tipo === 'grupo') return 'inf25b_lr_grupo';
  return `inf25b_lr_dm_${conversaAtiva.id}`;
}

function getLastRead() {
  return localStorage.getItem(getLastReadKey()) || null;
}

function saveLastRead(msgId) {
  if (msgId) localStorage.setItem(getLastReadKey(), String(msgId));
}

function marcarTodasLidas() {
  if (mensagens.length > 0) {
    saveLastRead(mensagens[mensagens.length - 1].id);
    const item = document.querySelector(`.sidebar-item[data-id="${conversaAtiva.id}"]`);
    if (item) item.classList.remove('tem-nao-lidas');
  }
}

function atualizarBadge(conversaId, ultimaMsgId) {
  const item = document.querySelector(`.sidebar-item[data-id="${conversaId}"]`);
  if (!item || !ultimaMsgId) return;

  const chave = conversaId === 'grupo' ? 'inf25b_lr_grupo' : `inf25b_lr_dm_${conversaId}`;
  const lida = localStorage.getItem(chave);

  const temNaoLidas = !lida || String(lida) !== String(ultimaMsgId);
  item.classList.toggle('tem-nao-lidas', temNaoLidas);
}

// ─── MAPPERS ──────────────────────────────────────────────────────────────────
function mapearMsgGrupo(m) {
  const replyId = m.replyTo
    ? (m.replyTo._id ? String(m.replyTo._id) : String(m.replyTo))
    : null;

  const replyToData = (m.replyTo && typeof m.replyTo === 'object' && m.replyTo._id)
    ? { autor: m.replyTo.autor?.nome || 'Usuário', texto: m.replyTo.texto || '', tipo: m.replyTo.tipo || 'texto' }
    : null;

  return {
    id: m._id,
    autorId: String(m.autor?._id || m.autor),
    autor: m.autor?.nome || 'Usuário',
    foto: String(m.autor?._id || m.autor) === String(meuId) ? minhaFoto : (m.autor?.fotoPerfil || null),
    role: m.autor?.role || 'aluno',
    tipo: m.tipo || 'texto',
    conteudo: m.texto || '',
    src: m.mediaUrl || '',
    replyTo: replyId,
    replyToData,
    onda: gerarOnda(),
    duracao: m.duracao || '0:00',
    hora: new Date(m.criadaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    data: new Date(m.criadaEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    eu: String(m.autor?._id || m.autor) === String(meuId)
  };
}

function mapearMsgDireta(m) {
  const replyId = m.replyTo
    ? (m.replyTo._id ? String(m.replyTo._id) : String(m.replyTo))
    : null;

  const replyToData = (m.replyTo && typeof m.replyTo === 'object' && m.replyTo._id)
    ? { autor: m.replyTo.de?.nome || 'Usuário', texto: m.replyTo.texto || '', tipo: m.replyTo.tipo || 'texto' }
    : null;

  return {
    id: m._id,
    autorId: String(m.de?._id || m.de),
    autor: m.de?.nome || 'Usuário',
    foto: String(m.de?._id || m.de) === String(meuId) ? minhaFoto : (m.de?.fotoPerfil || null),
    role: m.de?.role || 'aluno',
    tipo: m.tipo || 'texto',
    conteudo: m.texto || '',
    src: m.mediaUrl || '',
    replyTo: replyId,
    replyToData,
    onda: gerarOnda(),
    duracao: m.duracao || '0:00',
    hora: new Date(m.criadaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    data: new Date(m.criadaEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    eu: String(m.de?._id || m.de) === String(meuId)
  };
}

function getMapear() {
  return conversaAtiva.tipo === 'grupo' ? mapearMsgGrupo : mapearMsgDireta;
}

function getApiUrl() {
  if (conversaAtiva.tipo === 'grupo') return `${API}/mensagens`;
  return `${API}/mensagens-diretas/${meuId}/${conversaAtiva.id}`;
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function abrirSidebar() {
  elSidebar.classList.add('aberta');
  elOverlay.classList.add('visivel');
}

function fecharSidebar() {
  elSidebar.classList.remove('aberta');
  elOverlay.classList.remove('visivel');
}

elBtnAbrir?.addEventListener('click', abrirSidebar);
elSidebarFechar?.addEventListener('click', fecharSidebar);
elOverlay?.addEventListener('click', fecharSidebar);

elSidebarBusca?.addEventListener('input', () => {
  const q = elSidebarBusca.value.toLowerCase().trim();
  document.querySelectorAll('.sidebar-item').forEach(item => {
    const nome = item.dataset.nome?.toLowerCase() || '';
    item.style.display = (!q || nome.includes(q)) ? '' : 'none';
  });
  document.querySelectorAll('.sidebar-secao').forEach(sec => {
    sec.style.display = '';
  });
});

// ─── RENDER SIDEBAR ───────────────────────────────────────────────────────────
function renderSidebar(lista) {
  if (elSidebarLoading) elSidebarLoading.remove();
  elSidebarLista.innerHTML = '';

  const grupos = lista.filter(c => c.tipo === 'grupo');
  if (grupos.length) {
    const secLabel = document.createElement('div');
    secLabel.className = 'sidebar-secao';
    secLabel.textContent = 'Conversa em grupo';
    elSidebarLista.appendChild(secLabel);
    grupos.forEach(c => elSidebarLista.appendChild(criarItemSidebar(c)));
  }

  const pessoais = lista.filter(c => c.tipo === 'direto');
  if (pessoais.length) {
    const secLabel2 = document.createElement('div');
    secLabel2.className = 'sidebar-secao';
    secLabel2.textContent = 'Conversas pessoais';
    elSidebarLista.appendChild(secLabel2);
    pessoais.forEach(c => elSidebarLista.appendChild(criarItemSidebar(c)));
  }

  lista.forEach(c => {
    if (c.ultimaMsg?.id) atualizarBadge(c.id, c.ultimaMsg.id);
  });

  marcarAtivo(conversaAtiva.id);
}

function criarItemSidebar(c) {
  const item = document.createElement('div');
  item.className = 'sidebar-item';
  item.dataset.id = c.id;
  item.dataset.nome = c.nome;

  let avatarConteudo = '';
  if (c.foto) {
    avatarConteudo = `<img src="${c.foto}" alt="${escapeHTML(c.nome)}"/>`;
  } else if (c.tipo === 'grupo') {
    avatarConteudo = `<svg viewBox="0 0 24 24" style="width:20px;height:20px;stroke:var(--purple-light);fill:none;stroke-width:1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
  } else {
    const iniciais = c.nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    avatarConteudo = `<span>${iniciais}</span>`;
  }

  const preview = c.ultimaMsg
    ? `<span class="sidebar-item-preview">${escapeHTML(c.ultimaMsg.autorNome !== 'Você' ? '' : 'Você: ')}${escapeHTML(c.ultimaMsg.texto.slice(0, 40))}</span>`
    : `<span class="sidebar-item-preview" style="opacity:.4">Sem mensagens</span>`;

  const hora = c.ultimaMsg ? formatarHoraRelativa(c.ultimaMsg.criadaEm) : '';

  item.innerHTML = `
    <div class="sidebar-item-avatar">
      ${avatarConteudo}
      <div class="sidebar-badge"></div>
    </div>
    <div class="sidebar-item-info">
      <div class="sidebar-item-nome">${escapeHTML(c.nome)}</div>
      ${preview}
    </div>
    ${hora ? `<span class="sidebar-item-hora">${hora}</span>` : ''}`;

  item.addEventListener('click', () => selecionarConversa(c));
  return item;
}

function marcarAtivo(id) {
  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.toggle('ativo', el.dataset.id === String(id));
  });
}

// ─── MODAL NOVA CONVERSA ─────────────────────────────────────────────────────
document.getElementById('btnNovaConversa')?.addEventListener('click', abrirModalNovaConversa);

function abrirModalNovaConversa() {
  document.getElementById('modalNovaConversa')?.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-nova-conversa';
  modal.id = 'modalNovaConversa';

  modal.innerHTML = `
    <div class="modal-nova-conversa-box">
      <div class="modal-nova-conversa-header">
        <span class="modal-nova-conversa-titulo">Nova Conversa</span>
        <button class="modal-nova-conversa-fechar" id="modalNovaConversaFechar" type="button">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-nova-conversa-busca-wrap">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="modal-nova-conversa-busca" id="modalNovaBusca" type="text" placeholder="Buscar pessoa..." autocomplete="off"/>
      </div>
      <div class="modal-nova-conversa-lista" id="modalNovaLista"></div>
    </div>`;

  document.body.appendChild(modal);

  modal.addEventListener('click', e => { if (e.target === modal) fecharModalNovaConversa(); });
  document.getElementById('modalNovaConversaFechar').addEventListener('click', fecharModalNovaConversa);

  renderModalUsuarios('');

  const inputBusca = document.getElementById('modalNovaBusca');
  inputBusca.focus();
  inputBusca.addEventListener('input', () => renderModalUsuarios(inputBusca.value.trim().toLowerCase()));
}

function fecharModalNovaConversa() {
  document.getElementById('modalNovaConversa')?.remove();
}

function renderModalUsuarios(filtro) {
  const lista = document.getElementById('modalNovaLista');
  if (!lista) return;

  const usuarios = todosUsuarios.filter(u =>
    u._id !== meuId &&
    String(u._id) !== String(meuId) &&
    (!filtro || u.nome?.toLowerCase().includes(filtro))
  );

  if (!usuarios.length) {
    lista.innerHTML = `<div class="modal-usuario-vazio">Nenhuma pessoa encontrada</div>`;
    return;
  }

  lista.innerHTML = '';
  usuarios.forEach(u => {
    const item = document.createElement('div');
    item.className = 'modal-usuario-item';

    const iniciais = u.nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    item.innerHTML = `
      <div class="modal-usuario-avatar">
        ${u.fotoPerfil ? `<img src="${u.fotoPerfil}" alt="${escapeHTML(u.nome)}"/>` : iniciais}
      </div>
      <span class="modal-usuario-nome">${escapeHTML(u.nome)}</span>`;

    item.addEventListener('click', () => {
      fecharModalNovaConversa();
      selecionarConversa({
        tipo: 'direto',
        id: String(u._id),
        userId: String(u._id),
        nome: u.nome,
        foto: u.fotoPerfil || null
      });
    });

    lista.appendChild(item);
  });
}


async function selecionarConversa(c) {
  if (c.id === conversaAtiva.id) {
    fecharSidebar();
    return;
  }

  if (mensagens.length > 0 && estaNoFundo()) {
    saveLastRead(mensagens[mensagens.length - 1].id);
  }

  conversaAtiva = c;
  mensagens = [];
  carregamentoInicial = true;

  elHeaderTitulo.textContent = c.nome;
  elHeaderSub.textContent = c.tipo === 'grupo' ? 'conversa em grupo' : 'mensagem direta';

  if (c.foto) {
    elHeaderAvatarImg.src = c.foto;
  } else {
    elHeaderAvatarImg.src = '../assets/logo.png';
  }

  elChat.innerHTML = '';
  marcarAtivo(c.id);

  if (window.innerWidth <= 768) fecharSidebar();

  if (poolingInterval) clearInterval(poolingInterval);

  await carregarMensagens();

  poolingInterval = setInterval(atualizarMensagens, 5000);
}

// ─── CARREGAR CONVERSAS (sidebar) ────────────────────────────────────────────
async function carregarConversas() {
  try {
    const url = meuId ? `${API}/conversas/${meuId}` : null;
    if (!url) {
      conversas = [{ tipo: 'grupo', id: 'grupo', nome: 'Turma INF 25B', foto: null, ultimaMsg: null }];
      renderSidebar(conversas);
      return;
    }

    const resp = await fetch(url);
    conversas = await resp.json();
    renderSidebar(conversas);
  } catch (err) {
    console.error('Erro ao carregar conversas:', err);
    conversas = [{ tipo: 'grupo', id: 'grupo', nome: 'Turma INF 25B', foto: null, ultimaMsg: null }];
    renderSidebar(conversas);
  }
}

// ─── ATUALIZAR PREVIEW SIDEBAR ────────────────────────────────────────────────
function atualizarPreviewSidebar() {
  if (mensagens.length === 0) return;
  const ultima = mensagens[mensagens.length - 1];
  const item = document.querySelector(`.sidebar-item[data-id="${conversaAtiva.id}"]`);
  if (!item) return;

  const previewEl = item.querySelector('.sidebar-item-preview');
  const horaEl = item.querySelector('.sidebar-item-hora');

  if (previewEl) {
    const prefix = ultima.eu ? 'Você: ' : '';
    previewEl.textContent = prefix + (ultima.tipo === 'texto' ? ultima.conteudo.slice(0, 40) : `[${ultima.tipo}]`);
  }

  if (horaEl) {
    horaEl.textContent = ultima.hora;
  }
}

// ─── CARREGAR MENSAGENS (inicial) ─────────────────────────────────────────────
async function carregarMensagens() {
  try {
    const resp = await fetch(getApiUrl());
    const dados = await resp.json();
    const mapear = getMapear();
    mensagens = dados.map(mapear);

    const lastReadId = getLastRead();
    const lastReadIdx = lastReadId
      ? mensagens.findIndex(m => String(m.id) === String(lastReadId))
      : -1;

    const temNaoLidas = lastReadIdx !== -1 && lastReadIdx < mensagens.length - 1;

    renderTodas(temNaoLidas ? 'naoLida' : 'fundo');
    carregamentoInicial = false;

    if (!temNaoLidas && mensagens.length > 0) {
      saveLastRead(mensagens[mensagens.length - 1].id);
      marcarAtivo(conversaAtiva.id);
    }

  } catch (err) {
    console.error('Erro ao carregar mensagens:', err);
  }
}

// ─── ATUALIZAÇÃO SILENCIOSA (polling) ────────────────────────────────────────
async function atualizarMensagens() {
  try {
    const resp = await fetch(getApiUrl());
    const dados = await resp.json();
    const mapear = getMapear();
    const novos = dados.map(mapear);

    const idsServidor = new Set(novos.map(m => String(m.id)));

    const temps = mensagens.filter(m => String(m.id).startsWith('temp-'));
    if (temps.length > 0) {
      temps.forEach(m => {
        document.querySelector(`.msg-grupo[data-id="${m.id}"]`)?.remove();
      });
      mensagens = mensagens.filter(m => !String(m.id).startsWith('temp-'));
    }

    const idsLocais = new Set(mensagens.map(m => String(m.id)));

    const algumApagado = mensagens.some(m => !idsServidor.has(String(m.id)));
    const msgNovas = novos.filter(m => !idsLocais.has(String(m.id)));

    if (!algumApagado && msgNovas.length === 0) return;

    const foiNoFundo = estaNoFundo();
    const scrollAntes = elChat.scrollTop;

    if (algumApagado) {
      const alturaAntes = elChat.scrollHeight;
      mensagens = novos;
      renderTodasSilencioso();
      requestAnimationFrame(() => {
        const alturaDepois = elChat.scrollHeight;
        if (foiNoFundo) {
          elChat.scrollTop = alturaDepois;
        } else if (alturaAntes > 0) {
          elChat.scrollTop = Math.round(scrollAntes * (alturaDepois / alturaAntes));
        }
      });
    } else {
      msgNovas.forEach(msg => {
        const penultima = mensagens.length > 0 ? mensagens[mensagens.length - 1] : null;

        if (!penultima || penultima.data !== msg.data) {
          elChat.appendChild(criarSeparadorData(msg.data));
        }

        const agrupado = mesmoBlocoTempo(penultima, msg);
        mensagens.push(msg);
        elChat.appendChild(renderMensagem(msg, agrupado));
      });

      if (foiNoFundo) {
        saveLastRead(mensagens[mensagens.length - 1].id);
        scrollBaixo();
      }
    }

    atualizarPreviewSidebar();

  } catch (err) {
    console.error('Erro ao atualizar mensagens:', err);
  }
}

// ─── RENDER TOTAL ─────────────────────────────────────────────────────────────
function renderTodas(scrollBehavior = 'fundo') {
  elChat.innerHTML = '';

  const lastReadId = getLastRead();
  const lastReadIdx = lastReadId
    ? mensagens.findIndex(m => String(m.id) === String(lastReadId))
    : -1;

  let dataAtual = null;

  mensagens.forEach((msg, i) => {
    if (msg.data !== dataAtual) {
      dataAtual = msg.data;
      elChat.appendChild(criarSeparadorData(msg.data));
    }

    if (scrollBehavior === 'naoLida' && lastReadIdx !== -1 && i === lastReadIdx + 1) {
      elChat.appendChild(criarSeparadorNaoLidas());
    }

    const anterior = mensagens[i - 1];
    const agrupado = mesmoBlocoTempo(anterior, msg);
    elChat.appendChild(renderMensagem(msg, agrupado));
  });

  requestAnimationFrame(() => {
    if (scrollBehavior === 'naoLida') {
      const sep = document.getElementById('naoLidasSep');
      if (sep) {
        sep.scrollIntoView({ block: 'start' });
        elChat.scrollTop -= 16;
        return;
      }
    }
    elChat.scrollTop = elChat.scrollHeight;
  });
}

function renderTodasSilencioso() {
  elChat.innerHTML = '';
  let dataAtual = null;

  mensagens.forEach((msg, i) => {
    if (msg.data !== dataAtual) {
      dataAtual = msg.data;
      elChat.appendChild(criarSeparadorData(msg.data));
    }
    const anterior = mensagens[i - 1];
    const agrupado = mesmoBlocoTempo(anterior, msg);
    elChat.appendChild(renderMensagem(msg, agrupado));
  });
}

// ─── SEPARADORES ──────────────────────────────────────────────────────────────
function criarSeparadorData(data) {
  const sep = document.createElement('div');
  sep.className = 'data-separador';
  sep.innerHTML = `
    <div class="data-separador-linha"></div>
    <span class="data-separador-texto">${data}</span>
    <div class="data-separador-linha"></div>`;
  return sep;
}

function criarSeparadorNaoLidas() {
  const sep = document.createElement('div');
  sep.className = 'nao-lidas-sep';
  sep.id = 'naoLidasSep';
  sep.innerHTML = `
    <div class="nao-lidas-linha"></div>
    <span class="nao-lidas-texto">↓ Não lidas</span>
    <div class="nao-lidas-linha"></div>`;
  return sep;
}

// ─── SCROLL LISTENER ─────────────────────────────────────────────────────────
elChat.addEventListener('scroll', () => {
  if (estaNoFundo() && mensagens.length > 0) {
    saveLastRead(mensagens[mensagens.length - 1].id);
    document.getElementById('naoLidasSep')?.remove();
    const item = document.querySelector(`.sidebar-item[data-id="${conversaAtiva.id}"]`);
    if (item) item.classList.remove('tem-nao-lidas');
  }
}, { passive: true });

// ─── RENDER MENSAGEM ──────────────────────────────────────────────────────────
function renderMensagem(msg, agrupado = false) {
  const eu = msg.eu || msg.autor === meuNome;
  const grupo = document.createElement('div');
  grupo.className = `msg-grupo ${eu ? 'eu' : 'outros'}${agrupado ? ' msg-agrupada' : ''}`;
  grupo.dataset.id = msg.id;

  let citacaoHTML = '';
  if (msg.replyTo) {
    const ref = mensagens.find(m => String(m.id) === String(msg.replyTo));
    let replyAutor, replyTexto;

    if (ref) {
      replyAutor = escapeHTML(ref.autor);
      replyTexto = ref.tipo === 'texto' ? escapeHTML(ref.conteudo).slice(0, 80) : `[${ref.tipo}]`;
    } else if (msg.replyToData) {
      replyAutor = escapeHTML(msg.replyToData.autor);
      replyTexto = msg.replyToData.tipo === 'texto'
        ? escapeHTML(msg.replyToData.texto).slice(0, 80)
        : `[${msg.replyToData.tipo}]`;
    } else {
      replyAutor = 'Mensagem';
      replyTexto = 'Mensagem apagada';
    }

    citacaoHTML = `
      <div class="msg-citacao">
        <div class="msg-citacao-autor">${replyAutor}</div>
        ${replyTexto}
      </div>`;
  }

  const nomeBalaoHTML = (!agrupado && !eu)
    ? `<span class="msg-nome-balao">${escapeHTML(msg.autor)}</span>`
    : '';

  const horaHTML = `<span class="msg-hora">${msg.hora}</span>`;

  let conteudoHTML = '';

  if (msg.tipo === 'texto') {
    conteudoHTML = `
      <div class="msg-balao">
        ${nomeBalaoHTML}${citacaoHTML}
        <div class="msg-balao-inner">
          <span class="msg-texto">${escapeHTML(msg.conteudo)}</span>${horaHTML}
        </div>
      </div>`;
  } else if (msg.tipo === 'imagem') {
    conteudoHTML = `
      <div class="msg-balao msg-balao-midia">
        ${nomeBalaoHTML}${citacaoHTML}
        <div class="msg-img-wrap">
          <img class="msg-img" src="${msg.src}" alt="imagem" onclick="abrirImagem('${msg.src}')"/>
          <span class="msg-hora msg-hora-midia">${msg.hora}</span>
        </div>
      </div>`;
  } else if (msg.tipo === 'audio') {
    conteudoHTML = `
      <div class="msg-audio">
        ${nomeBalaoHTML}${citacaoHTML}
        <button class="audio-play" onclick="toggleAudio(this, '${msg.src || ''}')">
          <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="#fff"/></svg>
        </button>
        <div class="audio-onda">${ondaHTML(msg.onda)}</div>
        <span class="audio-dur">${msg.duracao}</span>
        ${horaHTML}
      </div>`;
  }

  const fotoEsc = (msg.foto || '').replace(/'/g, "\\'");
  const nomeEsc = escapeHTML(msg.autor).replace(/'/g, "\\'");
  const autorIdEsc = (msg.autorId || '').replace(/'/g, "\\'");

  const avatarEl = agrupado
    ? `<div class="msg-avatar-espaco"></div>`
    : `<div class="msg-avatar" onclick="verMiniPerfil('${autorIdEsc}','${nomeEsc}','${fotoEsc}')" style="cursor:pointer">
         ${avatarHTML(msg.foto, msg.autor)}
       </div>`;

  grupo.innerHTML = `${avatarEl}<div class="msg-col">${conteudoHTML}</div>`;
  anexarLongPress(grupo, msg);
  return grupo;
}

// ─── LONG PRESS ───────────────────────────────────────────────────────────────
function anexarLongPress(el, msg) {
  let timer = null;
  const iniciar = (e) => { timer = setTimeout(() => { const t = e.touches ? e.touches[0] : e; abrirCtxMenu(t.clientX, t.clientY, msg); }, 500); };
  const cancelar = () => clearTimeout(timer);

  el.addEventListener('touchstart', iniciar, { passive: true });
  el.addEventListener('touchend', cancelar);
  el.addEventListener('touchmove', cancelar);
  el.addEventListener('mousedown', iniciar);
  el.addEventListener('mouseup', cancelar);
  el.addEventListener('mouseleave', cancelar);
  el.addEventListener('contextmenu', e => { e.preventDefault(); abrirCtxMenu(e.clientX, e.clientY, msg); });
}

// ─── CONTEXT MENU ─────────────────────────────────────────────────────────────
function abrirCtxMenu(x, y, msg) {
  fecharCtxMenu();

  const ehMeu = msg.eu || msg.autor === meuNome;
  const podeDel = ehMeu || isAdmin;

  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  menu.id = 'ctxMenu';

  const itens = [
    {
      label: 'Responder',
      svg: `<svg viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>`,
      acao: () => ativarReply(msg), danger: false
    },
    ...(podeDel ? [{
      label: isAdmin && !ehMeu ? 'Apagar (ADM)' : 'Apagar',
      svg: `<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`,
      acao: () => apagarMensagem(msg), danger: true
    }] : [])
  ];

  itens.forEach(({ label, svg, acao, danger }) => {
    const item = document.createElement('div');
    item.className = `ctx-item${danger ? ' danger' : ''}`;
    item.innerHTML = `${svg}<span>${label}</span>`;
    item.addEventListener('click', () => { fecharCtxMenu(); acao(); });
    menu.appendChild(item);
  });

  document.body.appendChild(menu);
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  const vw = window.innerWidth, vh = window.innerHeight;
  menu.style.left = `${Math.min(x, vw - mw - 10)}px`;
  menu.style.top = `${Math.min(y, vh - mh - 10)}px`;

  setTimeout(() => document.addEventListener('click', fecharCtxMenu, { once: true }), 10);
}

function fecharCtxMenu() {
  document.getElementById('ctxMenu')?.remove();
}

// ─── REPLY ────────────────────────────────────────────────────────────────────
function ativarReply(msg) {
  replyAlvo = { id: msg.id, autor: msg.autor, texto: msg.tipo === 'texto' ? msg.conteudo : `[${msg.tipo}]` };
  elReplyTexto.innerHTML = `<strong>${escapeHTML(msg.autor)}:</strong> ${escapeHTML(replyAlvo.texto).slice(0, 60)}`;
  elReplyBar.classList.add('visivel');
  elInput.focus();
}

function cancelarReply() {
  replyAlvo = null;
  elReplyBar.classList.remove('visivel');
}

elReplyFechar.addEventListener('click', cancelarReply);

// ─── APAGAR ───────────────────────────────────────────────────────────────────
async function apagarMensagem(msg) {
  const idReal = String(msg.id).startsWith('temp-') ? null : msg.id;

  const el = document.querySelector(`.msg-grupo[data-id="${msg.id}"]`);
  if (el) {
    el.classList.add('apagando');
    el.addEventListener('animationend', () => el.remove());
  }

  mensagens = mensagens.filter(m => String(m.id) !== String(msg.id));
  if (!idReal || !meuId) return;

  try {
    const endpoint = conversaAtiva.tipo === 'grupo'
      ? `${API}/mensagens/${idReal}`
      : `${API}/mensagens-diretas/${idReal}`;

    await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solicitanteId: meuId })
    });
  } catch (err) { console.error('Erro ao apagar:', err); }
}

// ─── @MENTION ─────────────────────────────────────────────────────────────────
async function carregarUsuarios() {
  try {
    const res = await fetch(`${API}/usuarios`);
    todosUsuarios = await res.json();
  } catch { todosUsuarios = []; }
}

function getMentionQuery() {
  const val = elInput.value;
  const cursor = elInput.selectionStart;
  const antes = val.slice(0, cursor);
  const match = antes.match(/@([\wÀ-úà-ÿA-ZÇçÃãÕõÊêÔôÁáÉéÍíÓóÚú]*)$/);
  return match ? match[1] : null;
}

function abrirMentionLista(filtro) {
  fecharMentionLista();
  const usuarios = todosUsuarios
    .filter(u => u.nome?.toLowerCase().includes(filtro.toLowerCase()))
    .slice(0, 6);
  if (!usuarios.length) return;

  const lista = document.createElement('div');
  lista.className = 'mention-lista';
  lista.id = 'mentionLista';

  usuarios.forEach((u, i) => {
    const item = document.createElement('div');
    item.className = `mention-item${i === 0 ? ' ativo' : ''}`;
    item.dataset.nome = u.nome;
    item.innerHTML = `
      <div class="mention-avatar">
        ${u.fotoPerfil ? `<img src="${u.fotoPerfil}"/>` : u.nome.slice(0, 2).toUpperCase()}
      </div>
      ${escapeHTML(u.nome)}`;
    item.addEventListener('click', () => inserirMention(u.nome));
    lista.appendChild(item);
  });

  const rect = elInput.getBoundingClientRect();
  lista.style.bottom = `${window.innerHeight - rect.top + 6}px`;
  lista.style.left = `${rect.left}px`;
  document.body.appendChild(lista);
  mentionAtivo = true;
  mentionIndex = 0;
}

function fecharMentionLista() {
  document.getElementById('mentionLista')?.remove();
  mentionAtivo = false;
}

function inserirMention(nome) {
  const val = elInput.value;
  const cursor = elInput.selectionStart;
  const antes = val.slice(0, cursor);
  const depois = val.slice(cursor);
  const novoAntes = antes.replace(/@([\wÀ-úà-ÿA-ZÇçÃãÕõÊêÔôÁáÉéÍíÓóÚú]*)$/, `@${nome} `);
  elInput.value = novoAntes + depois;
  elInput.selectionStart = elInput.selectionEnd = novoAntes.length;
  mencoesAtivas.add(nome);
  fecharMentionLista();
  elInput.focus();
}

elInput.addEventListener('input', () => {
  elInput.style.height = 'auto';
  elInput.style.height = Math.min(elInput.scrollHeight, 100) + 'px';
  const q = getMentionQuery();
  if (q !== null) abrirMentionLista(q);
  else fecharMentionLista();
});

elInput.addEventListener('keydown', e => {
  if (mentionAtivo) {
    const lista = document.getElementById('mentionLista');
    const itens = lista?.querySelectorAll('.mention-item');
    if (!itens?.length) return;

    if (e.key === 'ArrowDown') { e.preventDefault(); mentionIndex = (mentionIndex + 1) % itens.length; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); mentionIndex = (mentionIndex - 1 + itens.length) % itens.length; }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); inserirMention(itens[mentionIndex].dataset.nome); return; }
    else if (e.key === 'Escape') { fecharMentionLista(); return; }

    itens.forEach((it, i) => it.classList.toggle('ativo', i === mentionIndex));
    return;
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    enviarTexto();
  }
});

// ─── EASTER EGG ───────────────────────────────────────────────────────────────
function triggerRodrigo() {
  if (document.getElementById('rodrigoOverlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'rodrigoOverlay';
  overlay.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;display:flex;align-items:center;justify-content:center;background:#000;animation:rodrigoEntra 0.3s ease-out both;`;
  overlay.innerHTML = `
    <img src="../assets/rodrigo.png" onerror="this.src='../assets/rodrigo.jpg'" alt="RODRIGO"
      style="width:100%;height:100%;object-fit:fill;"/>
    <style>
      @keyframes rodrigoEntra { from{opacity:0;transform:scale(1.05)} to{opacity:1;transform:scale(1)} }
      @keyframes rodrigoSai   { from{opacity:1;transform:scale(1)}    to{opacity:0;transform:scale(1.05)} }
      .rodrigo-saindo { animation: rodrigoSai 0.3s ease-in both !important; }
    </style>`;
  document.body.appendChild(overlay);
  setTimeout(() => {
    overlay.classList.add('rodrigo-saindo');
    overlay.addEventListener('animationend', () => overlay.remove(), { once: true });
  }, 2000);
}

// ─── ENVIAR ───────────────────────────────────────────────────────────────────
async function enviarTexto() {
  const texto = elInput.value.trim();
  if (!texto && !imagemPendente) return;

  if (/\bRODRIGO\b/.test(texto)) triggerRodrigo();

  const replyId = replyAlvo?.id || null;
  cancelarReply();

  if (imagemPendente) {
    const previewSrc = imagemPendente.src;
    const fileParaUpload = imagemPendente.file;
    limparPreview();

    const msgLocal = {
      id: `temp-img-${Date.now()}`,
      autor: meuNome, foto: minhaFoto,
      role: usuario.role || 'aluno',
      tipo: 'imagem', src: previewSrc,
      replyTo: replyId,
      hora: hora(), data: hoje(), eu: true
    };
    adicionarMensagemLocal(msgLocal);

    if (meuId && fileParaUpload) {
      try {
        const fd = new FormData();
        fd.append('midia', fileParaUpload);
        const res = await fetch(`${API}/mensagens/upload`, { method: 'POST', body: fd });
        const dados = await res.json();
        if (res.ok) await enviarParaApi({ texto: '', tipo: 'imagem', mediaUrl: dados.url, replyTo: replyId, mencoes: [] });
      } catch (err) { console.error('Erro upload imagem:', err); }
    }
  }

  if (texto) {
    elInput.value = '';
    elInput.style.height = 'auto';
    const mencoes = [...mencoesAtivas];
    mencoesAtivas.clear();

    const msgLocal = {
      id: `temp-${Date.now()}`,
      autor: meuNome, foto: minhaFoto,
      role: usuario.role || 'aluno',
      tipo: 'texto', conteudo: texto,
      replyTo: replyId,
      hora: hora(), data: hoje(), eu: true
    };
    adicionarMensagemLocal(msgLocal);

    if (!meuId) return;
    try {
      await enviarParaApi({ texto, replyTo: replyId, mencoes });
    } catch (err) { console.error('Erro ao enviar mensagem:', err); }
  }
}

async function enviarParaApi(campos) {
  if (conversaAtiva.tipo === 'grupo') {
    await fetch(`${API}/mensagens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autor: meuId, ...campos })
    });
  } else {
    await fetch(`${API}/mensagens-diretas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ de: meuId, para: conversaAtiva.id, ...campos })
    });
  }
}

function adicionarMensagemLocal(msg) {
  const ultima = mensagens[mensagens.length - 1];
  if (!ultima || ultima.data !== msg.data) {
    elChat.appendChild(criarSeparadorData(msg.data));
  }
  const agrupado = mesmoBlocoTempo(ultima, msg);
  mensagens.push(msg);
  elChat.appendChild(renderMensagem(msg, agrupado));
  saveLastRead(msg.id);
  scrollBaixo();
}

elBtnEnviar.addEventListener('click', enviarTexto);

// ─── FOTO ─────────────────────────────────────────────────────────────────────
elBtnFoto.addEventListener('click', () => elInputFoto.click());

elInputFoto.addEventListener('change', () => {
  const file = elInputFoto.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  imagemPendente = { src: url, nome: file.name, file };
  elPreviewImg.src = url;
  elPreviewNome.textContent = file.name;
  elPreview.classList.add('visivel');
  elInputFoto.value = '';
});

elPreviewRem.addEventListener('click', limparPreview);

function limparPreview() {
  imagemPendente = null;
  elPreview.classList.remove('visivel');
  elPreviewImg.src = '';
  elPreviewNome.textContent = '';
}

// ─── ÁUDIO ────────────────────────────────────────────────────────────────────
elBtnAudio.addEventListener('click', async () => {
  if (!gravando) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksAudio = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = e => chunksAudio.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksAudio, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const dur = formatarDuracao(segundosGrav);
        adicionarMensagemLocal({
          id: `temp-audio-${Date.now()}`,
          autor: meuNome, foto: minhaFoto,
          role: usuario.role || 'aluno',
          tipo: 'audio', src: url,
          onda: gerarOnda(), duracao: dur,
          hora: hora(), data: hoje(), eu: true
        });
        stream.getTracks().forEach(t => t.stop());
        if (meuId) {
          try {
            const fd = new FormData();
            fd.append('midia', blob, 'audio.webm');
            const res = await fetch(`${API}/mensagens/upload`, { method: 'POST', body: fd });
            const dados = await res.json();
            if (res.ok) await enviarParaApi({ texto: '', tipo: 'audio', mediaUrl: dados.url, duracao: dur, mencoes: [] });
          } catch (err) { console.error('Erro upload áudio:', err); }
        }
      };
      mediaRecorder.start();
      gravando = true; segundosGrav = 0;
      elBtnAudio.classList.add('gravando');
      timerGrav = setInterval(() => segundosGrav++, 1000);
    } catch { alert('Permita acesso ao microfone para gravar áudio.'); }
  } else {
    clearInterval(timerGrav);
    mediaRecorder.stop();
    gravando = false;
    elBtnAudio.classList.remove('gravando');
  }
});

function formatarDuracao(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ─── PLAYER ÁUDIO ─────────────────────────────────────────────────────────────
const audioAtivos = {};

function toggleAudio(btn, src) {
  if (!src) return;
  if (audioAtivos[src]) {
    audioAtivos[src].pause();
    delete audioAtivos[src];
    btn.innerHTML = `<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="#fff"/></svg>`;
    return;
  }
  Object.entries(audioAtivos).forEach(([s, a]) => { a.pause(); delete audioAtivos[s]; });
  const audio = new Audio(src);
  audioAtivos[src] = audio;
  btn.innerHTML = `<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" fill="#fff"/><rect x="14" y="4" width="4" height="16" fill="#fff"/></svg>`;
  audio.play();
  audio.onended = () => {
    delete audioAtivos[src];
    btn.innerHTML = `<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="#fff"/></svg>`;
  };
}

function abrirImagem(src) { window.open(src, '_blank'); }

// ─── MINI PERFIL ──────────────────────────────────────────────────────────────
async function verMiniPerfil(autorId, nome, foto) {
  document.getElementById('miniPerfilModal')?.remove();
  const inicial = nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

  const modal = document.createElement('div');
  modal.id = 'miniPerfilModal';
  modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);z-index:9999;display:flex;align-items:center;justify-content:center;`;
  modal.innerHTML = `
    <div style="background:#1a0a3a;border:1px solid rgba(139,92,246,.3);border-radius:20px;padding:2rem;text-align:center;min-width:220px;position:relative">
      <button onclick="document.getElementById('miniPerfilModal').remove()"
        style="position:absolute;top:.75rem;right:.75rem;background:none;border:none;color:#94a3b8;font-size:1.2rem;cursor:pointer">✕</button>
      <div style="position:relative;width:72px;height:72px;margin:0 auto 1rem;">
        <div style="width:72px;height:72px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:700;color:#fff;overflow:hidden;border:2px solid rgba(139,92,246,.4)">
          ${foto ? `<img src="${foto}" style="width:100%;height:100%;object-fit:cover"/>` : inicial}
        </div>
        <div id="miniStatusDot" style="position:absolute;bottom:2px;right:2px;width:14px;height:14px;border-radius:50%;background:#475569;border:2px solid #1a0a3a;transition:background .3s"></div>
      </div>
      <div style="font-weight:700;color:#e2e8f0;font-size:1rem;margin-bottom:.4rem">${escapeHTML(nome)}</div>
      <div id="miniStatusTexto" style="font-size:.75rem;color:#94a3b8">carregando...</div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);

  if (autorId) {
    try {
      const res = await fetch(`${API}/usuarios/${autorId}/status`, { cache: 'no-store' });
      const { online, ultimaVez } = await res.json();
      const dot = document.getElementById('miniStatusDot');
      const txt = document.getElementById('miniStatusTexto');
      if (!dot || !txt) return;
      if (online) {
        dot.style.background = '#22c55e';
        txt.style.color = '#22c55e';
        txt.textContent = 'Online agora';
      } else if (ultimaVez) {
        const dt = new Date(ultimaVez);
        const agora = new Date();
        const diffMin = Math.floor((agora - dt) / 60000);
        let labelTempo;
        if (diffMin < 1) labelTempo = 'há menos de 1 min';
        else if (diffMin < 60) labelTempo = `há ${diffMin} min`;
        else if (diffMin < 1440) {
          const h = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          labelTempo = `hoje às ${h}`;
        } else {
          const d = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          const h = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          labelTempo = `${d} às ${h}`;
        }
        dot.style.background = '#94a3b8';
        txt.style.color = '#94a3b8';
        txt.textContent = `Visto ${labelTempo}`;
      } else {
        const txt2 = document.getElementById('miniStatusTexto');
        if (txt2) txt2.textContent = 'Nunca visto';
      }
    } catch {
      const txt = document.getElementById('miniStatusTexto');
      if (txt) txt.textContent = '';
    }
  } else {
    const txt = document.getElementById('miniStatusTexto');
    if (txt) txt.textContent = '';
  }
}

// ─── POLLING SIDEBAR ─────────────────────────────────────────────────────────
async function atualizarSidebar() {
  try {
    if (!meuId) return;
    const resp = await fetch(`${API}/conversas/${meuId}`);
    const lista = await resp.json();

    const idsAtuais = new Set(
      [...document.querySelectorAll('.sidebar-item')].map(el => el.dataset.id)
    );
    const temNova = lista.some(c => !idsAtuais.has(String(c.id)));

    if (temNova) {
      conversas = lista;
      renderSidebar(lista);
      return;
    }

    lista.forEach(c => {
      if (c.ultimaMsg?.id) atualizarBadge(c.id, c.ultimaMsg.id);
      const item = document.querySelector(`.sidebar-item[data-id="${c.id}"]`);
      if (!item || !c.ultimaMsg) return;
      const prev = item.querySelector('.sidebar-item-preview');
      const horaEl = item.querySelector('.sidebar-item-hora');
      if (prev) {
        const prefix = c.ultimaMsg.autorNome === 'Você' ? 'Você: ' : '';
        prev.textContent = prefix + c.ultimaMsg.texto.slice(0, 40);
      }
      if (horaEl) horaEl.textContent = formatarHoraRelativa(c.ultimaMsg.criadaEm);
    });
  } catch { /* silencioso */ }
}

function iniciarPollings() {
  if (poolingInterval) clearInterval(poolingInterval);
  if (conversasInterval) clearInterval(conversasInterval);
  poolingInterval = setInterval(atualizarMensagens, 5000);
  conversasInterval = setInterval(atualizarSidebar, 8000);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  await Promise.allSettled([
    carregarUsuarios(),
    carregarConversas()
  ]);

  await carregarMensagens();
  iniciarPollings();
}

// ─── VISIBILIDADE (PWA mobile: volta do fundo) ────────────────────────────────
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible') return;

  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);

  iniciarPollings();

  try {
    await Promise.allSettled([
      atualizarMensagens(),
      atualizarSidebar()
    ]);
  } catch { /* silencioso */ }
});

window.addEventListener('beforeunload', () => {
  if (poolingInterval) clearInterval(poolingInterval);
  if (conversasInterval) clearInterval(conversasInterval);
  if (mensagens.length > 0 && estaNoFundo()) {
    saveLastRead(mensagens[mensagens.length - 1].id);
  }
});

init();

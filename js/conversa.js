const API = "https://inf-25b-backend.onrender.com";

const usuario = (() => {
  try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); }
  catch { return {}; }
})();
const meuNome = usuario.nome || 'Você';
const meuId = usuario.id || null;
const minhaFoto = usuario.fotoPerfil || null;
const isAdmin = usuario.role === 'admin';

let mensagens = [];
let imagemPendente = null;
let mediaRecorder = null;
let gravando = false;
let chunksAudio = [];
let timerGrav = null;
let segundosGrav = 0;
let poolingInterval = null;
let replyAlvo = null;   // { id, autor, texto }
let todosUsuarios = [];
let mentionAtivo = false;
let mentionIndex = 0;

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

// ─── UTILITÁRIOS ──────────────────────────────────────────────
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
  if (foto) return `<img src="${foto}" alt="${nome}"/>`;
  return `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
}

function ondaHTML(onda) {
  return onda.map(h => `<div class="audio-onda-bar" style="height:${h}px"></div>`).join('');
}

function scrollBaixo() {
  requestAnimationFrame(() => { elChat.scrollTop = elChat.scrollHeight; });
}

// ─── RENDER ───────────────────────────────────────────────────
function renderMensagem(msg) {
  const eu = msg.eu || msg.autor === meuNome;
  const grupo = document.createElement('div');
  grupo.className = `msg-grupo ${eu ? 'eu' : 'outros'}`;
  grupo.dataset.id = msg.id;

  // citação (reply)
  let citacaoHTML = '';
  if (msg.replyTo) {
    const ref = mensagens.find(m => String(m.id) === String(msg.replyTo));
    const replyAutor = ref ? escapeHTML(ref.autor) : 'Mensagem';
    const replyTexto = ref
      ? (ref.tipo === 'texto' ? escapeHTML(ref.conteudo).slice(0, 80) : `[${ref.tipo}]`)
      : 'Mensagem apagada';
    citacaoHTML = `
      <div class="msg-citacao">
        <div class="msg-citacao-autor">${replyAutor}</div>
        ${replyTexto}
      </div>`;
  }

  let conteudoHTML = '';
  if (msg.tipo === 'texto') {
    conteudoHTML = `
      <div class="msg-balao">${citacaoHTML}${escapeHTML(msg.conteudo)}</div>
      <span class="msg-hora">${msg.hora}</span>`;
  } else if (msg.tipo === 'imagem') {
    conteudoHTML = `
      <div class="msg-balao" style="padding:6px">${citacaoHTML}
        <img class="msg-img" src="${msg.src}" alt="imagem" onclick="abrirImagem('${msg.src}')"/>
      </div>
      <span class="msg-hora">${msg.hora}</span>`;
  } else if (msg.tipo === 'audio') {
    conteudoHTML = `
      <div class="msg-audio">
        ${citacaoHTML}
        <button class="audio-play" onclick="toggleAudio(this, '${msg.src || ''}')">
          <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="#fff"/></svg>
        </button>
        <div class="audio-onda">${ondaHTML(msg.onda)}</div>
        <span class="audio-dur">${msg.duracao}</span>
      </div>
      <span class="msg-hora">${msg.hora}</span>`;
  }

  const fotoEsc = (msg.foto || '').replace(/'/g, "\\'");
  const nomeEsc = escapeHTML(msg.autor).replace(/'/g, "\\'");

  grupo.innerHTML = `
    <div class="msg-avatar" onclick="verMiniPerfil(null,'${nomeEsc}','${fotoEsc}')" style="cursor:pointer">
      ${avatarHTML(msg.foto, msg.autor)}
    </div>
    <div class="msg-col">
      <span class="msg-nome" onclick="verMiniPerfil(null,'${nomeEsc}','${fotoEsc}')" style="cursor:pointer">${escapeHTML(msg.autor)}</span>
      ${conteudoHTML}
    </div>`;

  anexarLongPress(grupo, msg);
  return grupo;
}

function renderTodas() {
  elChat.innerHTML = '';
  let dataAtual = null;
  mensagens.forEach(msg => {
    if (msg.data !== dataAtual) {
      dataAtual = msg.data;
      elChat.appendChild(criarSeparadorData(msg.data));
    }
    elChat.appendChild(renderMensagem(msg));
  });
  scrollBaixo();
}

function adicionarMensagemLocal(msg) {
  const ultima = mensagens[mensagens.length - 1];
  if (!ultima || ultima.data !== msg.data) {
    elChat.appendChild(criarSeparadorData(msg.data));
  }
  mensagens.push(msg);
  elChat.appendChild(renderMensagem(msg));
  scrollBaixo();
}

function criarSeparadorData(data) {
  const sep = document.createElement('div');
  sep.className = 'data-separador';
  sep.innerHTML = `
    <div class="data-separador-linha"></div>
    <span class="data-separador-texto">${data}</span>
    <div class="data-separador-linha"></div>`;
  return sep;
}

// ─── LONG PRESS ───────────────────────────────────────────────
function anexarLongPress(el, msg) {
  let timer = null;

  const iniciar = (e) => {
    timer = setTimeout(() => {
      const touch = e.touches ? e.touches[0] : e;
      abrirCtxMenu(touch.clientX, touch.clientY, msg);
    }, 500);
  };

  const cancelar = () => clearTimeout(timer);

  el.addEventListener('touchstart', iniciar, { passive: true });
  el.addEventListener('touchend', cancelar);
  el.addEventListener('touchmove', cancelar);
  el.addEventListener('mousedown', iniciar);
  el.addEventListener('mouseup', cancelar);
  el.addEventListener('mouseleave', cancelar);
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    abrirCtxMenu(e.clientX, e.clientY, msg);
  });
}

// ─── CONTEXT MENU ─────────────────────────────────────────────
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
      acao: () => ativarReply(msg),
      danger: false
    },
    ...(podeDel ? [{
      label: isAdmin && !ehMeu ? 'Apagar (ADM)' : 'Apagar',
      svg: `<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`,
      acao: () => apagarMensagem(msg),
      danger: true
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

// ─── REPLY ────────────────────────────────────────────────────
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

// ─── APAGAR ───────────────────────────────────────────────────
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
    await fetch(`${API}/mensagens/${idReal}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solicitanteId: meuId })
    });
  } catch (err) { console.error('Erro ao apagar:', err); }
}

// ─── @MENTION ─────────────────────────────────────────────────
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
  const match = antes.match(/@([\wÀ-ú]*)$/);
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
  const novoAntes = antes.replace(/@([\wÀ-ú]*)$/, `@${nome} `);
  elInput.value = novoAntes + depois;
  elInput.selectionStart = elInput.selectionEnd = novoAntes.length;
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

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      mentionIndex = (mentionIndex + 1) % itens.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      mentionIndex = (mentionIndex - 1 + itens.length) % itens.length;
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      inserirMention(itens[mentionIndex].dataset.nome);
      return;
    } else if (e.key === 'Escape') {
      fecharMentionLista(); return;
    }

    itens.forEach((it, i) => it.classList.toggle('ativo', i === mentionIndex));
    return;
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    enviarTexto();
  }
});

// ─── CARREGAR MENSAGENS (com sync de apagados) ────────────────
async function carregarMensagens() {
  try {
    const resposta = await fetch(`${API}/mensagens`);
    const dados = await resposta.json();

    const mapear = m => ({
      id: m._id,
      autor: m.autor?.nome || 'Usuário',
      foto: String(m.autor?._id || m.autor) === String(meuId) ? minhaFoto : (m.autor?.fotoPerfil || null),
      role: m.autor?.role || 'aluno',
      tipo: m.tipo || 'texto',
      conteudo: m.texto || '',
      src: m.mediaUrl || '',
      replyTo: m.replyTo || null,
      onda: gerarOnda(),
      duracao: '0:00',
      hora: new Date(m.criadaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      data: new Date(m.criadaEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
      eu: String(m.autor?._id || m.autor) === String(meuId)
    });

    const idsLocais = new Set(mensagens.map(m => String(m.id)));
    const idsServidor = new Set(dados.map(m => String(m._id)));

    // verifica se alguma mensagem foi apagada no servidor
    const algumApagado = mensagens.some(
      m => !String(m.id).startsWith('temp-') && !idsServidor.has(String(m.id))
    );

    // verifica se há mensagens novas
    const temNovas = dados.some(m => !idsLocais.has(String(m._id)));

    if (!algumApagado && !temNovas) return;

    mensagens = dados.map(mapear);
    renderTodas();

  } catch (err) { console.error('Erro ao carregar mensagens:', err); }
}

// ─── ENVIAR ───────────────────────────────────────────────────
async function enviarTexto() {
  const texto = elInput.value.trim();
  if (!texto && !imagemPendente) return;

  const replyId = replyAlvo?.id || null;
  cancelarReply();

  if (imagemPendente) {
    const previewSrc = imagemPendente.src;
    const fileParaUpload = imagemPendente.file;
    limparPreview();

    adicionarMensagemLocal({
      id: `temp-img-${Date.now()}`,
      autor: meuNome, foto: minhaFoto,
      role: usuario.role || 'aluno',
      tipo: 'imagem', src: previewSrc,
      replyTo: replyId,
      hora: hora(), data: hoje(), eu: true,
    });

    if (meuId && fileParaUpload) {
      try {
        const fd = new FormData();
        fd.append('midia', fileParaUpload);
        const res = await fetch(`${API}/mensagens/upload`, { method: 'POST', body: fd });
        const dados = await res.json();
        if (res.ok) {
          await fetch(`${API}/mensagens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ autor: meuId, texto: '', tipo: 'imagem', mediaUrl: dados.url, replyTo: replyId })
          });
        }
      } catch (err) { console.error('Erro upload imagem:', err); }
    }
  }

  if (texto) {
    elInput.value = '';
    elInput.style.height = 'auto';

    adicionarMensagemLocal({
      id: `temp-${Date.now()}`,
      autor: meuNome, foto: minhaFoto,
      role: usuario.role || 'aluno',
      tipo: 'texto', conteudo: texto,
      replyTo: replyId,
      hora: hora(), data: hoje(), eu: true,
    });

    if (!meuId) return;
    try {
      await fetch(`${API}/mensagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autor: meuId, texto, replyTo: replyId })
      });
    } catch (err) { console.error('Erro ao enviar mensagem:', err); }
  }
}

elBtnEnviar.addEventListener('click', enviarTexto);

// ─── FOTO ─────────────────────────────────────────────────────
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

// ─── ÁUDIO ────────────────────────────────────────────────────
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
          hora: hora(), data: hoje(), eu: true,
        });
        stream.getTracks().forEach(t => t.stop());
        if (meuId) {
          try {
            const fd = new FormData();
            fd.append('midia', blob, 'audio.webm');
            const res = await fetch(`${API}/mensagens/upload`, { method: 'POST', body: fd });
            const dados = await res.json();
            if (res.ok) {
              await fetch(`${API}/mensagens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ autor: meuId, texto: '', tipo: 'audio', mediaUrl: dados.url })
              });
            }
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

// ─── PLAYER ÁUDIO ─────────────────────────────────────────────
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

// ─── POLLING ──────────────────────────────────────────────────
function iniciarPolling() {
  carregarMensagens();
  poolingInterval = setInterval(carregarMensagens, 5000);
}

window.addEventListener('beforeunload', () => {
  if (poolingInterval) clearInterval(poolingInterval);
});

// ─── MINI PERFIL ──────────────────────────────────────────────
function verMiniPerfil(autorId, nome, foto) {
  document.getElementById('miniPerfilModal')?.remove();
  const inicial = nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const modal = document.createElement('div');
  modal.id = 'miniPerfilModal';
  modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,.5);backdrop-filter:blur(4px);
    z-index:9999;display:flex;align-items:center;justify-content:center;`;
  modal.innerHTML = `
    <div style="background:#1a0a3a;border:1px solid rgba(139,92,246,.3);border-radius:20px;
                padding:2rem;text-align:center;min-width:220px;position:relative">
      <button onclick="document.getElementById('miniPerfilModal').remove()"
        style="position:absolute;top:.75rem;right:.75rem;background:none;border:none;
               color:#94a3b8;font-size:1.2rem;cursor:pointer">✕</button>
      <div style="width:72px;height:72px;border-radius:50%;margin:0 auto 1rem;
                  background:linear-gradient(135deg,#7c3aed,#a855f7);
                  display:flex;align-items:center;justify-content:center;
                  font-size:1.4rem;font-weight:700;color:#fff;overflow:hidden;
                  border:2px solid rgba(139,92,246,.4)">
        ${foto ? `<img src="${foto}" style="width:100%;height:100%;object-fit:cover"/>` : inicial}
      </div>
      <div style="font-weight:700;color:#e2e8f0;font-size:1rem">${nome}</div>
    </div>`;
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.body.appendChild(modal);
}

// ─── INIT ─────────────────────────────────────────────────────
carregarUsuarios();
iniciarPolling();
const API = "https://inf-25b-backend.onrender.com";

const usuario = (() => {
  try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); }
  catch { return {}; }
})();
const meuNome = usuario.nome || 'Você';
const meuId = usuario.id || null;
const minhaFoto = usuario.foto || null;

let mensagens = [];
let proximoId = 1;
let imagemPendente = null;
let mediaRecorder = null;
let gravando = false;
let chunksAudio = [];
let timerGrav = null;
let segundosGrav = 0;
let poolingInterval = null;

const elChat       = document.getElementById('chatArea');
const elInput      = document.getElementById('inputTexto');
const elBtnEnviar  = document.getElementById('btnEnviar');
const elBtnFoto    = document.getElementById('btnFoto');
const elInputFoto  = document.getElementById('inputFoto');
const elBtnAudio   = document.getElementById('btnAudio');
const elPreview    = document.getElementById('previewImgWrap');
const elPreviewImg = document.getElementById('previewImgThumb');
const elPreviewNome= document.getElementById('previewImgNome');
const elPreviewRem = document.getElementById('previewImgRemove');

function hoje() {
  return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function gerarOnda() {
  return Array.from({ length: 20 }, () => Math.floor(Math.random() * 14) + 4);
}

function hora() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function avatarHTML(foto, nome) {
  if (foto) return `<img src="${foto}" alt="${nome}"/>`;
  return `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
}

function ondaHTML(onda) {
  return onda.map(h => `<div class="audio-onda-bar" style="height:${h}px"></div>`).join('');
}

function renderMensagem(msg) {
  const eu = msg.eu || msg.autor === meuNome;
  const grupo = document.createElement('div');
  grupo.className = `msg-grupo ${eu ? 'eu' : 'outros'}`;
  grupo.id = `msg-${msg.id}`;

  let conteudoHTML = '';

  if (msg.tipo === 'texto') {
    conteudoHTML = `
      <div class="msg-balao">${escapeHTML(msg.conteudo)}</div>
      <span class="msg-hora">${msg.hora}</span>
    `;
  } else if (msg.tipo === 'imagem') {
    conteudoHTML = `
      <img class="msg-img" src="${msg.src}" alt="imagem" onclick="abrirImagem('${msg.src}')"/>
      <span class="msg-hora">${msg.hora}</span>
    `;
  } else if (msg.tipo === 'audio') {
    conteudoHTML = `
      <div class="msg-audio">
        <button class="audio-play" onclick="toggleAudio(this, '${msg.src || ''}')">
          <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="#fff"/></svg>
        </button>
        <div class="audio-onda">${ondaHTML(msg.onda)}</div>
        <span class="audio-dur">${msg.duracao}</span>
      </div>
      <span class="msg-hora">${msg.hora}</span>
    `;
  }

  grupo.innerHTML = `
    <div class="msg-avatar">${avatarHTML(msg.foto, msg.autor)}</div>
    <div class="msg-col">
      <span class="msg-nome">${escapeHTML(msg.autor)}</span>
      ${conteudoHTML}
    </div>
  `;

  return grupo;
}

function renderTodas() {
  elChat.innerHTML = '';
  let dataAtual = null;

  mensagens.forEach(msg => {
    if (msg.data !== dataAtual) {
      dataAtual = msg.data;
      const sep = document.createElement('div');
      sep.className = 'data-separador';
      sep.innerHTML = `
        <div class="data-separador-linha"></div>
        <span class="data-separador-texto">${msg.data}</span>
        <div class="data-separador-linha"></div>
      `;
      elChat.appendChild(sep);
    }
    elChat.appendChild(renderMensagem(msg));
  });

  scrollBaixo();
}

function adicionarMensagemLocal(msg) {
  const ultima = mensagens[mensagens.length - 1];
  if (!ultima || ultima.data !== msg.data) {
    const sep = document.createElement('div');
    sep.className = 'data-separador';
    sep.innerHTML = `
      <div class="data-separador-linha"></div>
      <span class="data-separador-texto">${msg.data}</span>
      <div class="data-separador-linha"></div>
    `;
    elChat.appendChild(sep);
  }

  mensagens.push(msg);
  elChat.appendChild(renderMensagem(msg));
  scrollBaixo();
}

// ─── BACKEND: BUSCAR MENSAGENS ────────────────────────────────
async function carregarMensagens() {
  try {
    const resposta = await fetch(`${API}/mensagens`);
    const dados = await resposta.json();

    if (dados.length === mensagens.length) return;

    // IDs já carregados localmente para não duplicar
    const idsLocais = new Set(mensagens.map(m => String(m.id)));

    const novas = dados
      .filter(m => !idsLocais.has(String(m._id)))
      .map(m => ({
        id: m._id,
        autor: m.autor?.nome || 'Usuário',
        foto: null,
        tipo: 'texto',
        conteudo: m.texto,
        hora: new Date(m.criadaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        data: new Date(m.criadaEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
        eu: String(m.autor?._id || m.autor) === String(meuId)
      }));

    if (!novas.length) return;

    // se for a primeira carga (mensagens locais eram só otimistas), renderiza tudo
    const temApenasOtimistas = mensagens.every(m => String(m.id).startsWith('temp-'));
    if (temApenasOtimistas) {
      mensagens = dados.map(m => ({
        id: m._id,
        autor: m.autor?.nome || 'Usuário',
        foto: null,
        tipo: 'texto',
        conteudo: m.texto,
        hora: new Date(m.criadaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        data: new Date(m.criadaEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
        eu: String(m.autor?._id || m.autor) === String(meuId)
      }));
      renderTodas();
    } else {
      // só adiciona as mensagens realmente novas (de outros usuários)
      novas.forEach(m => adicionarMensagemLocal(m));
    }
  } catch (err) {
    console.error("Erro ao carregar mensagens:", err);
  }
}

// ─── BACKEND: ENVIAR MENSAGEM ─────────────────────────────────
async function enviarTexto() {
  const texto = elInput.value.trim();
  if (!texto && !imagemPendente) return;

  // imagens ainda ficam só local (não temos upload de arquivo no backend)
  if (imagemPendente) {
    adicionarMensagemLocal({
      id: proximoId++,
      autor: meuNome,
      foto: minhaFoto,
      tipo: 'imagem',
      src: imagemPendente.src,
      hora: hora(),
      data: hoje(),
      eu: true,
    });
    limparPreview();
  }

  if (texto) {
    elInput.value = '';
    elInput.style.height = 'auto';

    // otimismo: mostra a mensagem localmente de imediato
    adicionarMensagemLocal({
      id: `temp-${Date.now()}`,
      autor: meuNome,
      foto: minhaFoto,
      tipo: 'texto',
      conteudo: texto,
      hora: hora(),
      data: hoje(),
      eu: true,
    });

    if (!meuId) return; // sem login, não manda pro backend

    try {
      await fetch(`${API}/mensagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autor: meuId, texto })
      });
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  }
}

// enviar com Enter (Shift+Enter = nova linha)
elInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    enviarTexto();
  }
});

elInput.addEventListener('input', () => {
  elInput.style.height = 'auto';
  elInput.style.height = Math.min(elInput.scrollHeight, 100) + 'px';
});

elBtnEnviar.addEventListener('click', enviarTexto);

// foto
elBtnFoto.addEventListener('click', () => elInputFoto.click());

elInputFoto.addEventListener('change', () => {
  const file = elInputFoto.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  imagemPendente = { src: url, nome: file.name };
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

// áudio (fica local — sem upload)
elBtnAudio.addEventListener('click', async () => {
  if (!gravando) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksAudio = [];
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = e => chunksAudio.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksAudio, { type: 'audio/webm' });
        const url  = URL.createObjectURL(blob);
        const dur  = formatarDuracao(segundosGrav);
        adicionarMensagemLocal({
          id: proximoId++,
          autor: meuNome,
          foto: minhaFoto,
          tipo: 'audio',
          src: url,
          onda: gerarOnda(),
          duracao: dur,
          hora: hora(),
          data: hoje(),
          eu: true,
        });
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      gravando = true;
      segundosGrav = 0;
      elBtnAudio.classList.add('gravando');
      timerGrav = setInterval(() => segundosGrav++, 1000);
    } catch (_) {
      alert('Permita acesso ao microfone para gravar áudio.');
    }
  } else {
    clearInterval(timerGrav);
    mediaRecorder.stop();
    gravando = false;
    elBtnAudio.classList.remove('gravando');
  }
});

function formatarDuracao(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2,'0')}`;
}

// player de áudio
const audioAtivos = {};

function toggleAudio(btn, src) {
  if (!src) return;

  if (audioAtivos[src]) {
    audioAtivos[src].pause();
    delete audioAtivos[src];
    btn.innerHTML = `<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="#fff"/></svg>`;
    return;
  }

  Object.entries(audioAtivos).forEach(([s, a]) => {
    a.pause();
    delete audioAtivos[s];
  });

  const audio = new Audio(src);
  audioAtivos[src] = audio;
  btn.innerHTML = `<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" fill="#fff"/><rect x="14" y="4" width="4" height="16" fill="#fff"/></svg>`;
  audio.play();
  audio.onended = () => {
    delete audioAtivos[src];
    btn.innerHTML = `<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="#fff"/></svg>`;
  };
}

function abrirImagem(src) {
  window.open(src, '_blank');
}

function scrollBaixo() {
  requestAnimationFrame(() => {
    elChat.scrollTop = elChat.scrollHeight;
  });
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── POLLING: atualiza mensagens a cada 5s ────────────────────
function iniciarPolling() {
  carregarMensagens();
  poolingInterval = setInterval(carregarMensagens, 5000);
}

// para o polling se sair da página
window.addEventListener('beforeunload', () => {
  if (poolingInterval) clearInterval(poolingInterval);
});

// init
iniciarPolling();
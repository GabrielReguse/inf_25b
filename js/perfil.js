const API = "https://inf-25b-backend.onrender.com";

let usuario = (() => {
  try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); } catch { return {}; }
})();

// ─── TOAST FEEDBACK ───────────────────────────────────────────
function showToast(msg, tipo = 'sucesso') {
  const existing = document.querySelector('.perfil-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `perfil-toast perfil-toast--${tipo}`;
  toast.textContent = msg;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('perfil-toast--visivel'));
  setTimeout(() => {
    toast.classList.remove('perfil-toast--visivel');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ─── FETCH COM TIMEOUT ────────────────────────────────────────
async function fetchComTimeout(url, opcoes = {}, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...opcoes, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Tempo de resposta esgotado. Tente novamente.');
    throw err;
  }
}

// ─── CARREGA DADOS DO USUÁRIO DO BACKEND ─────────────────────
async function carregarPerfil() {
  if (!usuario.id) return;

  try {
    const res = await fetchComTimeout(`${API}/usuarios/${usuario.id}`);
    if (!res.ok) return;
    const dados = await res.json();

    // atualiza sessionStorage com dados frescos
    usuario = { ...usuario, ...dados };
    sessionStorage.setItem('usuario', JSON.stringify(usuario));

    // preenche nome
    const elNome = document.getElementById('perfilNome');
    if (elNome) elNome.textContent = dados.nome || usuario.nome || '';

    // preenche foto se existir
    if (dados.fotoPerfil) {
      mostrarFoto(dados.fotoPerfil);
    }
  } catch {
    // fallback para sessionStorage
    const elNome = document.getElementById('perfilNome');
    if (elNome && usuario.nome) elNome.textContent = usuario.nome;
    if (usuario.fotoPerfil) mostrarFoto(usuario.fotoPerfil);
  }
}

function mostrarFoto(url) {
  const img = document.getElementById('fotoImg');
  const icone = document.getElementById('fotoIcone');
  if (!img) return;
  img.src = url;
  img.style.display = 'block';
  img.style.opacity = '1';
  if (icone) icone.style.display = 'none';
}

// ─── SUGESTÕES DO USUÁRIO ─────────────────────────────────────
async function carregarSugestoes() {
  const lista = document.getElementById('listaSugestoes');
  if (!lista || !usuario.id) return;

  try {
    const todas = await (await fetchComTimeout(`${API}/sugestoes?t=${Date.now()}`, { cache: 'no-store' })).json();
    const minhas = todas.filter(s => String(s.autor?._id || s.autor) === String(usuario.id));

    if (!minhas.length) return;

    lista.innerHTML = minhas.map(s => {
      const texto = s.texto || '';
      const data = new Date(s.criadaEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      const status = s.status || (s.respondida ? 'aceita' : 'aguardando');
      const labelStatus = status === 'aceita' ? 'Aceita ✓' : status === 'recusada' ? 'Recusada ✗' : 'Aguardando';
      const cssStatus = status === 'aceita' ? 'status-aprovado' : status === 'recusada' ? 'status-recusado' : 'status-aguardo';
      return `
        <div class="sugestao-item">
          <div class="sugestao-texto">
            <div class="sugestao-titulo">${texto.slice(0, 60)}${texto.length > 60 ? '...' : ''}</div>
            <div class="sugestao-desc">${data}</div>
          </div>
          <span class="status-badge ${cssStatus}">${labelStatus}</span>
        </div>`;
    }).join('');
  } catch (err) {
    console.error('Erro ao carregar sugestoes:', err);
  }
}

// ─── UPLOAD DE FOTO ───────────────────────────────────────────
async function uploadFoto(file) {
  if (!file || !usuario.id) return;

  const img = document.getElementById('fotoImg');
  const icone = document.getElementById('fotoIcone');

  // preview imediato
  const urlPreview = URL.createObjectURL(file);
  img.src = urlPreview;
  img.style.display = 'block';
  img.style.opacity = '0.45';
  if (icone) icone.style.display = 'none';

  const btnSalvarEl = document.getElementById('btnSalvar');
  if (btnSalvarEl) btnSalvarEl.disabled = true;

  try {
    const formData = new FormData();
    formData.append('foto', file);

    const res = await fetchComTimeout(`${API}/usuarios/${usuario.id}/foto`, {
      method: 'POST',
      body: formData
    }, 30000);

    const dados = await res.json();

    if (!res.ok) throw new Error(dados.erro || 'Erro no upload.');

    // confirma URL definitiva do Cloudinary
    img.src = dados.url;
    img.style.opacity = '1';
    usuario.fotoPerfil = dados.url;
    sessionStorage.setItem('usuario', JSON.stringify(usuario));
    showToast('Foto atualizada com sucesso!');

  } catch (err) {
    console.error('Erro upload foto:', err);
    // mantém preview local mesmo sem salvar no servidor
    img.style.opacity = '1';
    showToast(err.message || 'Erro ao enviar foto. Tente novamente.', 'erro');
  } finally {
    if (btnSalvarEl) btnSalvarEl.disabled = false;
  }
}

// ─── SALVAR NOME NO BACKEND ───────────────────────────────────
async function salvarNome(novoNome) {
  if (!usuario.id || !novoNome.trim()) return false;
  try {
    const res = await fetchComTimeout(`${API}/usuarios/${usuario.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoNome.trim() })
    });

    const dados = await res.json();

    if (!res.ok) throw new Error(dados.erro || 'Erro ao salvar.');

    if (dados.usuario) {
      usuario = { ...usuario, ...dados.usuario };
      sessionStorage.setItem('usuario', JSON.stringify(usuario));
    }
    return true;

  } catch (err) {
    console.error('Erro ao salvar nome:', err);
    throw err; // propaga para sairEdicao tratar
  }
}

// ─── EDIÇÃO DE PERFIL ─────────────────────────────────────────
const card = document.querySelector('.perfil-card');
const btnEditar = document.getElementById('btnEditar');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancel = document.getElementById('btnCancelar');
const nome = document.getElementById('perfilNome');
const desc = document.getElementById('perfilDesc');
const fotoWrap = document.querySelector('.foto-trocar');
const inputFoto = document.getElementById('inputFoto');

let nomeOriginal, descOriginal;

function entrarEdicao() {
  nomeOriginal = nome.textContent;
  descOriginal = desc.value;
  card.classList.add('editando');
  nome.setAttribute('contenteditable', 'true');
  desc.removeAttribute('readonly');
  nome.focus();

  // coloca cursor no fim do texto
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(nome);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
}

async function sairEdicao(salvar) {
  if (salvar) {
    const novoNome = nome.textContent.trim();

    if (!novoNome) {
      showToast('O nome não pode ser vazio.', 'erro');
      nome.focus();
      return;
    }

    if (novoNome !== nomeOriginal) {
      // estado de carregando
      btnSalvar.textContent = 'Salvando...';
      btnSalvar.disabled = true;
      btnCancel.disabled = true;

      try {
        await salvarNome(novoNome);
        showToast('Nome salvo com sucesso!');
      } catch (err) {
        // rollback visual
        nome.textContent = nomeOriginal;
        showToast(err.message || 'Erro ao salvar nome. Tente novamente.', 'erro');
        // mantém em modo edição para o usuário tentar de novo
        btnSalvar.textContent = 'Salvar';
        btnSalvar.disabled = false;
        btnCancel.disabled = false;
        return;
      }

      btnSalvar.textContent = 'Salvar';
      btnSalvar.disabled = false;
      btnCancel.disabled = false;
    }
  } else {
    nome.textContent = nomeOriginal;
    desc.value = descOriginal;
  }

  card.classList.remove('editando');
  nome.setAttribute('contenteditable', 'false');
  desc.setAttribute('readonly', '');
}

btnEditar.addEventListener('click', entrarEdicao);
btnSalvar.addEventListener('click', () => sairEdicao(true));
btnCancel.addEventListener('click', () => sairEdicao(false));

// troca de foto
fotoWrap.addEventListener('click', () => {
  if (card.classList.contains('editando')) inputFoto.click();
});
inputFoto.addEventListener('change', () => {
  const file = inputFoto.files[0];
  if (file) uploadFoto(file);
  inputFoto.value = ''; // permite reenviar o mesmo arquivo
});

// ─── TOGGLE SUGESTÕES ─────────────────────────────────────────
const btnSugestoes = document.getElementById('btnSugestoes');
const listaSugestoes = document.getElementById('listaSugestoes');

btnSugestoes.addEventListener('click', () => {
  const aberto = listaSugestoes.classList.contains('aberto');
  listaSugestoes.classList.toggle('aberto', !aberto);
  btnSugestoes.classList.toggle('aberto', !aberto);
  btnSugestoes.setAttribute('aria-expanded', String(!aberto));
});

// ─── INIT ─────────────────────────────────────────────────────
carregarPerfil();
carregarSugestoes();
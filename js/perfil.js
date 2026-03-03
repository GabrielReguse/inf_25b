const API = "https://inf-25b-backend.onrender.com";

let usuario = (() => {
  try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); } catch { return {}; }
})();

// ─── CARREGA DADOS DO USUÁRIO DO BACKEND ─────────────────────
async function carregarPerfil() {
  if (!usuario.id) return;

  try {
    const res = await fetch(`${API}/usuarios/${usuario.id}`);
    const dados = await res.json();

    // atualiza sessionStorage com dados frescos
    usuario = { ...usuario, ...dados };
    sessionStorage.setItem('usuario', JSON.stringify(usuario));

    // preenche nome
    const elNome = document.getElementById('perfilNome');
    if (elNome) elNome.textContent = dados.nome || usuario.nome || '';

    // preenche foto se existir
    if (dados.fotoPerfil) {
      const img = document.getElementById('fotoImg');
      const icone = document.getElementById('fotoIcone');
      img.src = dados.fotoPerfil;
      img.style.display = 'block';
      if (icone) icone.style.display = 'none';
    }
  } catch (err) {
    // fallback para sessionStorage
    const elNome = document.getElementById('perfilNome');
    if (elNome && usuario.nome) elNome.textContent = usuario.nome;
  }
}

// ─── SUGESTÕES DO USUÁRIO ─────────────────────────────────────
async function carregarSugestoes() {
  const lista = document.getElementById('listaSugestoes');
  if (!lista || !usuario.id) return;

  try {
    const todas = await (await fetch(`${API}/sugestoes`)).json();
    const minhas = todas.filter(s => String(s.autor?._id || s.autor) === String(usuario.id));

    if (!minhas.length) return;

    lista.innerHTML = minhas.map(s => {
      const texto = s.texto || '';
      const data  = new Date(s.criadaEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      const status      = s.status || (s.respondida ? 'aceita' : 'aguardando');
      const labelStatus = status === 'aceita' ? 'Aceita ✓' : status === 'recusada' ? 'Recusada ✗' : 'Aguardando';
      const cssStatus   = status === 'aceita' ? 'status-aprovado' : status === 'recusada' ? 'status-recusado' : 'status-aguardo';
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

  // preview imediato
  const url = URL.createObjectURL(file);
  const img = document.getElementById('fotoImg');
  const icone = document.getElementById('fotoIcone');
  img.src = url;
  img.style.display = 'block';
  if (icone) icone.style.display = 'none';

  // mostra indicador de carregando
  img.style.opacity = '0.5';

  try {
    const formData = new FormData();
    formData.append('foto', file);

    const res = await fetch(`${API}/usuarios/${usuario.id}/foto`, {
      method: 'POST',
      body: formData
    });

    const dados = await res.json();

    if (!res.ok) throw new Error(dados.erro || 'Erro no upload.');

    // atualiza com URL definitiva do Cloudinary
    img.src = dados.url;
    img.style.opacity = '1';
    usuario.fotoPerfil = dados.url;
    sessionStorage.setItem('usuario', JSON.stringify(usuario));

  } catch (err) {
    console.error('Erro upload foto:', err);
    img.style.opacity = '1';
  }
}

// ─── SALVAR NOME NO BACKEND ───────────────────────────────────
async function salvarNome(novoNome) {
  if (!usuario.id || !novoNome) return;
  try {
    const res = await fetch(`${API}/usuarios/${usuario.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoNome })
    });
    const dados = await res.json();
    if (res.ok && dados.usuario) {
      usuario = { ...usuario, ...dados.usuario };
      sessionStorage.setItem('usuario', JSON.stringify(usuario));
    }
  } catch (err) {
    console.error('Erro ao salvar nome:', err);
  }
}

// ─── EDIÇÃO DE PERFIL ─────────────────────────────────────────
const card      = document.querySelector('.perfil-card');
const btnEditar = document.getElementById('btnEditar');
const btnSalvar = document.getElementById('btnSalvar');
const btnCancel = document.getElementById('btnCancelar');
const nome      = document.getElementById('perfilNome');
const desc      = document.getElementById('perfilDesc');
const fotoWrap  = document.querySelector('.foto-trocar');
const inputFoto = document.getElementById('inputFoto');

let nomeOriginal, descOriginal;

function entrarEdicao() {
  nomeOriginal = nome.textContent;
  descOriginal = desc.value;
  card.classList.add('editando');
  nome.setAttribute('contenteditable', 'true');
  desc.removeAttribute('readonly');
  nome.focus();
}

async function sairEdicao(salvar) {
  if (salvar) {
    const novoNome = nome.textContent.trim();
    if (novoNome && novoNome !== nomeOriginal) {
      await salvarNome(novoNome);
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
fotoWrap.addEventListener('click', () => inputFoto.click());
inputFoto.addEventListener('change', () => {
  const file = inputFoto.files[0];
  if (file) uploadFoto(file);
});

// ─── TOGGLE SUGESTÕES ─────────────────────────────────────────
const btnSugestoes   = document.getElementById('btnSugestoes');
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
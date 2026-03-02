const API = "https://inf-25b-backend.onrender.com";

const usuario = (() => {
  try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); } catch { return {}; }
})();

// ─── CARREGA DADOS DO USUÁRIO LOGADO ─────────────────────────
function carregarPerfil() {
  if (!usuario.id) return;
  const elNome = document.getElementById('perfilNome');
  if (elNome && usuario.nome) elNome.textContent = usuario.nome;
}

// ─── SUGESTÕES DO USUÁRIO ─────────────────────────────────────
async function carregarSugestoes() {
  const lista = document.getElementById('listaSugestoes');
  if (!lista || !usuario.id) return;

  try {
    const res  = await fetch(`${API}/sugestoes`);
    const todas = await res.json();

    const minhas = todas.filter(s =>
      String(s.autor?._id || s.autor) === String(usuario.id)
    );

    if (!minhas.length) return;

    lista.innerHTML = minhas.map(s => {
      const texto = s.texto || '';
      const data  = new Date(s.criadaEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      const status      = s.respondida ? 'status-aprovado' : 'status-aguardo';
      const labelStatus = s.respondida ? 'Respondida ✓' : 'Aguardando';
      return `
        <div class="sugestao-item">
          <div class="sugestao-texto">
            <div class="sugestao-titulo">${texto.slice(0, 60)}${texto.length > 60 ? '...' : ''}</div>
            <div class="sugestao-desc">${data}</div>
          </div>
          <span class="status-badge ${status}">${labelStatus}</span>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Erro ao carregar sugestoes:', err);
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

function sairEdicao(salvar) {
  if (salvar) {
    const novoNome = nome.textContent.trim();
    if (novoNome && usuario.nome !== novoNome) {
      usuario.nome = novoNome;
      sessionStorage.setItem('usuario', JSON.stringify(usuario));
    }
  } else {
    nome.textContent = nomeOriginal;
    desc.value       = descOriginal;
  }
  card.classList.remove('editando');
  nome.setAttribute('contenteditable', 'false');
  desc.setAttribute('readonly', '');
}

btnEditar.addEventListener('click', entrarEdicao);
btnSalvar.addEventListener('click', () => sairEdicao(true));
btnCancel.addEventListener('click', () => sairEdicao(false));

fotoWrap.addEventListener('click', () => inputFoto.click());

inputFoto.addEventListener('change', () => {
  const file = inputFoto.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = document.getElementById('fotoImg');
  img.src = url;
  img.style.display = 'block';
  document.getElementById('fotoIcone').style.display = 'none';
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
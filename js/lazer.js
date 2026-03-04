const API = "https://inf-25b-backend.onrender.com";

const usuario = (() => {
  try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); }
  catch { return {}; }
})();
const meuNome = usuario.nome || usuario.email || 'Você';

let encontros = [];
let posts = [];

// votos do instagram persistidos por sessão
let meusVotos = {};
try { meusVotos = JSON.parse(sessionStorage.getItem('meusVotos') || '{}'); } catch (_) { }

function salvarVotos() {
  sessionStorage.setItem('meusVotos', JSON.stringify(meusVotos));
}

let abaAtiva = 'encontros';

const elAbaEncontros = document.getElementById('abaEncontros');
const elAbaInstagram = document.getElementById('abaInstagram');
const elSeta = document.getElementById('abaSeta');
const elPainelEnc = document.getElementById('painelEncontros');
const elPainelInst = document.getElementById('painelInstagram');

function posicionarSeta(aba) {
  const btn = aba === 'encontros' ? elAbaEncontros : elAbaInstagram;
  const wrap = document.getElementById('abaSetaWrap');
  const rect = btn.getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();
  elSeta.style.left = (rect.left - wrapRect.left + rect.width / 2) + 'px';
}

function trocarAba(aba) {
  abaAtiva = aba;
  elAbaEncontros.classList.toggle('ativa', aba === 'encontros');
  elAbaInstagram.classList.toggle('ativa', aba === 'instagram');
  elPainelEnc.classList.toggle('ativo', aba === 'encontros');
  elPainelInst.classList.toggle('ativo', aba === 'instagram');
  posicionarSeta(aba);
  if (aba === 'encontros') renderEncontros();
  else renderInstagram();
}

elAbaEncontros.addEventListener('click', () => trocarAba('encontros'));
elAbaInstagram.addEventListener('click', () => trocarAba('instagram'));
window.addEventListener('resize', () => posicionarSeta(abaAtiva));

// ─── CARREGA SUGESTÕES ACEITAS DO BACKEND ────────────────────
async function carregarSugestoes() {
  try {
    elPainelEnc.innerHTML = '<div class="vazio-msg">Carregando...</div>';
    const todas = await (await fetch(`${API}/sugestoes`)).json();
    const aceitas = todas.filter(s => s.status === 'aceita');

    encontros = [];
    posts = [];

    aceitas.forEach(s => {
      const texto = s.texto || '';
      // tenta identificar o tipo pela palavra-chave no texto
      if (texto.toLowerCase().includes('instagram') || texto.toLowerCase().includes('post')) {
        posts.push({
          id: s._id,
          titulo: s.autor?.nome || 'Sugestão',
          descricao: texto,
          link: '',
          votos: { legal: 0, nao: 0 }
        });
      } else {
        encontros.push({
          id: s._id,
          titulo: s.autor?.nome || 'Encontro',
          descricao: texto,
          confirmados: []
        });
      }
    });

    trocarAba('encontros');
  } catch (err) {
    console.error(err);
    elPainelEnc.innerHTML = '<div class="vazio-msg">Erro ao carregar sugestões.</div>';
  }
}

// ENCONTROS
function renderEncontros() {
  const el = elPainelEnc;
  el.innerHTML = '';

  if (!encontros.length) {
    el.innerHTML = '<div class="vazio-msg">Nenhum encontro por enquanto.<br>Use a aba de Sugestões para propor um!</div>';
    return;
  }

  encontros.forEach(ev => {
    const euConfirmei = ev.confirmados.some(p => (p.nome || p) === meuNome);
    const ultimos3 = ev.confirmados.slice(-3);

    const card = document.createElement('div');
    card.className = 'item-card';
    card.id = `enc-${ev.id}`;

    card.innerHTML = `
      <span class="item-titulo">${ev.titulo}</span>
      <span class="item-desc">${ev.descricao}</span>
      <div class="presenca-avatares" id="avatares-${ev.id}">
        ${ultimos3.map(p => avatarMini(p.nome || p, p.foto || null)).join('')}
        ${ev.confirmados.length > 0
          ? `<span class="presenca-count">${ev.confirmados.length} confirmado${ev.confirmados.length > 1 ? 's' : ''}</span>`
          : ''}
      </div>
      <button class="btn-participar${euConfirmei ? ' saindo' : ''}" id="btn-enc-${ev.id}">
        ${euConfirmei ? 'Quero Sair' : 'Irei Participar'}
      </button>`;

    card.querySelector(`#btn-enc-${ev.id}`).addEventListener('click', () => togglePresenca(ev.id));
    el.appendChild(card);
  });
}

function togglePresenca(id) {
  const ev = encontros.find(e => e.id === id);
  if (!ev) return;
  const idx = ev.confirmados.findIndex(p => (p.nome || p) === meuNome);
  if (idx >= 0) ev.confirmados.splice(idx, 1);
  else ev.confirmados.push({ nome: meuNome, foto: usuario.fotoPerfil || null });
  renderEncontros();
}

function avatarMini(nome, foto) {
  const iniciais = (nome || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  if (foto) return `<div class="avatar-mini" title="${nome}" style="width:28px;height:28px;border-radius:50%;overflow:hidden;border:2px solid rgba(139,92,246,.4)"><img src="${foto}" style="width:100%;height:100%;object-fit:cover"/></div>`;
  return `<div class="avatar-mini" title="${nome}" style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:#fff">${iniciais}</div>`;
}

// INSTAGRAM
function renderInstagram() {
  const el = elPainelInst;
  el.innerHTML = '';

  if (!posts.length) {
    el.innerHTML = '<div class="vazio-msg">Nenhuma ideia de post ainda.<br>Sugira uma na aba de Sugestões!</div>';
    return;
  }

  posts.forEach(post => {
    const meuVoto = meusVotos[post.id] || null;
    const totalVotos = post.votos.legal + post.votos.nao;
    const pctLegal = totalVotos ? Math.round(post.votos.legal / totalVotos * 100) : 50;
    const pctNao = totalVotos ? 100 - pctLegal : 50;

    const card = document.createElement('div');
    card.className = 'item-card';

    card.innerHTML = `
      <span class="item-titulo">${post.titulo}</span>
      <span class="item-desc">${post.descricao}</span>
      ${post.link ? `<a class="item-link" href="${post.link}" target="_blank" rel="noopener">Ver publicação</a>` : ''}
      <div class="votos-wrap">
        <div class="votos-barra-wrap">
          <div class="votos-barra-legal" id="barra-legal-${post.id}" style="width:${pctLegal}%"></div>
          <div class="votos-barra-nao"   id="barra-nao-${post.id}"   style="width:${pctNao}%"></div>
        </div>
        <div class="votos-labels">
          <span id="label-legal-${post.id}">${post.votos.legal} acharam legal</span>
          <span id="label-nao-${post.id}">${post.votos.nao} não sei não</span>
        </div>
      </div>
      <div class="votos-btns">
        <button class="btn-voto${meuVoto === 'legal' ? ' ativo-legal' : ''}" id="btn-legal-${post.id}">👍 Acho Legal</button>
        <button class="btn-voto${meuVoto === 'nao' ? ' ativo-nao' : ''}" id="btn-nao-${post.id}">🤷 Não Sei Não</button>
      </div>`;

    card.querySelector(`#btn-legal-${post.id}`).addEventListener('click', () => votar(post.id, 'legal'));
    card.querySelector(`#btn-nao-${post.id}`).addEventListener('click', () => votar(post.id, 'nao'));
    el.appendChild(card);
  });
}

function votar(id, tipo) {
  const post = posts.find(p => p.id === id);
  if (!post) return;
  const anterior = meusVotos[id];
  if (anterior === tipo) return;
  if (anterior) post.votos[anterior]--;
  post.votos[tipo]++;
  meusVotos[id] = tipo;
  salvarVotos();

  const total = post.votos.legal + post.votos.nao;
  const pctLegal = total ? Math.round(post.votos.legal / total * 100) : 50;
  document.getElementById(`barra-legal-${id}`).style.width = pctLegal + '%';
  document.getElementById(`barra-nao-${id}`).style.width = (100 - pctLegal) + '%';
  document.getElementById(`label-legal-${id}`).textContent = `${post.votos.legal} acharam legal`;
  document.getElementById(`label-nao-${id}`).textContent = `${post.votos.nao} não sei não`;
  document.getElementById(`btn-legal-${id}`).className = 'btn-voto' + (tipo === 'legal' ? ' ativo-legal' : '');
  document.getElementById(`btn-nao-${id}`).className = 'btn-voto' + (tipo === 'nao' ? ' ativo-nao' : '');
}

// init
carregarSugestoes();
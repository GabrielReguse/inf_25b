const API = "https://inf-25b-backend.onrender.com";

const usuario = (() => {
  try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); }
  catch { return {}; }
})();
const meuNome  = usuario.nome  || usuario.email || 'Você';
const ehAdmin  = usuario.role  === 'admin';

let encontros  = [];
let posts      = [];
let melhorias  = [];

// votos do instagram persistidos por sessão
let meusVotos = {};
try { meusVotos = JSON.parse(sessionStorage.getItem('meusVotos') || '{}'); } catch (_) {}
function salvarVotos() { sessionStorage.setItem('meusVotos', JSON.stringify(meusVotos)); }

let abaAtiva = 'encontros';

const elAbaEncontros  = document.getElementById('abaEncontros');
const elAbaInstagram  = document.getElementById('abaInstagram');
const elAbaMelhorias  = document.getElementById('abaMelhorias');
const elSeta          = document.getElementById('abaSeta');
const elPainelEnc     = document.getElementById('painelEncontros');
const elPainelInst    = document.getElementById('painelInstagram');
const elPainelMel     = document.getElementById('painelMelhorias');

// Exibe aba melhorias só para admin
if (ehAdmin) elAbaMelhorias.style.display = '';

// ─── SETA ────────────────────────────────────────────────────
function posicionarSeta(aba) {
  const map = { encontros: elAbaEncontros, instagram: elAbaInstagram, melhorias: elAbaMelhorias };
  const btn = map[aba];
  if (!btn || btn.style.display === 'none') return;
  const wrap    = document.getElementById('abaSetaWrap');
  const rect    = btn.getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();
  elSeta.style.left = (rect.left - wrapRect.left + rect.width / 2) + 'px';
}

// ─── TROCAR ABA ───────────────────────────────────────────────
function trocarAba(aba) {
  abaAtiva = aba;
  elAbaEncontros.classList.toggle('ativa', aba === 'encontros');
  elAbaInstagram.classList.toggle('ativa', aba === 'instagram');
  elAbaMelhorias.classList.toggle('ativa', aba === 'melhorias');
  elPainelEnc.classList.toggle('ativo', aba === 'encontros');
  elPainelInst.classList.toggle('ativo', aba === 'instagram');
  elPainelMel.classList.toggle('ativo', aba === 'melhorias');
  posicionarSeta(aba);
  if (aba === 'encontros') renderEncontros();
  else if (aba === 'instagram') renderInstagram();
  else renderMelhorias();
}

elAbaEncontros.addEventListener('click', () => trocarAba('encontros'));
elAbaInstagram.addEventListener('click', () => trocarAba('instagram'));
elAbaMelhorias.addEventListener('click', () => trocarAba('melhorias'));
window.addEventListener('resize', () => posicionarSeta(abaAtiva));

// ─── CARREGA SUGESTÕES ────────────────────────────────────────
async function carregarSugestoes() {
  try {
    elPainelEnc.innerHTML = '<div class="vazio-msg">Carregando...</div>';
    const todas = await (await fetch(`${API}/sugestoes`)).json();

    encontros = [];
    posts     = [];
    melhorias = [];

    todas.forEach(s => {
      const texto = s.texto || '';
      const tipo  = texto.match(/^\[(\w+)\]/)?.[1]?.toLowerCase() || '';

      if (tipo === 'melhoria') {
        // melhorias: aparece para admin se aceita, em_andamento ou finalizado
        if (ehAdmin && ['aceita', 'em_andamento', 'finalizado'].includes(s.status)) {
          melhorias.push({
            id:        s._id,
            titulo:    extrairTitulo(texto),
            descricao: extrairDesc(texto),
            autor:     s.autor?.nome || 'Anônimo',
            status:    s.status
          });
        }
      } else if (tipo === 'instagram' && s.status === 'aceita') {
        posts.push({
          id:       s._id,
          titulo:   s.autor?.nome || 'Sugestão',
          descricao: texto,
          link:     '',
          votos:    { legal: 0, nao: 0 }
        });
      } else if (s.status === 'aceita') {
        encontros.push({
          id:          s._id,
          titulo:      s.autor?.nome || 'Encontro',
          descricao:   texto,
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

function extrairTitulo(texto) {
  // formato: [tipo] Título — Descrição
  const semTipo = texto.replace(/^\[\w+\]\s*/, '');
  return semTipo.split(' — ')[0] || semTipo;
}

function extrairDesc(texto) {
  const semTipo = texto.replace(/^\[\w+\]\s*/, '');
  const partes  = semTipo.split(' — ');
  return partes.slice(1).join(' — ') || '';
}

// ─── ENCONTROS ───────────────────────────────────────────────
function renderEncontros() {
  const el = elPainelEnc;
  el.innerHTML = '';

  if (!encontros.length) {
    el.innerHTML = '<div class="vazio-msg">Nenhum encontro por enquanto.<br>Use a aba de Sugestões para propor um!</div>';
    return;
  }

  encontros.forEach(ev => {
    const euConfirmei = ev.confirmados.some(p => (p.nome || p) === meuNome);
    const ultimos3    = ev.confirmados.slice(-3);

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
  const ev  = encontros.find(e => e.id === id);
  if (!ev) return;
  const idx = ev.confirmados.findIndex(p => (p.nome || p) === meuNome);
  if (idx >= 0) ev.confirmados.splice(idx, 1);
  else ev.confirmados.push({ nome: meuNome, foto: usuario.fotoPerfil || null });
  renderEncontros();
}

function avatarMini(nome, foto) {
  const iniciais = (nome || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  if (foto) return `<div class="avatar-mini" title="${nome}"><img src="${foto}" style="width:100%;height:100%;object-fit:cover"/></div>`;
  return `<div class="avatar-mini avatar-mini--letra" title="${nome}">${iniciais}</div>`;
}

// ─── INSTAGRAM ───────────────────────────────────────────────
function renderInstagram() {
  const el = elPainelInst;
  el.innerHTML = '';

  if (!posts.length) {
    el.innerHTML = '<div class="vazio-msg">Nenhuma ideia de post ainda.<br>Sugira uma na aba de Sugestões!</div>';
    return;
  }

  posts.forEach(post => {
    const meuVoto   = meusVotos[post.id] || null;
    const totalVotos = post.votos.legal + post.votos.nao;
    const pctLegal  = totalVotos ? Math.round(post.votos.legal / totalVotos * 100) : 50;
    const pctNao    = totalVotos ? 100 - pctLegal : 50;

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
        <button class="btn-voto${meuVoto === 'nao'   ? ' ativo-nao'   : ''}" id="btn-nao-${post.id}">🤷 Não Sei Não</button>
      </div>`;
    card.querySelector(`#btn-legal-${post.id}`).addEventListener('click', () => votar(post.id, 'legal'));
    card.querySelector(`#btn-nao-${post.id}`).addEventListener('click',   () => votar(post.id, 'nao'));
    el.appendChild(card);
  });
}

function votar(id, tipo) {
  const post     = posts.find(p => p.id === id);
  if (!post) return;
  const anterior = meusVotos[id];
  if (anterior === tipo) return;
  if (anterior) post.votos[anterior]--;
  post.votos[tipo]++;
  meusVotos[id] = tipo;
  salvarVotos();

  const total    = post.votos.legal + post.votos.nao;
  const pctLegal = total ? Math.round(post.votos.legal / total * 100) : 50;
  document.getElementById(`barra-legal-${id}`).style.width = pctLegal + '%';
  document.getElementById(`barra-nao-${id}`).style.width   = (100 - pctLegal) + '%';
  document.getElementById(`label-legal-${id}`).textContent = `${post.votos.legal} acharam legal`;
  document.getElementById(`label-nao-${id}`).textContent   = `${post.votos.nao} não sei não`;
  document.getElementById(`btn-legal-${id}`).className = 'btn-voto' + (tipo === 'legal' ? ' ativo-legal' : '');
  document.getElementById(`btn-nao-${id}`).className   = 'btn-voto' + (tipo === 'nao'   ? ' ativo-nao'   : '');
}

// ─── MELHORIAS (admin only) ───────────────────────────────────
function renderMelhorias() {
  const el = elPainelMel;
  el.innerHTML = '';

  if (!melhorias.length) {
    el.innerHTML = '<div class="vazio-msg">Nenhuma melhoria aceita ainda.</div>';
    return;
  }

  melhorias.forEach(m => renderCardMelhoria(m, el));
}

function renderCardMelhoria(m, container) {
  const statusInfo = {
    aceita:       { label: 'Aguardando',   cls: 'status-aguardando' },
    em_andamento: { label: 'Em andamento', cls: 'status-andamento'  },
    finalizado:   { label: 'Finalizado',   cls: 'status-finalizado' }
  };
  const info = statusInfo[m.status] || statusInfo.aceita;

  const card = document.createElement('div');
  card.className = 'item-card';
  card.id = `mel-${m.id}`;
  card.innerHTML = `
    <div class="mel-header">
      <span class="item-titulo">${m.titulo}</span>
      <span class="mel-status ${info.cls}">${info.label}</span>
    </div>
    <span class="item-desc">${m.descricao || 'Sem descrição.'}</span>
    <span class="mel-autor">por ${m.autor}</span>
    <div class="mel-acoes">
      <button class="btn-mel-andamento${m.status === 'em_andamento' ? ' ativo' : ''}"
              id="btn-and-${m.id}"
              ${m.status === 'finalizado' ? 'disabled' : ''}>
        ⚙️ Em andamento
      </button>
      <button class="btn-mel-finalizado${m.status === 'finalizado' ? ' ativo' : ''}"
              id="btn-fin-${m.id}">
        ✅ Finalizado
      </button>
    </div>`;

  const btnAnd = card.querySelector(`#btn-and-${m.id}`);
  const btnFin = card.querySelector(`#btn-fin-${m.id}`);

  btnAnd.addEventListener('click', () => atualizarMelhoria(m.id, 'em_andamento'));
  btnFin.addEventListener('click', () => atualizarMelhoria(m.id, 'finalizado'));

  container.appendChild(card);
}

async function atualizarMelhoria(id, novoStatus) {
  try {
    const res = await fetch(`${API}/sugestoes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus })
    });
    if (!res.ok) throw new Error();
    const m = melhorias.find(x => x.id === id);
    if (m) m.status = novoStatus;
    renderMelhorias();
  } catch {
    alert('Erro ao atualizar status.');
  }
}

// init
carregarSugestoes();
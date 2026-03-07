const API = "https://inf-25b-backend.onrender.com";

const usuario = (() => {
  try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); }
  catch { return {}; }
})();
const meuId   = usuario.id   || '';
const meuNome = usuario.nome || '';
const ehAdmin = usuario.role === 'admin';

let encontros = [];
let posts     = [];
let melhorias = [];
let abaAtiva  = 'encontros';

const elAbaEncontros = document.getElementById('abaEncontros');
const elAbaInstagram = document.getElementById('abaInstagram');
const elAbaMelhorias = document.getElementById('abaMelhorias');
const elSeta         = document.getElementById('abaSeta');
const elPainelEnc    = document.getElementById('painelEncontros');
const elPainelInst   = document.getElementById('painelInstagram');
const elPainelMel    = document.getElementById('painelMelhorias');

if (ehAdmin) elAbaMelhorias.style.display = '';

// ─── SETA ────────────────────────────────────────────────────
function posicionarSeta(aba) {
  const map = { encontros: elAbaEncontros, instagram: elAbaInstagram, melhorias: elAbaMelhorias };
  const btn = map[aba];
  if (!btn || btn.style.display === 'none') return;
  const wrap = document.getElementById('abaSetaWrap');
  const rect = btn.getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();
  elSeta.style.left = (rect.left - wrapRect.left + rect.width / 2) + 'px';
}

function trocarAba(aba) {
  abaAtiva = aba;
  elAbaEncontros.classList.toggle('ativa', aba === 'encontros');
  elAbaInstagram.classList.toggle('ativa', aba === 'instagram');
  elAbaMelhorias.classList.toggle('ativa', aba === 'melhorias');
  elPainelEnc.classList.toggle('ativo', aba === 'encontros');
  elPainelInst.classList.toggle('ativo', aba === 'instagram');
  elPainelMel.classList.toggle('ativo', aba === 'melhorias');
  posicionarSeta(aba);
  if (aba === 'encontros')     renderEncontros();
  else if (aba === 'instagram') renderInstagram();
  else                          renderMelhorias();
}

elAbaEncontros.addEventListener('click', () => trocarAba('encontros'));
elAbaInstagram.addEventListener('click', () => trocarAba('instagram'));
elAbaMelhorias.addEventListener('click', () => trocarAba('melhorias'));
window.addEventListener('resize', () => posicionarSeta(abaAtiva));

// ─── HELPERS DE PARSE (compatibilidade com sugestões antigas) ─
function parseTipoFromTexto(texto) {
  return texto?.match(/^\[(\w+)\]/)?.[1]?.toLowerCase() || '';
}
function extrairTitulo(texto) {
  const semTipo = (texto || '').replace(/^\[\w+\]\s*/, '');
  return semTipo.split(' — ')[0] || semTipo;
}
function extrairDesc(texto) {
  const semTipo = (texto || '').replace(/^\[\w+\]\s*/, '');
  const partes = semTipo.split(' — ');
  return partes.slice(1).join(' — ') || '';
}

// ─── FORMATAÇÃO DE TEXTO ─────────────────────────────────────
// Preserva quebras de linha e torna links clicáveis
function formatarTexto(texto) {
  if (!texto) return '';
  let html = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  // Linkifica URLs
  html = html.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener" class="item-link-inline">$1</a>'
  );
  // Preserva quebras de linha
  html = html.replace(/\n/g, '<br>');
  return html;
}

// ─── COUNTDOWN ───────────────────────────────────────────────
function calcularDiasRestantes(tipo, criadaEm, dataEncontro) {
  const agora = new Date();
  if (tipo === 'instagram' && criadaEm) {
    const criacao = new Date(criadaEm);
    const expira  = new Date(criacao.getTime() + 7 * 24 * 60 * 60 * 1000);
    return Math.max(0, Math.ceil((expira - agora) / (1000 * 60 * 60 * 24)));
  }
  if (tipo === 'encontro' && dataEncontro) {
    const evento     = new Date(dataEncontro);
    const fimVotacao = new Date(evento.getTime() - 24 * 60 * 60 * 1000);
    return Math.max(0, Math.ceil((fimVotacao - agora) / (1000 * 60 * 60 * 24)));
  }
  return null;
}

function renderCountdown(dias) {
  if (dias === null) return '';
  let cls   = 'item-countdown';
  let label;
  if (dias === 0)      { cls += ' urgente'; label = 'Encerra hoje'; }
  else if (dias === 1) { cls += ' aviso';   label = '1 dia'; }
  else                 {                    label = `${dias} dias`; }
  return `<span class="${cls}" title="Dias restantes para votação">${label}</span>`;
}

// ─── SVGs DE TIPO ────────────────────────────────────────────
const SVG_INSTAGRAM = `
  <svg class="tipo-svg" viewBox="0 0 24 24" aria-label="Instagram">
    <rect x="2" y="2" width="20" height="20" rx="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="1.2" fill="var(--purple-light)" stroke="none"/>
  </svg>`;

const SVG_ENCONTRO = `
  <svg class="tipo-svg" viewBox="0 0 24 24" aria-label="Encontro">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>`;

// ─── AVATAR MINI ─────────────────────────────────────────────
function avatarMini(nome, foto) {
  const iniciais = (nome || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  if (foto) return `<div class="avatar-mini" title="${nome}"><img src="${foto}" alt="${nome}"/></div>`;
  return `<div class="avatar-mini avatar-mini--letra" title="${nome}">${iniciais}</div>`;
}

// ─── LONG PRESS (admin delete) ────────────────────────────────
function adicionarLongPress(el, callback, duracao = 700) {
  let timer = null;
  let ativo = false;

  function iniciar(e) {
    if (e.target.closest('button, a')) return;
    ativo = true;
    el.classList.add('pressionando');
    timer = setTimeout(() => {
      if (ativo) { el.classList.remove('pressionando'); callback(); }
    }, duracao);
  }
  function cancelar() {
    ativo = false;
    clearTimeout(timer);
    el.classList.remove('pressionando');
  }

  el.addEventListener('touchstart', iniciar, { passive: true });
  el.addEventListener('touchend',   cancelar);
  el.addEventListener('touchmove',  cancelar, { passive: true });
  el.addEventListener('mousedown',  iniciar);
  el.addEventListener('mouseup',    cancelar);
  el.addEventListener('mouseleave', cancelar);
}

// ─── APAGAR SUGESTÃO ─────────────────────────────────────────
async function deletarSugestao(id) {
  if (!confirm('Apagar esta sugestão permanentemente?')) return;
  try {
    const res = await fetch(`${API}/sugestoes/${id}`, {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ solicitanteId: meuId })
    });
    if (!res.ok) throw new Error();
    await carregarSugestoes();
  } catch {
    alert('Erro ao apagar sugestão.');
  }
}

// ─── MODAL DE PARTICIPANTES ──────────────────────────────────
function mostrarModalParticipantes(confirmados) {
  if (!confirmados.length) return;

  const modal = document.createElement('div');
  modal.className = 'modal-participantes';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-titulo">PARTICIPANTES</span>
        <button class="modal-fechar" aria-label="Fechar">
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-lista">
        ${confirmados.map(p => {
          const nome    = p.nome || 'Usuário';
          const foto    = p.fotoPerfil || null;
          const iniciais = nome.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
          return `
            <div class="modal-item">
              ${foto
                ? `<img src="${foto}" class="modal-foto" alt="${nome}">`
                : `<div class="modal-foto modal-foto--letra">${iniciais}</div>`}
              <span class="modal-nome">${nome}</span>
            </div>`;
        }).join('')}
      </div>
    </div>`;

  document.body.appendChild(modal);
  const fechar = () => modal.remove();
  modal.querySelector('.modal-fechar').addEventListener('click', fechar);
  modal.querySelector('.modal-overlay').addEventListener('click', fechar);
}

// ─── CARREGA SUGESTÕES ────────────────────────────────────────
async function carregarSugestoes() {
  try {
    elPainelEnc.innerHTML = '<div class="vazio-msg">Carregando...</div>';
    const todas = await (await fetch(`${API}/sugestoes`)).json();

    encontros = [];
    posts     = [];
    melhorias = [];

    todas.forEach(s => {
      // Suporte a formato novo (campos diretos) e antigo (parse do texto)
      const tipo     = s.tipo || parseTipoFromTexto(s.texto);
      const titulo   = s.titulo   || extrairTitulo(s.texto || '');
      const descricao = s.descricao || extrairDesc(s.texto || '');

      if (tipo === 'melhoria') {
        if (ehAdmin && ['aceita', 'em_andamento', 'finalizado'].includes(s.status)) {
          melhorias.push({
            id:       s._id,
            titulo,
            descricao,
            autor:    s.autor?.nome || 'Anônimo',
            status:   s.status
          });
        }

      } else if (tipo === 'instagram' && s.status === 'aceita') {
        const votosLegal = Array.isArray(s.votos?.legal) ? s.votos.legal : [];
        const votosNao   = Array.isArray(s.votos?.nao)   ? s.votos.nao   : [];
        const meuVoto    = votosLegal.some(id => String(id) === String(meuId)) ? 'legal'
                         : votosNao.some(id => String(id) === String(meuId))   ? 'nao'
                         : null;
        posts.push({
          id:       s._id,
          titulo,
          descricao,
          autor:    s.autor?.nome || 'Anônimo',
          criadaEm: s.criadaEm,
          votos:    { legal: votosLegal.length, nao: votosNao.length },
          meuVoto
        });

      } else if (tipo === 'encontro' && s.status === 'aceita') {
        encontros.push({
          id:           s._id,
          titulo,
          descricao,
          autor:        s.autor?.nome || 'Anônimo',
          dataEncontro: s.dataEncontro,
          criadaEm:     s.criadaEm,
          confirmados:  Array.isArray(s.confirmados) ? s.confirmados : []
        });
      }
    });

    trocarAba(abaAtiva);
  } catch (err) {
    console.error(err);
    elPainelEnc.innerHTML = '<div class="vazio-msg">Erro ao carregar sugestões.</div>';
  }
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
    const euConfirmei = ev.confirmados.some(p => String(p._id || p) === String(meuId));
    const dias = calcularDiasRestantes('encontro', ev.criadaEm, ev.dataEncontro);

    const dataFormatada = ev.dataEncontro
      ? new Date(ev.dataEncontro).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null;

    const card = document.createElement('div');
    card.className = 'item-card';
    card.id = `enc-${ev.id}`;
    card.innerHTML = `
      <div class="item-header-row">
        ${renderCountdown(dias)}
        <span class="item-titulo">${ev.titulo}</span>
        <div class="item-tipo-icon">${SVG_ENCONTRO}</div>
      </div>
      ${dataFormatada ? `<span class="item-data-evento">📅 ${dataFormatada}</span>` : ''}
      <div class="item-desc">${formatarTexto(ev.descricao)}</div>
      <div class="presenca-avatares" id="avatares-${ev.id}" role="button" tabindex="0" aria-label="Ver lista de participantes">
        ${ev.confirmados.slice(-5).map(p => avatarMini(p.nome || p, p.fotoPerfil || null)).join('')}
        <span class="presenca-count">
          ${ev.confirmados.length > 0
            ? `${ev.confirmados.length} confirmado${ev.confirmados.length > 1 ? 's' : ''}`
            : 'Nenhum confirmado ainda'}
        </span>
      </div>
      <button class="btn-participar${euConfirmei ? ' saindo' : ''}" id="btn-enc-${ev.id}">
        ${euConfirmei ? '✖ Quero Sair' : '✓ Irei Participar'}
      </button>
      ${ehAdmin ? `<span class="mel-autor">por ${ev.autor}</span>` : ''}`;

    // Click nos avatares → modal de participantes
    const elAvatares = card.querySelector(`#avatares-${ev.id}`);
    elAvatares.addEventListener('click', () => {
      if (ev.confirmados.length) mostrarModalParticipantes(ev.confirmados);
    });
    elAvatares.addEventListener('keydown', e => {
      if (e.key === 'Enter' && ev.confirmados.length) mostrarModalParticipantes(ev.confirmados);
    });

    card.querySelector(`#btn-enc-${ev.id}`).addEventListener('click', () => togglePresenca(ev.id));

    if (ehAdmin) adicionarLongPress(card, () => deletarSugestao(ev.id));

    el.appendChild(card);
  });
}

async function togglePresenca(id) {
  const ev = encontros.find(e => e.id === id);
  if (!ev) return;

  // Desabilita o botão durante a requisição
  const btn = document.getElementById(`btn-enc-${id}`);
  if (btn) { btn.disabled = true; btn.textContent = '...'; }

  try {
    const res = await fetch(`${API}/sugestoes/${id}/participar`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId: meuId })
    });
    if (!res.ok) throw new Error();
    const dados = await res.json();
    ev.confirmados = dados.confirmados || [];
  } catch {
    // Fallback local se API falhar
    const idx = ev.confirmados.findIndex(p => String(p._id || p) === String(meuId));
    if (idx >= 0) ev.confirmados.splice(idx, 1);
    else ev.confirmados.push({ _id: meuId, nome: meuNome, fotoPerfil: usuario.fotoPerfil || null });
  }

  renderEncontros();
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
    const total    = post.votos.legal + post.votos.nao;
    const pctLegal = total ? Math.round(post.votos.legal / total * 100) : 50;
    const pctNao   = total ? 100 - pctLegal : 50;
    const dias     = calcularDiasRestantes('instagram', post.criadaEm, null);

    const card = document.createElement('div');
    card.className = 'item-card';
    card.id = `post-${post.id}`;
    card.innerHTML = `
      <div class="item-header-row">
        ${renderCountdown(dias)}
        <span class="item-titulo">${post.titulo}</span>
        <div class="item-tipo-icon">${SVG_INSTAGRAM}</div>
      </div>
      <div class="item-desc">${formatarTexto(post.descricao)}</div>
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
        <button class="btn-voto${post.meuVoto === 'legal' ? ' ativo-legal' : ''}" id="btn-legal-${post.id}">👍 Acho Legal</button>
        <button class="btn-voto${post.meuVoto === 'nao'   ? ' ativo-nao'   : ''}" id="btn-nao-${post.id}">🤷 Não Sei Não</button>
      </div>
      ${ehAdmin ? `<span class="mel-autor">por ${post.autor}</span>` : ''}`;

    card.querySelector(`#btn-legal-${post.id}`).addEventListener('click', () => votar(post.id, 'legal'));
    card.querySelector(`#btn-nao-${post.id}`  ).addEventListener('click', () => votar(post.id, 'nao'));

    if (ehAdmin) adicionarLongPress(card, () => deletarSugestao(post.id));

    el.appendChild(card);
  });
}

async function votar(id, tipo) {
  const post = posts.find(p => p.id === id);
  if (!post || post.meuVoto === tipo) return;

  const anterior = post.meuVoto;

  // Atualização otimista (imediata)
  if (anterior) post.votos[anterior] = Math.max(0, post.votos[anterior] - 1);
  post.votos[tipo]++;
  post.meuVoto = tipo;
  atualizarUIVoto(id, post);

  // Persiste no backend
  try {
    const res = await fetch(`${API}/sugestoes/${id}/votar`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId: meuId, voto: tipo })
    });
    if (res.ok) {
      const dados = await res.json();
      // Sincroniza com valores reais do servidor
      post.votos.legal = dados.legal;
      post.votos.nao   = dados.nao;
      atualizarUIVoto(id, post);
    }
  } catch (err) {
    console.error('Erro ao persistir voto:', err);
  }
}

function atualizarUIVoto(id, post) {
  const total    = post.votos.legal + post.votos.nao;
  const pctLegal = total ? Math.round(post.votos.legal / total * 100) : 50;

  const barraLegal = document.getElementById(`barra-legal-${id}`);
  const barraNao   = document.getElementById(`barra-nao-${id}`);
  const labelLegal = document.getElementById(`label-legal-${id}`);
  const labelNao   = document.getElementById(`label-nao-${id}`);
  const btnLegal   = document.getElementById(`btn-legal-${id}`);
  const btnNao     = document.getElementById(`btn-nao-${id}`);

  if (barraLegal) barraLegal.style.width = pctLegal + '%';
  if (barraNao)   barraNao.style.width   = (100 - pctLegal) + '%';
  if (labelLegal) labelLegal.textContent = `${post.votos.legal} acharam legal`;
  if (labelNao)   labelNao.textContent   = `${post.votos.nao} não sei não`;
  if (btnLegal)   btnLegal.className = `btn-voto${post.meuVoto === 'legal' ? ' ativo-legal' : ''}`;
  if (btnNao)     btnNao.className   = `btn-voto${post.meuVoto === 'nao'   ? ' ativo-nao'   : ''}`;
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
    <div class="item-desc">${formatarTexto(m.descricao || 'Sem descrição.')}</div>
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

  card.querySelector(`#btn-and-${m.id}`).addEventListener('click', () => atualizarMelhoria(m.id, 'em_andamento'));
  card.querySelector(`#btn-fin-${m.id}`).addEventListener('click', () => atualizarMelhoria(m.id, 'finalizado'));
  container.appendChild(card);
}

async function atualizarMelhoria(id, novoStatus) {
  try {
    const res = await fetch(`${API}/sugestoes/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: novoStatus })
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
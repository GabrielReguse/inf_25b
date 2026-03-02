/* dados - em produção viriam do backend
   sugestoes.js publica aqui via sessionStorage['lazer_pendentes']
   ADMs aprovam e movem para os arrays abaixo                        */

// encontros vindos de sugestões aprovadas (tipo: 'encontro')
let encontros = [
    // modelo:
    { id: 1, titulo: 'Jogo de Futsal', descricao: 'Sábado 15h no ginásio', confirmados: ['Ana', 'João'] }
];

// posts vindos de sugestões aprovadas (tipo: 'instagram')
let posts = [
    // modelo:
    { id: 1, titulo: 'Foto da turma', descricao: 'Ideia para post de fim de semestre', link: 'https://...', votos: { legal: 0, nao: 0 } }
];

// carrega sugestões aprovadas do sessionStorage (integração com sugestoes.js)
function carregarSugestoes() {
    try {
        const pendentes = JSON.parse(sessionStorage.getItem('lazer_pendentes') || '[]');
        pendentes.forEach(s => {
            if (s.tipo === 'encontro') {
                encontros.push({ id: 'e' + Date.now(), titulo: s.titulo, descricao: s.descricao, confirmados: [] });
            } else if (s.tipo === 'instagram') {
                posts.push({ id: 'p' + Date.now(), titulo: s.titulo, descricao: s.descricao, link: '', votos: { legal: 0, nao: 0 } });
            }
        });
        // limpa após carregar
        sessionStorage.removeItem('lazer_pendentes');
    } catch (_) { }
}

const usuario = (() => {
  try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); }
  catch { return {}; }
})();
const meuNome = usuario.nome || usuario.email || 'Você';

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

// ENCONTROS
function renderEncontros() {
    const el = elPainelEnc;
    el.innerHTML = '';

    if (!encontros.length) {
        el.innerHTML = '<div class="vazio-msg">Nenhum encontro por enquanto.<br>Use a aba de Sugestões para propor um!</div>';
        renderDots(el, 0, 0);
        return;
    }

    encontros.forEach(ev => {
        const euConfirmei = ev.confirmados.includes(meuNome);
        const ultimos3 = ev.confirmados.slice(-3);

        const card = document.createElement('div');
        card.className = 'item-card';
        card.id = `enc-${ev.id}`;

        card.innerHTML = `
      <span class="item-titulo">${ev.titulo}</span>
      <span class="item-desc">${ev.descricao}</span>
      <div class="presenca-avatares" id="avatares-${ev.id}">
        ${ultimos3.map(nome => avatarMini(nome)).join('')}
        ${ev.confirmados.length > 0
                ? `<span class="presenca-count">${ev.confirmados.length} confirmado${ev.confirmados.length > 1 ? 's' : ''}</span>`
                : ''}
      </div>
      <button class="btn-participar${euConfirmei ? ' saindo' : ''}" id="btn-enc-${ev.id}">
        ${euConfirmei ? 'Quero Sair' : 'Irei Participar'}
      </button>
    `;

        card.querySelector(`#btn-enc-${ev.id}`).addEventListener('click', () => {
            togglePresenca(ev.id);
        });

        el.appendChild(card);
    });

    renderDots(el, encontros.length, 0);
}

function togglePresenca(id) {
    const ev = encontros.find(e => e.id === id);
    if (!ev) return;

    const idx = ev.confirmados.indexOf(meuNome);
    if (idx >= 0) {
        ev.confirmados.splice(idx, 1);
    } else {
        ev.confirmados.push(meuNome);
    }
    renderEncontros();
}

function avatarMini(nome) {
    const iniciais = nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    return `
    <div class="avatar-mini" title="${nome}">
      <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </div>
  `;
}

// INSTAGRAM
function renderInstagram() {
    const el = elPainelInst;
    el.innerHTML = '';

    if (!posts.length) {
        el.innerHTML = '<div class="vazio-msg">Nenhuma ideia de post ainda.<br>Sugira uma na aba de Sugestões!</div>';
        renderDots(el, 0, 0);
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
      ${post.link ? `
        <a class="item-link" href="${post.link}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Ver publicação
        </a>` : ''}
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
      </div>
    `;

        card.querySelector(`#btn-legal-${post.id}`).addEventListener('click', () => votar(post.id, 'legal'));
        card.querySelector(`#btn-nao-${post.id}`).addEventListener('click', () => votar(post.id, 'nao'));

        el.appendChild(card);
    });

    renderDots(el, posts.length, 0);
}

function votar(id, tipo) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    const anterior = meusVotos[id];
    if (anterior === tipo) return; // já votou igual, ignora

    if (anterior) post.votos[anterior]--;
    post.votos[tipo]++;
    meusVotos[id] = tipo;
    salvarVotos();

    const total = post.votos.legal + post.votos.nao;
    const pctLegal = total ? Math.round(post.votos.legal / total * 100) : 50;
    const pctNao = 100 - pctLegal;

    document.getElementById(`barra-legal-${id}`).style.width = pctLegal + '%';
    document.getElementById(`barra-nao-${id}`).style.width = pctNao + '%';
    document.getElementById(`label-legal-${id}`).textContent = `${post.votos.legal} acharam legal`;
    document.getElementById(`label-nao-${id}`).textContent = `${post.votos.nao} não sei não`;

    document.getElementById(`btn-legal-${id}`).className = 'btn-voto' + (tipo === 'legal' ? ' ativo-legal' : '');
    document.getElementById(`btn-nao-${id}`).className = 'btn-voto' + (tipo === 'nao' ? ' ativo-nao' : '');
}

// dots decorativos
function renderDots(container, total, ativo) {
    if (total <= 1) return;
    const wrap = document.createElement('div');
    wrap.className = 'dots-wrap';
    for (let i = 0; i < total; i++) {
        const d = document.createElement('div');
        d.className = 'dot' + (i === ativo ? ' ativo' : '');
        wrap.appendChild(d);
    }
    container.appendChild(wrap);
}

// init
carregarSugestoes();
trocarAba('encontros');
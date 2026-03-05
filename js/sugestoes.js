const API = "https://inf-25b-backend.onrender.com";

const TIPOS = [
  {
    id: 'encontro',
    label: 'Encontro',
    destino: 'lazer',
    icone: `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    destino: 'lazer',
    icone: `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>`,
  },
  {
    id: 'melhoria',
    label: 'Melhoria',
    destino: 'adm',
    icone: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  },
  {
    id: 'outro',
    label: 'Outro',
    destino: 'adm',
    icone: `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  },
];

let tipoSelecionado = null;
let etapa = 1;

const elBarra = document.getElementById('etapaBarraFill');
const elCorpo = document.getElementById('cardCorpo');
const elContador = document.getElementById('etapaContador');

function atualizarBarra() {
  if (elBarra) elBarra.style.width = etapa === 1 ? '50%' : '100%';
  if (elContador) elContador.textContent = `Etapa ${etapa}/2`;
}

function renderEtapa1() {
  elCorpo.innerHTML = `
    <span class="card-subtitulo">Escolha o tipo de Sugestão</span>
    <div class="tipos-grid">
      ${TIPOS.map(t => `
        <button class="tipo-btn${tipoSelecionado === t.id ? ' selecionado' : ''}" data-id="${t.id}" type="button">
          <div class="tipo-icone">${t.icone}</div>
          <span class="tipo-label">${t.label}</span>
        </button>
      `).join('')}
    </div>
    <button class="btn-avancar" id="btnAvancar" ${!tipoSelecionado ? 'disabled' : ''} type="button">
      Continuar
      <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  `;

  elCorpo.querySelectorAll('.tipo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tipoSelecionado = btn.dataset.id;
      elCorpo.querySelectorAll('.tipo-btn').forEach(b =>
        b.classList.toggle('selecionado', b.dataset.id === tipoSelecionado)
      );
      document.getElementById('btnAvancar').disabled = false;
    });
  });

  document.getElementById('btnAvancar').addEventListener('click', () => {
    if (tipoSelecionado) trocarEtapa(2);
  });
}

function renderEtapa2() {
  const tipo = TIPOS.find(t => t.id === tipoSelecionado);
  elCorpo.innerHTML = `
    <button class="btn-voltar" id="btnVoltar" type="button">
      <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
      Voltar
    </button>
    <span class="card-subtitulo">Título e Descreva a Sugestão</span>
    <div class="destino-badge">
      <svg viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
      Detalhe sua sugestão de ${tipo?.label}
    </div>
    <div class="campo-grupo">
      <label class="campo-label" for="inputTitulo">Título</label>
      <input class="campo-input" type="text" id="inputTitulo" placeholder="Título da sugestão"/>
      <span class="campo-erro" id="erroTitulo"></span>
    </div>
    <div class="campo-grupo">
      <label class="campo-label" for="inputDesc">Descrição</label>
      <textarea class="campo-textarea" id="inputDesc" placeholder="Descreva sua sugestão..."></textarea>
      <span class="campo-erro" id="erroDesc"></span>
    </div>
    <div class="alerta" id="alerta"></div>
    <button class="btn-avancar" id="btnPublicar" type="button">Publicar</button>
  `;

  document.getElementById('btnVoltar').addEventListener('click', () => trocarEtapa(1));
  document.getElementById('btnPublicar').addEventListener('click', publicar);
}

function trocarEtapa(nova) {
  elCorpo.classList.add('saindo');
  setTimeout(() => {
    etapa = nova;
    atualizarBarra();
    elCorpo.classList.remove('saindo');
    elCorpo.classList.add('entrando');
    nova === 1 ? renderEtapa1() : renderEtapa2();
    setTimeout(() => elCorpo.classList.remove('entrando'), 260);
  }, 200);
}

async function publicar() {
  const titulo = document.getElementById('inputTitulo').value.trim();
  const desc = document.getElementById('inputDesc').value.trim();
  const elAlerta = document.getElementById('alerta');
  const btnPublicar = document.getElementById('btnPublicar');

  document.getElementById('erroTitulo').textContent = '';
  document.getElementById('erroDesc').textContent = '';
  elAlerta.className = 'alerta';

  let valido = true;
  if (!titulo) { document.getElementById('erroTitulo').textContent = 'Informe um título.'; valido = false; }
  if (!desc) { document.getElementById('erroDesc').textContent = 'Escreva uma descrição.'; valido = false; }
  if (!valido) return;

  const usuario = (() => {
    try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); } catch { return {}; }
  })();

  if (!usuario.id) {
    elAlerta.textContent = 'Você precisa estar logado para enviar sugestões.';
    elAlerta.className = 'alerta erro';
    return;
  }

  btnPublicar.disabled = true;
  btnPublicar.textContent = 'Enviando...';

  try {
    const resposta = await fetch(`${API}/sugestoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        autor: usuario.id,
        texto: `[${tipoSelecionado}] ${titulo} — ${desc}`
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      elAlerta.textContent = dados.erro || 'Erro ao enviar sugestão.';
      elAlerta.className = 'alerta erro';
      btnPublicar.disabled = false;
      btnPublicar.textContent = 'Publicar';
      return;
    }

    elAlerta.textContent = 'Sugestão enviada com sucesso!';
    elAlerta.className = 'alerta sucesso';
    setTimeout(() => { window.location.href = 'telaInicial.html'; }, 1400);

  } catch (err) {
    console.error(err);
    elAlerta.textContent = 'Erro de conexão. Tente novamente.';
    elAlerta.className = 'alerta erro';
    btnPublicar.disabled = false;
    btnPublicar.textContent = 'Publicar';
  }
}

// init
atualizarBarra();
renderEtapa1();
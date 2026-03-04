const API = "https://inf-25b-backend.onrender.com";

let anoAtual = new Date().getFullYear();
let mesAtual = new Date().getMonth();
let diaSelecionado = null;
let eventos = {};   // tarefas/provas por data
let feriados = {};  // feriados por data

const elMesTitulo = document.getElementById('calMesTitulo');
const elGrade     = document.getElementById('calGrade');
const elPainelDia = document.getElementById('painelDia');
const elPainelTit = document.getElementById('painelDiaTitulo');
const elEventos   = document.getElementById('eventosList');

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ─── CARREGA DADOS DO BACKEND ─────────────────────────────────
async function carregarTudo() {
  await Promise.all([carregarTarefas(), carregarFeriados()]);
  renderCalendario();
}

async function carregarTarefas() {
  try {
    const tarefas = await (await fetch(`${API}/tarefas`)).json();
    eventos = {};
    tarefas.forEach(t => {
      const chave = new Date(t.dataEntrega).toISOString().slice(0, 10);
      if (!eventos[chave]) eventos[chave] = [];
      eventos[chave].push({
        tipo:       t.tipo     || 'tarefa',
        materia:    t.materia  || t.titulo   || 'Tarefa',
        conteudo:   t.conteudo || t.descricao || '',
        entrega:    t.tipoEntrega || 'digital',
        grupo:      t.grupo    || false,
        numMembros: t.numMembros || 0,
        consulta:   t.consulta || false,
        resumo:     t.descricao || '',
        _id:        t._id
      });
    });
  } catch (err) { console.error("Erro ao carregar tarefas:", err); }
}

async function carregarFeriados() {
  try {
    const lista = await (await fetch(`${API}/feriados`)).json();
    feriados = {};
    lista.forEach(f => {
      const chave = new Date(f.data).toISOString().slice(0, 10);
      feriados[chave] = { titulo: f.titulo, descricao: f.descricao || '' };
    });
  } catch (err) { console.error("Erro ao carregar feriados:", err); }
}

// ─── CALENDÁRIO ───────────────────────────────────────────────
function renderCalendario() {
  elMesTitulo.textContent = `${MESES[mesAtual]} ${anoAtual}`;
  elGrade.innerHTML = '';

  const hoje       = new Date();
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const totalDias   = new Date(anoAtual, mesAtual + 1, 0).getDate();

  for (let i = 0; i < primeiroDia; i++) {
    const vazio = document.createElement('div');
    vazio.className = 'cal-dia vazio';
    elGrade.appendChild(vazio);
  }

  for (let d = 1; d <= totalDias; d++) {
    const chave    = chaveData(anoAtual, mesAtual, d);
    const evsDia   = eventos[chave]  || [];
    const feriado  = feriados[chave] || null;
    const eHoje    = d === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
    const eSel     = diaSelecionado === chave;

    const cel = document.createElement('div');
    let classes = 'cal-dia';
    if (eHoje)   classes += ' hoje';
    if (eSel)    classes += ' selecionado';
    if (feriado) classes += ' feriado';
    cel.className = classes;
    cel.dataset.chave = chave;

    const num = document.createElement('span');
    num.className = 'cal-dia-num';
    num.textContent = d;
    cel.appendChild(num);

    // título do feriado (completo, não sigla)
    if (feriado) {
      const ft = document.createElement('div');
      ft.className = 'cal-feriado-titulo';
      ft.textContent = feriado.titulo;
      cel.appendChild(ft);
    }

    // marcadores de tarefas/provas
    if (evsDia.length) {
      const wrap = document.createElement('div');
      wrap.className = 'cal-marcadores';
      evsDia.slice(0, feriado ? 1 : 2).forEach(ev => {
        const m = document.createElement('div');
        m.className = 'cal-marca';
        // exibe matéria completa (truncada por CSS)
        m.innerHTML = `
          <div class="cal-marca-dot ${ev.tipo === 'prova' ? 'dot-prova' : 'dot-tarefa'}"></div>
          <span class="cal-marca-sigla">${ev.materia}</span>`;
        wrap.appendChild(m);
      });
      const restantes = evsDia.length - (feriado ? 1 : 2);
      if (restantes > 0) {
        const mais = document.createElement('div');
        mais.className = 'cal-marca';
        mais.innerHTML = `<span class="cal-marca-sigla" style="color:var(--text-secondary)">+${restantes}</span>`;
        wrap.appendChild(mais);
      }
      cel.appendChild(wrap);
    }

    cel.addEventListener('click', () => selecionarDia(chave, d));
    elGrade.appendChild(cel);
  }
}

function selecionarDia(chave, dia) {
  if (diaSelecionado === chave) {
    diaSelecionado = null;
    elPainelDia.hidden = true;
    renderCalendario();
    return;
  }
  diaSelecionado = chave;
  renderCalendario();
  renderPainelDia(chave, dia);
  elPainelDia.hidden = false;
  setTimeout(() => elPainelDia.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

function renderPainelDia(chave, dia) {
  const evsDia  = eventos[chave]  || [];
  const feriado = feriados[chave] || null;
  const [ano, mes] = chave.split('-').map(Number);

  elPainelTit.textContent = `${dia} de ${MESES[mes - 1]} de ${ano}`;
  elEventos.innerHTML = '';

  const temConteudo = evsDia.length || feriado;
  if (!temConteudo) {
    elEventos.innerHTML = '<div class="sem-eventos">Nenhum evento neste dia.</div>';
    return;
  }

  // card de feriado
  if (feriado) {
    const card = document.createElement('div');
    card.className = 'evento-card feriado-card';
    card.innerHTML = `
      <div class="evento-header">
        <div class="evento-header-esq">
          <div class="evento-tipo-dot dot-feriado"></div>
          <span class="evento-nome">${feriado.titulo}</span>
          <span class="evento-tipo-tag tag-feriado">Feriado</span>
        </div>
        <div class="evento-seta">
          <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div class="evento-corpo">
        <div class="evento-corpo-inner">
          ${feriado.descricao
            ? `<div class="evento-resumo">${feriado.descricao}</div>`
            : `<div class="evento-resumo" style="color:var(--text-secondary);font-style:italic">Sem descrição adicional.</div>`
          }
        </div>
      </div>`;
    card.querySelector('.evento-header').addEventListener('click', () => card.classList.toggle('aberto'));
    elEventos.appendChild(card);
  }

  // cards de tarefas/provas
  evsDia.forEach(ev => {
    const card = document.createElement('div');
    card.className = 'evento-card';
    card.innerHTML = buildEventoHTML(ev);
    card.querySelector('.evento-header').addEventListener('click', () => card.classList.toggle('aberto'));
    elEventos.appendChild(card);
  });
}

function buildEventoHTML(ev) {
  const dotClass = ev.tipo === 'prova' ? 'dot-prova' : 'dot-tarefa';
  const tagClass = ev.tipo === 'prova' ? 'tag-prova' : 'tag-tarefa';
  const tagLabel = ev.tipo === 'prova' ? 'Prova' : 'Tarefa';

  let corpoHTML = '';

  if (ev.tipo === 'prova') {
    const consulta = ev.consulta
      ? '<span class="badge-inline badge-com-consulta">Com consulta</span>'
      : '<span class="badge-inline badge-sem-consulta">Sem consulta</span>';
    const modalidade = ev.grupo
      ? `<span class="badge-inline badge-grupo">Grupo · ${ev.numMembros} pessoas</span>`
      : '<span class="badge-inline badge-individual">Individual</span>';
    corpoHTML = `
      <div class="evento-info-linha">
        <span class="evento-info-label">Conteúdo</span>
        <span class="evento-info-valor">${ev.conteudo}</span>
      </div>
      <div class="evento-info-linha">
        <span class="evento-info-label">Consulta</span>
        <span class="evento-info-valor">${consulta}</span>
      </div>
      <div class="evento-info-linha">
        <span class="evento-info-label">Modalidade</span>
        <span class="evento-info-valor">${modalidade}</span>
      </div>`;
  } else {
    corpoHTML = `
      <div class="evento-info-linha">
        <span class="evento-info-label">Conteúdo</span>
        <span class="evento-info-valor">${ev.conteudo}</span>
      </div>
      <div class="evento-info-linha">
        <span class="evento-info-label">Entrega</span>
        <span class="evento-info-valor">${capitalizar(ev.entrega)}</span>
      </div>`;
  }

  if (ev.resumo && ev.resumo !== ev.conteudo) {
    corpoHTML += `<div class="evento-resumo">${ev.resumo}</div>`;
  }

  return `
    <div class="evento-header">
      <div class="evento-header-esq">
        <div class="evento-tipo-dot ${dotClass}"></div>
        <span class="evento-nome">${ev.materia}</span>
        <span class="evento-tipo-tag ${tagClass}">${tagLabel}</span>
      </div>
      <div class="evento-seta">
        <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>
    <div class="evento-corpo">
      <div class="evento-corpo-inner">${corpoHTML}</div>
    </div>`;
}

// ─── NAVEGAÇÃO MÊS ────────────────────────────────────────────
document.getElementById('btnMesAnterior').addEventListener('click', () => {
  mesAtual--;
  if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
  diaSelecionado = null;
  elPainelDia.hidden = true;
  renderCalendario();
});

document.getElementById('btnMesProximo').addEventListener('click', () => {
  mesAtual++;
  if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
  diaSelecionado = null;
  elPainelDia.hidden = true;
  renderCalendario();
});

document.getElementById('btnFecharPainel').addEventListener('click', () => {
  diaSelecionado = null;
  elPainelDia.hidden = true;
  renderCalendario();
});

function chaveData(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function capitalizar(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

carregarTudo();
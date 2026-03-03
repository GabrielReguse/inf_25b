const API = "https://inf-25b-backend.onrender.com";
const u = 2;
// estado
let anoAtual = new Date().getFullYear();
let mesAtual = new Date().getMonth();
let diaSelecionado = null;
let eventos = {}; // preenchido pelo fetch

// referências DOM
const elMesTitulo = document.getElementById('calMesTitulo');
const elGrade = document.getElementById('calGrade');
const elPainelDia = document.getElementById('painelDia');
const elPainelTit = document.getElementById('painelDiaTitulo');
const elEventos = document.getElementById('eventosList');

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// ─── CARREGA TAREFAS DO BACKEND ──────────────────────────────
async function carregarTarefas() {
  try {
    const resposta = await fetch(`${API}/tarefas`);
    const tarefas = await resposta.json();

    eventos = {}; // limpa antes de preencher

    tarefas.forEach(t => {
      const chave = new Date(t.dataEntrega).toISOString().slice(0, 10);
      if (!eventos[chave]) eventos[chave] = [];

      // suporte a modelo antigo (titulo) e novo (materia+conteudo)
      const materia  = t.materia  || t.titulo   || 'Tarefa';
      const conteudo = t.conteudo || t.descricao || '';
      const tipo     = t.tipo     || 'tarefa';

      eventos[chave].push({
        tipo,
        materia,
        sigla: materia.slice(0, 3).toUpperCase(),
        conteudo,
        entrega: t.tipoEntrega || 'digital',
        grupo: t.grupo || false,
        numMembros: t.numMembros || 0,
        consulta: t.consulta || false,
        resumo: t.descricao || '',
        links: [],
        _id: t._id
      });
    });

  } catch (err) {
    console.error("Erro ao carregar tarefas:", err);
  }

  renderCalendario();
}

// ─── CALENDÁRIO ───────────────────────────────────────────────
function renderCalendario() {
  elMesTitulo.textContent = `${MESES[mesAtual]} ${anoAtual}`;
  elGrade.innerHTML = '';

  const hoje = new Date();
  const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
  const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate();

  for (let i = 0; i < primeiroDia; i++) {
    const vazio = document.createElement('div');
    vazio.className = 'cal-dia vazio';
    elGrade.appendChild(vazio);
  }

  for (let d = 1; d <= totalDias; d++) {
    const chave = chaveData(anoAtual, mesAtual, d);
    const evsDia = eventos[chave] || [];
    const eHoje = d === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
    const eSel = diaSelecionado === chave;

    const cel = document.createElement('div');
    cel.className = 'cal-dia' + (eHoje ? ' hoje' : '') + (eSel ? ' selecionado' : '');
    cel.dataset.chave = chave;
    cel.dataset.dia = d;

    const num = document.createElement('span');
    num.className = 'cal-dia-num';
    num.textContent = d;
    cel.appendChild(num);

    if (evsDia.length) {
      const wrap = document.createElement('div');
      wrap.className = 'cal-marcadores';
      evsDia.slice(0, 2).forEach(ev => {
        const m = document.createElement('div');
        m.className = 'cal-marca';
        m.innerHTML = `
          <div class="cal-marca-dot ${ev.tipo === 'prova' ? 'dot-prova' : 'dot-tarefa'}"></div>
          <span class="cal-marca-sigla">${ev.sigla}</span>
        `;
        wrap.appendChild(m);
      });
      if (evsDia.length > 2) {
        const mais = document.createElement('div');
        mais.className = 'cal-marca';
        mais.innerHTML = `<span class="cal-marca-sigla" style="color:var(--text-secondary)">+${evsDia.length - 2}</span>`;
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

  setTimeout(() => {
    elPainelDia.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 50);
}

function renderPainelDia(chave, dia) {
  const evsDia = eventos[chave] || [];
  const [ano, mes] = chave.split('-').map(Number);

  elPainelTit.textContent = `${dia} de ${MESES[mes - 1]} de ${ano}`;
  elEventos.innerHTML = '';

  if (!evsDia.length) {
    elEventos.innerHTML = '<div class="sem-eventos">Nenhum evento neste dia.</div>';
    return;
  }

  evsDia.forEach((ev, idx) => {
    const card = document.createElement('div');
    card.className = 'evento-card';
    card.innerHTML = buildEventoHTML(ev, idx);
    card.querySelector('.evento-header').addEventListener('click', () => {
      card.classList.toggle('aberto');
    });
    elEventos.appendChild(card);
  });
}

function buildEventoHTML(ev, idx) {
  const dotClass = ev.tipo === 'prova' ? 'dot-prova' : 'dot-tarefa';
  const tagClass = ev.tipo === 'prova' ? 'tag-prova' : 'tag-tarefa';
  const tagLabel = ev.tipo === 'prova' ? 'Prova' : 'Tarefa';

  let corpoHTML = '';

  if (ev.tipo === 'prova') {
    const consulta = ev.consulta
      ? '<span class="badge-inline badge-com-consulta">Com consulta</span>'
      : '<span class="badge-inline badge-sem-consulta">Sem consulta</span>';

    const modalidade = ev.grupo
      ? `<span class="badge-inline badge-grupo">Grupo · ${ev.grupo.pessoas} pessoas</span>`
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
      </div>
    `;
  } else {
    corpoHTML = `
      <div class="evento-info-linha">
        <span class="evento-info-label">Conteúdo</span>
        <span class="evento-info-valor">${ev.conteudo}</span>
      </div>
      <div class="evento-info-linha">
        <span class="evento-info-label">Entrega</span>
        <span class="evento-info-valor">${capitalizar(ev.entrega)}</span>
      </div>
    `;
  }

  if (ev.resumo && ev.resumo !== ev.conteudo) {
    corpoHTML += `<div class="evento-resumo">${ev.resumo}</div>`;
  }

  if (ev.links && ev.links.length) {
    const linksHTML = ev.links.map(l => `
      <a class="evento-link" href="${l.url}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        ${l.label}
      </a>
    `).join('');
    corpoHTML += `<div class="evento-links">${linksHTML}</div>`;
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
      <div class="evento-corpo-inner">
        ${corpoHTML}
      </div>
    </div>
  `;
}

// navegação de mês
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

// init — carrega do backend ao abrir
carregarTarefas();
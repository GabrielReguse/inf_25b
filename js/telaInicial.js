const API = "https://inf-25b-backend.onrender.com";

const usuario = (() => {
  try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); } catch { return {}; }
})();

const MATERIAS = ['Matemática', 'Português', 'História', 'Geografia', 'Ciências', 'Física', 'Química', 'Biologia', 'Inglês', 'Educação Física', 'Artes', 'Filosofia', 'Sociologia'];

// ─── AVISOS (sem bolinha) ─────────────────────────────────────
async function carregarAvisos() {
  const container = document.getElementById('itensAvisos');
  if (!container) return;
  try {
    const res = await fetch(`${API}/avisos`);
    const avisos = await res.json();
    if (!avisos.length) return;
    container.innerHTML = '';
    avisos.slice(0, 2).forEach(a => container.appendChild(criarItemAviso(a)));
    if (avisos.length > 2) {
      const extrasInner = document.querySelector('#extrasAvisos .bloco-extras-inner');
      if (extrasInner) avisos.slice(2).forEach(a => extrasInner.appendChild(criarItemAviso(a)));
    }
  } catch (err) { console.error('Erro avisos:', err); }
}

function criarItemAviso(a) {
  const data = new Date(a.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const div = document.createElement('div');
  div.className = 'bloco-item';
  // sem bolinha colorida — apenas texto e data
  div.innerHTML = `
    <div class="item-texto">
      <div class="item-titulo">${a.titulo}</div>
      <div class="item-detalhe">${a.descricao}</div>
    </div>
    <span class="item-badge">${data}</span>
  `;
  return div;
}

// ─── DESTAQUES (tarefas/provas mais próximas) ─────────────────
async function carregarDestaques() {
  const container = document.getElementById('itensDestaques');
  if (!container) return;
  try {
    const res = await fetch(`${API}/tarefas`);
    const tarefas = await res.json();
    if (!tarefas.length) return;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // filtra só futuras, ordena por data
    const futuras = tarefas
      .filter(t => new Date(t.dataEntrega) >= hoje)
      .sort((a, b) => new Date(a.dataEntrega) - new Date(b.dataEntrega));

    if (!futuras.length) return;

    container.innerHTML = '';

    const visiveis = futuras.slice(0, 2);
    const escondidos = futuras.slice(2);

    visiveis.forEach(t => container.appendChild(criarItemDestaque(t)));

    if (escondidos.length) {
      const extrasInner = document.querySelector('#extrasDestaques .bloco-extras-inner');
      if (extrasInner) escondidos.forEach(t => extrasInner.appendChild(criarItemDestaque(t)));
    }

  } catch (err) { console.error('Erro destaques:', err); }
}

function criarItemDestaque(t) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const entrega = new Date(t.dataEntrega);
  entrega.setHours(0, 0, 0, 0);
  const diasRestantes = Math.round((entrega - hoje) / (1000 * 60 * 60 * 24));

  const data = entrega.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const isProva = t.tipo === 'prova';
  const indClass = isProva ? 'ind-red' : 'ind-blue';
  const tipoLabel = isProva ? 'Prova' : 'Tarefa';
  const materia = t.materia || t.titulo || '';
  const conteudo = t.conteudo || t.descricao || '';

  let aviso = '';
  if ([1, 3, 5, 7].includes(diasRestantes)) {
    const corAviso = isProva ? '#EF4444' : '#7C3AED';
    aviso = `<span style="color:${corAviso};font-size:.7rem;font-weight:600">${diasRestantes} dia${diasRestantes > 1 ? 's' : ''} restante${diasRestantes > 1 ? 's' : ''}!</span>`;
  }

  const div = document.createElement('div');
  div.className = 'bloco-item';
  div.style.cursor = 'pointer';
  div.onclick = () => window.location.href = 'tarefasProvas.html';
  div.innerHTML = `
    <span class="ind ${indClass}"></span>
    <div class="item-texto">
      <div class="item-titulo" style="font-weight:700">${tipoLabel}: ${materia}${conteudo ? ` - ${conteudo}` : ''} <span style="font-weight:400;color:#94a3b8">(${diasRestantes} dia${diasRestantes !== 1 ? 's' : ''})</span></div>
      <div class="item-detalhe" style="font-size:.72rem">Acesse a aba de tarefas / provas para mais informações! ${aviso}</div>
    </div>
    <span class="item-badge">${data}</span>
  `;
  return div;
}

// ─── BOTÃO ADM ────────────────────────────────────────────────
function mostrarBotaoAdm() {
  if (usuario.role !== 'admin') return;
  const btn = document.createElement('a');
  btn.href = 'adm.html';
  btn.title = 'Painel ADM';
  btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:22px;height:22px;stroke:#fff;stroke-width:2;fill:none"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`;
  Object.assign(btn.style, {
    position: 'fixed', bottom: '1.5rem', right: '1.5rem',
    width: '48px', height: '48px', borderRadius: '50%',
    background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(139,92,246,.5)',
    zIndex: '999', textDecoration: 'none', transition: 'opacity .2s'
  });
  btn.addEventListener('mouseenter', () => btn.style.opacity = '.8');
  btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
  document.body.appendChild(btn);
}

// ─── FOTO NO HEADER ──────────────────────────────────────────
function carregarFotoHeader() {
  const foto = usuario.fotoPerfil;
  if (!foto) return;
  const img = document.getElementById('headerAvatarImg');
  const svg = document.getElementById('headerAvatarSvg');
  if (!img || !svg) return;
  img.src = foto;
  img.style.display = 'block';
  svg.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  carregarAvisos();
  carregarDestaques();
  mostrarBotaoAdm();
  carregarFotoHeader();
});
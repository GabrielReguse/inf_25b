const API = "https://inf-25b-backend.onrender.com";
const correcao = 1;

const usuario = JSON.parse(sessionStorage.getItem('usuario') || '{}');
const el = document.getElementById('conteudoPrincipal');

const MATERIAS = ['Artes','Banco de Dados','Biologia','Educação Física','Engenharia de Software','Filosofia','Física','Geografia','História','Língua Inglesa','Língua Portuguesa','Matemática','Programação 1','Projeto Integrador 2','Química','Redação','Redes','Sociologia'];
const ENTREGAS = ['Apresentação','Digital','Folha','Caderno'];

const ABAS = [
  { id: 'Avisos', label: 'Avisos', icone: `<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>` },
  { id: 'Tarefas', label: 'Tarefas', icone: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>` },
  { id: 'Destaques', label: 'Destaques', icone: `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` },
  { id: 'Sugestoes', label: 'Sugestões', icone: `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` },
];

let abaAtiva = 0;

if (!usuario.id || usuario.role !== 'admin') {
  el.innerHTML = `
    <div class="acesso-negado">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <h2>Acesso restrito</h2>
      <p>Você precisa estar logado como ADM.</p>
      <a class="btn-voltar-home" href="telaInicial.html">Voltar ao início</a>
    </div>`;
} else {
  renderPainel();
  iniciarHeartbeat();
}

// ─── HEARTBEAT: avisa o servidor que o admin está online ──────
function iniciarHeartbeat() {
  const enviar = () => fetch(`${API}/admin/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: usuario.email, nome: usuario.nome })
  }).catch(() => {});
  enviar();
  setInterval(enviar, 60 * 1000); // a cada 1 minuto
}

// ─── STATS ────────────────────────────────────────────────────
async function carregarStats() {
  try {
    const dados = await (await fetch(`${API}/admin/stats`)).json();
    const el = document.getElementById('statsBar');
    if (!el) return;
    el.innerHTML = `
      <div class="stat-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span><strong>${dados.totalUsuarios}</strong> usuários</span>
      </div>
      <div class="stat-item">
        <span class="dot-online"></span>
        <span><strong>${dados.online}</strong> online agora</span>
      </div>`;
  } catch {}
}

function renderPainel() {
  el.innerHTML = `
    <main class="main">
      <div class="stats-bar" id="statsBar">
        <span style="opacity:.5;font-size:.8rem">Carregando...</span>
      </div>
      <div class="seletores">
        ${ABAS.map((a, i) => `
          <button class="seletor-btn${i === 0 ? ' ativo' : ''}" data-idx="${i}" type="button">
            <div class="seletor-icone">${a.icone}</div>
            <span class="seletor-label">${a.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="seta-wrap">
        <div class="seta-flutuante" id="setaFlutuante">
          <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div class="conteudo">
        ${ABAS.map((a, i) => `<div class="painel${i === 0 ? ' ativo' : ''}" id="painel${a.id}"></div>`).join('')}
      </div>
    </main>`;

  document.querySelectorAll('.seletor-btn').forEach(btn => {
    btn.addEventListener('click', () => trocarAba(parseInt(btn.dataset.idx)));
  });

  posicionarSeta(0);
  carregarStats();
  setInterval(carregarStats, 30 * 1000); // atualiza a cada 30s
  renderAvisos();
  renderTarefas();
  renderDestaques();
  renderSugestoes();
}

function trocarAba(idx) {
  abaAtiva = idx;
  document.querySelectorAll('.seletor-btn').forEach((b, i) => b.classList.toggle('ativo', i === idx));
  document.querySelectorAll('.painel').forEach((p, i) => p.classList.toggle('ativo', i === idx));
  posicionarSeta(idx);
}

function posicionarSeta(idx) {
  const seta = document.getElementById('setaFlutuante');
  if (!seta) return;
  const btns = document.querySelectorAll('.seletor-btn');
  if (!btns[idx]) return;
  const gradeRect = btns[0].closest('.seletores').getBoundingClientRect();
  const btnRect = btns[idx].getBoundingClientRect();
  seta.style.left = (btnRect.left - gradeRect.left + btnRect.width / 2 - seta.offsetWidth / 2) + 'px';
}

window.addEventListener('resize', () => posicionarSeta(abaAtiva));

// ─── AVISOS ───────────────────────────────────────────────────
async function renderAvisos() {
  const painel = document.getElementById('painelAvisos');
  painel.innerHTML = `
    <p class="form-titulo">Criar novo aviso</p>
    <div id="alertaAviso" class="alerta"></div>
    <div class="campo-grupo">
      <label class="campo-label">Título</label>
      <input class="campo-input" id="avisoTitulo" placeholder="Ex: Reunião de pais amanhã"/>
    </div>
    <div class="campo-grupo">
      <label class="campo-label">Descrição</label>
      <textarea class="campo-textarea" id="avisoDesc" placeholder="Descreva o aviso com detalhes..."></textarea>
    </div>
    <button class="btn-publicar" id="btnCriarAviso">Publicar aviso</button>
    <div class="secao-lista">
      <div class="secao-lista-titulo">Avisos publicados</div>
      <div id="listaAvisos"><p class="lista-vazia">Carregando...</p></div>
    </div>`;
  document.getElementById('btnCriarAviso').addEventListener('click', criarAviso);
  carregarAvisos();
}

async function criarAviso() {
  const titulo = document.getElementById('avisoTitulo').value.trim();
  const descricao = document.getElementById('avisoDesc').value.trim();
  const alerta = document.getElementById('alertaAviso');
  const btn = document.getElementById('btnCriarAviso');
  alerta.className = 'alerta';
  if (!titulo || !descricao) { alerta.textContent = 'Preencha todos os campos.'; alerta.className = 'alerta erro'; return; }
  btn.disabled = true; btn.textContent = 'Publicando...';
  try {
    const res = await fetch(`${API}/avisos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo, descricao, criadoPor: usuario.id }) });
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || 'Erro ao publicar.');
    alerta.textContent = 'Aviso publicado!'; alerta.className = 'alerta sucesso';
    document.getElementById('avisoTitulo').value = '';
    document.getElementById('avisoDesc').value = '';
    carregarAvisos();
  } catch (err) { alerta.textContent = err.message; alerta.className = 'alerta erro'; }
  finally { btn.disabled = false; btn.textContent = 'Publicar aviso'; }
}

async function carregarAvisos() {
  const lista = document.getElementById('listaAvisos');
  if (!lista) return;
  try {
    const avisos = await (await fetch(`${API}/avisos`)).json();
    if (!avisos.length) { lista.innerHTML = '<p class="lista-vazia">Nenhum aviso publicado ainda.</p>'; return; }
    lista.innerHTML = avisos.map(a => `
      <div class="item-card">
        <div class="item-info">
          <span class="item-titulo">${a.titulo}</span>
          <span class="item-desc">${a.descricao}</span>
          <span class="item-meta">${new Date(a.criadoEm).toLocaleDateString('pt-BR')}</span>
        </div>
        <button class="btn-deletar" onclick="deletarAviso('${a._id}')">Remover</button>
      </div>`).join('');
  } catch { lista.innerHTML = '<p class="lista-vazia" style="color:#f87171">Erro ao carregar.</p>'; }
}

async function deletarAviso(id) {
  if (!confirm('Remover este aviso?')) return;
  await fetch(`${API}/avisos/${id}`, { method: 'DELETE' });
  carregarAvisos();
}

// ─── TAREFAS ─────────────────────────────────────────────────
async function renderTarefas() {
  const painel = document.getElementById('painelTarefas');
  painel.innerHTML = `
    <p class="form-titulo">Adicionar tarefa ou prova</p>
    <div id="alertaTarefa" class="alerta"></div>
    <div class="campo-grupo">
      <label class="campo-label">Matéria</label>
      <select class="campo-input" id="tarefaMateria">
        <option value="">Selecione a matéria...</option>
        ${MATERIAS.map(m => `<option value="${m}">${m}</option>`).join('')}
      </select>
    </div>
    <div class="campo-grupo">
      <label class="campo-label">Tipo</label>
      <select class="campo-input" id="tarefaTipo">
        <option value="">Selecione o tipo...</option>
        <option value="prova">Prova</option>
        <option value="tarefa">Tarefa</option>
      </select>
    </div>
    <div class="campo-grupo">
      <label class="campo-label">Conteúdo</label>
      <input class="campo-input" id="tarefaConteudo" placeholder="Ex: Trigonometria, Revolução Francesa..."/>
    </div>
    <div class="campo-grupo">
      <label class="campo-label">Descrição / Resumo</label>
      <textarea class="campo-textarea" id="tarefaDesc" placeholder="Detalhes extras..."></textarea>
    </div>
    <div id="camposProva" style="display:none">
      <div class="campo-grupo">
        <label class="campo-label">Consulta?</label>
        <select class="campo-input" id="tarefaConsulta">
          <option value="nao">Não</option>
          <option value="sim">Sim</option>
        </select>
      </div>
    </div>
    <div id="camposTarefa" style="display:none">
      <div class="campo-grupo">
        <label class="campo-label">Tipo de entrega</label>
        <select class="campo-input" id="tarefaEntrega">
          <option value="">Selecione...</option>
          ${ENTREGAS.map(e => `<option value="${e.toLowerCase()}">${e}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="campo-grupo">
      <label class="campo-label">Grupo?</label>
      <select class="campo-input" id="tarefaGrupo">
        <option value="nao">Não (individual)</option>
        <option value="sim">Sim (em grupo)</option>
      </select>
    </div>
    <div id="campoGrupoNum" style="display:none">
      <div class="campo-grupo">
        <label class="campo-label">Número de membros por grupo</label>
        <input class="campo-input" type="number" id="tarefaNumMembros" min="2" max="10" placeholder="Ex: 4"/>
      </div>
    </div>
    <div class="campo-grupo">
      <label class="campo-label">Data de entrega / realização</label>
      <input class="campo-input" type="date" id="tarefaData"/>
    </div>
    <button class="btn-publicar" id="btnCriarTarefa">Adicionar ao calendário</button>
    <div class="secao-lista">
      <div class="secao-lista-titulo">Tarefas cadastradas</div>
      <div id="listaTarefas"><p class="lista-vazia">Carregando...</p></div>
    </div>`;

  document.getElementById('tarefaData').min = new Date().toISOString().slice(0, 10);
  document.getElementById('tarefaTipo').addEventListener('change', e => {
    document.getElementById('camposProva').style.display = e.target.value === 'prova' ? '' : 'none';
    document.getElementById('camposTarefa').style.display = e.target.value === 'tarefa' ? '' : 'none';
  });
  document.getElementById('tarefaGrupo').addEventListener('change', e => {
    document.getElementById('campoGrupoNum').style.display = e.target.value === 'sim' ? '' : 'none';
  });
  document.getElementById('btnCriarTarefa').addEventListener('click', criarTarefa);
  carregarTarefas();
}

async function criarTarefa() {
  const materia = document.getElementById('tarefaMateria').value;
  const tipo = document.getElementById('tarefaTipo').value;
  const conteudo = document.getElementById('tarefaConteudo').value.trim();
  const descricao = document.getElementById('tarefaDesc').value.trim();
  const consulta = document.getElementById('tarefaConsulta')?.value === 'sim';
  const tipoEntrega = document.getElementById('tarefaEntrega')?.value || '';
  const grupo = document.getElementById('tarefaGrupo').value === 'sim';
  const numMembros = parseInt(document.getElementById('tarefaNumMembros')?.value || '0');
  const dataEntrega = document.getElementById('tarefaData').value;
  const alerta = document.getElementById('alertaTarefa');
  const btn = document.getElementById('btnCriarTarefa');
  alerta.className = 'alerta';
  if (!materia || !tipo || !conteudo || !dataEntrega) { alerta.textContent = 'Preencha matéria, tipo, conteúdo e data.'; alerta.className = 'alerta erro'; return; }
  btn.disabled = true; btn.textContent = 'Adicionando...';
  try {
    const res = await fetch(`${API}/tarefas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ materia, tipo, conteudo, descricao, consulta, tipoEntrega, grupo, numMembros, dataEntrega, criadoPor: usuario.id }) });
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || 'Erro ao criar.');
    alerta.textContent = 'Adicionado ao calendário!'; alerta.className = 'alerta sucesso';
    ['tarefaMateria','tarefaTipo','tarefaConteudo','tarefaDesc','tarefaData'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('camposProva').style.display = 'none';
    document.getElementById('camposTarefa').style.display = 'none';
    document.getElementById('campoGrupoNum').style.display = 'none';
    carregarTarefas();
  } catch (err) { alerta.textContent = err.message; alerta.className = 'alerta erro'; }
  finally { btn.disabled = false; btn.textContent = 'Adicionar ao calendário'; }
}

async function carregarTarefas() {
  const lista = document.getElementById('listaTarefas');
  if (!lista) return;
  try {
    const tarefas = await (await fetch(`${API}/tarefas`)).json();
    if (!tarefas.length) { lista.innerHTML = '<p class="lista-vazia">Nenhuma tarefa cadastrada.</p>'; return; }
    lista.innerHTML = tarefas.map(t => {
      const data = new Date(t.dataEntrega).toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
      const tipo = t.tipo === 'prova' ? '📝 Prova' : '📋 Tarefa';
      return `<div class="item-card"><div class="item-info"><span class="item-titulo">${tipo}: ${t.materia || t.titulo}</span><span class="item-desc">${t.conteudo || t.descricao}</span><span class="item-meta">📅 ${data}</span></div><button class="btn-deletar" onclick="deletarTarefa('${t._id}')">Remover</button></div>`;
    }).join('');
  } catch { lista.innerHTML = '<p class="lista-vazia" style="color:#f87171">Erro ao carregar.</p>'; }
}

async function deletarTarefa(id) {
  if (!confirm('Remover esta tarefa?')) return;
  await fetch(`${API}/tarefas/${id}`, { method: 'DELETE' });
  carregarTarefas();
}

// ─── DESTAQUES ────────────────────────────────────────────────
async function renderDestaques() {
  const painel = document.getElementById('painelDestaques');
  painel.innerHTML = `
    <p class="form-titulo">Criar destaque</p>
    <div id="alertaDestaque" class="alerta"></div>
    <div class="campo-grupo">
      <label class="campo-label">Título</label>
      <input class="campo-input" id="destaqueTitulo" placeholder="Ex: Parabéns ao time de robótica!"/>
    </div>
    <div class="campo-grupo">
      <label class="campo-label">Descrição</label>
      <textarea class="campo-textarea" id="destaqueDesc" placeholder="Detalhes do destaque..."></textarea>
    </div>
    <button class="btn-publicar" id="btnCriarDestaque">Publicar destaque</button>
    <div class="secao-lista">
      <div class="secao-lista-titulo">Destaques publicados</div>
      <div id="listaDestaques"><p class="lista-vazia">Carregando...</p></div>
    </div>`;
  document.getElementById('btnCriarDestaque').addEventListener('click', criarDestaque);
  carregarDestaques();
}

async function criarDestaque() {
  const titulo = document.getElementById('destaqueTitulo').value.trim();
  const descricao = document.getElementById('destaqueDesc').value.trim();
  const alerta = document.getElementById('alertaDestaque');
  const btn = document.getElementById('btnCriarDestaque');
  alerta.className = 'alerta';
  if (!titulo || !descricao) { alerta.textContent = 'Preencha todos os campos.'; alerta.className = 'alerta erro'; return; }
  btn.disabled = true; btn.textContent = 'Publicando...';
  try {
    const res = await fetch(`${API}/destaques`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo, descricao, criadoPor: usuario.id }) });
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || 'Erro ao publicar.');
    alerta.textContent = 'Destaque publicado!'; alerta.className = 'alerta sucesso';
    document.getElementById('destaqueTitulo').value = '';
    document.getElementById('destaqueDesc').value = '';
    carregarDestaques();
  } catch (err) { alerta.textContent = err.message; alerta.className = 'alerta erro'; }
  finally { btn.disabled = false; btn.textContent = 'Publicar destaque'; }
}

async function carregarDestaques() {
  const lista = document.getElementById('listaDestaques');
  if (!lista) return;
  try {
    const destaques = await (await fetch(`${API}/destaques`)).json();
    if (!destaques.length) { lista.innerHTML = '<p class="lista-vazia">Nenhum destaque publicado.</p>'; return; }
    lista.innerHTML = destaques.map(d => `
      <div class="item-card">
        <div class="item-info">
          <span class="item-titulo">${d.titulo}</span>
          <span class="item-desc">${d.descricao}</span>
          <span class="item-meta">${new Date(d.criadoEm).toLocaleDateString('pt-BR')}</span>
        </div>
        <button class="btn-deletar" onclick="deletarDestaque('${d._id}')">Remover</button>
      </div>`).join('');
  } catch { lista.innerHTML = '<p class="lista-vazia" style="color:#f87171">Erro ao carregar.</p>'; }
}

async function deletarDestaque(id) {
  if (!confirm('Remover este destaque?')) return;
  await fetch(`${API}/destaques/${id}`, { method: 'DELETE' });
  carregarDestaques();
}

// ─── SUGESTÕES ────────────────────────────────────────────────
async function renderSugestoes() {
  const painel = document.getElementById('painelSugestoes');
  painel.innerHTML = `
    <p class="form-titulo">Sugestões dos alunos</p>
    <div id="listaSugestoes"><p class="lista-vazia">Carregando...</p></div>`;
  carregarSugestoes();
}

async function carregarSugestoes() {
  const lista = document.getElementById('listaSugestoes');
  if (!lista) return;
  try {
    const sugestoes = await (await fetch(`${API}/sugestoes`)).json();
    if (!sugestoes.length) { lista.innerHTML = '<p class="lista-vazia">Nenhuma sugestão ainda.</p>'; return; }
    lista.innerHTML = sugestoes.map(s => {
      const data = new Date(s.criadaEm).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });
      const status = s.status || (s.respondida ? 'aceita' : 'aguardando');
      const corStatus = status === 'aceita' ? '#4ade80' : status === 'recusada' ? '#f87171' : '#94a3b8';
      const labelStatus = status === 'aceita' ? '✓ Aceita' : status === 'recusada' ? '✗ Recusada' : '⏳ Aguardando';
      const btnAceitar = status === 'aguardando' ? `<button class="btn-aceitar" onclick="responderSugestao('${s._id}','aceita')">Aceitar</button>` : '';
      const btnRecusar = status === 'aguardando' ? `<button class="btn-recusar" onclick="responderSugestao('${s._id}','recusada')">Recusar</button>` : '';
      return `
        <div class="item-card" id="sug-${s._id}">
          <div class="item-info">
            <span class="item-titulo">${s.autor?.nome || 'Aluno'}</span>
            <span class="item-desc" style="white-space:normal;overflow:visible;text-overflow:unset">${s.texto}</span>
            <span class="item-meta">${data} · <span style="color:${corStatus}">${labelStatus}</span></span>
          </div>
          <div style="display:flex;gap:.4rem;flex-shrink:0">${btnAceitar}${btnRecusar}</div>
        </div>`;
    }).join('');
  } catch { lista.innerHTML = '<p class="lista-vazia" style="color:#f87171">Erro ao carregar.</p>'; }
}

async function responderSugestao(id, status) {
  try {
    await fetch(`${API}/sugestoes/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    carregarSugestoes();
  } catch (err) { console.error(err); }
}
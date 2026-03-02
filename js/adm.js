const API = "https://inf-25b-backend.onrender.com";

const usuario = JSON.parse(sessionStorage.getItem('usuario') || '{}');
const el = document.getElementById('conteudoPrincipal');

// ─── VERIFICAÇÃO DE ACESSO ────────────────────────────────────
if (!usuario.id || usuario.role !== 'admin') {
  el.innerHTML = `
    <div class="acesso-negado">
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <h2>Acesso restrito</h2>
      <p>Você precisa estar logado como ADM para acessar esta página.</p>
      <a class="btn-voltar-home" href="telaInicial.html">Voltar ao início</a>
    </div>
  `;
} else {
  renderPainel();
}

// ─── ESTRUTURA DO PAINEL ──────────────────────────────────────
function renderPainel() {
  el.innerHTML = `
    <div class="abas">
      <button class="aba-btn ativa" id="abaAvisos">📢 Avisos</button>
      <button class="aba-btn" id="abaTarefas">📅 Tarefas</button>
      <button class="aba-btn" id="abaDestaques">⭐ Destaques</button>
      <button class="aba-btn" id="abaSugestoes">💬 Sugestões</button>
    </div>
    <main class="main">
      <div class="painel ativo" id="painelAvisos"></div>
      <div class="painel" id="painelTarefas"></div>
      <div class="painel" id="painelDestaques"></div>
      <div class="painel" id="painelSugestoes"></div>
    </main>
  `;

  document.getElementById('abaAvisos').addEventListener('click', () => trocarAba('Avisos'));
  document.getElementById('abaTarefas').addEventListener('click', () => trocarAba('Tarefas'));
  document.getElementById('abaDestaques').addEventListener('click', () => trocarAba('Destaques'));
  document.getElementById('abaSugestoes').addEventListener('click', () => trocarAba('Sugestoes'));

  renderAvisos();
  renderTarefas();
  renderDestaques();
  renderSugestoes();
}

function trocarAba(nome) {
  document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativa'));
  document.querySelectorAll('.painel').forEach(p => p.classList.remove('ativo'));
  document.getElementById(`aba${nome}`).classList.add('ativa');
  document.getElementById(`painel${nome}`).classList.add('ativo');
}

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
    </div>
  `;

  document.getElementById('btnCriarAviso').addEventListener('click', criarAviso);
  carregarAvisos();
}

async function criarAviso() {
  const titulo = document.getElementById('avisoTitulo').value.trim();
  const descricao = document.getElementById('avisoDesc').value.trim();
  const alerta = document.getElementById('alertaAviso');
  const btn = document.getElementById('btnCriarAviso');

  alerta.className = 'alerta';
  if (!titulo || !descricao) {
    alerta.textContent = 'Preencha todos os campos.';
    alerta.className = 'alerta erro';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Publicando...';

  try {
    const res = await fetch(`${API}/avisos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descricao, criadoPor: usuario.id })
    });
    const dados = await res.json();

    if (!res.ok) throw new Error(dados.erro || 'Erro ao publicar.');

    alerta.textContent = 'Aviso publicado com sucesso!';
    alerta.className = 'alerta sucesso';
    document.getElementById('avisoTitulo').value = '';
    document.getElementById('avisoDesc').value = '';
    carregarAvisos();
  } catch (err) {
    alerta.textContent = err.message;
    alerta.className = 'alerta erro';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publicar aviso';
  }
}

async function carregarAvisos() {
  const lista = document.getElementById('listaAvisos');
  if (!lista) return;

  try {
    const res = await fetch(`${API}/avisos`);
    const avisos = await res.json();

    if (!avisos.length) {
      lista.innerHTML = '<p class="lista-vazia">Nenhum aviso publicado ainda.</p>';
      return;
    }

    lista.innerHTML = avisos.map(a => `
      <div class="item-card">
        <div class="item-info">
          <span class="item-titulo">${a.titulo}</span>
          <span class="item-desc">${a.descricao}</span>
          <span class="item-meta">${new Date(a.criadoEm).toLocaleDateString('pt-BR')}</span>
        </div>
        <button class="btn-deletar" onclick="deletarAviso('${a._id}')">Remover</button>
      </div>
    `).join('');
  } catch (err) {
    lista.innerHTML = '<p class="lista-vazia" style="color:#f87171">Erro ao carregar avisos.</p>';
  }
}

async function deletarAviso(id) {
  if (!confirm('Remover este aviso?')) return;
  await fetch(`${API}/avisos/${id}`, { method: 'DELETE' });
  carregarAvisos();
}

// ─── TAREFAS ──────────────────────────────────────────────────
async function renderTarefas() {
  const painel = document.getElementById('painelTarefas');
  painel.innerHTML = `
    <p class="form-titulo">Adicionar tarefa ou prova</p>
    <div id="alertaTarefa" class="alerta"></div>
    <div class="campo-grupo">
      <label class="campo-label">Título (matéria + tipo)</label>
      <input class="campo-input" id="tarefaTitulo" placeholder="Ex: Matemática — Prova de Trigonometria"/>
    </div>
    <div class="campo-grupo">
      <label class="campo-label">Descrição</label>
      <textarea class="campo-textarea" id="tarefaDesc" placeholder="Conteúdo, formato de entrega, detalhes..."></textarea>
    </div>
    <div class="campo-grupo">
      <label class="campo-label">Data de entrega / realização</label>
      <input class="campo-input" type="date" id="tarefaData"/>
    </div>
    <button class="btn-publicar" id="btnCriarTarefa">Adicionar ao calendário</button>

    <div class="secao-lista">
      <div class="secao-lista-titulo">Tarefas cadastradas</div>
      <div id="listaTarefas"><p class="lista-vazia">Carregando...</p></div>
    </div>
  `;

  // define data mínima como hoje
  document.getElementById('tarefaData').min = new Date().toISOString().slice(0, 10);
  document.getElementById('btnCriarTarefa').addEventListener('click', criarTarefa);
  carregarTarefas();
}

async function criarTarefa() {
  const titulo = document.getElementById('tarefaTitulo').value.trim();
  const descricao = document.getElementById('tarefaDesc').value.trim();
  const dataEntrega = document.getElementById('tarefaData').value;
  const alerta = document.getElementById('alertaTarefa');
  const btn = document.getElementById('btnCriarTarefa');

  alerta.className = 'alerta';
  if (!titulo || !descricao || !dataEntrega) {
    alerta.textContent = 'Preencha todos os campos.';
    alerta.className = 'alerta erro';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Adicionando...';

  try {
    const res = await fetch(`${API}/tarefas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descricao, dataEntrega, criadoPor: usuario.id })
    });
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || 'Erro ao criar.');

    alerta.textContent = 'Tarefa adicionada! Vai aparecer no calendário.';
    alerta.className = 'alerta sucesso';
    document.getElementById('tarefaTitulo').value = '';
    document.getElementById('tarefaDesc').value = '';
    document.getElementById('tarefaData').value = '';
    carregarTarefas();
  } catch (err) {
    alerta.textContent = err.message;
    alerta.className = 'alerta erro';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Adicionar ao calendário';
  }
}

async function carregarTarefas() {
  const lista = document.getElementById('listaTarefas');
  if (!lista) return;

  try {
    const res = await fetch(`${API}/tarefas`);
    const tarefas = await res.json();

    if (!tarefas.length) {
      lista.innerHTML = '<p class="lista-vazia">Nenhuma tarefa cadastrada ainda.</p>';
      return;
    }

    lista.innerHTML = tarefas.map(t => {
      const data = new Date(t.dataEntrega).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      return `
        <div class="item-card">
          <div class="item-info">
            <span class="item-titulo">${t.titulo}</span>
            <span class="item-desc">${t.descricao}</span>
            <span class="item-meta">📅 ${data}</span>
          </div>
          <button class="btn-deletar" onclick="deletarTarefa('${t._id}')">Remover</button>
        </div>
      `;
    }).join('');
  } catch (err) {
    lista.innerHTML = '<p class="lista-vazia" style="color:#f87171">Erro ao carregar.</p>';
  }
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
    </div>
  `;

  document.getElementById('btnCriarDestaque').addEventListener('click', criarDestaque);
  carregarDestaques();
}

async function criarDestaque() {
  const titulo = document.getElementById('destaqueTitulo').value.trim();
  const descricao = document.getElementById('destaqueDesc').value.trim();
  const alerta = document.getElementById('alertaDestaque');
  const btn = document.getElementById('btnCriarDestaque');

  alerta.className = 'alerta';
  if (!titulo || !descricao) {
    alerta.textContent = 'Preencha todos os campos.';
    alerta.className = 'alerta erro';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Publicando...';

  try {
    const res = await fetch(`${API}/destaques`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, descricao, criadoPor: usuario.id })
    });
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.erro || 'Erro ao publicar.');

    alerta.textContent = 'Destaque publicado!';
    alerta.className = 'alerta sucesso';
    document.getElementById('destaqueTitulo').value = '';
    document.getElementById('destaqueDesc').value = '';
    carregarDestaques();
  } catch (err) {
    alerta.textContent = err.message;
    alerta.className = 'alerta erro';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Publicar destaque';
  }
}

async function carregarDestaques() {
  const lista = document.getElementById('listaDestaques');
  if (!lista) return;

  try {
    const res = await fetch(`${API}/destaques`);
    const destaques = await res.json();

    if (!destaques.length) {
      lista.innerHTML = '<p class="lista-vazia">Nenhum destaque publicado ainda.</p>';
      return;
    }

    lista.innerHTML = destaques.map(d => `
      <div class="item-card">
        <div class="item-info">
          <span class="item-titulo">${d.titulo}</span>
          <span class="item-desc">${d.descricao}</span>
          <span class="item-meta">${new Date(d.criadoEm).toLocaleDateString('pt-BR')}</span>
        </div>
        <button class="btn-deletar" onclick="deletarDestaque('${d._id}')">Remover</button>
      </div>
    `).join('');
  } catch (err) {
    lista.innerHTML = '<p class="lista-vazia" style="color:#f87171">Erro ao carregar.</p>';
  }
}

async function deletarDestaque(id) {
  if (!confirm('Remover este destaque?')) return;
  await fetch(`${API}/destaques/${id}`, { method: 'DELETE' });
  carregarDestaques();
}

// ─── SUGESTÕES (só leitura) ───────────────────────────────────
async function renderSugestoes() {
  const painel = document.getElementById('painelSugestoes');
  painel.innerHTML = `
    <p class="form-titulo">Sugestões recebidas dos alunos</p>
    <div id="listaSugestoes"><p class="lista-vazia">Carregando...</p></div>
  `;
  carregarSugestoes();
}

async function carregarSugestoes() {
  const lista = document.getElementById('listaSugestoes');
  if (!lista) return;

  try {
    const res = await fetch(`${API}/sugestoes`);
    const sugestoes = await res.json();

    if (!sugestoes.length) {
      lista.innerHTML = '<p class="lista-vazia">Nenhuma sugestão recebida ainda.</p>';
      return;
    }

    lista.innerHTML = sugestoes.map(s => {
      const data = new Date(s.criadaEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
      const status      = s.respondida ? 'color:#4ade80' : 'color:#94a3b8';
      const labelStatus = s.respondida ? '✓ Respondida' : '⏳ Aguardando';
      return `
        <div class="item-card">
          <div class="item-info">
            <span class="item-titulo">${s.autor?.nome || 'Aluno'}</span>
            <span class="item-desc">${s.texto}</span>
            <span class="item-meta">${data} · <span style="${status}">${labelStatus}</span></span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    lista.innerHTML = '<p class="lista-vazia" style="color:#f87171">Erro ao carregar.</p>';
  }
}
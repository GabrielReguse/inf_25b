const API = "https://inf-25b-backend.onrender.com";

// ─── Device ID ────────────────────────────────────────────────
const deviceId = localStorage.getItem('deviceId') || (() => {
  const id = crypto.randomUUID();
  localStorage.setItem('deviceId', id);
  return id;
})();

fetch(`${API}/visita`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ deviceId })
}).catch(() => {});

// ─── ADMINS (role definida por email) ─────────────────────────
const emailsAdm = new Set([
    "viniciushoppe@outlook.com",
    "gabrielreguse1@gmail.com",
]);

async function pegarModelo() {
    try {
        if (!navigator.userAgentData) return "Indisponível";
        const d = await navigator.userAgentData.getHighEntropyValues(["model","platform","platformVersion"]);
        return `${d.platform} | ${d.model||"modelo não disponível"} | v${d.platformVersion}`;
    } catch { return "Indisponível"; }
}

// ─── STATE ───────────────────────────────────────────────────
let modo = 'login'; // 'login' | 'cadastro'
let dadosCadastro = null;

const elTitulo    = document.getElementById('formTitulo');
const elCampos    = document.getElementById('campos');
const elBtnLabel  = document.getElementById('btnLabel');
const elLinkTexto = document.getElementById('linkTexto');
const elLinkAcao  = document.getElementById('linkAcao');
const elAlerta    = document.getElementById('alerta');
const elForm      = document.getElementById('formPrincipal');

function renderModo() {
    elAlerta.className = 'alerta';
    elAlerta.textContent = '';

    if (modo === 'login') {
        elTitulo.textContent = 'Realize seu login!';
        elBtnLabel.textContent = 'Login';
        elLinkTexto.textContent = 'Não possui conta? ';
        elLinkAcao.textContent = 'Faça seu cadastro';
        elCampos.innerHTML = `
      <div class="campo-grupo">
        <label class="campo-label" for="inputEmail">E-mail próprio</label>
        <input class="campo-input" type="email" id="inputEmail" placeholder="seu@email.com" autocomplete="email"/>
        <span class="campo-erro" id="erroEmail"></span>
      </div>
      <div class="campo-grupo">
        <label class="campo-label" for="inputSenha">Digite sua senha</label>
        <input class="campo-input" type="password" id="inputSenha" placeholder="••••••••" autocomplete="current-password"/>
        <span class="campo-erro" id="erroSenha"></span>
      </div>`;

    } else if (modo === 'cadastro') {
        elTitulo.textContent = 'Realize seu cadastro!';
        elBtnLabel.textContent = 'Cadastrar';
        elLinkTexto.textContent = 'Já possui conta? ';
        elLinkAcao.textContent = 'Faça seu login';
        elCampos.innerHTML = `
      <div class="campo-grupo">
        <label class="campo-label" for="inputNome">Nome completo</label>
        <input class="campo-input" type="text" id="inputNome" placeholder="Seu nome completo" autocomplete="name"/>
        <span class="campo-erro" id="erroNome"></span>
      </div>
      <div class="campo-grupo">
        <label class="campo-label" for="inputEmail">E-mail próprio</label>
        <input class="campo-input" type="email" id="inputEmail" placeholder="seu@email.com" autocomplete="email"/>
        <span class="campo-erro" id="erroEmail"></span>
      </div>
      <div class="campo-grupo">
        <label class="campo-label" for="inputSenha">Escolha uma senha</label>
        <input class="campo-input" type="password" id="inputSenha" placeholder="••••••••" autocomplete="new-password"/>
        <span class="campo-erro" id="erroSenha"></span>
      </div>
      <div class="campo-grupo">
        <label class="campo-label" for="inputConfirma">Confirme sua senha</label>
        <input class="campo-input" type="password" id="inputConfirma" placeholder="••••••••" autocomplete="new-password"/>
        <span class="campo-erro" id="erroConfirma"></span>
      </div>
      <div class="campo-grupo">
        <label class="campo-label" for="inputConvite">Código de convite</label>
        <input class="campo-input" type="password" id="inputConvite" placeholder="••••••••" autocomplete="off"/>
        <span class="campo-erro" id="erroConvite"></span>
      </div>`;
    }
}

elLinkAcao.addEventListener('click', () => {
    modo = modo === 'login' ? 'cadastro' : 'login';
    renderModo();
});

elForm.addEventListener('submit', async e => {
    e.preventDefault();
    elAlerta.className = 'alerta';
    elAlerta.textContent = '';
    document.querySelectorAll('.campo-erro').forEach(el => el.textContent = '');

    const email = document.getElementById('inputEmail')?.value.trim().toLowerCase() || '';
    const senha = document.getElementById('inputSenha')?.value || '';
    let valido = true;

    if (!email) { document.getElementById('erroEmail').textContent = 'Informe seu e-mail.'; valido = false; }
    if (!senha)  { document.getElementById('erroSenha').textContent  = 'Informe sua senha.';  valido = false; }

    // ── CADASTRO ──────────────────────────────────────────────
    if (modo === 'cadastro') {
        const nome     = document.getElementById('inputNome')?.value.trim() || '';
        const confirma = document.getElementById('inputConfirma')?.value || '';
        const convite  = document.getElementById('inputConvite')?.value || '';

        if (!nome)    { document.getElementById('erroNome').textContent    = 'Informe seu nome.';          valido = false; }
        if (senha && confirma && senha !== confirma) {
            document.getElementById('erroConfirma').textContent = 'As senhas não coincidem.';              valido = false; }
        if (!convite) { document.getElementById('erroConvite').textContent = 'Informe o código de convite.'; valido = false; }
        if (!valido) return;

        // valida código de convite no frontend
        if (convite !== 'INF25B2025') {
            document.getElementById('erroConvite').textContent = 'Código de convite incorreto.';
            return;
        }

        const role = emailsAdm.has(email) ? 'admin' : 'aluno';
        const btn = elForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Cadastrando...'; }

        try {
            const modelo = await pegarModelo();
            const res = await fetch(`${API}/cadastro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-device-model': modelo,
                    'x-device-id': deviceId
                },
                body: JSON.stringify({ nome, email, senha, role })
            });
            const dados = await res.json();
            if (btn) { btn.disabled = false; btn.textContent = 'Cadastrar'; }

            if (!res.ok) {
                elAlerta.textContent = dados.erro || 'Erro ao cadastrar.';
                elAlerta.className = 'alerta erro'; return;
            }

            elAlerta.textContent = '✓ Cadastro realizado! Faça seu login.';
            elAlerta.className = 'alerta sucesso';
            setTimeout(() => { modo = 'login'; renderModo(); }, 1800);

        } catch {
            elAlerta.textContent = 'Erro ao conectar com o servidor.';
            elAlerta.className = 'alerta erro';
            if (btn) { btn.disabled = false; btn.textContent = 'Cadastrar'; }
        }
        return;
    }

    // ── LOGIN ────────────────────────────────────────────────
    if (!valido) return;

    try {
        const modelo = await pegarModelo();
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-device-model': modelo,
                'x-device-id': deviceId
            },
            body: JSON.stringify({ email, senha })
        });
        const dados = await res.json();

        if (!res.ok) {
            elAlerta.textContent = dados.erro || 'Credenciais inválidas.';
            elAlerta.className = 'alerta erro'; return;
        }

        sessionStorage.setItem('usuario', JSON.stringify(dados.usuario));
        elAlerta.textContent = 'Login realizado! Redirecionando...';
        elAlerta.className = 'alerta sucesso';
        setTimeout(() => { window.location.href = 'telaInicial.html'; }, 1200);

    } catch {
        elAlerta.textContent = 'Erro ao conectar com o servidor.';
        elAlerta.className = 'alerta erro';
    }
});

renderModo();
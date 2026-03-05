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

// ─── WHITELIST ────────────────────────────────────────────────
const emailsPermitidos = new Set([
    "amanda.zink09@gmail.com",
    "lohanystephany808@gmail.com",
    "francagregori7@gmail.com",
    "carlosereblin@gmail.com",
    "gabrielabuenomiranda9@gmail.com",
    "viniciushoppe@outlook.com",
    "eduardo.gubler@gmail.com",
    "gabrielreguse1@gmail.com",
]);

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
let modo = 'login'; // 'login' | 'cadastro' | 'verificacao'
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
        elBtnLabel.textContent = 'Enviar código';
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
      </div>`;

    } else if (modo === 'verificacao') {
        elTitulo.textContent = 'Verifique seu e-mail!';
        elBtnLabel.textContent = 'Confirmar código';
        elLinkTexto.textContent = '';
        elLinkAcao.textContent = '← Usar outro e-mail';
        elCampos.innerHTML = `
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:3rem;margin-bottom:8px">📬</div>
        <p style="color:#c4b5fd;font-size:.9rem;margin:0">Enviamos um código para</p>
        <p style="color:#a78bfa;font-weight:700;margin:4px 0 0">${dadosCadastro?.email || ''}</p>
        <p style="color:#94a3b8;font-size:.78rem;margin:8px 0 0">Verifique também a pasta de spam.</p>
      </div>
      <div class="campo-grupo">
        <label class="campo-label" for="inputCodigo">Código de 6 dígitos</label>
        <input class="campo-input" type="text" id="inputCodigo"
          placeholder="000000" maxlength="6" inputmode="numeric"
          autocomplete="one-time-code"
          style="text-align:center;font-size:1.8rem;letter-spacing:8px;font-weight:700;padding:12px"/>
        <span class="campo-erro" id="erroCodigo"></span>
      </div>
      <p style="text-align:center;color:#64748b;font-size:.78rem;margin:4px 0 0">Expira em 10 minutos.</p>`;
        setTimeout(() => document.getElementById('inputCodigo')?.focus(), 150);
    }
}

elLinkAcao.addEventListener('click', () => {
    if (modo === 'verificacao') { modo = 'cadastro'; dadosCadastro = null; }
    else { modo = modo === 'login' ? 'cadastro' : 'login'; }
    renderModo();
});

elForm.addEventListener('submit', async e => {
    e.preventDefault();
    elAlerta.className = 'alerta';
    elAlerta.textContent = '';
    document.querySelectorAll('.campo-erro').forEach(el => el.textContent = '');

    // ── CONFIRMAR CÓDIGO ──────────────────────────────────────
    if (modo === 'verificacao') {
        const codigo = document.getElementById('inputCodigo')?.value.trim() || '';
        if (codigo.length < 6) {
            document.getElementById('erroCodigo').textContent = 'Informe o código de 6 dígitos.';
            return;
        }
        const btn = elForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Verificando...'; }

        try {
            const modelo = await pegarModelo();
            const res = await fetch(`${API}/verificar/confirmar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-device-model': modelo, 'x-device-id': deviceId },
                body: JSON.stringify({ email: dadosCadastro.email, codigo })
            });
            const dados = await res.json();

            if (!res.ok) {
                document.getElementById('erroCodigo').textContent = dados.erro || 'Código inválido.';
                if (btn) { btn.disabled = false; btn.textContent = 'Confirmar código'; }
                return;
            }

            elAlerta.textContent = '✓ Conta criada com sucesso! Faça seu login.';
            elAlerta.className = 'alerta sucesso';
            setTimeout(() => { dadosCadastro = null; modo = 'login'; renderModo(); }, 2000);

        } catch {
            elAlerta.textContent = 'Erro ao conectar com o servidor.';
            elAlerta.className = 'alerta erro';
            if (btn) { btn.disabled = false; btn.textContent = 'Confirmar código'; }
        }
        return;
    }

    const email = document.getElementById('inputEmail')?.value.trim().toLowerCase() || '';
    const senha = document.getElementById('inputSenha')?.value || '';
    let valido = true;
    if (!email) { document.getElementById('erroEmail').textContent = 'Informe seu e-mail.'; valido = false; }
    if (!senha) { document.getElementById('erroSenha').textContent = 'Informe sua senha.'; valido = false; }

    // ── ENVIAR CÓDIGO (CADASTRO) ──────────────────────────────
    if (modo === 'cadastro') {
        const nome     = document.getElementById('inputNome')?.value.trim() || '';
        const confirma = document.getElementById('inputConfirma')?.value || '';
        if (!nome) { document.getElementById('erroNome').textContent = 'Informe seu nome.'; valido = false; }
        if (senha && confirma && senha !== confirma) {
            document.getElementById('erroConfirma').textContent = 'As senhas não coincidem.'; valido = false;
        }
        if (!valido) return;

        if (!emailsPermitidos.has(email)) {
            elAlerta.textContent = 'Este e-mail não está autorizado a se cadastrar.';
            elAlerta.className = 'alerta erro'; return;
        }

        const role = emailsAdm.has(email) ? 'admin' : 'aluno';
        const btn = elForm.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

        try {
            const res = await fetch(`${API}/verificar/enviar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, nome, senha, role })
            });
            const dados = await res.json();
            if (btn) { btn.disabled = false; btn.textContent = 'Enviar código'; }

            if (!res.ok) {
                elAlerta.textContent = dados.erro || 'Erro ao enviar código.';
                elAlerta.className = 'alerta erro'; return;
            }

            dadosCadastro = { email, nome, role };
            modo = 'verificacao';
            renderModo();
            elAlerta.textContent = `Código enviado para ${email}!`;
            elAlerta.className = 'alerta sucesso';
        } catch {
            elAlerta.textContent = 'Erro ao conectar com o servidor.';
            elAlerta.className = 'alerta erro';
            if (btn) { btn.disabled = false; btn.textContent = 'Enviar código'; }
        }
        return;
    }

    // ── LOGIN ────────────────────────────────────────────────
    if (!valido) return;
    if (!emailsPermitidos.has(email)) {
        elAlerta.textContent = 'E-mail não reconhecido. Acesso negado.';
        elAlerta.className = 'alerta erro'; return;
    }

    try {
        const modelo = await pegarModelo();
        const res = await fetch(`${API}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-device-model': modelo, 'x-device-id': deviceId },
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
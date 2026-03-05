// emails permitidos → adicionar todos os alunos aqui
const emailsPermitidos = new Set([
    // alunos
    "amanda.zink09@gmail.com",
    "lohanystephany808@gmail.com",
    "francagregori7@gmail.com",
    "carlosereblin@gmail.com",
    "gabrielabuenomiranda9@gmail.com",

    // SUPER ADM MASTER
    "viniciushoppe@outlook.com",
    // líder e vice
    "eduardo.gubler@gmail.com",
    "gabrielreguse1@gmail.com",
]);

const emailsAdm = new Set([
    "viniciushoppe@outlook.com",
    "gabrielreguse1@gmail.com",
]);

// ─── Pega modelo real do dispositivo ─────────────────────────
async function pegarModelo() {
    try {
        if (!navigator.userAgentData) return "Indisponível";
        const dados = await navigator.userAgentData.getHighEntropyValues([
            "model", "platform", "platformVersion"
        ]);
        return `${dados.platform} | ${dados.model || "modelo não disponível"} | v${dados.platformVersion}`;
    } catch {
        return "Indisponível";
    }
}

// modo atual: 'login' | 'cadastro'
let modo = 'login';

// referências
const elTitulo   = document.getElementById('formTitulo');
const elCampos   = document.getElementById('campos');
const elBtnLabel = document.getElementById('btnLabel');
const elLinkTexto = document.getElementById('linkTexto');
const elLinkAcao  = document.getElementById('linkAcao');
const elAlerta    = document.getElementById('alerta');
const elForm      = document.getElementById('formPrincipal');

function renderModo() {
    elAlerta.className = 'alerta';
    elAlerta.textContent = '';

    if (modo === 'login') {
        elTitulo.textContent    = 'Realize seu login!';
        elBtnLabel.textContent  = 'Login';
        elLinkTexto.textContent = 'Não possui conta? ';
        elLinkAcao.textContent  = 'Faça seu cadastro';

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
      </div>
    `;
    } else {
        elTitulo.textContent    = 'Realize seu cadastro!';
        elBtnLabel.textContent  = 'Cadastro';
        elLinkTexto.textContent = 'Já possui conta? ';
        elLinkAcao.textContent  = 'Faça seu login';

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
    `;
    }
}

// troca de modo
elLinkAcao.addEventListener('click', () => {
    modo = modo === 'login' ? 'cadastro' : 'login';
    renderModo();
});

// ─── SALVA USUÁRIO: sessionStorage + localStorage ─────────────
// sessionStorage é apagado quando o app vai para background no celular.
// localStorage persiste e serve como fallback para manter o login ativo.
function salvarUsuario(dadosUsuario) {
    const json = JSON.stringify(dadosUsuario);
    sessionStorage.setItem('usuario', json);
    localStorage.setItem('usuario', json);
}

// submit
elForm.addEventListener('submit', async e => {
    e.preventDefault();
    elAlerta.className = 'alerta';
    elAlerta.textContent = '';

    const email = document.getElementById('inputEmail')?.value.trim().toLowerCase() || '';
    const senha = document.getElementById('inputSenha')?.value || '';

    // limpa erros anteriores
    document.querySelectorAll('.campo-erro').forEach(el => el.textContent = '');

    let valido = true;

    if (!email) {
        document.getElementById('erroEmail').textContent = 'Informe seu e-mail.';
        valido = false;
    }

    if (!senha) {
        document.getElementById('erroSenha').textContent = 'Informe sua senha.';
        valido = false;
    }

    if (modo === 'cadastro') {
        const nome     = document.getElementById('inputNome')?.value.trim() || '';
        const confirma = document.getElementById('inputConfirma')?.value || '';

        if (!nome) {
            document.getElementById('erroNome').textContent = 'Informe seu nome.';
            valido = false;
        }

        if (senha && confirma && senha !== confirma) {
            document.getElementById('erroConfirma').textContent = 'As senhas não coincidem.';
            valido = false;
        }

        if (!valido) return;

        // valida email na whitelist
        if (!emailsPermitidos.has(email)) {
            elAlerta.textContent = 'Este e-mail não está autorizado a se cadastrar.';
            elAlerta.className = 'alerta erro';
            return;
        }

        // define role
        const role = emailsAdm.has(email) ? 'admin' : 'aluno';

        try {
            const modelo = await pegarModelo();
            const resposta = await fetch("https://inf-25b-backend.onrender.com/cadastro", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-device-model": modelo
                },
                body: JSON.stringify({ nome, email, senha, role })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                elAlerta.textContent = dados.erro || "Erro ao cadastrar.";
                elAlerta.className = "alerta erro";
                return;
            }

            elAlerta.textContent = "Cadastro realizado com sucesso! Faça seu login.";
            elAlerta.className = "alerta sucesso";
            setTimeout(() => {
                modo = 'login';
                renderModo();
            }, 1500);

        } catch (erro) {
            elAlerta.textContent = "Erro ao conectar com o servidor.";
            elAlerta.className = "alerta erro";
        }

    } else {
        if (!valido) return;

        // valida email na whitelist
        if (!emailsPermitidos.has(email)) {
            elAlerta.textContent = 'E-mail não reconhecido. Acesso negado.';
            elAlerta.className = 'alerta erro';
            return;
        }

        try {
            const modelo = await pegarModelo();
            const resposta = await fetch("https://inf-25b-backend.onrender.com/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-device-model": modelo
                },
                body: JSON.stringify({ email, senha })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                elAlerta.textContent = dados.erro || 'Credenciais inválidas.';
                elAlerta.className = 'alerta erro';
                return;
            }

            // ─── FIX MOBILE: salva em sessionStorage E localStorage ───
            salvarUsuario(dados.usuario);

            elAlerta.textContent = 'Login realizado! Redirecionando...';
            elAlerta.className = 'alerta sucesso';
            setTimeout(() => { window.location.href = 'telaInicial.html'; }, 1200);

        } catch (err) {
            elAlerta.textContent = 'Erro ao conectar com o servidor.';
            elAlerta.className = 'alerta erro';
        }
    }
});

// init
renderModo();
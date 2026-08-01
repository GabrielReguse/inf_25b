(() => {
  const { api, setSession, readSession, showToast, setLoading } = window.INF25B;
  const form = document.getElementById('authForm');
  const title = document.getElementById('authTitle');
  const subtitle = document.getElementById('authSubtitle');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const nameField = document.getElementById('nameField');
  const confirmField = document.getElementById('confirmField');
  const nameInput = document.getElementById('nameInput');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const confirmInput = document.getElementById('confirmInput');
  const submit = document.getElementById('authSubmit');
  const errorBox = document.getElementById('authError');
  const passwordToggle = document.getElementById('passwordToggle');
  let mode = 'login';

  if (readSession()?.token) location.replace('telaInicial.html');

  const params = new URLSearchParams(location.search);
  if (params.get('motivo') === 'sessao') errorBox.textContent = 'Sua sessão expirou. Entre novamente.';

  function setMode(nextMode) {
    mode = nextMode;
    const registering = mode === 'register';
    loginTab.classList.toggle('active', !registering);
    registerTab.classList.toggle('active', registering);
    nameField.hidden = !registering;
    confirmField.hidden = !registering;
    nameInput.required = registering;
    confirmInput.required = registering;
    passwordInput.autocomplete = registering ? 'new-password' : 'current-password';
    title.textContent = registering ? 'Crie sua conta' : 'Bem-vindo de volta';
    subtitle.textContent = registering ? 'Use o e-mail autorizado para entrar na plataforma.' : 'Entre para acessar o painel da turma.';
    submit.textContent = registering ? 'Criar conta' : 'Entrar';
    errorBox.textContent = '';
  }

  loginTab.addEventListener('click', () => setMode('login'));
  registerTab.addEventListener('click', () => setMode('register'));

  passwordToggle.addEventListener('click', () => {
    const showing = passwordInput.type === 'text';
    passwordInput.type = showing ? 'password' : 'text';
    confirmInput.type = showing ? 'password' : 'text';
    passwordToggle.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    errorBox.textContent = '';
    const nome = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const senha = passwordInput.value;
    if (!email || !senha) return errorBox.textContent = 'Preencha o e-mail e a senha.';
    if (mode === 'register') {
      if (nome.length < 2) return errorBox.textContent = 'Informe seu nome completo.';
      if (senha.length < 8) return errorBox.textContent = 'A senha precisa ter pelo menos 8 caracteres.';
      if (senha !== confirmInput.value) return errorBox.textContent = 'As senhas não coincidem.';
    }
    setLoading(submit, true, mode === 'register' ? 'Criando conta…' : 'Entrando…');
    try {
      const data = await api(mode === 'register' ? '/auth/cadastro' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(mode === 'register' ? { nome, email, senha } : { email, senha })
      });
      setSession({ token: data.token, usuario: data.usuario });
      showToast(mode === 'register' ? 'Conta criada com sucesso.' : 'Login realizado.');
      location.replace('telaInicial.html');
    } catch (error) {
      errorBox.textContent = error.message || 'Não foi possível acessar a plataforma.';
    } finally {
      setLoading(submit, false);
    }
  });

  const apiInput = document.getElementById('apiInput');
  apiInput.value = localStorage.getItem('inf25b_api_url') || '';
  document.getElementById('saveApi').addEventListener('click', () => {
    const value = apiInput.value.trim().replace(/\/$/, '');
    if (value) localStorage.setItem('inf25b_api_url', value);
    else localStorage.removeItem('inf25b_api_url');
    showToast('Endereço salvo. A página será recarregada.');
    setTimeout(() => location.reload(), 400);
  });
})();

try {
  const session = JSON.parse(localStorage.getItem('inf25b_session_v2') || 'null');
  location.replace(session?.token ? './html/telaInicial.html' : './html/cadastro.html');
} catch {
  location.replace('./html/cadastro.html');
}

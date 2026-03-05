// restaura página ao voltar pelo navegador/celular
window.addEventListener('pageshow', () => {
  const page = document.getElementById('page');
  if (!page) return;
  page.classList.remove('saindo');
  page.style.animation = 'none';
  page.style.opacity = '1';
  page.style.transform = 'translateX(0)';
  page.offsetHeight;
  page.style.animation = '';
  page.style.opacity = '';
  page.style.transform = '';
});

// header scroll
const header = document.getElementById('header');
const headerLinha = document.getElementById('headerLinha');

if (header && headerLinha) {
  window.addEventListener('scroll', () => {
    const rolou = window.scrollY > 8;
    header.classList.toggle('scrolled', rolou);
    headerLinha.classList.toggle('fina', rolou);
  }, { passive: true });
}

// animação de saída
document.querySelectorAll('a[href]').forEach(link => {
  if (link.hostname !== location.hostname && link.hostname !== '') return;
  if (link.getAttribute('href').startsWith('#')) return;

  link.addEventListener('click', e => {
    e.preventDefault();
    const destino = link.href;
    document.getElementById('page').classList.add('saindo');
    setTimeout(() => { window.location.href = destino; }, 260);
  });
});

// enviar email
document.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');

    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    e.preventDefault();
  });
});
// ─── NOTIFICAÇÕES PUSH ────────────────────────────────────────
const API_PUSH = "https://inf-25b-backend.onrender.com";

async function iniciarPush() {
  // só roda se o usuário estiver logado
  const usuario = (() => {
    try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); } catch { return {}; }
  })();
  if (!usuario.id) return;

  // verifica suporte
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    // registra o service worker
    const registro = await navigator.serviceWorker.register('/sw.js');

    // verifica se já tem inscrição ativa
    const inscricaoExistente = await registro.pushManager.getSubscription();
    if (inscricaoExistente) return; // já inscrito, nada a fazer

    // pede permissão ao usuário
    const permissao = await Notification.requestPermission();
    if (permissao !== 'granted') return;

    // busca chave pública VAPID do backend
    const res = await fetch(`${API_PUSH}/push/chave-publica`);
    const { chave } = await res.json();

    // cria inscrição
    const subscription = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(chave)
    });

    // salva inscrição no backend
    await fetch(`${API_PUSH}/push/inscrever`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId: usuario.id, subscription })
    });

  } catch (err) {
    console.error('Erro ao configurar push:', err);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

// inicia push após o DOM carregar
window.addEventListener('DOMContentLoaded', iniciarPush);
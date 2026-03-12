// ─── Device ID ────────────────────────────────────────────────
const deviceId = localStorage.getItem('deviceId') || (() => {
  const id = crypto.randomUUID();
  localStorage.setItem('deviceId', id);
  return id;
})();

// ─── SINCRONIZA SESSÃO (auto login) ──────────────────────────
// se tem usuário no localStorage mas não no sessionStorage, sincroniza
if (!sessionStorage.getItem('usuario') && localStorage.getItem('usuario')) {
  sessionStorage.setItem('usuario', localStorage.getItem('usuario'));
}

// restaura página ao voltar pelo navegador/celular
window.addEventListener('pageshow', () => {
  const page = document.getElementById('page');
  if (!page) return;
  page.classList.remove('saindo');
  page.style.animation = 'none';
  page.style.opacity   = '1';
  page.style.transform = 'translateX(0)';
  page.offsetHeight;
  page.style.animation = '';
  page.style.opacity   = '';
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
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    e.preventDefault();
  });
});

// ─── LOGOUT ───────────────────────────────────────────────────
// use: logout() em qualquer página pra deslogar
function logout() {
  localStorage.removeItem('usuario');
  sessionStorage.removeItem('usuario');
  window.location.href = '/html/cadastro.html';
}

// ─── NOTIFICAÇÕES PUSH ────────────────────────────────────────
const API_PUSH = "https://inf-25b-backend.onrender.com";

async function iniciarPush() {
  const usuario = (() => {
    try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); } catch { return {}; }
  })();
  if (!usuario.id) return;

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const registro = await navigator.serviceWorker.register('/sw.js');
    const inscricaoExistente = await registro.pushManager.getSubscription();
    if (inscricaoExistente) return;

    const permissao = await Notification.requestPermission();
    if (permissao !== 'granted') return;

    const res = await fetch(`${API_PUSH}/push/chave-publica`);
    const { chave } = await res.json();

    const subscription = await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(chave)
    });

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

// ─── HEARTBEAT ────────────────────────────────────────────────
async function enviarHeartbeat() {
  const usuario = (() => {
    try { return JSON.parse(sessionStorage.getItem('usuario') || '{}'); } catch { return {}; }
  })();
  if (!usuario.id) return;

  try {
    let modelo = "Indisponível";
    if (navigator.userAgentData) {
      try {
        const d = await navigator.userAgentData.getHighEntropyValues(["model","platform","platformVersion"]);
        modelo = `${d.platform} | ${d.model || "modelo não disponível"} | v${d.platformVersion}`;
      } catch {}
    }

    await fetch(`${API_PUSH}/admin/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-device-model': modelo, 'x-device-id': deviceId },
      body: JSON.stringify({ email: usuario.email, nome: usuario.nome })
    });
  } catch {}
}

window.addEventListener('DOMContentLoaded', () => {
  iniciarPush();
  enviarHeartbeat();
  setInterval(enviarHeartbeat, 5 * 60 * 1000);
});

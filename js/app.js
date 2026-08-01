(() => {
  'use strict';

  const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
  const API_URL = localStorage.getItem('inf25b_api_url') || (isLocal ? 'http://localhost:2025' : 'https://inf-25b-backend.onrender.com');
  const SESSION_KEY = 'inf25b_session_v2';
  const THEME_KEY = 'inf25b_theme';
  const page = document.body.dataset.page || '';
  const isPublic = document.body.dataset.public === 'true';

  const icons = {
    home: '<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-5v-7h-4v7H5a2 2 0 0 1-2-2z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z"/><path d="M4 6.5v13M8 8h8"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    party: '<svg viewBox="0 0 24 24"><path d="m5 4 15 15M9 4l1 3M14 3l-1 4M18 7l3-1M5 9l-3 1M4 19l5-10 6 6z"/></svg>',
    bulb: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4"/><path d="M8.7 15.2A7 7 0 1 1 15.3 15.2c-.8.6-1.3 1.3-1.3 2.3h-4c0-1-.5-1.7-1.3-2.3z"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    user: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    admin: '<svg viewBox="0 0 24 24"><path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5z"/><path d="M9 12h6M12 9v6"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20.5 14.5A8 8 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="m18 6-12 12M6 6l12 12"/></svg>',
    logout: '<svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/></svg>',
    wifi: '<svg viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>',
    chevron: '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>'
  };

  const navItems = [
    { id: 'dashboard', label: 'Visão geral', href: 'telaInicial.html', icon: 'home' },
    { id: 'academico', label: 'Provas e tarefas', href: 'tarefasProvas.html', icon: 'calendar' },
    { id: 'importantes', label: 'Importantes', href: 'importantes.html', icon: 'shield' },
    { id: 'lazer', label: 'Lazer e enquetes', href: 'lazer.html', icon: 'party' },
    { id: 'sugestoes', label: 'Sugestões', href: 'sugestoes.html', icon: 'bulb' },
    { id: 'conversa', label: 'Conversa', href: 'conversa.html', icon: 'chat' },
    { id: 'perfil', label: 'Meu perfil', href: 'perfil.html', icon: 'user' }
  ];

  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  }

  function setSession(data) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function currentUser() {
    return readSession()?.usuario || null;
  }

  function token() {
    return readSession()?.token || '';
  }

  function escapeHTML(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function safeUrl(value, fallback = '#') {
    try {
      const url = new URL(String(value || ''), location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : fallback;
    } catch {
      return fallback;
    }
  }

  function formatDate(value, options = {}) {
    if (!value) return 'Sem data';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Data inválida';
    return new Intl.DateTimeFormat('pt-BR', options.dateStyle ? options : { day: '2-digit', month: 'short', year: 'numeric', ...options }).format(date);
  }

  function formatDateTime(value) {
    if (!value) return 'Agora';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  }

  function relativeDate(value) {
    const date = new Date(value);
    const diff = date.getTime() - Date.now();
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
    if (abs < 60 * 60_000) return rtf.format(Math.round(diff / 60_000), 'minute');
    if (abs < 24 * 60 * 60_000) return rtf.format(Math.round(diff / 3_600_000), 'hour');
    return rtf.format(Math.round(diff / 86_400_000), 'day');
  }

  function initials(name = 'INF') {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(item => item[0]).join('').toUpperCase();
  }

  async function api(path, options = {}) {
    const url = path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = new Headers(options.headers || {});
    if (token()) headers.set('Authorization', `Bearer ${token()}`);
    if (!(options.body instanceof FormData) && options.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    headers.set('X-Device-Id', getDeviceId());
    const response = await fetch(url, { ...options, headers });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) {
      if (response.status === 401 && !isPublic) {
        clearSession();
        location.replace('cadastro.html?motivo=sessao');
      }
      const error = new Error(data?.erro || data?.message || `Erro ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  function getDeviceId() {
    let id = localStorage.getItem('inf25b_device_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('inf25b_device_id', id);
    }
    return id;
  }

  function applyTheme(theme = localStorage.getItem(THEME_KEY) || 'dark') {
    const chosen = theme === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme;
    document.documentElement.dataset.theme = chosen;
    localStorage.setItem(THEME_KEY, theme);
    const button = document.querySelector('[data-theme-toggle]');
    if (button) button.innerHTML = chosen === 'dark' ? icons.sun : icons.moon;
  }

  function toggleTheme() {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  }

  function showToast(message, type = 'success', duration = 3200) {
    let region = document.getElementById('toastRegion');
    if (!region) {
      region = document.createElement('div');
      region.id = 'toastRegion';
      region.className = 'toast-region';
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${type === 'error' ? icons.alert : icons.check}</span><span>${escapeHTML(message)}</span>`;
    region.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 220);
    }, duration);
  }

  function setLoading(element, loading, label = 'Carregando…') {
    if (!element) return;
    if (loading) {
      element.dataset.originalContent = element.innerHTML;
      element.disabled = true;
      element.innerHTML = `<span class="spinner"></span><span>${escapeHTML(label)}</span>`;
    } else {
      element.disabled = false;
      if (element.dataset.originalContent) element.innerHTML = element.dataset.originalContent;
    }
  }

  function renderShell(user) {
    const sidebar = document.getElementById('appSidebar');
    const topbar = document.getElementById('appTopbar');
    const mobile = document.getElementById('mobileNav');
    if (!sidebar || !topbar || !mobile) return;
    const adminNav = user.role === 'admin' ? [{ id: 'admin', label: 'Administração', href: 'adm.html', icon: 'admin' }] : [];
    const allNav = [...navItems, ...adminNav];
    const navHTML = allNav.map(item => `<a class="side-nav-link ${page === item.id ? 'active' : ''}" href="${item.href}" ${page === item.id ? 'aria-current="page"' : ''}>${icons[item.icon]}<span>${item.label}</span></a>`).join('');
    sidebar.innerHTML = `
      <a class="brand" href="telaInicial.html" aria-label="INF 25B — Início">
        <span class="brand-mark"><img src="../assets/logo.png" alt=""></span>
        <span><strong>INF 25B</strong><small>Plataforma da turma</small></span>
      </a>
      <nav class="side-nav" aria-label="Navegação principal">${navHTML}</nav>
      <div class="sidebar-status"><span class="status-dot"></span><div><strong id="connectionLabel">Conectado</strong><small>2º ano • 2026</small></div></div>`;

    const title = document.body.dataset.title || 'INF 25B';
    const subtitle = document.body.dataset.subtitle || 'Organização oficial da turma';
    topbar.innerHTML = `
      <div class="topbar-copy"><button class="icon-button mobile-menu-button" type="button" data-mobile-menu aria-label="Abrir menu">${icons.menu}</button><div><h1>${escapeHTML(title)}</h1><p>${escapeHTML(subtitle)}</p></div></div>
      <div class="topbar-actions">
        <button class="icon-button" type="button" data-command aria-label="Pesquisar e navegar">${icons.search}</button>
        <button class="icon-button" type="button" data-notifications aria-label="Ativar notificações">${icons.bell}</button>
        <button class="icon-button" type="button" data-theme-toggle aria-label="Alternar tema">${icons.sun}</button>
        <a class="profile-button" href="perfil.html" aria-label="Abrir perfil"><span class="avatar" data-avatar>${user.fotoPerfil ? `<img src="${escapeHTML(user.fotoPerfil)}" alt="">` : escapeHTML(initials(user.nome))}</span><span><strong>${escapeHTML(user.nome.split(' ')[0])}</strong><small>${user.role === 'admin' ? 'Administrador' : 'Aluno'}</small></span></a>
      </div>`;

    const mobileItems = [allNav[0], allNav[1], allNav.find(item => item.id === 'conversa'), allNav.find(item => item.id === 'lazer')].filter(Boolean);
    mobile.innerHTML = mobileItems.map(item => `<a class="mobile-nav-link ${page === item.id ? 'active' : ''}" href="${item.href}">${icons[item.icon]}<span>${item.label.split(' ')[0]}</span></a>`).join('') + `<button class="mobile-nav-link ${['importantes', 'sugestoes', 'perfil', 'admin'].includes(page) ? 'active' : ''}" type="button" data-mobile-menu>${icons.more}<span>Mais</span></button>`;

    document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', toggleTheme));
    document.querySelectorAll('[data-mobile-menu]').forEach(button => button.addEventListener('click', () => document.body.classList.toggle('sidebar-open')));
    document.querySelector('[data-command]')?.addEventListener('click', openCommandPalette);
    document.querySelector('[data-notifications]')?.addEventListener('click', enableNotifications);
    sidebar.addEventListener('click', event => { if (event.target.closest('a')) document.body.classList.remove('sidebar-open'); });
    applyTheme();
  }

  function openCommandPalette() {
    const existing = document.getElementById('commandPalette');
    if (existing) return existing.querySelector('input')?.focus();
    const user = currentUser();
    const links = [...navItems, ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Administração', href: 'adm.html', icon: 'admin' }] : [])];
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay command-overlay';
    overlay.id = 'commandPalette';
    overlay.innerHTML = `<div class="command-panel" role="dialog" aria-modal="true" aria-label="Pesquisar na plataforma"><div class="command-search">${icons.search}<input type="search" placeholder="Digite uma página ou função…" autofocus><button class="icon-button" data-close>${icons.x}</button></div><div class="command-results">${links.map(item => `<a href="${item.href}" data-label="${escapeHTML(item.label.toLowerCase())}">${icons[item.icon]}<span>${escapeHTML(item.label)}</span>${icons.chevron}</a>`).join('')}</div></div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.addEventListener('click', event => { if (event.target === overlay || event.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', function esc(event) { if (event.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    const input = overlay.querySelector('input');
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      overlay.querySelectorAll('.command-results a').forEach(link => link.hidden = !link.dataset.label.includes(query));
    });
    setTimeout(() => input.focus(), 0);
  }

  async function enableNotifications() {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return showToast('Este navegador não oferece notificações push.', 'error');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return showToast('Notificações não foram autorizadas.', 'error');
      const registration = await navigator.serviceWorker.ready;
      const { chave, disponivel } = await api('/push/chave-publica');
      if (!disponivel || !chave) return showToast('O servidor de notificações ainda não foi configurado.', 'error');
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(chave) });
      await api('/push/inscrever', { method: 'POST', body: JSON.stringify({ subscription }) });
      showToast('Notificações ativadas. Sem sustos, só prazos.');
    } catch (error) {
      showToast(error.message || 'Não foi possível ativar notificações.', 'error');
    }
  }

  function urlBase64ToUint8Array(value) {
    const padding = '='.repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
  }

  function logout() {
    clearSession();
    location.replace('cadastro.html');
  }

  function updateConnection() {
    document.body.classList.toggle('is-offline', !navigator.onLine);
    const label = document.getElementById('connectionLabel');
    if (label) label.textContent = navigator.onLine ? 'Conectado' : 'Sem conexão';
  }

  async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try { await navigator.serviceWorker.register('../sw.js', { scope: '../' }); } catch (error) { console.warn('Service worker:', error); }
    }
  }

  function emptyState(title, text, icon = 'book') {
    return `<div class="empty-state">${icons[icon] || icons.book}<strong>${escapeHTML(title)}</strong><p>${escapeHTML(text)}</p></div>`;
  }

  function skeleton(count = 3) {
    return `<div class="skeleton-list">${Array.from({ length: count }, () => '<div class="skeleton-card"><span></span><span></span><span></span></div>').join('')}</div>`;
  }

  const readyPromise = (async () => {
    applyTheme();
    updateConnection();
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    registerServiceWorker();

    if (isPublic) return null;
    const session = readSession();
    if (!session?.token || !session?.usuario) {
      location.replace('cadastro.html');
      return null;
    }
    renderShell(session.usuario);
    try {
      const fresh = await api('/auth/me');
      setSession({ token: session.token, usuario: fresh.usuario });
      renderShell(fresh.usuario);
    } catch (error) {
      console.warn(error);
    }
    setInterval(() => api('/auth/heartbeat', { method: 'POST' }).catch(() => {}), 4 * 60_000);
    return currentUser();
  })();

  window.INF25B = {
    API_URL, icons, api, ready: callback => readyPromise.then(callback), readSession, setSession, clearSession,
    currentUser, escapeHTML, safeUrl, formatDate, formatDateTime, relativeDate, initials, showToast, setLoading,
    logout, enableNotifications, emptyState, skeleton, applyTheme
  };
})();

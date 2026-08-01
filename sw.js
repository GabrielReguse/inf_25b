const CACHE_NAME = 'inf25b-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './html/cadastro.html',
  './html/telaInicial.html',
  './html/tarefasProvas.html',
  './html/importantes.html',
  './html/lazer.html',
  './html/sugestoes.html',
  './html/conversa.html',
  './html/perfil.html',
  './html/adm.html',
  './css/app.css',
  './css/auth.css',
  './css/chat.css',
  './js/app.js',
  './js/auth.js',
  './js/dashboard.js',
  './js/academico.js',
  './js/importantes.js',
  './js/lazer.js',
  './js/sugestoes.js',
  './js/chat.js',
  './js/perfil.js',
  './js/admin.js',
  './assets/logo.png',
  './assets/icon.png',
  './assets/app.png',
  './assets/app-192.png',
  './assets/app-512.png',
  './assets/app-maskable-192.png',
  './assets/app-maskable-512.png',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      }).catch(async () => (await caches.match(request)) || caches.match('./html/telaInicial.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    }))
  );
});

self.addEventListener('push', event => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); }
  catch { data = { titulo: 'INF 25B', corpo: event.data.text(), url: './html/telaInicial.html' }; }
  event.waitUntil(self.registration.showNotification(data.titulo || 'INF 25B', {
    body: data.corpo || '',
    icon: './assets/app-192.png',
    badge: './assets/app-192.png',
    tag: data.tag || 'inf25b-update',
    renotify: Boolean(data.renotify),
    data: { url: data.url || './html/telaInicial.html' },
    actions: [{ action: 'abrir', title: 'Abrir' }, { action: 'fechar', title: 'Fechar' }]
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'fechar') return;
  const target = new URL(event.notification.data?.url || './html/telaInicial.html', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
    for (const client of clients) {
      if (client.url.startsWith(self.location.origin)) {
        await client.focus();
        return client.navigate(target);
      }
    }
    return self.clients.openWindow(target);
  }));
});

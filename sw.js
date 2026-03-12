// sw.js — Service Worker de notificações push

self.addEventListener("push", event => {
  if (!event.data) return;

  let dados;
  try {
    dados = event.data.json();
  } catch {
    dados = { titulo: "Inf 25B", corpo: event.data.text(), url: "/html/telaInicial.html" };
  }

  const opcoes = {
    body: dados.corpo || "",
    icon: "../assets/app.png",
    badge: "../assets/app.png",
    vibrate: [200, 100, 200],
    data: { url: dados.url || "/html/telaInicial.html" },
    actions: [
      { action: "abrir", title: "Abrir" },
      { action: "fechar", title: "Fechar" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(dados.titulo || "Inf 25B", opcoes)
  );
});

// clique na notificação — abre a página certa
self.addEventListener("notificationclick", event => {
  event.notification.close();

  if (event.action === "fechar") return;

  const url = event.notification.data?.url || "/html/telaInicial.html";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(lista => {
      // se já tem uma aba aberta, foca nela
      for (const client of lista) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // senão abre nova aba
      return clients.openWindow(url);
    })
  );
});
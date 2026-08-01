# INF 25B — Frontend 2.0

Interface estática responsiva da plataforma oficial da turma. A versão 2.0 substitui os estilos e scripts fragmentados por um sistema visual compartilhado e uma camada única de sessão/API.

## Áreas

- Acesso e cadastro com sessão autenticada.
- Dashboard com avisos, agenda, calendário e participação.
- Provas, tarefas, feriados e materiais por matéria.
- Documentos, horários e contatos importantes.
- Eventos, presença, Instagram, camisa e enquetes.
- Sugestões com voto, status e resposta da liderança.
- Perfil, tema e notificações opt-in.
- Conversa geral e mensagens diretas.
- Administração de conteúdo, usuários e logs.

## Execução local

```bash
npm run check
npm run serve
```

Abra `http://localhost:5500`. Em ambiente local, a interface usa `http://localhost:2025` como API. Na tela de acesso há uma configuração de URL para desenvolvimento.

## Publicação

O projeto pode ser hospedado como site estático na Vercel. O arquivo `vercel.json` já inclui cabeçalhos de segurança e CSP. Caso a URL pública do backend mude, atualize simultaneamente:

1. o fallback `API_URL` em `js/app.js`;
2. `connect-src` em `vercel.json`;
3. `FRONTEND_URLS` no backend.

## PWA

O service worker mantém o shell da aplicação disponível offline. Notificações somente são solicitadas após ação explícita do usuário. Os ícones comuns e maskable estão em `assets/`.

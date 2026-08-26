<p align="center">
  <img src="./.github/readme-cover.svg" width="100%" alt="INF 25B — plataforma da turma" />
</p>

<p align="center">
  <a href="#o-que-tem-aqui">Features</a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#rodando-localmente">Local setup</a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#pwa">PWA</a>
</p>

<br>

## Por que isso existe

O **INF 25B** começou como um lugar simples para centralizar tarefas e avisos da turma. Conforme novos problemas apareceram, o projeto cresceu junto.

Hoje ele funciona como uma camada digital para a rotina da classe: organiza informação, reduz a quantidade de coisa espalhada em grupos e mensagens e concentra funções que antes não conversavam entre si.

<br>

## O que tem aqui

<table>
<tr>
<td width="50%" valign="top">

### Rotina

Dashboard, avisos, agenda, calendário, provas, tarefas, feriados e materiais por matéria.

</td>
<td width="50%" valign="top">

### Comunicação

Conversa geral, mensagens diretas, eventos, sugestões e respostas da liderança.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Pessoas

Perfil, presença, participação, contatos e preferências individuais de tema e notificações.

</td>
<td width="50%" valign="top">

### Administração

Gestão de conteúdo, usuários e logs sem precisar editar diretamente os arquivos da interface.

</td>
</tr>
</table>

<br>

## Como foi montado

A interface é estática e responsiva, mas não funciona como um conjunto de páginas isoladas. A versão atual centraliza sessão, chamadas de API e padrões visuais para manter o comportamento consistente entre as telas.

`HTML` · `CSS` · `JavaScript` · `REST API` · `Service Worker` · `Vercel`

<br>

## Rodando localmente

```bash
npm run check
npm run serve
```

Depois, abra:

```text
http://localhost:5500
```

Em desenvolvimento, o front usa `http://localhost:2025` como API por padrão. A própria tela de acesso também permite configurar outra URL para testes.

<br>

## Publicação

O frontend pode ser hospedado como site estático na **Vercel**. O `vercel.json` já mantém cabeçalhos de segurança e a política de conteúdo usada pelo projeto.

Se a URL pública da API mudar, os pontos de integração precisam continuar alinhados entre o fallback do frontend, a CSP e a configuração permitida pelo backend.

<br>

## PWA

O projeto inclui manifest e service worker. O shell principal pode permanecer disponível offline e as notificações só são solicitadas depois de uma ação explícita do usuário.

Os ícones comuns e maskable ficam em [`assets/`](./assets).

<br>

## Contexto

Este não é um produto genérico de demonstração: ele foi construído em volta de uma turma real e foi crescendo conforme surgiam necessidades reais de organização e comunicação.

É justamente essa parte que mais me interessa no projeto — usar design e desenvolvimento para resolver atrito cotidiano, em vez de inventar funcionalidades só para preencher uma tela.

---

<p align="center">
  <b>Built for the class that actually uses it.</b><br>
  <sub>Gabriel Reguse · INF 25B</sub>
</p>
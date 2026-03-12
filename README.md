<div align="center">

<!--  ╔══════════════════════════════════════════════════════╗  -->
<!--  ║              ANIMATED HEADER BANNER                 ║  -->
<!--  ╚══════════════════════════════════════════════════════╝  -->

<img src="https://capsule-render.vercel.app/api?type=waving&color=7C3AED,A78BFA&height=200&section=header&text=INF%2025B&fontSize=72&fontAlign=50&fontAlignY=38&fontColor=F9FAFB&desc=Plataforma%20Acadêmica%20do%20Futuro&descAlign=50&descAlignY=60&animation=fadeIn&fontFamily=Orbitron" width="100%"/>

<br/>

<!-- STATUS BADGES -->
<a href="#"><img src="https://img.shields.io/badge/STATUS-Em%20Desenvolvimento-7C3AED?style=for-the-badge&logo=statuspage&logoColor=white"/></a>
<a href="#"><img src="https://img.shields.io/badge/PWA-Nativo-A78BFA?style=for-the-badge&logo=pwa&logoColor=white"/></a>
<a href="#"><img src="https://img.shields.io/badge/Dark%20Mode-Nativo-C084FC?style=for-the-badge&logo=moonrepo&logoColor=white"/></a>
<a href="#"><img src="https://img.shields.io/badge/Design-Tecnológico-6D28D9?style=for-the-badge&logo=figma&logoColor=white"/></a>

<br/><br/>

<!-- TECH STACK -->
<img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white"/>
<img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white"/>
<img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white"/>
<img src="https://img.shields.io/badge/Cloudinary-3448C5?style=flat-square&logo=cloudinary&logoColor=white"/>
<img src="https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=black"/>
<img src="https://img.shields.io/badge/Vanilla%20JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black"/>
<img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white"/>

</div>

---

<div align="center">

```
╔━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╗
║                                                              ║
║   ██╗███╗   ██╗███████╗    ██████╗ ███████╗██████╗          ║
║   ██║████╗  ██║██╔════╝    ╚════██╗██╔════╝██╔══██╗         ║
║   ██║██╔██╗ ██║█████╗       █████╔╝███████╗██████╔╝         ║
║   ██║██║╚██╗██║██╔══╝      ██╔═══╝ ╚════██║██╔══██╗         ║
║   ██║██║ ╚████║██║         ███████╗███████║██████╔╝         ║
║   ╚═╝╚═╝  ╚═══╝╚═╝         ╚══════╝╚══════╝╚═════╝          ║
║                                                              ║
║         Plataforma acadêmica — Turma de Informática          ║
╚━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╝
```

</div>

<br/>

## ✦ Sobre o Projeto

> **INF 25B** é uma plataforma web progressiva (PWA) construída do zero para a turma de Informática. Um hub social e acadêmico completo, onde chat em tempo real, gestão de tarefas, provas, sugestões colaborativas e perfis de estudantes se unem em uma única experiência moderna, coesa e elegante.

A plataforma foi desenhada com **identidade tecnológica forte** — dark mode nativo, gradientes roxos, tipografia precisa e animações suaves que tornam cada interação fluida e memorável.

<br/>

---

## ✦ Módulos do Sistema

<div align="center">

| Módulo | Descrição | Status |
|:---:|:---|:---:|
| 💬 **Chat** | Mensagens em tempo real com replies, menções, agrupamento estilo WhatsApp e push notifications | ✅ Ativo |
| 📅 **Tarefas & Provas** | Calendário interativo com abreviações de matérias, feriados e modalidades de grupo | ✅ Ativo |
| 🗳️ **Sugestões** | Sistema de votação colaborativo com cards visuais, timers e modais de participantes | ✅ Ativo |
| 🎮 **Lazer** | Área de atividades recreativas com gerenciamento de encontros e votações | ✅ Ativo |
| 👤 **Perfil** | Página de perfil com upload via Cloudinary, toasts e loading states | ✅ Ativo |
| 🛡️ **Admin** | Painel de administração com deleção por long-press e gestão avançada | ✅ Ativo |

</div>

<br/>

---

## ✦ Design System

```css
/* ┌──────────────────────────────────────────┐
   │        PALETA OFICIAL — INF 25B          │
   └──────────────────────────────────────────┘ */

:root {
  /* Fundos */
  --bg-primary:    #0F0F1A;   /* Fundo principal        */
  --bg-secondary:  #1A1A2E;   /* Cards e containers     */
  --border-subtle: rgba(255, 255, 255, 0.05);

  /* Texto */
  --text-primary:   #F9FAFB;  /* Texto principal        */
  --text-secondary: #9CA3AF;  /* Texto auxiliar         */

  /* Roxo — Cor primária oficial */
  --purple-main:    #7C3AED;  /* Roxo principal         */
  --purple-light:   #A78BFA;  /* Hover e foco           */
  --purple-neon:    #C084FC;  /* Detalhes e glow        */

  /* Gradiente oficial */
  --gradient: linear-gradient(135deg, #7C3AED, #A78BFA);
}
```

<br/>

```css
/* ┌──────────────────────────────────────────┐
   │         TIPOGRAFIA — INF 25B             │
   └──────────────────────────────────────────┘ */

/* Títulos: Orbitron SemiBold — letter-spacing: 1px */
/* Interface: Inter 400 / 500 / 600                 */

h1 { font-size: 32px–36px; }   /* Orbitron */
h2 { font-size: 22px–24px; }   /* Orbitron */
h3 { font-size: 18px–20px; }   /* Orbitron */

p  { font-size: 14px–16px; }   /* Inter    */
.secondary { font-size: 13px; } /* Inter    */
```

<br/>

```js
/* ┌──────────────────────────────────────────┐
   │      ANIMAÇÕES GLOBAIS — INF 25B         │
   └──────────────────────────────────────────┘ */

const transitions = {
  pageEnter: {
    from:     'translateX(-24px) + opacity(0)',
    to:       'translateX(0)     + opacity(1)',
    duration: '300ms–400ms',
    easing:   'ease-in-out',
  },
  pageLeave: {
    to:       'translateX(24px)  + opacity(0)',
    duration: '≤ 300ms',
    easing:   'ease-in-out',
  },
  microInteraction: {
    buttonHover:  'scale(1.03) + brightness(1.1)',
    buttonClick:  'scale(0.97)',
    cardHover:    'translateY(-2px) + shadow(roxo sutil)',
    inputFocus:   'border: 2px solid var(--purple-main)',
    transition:   '0.2s ease',
  },
};
```

<br/>

---

## ✦ Arquitetura

```
inf-25b/
│
├── 📁 assets/
│   ├── background/
│   │   └── background.css      ← Wallpaper animado (bolhas roxas)
│   └── icons, images...
│
├── 📁 pages/
│   ├── conversa.html           ← Chat em tempo real
│   ├── tarefasProvas.html      ← Calendário acadêmico
│   ├── sugestoes.html          ← Sistema de sugestões
│   ├── lazer.html              ← Área de lazer
│   └── perfil.html             ← Perfil do usuário
│
├── 📁 scripts/
│   ├── global.js               ← DeviceID + Heartbeat (CRÍTICO)
│   ├── conversa.js             ← Lógica do chat
│   ├── tarefasProvas.js        ← Calendário e tarefas
│   ├── sugestoes.js            ← Votações e sugestões
│   ├── lazer.js                ← Módulo de lazer
│   ├── perfil.js               ← Perfil e upload
│   └── cadastro.js             ← Registro (IIFE isolado)
│
└── 📁 backend/                 ← Node.js + Express + MongoDB
    ├── routes/
    ├── models/
    └── server.js
```

<br/>

---

## ✦ Stack Técnica

<div align="center">

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│   Vanilla JS  ·  HTML5  ·  CSS3  ·  Web Push API  ·  PWA   │
│              sessionStorage + localStorage                  │
├─────────────────────────────────────────────────────────────┤
│                        BACKEND                              │
│          Node.js  ·  Express  ·  Mongoose  ·  MongoDB       │
│                   Render (Free Tier)                        │
├─────────────────────────────────────────────────────────────┤
│                       SERVIÇOS                              │
│        Cloudinary (imagens)  ·  Web Push (notificações)     │
└─────────────────────────────────────────────────────────────┘
```

</div>

<br/>

---

## ✦ Princípios de Desenvolvimento

```
◈  Scope Isolation      →  IIFEs para evitar colisões entre scripts
◈  Backward Compat      →  Fallback para formatos legados de dados
◈  Populated Objects    →  Atenção a shapes de objetos Mongoose
◈  Timeout Handling     →  Wrappers explícitos para o free tier do Render
◈  Mobile PWA           →  localStorage como fallback ao sessionStorage
◈  Mention Parsing      →  Set populado em inserção (regex não é suficiente)
◈  global.js é sagrado  →  Nunca sobrescrever deviceId ou heartbeat logic
```

<br/>

---

## ✦ Como Rodar

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/inf-25b.git
cd inf-25b

# Instale as dependências do backend
cd backend
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# → Preencha MONGO_URI, CLOUDINARY_*, VAPID_KEYS...

# Inicie o servidor
npm start

# O frontend é estático — abra index.html no navegador
# ou sirva com qualquer servidor HTTP simples
```

<br/>

---

## ✦ Variáveis de Ambiente

```env
# ─────────────────────────────────────
#   INF 25B — Configuração do Backend
# ─────────────────────────────────────

MONGO_URI=mongodb+srv://...
PORT=3000

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:...
```

<br/>

---

<div align="center">

```
╔━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╗
║                                                              ║
║   Feito com dedicação para a turma INF 25B  ◈  2025         ║
║   Tecnologia · Organização · Identidade                      ║
║                                                              ║
╚━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╝
```

<img src="https://capsule-render.vercel.app/api?type=waving&color=7C3AED,A78BFA&height=120&section=footer&animation=fadeIn" width="100%"/>

</div>

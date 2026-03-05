(() => {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');

  // paleta roxa
  const CORES = [
    'rgba(124, 58, 237,',
    'rgba(167, 139, 250,',
    'rgba(192, 132, 252,',
  ];

  const QTD_BASE = 72;
  const DIST_LINHA = 140;
  const VEL_MAX = 0.45;
  const RAIO_MIN = 1.2;
  const RAIO_MAX = 2.8;
  const PULSO_CHANCE = 0.003;

  let W, H, particulas;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    criarParticulas();
  }

  function aleatorio(min, max) {
    return Math.random() * (max - min) + min;
  }

  function criarParticulas() {
    const qtd = Math.floor((W * H) / 14000 * QTD_BASE / 72);
    particulas = Array.from({ length: Math.max(40, Math.min(qtd, 120)) }, () => ({
      x: aleatorio(0, W),
      y: aleatorio(0, H),
      vx: aleatorio(-VEL_MAX, VEL_MAX),
      vy: aleatorio(-VEL_MAX, VEL_MAX),
      r: aleatorio(RAIO_MIN, RAIO_MAX),
      cor: CORES[Math.floor(Math.random() * CORES.length)],
      alfa: aleatorio(0.3, 0.85),
      // pulso
      pulsando: false,
      pulsoR: 0,
      pulsoAlfa: 0,
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    // move
    for (const p of particulas) {
      p.x += p.vx;
      p.y += p.vy;

      // rebote nas bordas
      if (p.x < 0) { p.x = 0; p.vx *= -1; }
      if (p.x > W) { p.x = W; p.vx *= -1; }
      if (p.y < 0) { p.y = 0; p.vy *= -1; }
      if (p.y > H) { p.y = H; p.vy *= -1; }

      // dispara pulso aleatório
      if (!p.pulsando && Math.random() < PULSO_CHANCE) {
        p.pulsando = true;
        p.pulsoR = p.r;
        p.pulsoAlfa = 0.5;
      }

      // anima pulso
      if (p.pulsando) {
        p.pulsoR += 0.4;
        p.pulsoAlfa -= 0.018;
        if (p.pulsoAlfa <= 0) {
          p.pulsando = false;
          p.pulsoR = 0;
          p.pulsoAlfa = 0;
        }
      }
    }

    // linhas
    for (let i = 0; i < particulas.length; i++) {
      for (let j = i + 1; j < particulas.length; j++) {
        const a = particulas[i];
        const b = particulas[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < DIST_LINHA) {
          const alfa = (1 - dist / DIST_LINHA) * 0.25;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(167, 139, 250, ${alfa})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    // pontos + pulsos
    for (const p of particulas) {
      // anel de pulso
      if (p.pulsando) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.pulsoR, 0, Math.PI * 2);
        ctx.strokeStyle = `${p.cor}${p.pulsoAlfa})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // ponto
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `${p.cor}${p.alfa})`;
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  tick();
})();
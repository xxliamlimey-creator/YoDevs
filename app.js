/* ============================================================
   YoDevs — app.js
   Sprite-crop engine + Particle engine + Text rotator + Scroll animations
   ============================================================ */

// ─────────────────────────────────────────────────────────────
// 0. SPRITE CROP ENGINE
// Loads dev_avatars.png (3×3 grid) once, then draws each cell
// onto every <canvas class="sprite-crop"> in the page.
// ─────────────────────────────────────────────────────────────
(function initSpriteCrop() {
  const canvases = document.querySelectorAll('canvas.sprite-crop');
  if (!canvases.length) return;

  // Group by sprite src so we only load each image once
  const spriteMap = {};
  canvases.forEach(c => {
    const src = c.dataset.sprite;
    if (!spriteMap[src]) spriteMap[src] = [];
    spriteMap[src].push(c);
  });

  Object.entries(spriteMap).forEach(([src, list]) => {
    const img = new Image();
    img.onload = () => {
      const cols = 3, rows = 3;
      const cellW = img.naturalWidth  / cols;
      const cellH = img.naturalHeight / rows;

      list.forEach(canvas => {
        const col = parseInt(canvas.dataset.col, 10);
        const row = parseInt(canvas.dataset.row, 10);
        const ctx = canvas.getContext('2d');
        const size = canvas.width; // square output

        // Clip to circle first
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw just this cell from the sprite, scaled to fill canvas
        ctx.drawImage(
          img,
          col * cellW, row * cellH, cellW, cellH,  // source rect
          0, 0, size, size                           // destination
        );
        ctx.restore();
      });
    };
    img.src = src;
  });
})();



(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];

  const COLORS = [
    'rgba(88,101,242,',
    'rgba(168,85,247,',
    'rgba(6,182,212,',
    'rgba(245,158,11,',
    'rgba(114,137,255,',
  ];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x:   Math.random() * W,
      y:   Math.random() * H,
      r:   Math.random() * 2.5 + 0.5,
      vx:  (Math.random() - 0.5) * 0.4,
      vy:  (Math.random() - 0.5) * 0.4,
      a:   Math.random() * 0.5 + 0.1,
      da:  (Math.random() - 0.5) * 0.003,
      color,
    };
  }

  function init() {
    resize();
    particles = [];
    const count = Math.min(Math.floor((W * H) / 14000), 120);
    for (let i = 0; i < count; i++) particles.push(createParticle());
  }

  function drawConnections() {
    const maxDist = 130;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.12;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(114,137,255,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.da;
      if (p.a <= 0.05 || p.a >= 0.7) p.da *= -1;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.a + ')';
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => { resize(); });
  init();
  animate();
})();


// ─────────────────────────────────────────────────────────────
// 2. TEXT ROTATOR
// ─────────────────────────────────────────────────────────────
(function initRotator() {
  const slides = document.querySelectorAll('.text-slide');
  if (!slides.length) return;

  const DURATIONS = [2800, 2500, 2500, 3500]; // ms each slide stays
  let current = 0;
  let timer = null;

  function animateWords(slide) {
    const words = slide.querySelectorAll('.word');
    words.forEach(w => {
      w.style.opacity = '0';
      w.style.transform = 'translateY(30px) rotateY(-20deg)';
      w.style.animation = 'none';
    });
    // Force reflow
    void slide.offsetWidth;
    words.forEach(w => {
      w.style.animation = '';
    });
  }

  function goTo(index) {
    const prev = slides[current];
    const next = slides[index];

    prev.classList.add('exiting');
    prev.classList.remove('active');

    // After exit anim, clean up
    setTimeout(() => {
      prev.classList.remove('exiting');
    }, 600);

    current = index;
    next.classList.add('active');
    animateWords(next);

    timer = setTimeout(() => {
      const nextIndex = (current + 1) % slides.length;
      goTo(nextIndex);
    }, DURATIONS[current] || 2800);
  }

  // Kick off
  animateWords(slides[0]);
  timer = setTimeout(() => {
    goTo(1);
  }, DURATIONS[0]);
})();


// ─────────────────────────────────────────────────────────────
// 3. SCROLL REVEAL ANIMATIONS
// ─────────────────────────────────────────────────────────────
(function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.feature-card, .avatar-card, .final-title, .final-sub, .stats-row'
  );

  const style = document.createElement('style');
  style.textContent = `
    .reveal-hidden {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.2,0.64,1);
    }
    .reveal-hidden.revealed {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  targets.forEach((el, i) => {
    el.classList.add('reveal-hidden');
    el.style.transitionDelay = (i % 4) * 80 + 'ms';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  targets.forEach(el => observer.observe(el));
})();


// ─────────────────────────────────────────────────────────────
// 4. CURSOR GLOW EFFECT
// ─────────────────────────────────────────────────────────────
(function initCursorGlow() {
  const glow = document.createElement('div');
  glow.style.cssText = `
    position: fixed;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(88,101,242,0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
    transition: transform 0.1s ease;
    transform: translate(-50%, -50%);
    top: 0; left: 0;
  `;
  document.body.appendChild(glow);

  let mouseX = 0, mouseY = 0;
  let glowX = 0, glowY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    glowX += (mouseX - glowX) * 0.08;
    glowY += (mouseY - glowY) * 0.08;
    glow.style.left = glowX + 'px';
    glow.style.top  = glowY + 'px';
    requestAnimationFrame(animate);
  }
  animate();
})();


// ─────────────────────────────────────────────────────────────
// 5. BUTTON RIPPLE EFFECT
// ─────────────────────────────────────────────────────────────
(function initRipple() {
  document.querySelectorAll('.cta-btn, .nav-cta').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect   = this.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height) * 2;
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255,255,255,0.25);
        transform: translate(-50%, -50%) scale(0);
        left: ${e.clientX - rect.left}px;
        top:  ${e.clientY - rect.top}px;
        animation: rippleOut 0.6s ease forwards;
        pointer-events: none;
        z-index: 10;
      `;
      this.style.position = 'relative';
      this.style.overflow  = 'hidden';
      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    @keyframes rippleOut {
      to { transform: translate(-50%, -50%) scale(1); opacity: 0; }
    }
  `;
  document.head.appendChild(rippleStyle);
})();


// ─────────────────────────────────────────────────────────────
// 6. FLOATING SPARKLES ON HERO
// ─────────────────────────────────────────────────────────────
(function initSparkles() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  function createSparkle() {
    const sp = document.createElement('div');
    const size = Math.random() * 6 + 2;
    const colors = ['#5865F2','#a855f7','#06b6d4','#f59e0b','#7289ff'];
    const color  = colors[Math.floor(Math.random() * colors.length)];
    sp.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      box-shadow: 0 0 ${size * 2}px ${color};
      left: ${Math.random() * 100}%;
      top:  ${Math.random() * 100}%;
      pointer-events: none;
      z-index: 0;
      animation: sparkleFade ${Math.random() * 2 + 1.5}s ease-in-out forwards;
    `;
    hero.appendChild(sp);
    sp.addEventListener('animationend', () => sp.remove());
  }

  const sparkleStyle = document.createElement('style');
  sparkleStyle.textContent = `
    @keyframes sparkleFade {
      0%   { opacity: 0; transform: scale(0) translateY(0); }
      40%  { opacity: 1; transform: scale(1) translateY(-10px); }
      100% { opacity: 0; transform: scale(0.5) translateY(-30px); }
    }
  `;
  document.head.appendChild(sparkleStyle);

  setInterval(createSparkle, 200);
})();

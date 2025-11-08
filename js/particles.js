class ParticleSystem {
  constructor(container) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'particle-layer';
    this.ctx = this.canvas.getContext('2d');
    this.container = container;
    this.container.appendChild(this.canvas);
    this.particles = [];
    this.motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.lastUpdate = performance.now();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    window.addEventListener('audio:beat', (ev) => this.spawn(ev.detail.intensity));
    window.addEventListener('audio:energy', (ev) => this.setBackground(ev.detail.energy));
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (ev) => {
      this.motionReduced = ev.matches;
    });
    this.resize();
    this.loop();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  spawn(intensity = 100) {
    if (this.motionReduced) return;
    const count = Math.min(6, Math.ceil(intensity / 50));
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width / (window.devicePixelRatio || 1),
        y: this.canvas.height / (window.devicePixelRatio || 1) + Math.random() * 40,
        size: 12 + Math.random() * 18,
        speedY: 40 + Math.random() * 60,
        opacity: 1,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  setBackground(energy) {
    const normalized = Math.min(1, energy / 220);
    document.body.style.setProperty('--bg-gradient-1', `rgba(90, 61, 235, ${0.2 + normalized * 0.6})`);
    document.body.style.setProperty('--bg-gradient-2', `rgba(40, 174, 255, ${0.2 + normalized * 0.6})`);
    document.body.style.setProperty('--bg-gradient-3', `rgba(255, 120, 196, ${0.2 + normalized * 0.5})`);
    document.querySelector('.player-card')?.style.setProperty('--float-x', `${(Math.random() - 0.5) * normalized * 30}px`);
    document.querySelector('.player-card')?.style.setProperty('--float-y', `${(Math.random() - 0.5) * normalized * 30}px`);
  }

  loop() {
    const now = performance.now();
    const delta = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;
    this.draw(delta);
    if (!this.motionReduced) {
      requestAnimationFrame(() => this.loop());
    } else {
      setTimeout(() => this.loop(), 120);
    }
  }

  draw(delta) {
    const ctx = this.ctx;
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    this.particles = this.particles.filter((p) => p.opacity > 0);
    ctx.fillStyle = '#ff96d5';
    ctx.save();
    for (const particle of this.particles) {
      particle.y -= particle.speedY * delta;
      particle.opacity -= delta * 0.6;
      particle.wobble += delta * 4;
      const x = particle.x + Math.sin(particle.wobble) * 12;
      if (particle.y < -40) {
        particle.opacity = 0;
      }
      ctx.globalAlpha = Math.max(0, particle.opacity);
      this.drawHeart(ctx, x, particle.y, particle.size);
    }
    ctx.restore();
  }

  drawHeart(ctx, x, y, size) {
    ctx.beginPath();
    const topY = y - size * 0.3;
    ctx.moveTo(x, topY);
    ctx.bezierCurveTo(x + size, topY - size * 0.8, x + size * 1.1, topY + size * 0.8, x, topY + size);
    ctx.bezierCurveTo(x - size * 1.1, topY + size * 0.8, x - size, topY - size * 0.8, x, topY);
    ctx.closePath();
    ctx.fill();
  }
}

export default ParticleSystem;

class ConfettiBurst {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'confetti-layer';
    this.ctx = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);
    this.pieces = [];
    this.duration = 2800;
    this.active = false;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  launch(intensity = 1) {
    this.active = true;
    this.startTime = performance.now();
    this.pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + Math.random() * 120,
      size: 6 + Math.random() * 10,
      speed: 120 + Math.random() * 180,
      angle: Math.random() * Math.PI,
      rotation: Math.random() * Math.PI,
      hue: Math.floor(200 + Math.random() * 120),
      drift: (Math.random() - 0.5) * 180
    }));
    this.render();
  }

  render() {
    if (!this.active) return;
    const now = performance.now();
    const elapsed = now - this.startTime;
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.ctx.clearRect(0, 0, width, height);

    if (elapsed > this.duration) {
      this.active = false;
      return;
    }

    for (const piece of this.pieces) {
      piece.y -= piece.speed * 0.016;
      piece.x += Math.sin(piece.angle) * 2;
      piece.angle += 0.02;
      piece.rotation += 0.05;
      const alpha = 1 - elapsed / this.duration;
      this.ctx.fillStyle = `hsla(${piece.hue}, 90%, 65%, ${alpha})`;
      this.ctx.save();
      this.ctx.translate(piece.x, piece.y);
      this.ctx.rotate(piece.rotation);
      this.ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.6);
      this.ctx.restore();
    }

    requestAnimationFrame(() => this.render());
  }
}

const confetti = new ConfettiBurst();

export const launchConfetti = () => {
  confetti.launch();
};

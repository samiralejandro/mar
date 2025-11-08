class Visualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.energy = 0;
    this.spectrum = new Uint8Array(0);
    this.motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.addEventListener('audio:energy', (ev) => {
      this.energy = ev.detail.energy;
      this.spectrum = ev.detail.spectrum;
      if (!this.motionReduced) {
        this.draw();
      }
    });
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (ev) => {
      this.motionReduced = ev.matches;
    });
    this.draw();
  }

  resize() {
    const { width, height } = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  draw() {
    if (!this.ctx) return;
    this.resize();
    const { width, height } = this.canvas;
    const dpr = window.devicePixelRatio || 1;
    const drawWidth = width / dpr;
    const drawHeight = height / dpr;

    this.ctx.clearRect(0, 0, drawWidth, drawHeight);
    const gradient = this.ctx.createLinearGradient(0, drawHeight, drawWidth, 0);
    const accentLevel = Math.min(1, this.energy / 180);
    gradient.addColorStop(0, `rgba(156, 140, 255, ${0.2 + accentLevel * 0.5})`);
    gradient.addColorStop(1, `rgba(255, 150, 213, ${0.15 + accentLevel * 0.4})`);
    this.ctx.fillStyle = gradient;

    const barCount = Math.min(120, this.spectrum.length);
    const step = Math.floor(this.spectrum.length / barCount) || 1;
    const barWidth = drawWidth / barCount;

    for (let i = 0; i < barCount; i++) {
      const value = this.spectrum[i * step] / 255;
      const barHeight = value * drawHeight * 0.9;
      const x = i * barWidth;
      const y = drawHeight - barHeight;
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, barWidth * 0.8, barHeight, 8);
      this.ctx.fill();
    }

    if (!this.motionReduced) {
      requestAnimationFrame(() => this.draw());
    }
  }
}

export default Visualizer;

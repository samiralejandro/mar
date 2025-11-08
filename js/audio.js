import { TRACKS } from '../config/music.js';

const createEvent = (name, detail = {}) => new CustomEvent(name, { detail });

class AudioManager {
  constructor() {
    this.tracks = TRACKS;
    this.index = 0;
    this.audioEl = new Audio();
    this.audioEl.crossOrigin = 'anonymous';
    this.audioEl.preload = 'auto';
    this.audioEl.addEventListener('ended', () => this.next());
    this.audioEl.addEventListener('timeupdate', () => this.emitTick());
    this.audioEl.addEventListener('loadedmetadata', () => this.emitMeta());
    this.audioEl.addEventListener('play', () => this.emitState(true));
    this.audioEl.addEventListener('pause', () => this.emitState(false));
    document.body.appendChild(this.audioEl);

    this.ctx = null;
    this.source = null;
    this.analyser = null;
    this.gainNode = null;
    this.lowpass = null;
    this.energyHistory = [];
    this.lastBeat = 0;
    this.motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.initTrack(0);
  }

  async ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      this.lowpass = this.ctx.createBiquadFilter();
      this.lowpass.type = 'lowpass';
      this.lowpass.frequency.value = 180;
      this.lowpass.Q.value = 0.707;

      this.source = this.ctx.createMediaElementSource(this.audioEl);
      this.source.connect(this.lowpass);
      this.lowpass.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      this.source.connect(this.analyser);

      this.startAnalysis();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  initTrack(i) {
    this.index = (i + this.tracks.length) % this.tracks.length;
    const track = this.tracks[this.index];
    this.audioEl.src = track.src;
    this.emitMeta();
    window.dispatchEvent(createEvent('audio:track', { track, index: this.index }));
  }

  async play() {
    await this.ensureContext();
    return this.audioEl.play().catch(() => {});
  }

  pause() {
    this.audioEl.pause();
  }

  toggle() {
    if (this.audioEl.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  next() {
    this.initTrack(this.index + 1);
    this.play();
  }

  prev() {
    this.initTrack(this.index - 1);
    this.play();
  }

  seek(percent) {
    if (isNaN(this.audioEl.duration)) return;
    this.audioEl.currentTime = this.audioEl.duration * percent;
    this.emitTick();
  }

  setVolume(value) {
    if (this.gainNode) {
      this.gainNode.gain.value = value;
    }
    this.audioEl.volume = value;
  }

  toggleMute() {
    this.audioEl.muted = !this.audioEl.muted;
    window.dispatchEvent(createEvent('audio:mute', { muted: this.audioEl.muted }));
  }

  async loadCustomTrack(name, arrayBuffer, type = 'audio/mpeg') {
    await this.ensureContext();
    try {
      await this.ctx.decodeAudioData(arrayBuffer.slice(0));
    } catch (error) {
      console.warn('No se pudo decodificar el audio personalizado', error);
    }
    const blobUrl = URL.createObjectURL(new Blob([arrayBuffer], { type }));
    const track = { title: name, src: blobUrl, cover: this.tracks[this.index]?.cover || 'img/placeholder.svg', custom: true };
    const base = TRACKS.filter((item) => !item.custom);
    this.tracks = [track, ...base];
    this.initTrack(0);
    await this.play();
  }

  emitTick() {
    if (!isFinite(this.audioEl.duration)) return;
    window.dispatchEvent(
      createEvent('audio:tick', {
        currentTime: this.audioEl.currentTime,
        duration: this.audioEl.duration
      })
    );
  }

  emitMeta() {
    const track = this.tracks[this.index];
    window.dispatchEvent(
      createEvent('audio:meta', {
        duration: this.audioEl.duration || 0,
        track
      })
    );
  }

  emitState(isPlaying) {
    window.dispatchEvent(createEvent('audio:state', { isPlaying }));
  }

  startAnalysis() {
    if (!this.analyser) return;
    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    const timeData = new Uint8Array(this.analyser.frequencyBinCount);
    const sample = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(freqData);
      this.analyser.getByteTimeDomainData(timeData);

      const energy = freqData.reduce((acc, val) => acc + val, 0) / freqData.length;
      const lowBand = freqData.slice(0, 32);
      const lowEnergy = lowBand.reduce((acc, val) => acc + val, 0) / lowBand.length;

      window.dispatchEvent(createEvent('audio:energy', { energy, spectrum: freqData }));

      this.detectBeat(lowEnergy);

      if (!this.motionReduced) {
        window.requestAnimationFrame(sample);
      } else {
        setTimeout(sample, 100);
      }
    };
    sample();
  }

  detectBeat(lowEnergy) {
    const now = performance.now();
    this.energyHistory.push(lowEnergy);
    if (this.energyHistory.length > 60) this.energyHistory.shift();
    const avg = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;
    const threshold = avg * 1.35 + 8;

    if (lowEnergy > threshold && now - this.lastBeat > 280) {
      this.lastBeat = now;
      window.dispatchEvent(createEvent('audio:beat', { intensity: lowEnergy }));
    }
  }
}

export const audioManager = new AudioManager();

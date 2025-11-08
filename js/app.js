import { IMAGES } from '../config/images.js';
import { audioManager } from './audio.js';
import Visualizer from './visualizer.js';
import ParticleSystem from './particles.js';
import { launchConfetti } from './confetti.js';

const ANSWERS = {
  q1: 'Tunja',
  q2: 'chiva',
  q3: 'en el cuarto de ella',
  q4: 'Cartagena',
  q5: 'Republick',
  q6: 'cumpleaños de Daniel',
  q7: 'toallitas húmedas',
  q8: 'salchicha',
  q9: 'elefante',
  q10: 'Ecuación de Dirac'
};

const QUESTIONS = [
  {
    id: 'q1',
    text: '¿Nuestro primer viaje?',
    options: ['Tunja', 'Bogotá', 'Villa de Leyva']
  },
  {
    id: 'q2',
    text: '¿Dónde fue nuestro primer beso?',
    options: ['casa de Daniel', 'chiva', 'mirador']
  },
  {
    id: 'q3',
    text: 'La primera vez que dije “te amo” fue…',
    options: ['en el cuarto de ella', 'en un concierto', 'en un mensaje de voz']
  },
  {
    id: 'q4',
    text: '¿Dónde tuvimos nuestra primera caída?',
    options: ['Cartagena', 'Barichara', 'Medellín']
  },
  {
    id: 'q5',
    text: '¿Dónde fue nuestra primera cita?',
    options: ['Republick', 'Museo del Oro', 'El parque']
  },
  {
    id: 'q6',
    text: 'Selecciona la opción que NO corresponde a nosotros.',
    options: ['aniversario en abril', 'cumpleaños de Daniel', 'viaje a Tunja']
  },
  {
    id: 'q7',
    text: 'Mi primera promesa cumplida fue…',
    options: ['rosas blancas', 'toallitas húmedas', 'nuestra playlist']
  },
  {
    id: 'q8',
    text: 'Nuestro futuro perro será…',
    options: ['salchicha', 'labrador', 'criollo adorable']
  },
  {
    id: 'q9',
    text: 'Animal de nuestra primera pintura juntos',
    options: ['elefante', 'jirafa', 'tortuga']
  },
  {
    id: 'q10',
    text: '¿Qué ecuación se desbloquea al final?',
    options: ['Ecuación de Dirac', 'Ecuación de Schrödinger', 'Ecuación de Maxwell']
  }
];

const selections = new Map();
const form = document.getElementById('quiz-form');
const progressBar = document.getElementById('quiz-progress');
const statusChips = document.getElementById('quiz-status');
const verifyBtn = document.getElementById('verify');
const resetBtn = document.getElementById('reset');
const secretSection = document.getElementById('secret');
const motionToggle = document.getElementById('motion-toggle');
const themeToggle = document.getElementById('theme-toggle');
const appShell = document.querySelector('.app-shell');
const seekRange = document.querySelector('.range');
const seekFill = document.getElementById('seek-fill');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const volumeInput = document.getElementById('volume');
const muteBtn = document.getElementById('mute');
const uploadBtn = document.getElementById('upload');
const uploader = document.getElementById('uploader');
const trackTitle = document.getElementById('track-title');
const trackCover = document.getElementById('track-cover');
const playerCard = document.querySelector('.player-card');

const visualizer = new Visualizer(document.getElementById('visualizer'));
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
motionToggle.checked = prefersReduced;
if (prefersReduced) {
  document.documentElement.classList.add('reduced-motion');
  audioManager.motionReduced = true;
}
new ParticleSystem(playerCard);

class SFXPlayer {
  constructor() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.buffers = new Map();
    this.enabled = true;
    this.loadAll();
  }

  async loadAll() {
    const files = {
      correct: 'sfx/correct.mp3',
      wrong: 'sfx/wrong.mp3',
      unlock: 'sfx/unlock.mp3'
    };
    for (const [key, url] of Object.entries(files)) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await this.context.decodeAudioData(arrayBuffer);
        this.buffers.set(key, buffer);
      } catch (error) {
        console.warn('No se pudo cargar el sonido', url, error);
      }
    }
  }

  play(name) {
    if (!this.enabled || !this.buffers.has(name)) return;
    const source = this.context.createBufferSource();
    source.buffer = this.buffers.get(name);
    const gain = this.context.createGain();
    gain.gain.value = 0.9;
    source.connect(gain).connect(this.context.destination);
    source.start(0);
  }
}

const sfx = new SFXPlayer();

function renderQuiz() {
  const fragment = document.createDocumentFragment();
  QUESTIONS.forEach((question, index) => {
    const card = document.createElement('article');
    card.className = 'quiz-card';
    card.dataset.question = question.id;

    const image = document.createElement('img');
    image.src = IMAGES[question.id] || 'img/placeholder.svg';
    image.alt = `Imagen relacionada con ${question.text}`;
    card.appendChild(image);

    const title = document.createElement('h3');
    title.textContent = `${index + 1}. ${question.text}`;
    card.appendChild(title);

    const optionsWrapper = document.createElement('div');
    optionsWrapper.className = 'quiz-options';

    question.options.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'opt';
      button.dataset.value = option;
      button.innerHTML = `<span>${option}</span>`;
      button.addEventListener('click', () => handleSelection(question.id, option, button));
      optionsWrapper.appendChild(button);
    });

    card.appendChild(optionsWrapper);
    fragment.appendChild(card);
  });
  form.appendChild(fragment);
}

function handleSelection(questionId, value, button) {
  const options = button.parentElement.querySelectorAll('.opt');
  options.forEach((opt) => opt.classList.remove('selected', 'correct', 'wrong'));
  button.classList.add('selected');
  selections.set(questionId, value);
  updateProgress();
}

function updateProgress() {
  const answered = selections.size;
  const correct = Array.from(selections.entries()).filter(([key, value]) => ANSWERS[key] === value).length;
  const percent = (answered / QUESTIONS.length) * 100;
  progressBar.style.width = `${percent}%`;
  statusChips.innerHTML = '';

  const makeChip = (text) => {
    const span = document.createElement('span');
    span.className = 'chip';
    span.textContent = text;
    return span;
  };

  statusChips.append(makeChip(`${answered}/10 respondidas`));
  statusChips.append(makeChip(`${correct} correctas`));
}

function clearWarnings() {
  statusChips.querySelectorAll('.chip.warning').forEach((chip) => chip.remove());
}

function verifyAnswers() {
  if (selections.size < QUESTIONS.length) {
    clearWarnings();
    statusChips.appendChild(makeWarningChip('Responde todas antes de verificar.'));
    return;
  }
  let allCorrect = true;
  document.querySelectorAll('.quiz-card').forEach((card) => {
    const qid = card.dataset.question;
    const userAnswer = selections.get(qid);
    const correctAnswer = ANSWERS[qid];
    card.querySelectorAll('.opt').forEach((opt) => {
      opt.classList.remove('correct', 'wrong');
      if (opt.dataset.value === correctAnswer) {
        opt.classList.add('correct');
      }
      if (opt.dataset.value === userAnswer && userAnswer !== correctAnswer) {
        opt.classList.add('wrong');
      }
    });
    if (userAnswer !== correctAnswer) {
      allCorrect = false;
    }
  });
  if (allCorrect) {
    sfx.play('correct');
    revealSecret();
  } else {
    sfx.play('wrong');
  }
  updateProgress();
}

function makeWarningChip(text) {
  const chip = document.createElement('span');
  chip.className = 'chip warning';
  chip.textContent = text;
  chip.style.background = 'rgba(255, 111, 145, 0.2)';
  chip.style.color = '#ffdfec';
  return chip;
}

function resetQuiz() {
  selections.clear();
  document.querySelectorAll('.opt').forEach((opt) => {
    opt.classList.remove('selected', 'correct', 'wrong');
  });
  updateProgress();
  secretSection.hidden = true;
}

function revealSecret() {
  if (!secretSection.hidden) return;
  secretSection.hidden = false;
  secretSection.classList.add('revealed');
  launchConfetti();
  sfx.play('unlock');
}

function formatTime(time) {
  if (!isFinite(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateSeek(current, duration) {
  const percent = duration ? (current / duration) * 100 : 0;
  seekFill.style.width = `${percent}%`;
  seekRange.setAttribute('aria-valuenow', percent.toFixed(0));
  currentTimeEl.textContent = formatTime(current);
  durationEl.textContent = formatTime(duration);
}

function setupSeek() {
  let dragging = false;
  const rectPercent = (clientX) => {
    const rect = seekRange.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return percent;
  };

  const updateFromEvent = (event) => {
    const percent = rectPercent(event.clientX);
    seekFill.style.width = `${percent * 100}%`;
    seekRange.setAttribute('aria-valuenow', (percent * 100).toFixed(0));
    if (dragging) {
      audioManager.seek(percent);
    }
  };

  seekRange.addEventListener('pointerdown', (event) => {
    dragging = true;
    seekRange.setPointerCapture(event.pointerId);
    updateFromEvent(event);
  });

  seekRange.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    updateFromEvent(event);
  });

  seekRange.addEventListener('pointerup', (event) => {
    if (!dragging) return;
    updateFromEvent(event);
    dragging = false;
    seekRange.releasePointerCapture(event.pointerId);
  });

  seekRange.addEventListener('keydown', (event) => {
    const { key } = event;
    if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) {
      event.preventDefault();
      const current = parseFloat(seekRange.getAttribute('aria-valuenow')) || 0;
      let next = current;
      if (key === 'ArrowRight') next = Math.min(100, current + 5);
      if (key === 'ArrowLeft') next = Math.max(0, current - 5);
      if (key === 'Home') next = 0;
      if (key === 'End') next = 100;
      seekFill.style.width = `${next}%`;
      seekRange.setAttribute('aria-valuenow', next.toFixed(0));
      audioManager.seek(next / 100);
    }
  });
}

function setupUpload() {
  uploadBtn.addEventListener('click', () => uploader.click());
  uploader.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  });

  const highlight = (state) => playerCard.classList.toggle('dragging', state);

  ['dragenter', 'dragover'].forEach((type) => {
    playerCard.addEventListener(type, (event) => {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
      highlight(true);
    });
  });

  ['dragleave', 'drop'].forEach((type) => {
    playerCard.addEventListener(type, (event) => {
      event.preventDefault();
      highlight(false);
    });
  });

  playerCard.addEventListener('drop', async (event) => {
    event.preventDefault();
    highlight(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      await handleFile(file);
    }
  });
}

async function handleFile(file) {
  if (!file || (file.type && !file.type.includes('audio'))) {
    clearWarnings();
    statusChips.appendChild(makeWarningChip('El archivo debe ser MP3.'));
    return;
  }
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file);
    await audioManager.loadCustomTrack(file.name, arrayBuffer, file.type || 'audio/mpeg');
    updateTrackInfo(audioManager.tracks[audioManager.index]);
  } catch (error) {
    console.error('Error al cargar el MP3 personalizado', error);
    clearWarnings();
    statusChips.appendChild(makeWarningChip('No se pudo cargar el MP3.'));
  }
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function bindPlayerControls() {
  playBtn.addEventListener('click', () => audioManager.toggle());
  prevBtn.addEventListener('click', () => audioManager.prev());
  nextBtn.addEventListener('click', () => audioManager.next());
  volumeInput.addEventListener('input', (event) => audioManager.setVolume(Number(event.target.value)));
  muteBtn.addEventListener('click', () => {
    audioManager.toggleMute();
    muteBtn.setAttribute('aria-pressed', audioManager.audioEl.muted);
    muteBtn.textContent = audioManager.audioEl.muted ? 'Unmute' : 'Mute';
  });
  window.addEventListener('audio:state', (ev) => {
    playBtn.textContent = ev.detail.isPlaying ? '⏸' : '▶️';
    playBtn.setAttribute('aria-label', ev.detail.isPlaying ? 'Pausar' : 'Reproducir');
  });

  window.addEventListener('audio:tick', (ev) => {
    updateSeek(ev.detail.currentTime, ev.detail.duration);
  });

  window.addEventListener('audio:meta', (ev) => {
    updateSeek(0, ev.detail.duration);
    updateTrackInfo(ev.detail.track);
  });

  window.addEventListener('audio:track', (ev) => {
    updateTrackInfo(ev.detail.track);
  });
}

function updateTrackInfo(track) {
  trackTitle.textContent = track.title;
  trackCover.src = track.cover || 'img/placeholder.svg';
}

function setupThemeToggle() {
  themeToggle.addEventListener('click', () => {
    const current = appShell.getAttribute('data-theme');
    const next = current === 'dark' ? 'dim' : 'dark';
    appShell.setAttribute('data-theme', next);
    themeToggle.textContent = `Tema: ${next === 'dark' ? 'Dark' : 'Dim'}`;
  });
}

function setupMotionToggle() {
  motionToggle.addEventListener('change', (event) => {
    const reduce = event.target.checked;
    document.documentElement.classList.toggle('reduced-motion', reduce);
    audioManager.motionReduced = reduce;
  });
}

verifyBtn.addEventListener('click', () => verifyAnswers());
resetBtn.addEventListener('click', () => resetQuiz());

renderQuiz();
updateProgress();
setupSeek();
setupUpload();
bindPlayerControls();
setupThemeToggle();
setupMotionToggle();

// Primer click en la página: habilita contexto de audio y empieza a reproducir
window.addEventListener('click', async () => {
  await audioManager.ensureContext();
  if (sfx.context.state === 'suspended') {
    await sfx.context.resume();
  }
  // Intenta reproducir la pista por defecto tras la primera interacción.
  try { await audioManager.play(); } catch (_) {}
}, { once: true });

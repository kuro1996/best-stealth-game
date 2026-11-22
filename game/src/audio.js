// LUMEN THIEF — procedural sound, no audio files.
// Everything is a WebAudio oscillator or filtered noise burst, built on
// first user gesture (browsers block audio before one). Mute with M.
// If audio is unavailable the game plays on silently.

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ambientNodes = null;
  }

  // Call from any keydown / click. Safe to call repeatedly.
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const Ctx = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.startAmbient();
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ctx) this.ctx.suspend().catch(() => {});
    if (this.ctx && !this.muted) this.ctx.resume().catch(() => {});
    return this.muted;
  }

  // A low, slow drone under the whole museum — two detuned sines.
  startAmbient() {
    if (!this.ctx || this.ambientNodes) return;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.035;
    gain.connect(this.ctx.destination);
    const oscA = this.ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.value = 55;
    const oscB = this.ctx.createOscillator();
    oscB.type = 'sine';
    oscB.frequency.value = 55.7;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    oscA.connect(gain);
    oscB.connect(gain);
    oscA.start();
    oscB.start();
    lfo.start();
    this.ambientNodes = { gain, oscA, oscB, lfo };
  }

  // One short tone: frequency slide, gain envelope, done.
  blip(freqFrom, freqTo, duration, type, volume) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freqFrom, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), t + duration);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    } catch {
      // Audio is decoration; never let it break the game.
    }
  }

  // A burst of filtered noise — footsteps and pebble ticks.
  noiseBurst(duration, filterFreq, volume) {
    if (!this.ctx || this.muted) return;
    try {
      const t = this.ctx.currentTime;
      const len = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;
      const gain = this.ctx.createGain();
      gain.gain.value = volume;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(t);
    } catch {
      // Audio is decoration; never let it break the game.
    }
  }

  footstep(running, sneaking) {
    if (sneaking) return; // sneaking is silent — that is the point
    this.noiseBurst(running ? 0.09 : 0.06, running ? 900 : 500, running ? 0.16 : 0.09);
  }

  pickup() {
    this.blip(660, 660, 0.09, 'sine', 0.18);
    setTimeout(() => this.blip(990, 990, 0.14, 'sine', 0.18), 90);
  }

  lampOut() {
    this.blip(320, 90, 0.5, 'sine', 0.14);
    this.noiseBurst(0.3, 300, 0.08);
  }

  alert() {
    this.blip(220, 440, 0.28, 'sawtooth', 0.16);
    setTimeout(() => this.blip(330, 660, 0.22, 'sawtooth', 0.12), 140);
  }

  pebbleTick() {
    this.noiseBurst(0.05, 2400, 0.14);
  }

  pulse() {
    this.blip(1200, 300, 0.5, 'sine', 0.12);
  }

  doorOpen() {
    this.blip(180, 540, 0.6, 'triangle', 0.16);
  }

  busted() {
    this.blip(440, 110, 0.7, 'sawtooth', 0.18);
  }

  levelClear() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.blip(f, f, 0.22, 'sine', 0.16), i * 120));
  }
}

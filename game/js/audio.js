// Synthesized sound only: short WebAudio blips and noise, no audio files.
// Everything is created on the first user gesture, so the game stays silent
// until the player starts it.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.lastStepAt = 0;
  }

  ensure() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, duration, type, volume, when = 0) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  noiseBurst(duration, volume, cutoff) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    source.start(t0);
  }

  footstep() {
    if (!this.ctx) return;
    const now = performance.now();
    if (now - this.lastStepAt < 260) return;
    this.lastStepAt = now;
    this.noiseBurst(0.05, 0.05, 900);
  }

  pickup() {
    this.tone(660, 0.12, 'sine', 0.12);
    this.tone(990, 0.16, 'sine', 0.1, 0.08);
  }

  suspicious() {
    this.tone(392, 0.18, 'triangle', 0.14);
  }

  alarm() {
    this.tone(220, 0.22, 'sawtooth', 0.16);
    this.tone(311, 0.22, 'sawtooth', 0.16, 0.18);
    this.tone(220, 0.3, 'sawtooth', 0.16, 0.36);
  }

  caught() {
    this.tone(110, 0.5, 'sawtooth', 0.2);
    this.noiseBurst(0.25, 0.18, 400);
  }

  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => this.tone(freq, 0.22, 'sine', 0.12, i * 0.12));
  }
}

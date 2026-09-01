class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private oceanGain: GainNode | null = null;
  private surgeGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;

  constructor() {
    // Lazy initialize AudioContext on user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAll();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playAlarm() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      
      // Siren pitch modulation
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.4);
      osc.frequency.linearRampToValueAtTime(440, now + 0.8);
      osc.frequency.linearRampToValueAtTime(880, now + 1.2);
      osc.frequency.linearRampToValueAtTime(440, now + 1.6);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.8);
    } catch {
      // Audio fallback
    }
  }

  public playWaveSurge(intensity: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      
      // Pink/Brown noise generator
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.95 * b1 + white * 0.1;
        b2 = 0.85 * b2 + white * 0.25;
        output[i] = (b0 + b1 + b2) * 0.5;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, now);
      filter.frequency.exponentialRampToValueAtTime(300 + intensity * 60, now + 1.5);
      filter.frequency.exponentialRampToValueAtTime(100, now + 3.0);

      const gain = this.ctx.createGain();
      const vol = Math.min(0.25, 0.05 + (intensity / 10) * 0.15);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(vol, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 3.0);
    } catch {
      // Audio fallback
    }
  }

  public playImpact(intensity: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

      const vol = Math.min(0.2, 0.03 + (intensity / 10) * 0.12);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Audio fallback
    }
  }

  public playShatter() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'highpass' as unknown as OscillatorType; // fallback sine
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Audio fallback
    }
  }

  public stopAll() {
    try {
      if (this.sirenOsc) {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
        this.sirenOsc = null;
      }
      if (this.noiseNode) {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
    } catch {
      // Ignore
    }
  }
}

export const soundManager = new SoundManager();

type ChimeKind = 'discovery' | 'unlock' | 'moon' | 'plant' | 'ui';

type AudioContextWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

class AudioService {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambient: GainNode | null = null;
  private ambientSources: AudioScheduledSourceNode[] = [];
  private enabled = false;
  private reducedMotion = false;
  private chimeTimer: number | null = null;
  private suspendTimer: number | null = null;

  get isEnabled(): boolean {
    return this.enabled;
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  async enable(): Promise<void> {
    if (this.enabled) return;
    const context = this.ensureContext();
    if (!context) return;

    if (this.suspendTimer !== null) {
      window.clearTimeout(this.suspendTimer);
      this.suspendTimer = null;
    }

    try {
      await context.resume();
    } catch {
      return;
    }

    if (this.master) {
      this.master.gain.cancelScheduledValues(context.currentTime);
      this.master.gain.setTargetAtTime(0.52, context.currentTime, 0.8);
    }
    if (!this.ambient) this.createAmbience();
    this.enabled = true;
    this.scheduleAmbientChime();
  }

  disable(): void {
    this.enabled = false;
    if (this.chimeTimer !== null) {
      window.clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
    const context = this.context;
    const master = this.master;
    if (!context || !master) return;

    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setTargetAtTime(0.0001, context.currentTime, 0.3);
    if (this.suspendTimer !== null) window.clearTimeout(this.suspendTimer);
    this.suspendTimer = window.setTimeout(() => {
      if (!this.enabled) void this.context?.suspend().catch(() => undefined);
      this.suspendTimer = null;
    }, 900);
  }

  async setEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      await this.enable();
    } else {
      this.disable();
    }
  }

  chime(kind: ChimeKind = 'discovery'): void {
    if (!this.enabled || !this.context || !this.master) return;
    if (this.context.state !== 'running') return;

    const notes =
      kind === 'unlock'
        ? [392, 523.25, 659.25, 783.99]
        : kind === 'discovery'
          ? [523.25, 659.25, 783.99]
          : kind === 'moon'
            ? [783.99, 1046.5, 1318.51]
            : kind === 'plant'
              ? [659.25, 880]
              : [880];

    const spacing = kind === 'unlock' ? 0.13 : 0.1;
    notes.forEach((frequency, index) => {
      this.tone(frequency, this.context!.currentTime + index * spacing, 1.8, 0.028, 'sine');
    });
    if (kind === 'discovery' || kind === 'unlock') {
      this.tone(notes[0]! / 2, this.context.currentTime, 2.5, 0.016, 'triangle');
    }
  }

  purr(): void {
    if (!this.enabled || !this.context || !this.master) return;
    if (this.context.state !== 'running') return;

    const context = this.context;
    const now = context.currentTime;
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.9), context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.025 * white) / 1.025;
      data[i] = last * 2.4;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(190, now);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(now);
    source.stop(now + 1);
  }

  setPageVisible(visible: boolean): void {
    if (!this.context) return;
    if (!visible && this.enabled) {
      void this.context.suspend().catch(() => undefined);
    } else if (visible && this.enabled) {
      void this.context.resume().catch(() => undefined);
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    if (typeof window === 'undefined') return null;
    const AudioContextConstructor =
      window.AudioContext ?? (window as AudioContextWindow).webkitAudioContext;
    if (!AudioContextConstructor) return null;

    const context = new AudioContextConstructor();
    const master = context.createGain();
    master.gain.value = 0.0001;
    master.connect(context.destination);

    this.context = context;
    this.master = master;
    return context;
  }

  private createAmbience(): void {
    if (!this.context || !this.master || this.ambient) return;
    const context = this.context;
    const ambient = context.createGain();
    ambient.gain.value = 0.1;
    ambient.connect(this.master);
    this.ambient = ambient;

    const noiseBuffer = context.createBuffer(
      1,
      Math.floor(context.sampleRate * 6),
      context.sampleRate,
    );
    const channel = noiseBuffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < channel.length; i += 1) {
      const white = Math.random() * 2 - 1;
      brown = (brown + 0.014 * white) / 1.014;
      channel[i] = brown * 3.2;
    }

    const noise = context.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const windFilter = context.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 360;
    windFilter.Q.value = 0.35;

    const windGain = context.createGain();
    windGain.gain.value = 0.12;

    const lfo = context.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.045;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 0.06;
    lfo.connect(lfoGain).connect(windGain.gain);

    noise.connect(windFilter).connect(windGain).connect(ambient);
    noise.start();
    lfo.start();

    const humFrequencies = [98, 146.83];
    humFrequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      const gain = context.createGain();
      gain.gain.value = index === 0 ? 0.006 : 0.0035;
      oscillator.connect(gain).connect(ambient);
      oscillator.start();
      this.ambientSources.push(oscillator);
    });

    this.ambientSources.push(noise, lfo);
  }

  private tone(
    frequency: number,
    start: number,
    duration: number,
    volume: number,
    type: OscillatorType,
  ): void {
    if (!this.context || !this.master) return;
    const context = this.context;
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.997, start + duration);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain).connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  private scheduleAmbientChime(): void {
    if (!this.enabled) return;
    if (this.chimeTimer !== null) window.clearTimeout(this.chimeTimer);
    const delay = this.reducedMotion ? 42000 : 22000 + Math.random() * 16000;
    this.chimeTimer = window.setTimeout(() => {
      if (this.enabled && !document.hidden) {
        const notes = [783.99, 880, 987.77, 1174.66];
        const note = notes[Math.floor(Math.random() * notes.length)];
        if (note && this.context && this.master) {
          this.tone(note, this.context.currentTime, 3.4, 0.008, 'sine');
        }
      }
      this.scheduleAmbientChime();
    }, delay);
  }
}

export const audioService = new AudioService();

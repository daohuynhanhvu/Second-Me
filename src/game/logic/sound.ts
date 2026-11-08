/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { INTRO } from './introTimeline.ts';
import { loadSfxIndex, sfxFiles, sfxUrl, type SfxId } from './sfx.ts';
type IntroCues = typeof INTRO.cue;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private volume = 0.25;
  /** Voice-over has its own bus so it can be balanced against music and effects. */
  private voiceGain: GainNode | null = null;
  private voiceVolume = 1;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.voiceGain = this.ctx.createGain();
        this.voiceGain.gain.value = this.voiceVolume;
        this.voiceGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain && this.ctx) this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
  }

  public getVolume() { return this.volume; }

  public setVoiceVolume(value: number) {
    this.voiceVolume = Math.max(0, Math.min(1, value));
    if (this.voiceGain && this.ctx) this.voiceGain.gain.setValueAtTime(this.voiceVolume, this.ctx.currentTime);
  }

  public getVoiceVolume() { return this.voiceVolume; }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /** Bus for file effects (public/assets/sfx), under the master volume; created on first use. */
  private sfxGain: GainNode | null = null;
  /** Decoded buffers by URL, so a file effect can start in the same frame it is asked for. */
  private ready = new Map<string, AudioBuffer>();
  /** Effects mastered at full scale sit at this level, under voice and near the music. */
  private static readonly SFX_LEVEL = 0.7;

  /**
   * Plays a file from public/assets/sfx for this sound when there is one and it is decoded
   * (a random one of several, pitched ±4% so repeats do not sound identical). False means
   * "no file ready": the caller plays its synth version. A file not yet decoded starts loading
   * now and plays from the next time on.
   */
  private sample(id: SfxId): boolean {
    void loadSfxIndex();
    const list = sfxFiles(id);
    if (!list.length) return false;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return false;
    const url = sfxUrl(list[Math.floor(Math.random() * list.length)]);
    const buf = this.ready.get(url);
    if (!buf) { void this.loadBuffer(url); return false; }
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.playbackRate.value = 0.96 + Math.random() * 0.08;
    src.connect(this.sfxBus(this.ctx, this.masterGain)); src.start();
    return true;
  }

  private sfxBus(ctx: AudioContext, master: GainNode) {
    if (!this.sfxGain) {
      this.sfxGain = ctx.createGain(); this.sfxGain.gain.value = SoundEngine.SFX_LEVEL;
      this.sfxGain.connect(master);
    }
    return this.sfxGain;
  }

  /**
   * Limiter for the long cues: hot files (mastered near 0 dBFS, sustained for seconds) are held
   * under about -12 dBFS on the sfx bus, to spare players' ears and small speakers.
   */
  private cueLimiter: DynamicsCompressorNode | null = null;
  private cueBus(ctx: AudioContext, master: GainNode) {
    if (!this.cueLimiter) {
      const l = ctx.createDynamicsCompressor();
      l.threshold.value = -12; l.knee.value = 3; l.ratio.value = 20; l.attack.value = 0.003; l.release.value = 0.25;
      l.connect(this.sfxBus(ctx, master));
      this.cueLimiter = l;
    }
    return this.cueLimiter;
  }

  /**
   * A long, scripted effect file (the loading screen's portal transition): played once at its
   * own pitch and at `level` (0..1, under the sfx bus and its limiter), faded in over `fadeIn` s.
   * Returns a function that fades it out over `fadeS` s and stops it. Silent (a no-op handle)
   * when there is no file or it is not decoded yet; the loading screen decodes every sfx file
   * before the transition can start.
   */
  public playCue(id: SfxId, fadeIn = 0, level = 1): (fadeS?: number) => void {
    const none = () => {};
    void loadSfxIndex();
    const list = sfxFiles(id);
    if (this.isMuted || !list.length) return none;
    this.initCtx();
    const ctx = this.ctx, master = this.masterGain;
    if (!ctx || !master) return none;
    const url = sfxUrl(list[Math.floor(Math.random() * list.length)]);
    const buf = this.ready.get(url);
    if (!buf) { void this.loadBuffer(url); return none; }
    const src = ctx.createBufferSource(), env = ctx.createGain(), t = ctx.currentTime;
    src.buffer = buf;
    if (fadeIn > 0) { env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(level, t + fadeIn); }
    else env.gain.value = level;
    src.connect(env); env.connect(this.cueBus(ctx, master)); src.start(t);
    let stopped = false;
    src.onended = () => { stopped = true; src.disconnect(); env.disconnect(); };
    return (fadeS = 0.3) => {
      if (stopped) return;
      stopped = true;
      const now = ctx.currentTime;
      env.gain.cancelScheduledValues(now);
      env.gain.setValueAtTime(env.gain.value, now);
      env.gain.linearRampToValueAtTime(0, now + Math.max(0.02, fadeS));
      src.stop(now + Math.max(0.02, fadeS) + 0.05);
    };
  }

  /** Kael's combo swing (new: silent without a file). */
  public playSlash() { if (!this.isMuted) this.sample('slash'); }
  /** Aeris's combo cast (new: silent without a file). */
  public playSpell() { if (!this.isMuted) this.sample('spell'); }
  /** The fourth combo hit landing; without a file it keeps the old heavy thud. */
  public playFinisher() { if (!this.isMuted && !this.sample('finisher')) this.playPlateActivate(); }
  /** Dodge roll (new: silent without a file). */
  public playDodge() { if (!this.isMuted) this.sample('dodge'); }

  public playFootstep() {
    if (this.isMuted || this.sample('footstep')) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80 + Math.random() * 20, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.05);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  /** Short low impact for damage, bright metallic tone when a shield absorbs it. */
  public playImpact(blocked=false){
    if(this.isMuted)return;this.initCtx();if(!this.ctx||!this.masterGain)return;
    const t=this.ctx.currentTime,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();
    osc.type=blocked?'triangle':'sawtooth';osc.frequency.setValueAtTime(blocked?660:145,t);
    osc.frequency.exponentialRampToValueAtTime(blocked?220:42,t+.14);
    gain.gain.setValueAtTime(.13,t);gain.gain.exponentialRampToValueAtTime(.001,t+.17);
    osc.connect(gain);gain.connect(this.masterGain);osc.start(t);osc.stop(t+.18);
  }

  public playIceHit(broken: boolean) {
    if (this.isMuted || this.sample(broken ? 'break' : 'hit')) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    for (const frequency of broken ? [170, 510, 1230, 2310] : [310, 930, 1910]) {
      const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
      osc.type = 'triangle'; osc.frequency.setValueAtTime(frequency, t);
      osc.frequency.exponentialRampToValueAtTime(frequency * .32, t + .16);
      gain.gain.setValueAtTime(broken ? .12 : .065, t);
      gain.gain.exponentialRampToValueAtTime(.001, t + (broken ? .34 : .13));
      osc.connect(gain);gain.connect(this.masterGain);osc.start(t);osc.stop(t + .36);
    }
  }

  public playRecordStart() {
    if (this.isMuted || this.sample('recordStart')) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sawtooth';

    // Rising temporal warp pitch
    osc1.frequency.setValueAtTime(260, t);
    osc1.frequency.exponentialRampToValueAtTime(640, t + 0.2);

    osc2.frequency.setValueAtTime(520, t);
    osc2.frequency.exponentialRampToValueAtTime(1280, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.25);
    osc2.stop(t + 0.25);
  }

  public playRecordStop() {
    if (this.isMuted || this.sample('recordStop')) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  public playEchoSpawn() {
    if (this.isMuted || this.sample('echoSpawn')) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Harmonic temporal chime (cyan echo resonance)
    const freqs = [440, 554.37, 659.25, 880];
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + idx * 0.03);

      gain.gain.setValueAtTime(0.12 / (idx + 1), t + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t + idx * 0.03);
      osc.stop(t + 0.48);
    });
  }

  public playEchoDismiss() {
    if (this.isMuted || this.sample('echoDismiss')) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.2);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playPlateActivate() {
    if (this.isMuted || this.sample('plateOn')) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(640, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playPlateDeactivate() {
    if (this.isMuted || this.sample('plateOff')) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playDoorOpen() {
    if (this.isMuted || this.sample('doorOpen')) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    // Hydraulic hiss + tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(360, t + 0.25);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.32);
  }

  public playDoorClose() {
    if (this.isMuted || this.sample('doorClose')) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.2);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playVictory() {
    if (this.isMuted || this.sample('victory')) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.5]; // C major sci-fi fanfare

    chords.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);

      gain.gain.setValueAtTime(0.18, t + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8 + idx * 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t + idx * 0.1);
      osc.stop(t + 0.9 + idx * 0.1);
    });
  }

  private bufferCache = new Map<string, Promise<AudioBuffer | null>>();

  /** Shared audio graph for other players (voice-over). Null until audio exists. */
  public graph(): { ctx: AudioContext; master: GainNode; voice: GainNode } | null {
    this.initCtx();
    return this.ctx && this.masterGain && this.voiceGain ? { ctx: this.ctx, master: this.masterGain, voice: this.voiceGain } : null;
  }

  /**
   * Fetch + decode once per URL; failures resolve to null so callers can stay silent.
   * `onProgress(received, total)` reports download bytes when this call starts the fetch
   * (total is 0 if the server sends no length); a cached URL just resolves.
   */
  public loadBuffer(url: string, onProgress?: (received: number, total: number) => void): Promise<AudioBuffer | null> {
    let p = this.bufferCache.get(url);
    if (!p) {
      const g = this.graph();
      p = !g ? Promise.resolve(null) : fetch(url)
        .then(r => (r.ok ? readBody(r, onProgress) : Promise.reject(new Error(String(r.status)))))
        .then(b => g.ctx.decodeAudioData(b))
        .then(buf => { this.ready.set(url, buf); return buf; })
        .catch(() => null);
      this.bufferCache.set(url, p);
    }
    return p;
  }

  /** True when audio can actually play now (a user gesture has unlocked the context). */
  public isAudioRunning(): boolean {
    this.initCtx();
    return !!this.ctx && this.ctx.state === 'running';
  }

  /**
   * Synthesised score for the cinematic intro. `offset` is how many seconds of the
   * timeline have already played, so music can join late after a gesture unlocks audio.
   * Returns a function that fades the score out and tears it down.
   */
  public playIntroScore(offset: number, cue: IntroCues, total: number): () => void {
    this.initCtx();
    const ctx = this.ctx, master = this.masterGain;
    if (!ctx || !master) return () => {};
    const now = ctx.currentTime;
    const at = (t: number) => now + Math.max(0, t - offset); // timeline seconds -> context time
    const live = (t: number) => t >= offset;
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);
    const nodes: AudioScheduledSourceNode[] = [];
    const tone = (type: OscillatorType, f0: number, f1: number, t0: number, dur: number, peak: number, attack = 0.02, dest: AudioNode = bus) => {
      if (t0 + dur < offset) return;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      const s = at(t0), e = s + dur;
      osc.type = type;
      osc.frequency.setValueAtTime(f0, s);
      if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, e);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(peak, s + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, e);
      osc.connect(g); g.connect(dest);
      osc.start(s); osc.stop(e + 0.05);
      nodes.push(osc);
    };
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = (t0: number, dur: number, freq: number, q: number, peak: number, attack: number, type: BiquadFilterType = 'bandpass') => {
      if (t0 + dur < offset) return;
      const src = ctx.createBufferSource(), filt = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noiseBuf; src.loop = true;
      filt.type = type; filt.frequency.value = freq; filt.Q.value = q;
      const s = at(t0), e = s + dur;
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(peak, s + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, e);
      src.connect(filt); filt.connect(g); g.connect(bus);
      src.start(s); src.stop(e + 0.05);
      nodes.push(src);
    };

    // Low drone that swells in the awakening and breathes through the film.
    const droneLow = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 200;
    droneLow.gain.setValueAtTime(0.0001, now);
    const dg = (t: number, v: number) => droneLow.gain.linearRampToValueAtTime(v, at(t));
    dg(offset, offset < 4 ? 0.0001 : 0.2); dg(4, 0.2); dg(16, 0.16); dg(19.3, 0.34); dg(22.4, 0.18); dg(total, 0.0001);
    lp.connect(droneLow); droneLow.connect(bus);
    for (const [type, f] of [['sawtooth', 55], ['triangle', 82.41], ['sawtooth', 55.4]] as [OscillatorType, number][]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.connect(lp);
      o.start(now); o.stop(at(total) + 0.1); nodes.push(o);
    }
    // Wind through the forest.
    noise(0, 8, 700, 0.6, 0.05, 3.5);
    noise(7, 9, 500, 0.5, 0.04, 3);
    // Scene 2: slow minor pad (Am) as the maps drift by.
    [220, 261.63, 329.63, 440].forEach((f, i) => tone('sine', f, f, 4.2 + i * 0.25, 7, 0.05, 2.2));
    // Wizard summon: rising crystalline arpeggio. Kael: warm steel ring.
    if (live(cue.wizard - 0.2)) [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone('sine', f, f, cue.wizard + i * 0.09, 1.6, 0.09));
    tone('sine', 110, 220, cue.wizard - 0.3, 0.7, 0.14, 0.3);
    tone('triangle', 196, 196, cue.kael, 2.2, 0.1, 0.03);
    tone('triangle', 293.66, 293.66, cue.kael + 0.05, 2, 0.07, 0.03);
    noise(cue.kael - 0.05, 0.25, 4200, 2, 0.05, 0.01);
    // Boss awakening: riser from the silhouette to the roar, heartbeat pulses under its steps.
    tone('sawtooth', 90, 700, cue.silhouette, cue.roar - cue.silhouette, 0.07, 1.8);
    noise(cue.silhouette, cue.roar - cue.silhouette, 1800, 1, 0.07, 2.4);
    for (let i = 0; i < 4; i++) tone('sine', 60, 55, cue.silhouette + 0.2 + i * 0.5, 0.4, 0.2, 0.02);
    const boom = (t: number, peak: number) => { tone('sine', 140, 32, t, 1.2, peak, 0.005); noise(t, 0.6, 260, 0.7, peak * 0.7, 0.005, 'lowpass'); };
    boom(cue.roar, 0.5);
    // Combat showcase: Kael's slash lands, then the clash.
    boom(cue.impact, 0.32);
    boom(cue.clash, 0.38);
    noise(cue.clash, 0.5, 3000, 1.2, 0.08, 0.01);
    // Logo: a bell chord with long shimmer.
    [196, 293.66, 392, 587.33, 783.99, 1174.66].forEach((f, i) => tone('sine', f, f, cue.logo + i * 0.04, 5, i < 3 ? 0.13 : 0.06, 0.03));
    boom(cue.logo, 0.3);
    noise(cue.logo, 3, 5200, 2, 0.04, 0.8);

    return () => {
      const t = ctx.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0.0001, t + 0.5);
      window.setTimeout(() => {
        for (const n of nodes) { try { n.stop(); } catch { /* already stopped */ } }
        try { bus.disconnect(); } catch { /* ignore */ }
      }, 700);
    };
  }
}

/** Reads a response body, reporting bytes as they arrive. */
async function readBody(r: Response, onProgress?: (received: number, total: number) => void): Promise<ArrayBuffer> {
  if (!onProgress || !r.body) return r.arrayBuffer();
  const total = Number(r.headers.get('Content-Length')) || 0;
  const reader = r.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value); received += value.byteLength;
    onProgress(received, total);
  }
  const out = new Uint8Array(received);
  let at = 0;
  for (const c of chunks) { out.set(c, at); at += c.byteLength; }
  return out.buffer;
}

export const sounds = new SoundEngine();

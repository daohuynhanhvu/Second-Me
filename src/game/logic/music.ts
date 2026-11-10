import { sounds } from './sound.ts';

/**
 * Background music from public/assets/music. The FILE NAME decides where a track plays, so
 * adding music never needs code: drop an .mp3/.ogg in the folder and name it after its scene.
 *
 *   boss    name contains "boss" / "bos" / "trùm"                  boss fight
 *   intro   "intro" / "mở đầu" / "cinematic"                        cinematic intro (replaces the synth score)
 *   defeat  "thua" / "defeat" / "game over"                         defeat screen
 *   ending  "ending" / "kết thúc" / "chiến thắng" / "victory"       ending after the boss
 *   level   "level" / "màn" (màn chơi, trong màn, các màn) / "gameplay"  normal levels
 *   menu    "theme" / "menu" / "sảnh" / "lobby" / "chủ đề" / "main"  title, lobby, shop, characters
 *
 * Checked top to bottom, so "Nhạc trong màn đánh bos" is boss music. Without a level track the
 * levels are silent; without an ending track the ending plays the menu theme. The loading screen
 * is always silent, so the theme starts over on the screen after it. Several files for one
 * scene are picked at random each time the scene starts.
 * The folder listing comes from assets/music/index.json, which vite.config.ts serves live in dev
 * and writes at build time.
 */
export type MusicScene = 'menu' | 'level' | 'boss' | 'intro' | 'defeat' | 'ending';

const BASE = `${import.meta.env?.BASE_URL ?? "/"}assets/music`;
const RULES: [MusicScene, RegExp][] = [
  ['boss', /boss?|trum/],
  ['intro', /intro|mo dau|cinematic/],
  ['defeat', /thua|defeat|game ?over/],
  ['ending', /ending|ket thuc|chien thang|victory/],
  ['level', /level|\bman\b|gameplay/],   // "màn" as a word: "màn chơi", "trong màn", "ở các màn"
  ['menu', /theme|menu|sanh|lobby|chu de|main/],
];
const FALLBACK: Partial<Record<MusicScene, MusicScene>> = { ending: 'menu' };
const LEVEL = 0.55;   // music sits under effects and voice
const FADE = 1.2;
/*
 * The intro track is mastered loud (about -13 dBFS RMS) and the narration is not (about -21,
 * -18 after the intro's voice bus). At INTRO_LEVEL the music sits near -17.4 dBFS between
 * lines, as loud as the voice, so it carries the film; while a line plays it ducks 6 dB
 * (SPEECH_DUCK) to about -23.4, leaving the narrator ~5 dB on top.
 */
const INTRO_LEVEL = 0.6;
const SPEECH_DUCK = 0.5;

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

export function sceneOf(file: string): MusicScene | null {
  const name = plain(file.replace(/\.[^.]+$/, ''));
  return RULES.find(([, re]) => re.test(name))?.[0] ?? null;
}

class MusicDirector {
  private index: Promise<Partial<Record<MusicScene, string[]>>> | null = null;
  private tracks: Partial<Record<MusicScene, string[]>> | null = null;
  private bus: GainNode | null = null;
  private speechDuck: GainNode | null = null;
  private level = LEVEL;
  private current: { file: string; src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private scene: MusicScene | null | undefined = undefined;
  private ducked = false;
  private seq = 0;
  private retryAt=0;

  private load() {
    this.index ??= fetch(`${BASE}/index.json`).then(r => (r.ok ? r.json() : [])).catch(() => [])
      .then((files: string[]) => {
        const out: Partial<Record<MusicScene, string[]>> = {};
        for (const f of files) {
          const s = sceneOf(f);
          if (s) (out[s] ??= []).push(f);
          else if (import.meta.env?.DEV) console.info(`[music] "${f}" matches no scene name, ignored`);
        }
        this.tracks = out;
        return out;
      });
    return this.index;
  }

  /** True when a file exists for this scene (false until the folder listing has loaded). */
  has(scene: MusicScene) { return !!this.tracks?.[scene]?.length; }
  /** True once the folder listing is known (has() is then final). */
  loaded() { return this.tracks !== null; }
  preload() { void this.load(); }

  private ensureBus(g: NonNullable<ReturnType<typeof sounds.graph>>) {
    if (this.bus) return this.bus;
    this.bus = g.ctx.createGain(); this.bus.gain.value = this.level;
    this.speechDuck = g.ctx.createGain();
    this.bus.connect(this.speechDuck); this.speechDuck.connect(g.music);
    return this.bus;
  }
  private setLevel(level: number) {
    const g = sounds.graph();
    if (level === this.level || !g || !this.bus) { this.level = level; return; }
    this.level = level;
    this.bus.gain.setTargetAtTime(level * (this.ducked ? 0.4 : 1), g.ctx.currentTime, 0.2);
  }

  /**
   * The cinematic intro's own track, started at the film's current time (`clock`, seconds)
   * so music and picture stay together even if sound is enabled late. Not looped. Returns a
   * function that fades it out.
   */
  playIntro(clock: () => number): () => void {
    let stopped = false, mine: AudioBufferSourceNode | null = null;
    void (async () => {
      const list = (await this.load()).intro ?? [];
      if (!list.length || stopped) return;
      const file = list[Math.floor(Math.random() * list.length)];
      const buf = await sounds.loadBuffer(`${BASE}/${encodeURIComponent(file)}`);
      const g = sounds.graph();
      if (stopped || !buf || !g) return;
      const bus = this.ensureBus(g);
      this.stop();
      this.setLevel(INTRO_LEVEL);
      const offset = Math.min(Math.max(0, clock()), buf.duration - 0.05);
      const src = g.ctx.createBufferSource(), gain = g.ctx.createGain(), t = g.ctx.currentTime;
      src.buffer = buf;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(1, t + (offset > 0.3 ? 0.6 : 0.05));   // a late start fades in
      src.connect(gain); gain.connect(bus);
      src.start(t, offset);
      mine = src;
      this.current = { file, src, gain };
    })();
    return () => {
      stopped = true;
      if (mine && this.current?.src === mine) this.stop();
      const g = sounds.graph();
      if (g && this.speechDuck) {
        this.speechDuck.gain.cancelScheduledValues(g.ctx.currentTime);
        this.speechDuck.gain.setTargetAtTime(1, g.ctx.currentTime, 0.2);
      }
    };
  }

  /** Lowers the music while a voice line plays (audio-clock times, seconds). */
  duckForSpeech(start: number, end: number) {
    const g = sounds.graph();
    if (!g) return;
    this.ensureBus(g);
    const d = this.speechDuck!.gain;
    d.setTargetAtTime(SPEECH_DUCK, Math.max(g.ctx.currentTime, start - 0.15), 0.06);
    d.setTargetAtTime(1, end + 0.1, 0.25);
  }

  /** Idempotent: call every frame with the scene the game is in. `duck` lowers it (pause). */
  set(scene: MusicScene | null, duck = false) {
    const g = sounds.graph();
    const retry=scene!==null&&scene!=='intro'&&!this.current&&Date.now()>=this.retryAt;
    if (scene === this.scene && duck === this.ducked&&!retry) return;
    if (!g) return;
    const bus = this.ensureBus(g);
    if (duck !== this.ducked) {
      this.ducked = duck;
      bus.gain.setTargetAtTime(this.level * (duck ? 0.4 : 1), g.ctx.currentTime, 0.15);
    }
    if (scene !== this.scene||retry) { this.scene = scene;this.retryAt=Date.now()+3000; void this.switchTo(scene); }
  }

  private async switchTo(scene: MusicScene | null) {
    const token = ++this.seq;
    const tracks = await this.load();
    if (token !== this.seq) return;
    // The intro's track is started by the film itself (playIntro, in step with the picture);
    // the scene only silences whatever else was playing.
    if (scene === 'intro') {
      if (this.current && !(tracks.intro ?? []).includes(this.current.file)) this.stop();
      return;
    }
    this.setLevel(LEVEL);
    const list = scene ? (tracks[scene]?.length ? tracks[scene]! : tracks[FALLBACK[scene] as MusicScene] ?? []) : [];
    if (token !== this.seq) return;
    if (this.current && list.includes(this.current.file)) return; // same track keeps playing
    if (!list.length) { this.stop(); return; }
    const file = list[Math.floor(Math.random() * list.length)];
    const buf = await sounds.loadBuffer(`${BASE}/${encodeURIComponent(file)}`);
    const g = sounds.graph();
    if (token !== this.seq || !buf || !g || !this.bus) return;
    this.stop();
    const src = g.ctx.createBufferSource(), gain = g.ctx.createGain(), t = g.ctx.currentTime;
    src.buffer = buf; src.loop = true;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(1, t + FADE);
    src.connect(gain); gain.connect(this.bus);
    src.start(t);
    this.current = { file, src, gain };
    src.onended=()=>{gain.disconnect();if(this.current?.src===src)this.current=null;};
  }

  stop() {
    const c = this.current, g = sounds.graph();
    this.current = null;
    if (!c || !g) return;
    const t = g.ctx.currentTime;
    c.gain.gain.cancelScheduledValues(t);
    c.gain.gain.setValueAtTime(c.gain.gain.value, t);
    c.gain.gain.linearRampToValueAtTime(0.0001, t + FADE);
    try { c.src.stop(t + FADE + 0.05); } catch { /* already stopped */ }
    c.src.onended = () => c.gain.disconnect();
  }
}

export const music = new MusicDirector();
// Dev: inspect levels and ducking from the console (window.__music).
if (import.meta.env?.DEV && typeof window !== 'undefined') (window as unknown as { __music?: MusicDirector }).__music = music;

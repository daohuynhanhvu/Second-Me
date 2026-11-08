import { sounds } from './sound.ts';

/**
 * Background music from public/assets/music. The FILE NAME decides where a track plays, so
 * adding music never needs code: drop an .mp3/.ogg in the folder and name it after its scene.
 *
 *   boss    name contains "boss" / "bos" / "trùm"                  boss fight
 *   intro   "intro" / "mở đầu" / "cinematic"                        cinematic intro (replaces the synth score)
 *   defeat  "thua" / "defeat" / "game over"                         defeat screen
 *   ending  "ending" / "kết thúc" / "chiến thắng" / "victory"       ending after the boss
 *   level   "level" / "màn chơi" / "gameplay" / "trong màn"         normal levels
 *   menu    "theme" / "menu" / "sảnh" / "lobby" / "chủ đề" / "main"  title, lobby, shop, characters
 *
 * Checked top to bottom, so "Nhạc trong màn đánh bos" is boss music. Without a level track,
 * levels and the ending play the menu theme (continuing, not restarting). Several files for one
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
  ['level', /level|man choi|gameplay|trong man/],
  ['menu', /theme|menu|sanh|lobby|chu de|main/],
];
const FALLBACK: Partial<Record<MusicScene, MusicScene>> = { level: 'menu', ending: 'menu' };
const LEVEL = 0.55;   // music sits under effects and voice
const FADE = 1.2;

const plain = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

export function sceneOf(file: string): MusicScene | null {
  const name = plain(file.replace(/\.[^.]+$/, ''));
  return RULES.find(([, re]) => re.test(name))?.[0] ?? null;
}

class MusicDirector {
  private index: Promise<Partial<Record<MusicScene, string[]>>> | null = null;
  private tracks: Partial<Record<MusicScene, string[]>> | null = null;
  private bus: GainNode | null = null;
  private current: { file: string; src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private scene: MusicScene | null | undefined = undefined;
  private ducked = false;
  private seq = 0;

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

  /** Idempotent: call every frame with the scene the game is in. `duck` lowers it (pause). */
  set(scene: MusicScene | null, duck = false) {
    if (scene === this.scene && duck === this.ducked) return;
    const g = sounds.graph();
    if (!g) return;
    if (!this.bus) { this.bus = g.ctx.createGain(); this.bus.gain.value = LEVEL; this.bus.connect(g.master); }
    if (duck !== this.ducked) {
      this.ducked = duck;
      this.bus.gain.setTargetAtTime(LEVEL * (duck ? 0.4 : 1), g.ctx.currentTime, 0.15);
    }
    if (scene !== this.scene) { this.scene = scene; void this.switchTo(scene); }
  }

  private async switchTo(scene: MusicScene | null) {
    const token = ++this.seq;
    const tracks = await this.load();
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

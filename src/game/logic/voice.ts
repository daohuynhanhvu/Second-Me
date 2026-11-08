import { sounds } from './sound.ts';
import lines from '../data/voiceLines.json';
import cast from '../data/voiceCast.json';

/**
 * Voice-over player. Audio is pre-rendered offline with OmniVoice (tools/voice); the game
 * only plays files listed in public/assets/voice/manifest.json, so a missing manifest or
 * file simply means silence — gameplay never waits on it and nothing is synthesised live.
 */
export type VoiceRole = 'narrator' | 'aeris' | 'kael' | 'rivet' | 'guardian';
export type VoiceKind = 'intro' | 'dialogue' | 'idle' | 'combatStart' | 'attack' | 'skill' | 'ultimate' | 'damage'
  | 'lowHealth' | 'dodge' | 'kill' | 'event' | 'victory' | 'defeat';
type Lang = 'en' | 'vi';
interface ManifestEntry { file: string; kind: string; seconds: number }
type Manifest = Partial<Record<VoiceRole, Partial<Record<Lang, Record<string, ManifestEntry>>>>>;
interface LineText { id: string; en: string; vi: string; at?: number; until?: number }

const BASE = `${import.meta.env?.BASE_URL ?? "/"}assets/voice`;
const LINES = lines as unknown as Record<VoiceRole, Partial<Record<VoiceKind, LineText[]>>>;
const CAST = (cast as unknown as { characters?: Partial<Record<VoiceRole, { gain?: number }>> }).characters ?? {};

/**
 * Higher wins. A new line cuts a playing one only when it strictly outranks it, so basic
 * attack barks can never talk over a skill name, and nothing talks over an ultimate.
 */
const PRIORITY: Record<VoiceKind, number> = {
  attack: 0, idle: 0, dodge: 1, damage: 1, kill: 2, lowHealth: 2, combatStart: 2, dialogue: 2, intro: 2,
  skill: 3, event: 3, ultimate: 4, victory: 5, defeat: 5,
};
/** Default pacing so barks stay occasional rather than constant. */
const RULES: Record<VoiceKind, { chance: number; cooldown: number }> = {
  attack: { chance: 0.35, cooldown: 3.5 }, idle: { chance: 1, cooldown: 30 }, dodge: { chance: 0.6, cooldown: 3 },
  damage: { chance: 0.85, cooldown: 2.5 }, lowHealth: { chance: 1, cooldown: 12 }, kill: { chance: 1, cooldown: 1.5 },
  combatStart: { chance: 1, cooldown: 0 }, skill: { chance: 1, cooldown: 2.5 }, ultimate: { chance: 1, cooldown: 0 },
  event: { chance: 1, cooldown: 0 }, dialogue: { chance: 1, cooldown: 2 }, intro: { chance: 1, cooldown: 0 },
  victory: { chance: 1, cooldown: 0 }, defeat: { chance: 1, cooldown: 0 },
};

let manifest: Promise<Manifest> | null = null;
function loadManifest(): Promise<Manifest> {
  manifest ??= fetch(`${BASE}/manifest.json`).then(r => (r.ok ? r.json() : {})).catch(() => ({}));
  return manifest;
}

export function voiceText(role: VoiceRole, kind: VoiceKind): LineText[] { return LINES[role]?.[kind] ?? []; }

class VoiceDirector {
  private playing: { src: AudioBufferSourceNode; gain: GainNode; priority: number; ends: number } | null = null;
  private lastAt = new Map<string, number>();
  private lastLine = new Map<string, string>();
  public lang: Lang = 'en';

  /** Warm the decoder for a role so the first bark is not late. */
  async preload(role: VoiceRole) {
    const m = await loadManifest();
    this.manifestCache = m;
    for (const e of Object.values(m[role]?.[this.lang] ?? {})) void sounds.loadBuffer(`${BASE}/${role}/${this.lang}/${e.file}`);
  }

  /**
   * Speak one line of `kind` for `role` (a random variant, never the same one twice in a row).
   * Returns false when skipped by chance, cooldown, priority, mute or missing audio.
   */
  say(role: VoiceRole, kind: VoiceKind, opts: { id?: string; chance?: number; cooldown?: number; delay?: number; priority?: number; alignEnd?: number } = {}): boolean {
    if (sounds.getMuted()) return false;
    const rule = RULES[kind], key = `${role}:${kind}${opts.id ? `:${opts.id}` : ''}`, now = performance.now() / 1000;
    if (Math.random() > (opts.chance ?? rule.chance)) return false;
    if (now - (this.lastAt.get(key) ?? -1e9) < (opts.cooldown ?? rule.cooldown)) return false;
    const g = sounds.graph();
    if (!g || g.ctx.state !== 'running') return false;
    const priority = opts.priority ?? PRIORITY[kind];
    if (this.playing && g.ctx.currentTime < this.playing.ends && this.playing.priority >= priority && priority < 3) return false;
    this.lastAt.set(key, now);
    const lang = this.lang;
    void loadManifest().then(async m => {
      const entries = Object.entries(m[role]?.[lang] ?? {}).filter(([id, e]) => e.kind === kind && (!opts.id || id === opts.id));
      if (!entries.length) return;
      const choices = entries.length > 1 ? entries.filter(([id]) => id !== this.lastLine.get(key)) : entries;
      const [id, entry] = choices[Math.floor(Math.random() * choices.length)];
      this.lastLine.set(key, id);
      const buf = await sounds.loadBuffer(`${BASE}/${role}/${lang}/${entry.file}`);
      if (!buf || sounds.getMuted()) return;
      // alignEnd: finish the line exactly when an action lands (e.g. a boss wind-up ends).
      const start = g.ctx.currentTime + (opts.alignEnd !== undefined ? Math.max(0, opts.alignEnd - buf.duration) : (opts.delay ?? 0));
      if (this.playing && start < this.playing.ends) {
        if (this.playing.priority > priority) return; // something more important started meanwhile
        if (this.playing.priority === priority && start > g.ctx.currentTime + 0.05) return; // equal rank never cuts in later
        this.fadeOut(this.playing, 0.08, start); // duck the lower line exactly when this one begins
      }
      const src = g.ctx.createBufferSource(), gain = g.ctx.createGain();
      gain.gain.value = 1.35 * (CAST[role]?.gain ?? 1);
      src.buffer = buf; src.connect(gain); gain.connect(g.voice);
      src.start(start);
      if (import.meta.env?.DEV) ((window as unknown as { __voiceLog?: string[] }).__voiceLog ??= []).push(`${role}/${lang}/${id}`);
      const slot = { src, gain, priority, ends: start + buf.duration };
      this.playing = slot;
      src.onended = () => { gain.disconnect(); if (this.playing === slot) this.playing = null; };
    });
    return true;
  }

  private fadeOut(p: { src: AudioBufferSourceNode; gain: GainNode }, seconds: number, at?: number) {
    const g = sounds.graph(); if (!g) return;
    const t = Math.max(g.ctx.currentTime, at ?? 0);
    p.gain.gain.setValueAtTime(p.gain.gain.value, t);
    p.gain.gain.linearRampToValueAtTime(0.0001, t + seconds);
    try { p.src.stop(t + seconds + 0.02); } catch { /* already stopped */ }
  }

  /** Length (s) of a line from the loaded manifest, or null if not known yet. */
  lengthOf(role: VoiceRole, id: string): number | null { return this.manifestCache?.[role]?.[this.lang]?.[id]?.seconds ?? null; }
  private manifestCache: Manifest | null = null;

  stopAll() { if (this.playing) { this.fadeOut(this.playing, 0.15); this.playing = null; } }

  /**
   * Intro narration: schedules each timed line against the film clock `now()` (seconds).
   * Lines whose moment has passed are skipped, so starting late or skipping never doubles up.
   */
  playTimeline(entries: { role: VoiceRole; id: string; at: number }[], now: () => number,
    onLine?: (start: number, duration: number) => void): () => void {
    const g = sounds.graph();
    if (!g || sounds.getMuted()) return () => {};
    const bus = g.ctx.createGain();
    bus.gain.value = 1.35;
    bus.connect(g.voice);
    const sources: AudioBufferSourceNode[] = [];
    let stopped = false;
    const lang = this.lang;
    void loadManifest().then(m => {
      for (const { role, id, at } of entries) {
        const entry = m[role]?.[lang]?.[id];
        if (!entry) continue;
        void sounds.loadBuffer(`${BASE}/${role}/${lang}/${entry.file}`).then(buf => {
          if (!buf || stopped) return;
          const t = now();
          if (t > at + 0.25) return;
          const src = g.ctx.createBufferSource(), gain = g.ctx.createGain();
          gain.gain.value = CAST[role]?.gain ?? 1;
          src.buffer = buf; src.connect(gain); gain.connect(bus);
          const start = g.ctx.currentTime + Math.max(0, at - t);
          src.start(start);
          sources.push(src);
          onLine?.(start, buf.duration);
        });
      }
    });
    return () => {
      stopped = true;
      const t = g.ctx.currentTime;
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0.0001, t + 0.3);
      window.setTimeout(() => { for (const s of sources) { try { s.stop(); } catch { /* done */ } } try { bus.disconnect(); } catch { /* ignore */ } }, 400);
    };
  }
}

export const voice = new VoiceDirector();

/** Timed intro lines (narrator + character introductions) straight from voiceLines.json. */
export const INTRO_VOICE: { role: VoiceRole; id: string; at: number; until: number; en: string; vi: string }[] =
  (['narrator', 'aeris', 'kael'] as VoiceRole[]).flatMap(role =>
    voiceText(role, 'intro').filter(l => typeof l.at === 'number')
      .map(l => ({ role, id: l.id, at: l.at!, until: l.until ?? l.at! + 2.5, en: l.en, vi: l.vi })));

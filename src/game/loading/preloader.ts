/**
 * Real asset preloading for the loading screen.
 *
 * The task list comes from assets/index.json (every image and sound under public/assets with
 * its size; vite.config.ts serves it in dev and writes it at build). Progress is
 *   Σ weight_i · done_i / Σ weight_i
 * where weight is the file's byte size and done_i is real completion:
 *   images  0 → 1 when the browser has fetched AND decoded the image (img.decode()),
 *   sounds  0 → 0.9 as bytes arrive (streamed), → 1 once decoded into the game's own
 *           AudioBuffer cache (sounds.loadBuffer), so music and voice start instantly later,
 *   init    fonts ready, and every image drawn once (uploads textures before play),
 *           each weighted as a fixed share of the total, done when it actually finishes.
 * Nothing advances on a timer. A failed or timed-out file counts as finished (and is
 * listed in `failed`) so a missing asset can never stall the bar.
 *
 * Two kinds of load share this machinery:
 *   startPreload()          the first load into the lobby: every file in the index;
 *   startLevelPreload(spec) entering a level: only the files that level uses (scenery, the
 *                           chosen hero, the boss and its music, the hero's voice lines),
 *                           minus what an earlier load already finished, then the level's
 *                           images are drawn once again so their textures are on the GPU.
 */
import { sounds } from '../logic/sound.ts';
import { sceneOf } from '../logic/music.ts';
import type { CharacterClass } from '../logic/campaign.ts';

export type LoadStage = 'core' | 'environment' | 'characters' | 'audio' | 'init';
export const STAGES: LoadStage[] = ['core', 'environment', 'characters', 'audio', 'init'];

interface Task { stage: LoadStage; name: string; weight: number; done: number; run(report: (f: number) => void): Promise<void> }

export interface Preload {
  /** 0..1, from completed work only. */
  progress: number;
  done: boolean;
  /** Per stage: [finished tasks, total tasks]. */
  counts: Record<LoadStage, [number, number]>;
  /** The earliest stage with unfinished work (what the screen says it is doing). */
  stage: LoadStage;
  totalFiles: number;
  loadedFiles: number;
  failed: string[];
  startedAt: number;
  finishedAt: number | null;
  whenDone: Promise<void>;
}

const BASE = import.meta.env?.BASE_URL ?? '/';
const CONCURRENCY = 6;
const TIMEOUT_MS = 20000;
type FileEntry = { path: string; bytes: number };
/** Decoded images by path, kept so the browser keeps them ready for the game's own images. */
const decoded = new Map<string, HTMLImageElement>();
/** Sounds already decoded into the shared AudioBuffer cache. */
const decodedSounds = new Set<string>();
let current: Preload | null = null;
let index: Promise<FileEntry[]> | null = null;

function assetIndex(): Promise<FileEntry[]> {
  index ??= fetch(`${BASE}assets/index.json`, { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : []))
    .catch(() => [] as FileEntry[]);
  return index;
}

function stageOf(path: string): LoadStage {
  if (/\/(music|voice)\//.test(path)) return 'audio';
  if (/\/(blue-wizard|soldier|frost-guardian|mechanical|magic-effects)\//.test(path)) return 'characters';
  if (/\/(loading|menu)\//.test(path)) return 'core';
  return 'environment';
}

function withTimeout<T>(p: Promise<T>, name: string): Promise<T | void> {
  let timer = 0;
  return Promise.race([p, new Promise<void>((_, reject) => { timer = window.setTimeout(() => reject(new Error(`timeout: ${name}`)), TIMEOUT_MS); })])
    .finally(() => window.clearTimeout(timer));
}

function imageTask(path: string, bytes: number): Task {
  return {
    stage: stageOf(path), name: path, weight: Math.max(bytes, 1), done: 0,
    run: () => new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      const ready = () => { decoded.set(path, img); resolve(); };
      img.onload = () => { (img.decode ? img.decode() : Promise.resolve()).then(ready, ready); };
      img.onerror = () => reject(new Error(`image failed: ${path}`));
      img.src = BASE + path;
    }),
  };
}

function soundTask(path: string, bytes: number): Task {
  return {
    stage: 'audio', name: path, weight: Math.max(bytes, 1), done: 0,
    run: report => sounds.loadBuffer(BASE + path.split('/').map(encodeURIComponent).join('/'), (got, total) => report(0.9 * Math.min(1, got / (total || bytes || got))))
      .then(buf => { if (buf) decodedSounds.add(path); }),
  };
}

/** Draws each image once into a tiny canvas, a few per frame, so textures are uploaded before play. */
function warmTextures(images: () => HTMLImageElement[], report: (f: number) => void): Promise<void> {
  return new Promise(resolve => {
    const keep = images();
    if (typeof document === 'undefined' || !keep.length) return resolve();
    const c = document.createElement('canvas'); c.width = c.height = 2;
    const ctx = c.getContext('2d');
    let i = 0;
    const step = () => {
      const end = Math.min(keep.length, i + 6);
      for (; i < end; i++) ctx?.drawImage(keep[i], 0, 0, 2, 2);
      report(i / keep.length);
      if (i < keep.length) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}

/** Starts (once) and returns the shared first load; later calls get the same, possibly finished, one. */
export function startPreload(opts: { delayMs?: number } = {}): Preload {
  current ??= begin(async () => ({ files: await assetIndex(), warm: () => [...decoded.values()] }), opts.delayMs ?? 0);
  return current;
}

/** What entering a level needs. */
export interface LevelLoadSpec { levelId: number; character: CharacterClass; lang: 'en' | 'vi'; delayMs?: number }

const HERO_FOLDER: Record<CharacterClass, string> = { mage: 'blue-wizard', swordsman: 'soldier', mechanical: 'mechanical' };
const HERO_VOICE: Record<CharacterClass, string> = { mage: 'aeris', swordsman: 'kael', mechanical: 'rivet' };
const BOSS_LEVEL = 6;

/** True for files level `spec` uses: scenery, effects, the hero, and the boss level's extras. */
export function levelUses(path: string, spec: LevelLoadSpec): boolean {
  const boss = spec.levelId === BOSS_LEVEL;
  const m = /^assets\/([^/]+)\/(.*)$/.exec(path);
  if (!m) return false;
  const [, folder, rest] = m;
  if (folder === 'forest' || folder === 'nature' || folder === 'magic-effects') return true;
  if (folder === HERO_FOLDER[spec.character]) return true;
  if (folder === 'frost-guardian') return boss;
  if (folder === 'music') return sceneOf(rest.split('/').pop() ?? '') === (boss ? 'boss' : 'level');
  if (folder === 'voice') {
    const roles = boss ? [HERO_VOICE[spec.character], 'guardian'] : [HERO_VOICE[spec.character]];
    return roles.some(role => rest.startsWith(`${role}/${spec.lang}/`));
  }
  return false;   // the menu and loading art are not needed in a level
}

/** Starts a load for entering a level. Each call is a new load; finished files are skipped. */
export function startLevelPreload(spec: LevelLoadSpec): Preload {
  return begin(async () => {
    const used = (await assetIndex()).filter(f => levelUses(f.path, spec));
    return {
      files: used.filter(f => !decoded.has(f.path) && !decodedSounds.has(f.path)),
      warm: () => used.map(f => decoded.get(f.path)).filter((i): i is HTMLImageElement => !!i),
    };
  }, spec.delayMs ?? 0);
}

type Plan = () => Promise<{ files: FileEntry[]; warm: () => HTMLImageElement[] }>;

function begin(plan: Plan, delayMs: number): Preload {
  let resolveDone!: () => void;
  const state: Preload = {
    progress: 0, done: false, stage: 'core', totalFiles: 0, loadedFiles: 0, failed: [],
    counts: { core: [0, 0], environment: [0, 0], characters: [0, 0], audio: [0, 0], init: [0, 0] },
    startedAt: performance.now(), finishedAt: null,
    whenDone: new Promise<void>(r => { resolveDone = r; }),
  };
  void run(state, plan, delayMs).then(() => {
    state.progress = 1; state.done = true; state.finishedAt = performance.now();
    resolveDone();
  });
  return state;
}

async function run(state: Preload, plan: Plan, delayMs: number) {
  // The asset list itself (tiny) comes first. Progress stays 0 until the list is known, so
  // the total never grows later and the bar can only move forward. No list: init still runs.
  const { files, warm } = await plan();

  const tasks: Task[] = files.map(f => (/\.(mp3|ogg|wav|m4a)$/i.test(f.path) ? soundTask(f.path, f.bytes) : imageTask(f.path, f.bytes)));
  const fileBytes = tasks.reduce((s, t) => s + t.weight, 0) || 1;
  const share = Math.max(1, Math.round(fileBytes * 0.03));
  tasks.push(
    { stage: 'init', name: 'fonts', weight: share, done: 0, run: () => (document.fonts?.ready ?? Promise.resolve()).then(() => undefined) },
    { stage: 'init', name: 'textures', weight: share, done: 0, run: report => warmTextures(warm, report) },
  );
  // Stage order: core first, then environment, characters, audio; init last (needs the images).
  const order = (t: Task) => STAGES.indexOf(t.stage);
  tasks.sort((a, b) => order(a) - order(b));
  const total = tasks.reduce((s, t) => s + t.weight, 0);
  state.totalFiles = files.length;
  for (const t of tasks) state.counts[t.stage][1]++;

  const update = () => {
    let sum = 0;
    for (const t of tasks) sum += t.weight * t.done;
    state.progress = Math.min(1, sum / total);
    state.stage = STAGES.find(s => state.counts[s][0] < state.counts[s][1]) ?? 'init';
  };
  const finish = (t: Task, error?: unknown) => {
    t.done = 1;
    state.counts[t.stage][0]++;
    if (t.stage !== 'init') state.loadedFiles++;
    if (error) {
      state.failed.push(t.name);
      if (import.meta.env?.DEV) console.warn('[loading]', t.name, error);
    }
    update();
  };
  const exec = (t: Task) => withTimeout(t.run(f => { t.done = Math.max(t.done, Math.min(0.999, f)); update(); }), t.name)
    .then(() => finish(t), e => finish(t, e));

  const fileTasks = tasks.filter(t => t.stage !== 'init');
  let next = 0;
  const pause = () => new Promise<void>(r => window.setTimeout(r, delayMs));
  const worker = async () => {
    while (next < fileTasks.length) {
      const t = fileTasks[next++];
      if (delayMs) await pause();   // dev-only slow-network stand-in (see LoadingScreen)
      await exec(t);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, fileTasks.length) }, worker));
  for (const t of tasks.filter(t => t.stage === 'init')) await exec(t);
  update();
}

/** For tests: forget the shared preload. */
export function resetPreloadForTests() { current = null; index = null; decoded.clear(); decodedSounds.clear(); }

import { getWizardSheet } from '../rendering/wizardSprite.ts';
/**
 * Animated layer of the loading screen: one canvas over the painted background
 * (public/assets/loading/background.jpg), one requestAnimationFrame loop, delta-time driven.
 *
 * Art space is the 1376x768 painting. The canvas is sized in device pixels; painted layers are
 * drawn through a scale transform, pixel sprites (wizard, dust, sparks) are snapped to whole
 * device pixels with nearest-neighbour scaling. Every pool, path and glow sprite is created
 * once in the constructor; the frame loop allocates nothing.
 */
import layout from '../data/loadingLayout.json';
import wizard from '../data/wizardRun.json';
import type { Preload } from './preloader.ts';

const ART_W = layout.width, ART_H = layout.height;
const ASSET = `${import.meta.env?.BASE_URL ?? '/'}assets/loading/`;
/**
 * Run cycle: 8 frames. Frame time follows his speed, from 120 ms (jogging, or running on the
 * spot while files arrive) to 80 ms (full sprint), in proportion to his speed.
 */
export const RUN_FRAME_SLOW = 0.12;
export const RUN_FRAME_FAST = 0.08;
const WIZARD_ART_HEIGHT = 142;            // on-screen height in painting pixels (matches the mockup)
/**
 * The fill's head sits under his leading foot (painting px ahead of the eyes): he lays the
 * trail as he runs, so the bar can never be ahead of him or behind him.
 */
const FOOT_LEAD = 17;
const WIZARD_MAX_SPEED = 430;             // painting px / s, full sprint
const WIZARD_ACCEL = 1000;                // painting px / s²: speeding up and braking
const RATE_SMOOTHING = 0.6;               // s: how quickly his pace follows the loading rate
const CATCH_UP = 0.35;                    // s: a sudden jump in progress is run down in about this
const LANDING_FRAMES = [0, 4];            // feet hit the ground on these frames (after 3 and 7, the airborne ones)
const STRIPE = 26;                        // spacing of the light bands in the bar fill

const images: Record<'bg' | 'wizard' | 'swirl' | 'streaks', HTMLImageElement | null> = { bg: null, wizard: null, swirl: null, streaks: null };
/** Starts loading the screen's own art; called at import so it is ready before the screen opens. */
export function preloadLoadingArt() {
  if (typeof Image === 'undefined' || images.bg) return;
  const load = (file: string) => { const i = new Image(); i.decoding = 'async'; i.src = ASSET + file; return i; };
  images.bg = load('background.jpg');
  images.wizard = load(wizard.file);
  images.swirl = load('portal-swirl.png');
  images.streaks = load('portal-streaks.png');
}
const ready = (i: HTMLImageElement | null): i is HTMLImageElement => !!i && i.complete && i.naturalWidth > 0;

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: number; phase: number }
const pool = (n: number): Particle[] => Array.from({ length: n }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: 0, phase: 0 }));

export interface SceneUI {
  root: HTMLElement;            // gets data-phase for CSS (surge / fade)
  percent: HTMLElement;         // "LOADING... XX%" number
  lines: HTMLElement[];         // the three status lines
  perf?: HTMLElement | null;    // dev-only overlay
}
export interface SceneOptions {
  reducedMotion: boolean; stress: number; onFinished: () => void;
  /** Called once as the screen starts to fade out (what it uncovers should be ready). */
  onReveal?: () => void;
  /** Dev only: stay on the loading screen after 100% (for profiling). */
  hold?: boolean;
}

export type Phase = 'loading' | 'finishing' | 'surge' | 'fade' | 'done';

/** Which loading stages each status line covers. */
const LINE_STAGES: Preload['stage'][][] = [['core', 'environment'], ['characters'], ['audio', 'init']];

export class LoadingScene {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private time = 0;
  private kx = 1; private ky = 1;
  phase: Phase = 'loading';
  private phaseTime = 0;
  /** Displayed progress: eases toward the real value, never ahead of it. */
  shown = 0;
  private shownPct = -1;
  private lineState = [-1, -1, -1];

  // wizard: his position IS the displayed progress (see FOOT_LEAD)
  private wizX: number;
  private wizSpeed = 0;                    // painting px / s
  private loadRate = 0;                    // smoothed real progress, painting px / s
  private lastReal = 0;
  private runClock = 0;                    // in frames
  private frame = 0;
  private cycles = 0;

  // pools
  private motes: Particle[];
  private dust = pool(18);
  private sparks = pool(20);
  private flies: Particle[];
  private leaves: Particle[];
  private moteAcc = 0;
  private sparkAcc = 0;

  // cached drawables
  // Static sprites: canvases at first, swapped for ImageBitmaps (the cheapest source to draw) once made.
  private glowTeal: CanvasImageSource;
  private glowGold: CanvasImageSource;
  private bar: HTMLCanvasElement; private barCtx: CanvasRenderingContext2D;
  private barBase: CanvasImageSource;
  private barStripes: CanvasImageSource;
  private flow: HTMLCanvasElement; private flowCtx: CanvasRenderingContext2D;
  private flowMask: CanvasImageSource;
  private portalClip: Path2D;
  private rimPath: Path2D;

  // perf (dev)
  private frameMs = new Float32Array(600);
  private workMs = new Float32Array(600);
  private fIdx = 0; private fCount = 0;
  private perfAcc = 0;
  /** Dev: sections to leave out (profiling). */
  skip: Set<string> | null = null;
  stats = { fps: 0, avgMs: 0, p95Ms: 0, maxMs: 0, dropped: 0, frames: 0, workAvgMs: 0, workMaxMs: 0, heapMB: 0 };

  constructor(private canvas: HTMLCanvasElement, private load: Preload, private ui: SceneUI, private opts: SceneOptions) {
    preloadLoadingArt();
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    const k = Math.max(1, opts.stress);
    const lite = opts.reducedMotion ? 0.35 : 1;
    this.motes = pool(Math.round(56 * k * lite));
    this.flies = pool(Math.round(20 * k * lite));
    this.leaves = pool(Math.round(7 * k * lite));
    this.wizX = layout.bar.x - FOOT_LEAD;

    this.glowTeal = glowSprite(64, [120, 255, 220]);
    this.glowGold = glowSprite(64, [255, 222, 130]);
    this.bar = canvasOf(layout.bar.w, layout.bar.h); this.barCtx = this.bar.getContext('2d')!;
    this.barBase = barGradient(layout.bar.w, layout.bar.h);
    this.barStripes = stripes(layout.bar.w + STRIPE, layout.bar.h);
    this.flow = canvasOf(layout.streaks.w, layout.streaks.h); this.flowCtx = this.flow.getContext('2d')!;
    this.flowMask = flowMask(layout.streaks.w * 2, layout.streaks.h);
    const p = layout.portal;
    this.portalClip = new Path2D(); this.portalClip.ellipse(p.cx, p.cy, p.rx - 5, p.ry - 8, 0, 0, Math.PI * 2);
    this.rimPath = new Path2D(); this.rimPath.ellipse(p.cx, p.cy, p.rx, p.ry, 0, 0, Math.PI * 2);
    this.toBitmaps();
    for (const f of this.flies) this.spawnFly(f, true);
    for (const l of this.leaves) this.spawnLeaf(l, true);
  }

  private toBitmaps() {
    if (typeof createImageBitmap !== 'function') return;
    const keys = ['glowTeal', 'glowGold', 'barBase', 'barStripes', 'flowMask'] as const;
    for (const k of keys) {
      const src = this[k] as HTMLCanvasElement;
      createImageBitmap(src).then(b => { (this as unknown as Record<string, CanvasImageSource>)[k] = b; }, () => {});
    }
  }

  start() {
    this.resize();
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }

  /** Matches the canvas to its on-screen size in device pixels. */
  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    this.kx = w / ART_W; this.ky = h / ART_H;
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min(0.1, Math.max(0, (now - this.last) / 1000));   // clamp after tab switches
    const frameMs = now - this.last;
    this.last = now;
    const t0 = performance.now();
    this.update(dt);
    this.draw();
    if (this.ui.perf !== undefined) this.measure(frameMs, performance.now() - t0, dt);
  };

  // ---------------------------------------------------------------- update

  private update(dt: number) {
    this.time += dt;
    this.phaseTime += dt;
    // Displayed progress = where the wizard is. He runs toward the real progress (never past
    // it) with a speed that rises and falls smoothly, so the bar is drawn by his feet instead
    // of being chased by them.
    const b = layout.bar;
    const real = this.load.progress;
    const gap = Math.max(0, real - this.shown) * b.w;                    // painting px still to run
    // Files finish in steps; his pace follows their smoothed rate so he runs steadily instead
    // of sprinting to each step and stopping. A big jump (cached files) is run down quickly.
    if (dt > 0) this.loadRate += ((real - this.lastReal) * b.w / dt - this.loadRate) * Math.min(1, dt / RATE_SMOOTHING);
    this.lastReal = real;
    // Just under the rate, so a small lead builds up and absorbs the gaps between files.
    const pace = this.load.done ? WIZARD_MAX_SPEED : Math.max(this.loadRate * 0.9, gap / CATCH_UP);
    // Capped so he can always brake (at WIZARD_ACCEL) to a stop right at the real progress.
    const want = Math.min(WIZARD_MAX_SPEED, pace, Math.sqrt(2 * WIZARD_ACCEL * gap));
    const dv = WIZARD_ACCEL * dt;
    this.wizSpeed = want > this.wizSpeed ? Math.min(want, this.wizSpeed + dv) : Math.max(want, this.wizSpeed - dv * 1.5);
    this.shown = Math.min(real, this.shown + (this.wizSpeed * dt) / b.w);
    if (this.load.done && gap < 1) this.shown = 1;
    this.wizX = b.x + this.shown * b.w - FOOT_LEAD;
    // Stride rate follows speed: 120 ms per frame standing in, 80 ms at a full sprint.
    const stride = Math.min(1, this.wizSpeed / (WIZARD_MAX_SPEED * 0.8));
    this.runClock += dt / (RUN_FRAME_SLOW + (RUN_FRAME_FAST - RUN_FRAME_SLOW) * stride);
    const nextFrame = Math.floor(this.runClock) % wizard.frames;
    if (nextFrame !== this.frame) {
      if (nextFrame === 0) this.cycles++;
      this.frame = nextFrame;
      if (LANDING_FRAMES.includes(nextFrame)) this.kickDust();
    }

    // Phases: loading → (real 100%) finishing: let the wizard complete his stride →
    // surge: portal flares, motes rush home → fade → done.
    if (this.phase === 'loading' && this.shown >= 1 && !this.opts.hold) this.setPhase('finishing');
    else if (this.phase === 'finishing' && this.frame === 0 && this.phaseTime > 0.05) this.setPhase('surge');
    else if (this.phase === 'surge' && this.phaseTime > 0.95) { this.setPhase('fade'); this.opts.onReveal?.(); }
    else if (this.phase === 'fade' && this.phaseTime > 0.45) { this.setPhase('done'); this.opts.onFinished(); }

    this.updateParticles(dt);
    this.updateUI();
  }

  private setPhase(p: Phase) { this.phase = p; this.phaseTime = 0; this.ui.root.dataset.phase = p; }

  private kickDust() {
    // Puffs from the trailing foot, low to the ground.
    const footX = this.wizX - 50, footY = layout.bar.y - 14;   // trailing foot, ~23 sprite px behind the eyes
    let n = 3;
    for (const d of this.dust) {
      if (d.life > 0) continue;
      d.x = footX + (Math.random() - 0.5) * 8; d.y = footY - Math.random() * 3;
      d.vx = -20 - Math.random() * 30; d.vy = -8 - Math.random() * 14;
      d.max = d.life = 0.35 + Math.random() * 0.2; d.size = 3 + Math.round(Math.random() * 2);
      if (--n === 0) break;
    }
  }

  private updateParticles(dt: number) {
    const p = layout.portal;
    const surge = this.phase === 'surge' || this.phase === 'fade';
    // Motes leave the portal and drift into the forest; in the surge they rush back in.
    this.moteAcc += dt * (surge ? 0 : this.motes.length / 2.8);
    for (const m of this.motes) {
      if (m.life <= 0) {
        if (this.moteAcc < 1) continue;
        this.moteAcc -= 1;
        const a = Math.random() * Math.PI * 2;
        m.x = p.cx + Math.cos(a) * p.rx * 0.6; m.y = p.cy + Math.sin(a) * p.ry * 0.7;
        m.vx = 40 + Math.random() * 90; m.vy = (Math.random() - 0.55) * 30;
        m.max = m.life = 1.6 + Math.random() * 1.8; m.size = Math.random() < 0.25 ? 3 : 2;
        m.color = Math.random() < 0.65 ? 0 : 1; m.phase = Math.random() * 6.28;
        continue;
      }
      if (surge) {
        // Pull toward the eye of the vortex.
        const ax = p.eyeX - m.x, ay = p.eyeY - m.y, d = Math.hypot(ax, ay) || 1;
        m.vx += (ax / d) * 900 * dt; m.vy += (ay / d) * 900 * dt;
        m.vx *= 1 - 2 * dt; m.vy *= 1 - 2 * dt;
        if (d < 30) m.life = 0;
      } else {
        m.vy += Math.sin(this.time * 2 + m.phase) * 12 * dt;
      }
      m.x += m.vx * dt; m.y += m.vy * dt; m.life -= dt;
    }
    // Sparks at the fill head.
    const headX = layout.bar.x + this.shown * layout.bar.w;
    this.sparkAcc += dt * (this.shown > 0.01 && this.shown < 1 ? 24 : 0);
    for (const s of this.sparks) {
      if (s.life <= 0) {
        if (this.sparkAcc < 1) continue;
        this.sparkAcc -= 1;
        s.x = headX; s.y = layout.bar.y + Math.random() * layout.bar.h;
        s.vx = 10 + Math.random() * 40; s.vy = -20 - Math.random() * 40;
        s.max = s.life = 0.3 + Math.random() * 0.35; s.color = Math.random() < 0.5 ? 1 : 0; s.size = 2;
        continue;
      }
      s.vy += 90 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    }
    for (const d of this.dust) if (d.life > 0) { d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= 1 - 3 * dt; d.life -= dt; }
    for (const f of this.flies) {
      f.life -= dt;
      if (f.life <= 0) this.spawnFly(f, false);
      f.x += (f.vx + Math.sin(this.time * 0.7 + f.phase) * 8) * dt;
      f.y += (f.vy + Math.cos(this.time * 0.9 + f.phase) * 6) * dt;
    }
    for (const l of this.leaves) {
      l.y += l.vy * dt; l.x += Math.sin(this.time * 1.3 + l.phase) * 14 * dt + l.vx * dt;
      if (l.y > ART_H + 10) this.spawnLeaf(l, false);
    }
  }

  private spawnFly(f: Particle, anywhere: boolean) {
    f.x = 60 + Math.random() * (ART_W - 120); f.y = 120 + Math.random() * 420;
    f.vx = (Math.random() - 0.5) * 10; f.vy = (Math.random() - 0.5) * 6;
    f.max = f.life = (anywhere ? Math.random() : 1) * (5 + Math.random() * 5);
    f.phase = Math.random() * 6.28; f.color = Math.random() < 0.7 ? 1 : 0;
  }
  private spawnLeaf(l: Particle, anywhere: boolean) {
    l.x = 300 + Math.random() * 1000; l.y = anywhere ? Math.random() * ART_H : -10;
    l.vy = 16 + Math.random() * 14; l.vx = -6 - Math.random() * 6; l.phase = Math.random() * 6.28; l.color = Math.random() < 0.5 ? 0 : 1;
  }

  private updateUI() {
    const pct = Math.floor(this.shown * 100);
    if (pct !== this.shownPct) {
      this.shownPct = pct;
      this.ui.percent.textContent = String(pct);
    }
    for (let i = 0; i < 3; i++) {
      const stages = LINE_STAGES[i];
      let done = 0, total = 0;
      for (const s of stages) { done += this.load.counts[s][0]; total += this.load.counts[s][1]; }
      const state = this.load.done || (total > 0 && done >= total) ? 2 : stages.includes(this.load.stage) || done > 0 ? 1 : 0;
      if (state !== this.lineState[i]) { this.lineState[i] = state; this.ui.lines[i].dataset.state = state === 2 ? 'done' : state === 1 ? 'active' : 'pending'; }
    }
  }

  // ---------------------------------------------------------------- draw

  private draw() {
    const ctx = this.ctx, kx = this.kx, ky = this.ky;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(kx, 0, 0, ky, 0, 0);
    const t = this.time;
    const surge = this.phase === 'surge' || this.phase === 'fade' ? Math.min(1, (this.phase === 'fade' ? 1 : this.phaseTime / 0.8)) : 0;

    const skip = this.skip;
    // Light shafts, rune glows, fog and the portal's reflected light are CSS layers
    // (LoadingScreen.tsx): they only change opacity / position, which the compositor
    // animates without repainting this canvas.
    if (!skip?.has('portal')) this.drawPortal(t, surge);
    if (!skip?.has('streaks')) this.drawStreakFlow(t, surge);

    if (!skip?.has('flies')) this.drawFlies(t);
    this.drawLeaves();
    if (!skip?.has('bar')) this.drawBar(t);
    this.drawMotes();
    if (!skip?.has('wizard')) this.drawWizard();

    // Surge: the portal's light floods the scene a little.
    if (surge > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.45 * surge;
      ctx.drawImage(this.glowTeal, layout.portal.eyeX - 420, layout.portal.eyeY - 480, 840, 960);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  }

  private drawPortal(t: number, surge: number) {
    const ctx = this.ctx, p = layout.portal;
    const swirl = images.swirl;
    if (!ready(swirl)) return;
    ctx.save();
    ctx.clip(this.portalClip);
    ctx.imageSmoothingEnabled = true;
    const speed = 1 + 2.5 * surge;
    ctx.save(); this.swirlLayer(swirl, -t * 0.55 * speed); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.22 + 0.2 * surge; this.swirlLayer(swirl, t * 0.9 * speed + 1.3); ctx.restore();
    // Bright eye.
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.28 + 0.12 * Math.sin(t * 2.3) + 0.4 * surge;
    ctx.drawImage(this.glowTeal, p.eyeX - 70, p.eyeY - 120, 140, 240);
    ctx.restore();
    // Rim glow on its own slow cycle.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = '#ffe6a0';
    ctx.lineWidth = 5;
    ctx.globalAlpha = 0.1 + 0.08 * Math.sin(t * 0.8 + 0.6) + 0.35 * surge;
    ctx.stroke(this.rimPath);
    ctx.restore();
  }

  /** The vortex is an ellipse seen at an angle: rotate it in its own plane (squash to a circle, rotate, stretch back) about the eye. */
  private swirlLayer(swirl: HTMLImageElement, angle: number) {
    const ctx = this.ctx, p = layout.portal, squash = p.rx / p.ry;
    ctx.translate(p.eyeX, p.eyeY); ctx.scale(squash, 1); ctx.rotate(angle); ctx.scale(1 / squash, 1); ctx.translate(-p.eyeX, -p.eyeY);
    ctx.drawImage(swirl, layout.swirl.x, layout.swirl.y);
  }

  /** Light runs outward along the painted energy streaks. */
  private drawStreakFlow(t: number, surge: number) {
    const streaks = images.streaks;
    if (!ready(streaks)) return;
    const s = layout.streaks, f = this.flowCtx;
    f.globalCompositeOperation = 'source-over';
    f.clearRect(0, 0, s.w, s.h);
    f.drawImage(streaks, 0, 0);
    f.globalCompositeOperation = 'destination-in';
    const period = s.w;                 // the mask holds two bands per period
    const off = ((t * 150 * (1 + surge)) % period);
    f.drawImage(this.flowMask, off - period, 0);
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.75;
    ctx.drawImage(this.flow, s.x, s.y);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Fireflies as pixel glows: a 2 px core with a dimmer plus-shaped halo, all rectangles.
   * (Many small image draws cost far more than rects when the canvas falls back to CPU.)
   */
  private drawFlies(t: number) {
    const ctx = this.ctx;
    for (let c = 0; c < 2; c++) {
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass === 0 ? (c ? '#e8c45c' : '#5fe0c0') : (c ? '#ffe9a6' : '#a9ffe9');
        for (const f of this.flies) {
          if (f.color !== c) continue;
          const a = this.flyAlpha(f, t);
          if (a <= 0.01) continue;
          const x = Math.round(f.x) - 1, y = Math.round(f.y) - 1;
          if (pass === 0) {
            ctx.globalAlpha = a * 0.35;
            ctx.fillRect(x - 2, y, 6, 2); ctx.fillRect(x, y - 2, 2, 6);
          } else {
            ctx.globalAlpha = a;
            ctx.fillRect(x, y, 2, 2);
          }
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  private flyAlpha(f: Particle, t: number) { return Math.max(0, Math.min(1, f.life, (f.max - f.life) * 2) * (0.55 + 0.45 * Math.sin(t * 2.6 + f.phase))); }

  private drawLeaves() {
    const ctx = this.ctx;
    for (const l of this.leaves) {
      ctx.fillStyle = l.color ? '#7fa64b' : '#c9b25a';
      const x = Math.round(l.x), y = Math.round(l.y), tilt = Math.sin(this.time * 2 + l.phase) > 0 ? 1 : -1;
      ctx.fillRect(x, y, 4, 2); ctx.fillRect(x + (tilt > 0 ? 2 : -2), y + 2, 4, 2);
    }
  }

  /** The channel fill, drawn at painting resolution and scaled up with nearest-neighbour. */
  private drawBar(t: number) {
    const b = layout.bar, c = this.barCtx;
    const w = Math.floor((this.shown * b.w) / 2) * 2;
    c.clearRect(0, 0, b.w, b.h);
    if (w > 0) {
      c.drawImage(this.barBase, 0, 0, w, b.h, 0, 0, w, b.h);
      // Light bands sweeping toward the head: one pre-drawn stripe strip, scrolled.
      const shift = Math.floor((t * 60) % STRIPE) & ~1;
      c.drawImage(this.barStripes, STRIPE - shift, 0, w, b.h, 0, 0, w, b.h);
      // Leaf flecks riding the current.
      c.globalAlpha = 0.85;
      c.fillStyle = '#f6ffb8';
      for (let i = 0; i < 9; i++) {
        const lx = Math.round(((t * (34 + i * 7) + i * 97) % (w + 20)) - 10);
        const ly = 6 + ((i * 13) % (b.h - 12)) + Math.round(Math.sin(t * 2 + i) * 3);
        if (lx > 0 && lx + 4 < w) { c.fillRect(lx, ly, 4, 2); c.fillRect(lx + 2, ly - 2, 2, 2); }
      }
      // Bright head.
      c.globalAlpha = 1;
      c.fillStyle = '#fffbe0';
      c.fillRect(Math.max(0, w - 4), 2, 4, b.h - 4);
    }
    c.globalAlpha = 1;
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.bar, b.x, b.y);
    if (w > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55 + 0.15 * Math.sin(t * 6);
      ctx.drawImage(this.glowGold, b.x + w - 40, b.y - 30, 80, b.h + 60);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    for (let c = 0; c < 2; c++) {
      ctx.fillStyle = c ? '#fff4b0' : '#9fffe0';
      for (const s of this.sparks) {
        if (s.life <= 0 || s.color !== c) continue;
        ctx.globalAlpha = s.life / s.max;
        ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawMotes() {
    const ctx = this.ctx;
    for (let c = 0; c < 2; c++) {
      ctx.fillStyle = c ? '#ffe28a' : '#9ff9e4';
      for (const m of this.motes) {
        if (m.life <= 0 || m.color !== c) continue;
        ctx.globalAlpha = Math.min(1, m.life / m.max * 2, (m.max - m.life) * 3);
        ctx.fillRect(Math.round(m.x), Math.round(m.y), m.size, m.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawWizard() {
    const ctx = this.ctx, img = images.wizard;
    // Dust (painting space, chunky squares).
    for (const d of this.dust) {
      if (d.life <= 0) continue;
      ctx.globalAlpha = 0.75 * d.life / d.max;
      ctx.fillStyle = '#b9ab90';
      ctx.fillRect(Math.round(d.x), Math.round(d.y), d.size, d.size);
    }
    ctx.globalAlpha = 1;
    const aeris = getWizardSheet();
    if (aeris) {
      const size = Math.round(WIZARD_ART_HEIGHT * this.ky * 1.15);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(aeris, this.frame * 256, 256, 256, 256, Math.round(this.wizX * this.kx - size / 2), Math.round((layout.bar.y - 12) * this.ky - size * .9), size, size);
      ctx.setTransform(this.kx, 0, 0, this.ky, 0, 0);
      return;
    }
    if (!ready(img)) return;
    // Whole-device-pixel scale and position: crisp, never shimmering.
    const s = Math.max(1, Math.round((WIZARD_ART_HEIGHT * this.ky) / wizard.h));
    const x = Math.round(this.wizX * this.kx - wizard.eyeX * s);
    const y = Math.round((layout.bar.y - 12) * this.ky - wizard.ground * s);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, this.frame * wizard.w, 0, wizard.w, wizard.h, x, y, wizard.w * s, wizard.h * s);
    ctx.setTransform(this.kx, 0, 0, this.ky, 0, 0);
  }

  // ---------------------------------------------------------------- perf (dev)

  /**
   * Dev: renders `n` frames back to back, independent of vsync and of the browser throttling
   * a background window. JS cost is timed per frame; the GPU is synced once at the end
   * (1-pixel readback; reading back every frame would push Chrome to a CPU canvas), so
   * total / n is the real throughput including raster.
   */
  benchmark(n = 300, syncEachFrame = false) {
    const js = new Float64Array(n);
    const start = performance.now();
    for (let i = 0; i < n; i++) {
      const t0 = performance.now();
      this.update(1 / 60);
      this.draw();
      if (syncEachFrame) this.ctx.getImageData(0, 0, 1, 1);   // pessimistic: GPU stall every frame
      js[i] = performance.now() - t0;
    }
    this.ctx.getImageData(0, 0, 1, 1);
    const total = performance.now() - start;
    const sorted = Array.from(js).sort((a, b) => a - b);
    return {
      frames: n, frameMs: total / n, capacityFps: 1000 / (total / n),
      jsAvgMs: sorted.reduce((a, b) => a + b, 0) / n, jsP95Ms: sorted[Math.floor(n * 0.95)], jsMaxMs: sorted[n - 1],
      canvas: [this.canvas.width, this.canvas.height],
    };
  }

  private measure(frameMs: number, workMs: number, dt: number) {
    this.frameMs[this.fIdx] = frameMs; this.workMs[this.fIdx] = workMs;
    this.fIdx = (this.fIdx + 1) % this.frameMs.length;
    this.fCount = Math.min(this.fCount + 1, this.frameMs.length);
    this.perfAcc += dt;
    if (this.perfAcc < 0.25) return;
    this.perfAcc = 0;
    const n = this.fCount, frames = Array.from(this.frameMs.subarray(0, n)).sort((a, b) => a - b);
    let sum = 0, work = 0, workMax = 0, dropped = 0;
    for (let i = 0; i < n; i++) {
      sum += this.frameMs[i]; work += this.workMs[i]; workMax = Math.max(workMax, this.workMs[i]);
      if (this.frameMs[i] > 16.67 * 1.5) dropped += Math.floor(this.frameMs[i] / 16.67) - 1;
    }
    const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    Object.assign(this.stats, {
      fps: n ? 1000 / (sum / n) : 0, avgMs: n ? sum / n : 0, p95Ms: frames[Math.floor(n * 0.95)] ?? 0, maxMs: frames[n - 1] ?? 0,
      dropped, frames: n, workAvgMs: n ? work / n : 0, workMaxMs: workMax, heapMB: mem ? mem.usedJSHeapSize / 1048576 : 0,
    });
    if (this.ui.perf) {
      const st = this.stats;
      this.ui.perf.textContent = `FPS ${st.fps.toFixed(0)} · frame ${st.avgMs.toFixed(1)} ms (p95 ${st.p95Ms.toFixed(1)}, max ${st.maxMs.toFixed(1)})\n` +
        `work ${st.workAvgMs.toFixed(2)} ms (max ${st.workMaxMs.toFixed(2)}) · dropped ${st.dropped}/${st.frames}` +
        (st.heapMB ? ` · heap ${st.heapMB.toFixed(0)} MB` : '') +
        `\n${this.load.stage} · files ${this.load.loadedFiles}/${this.load.totalFiles} · real ${(this.load.progress * 100).toFixed(1)}%`;
    }
  }
}

// ---------------------------------------------------------------- cached drawables

function canvasOf(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

/** Soft round glow, drawn once and scaled/tinted by alpha at use. */
function glowSprite(size: number, [r, g, b]: number[]) {
  const c = canvasOf(size, size), x = c.getContext('2d')!;
  const grad = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.9)`);
  grad.addColorStop(0.35, `rgba(${r},${g},${b},0.35)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = grad; x.fillRect(0, 0, size, size);
  return c;
}

/** Pixel fog: clusters of 4 px squares, tileable horizontally (used as a CSS background). */
export function fogTile(w: number, h: number) {
  const c = canvasOf(w, h), x = c.getContext('2d')!;
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 26; i++) {
    const cx = rnd() * w, cy = h * 0.3 + rnd() * h * 0.5, rx = 30 + rnd() * 70, ry = 10 + rnd() * 18;
    for (let py = -ry; py <= ry; py += 4) for (let px = -rx; px <= rx; px += 4) {
      const d = (px / rx) ** 2 + (py / ry) ** 2;
      if (d > 1) continue;
      x.fillStyle = `rgba(170,215,190,${(0.16 * (1 - d)).toFixed(3)})`;
      for (const wrap of [0, -w, w]) x.fillRect(Math.round((cx + px + wrap) / 4) * 4, Math.round((cy + py) / 4) * 4, 4, 4);
    }
  }
  return c;
}

/** Emerald → spring green → gold, with a darker lower half (painted channel look). */
function barGradient(w: number, h: number) {
  const c = canvasOf(w, h), x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, '#0f6d5a'); g.addColorStop(0.55, '#3dbf6e'); g.addColorStop(0.85, '#b7e35a'); g.addColorStop(1, '#ffe27a');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  // Pixel shading bands: light top lip, dark bottom.
  x.fillStyle = 'rgba(255,255,220,0.35)'; x.fillRect(0, 2, w, 2);
  x.fillStyle = 'rgba(0,30,20,0.35)'; x.fillRect(0, h - 8, w, 8);
  x.fillStyle = 'rgba(0,30,20,0.2)'; x.fillRect(0, h - 14, w, 6);
  return c;
}

/** Slanted 2 px light bands every STRIPE px (pixel steps), pre-drawn for the bar fill. */
function stripes(w: number, h: number) {
  const c = canvasOf(w, h), x = c.getContext('2d')!;
  x.fillStyle = 'rgba(233,255,154,0.32)';
  for (let bx = -h; bx < w; bx += STRIPE) for (let y = 0; y < h; y += 2) {
    const xx = Math.round(bx + y * 0.5);
    if (xx >= 0 && xx + 2 <= w) x.fillRect(xx, y, 2, 2);
  }
  return c;
}

/** Two soft vertical bands per streak-width, used to make light run along the streaks. */
function flowMask(w: number, h: number) {
  const c = canvasOf(w, h), x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, w, 0);
  for (const base of [0, 0.5]) {
    g.addColorStop(base + 0.0, 'rgba(0,0,0,0)');
    g.addColorStop(base + 0.12, 'rgba(0,0,0,1)');
    g.addColorStop(base + 0.2, 'rgba(0,0,0,0)');
  }
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  return c;
}

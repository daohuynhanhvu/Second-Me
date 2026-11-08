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
import { PortalTwist, type TwistParams } from './portalTwist.ts';

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

/*
 * Portal transition, after loading has really finished (see update()):
 *   move      the arch slides to the centre of the screen; the bar, its text and status
 *             lines sink away into the forest floor;
 *   rotate    the arch turns about its vertical axis from the painted three-quarter view
 *             to face the camera (drawArchModel), vortex and stone together;
 *   activate  the portal wakes and the whole arch starts to twist: the stone rumbles, then
 *             bends into a counter-clockwise spiral (portalTwist.ts: a shader warp of the
 *             arch and vortex), chips break off, motes and fireflies spiral in, the forest
 *             darkens;
 *   dive      the camera zooms in on the centre while the twist winds tighter and faster and
 *             the stone is drawn into the eye; the tunnel opens behind it, turquoise floods
 *             the screen, a white flash hands over to the next screen (AdventureApp fades it).
 */
const MOVE_S = 1.5;
const ROTATE_S = 1.5;
const SINK_S = 1.3;                       // the bar group is gone before the portal arrives
const TITLE_S = 1.0;                      // the painted title sinks first: the portal passes through its place
const ACTIVATE_S = 1.3;
const DIVE_S = 2.1;
const ZOOM_MAX = 6;                       // camera zoom at the end of the dive
const LAYER = 560;                        // portal layer (painting px, square) the twist warps
const TWIST_RADIUS = 520;                 // painting px from the centre where the twist fades out
const CHIPS = 24;
const TUNNEL_LAYERS = 7;
const RINGS = 4;
const DIM_MAX = 0.62;                     // forest darkness around the active portal
const FLASH = '#effffa';

type Art = 'bg' | 'bgEmpty' | 'wizard' | 'swirl' | 'streaks' | 'arch' | 'barFrame' | 'title' | 'front';
const images: Record<Art, HTMLImageElement | null> = { bg: null, bgEmpty: null, wizard: null, swirl: null, streaks: null, arch: null, barFrame: null, title: null, front: null };
/** Starts loading the screen's own art; called at import so it is ready before the screen opens. */
export function preloadLoadingArt() {
  if (typeof Image === 'undefined' || images.bg) return;
  const load = (file: string) => { const i = new Image(); i.decoding = 'async'; i.src = ASSET + file; return i; };
  images.bg = load('background.jpg');
  images.wizard = load(wizard.file);
  images.swirl = load('portal-swirl.png');
  images.streaks = load('portal-streaks.png');
  // Portal transition (tools/assets/prepare_portal_transition.py).
  images.bgEmpty = load('background-empty.jpg');
  images.arch = load('portal-arch.png');
  images.barFrame = load('bar-frame.png');
  images.title = load('title.png');
  images.front = load('portal-front.png');
}
const ready = (i: HTMLImageElement | null): i is HTMLImageElement => !!i && i.complete && i.naturalWidth > 0;
/** The portal transition needs its sprites; without them (a very slow connection) the screen just fades. */
const transitionArtReady = () => ready(images.bgEmpty) && ready(images.arch) && ready(images.barFrame) && ready(images.title) && ready(images.swirl) && ready(images.front);

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: number; phase: number }
const pool = (n: number): Particle[] => Array.from({ length: n }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: 0, phase: 0 }));

export interface SceneUI {
  root: HTMLElement;            // gets data-phase for CSS (surge / fade)
  percent: HTMLElement;         // "LOADING... XX%" number
  lines: HTMLElement[];         // the three status lines
  perf?: HTMLElement | null;    // dev-only overlay
}
export interface SceneOptions {
  /** `flash`: the screen ended on the portal's white flash (false after the plain fade). */
  reducedMotion: boolean; stress: number; onFinished: (flash: boolean) => void;
  /** Called once just before onFinished (what the screen hands over to should be ready). */
  onReveal?: () => void;
  /** Dev only: stay on the loading screen after 100% (for profiling). */
  hold?: boolean;
}

/** `fade` replaces the portal transition when reduced motion is on. */
export type Phase = 'loading' | 'finishing' | 'move' | 'rotate' | 'activate' | 'dive' | 'fade' | 'done';
const TRANSITION: Phase[] = ['move', 'rotate', 'activate', 'dive'];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => { const x = clamp01((v - a) / (b - a)); return x * x * (3 - 2 * x); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

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

  // portal transition
  private portalX = 0; private portalY = 0;   // centre of the vortex opening now (painting px)
  private spin = 0;                            // accumulated counter-clockwise turn (rad, negative)
  private tunnel = 0;                          // how far the camera has travelled down the tunnel
  private rings = new Float32Array(RINGS).fill(-1);   // shock ring ages (s), -1 = idle
  private ringAcc = 0;
  private ga = 1; private gy = 0;              // bar group: alpha and sink offset
  private vignette: CanvasImageSource;
  private low: HTMLCanvasElement | null = null;   // half-resolution buffer for the deep dive
  private lowCtx: CanvasRenderingContext2D | null = null;
  private tr = new Float32Array(2);                // tunnel radii scratch
  // spiral twist (activate, dive)
  private twistFx: PortalTwist | null = null;
  private twistTried = false;
  private layer: HTMLCanvasElement | null = null;
  private layerCtx: CanvasRenderingContext2D | null = null;
  private tp: TwistParams = { centreX: 0, centreY: 0, zoom: 1, twist: 0, spin: 0, suck: 0, radius: TWIST_RADIUS, trail: 0, jitterX: 0, jitterY: 0 };
  private twistSpin = 0;
  private chips = pool(CHIPS);                     // stone chips breaking off the arch
  private chipAcc = 0;

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
  /** Dev: every transition frame (interval, work, stage) for transitionReport(). */
  private tFrame = new Float32Array(1200); private tWork = new Float32Array(1200);
  private tStage = new Uint8Array(1200); private tN = 0;

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
    this.vignette = vignette(layout.center.x / 4, layout.center.y / 4);
    this.portalX = layout.portal.cx; this.portalY = layout.portal.cy;
    const p = layout.portal;
    this.portalClip = new Path2D(); this.portalClip.ellipse(p.cx, p.cy, p.rx - 5, p.ry - 8, 0, 0, Math.PI * 2);
    this.rimPath = new Path2D(); this.rimPath.ellipse(p.cx, p.cy, p.rx, p.ry, 0, 0, Math.PI * 2);
    this.toBitmaps();
    if (!opts.reducedMotion) {
      // The spiral twist's shader compiles in the background while loading runs.
      this.twistFx = PortalTwist.create();
      this.layer = canvasOf(LAYER, LAYER); this.layerCtx = this.layer.getContext('2d')!;
    }
    for (const f of this.flies) this.spawnFly(f, true);
    for (const l of this.leaves) this.spawnLeaf(l, true);
  }

  private toBitmaps() {
    if (typeof createImageBitmap !== 'function') return;
    const keys = ['glowTeal', 'glowGold', 'barBase', 'barStripes', 'flowMask', 'vignette'] as const;
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
  stop() {
    cancelAnimationFrame(this.raf); this.raf = 0;
    this.twistFx?.dispose(); this.twistFx = null;
  }

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
    // the portal transition (move → activate → dive) → done. Reduced motion: a short fade.
    if (this.phase === 'loading' && this.shown >= 1 && !this.opts.hold) this.setPhase('finishing');
    else if (this.phase === 'finishing' && this.frame === 0 && this.phaseTime > 0.05) this.setPhase(this.opts.reducedMotion || !transitionArtReady() ? 'fade' : 'move');
    else if (this.phase === 'move' && this.phaseTime >= MOVE_S) this.setPhase('rotate');
    else if (this.phase === 'rotate' && this.phaseTime >= ROTATE_S) this.setPhase('activate');
    else if (this.phase === 'activate' && this.phaseTime >= ACTIVATE_S) this.setPhase('dive');
    else if ((this.phase === 'dive' && this.phaseTime >= DIVE_S) || (this.phase === 'fade' && this.phaseTime > 0.45)) {
      const flash = this.phase === 'dive';
      this.setPhase('done'); this.stop();
      this.opts.onReveal?.(); this.opts.onFinished(flash);
      return;
    }
    if (TRANSITION.includes(this.phase)) this.updateTransition(dt);
    // As soon as the twist shader has compiled (in the background, during loading), run it
    // once out of sight: the first texture upload and draw cost tens of ms on slow machines,
    // better spent while the bar runs than in the middle of the transition. Same for the
    // deep dive's half-resolution buffer.
    if (!this.twistTried && this.layer && this.twistFx?.ready() && this.canvas.width > 1) {
      this.twistTried = true;
      this.twistFx.render(this.layer, this.canvas.width, this.canvas.height, this.kx, this.ky, this.tp);
      this.ensureLow();
    }

    this.updateParticles(dt);
    this.updateUI();
  }

  private setPhase(p: Phase) { this.phase = p; this.phaseTime = 0; this.ui.root.dataset.phase = p; }

  /** 0..1 progress of each transition stage (1 once it is over). */
  private get moveK() { return this.phase === 'move' ? clamp01(this.phaseTime / MOVE_S) : TRANSITION.includes(this.phase) ? 1 : 0; }
  private get rotateK() { return this.phase === 'rotate' ? clamp01(this.phaseTime / ROTATE_S) : this.phase === 'activate' || this.phase === 'dive' ? 1 : 0; }
  private get activeK() { return this.phase === 'activate' ? clamp01(this.phaseTime / ACTIVATE_S) : this.phase === 'dive' ? 1 : 0; }
  private get diveK() { return this.phase === 'dive' ? clamp01(this.phaseTime / DIVE_S) : 0; }

  private updateTransition(dt: number) {
    const p = layout.portal, c = layout.center;
    const e = easeInOut(this.moveK), a = this.activeK, z = this.diveK;
    // The opening's centre travels to the screen centre and stays there (rotation, zoom).
    this.portalX = p.cx + (c.x - p.cx) * e;
    this.portalY = p.cy + (c.y - p.cy) * e;
    // Counter-clockwise on screen = a decreasing canvas angle. Faster as it wakes and dives.
    this.spin -= dt * (0.55 + 2.4 * smooth(0, 1, a) + 10 * z * z);
    this.tunnel = (this.tunnel + dt * (0.22 + 1.9 * z * z)) % 1;
    // Shock rings roll out while it wakes and early in the dive.
    if (this.phase === 'activate' || (this.phase === 'dive' && z < 0.35)) {
      this.ringAcc += dt;
      if (this.ringAcc > 0.42) {
        this.ringAcc = 0;
        const i = this.rings.indexOf(-1);
        if (i >= 0) this.rings[i] = 0;
      }
    }
    for (let i = 0; i < RINGS; i++) if (this.rings[i] >= 0) { this.rings[i] += dt; if (this.rings[i] > 1.2) this.rings[i] = -1; }
    // The twist: a rumble, then the stone bends counter-clockwise, then (diving) it winds
    // ever tighter and faster and is drawn into the centre.
    const tp = this.tp;
    const rumble = smooth(0, 0.22, a) * (1 - 0.7 * smooth(0.55, 1, a)) * (z > 0 ? 0 : 1);
    tp.twist = 2.4 * smooth(0.2, 1, a) ** 1.5 + 15 * z * z;
    this.twistSpin += dt * (0.3 * smooth(0.3, 1, a) + 5.5 * z * z);
    tp.spin = this.twistSpin;
    tp.suck = 3.4 * z ** 2.4;
    tp.trail = smooth(0.3, 0.9, a) * (1 - smooth(0.85, 1, z));
    tp.jitterX = Math.round((Math.random() * 2 - 1) * 1.6 * rumble);
    tp.jitterY = Math.round((Math.random() * 2 - 1) * 1.6 * rumble);
    tp.zoom = this.zoom; tp.centreX = this.portalX; tp.centreY = this.portalY;
    const sink = SINK_S > 0 ? clamp01(this.phase === 'move' ? this.phaseTime / SINK_S : 1) : 1;
    this.gy = 270 * sink * sink;
    this.ga = 1 - sink ** 1.6;
  }

  /** Moves a particle one step along a counter-clockwise spiral into the vortex eye; false once it arrives. */
  private spiral(m: Particle, dt: number, strength: number) {
    const dx = m.x - this.portalX, dy = m.y - this.portalY;
    let r = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    r -= dt * strength * (70 + 9000 / (r + 40));
    ang -= dt * (0.6 + 220 / (r + 50)) * (1 + strength);
    if (r < 8) return false;
    m.x = this.portalX + Math.cos(ang) * r;
    m.y = this.portalY + Math.sin(ang) * r;
    return true;
  }
  /** A chip from a random spot on the arch's stone, placed where the twist shows that spot now. */
  private spawnChip(ch: Particle) {
    let sx = 0, sy = 0;
    for (let i = 0; i < 6; i++) {
      sx = (Math.random() * 2 - 1) * 195; sy = (Math.random() * 2 - 1) * 255;
      if (Math.abs(sx) > 95 || Math.abs(sy) > 178) break;    // stone, not the opening
    }
    const tp = this.tp, rs = Math.hypot(sx, sy), ths = Math.atan2(sy, sx);
    const k = 1 - smooth(0, TWIST_RADIUS, rs);
    const r = rs * Math.exp(-tp.suck * (0.6 + 0.4 * k)) * tp.zoom, th = ths - tp.spin - tp.twist * k;
    ch.x = this.portalX + Math.cos(th) * r; ch.y = this.portalY + Math.sin(th) * r;
    ch.life = ch.max = 99; ch.size = 3 + Math.round(Math.random() * 2) + (tp.zoom > 2 ? 2 : 0); ch.color = Math.floor(Math.random() * 3);
  }

  private spawnOnRing(m: Particle) {
    const ang = Math.random() * Math.PI * 2, r = 260 + Math.random() * 380;
    m.x = this.portalX + Math.cos(ang) * r; m.y = this.portalY + Math.sin(ang) * r;
    m.max = m.life = 99; m.size = Math.random() < 0.3 ? 3 : 2; m.color = Math.random() < 0.7 ? 0 : 1;
  }

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
    const gather = this.phase === 'move' || this.phase === 'rotate', inward = this.phase === 'activate' || this.phase === 'dive';
    const pull = inward ? 0.6 + 1.4 * this.activeK + 3 * this.diveK : 0;
    // Motes leave the portal and drift into the forest. While the portal moves they gather
    // around it; once it wakes they all spiral into its eye (and new ones stream in).
    this.moteAcc += dt * (gather ? 0 : this.motes.length / 2.8);
    for (const m of this.motes) {
      if (inward) {
        if (m.life <= 0 || !this.spiral(m, dt, pull)) this.spawnOnRing(m);
        continue;
      }
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
      if (gather) {
        // Drawn toward the travelling portal, settling into a loose orbit around it.
        const ax = this.portalX - m.x, ay = this.portalY - m.y, d = Math.hypot(ax, ay) || 1;
        const k = (d > 120 ? 520 : -160) * this.moveK;
        m.vx += (ax / d) * k * dt - (ay / d) * 140 * dt; m.vy += (ay / d) * k * dt + (ax / d) * 140 * dt;
        m.vx *= 1 - 1.6 * dt; m.vy *= 1 - 1.6 * dt;
        m.life = Math.max(m.life, 0.5);
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
    // Stone chips break off the twisting arch and spiral into the eye.
    if (inward) {
      const breaking = this.activeK > 0.35 && this.diveK < 0.75;
      this.chipAcc += breaking ? dt * 16 : 0;
      for (const ch of this.chips) {
        if (ch.life > 0) { if (!this.spiral(ch, dt, pull * 0.45)) ch.life = 0; continue; }
        if (this.chipAcc < 1) continue;
        this.chipAcc -= 1;
        this.spawnChip(ch);
      }
    }
    for (const f of this.flies) {
      if (inward) {
        // Fireflies are swept into the vortex too, and replaced from the dark.
        if (!this.spiral(f, dt, pull * 0.8)) { this.spawnOnRing(f); f.color = 1; }
        f.life = f.max = 99;
        continue;
      }
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
    if (this.phase === 'done') return;   // keep the last (flash) frame until the screen goes
    const ctx = this.ctx, kx = this.kx, ky = this.ky;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(kx, 0, 0, ky, 0, 0);
    const t = this.time;
    if (TRANSITION.includes(this.phase)) { this.drawTransitionFrame(t); return; }
    const surge = 0;

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
  }

  // ---------------------------------------------------------------- portal transition

  private get zoom() { const z = this.diveK; return z > 0 ? Math.exp(Math.log(ZOOM_MAX) * z ** 1.8) : 1; }

  /**
   * Once the camera has zoomed in 2x every painted pixel already covers two screen pixels, so
   * the rest of the dive renders into a half-resolution buffer scaled up with nearest-neighbour:
   * the same pixels for a quarter of the fill cost (the dive's layers are screen-sized).
   */
  private drawTransitionFrame(t: number) {
    if (this.zoom < 2) { this.drawTransition(t); return; }
    const main = this.ctx, kx = this.kx, ky = this.ky;
    const low = this.ensureLow(), w = this.low!.width, h = this.low!.height;
    low.setTransform(1, 0, 0, 1, 0, 0);
    low.clearRect(0, 0, w, h);
    this.ctx = low; this.kx = w / ART_W; this.ky = h / ART_H;
    low.setTransform(this.kx, 0, 0, this.ky, 0, 0);
    try { this.drawTransition(t); } finally { this.ctx = main; this.kx = kx; this.ky = ky; }
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.imageSmoothingEnabled = false;
    main.drawImage(this.low!, 0, 0, w, h, 0, 0, w * 2, h * 2);
    main.setTransform(kx, 0, 0, ky, 0, 0);
  }

  private ensureLow() {
    const w = Math.ceil(this.canvas.width / 2), h = Math.ceil(this.canvas.height / 2);
    if (!this.low || this.low.width !== w || this.low.height !== h) {
      this.low ??= canvasOf(w, h);
      this.low.width = w; this.low.height = h;
      this.lowCtx = this.low.getContext('2d')!;
      this.lowCtx.fillRect(0, 0, 1, 1);   // allocate its backing store now
    }
    return this.lowCtx!;
  }

  private drawTransition(t: number) {
    const ctx = this.ctx, kx = this.kx, ky = this.ky, c = layout.center, p = layout.portal;
    const mv = this.moveK, a = this.activeK, z = this.diveK;
    const turn = easeInOut(this.rotateK);           // 0 painted angle → 1 facing the camera
    const offX = this.portalX - p.cx, offY = this.portalY - p.cy;
    const wake = smooth(0, 1, a);
    const zoom = this.zoom;
    // Camera: zoom about the screen centre, where the opening's centre sits from `rotate` on.
    const cam = () => ctx.setTransform(kx * zoom, 0, 0, ky * zoom, kx * c.x * (1 - zoom), ky * c.y * (1 - zoom));
    // Late in the dive the tunnel's opening covers the whole screen: nothing behind it shows.
    const covered = z > 0 && this.tunnelCovers(z, zoom);
    if (covered) {
      this.drawTunnel(z, zoom, true);
      this.drawTwistedPortal(t, 1);
      this.drawChips();
      this.drawMotes();
      this.drawFlood(z);
      return;
    }

    // While diving the canvas draws the whole frame itself (the page's layers cannot zoom).
    if (z > 0 && ready(images.bgEmpty)) {
      cam();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(images.bgEmpty, 0, 0, ART_W, ART_H);
      ctx.setTransform(kx, 0, 0, ky, 0, 0);
    }

    // The painted streaks were removed from the background: fade their sprite out as the portal leaves.
    const streakA = 1 - smooth(0, 0.35, mv);
    if (streakA > 0 && ready(images.streaks)) {
      ctx.globalAlpha = streakA;
      ctx.drawImage(images.streaks, layout.streaks.x, layout.streaks.y);
      ctx.globalAlpha = 1;
      this.drawStreakFlow(t, 0, streakA);
    }
    this.drawLeaves();
    if (a === 0) this.drawFlies(t);
    // The painted title sinks and fades before the portal crosses its place.
    const tk = this.phase === 'move' ? clamp01(this.phaseTime / TITLE_S) : 1;
    if (tk < 1 && ready(images.title)) {
      ctx.globalAlpha = 1 - smooth(0.15, 1, tk);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(images.title, layout.title.x, layout.title.y + 170 * tk * tk);
      ctx.globalAlpha = 1;
    }

    // The forest darkens around the portal: a little while it travels, deeply once it wakes.
    const dim = 0.16 * mv + (DIM_MAX - 0.16) * wake;
    ctx.fillStyle = '#010806';
    ctx.globalAlpha = dim;
    ctx.fillRect(0, 0, ART_W, ART_H);
    if (wake > 0) {
      ctx.globalAlpha = wake;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.vignette, 0, 0, ART_W, ART_H);
    }
    ctx.globalAlpha = 1;

    // The tunnel opens behind the arch, which is drawn into it.
    if (z > 0) this.drawTunnel(z, zoom, false);

    // The arch and its living vortex, carried by the move and the camera. While it travels
    // the painting gives way to the arch model at the same angle; then the model turns;
    // once it faces the camera the whole of it twists into a spiral.
    if (a > 0) this.drawTwistedPortal(t, 0.25 + 0.75 * wake);
    else {
      cam();
      const moving = this.phase === 'move';
      ctx.imageSmoothingEnabled = moving;            // matches the page's painting while it moves, then crisp pixels
      const model = moving ? smooth(0.35, 0.9, mv) : 1;
      if (model < 1 && ready(images.arch)) ctx.drawImage(images.arch, layout.arch.x + offX, layout.arch.y + offY);
      if (model > 0) { ctx.globalAlpha = model; this.drawArchModel(turn); ctx.globalAlpha = 1; }
      this.drawEnergy(t, turn, model, 0.25 * mv);
      if (this.phase === 'rotate') this.drawTurnLight(turn);
      ctx.setTransform(kx, 0, 0, ky, 0, 0);
    }

    // Its light grows as it comes to the centre and wakes.
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (0.12 + 0.25 * mv + 0.35 * wake) * (1 - z);
    ctx.drawImage(this.glowTeal, this.portalX - 260, this.portalY - 340, 520, 680);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    this.drawRings(zoom);
    if (a > 0) this.drawFlies(t);
    this.drawChips();
    this.drawMotes();

    // The bar, its fill, the wizard on it: sinking into the forest floor.
    if (this.ga > 0.01) {
      ctx.save();
      ctx.translate(0, this.gy);
      ctx.globalAlpha = this.ga;
      ctx.imageSmoothingEnabled = true;
      if (ready(images.barFrame)) ctx.drawImage(images.barFrame, layout.barFrame.x, layout.barFrame.y);
      ctx.globalAlpha = 1;
      this.drawBar(t);
      this.drawWizard();
      ctx.restore();
    }

    this.drawFlood(z);
  }

  /**
   * The front-facing arch and vortex, drawn into the portal layer and warped by the spiral
   * shader (portalTwist.ts) at the camera's zoom. Without WebGL: turned and shrunk in 2D.
   */
  private drawTwistedPortal(t: number, wake: number) {
    const layer = this.layer, lc = this.layerCtx;
    if (!layer || !lc) return;
    const main = this.ctx, kx = this.kx, ky = this.ky, tp = this.tp;
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.clearRect(0, 0, LAYER, LAYER);
    lc.setTransform(1, 0, 0, 1, LAYER / 2 - this.portalX, LAYER / 2 - this.portalY);
    lc.imageSmoothingEnabled = false;
    this.ctx = lc;
    try { this.drawArchModel(1); this.drawEnergy(t, 1, 1, wake); } finally { this.ctx = main; }
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.imageSmoothingEnabled = false;
    const warped = this.twistFx?.render(layer, main.canvas.width, main.canvas.height, kx, ky, tp);
    if (warped) {
      main.drawImage(warped, 0, 0);
    } else {
      main.setTransform(kx, 0, 0, ky, 0, 0);
      main.translate(this.portalX, this.portalY);
      main.rotate(-(tp.spin + tp.twist * 0.5));          // counter-clockwise
      const sc = tp.zoom * Math.exp(-tp.suck * 0.8);
      main.scale(sc, sc);
      main.drawImage(layer, -LAYER / 2 + tp.jitterX, -LAYER / 2 + tp.jitterY);
    }
    main.setTransform(kx, 0, 0, ky, 0, 0);
  }

  private drawChips() {
    const ctx = this.ctx, colours = ['#6b8a72', '#7f9d6a', '#55705f'];
    ctx.fillStyle = '#121a17';
    for (const ch of this.chips) if (ch.life > 0) ctx.fillRect(Math.round(ch.x) - 1, Math.round(ch.y) - 1, ch.size + 2, ch.size + 2);
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = colours[c];
      for (const ch of this.chips) if (ch.life > 0 && ch.color === c) ctx.fillRect(Math.round(ch.x), Math.round(ch.y), ch.size, ch.size);
    }
  }

  /** Turquoise floods the screen, then the flash the next screen fades in from. */
  private drawFlood(z: number) {
    const ctx = this.ctx, flood = smooth(0.74, 0.94, z), flash = smooth(0.88, 1, z);
    if (flood <= 0) return;
    ctx.fillStyle = '#2fd6b4'; ctx.globalAlpha = 0.85 * flood; ctx.fillRect(0, 0, ART_W, ART_H);
    ctx.fillStyle = FLASH; ctx.globalAlpha = flash; ctx.fillRect(0, 0, ART_W, ART_H);
    ctx.globalAlpha = 1;
  }

  /** The tunnel opening's radii (painting px) at this point of the dive. */
  private tunnelRadii(z: number, zoom: number) {
    const p = layout.portal, front = layout.front.open / 2, round = smooth(0.08, 0.7, z);
    this.tr[0] = ((front - 5) + (p.ry - front) * round) * zoom;
    this.tr[1] = (p.ry - 8) * zoom;
    return this.tr;
  }
  private tunnelCovers(z: number, zoom: number) {
    const tr = this.tunnelRadii(z, zoom), rx = tr[0], ry = tr[1];
    return (ART_W / 2 / rx) ** 2 + (ART_H / 2 / ry) ** 2 <= 1;
  }

  /**
   * The arch as a slab turning about its vertical axis (orthographic, column bands scaled
   * horizontally with nearest-neighbour, never rotated in the screen plane). `turn` 0 is the
   * painting's angle: near pillar in full, opening and far pillar foreshortened to their
   * painted widths, the pillar's side face showing, the far pillar in shade. At 1 every band
   * has its front-on width (portal-front.png): pillars equal, the opening an even oval.
   * The opening's centre stays fixed on (portalX, portalY).
   */
  private drawArchModel(turn: number) {
    const ctx = this.ctx, f = layout.front, img = images.front;
    if (!ready(img)) return;
    const alpha = ctx.globalAlpha;
    const wOpen = lerp(f.paintedOpen, f.open, turn), wFar = lerp(f.paintedFar, f.pillar, turn);
    const top = this.portalY - f.cy, x0 = this.portalX - wOpen / 2 - f.pillar;
    const side = 12 * (1 - turn);
    if (side > 0.5) ctx.drawImage(img, f.w, 0, f.sideW, f.h, x0 - side, top, side, f.h);
    ctx.drawImage(img, 0, 0, f.pillar, f.h, x0, top, f.pillar, f.h);
    ctx.drawImage(img, f.pillar, 0, f.open, f.h, x0 + f.pillar, top, wOpen, f.h);
    ctx.drawImage(img, f.pillar + f.open, 0, f.pillar, f.h, x0 + f.pillar + wOpen, top, wFar, f.h);
    // The far pillar comes out of shade as it turns toward the light of the camera.
    ctx.globalAlpha = alpha * (1 - turn) * 0.85;
    if (ctx.globalAlpha > 0.01) ctx.drawImage(img, f.w + f.sideW, 0, f.pillar, f.h, x0 + f.pillar + wOpen, top, wFar, f.h);
    ctx.globalAlpha = alpha;
  }

  /** A soft band of light sweeping across the stone while the arch turns. */
  private drawTurnLight(turn: number) {
    const ctx = this.ctx, f = layout.front;
    const w = lerp(f.paintedOpen, f.open, turn) + f.pillar + lerp(f.paintedFar, f.pillar, turn);
    const x = this.portalX - lerp(f.paintedOpen, f.open, turn) / 2 - f.pillar + w * turn;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.22 * Math.sin(Math.PI * turn);
    ctx.drawImage(this.glowTeal, x - 45, this.portalY - f.cy, 90, f.h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /**
   * The vortex in the opening, in the portal's own plane: several layers of the painted swirl
   * turning counter-clockwise, the inner ones smaller and faster, brighter the more awake.
   * As the arch turns the oval widens (rx) and the swirl's eye slides from its painted,
   * off-centre spot to the opening's centre. `cover` hides the model's mirrored paint.
   */
  private drawEnergy(t: number, turn: number, cover: number, wake: number) {
    const ctx = this.ctx, p = layout.portal, swirl = images.swirl;
    if (!ready(swirl)) return;
    const rx = lerp(p.rx, layout.front.open / 2, turn), ry = p.ry;
    const ex = this.portalX + (1 - turn) * (p.eyeX - p.cx), ey = this.portalY + (1 - turn) * (p.eyeY - p.cy);
    const sx = rx / ry;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(this.portalX, this.portalY, rx - 5, ry - 8, 0, 0, Math.PI * 2); ctx.clip();
    if (cover > 0) {
      ctx.globalAlpha = cover; ctx.fillStyle = '#0c5a4f';
      ctx.fillRect(this.portalX - rx, this.portalY - ry, rx * 2, ry * 2);
      ctx.globalAlpha = 1;
    }
    this.drawSwirl(swirl, ex, ey, sx, this.spin * 0.6, 1);
    ctx.globalCompositeOperation = 'lighter';
    const scales = [0.82, 0.6, 0.38], speeds = [1, 1.6, 2.4];
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.18 + 0.4 * wake - i * 0.03;
      this.drawSwirl(swirl, ex, ey, sx, this.spin * speeds[i] + i * 1.9, scales[i]);
    }
    const gw = rx / p.rx;
    ctx.globalAlpha = 0.3 + 0.12 * Math.sin(t * 2.3) + 0.6 * wake;
    ctx.drawImage(this.glowTeal, ex - (70 + 40 * wake) * gw, ey - 120 - 50 * wake, (140 + 80 * wake) * gw, 240 + 100 * wake);
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = '#9ff7dd';
    ctx.lineWidth = 5;
    ctx.globalAlpha = 0.12 + 0.5 * wake;
    ctx.beginPath(); ctx.ellipse(this.portalX, this.portalY, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  /** The swirl sprite in the portal plane: unsquashed to a disc, turned, squashed to an oval `sx` wide (of its height). */
  private drawSwirl(swirl: HTMLImageElement, ex: number, ey: number, sx: number, angle: number, scale: number) {
    const ctx = this.ctx, p = layout.portal;
    ctx.save();
    ctx.translate(ex, ey); ctx.scale(scale * sx, scale); ctx.rotate(angle); ctx.scale(p.ry / p.rx, 1);
    ctx.drawImage(swirl, layout.swirl.x - p.eyeX, layout.swirl.y - p.eyeY);
    ctx.restore();
  }

  /** Energy rings rolling out from the eye, in the portal's own (tilted) plane. */
  private drawRings(zoom: number) {
    const ctx = this.ctx, squash = layout.front.open / 2 / layout.portal.ry;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < RINGS; i++) {
      const age = this.rings[i];
      if (age < 0) continue;
      const ry = (60 + age * 560) * zoom, rx = ry * (squash + (1 - squash) * 0.45);
      const fade = (1 - age / 1.2) ** 1.5;
      ctx.globalAlpha = 0.55 * fade;
      ctx.strokeStyle = '#3ff0c4'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.ellipse(this.portalX, this.portalY, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.8 * fade;
      ctx.strokeStyle = '#e4fff6'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(this.portalX, this.portalY, rx - 3, ry - 3, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /**
   * The dive: the front-on opening (an oval, zoomed) widens into a circle and, inside it,
   * copies of the swirl stream toward the camera from deep in the tunnel, each turning
   * counter-clockwise, the deeper ones faster. Nearest-neighbour scaling keeps the pixels.
   */
  private drawTunnel(z: number, zoom: number, covered: boolean) {
    const ctx = this.ctx, kx = this.kx, ky = this.ky, c = layout.center, p = layout.portal, swirl = images.swirl;
    if (!ready(swirl)) return;
    const tr = this.tunnelRadii(z, zoom), rx = tr[0], ry = tr[1];
    const open = smooth(0, 0.22, z);
    ctx.save();
    // Clipping costs on every draw inside it: skip it once the opening fills the screen.
    if (!covered) { ctx.beginPath(); ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2); ctx.clip(); }
    ctx.globalAlpha = covered ? 1 : 0.8 * open;
    ctx.fillStyle = '#04352c';
    ctx.fillRect(0, 0, ART_W, ART_H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.imageSmoothingEnabled = false;
    const half = layout.swirl.h / 2, unsquash = p.ry / p.rx;
    const ex = p.eyeX - layout.swirl.x, ey = p.eyeY - layout.swirl.y;
    for (let i = 0; i < TUNNEL_LAYERS; i++) {
      const d = (i / TUNNEL_LAYERS + this.tunnel) % 1;          // 0 deep in the tunnel → 1 at the camera
      const size = ry * 0.05 * Math.pow(40, d);
      const k = size / half;
      ctx.globalAlpha = open * 0.62 * Math.sin(Math.PI * d);
      ctx.setTransform(kx, 0, 0, ky, 0, 0);
      ctx.translate(c.x, c.y);
      ctx.scale(rx / ry, 1);
      ctx.rotate(this.spin * (1 + 1.7 * (1 - d)) + i * 0.83);
      ctx.scale(k * unsquash, k);
      ctx.drawImage(swirl, -ex, -ey);
    }
    ctx.setTransform(kx, 0, 0, ky, 0, 0);
    ctx.globalAlpha = open * (0.5 + 0.5 * z);
    const g = ry * (0.5 + z);
    ctx.drawImage(this.glowTeal, c.x - g * 0.8, c.y - g, g * 1.6, g * 2);
    ctx.restore();
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
  private swirlLayer(swirl: HTMLImageElement, angle: number, scale = 1) {
    const ctx = this.ctx, p = layout.portal, squash = p.rx / p.ry;
    ctx.translate(p.eyeX, p.eyeY); ctx.scale(scale, scale); ctx.scale(squash, 1); ctx.rotate(angle); ctx.scale(1 / squash, 1); ctx.translate(-p.eyeX, -p.eyeY);
    ctx.drawImage(swirl, layout.swirl.x, layout.swirl.y);
  }

  /** Light runs outward along the painted energy streaks. */
  private drawStreakFlow(t: number, surge: number, alpha = 1) {
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
    ctx.globalAlpha = 0.75 * alpha;
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
    const ctx = this.ctx, ga = this.ga;
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = ga;
    ctx.drawImage(this.bar, b.x, b.y);
    if (w > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (0.55 + 0.15 * Math.sin(t * 6)) * ga;
      ctx.drawImage(this.glowGold, b.x + w - 40, b.y - 30, 80, b.h + 60);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    for (let c = 0; c < 2; c++) {
      ctx.fillStyle = c ? '#fff4b0' : '#9fffe0';
      for (const s of this.sparks) {
        if (s.life <= 0 || s.color !== c) continue;
        ctx.globalAlpha = (s.life / s.max) * ga;
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
      ctx.globalAlpha = 0.75 * d.life / d.max * this.ga;
      ctx.fillStyle = '#b9ab90';
      ctx.fillRect(Math.round(d.x), Math.round(d.y), d.size, d.size);
    }
    ctx.globalAlpha = this.ga;
    if (!ready(img)) { ctx.globalAlpha = 1; return; }
    // Whole-device-pixel scale and position: crisp, never shimmering.
    const s = Math.max(1, Math.round((WIZARD_ART_HEIGHT * this.ky) / wizard.h));
    const x = Math.round(this.wizX * this.kx - wizard.eyeX * s);
    const y = Math.round((layout.bar.y - 12 + this.gy) * this.ky - wizard.ground * s);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, this.frame * wizard.w, 0, wizard.w, wizard.h, x, y, wizard.w * s, wizard.h * s);
    ctx.setTransform(this.kx, 0, 0, this.ky, 0, 0);
    ctx.globalAlpha = 1;
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

  /** Dev: frame interval and work per transition stage, from real frames. */
  transitionReport() {
    const out: Record<string, { frames: number; fps: number; avgMs: number; p95Ms: number; maxMs: number; over20ms: number; workAvgMs: number; workMaxMs: number }> = {};
    TRANSITION.forEach((name, si) => {
      const f: number[] = [], w: number[] = [];
      for (let i = 0; i < this.tN; i++) if (this.tStage[i] === si) { f.push(this.tFrame[i]); w.push(this.tWork[i]); }
      if (!f.length) return;
      const sorted = [...f].sort((a, b) => a - b), avg = f.reduce((a, b) => a + b, 0) / f.length;
      out[name] = { frames: f.length, fps: 1000 / avg, avgMs: avg, p95Ms: sorted[Math.floor(f.length * 0.95)], maxMs: sorted[f.length - 1],
        over20ms: f.filter(v => v > 20).length, workAvgMs: w.reduce((a, b) => a + b, 0) / w.length, workMaxMs: Math.max(...w) };
    });
    return out;
  }

  private measure(frameMs: number, workMs: number, dt: number) {
    const si = TRANSITION.indexOf(this.phase);
    if (si >= 0 && this.tN < this.tFrame.length) { this.tFrame[this.tN] = frameMs; this.tWork[this.tN] = workMs; this.tStage[this.tN] = si; this.tN++; }
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

/** Darkness everywhere but a pool of light around (cx, cy), at quarter resolution (drawn stretched). */
function vignette(cx: number, cy: number) {
  const w = ART_W / 4, h = ART_H / 4, c = canvasOf(w, h), x = c.getContext('2d')!;
  const g = x.createRadialGradient(cx, cy, 30, cx, cy, 190);
  g.addColorStop(0, 'rgba(1,8,6,0)');
  g.addColorStop(0.45, 'rgba(1,8,6,0.35)');
  g.addColorStop(1, 'rgba(1,8,6,0.85)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
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

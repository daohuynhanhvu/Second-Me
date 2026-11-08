import { getWizardSheet } from './wizardSprite.ts';
import { GameRenderer } from './renderer.ts';
import { LEVELS } from '../logic/levels.ts';
import { INTRO_VOICE } from '../logic/voice.ts';
import { INTRO, BOSS_STEPS, KAEL_STEPS, clamp01, lerp, easeOutCubic, easeInCubic, easeInOutCubic, seg } from '../logic/introTimeline.ts';

/**
 * Cinematic intro director, drawn in 1280x720 logical space onto a canvas whose backing store
 * matches the real screen (the component passes the scale `k`).
 *
 * One pixel density per shot: every scene is rendered into a LOW-RES layer where one layer pixel
 * is one art pixel (Kael's and the Guardian's sprites are drawn 1:1, Aeris's painted frames are
 * converted to pixel art once at load, painted backdrops/foliage are resampled into the grid), then
 * that layer is scaled up with nearest-neighbour. Effects (light, slashes, particles, runes) go to
 * a second low-res layer of the same density, composited additively. Only typography is drawn at
 * full resolution, so text stays sharp.
 *
 *   S1 0-5    forest awakening      S2 5-10   ancient path        S3 10-15  heroes
 *   S4 15-19  boss awakening        S5 19-22  combat showcase     S6 22-28  logo
 *   S7 28-29.4 fade to black, then the component reveals the main menu (never two logos).
 */
export const W = 1280, H = 720;
const BASE = import.meta.env?.BASE_URL ?? '/';
type Lang = 'en' | 'vi';
type Ctx = CanvasRenderingContext2D;
type RGB = [number, number, number];

interface Sheet { img: HTMLImageElement; fw: number; fh: number; cols: number; frames: number }
interface Mote { x: number; y: number; vx: number; vy: number; age: number; max: number; size: number; rgb: RGB; mode: 0 | 1 | 2; seed: number; g: number }
interface Shot { start: number; end: number; level: number; from: [number, number, number]; to: [number, number, number] }
interface PixelSprite { c: HTMLCanvasElement; eyes: [number, number][] }

const ready = (i: HTMLImageElement | undefined | null): i is HTMLImageElement => !!i && i.complete && i.naturalWidth > 0;
const load = (src: string) => { const i = new Image(); i.src = `${BASE}${src}`; return i; };
function makeCanvas(w: number, h: number) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${clamp01(a)})`;

const C = INTRO.cue;
const TEXT = {
  en: { aeris: 'AERIS', aerisSub: 'MAGE OF ECHOES', kael: 'KAEL', kaelSub: 'SWORDSMAN OF THE EMBER', eyebrow: 'CHAPTER II · THE EMBERFORGE', tag: 'ECHOES OF THE WILD' },
  vi: { aeris: 'AERIS', aerisSub: 'PHÁP SƯ TIẾNG VỌNG', kael: 'KAEL', kaelSub: 'KIẾM SĨ CỦA LỬA THIÊNG', eyebrow: 'CHƯƠNG II · LÒ RÈN EMBERFORGE', tag: 'TIẾNG VỌNG CỦA RỪNG HOANG' },
} as const;

/** Screen pixels per art pixel, per scene. Changes only behind a black dip or the whiteout. */
const pxAt = (t: number) => (t < INTRO.s3 ? 4 : t < INTRO.s4 ? 7 : t < INTRO.s6 ? 5 : 4);

// Backdrops are the game's own levels; overlapping windows dissolve into each other.
const FADE = 0.6;
const SHOTS: Shot[] = [
  { start: 0, end: 5.6, level: 0, from: [640, 380, 1.0], to: [660, 340, 1.28] },
  { start: 5, end: 8.0, level: 2, from: [420, 420, 1.45], to: [860, 380, 1.45] },
  { start: 7.4, end: 10.4, level: 4, from: [860, 260, 1.35], to: [540, 460, 1.55] },
  { start: 10, end: 15.4, level: 3, from: [640, 360, 1.08], to: [640, 350, 1.16] },
  { start: 15, end: 22.4, level: 5, from: [640, 360, 1.04], to: [640, 360, 1.04] },
];
// Ground runes in the opening shot (world coordinates of level 0) and the cue each one answers.
const RUNES: [number, number, number][] = [[330, 560, C.rune1], [1010, 540, C.rune2], [700, 610, C.rune3]];

const COL = {
  mote: [196, 236, 170] as RGB, cyan: [120, 230, 255] as RGB, ice: [190, 245, 255] as RGB, warm: [255, 206, 128] as RGB,
  ember: [255, 150, 70] as RGB, white: [255, 255, 240] as RGB, core: [255, 120, 70] as RGB, dust: [150, 132, 110] as RGB,
};

/** A low-resolution render target: one pixel = one art pixel at the current density. */
class PixelLayer {
  c = makeCanvas(1, 1); g = this.c.getContext('2d')!; px = 0; w = 1; h = 1;
  begin(px: number, fill: string | null): Ctx {
    if (px !== this.px) { this.px = px; this.w = Math.ceil(W / px); this.h = Math.ceil(H / px); this.c.width = this.w; this.c.height = this.h; }
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.imageSmoothingEnabled = false;
    if (fill) { g.fillStyle = fill; g.fillRect(0, 0, this.w, this.h); } else g.clearRect(0, 0, this.w, this.h);
    return g;
  }
}

export class CinematicIntro {
  private renderer: InstanceType<typeof GameRenderer> | null = null;
  private worlds = [makeCanvas(W, H), makeCanvas(W, H), makeCanvas(W, H)];
  private worldByShot = new Map<number, HTMLCanvasElement>();
  private frameNo = 0;
  private scene = new PixelLayer();
  private fx = new PixelLayer();
  private vignette = makeCanvas(160, 90);
  private mist = makeCanvas(64, 32);
  private tintC = makeCanvas(192, 128);
  private logo = makeCanvas(1, 1);
  private logoTmp = makeCanvas(1, 1);
  private parts: Mote[] = [];
  private spawnAcc = 0;
  private lastT = 0;
  private fired = new Set<string>();
  private shakes: { at: number; amp: number; decay: number }[] = [];
  private flash = { at: -99, a: 0, rgb: [235, 250, 255] as RGB };
  private wiz: { frames: PixelSprite[]; w: number; h: number } | null = null;
  private sold: Record<'Idle' | 'Walk' | 'Attack01', Sheet>;
  private boss: Sheet;
  private bossCore: Map<string, [number, number]> | null = null;
  private runeSheet: Sheet;
  private plants: Sheet[];
  private plantsDark: HTMLCanvasElement[] | null = null;

  constructor(private lang: Lang, private reduced: boolean) {
    try { this.renderer = new GameRenderer(); } catch { this.renderer = null; }
    const sheet = (src: string, fw: number, fh: number, cols: number, frames: number): Sheet => ({ img: load(src), fw, fh, cols, frames });
    this.sold = { Idle: sheet('assets/soldier/Soldier_Idle.png', 100, 100, 6, 6), Walk: sheet('assets/soldier/Soldier_Walk.png', 100, 100, 8, 8), Attack01: sheet('assets/soldier/Soldier_Attack01.png', 100, 100, 6, 6) };
    this.boss = sheet('assets/frost-guardian/sheet.png', 192, 128, 16, 16);
    this.runeSheet = sheet('assets/magic-effects/rune.png', 32, 32, 18, 18);
    this.plants = [sheet('assets/nature/glowPlant.png', 128, 128, 10, 30), sheet('assets/nature/blueFlower.png', 128, 128, 10, 20)];
    this.buildVignette(); this.buildMist(); this.buildLogo();
  }

  // ---------- one-time builds ----------
  private buildVignette() {
    const g = this.vignette.getContext('2d')!, w = 160, h = 90;
    const r = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.95);
    r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.8)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  }
  private buildMist() {
    const g = this.mist.getContext('2d')!;
    const r = g.createRadialGradient(32, 16, 0, 32, 16, 32);
    r.addColorStop(0, 'rgba(150,190,170,1)'); r.addColorStop(1, 'rgba(150,190,170,0)');
    g.setTransform(1, 0, 0, 0.5, 0, 8); g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }
  /** Same lockup as the main menu: SECOND / ME on two lines, ME in sage. Light, not glowing. */
  private buildLogo() {
    const font = this.lang === 'vi' ? '300 120px "Segoe UI", Arial, sans-serif' : '300 120px Georgia, "Times New Roman", serif';
    const spacing = 14;
    const probe = this.logo.getContext('2d')!;
    probe.font = font; (probe as unknown as { letterSpacing: string }).letterSpacing = `${spacing}px`;
    const w = Math.ceil(probe.measureText('SECOND').width) + 120, h = 310;
    this.logo.width = this.logoTmp.width = w; this.logo.height = this.logoTmp.height = h;
    const g = this.logo.getContext('2d')!;
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.font = font;
    (g as unknown as { letterSpacing: string }).letterSpacing = `${spacing}px`;
    const draw = (s: string, y: number, color: string) => {
      g.shadowColor = 'rgba(146,209,151,.35)'; g.shadowBlur = 16; g.fillStyle = color; g.fillText(s, w / 2 + spacing / 2, y);
      g.shadowBlur = 0; g.fillText(s, w / 2 + spacing / 2, y);
    };
    draw('SECOND', 150, '#edf3dc');
    draw('ME', 276, '#a5c89b');
  }
  /** Reuse Aeris's in-game sprite in the cinematic. */
  private buildWizard() {
    if (this.wiz) return;
    const sheet = getWizardSheet(); if (!sheet) return;
    const size = 28;
    const frames = Array.from({length: 8}, (_, frame) => {
      const c = makeCanvas(size, size), g = c.getContext('2d')!;
      g.imageSmoothingEnabled = false;
      g.drawImage(sheet, frame * 256, 512, 256, 256, 0, 0, size, size);
      return {c, eyes: [] as [number, number][]};
    });
    this.wiz = {frames, w: size, h: size};
  }
  /** Where the Guardian's glowing core sits in every frame (art pixels inside the 192x128 cell). */
  private buildBossCore() {
    if (this.bossCore || !ready(this.boss.img)) return;
    const s = this.boss, c = makeCanvas(s.img.naturalWidth, s.img.naturalHeight), g = c.getContext('2d', { willReadFrequently: true })!;
    g.drawImage(s.img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data, map = new Map<string, [number, number]>();
    for (let row = 0; row < 5; row++) for (let fr = 0; fr < 16; fr++) {
      let sx = 0, sy = 0, n = 0;
      for (let y = 20; y < 80; y++) for (let x = 40; x < 150; x++) {
        const i = ((row * 128 + y) * c.width + fr * 192 + x) * 4;
        const hex = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
        if (d[i + 3] > 200 && (hex === 0x3f102a || hex === 0x713440)) { sx += x; sy += y; n++; }
      }
      map.set(`${row}:${fr}`, n > 3 ? [sx / n, sy / n] : [95, 50]);
    }
    this.bossCore = map;
  }
  private buildPlantsDark() {
    if (this.plantsDark || !this.plants.every(p => ready(p.img))) return;
    this.plantsDark = this.plants.map(p => {
      const c = makeCanvas(p.img.naturalWidth, p.img.naturalHeight), g = c.getContext('2d')!;
      g.drawImage(p.img, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(3,10,8,.86)'; g.fillRect(0, 0, c.width, c.height);
      return c;
    });
  }

  // ---------- helpers ----------
  private once(key: string, at: number, t: number, fn: () => void) { if (t >= at && !this.fired.has(key)) { this.fired.add(key); fn(); } }
  private shake(t: number, amp: number, decay = 5) { if (!this.reduced) this.shakes.push({ at: t, amp, decay }); }
  private doFlash(t: number, a: number, rgb: RGB = [235, 250, 255]) { this.flash = { at: t, a: this.reduced ? a * 0.35 : a, rgb }; }
  private spawn(m: Partial<Mote> & { x: number; y: number }) {
    if (this.parts.length > 320) return;
    this.parts.push({ vx: 0, vy: 0, age: 0, max: 3, size: 1, rgb: COL.mote, mode: 0, seed: Math.random() * 100, g: 0, ...m });
  }
  private burst(x: number, y: number, n: number, speed: number, rgb: RGB, max: number, g = 260, size = 1, mode: 0 | 1 | 2 = 1) {
    const count = Math.round(n * (this.reduced ? 0.4 : 1));
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (0.3 + Math.random() * 0.7);
      this.spawn({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * 0.25, max: max * (0.6 + Math.random() * 0.6), size: Math.random() < 0.3 ? size + 1 : size, rgb, mode, g });
    }
  }
  /** Animation clock with hit-stops: characters freeze for a few frames on impact. */
  private animT(t: number) {
    const stops: [number, number][] = [[C.impact, 0.08], [C.clash, 0.06]];
    return stops.reduce((acc, [a, len]) => acc - Math.min(len, Math.max(0, t - a)), t);
  }

  /** Banded (stepped) radial light, the pixel-art way of drawing a glow. Layer coordinates. */
  private glow(f: Ctx, x: number, y: number, r: number, rgb: RGB, a: number, sy = 1) {
    if (a <= 0.003 || r <= 0) return;
    f.save(); f.translate(x, y); f.scale(1, sy); f.fillStyle = rgba(rgb, 1);
    const steps = [0.1, 0.16, 0.26, 0.42];
    steps.forEach((s, i) => { f.globalAlpha = a * s; f.beginPath(); f.arc(0, 0, Math.max(1, r * (1 - i * 0.24)), 0, Math.PI * 2); f.fill(); });
    f.restore();
  }
  private ring(f: Ctx, x: number, y: number, rx: number, ry: number, rgb: RGB, a: number, lw = 1) {
    if (a <= 0.003 || rx <= 0) return;
    f.save(); f.globalAlpha = clamp01(a); f.strokeStyle = rgba(rgb, 1); f.lineWidth = lw;
    f.beginPath(); f.ellipse(x, y, rx, Math.max(0.5, ry), 0, 0, Math.PI * 2); f.stroke(); f.restore();
  }
  /** 4-point pixel star. */
  private star(f: Ctx, x: number, y: number, arm: number, rgb: RGB, a: number) {
    if (a <= 0.003) return;
    x = Math.round(x); y = Math.round(y);
    f.save(); f.globalAlpha = clamp01(a); f.fillStyle = rgba(rgb, 1);
    f.fillRect(x, y - arm, 1, arm * 2 + 1); f.fillRect(x - arm, y, arm * 2 + 1, 1);
    if (arm >= 2) { f.globalAlpha = clamp01(a) * 0.6; f.fillRect(x - 1, y - 1, 3, 3); }
    f.restore();
  }
  private shakeOffset(t: number) {
    let x = 0, y = 0;
    this.shakes = this.shakes.filter(s => t - s.at < 2.5 && t >= s.at - 0.01);
    for (const s of this.shakes) { const a = s.amp * Math.exp(-(t - s.at) * s.decay); x += Math.sin(t * 73 + s.at) * a; y += Math.cos(t * 89 + s.at * 2) * a; }
    // Low continuous tremor while the Guardian stirs in the dark.
    if (!this.reduced) { const tr = 1.6 * seg(t, 15.3, 16.2) * (1 - seg(t, C.step, C.step + 0.3)); x += Math.sin(t * 41) * tr; y += Math.cos(t * 37) * tr; }
    return [Math.round(x), Math.round(y)];
  }

  // ---------- backdrop ----------
  private shotCam(s: Shot, t: number) {
    const u = easeInOutCubic(seg(t, s.start, s.end)), m = this.reduced ? 0.3 : 1;
    const z = lerp(s.from[2], lerp(s.from[2], s.to[2], u), m);
    const cx = lerp(s.from[0], lerp(s.from[0], s.to[0], u), m), cy = lerp(s.from[1], lerp(s.from[1], s.to[1], u), m);
    return { z, cx: Math.min(W - W / (2 * z), Math.max(W / (2 * z), cx)), cy: Math.min(H - H / (2 * z), Math.max(H / (2 * z), cy)) };
  }
  private drawBackdrop(g: Ctx, t: number, dt: number, px: number) {
    this.frameNo++;
    const live = SHOTS.filter(s => t >= s.start && t <= s.end + FADE).slice(-2);
    for (const s of live) {
      const idx = SHOTS.indexOf(s);
      let world = this.worldByShot.get(idx);
      const fresh = !world;
      if (!world) { world = this.worlds.find(c => ![...this.worldByShot.values()].includes(c)) ?? makeCanvas(W, H); this.worldByShot.set(idx, world); }
      if (fresh || this.frameNo % 2 === idx % 2) this.renderWorld(world, s.level, t);
      const a = s.start === 0 ? 1 : easeInOutCubic(seg(t, s.start, s.start + FADE));
      const { z, cx, cy } = this.shotCam(s, t);
      // Resample the painted map into the pixel grid (area-filtered on the way down).
      g.save(); g.globalAlpha = a; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.setTransform(z / px, 0, 0, z / px, (W / 2 - cx * z) / px, (H / 2 - cy * z) / px);
      g.drawImage(world, 0, 0); g.restore();
    }
    for (const k of [...this.worldByShot.keys()]) if (!live.includes(SHOTS[k])) this.worldByShot.delete(k);
    this.renderer?.update(dt, false);
  }
  private renderWorld(world: HTMLCanvasElement, level: number, t: number) {
    const wc = world.getContext('2d')!;
    if (this.renderer) {
      try { this.renderer.render(wc, W, H, LEVELS[level] ?? LEVELS[0], { x: -999, y: -999, direction: 'right', isMoving: false }, null, false, 0, [], t); return; } catch { /* plain backdrop */ }
    }
    wc.fillStyle = '#0b1a14'; wc.fillRect(0, 0, W, H);
  }
  private drawMist(g: Ctx, t: number, px: number, strength: number) {
    if (strength <= 0) return;
    g.save(); g.imageSmoothingEnabled = true; g.globalAlpha = 0.15 * strength;
    for (let i = 0; i < 6; i++) {
      const sp = 14 + i * 5, x = ((t * sp + i * 330) % (W + 700)) - 350, y = 130 + i * 100 + Math.sin(t * 0.3 + i) * 24, s = 520 + (i % 3) * 140;
      g.drawImage(this.mist, (x - s / 2) / px, (y - s / 4) / px, s / px, s / 2 / px);
    }
    g.restore();
  }
  /** Foliage resampled into the pixel grid. dark = foreground silhouette. */
  private drawPlant(g: Ctx, which: number, frame: number, x: number, yBottom: number, size: number, px: number, alpha: number, dark: boolean, flip = false) {
    const s = this.plants[which]; if (!ready(s.img) || alpha <= 0) return;
    const src = dark && this.plantsDark ? this.plantsDark[which] : s.img;
    const f = frame % s.frames, w = size / px;
    g.save(); g.globalAlpha = alpha; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.translate(Math.round(x / px), Math.round(yBottom / px)); if (flip) g.scale(-1, 1);
    g.drawImage(src, (f % s.cols) * s.fw, Math.floor(f / s.cols) * s.fh, s.fw, s.fh, -w / 2, -w, w, w);
    g.restore();
  }

  // ---------- sprites (layer coordinates = art pixels) ----------
  private tinted(img: CanvasImageSource, sx: number, sy: number, sw: number, sh: number, color: string) {
    const c = this.tintC, g = c.getContext('2d')!;
    if (c.width < sw || c.height < sh) { c.width = Math.max(c.width, sw); c.height = Math.max(c.height, sh); }
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, c.width, c.height);
    g.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, sw, sh);
    return c;
  }
  private shadow(g: Ctx, x: number, y: number, w: number, a: number) {
    if (a <= 0) return;
    g.save(); g.globalAlpha = a * 0.45; g.fillStyle = '#000'; g.fillRect(Math.round(x - w), Math.round(y), Math.round(w * 2), 1);
    g.globalAlpha = a * 0.3; g.fillRect(Math.round(x - w + 1), Math.round(y + 1), Math.max(1, Math.round(w * 2 - 2)), 1); g.restore();
  }
  private soldier(g: Ctx, clip: 'Idle' | 'Walk' | 'Attack01', frame: number, x: number, y: number, a: number, tint?: string) {
    const s = this.sold[clip]; if (a <= 0 || !ready(s.img)) return;
    const sx = (frame % s.frames) * s.fw;
    if (!tint) this.shadow(g, x, y + 1, 6, a);
    g.save(); g.globalAlpha = a;
    // Feet sit at (50,60) inside the 100px cell.
    g.drawImage(tint ? this.tinted(s.img, sx, 0, s.fw, s.fh, tint) : s.img, tint ? 0 : sx, 0, s.fw, s.fh, Math.round(x) - 50, Math.round(y) - 60, s.fw, s.fh);
    g.restore();
  }
  private bossSprite(g: Ctx, row: number, frame: number, x: number, y: number, a: number, tint?: string) {
    const s = this.boss; if (a <= 0 || !ready(s.img)) return;
    const sx = frame * s.fw, sy = row * s.fh;
    if (!tint) this.shadow(g, x, y + 1, 22, a);
    g.save(); g.globalAlpha = a;
    // Source art faces left (toward the heroes); feet at (95,110).
    g.drawImage(tint ? this.tinted(s.img, sx, sy, s.fw, s.fh, tint) : s.img, tint ? 0 : sx, tint ? 0 : sy, s.fw, s.fh, Math.round(x) - 95, Math.round(y) - 110, s.fw, s.fh);
    g.restore();
  }
  private coreAt(row: number, frame: number, x: number, y: number): [number, number] {
    const c = this.bossCore?.get(`${row}:${frame}`) ?? [95, 50];
    return [Math.round(x) - 95 + c[0], Math.round(y) - 110 + c[1]];
  }
  /** Feet-anchored pixel Aeris; `reveal` < 1 materialises it from the feet up. Returns eye pixels. */
  private wizard(g: Ctx, ta: number, x: number, y: number, a: number, reveal = 1, tint?: string): [number, number][] {
    const wz = this.wiz; if (!wz || a <= 0 || reveal <= 0) return [];
    const fr = wz.frames[Math.floor(ta * 14) % wz.frames.length];
    const left = Math.round(x - wz.w / 2), top = Math.round(y) - wz.h;
    if (!tint && reveal >= 1) this.shadow(g, x, y + 1, 6, a);
    const rows = Math.max(1, Math.ceil(wz.h * clamp01(reveal)));
    g.save(); g.globalAlpha = a;
    const src = tint ? this.tinted(fr.c, 0, 0, wz.w, wz.h, tint) : fr.c;
    g.drawImage(src, 0, wz.h - rows, wz.w, rows, left, top + wz.h - rows, wz.w, rows);
    g.restore();
    return fr.eyes.filter(([, ey]) => ey >= wz.h - rows).map(([ex, ey]) => [left + ex, top + ey]);
  }

  // ---------- typography (full resolution) ----------
  private serif() { return this.lang === 'vi' ? '"Segoe UI", Arial, sans-serif' : 'Georgia, "Times New Roman", serif'; }
  private text(ctx: Ctx, str: string, x: number, y: number, o: { size: number; font?: string; color?: string; alpha: number; spacing?: number; align?: CanvasTextAlign; weight?: string; style?: string }) {
    if (o.alpha <= 0.003) return;
    ctx.save(); ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `${o.style ?? ''} ${o.weight ?? '400'} ${o.size}px ${o.font ?? 'system-ui, "Segoe UI", Arial, sans-serif'}`;
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${o.spacing ?? 0}px`;
    ctx.fillStyle = '#020806'; ctx.globalAlpha = clamp01(o.alpha) * 0.7; ctx.fillText(str, x + 2, y + 2);
    ctx.globalAlpha = clamp01(o.alpha); ctx.fillStyle = o.color ?? '#e6ecd6'; ctx.fillText(str, x, y);
    ctx.restore();
  }
  /** Character name: letters rise in one by one, a rule draws under them, the epithet types on. */
  private nameCard(ctx: Ctx, name: string, sub: string, x: number, y: number, t0: number, t1: number, t: number, accent: string) {
    const out = 1 - seg(t, t1 - 0.45, t1);
    if (t < t0 || out <= 0) return;
    ctx.save();
    const font = `300 56px ${this.serif()}`, spacing = 14;
    ctx.font = font; (ctx as unknown as { letterSpacing: string }).letterSpacing = `${spacing}px`;
    let cx = x;
    [...name].forEach((ch, i) => {
      const p = easeOutCubic(seg(t, t0 + i * 0.07, t0 + i * 0.07 + 0.45));
      this.text(ctx, ch, cx, y + (1 - p) * 14, { size: 56, font: this.serif(), weight: '300', spacing, alpha: p * out, align: 'left' });
      cx += ctx.measureText(ch).width;
    });
    const rule = easeInOutCubic(seg(t, t0 + 0.35, t0 + 0.95));
    ctx.globalAlpha = 0.8 * out; ctx.fillStyle = accent; ctx.fillRect(x + 2, y + 14, Math.round((cx - x - spacing) * rule), 2);
    ctx.restore();
    const n = Math.floor(sub.length * seg(t, t0 + 0.6, t0 + 0.6 + sub.length * 0.035));
    this.text(ctx, sub.slice(0, n), x + 4, y + 44, { size: 14, font: 'ui-monospace, Consolas, monospace', spacing: 5, alpha: out, align: 'left', color: accent });
  }
  /** Subtitles live inside the bottom letterbox bar: always readable, never over the art. */
  private caption(ctx: Ctx, str: string, t: number, a: number, b: number, quote: boolean) {
    const al = Math.min(seg(t, a, a + 0.45), 1 - seg(t, b - 0.45, b));
    this.text(ctx, quote ? `“${str}”` : str, W / 2, H - 31, { size: 21, alpha: al, spacing: 1, color: quote ? '#f0e2bd' : '#e3ead5', font: this.serif(), style: quote ? 'italic' : '' });
  }

  // ---------- scenes ----------
  private sceneForest(g: Ctx, f: Ctx, t: number, px: number) {
    const s1 = SHOTS[0], cam = this.shotCam(s1, Math.min(t, s1.end));
    // God rays through the canopy, breathing slowly.
    const rays = easeOutCubic(seg(t, 0.8, 3.4)) * (1 - seg(t, 9.4, 10.1));
    if (rays > 0) {
      f.save(); f.fillStyle = 'rgb(190,232,170)';
      for (let i = 0; i < 5; i++) {
        const x0 = 150 + i * 250 + Math.sin(t * 0.2 + i) * 30, w0 = 30 + (i % 3) * 18, w1 = 130 + (i % 2) * 70, sk = 230;
        f.globalAlpha = rays * 0.075 * (0.65 + 0.35 * Math.sin(t * 0.55 + i * 1.7));
        f.beginPath(); f.moveTo(x0 / px, 0); f.lineTo((x0 + w0) / px, 0); f.lineTo((x0 + w0 + sk + w1) / px, (H * 0.92) / px); f.lineTo((x0 + sk) / px, (H * 0.92) / px); f.closePath(); f.fill();
      }
      f.restore();
    }
    // Ancient runes pulse on the forest floor, one after another (scene 1, fading in scene 2).
    const runeA = seg(t, 0.6, 1.6) * (1 - seg(t, 5.6, 6.4));
    if (runeA > 0 && ready(this.runeSheet.img)) {
      for (const [wx, wy, cue] of RUNES) {
        const sx = W / 2 + (wx - cam.cx) * cam.z, sy = H / 2 + (wy - cam.cy) * cam.z;
        const kick = t >= cue ? Math.exp(-(t - cue) * 1.8) : 0;
        const a = runeA * (0.22 + 0.12 * Math.sin(t * 2.2 + wx) + 0.66 * kick);
        const fr = Math.floor(t * 10 + wx) % this.runeSheet.frames;
        f.save(); f.globalAlpha = clamp01(a);
        f.drawImage(this.runeSheet.img, fr * 32, 0, 32, 32, Math.round(sx / px) - 16, Math.round(sy / px) - 16, 32, 32); f.restore();
        this.glow(f, sx / px, sy / px, 18 + 10 * kick, COL.cyan, a * 0.5, 0.45);
        this.once(`rune${cue}`, cue, t, () => this.burst(sx, sy - 10, 8, 50, COL.cyan, 1.4, -10));
      }
    }
    // "...when the Emberforge still burned": a warm flare and rising embers.
    const em = t >= C.ember ? Math.sin(Math.PI * seg(t, C.ember, C.ember + 2.4)) : 0;
    this.glow(f, 640 / px, 250 / px, 95 / px * 4, COL.ember, 0.55 * em, 0.8);
    this.once('ember', C.ember, t, () => { for (let i = 0; i < 26; i++) this.spawn({ x: 520 + Math.random() * 240, y: 330 + Math.random() * 80, vx: (Math.random() - 0.5) * 30, vy: -30 - Math.random() * 40, max: 2.4 + Math.random() * 1.6, rgb: Math.random() < 0.5 ? COL.ember : COL.warm, size: 1, mode: 0 }); });

    // Foliage parallax. S1: dark foreground framing that opens up as the camera pushes in.
    const s1a = 1 - seg(t, 5.0, 5.8);
    if (s1a > 0) {
      const push = (cam.z - 1) * 2.4, fr = Math.floor(t * 8);
      this.drawPlant(g, 0, fr, 90 - push * 260, H + 30, 470 + push * 260, px, s1a, true);
      this.drawPlant(g, 1, fr + 7, 1210 + push * 260, H + 40, 520 + push * 260, px, s1a, true, true);
      this.drawPlant(g, 1, fr + 3, 300 - push * 120, H - 10, 230, px, 0.75 * s1a, false);
      this.drawPlant(g, 0, fr + 11, 960 + push * 120, H - 20, 250, px, 0.75 * s1a, false, true);
    }
    // S2: two layers drift sideways at different speeds.
    const s2a = seg(t, 5.0, 5.7) * (1 - seg(t, 9.6, 10.2));
    if (s2a > 0) {
      const scroll = (t - 5) * 60;
      [{ k: 0.5, size: 270, y: H - 34, a: 0.8, n: 6, dark: false }, { k: 1.6, size: 470, y: H + 50, a: 1, n: 4, dark: true }].forEach((L, li) => {
        const span = (W + 400) / L.n;
        for (let i = 0; i < L.n + 1; i++) {
          const x = (((i * span - scroll * L.k) % (span * (L.n + 1))) + span * (L.n + 1)) % (span * (L.n + 1)) - span / 2;
          this.drawPlant(g, (i + li) % 2, Math.floor(t * 8 + i * 3), x, L.y, L.size, px, s2a * L.a, L.dark, i % 2 === 1);
        }
      });
    }
  }

  private sceneHeroes(g: Ctx, f: Ctx, t: number, ta: number, px: number) {
    if (t < C.wizard - 0.2 || t > INTRO.s4 + 0.1) return;
    const out = 1 - seg(t, 14.7, 15.05);
    const wx = 880, wy = 600, kxEnd = 420, ky = 600;
    const WX = wx / px, WY = wy / px;
    // Summoning circle: rune ring opens, a column of light, then Aeris materialises bottom-up.
    const open = easeOutCubic(seg(t, C.wizard, C.wizard + 0.6)) * out;
    const ringA = open * (1 - 0.6 * seg(t, C.wizardIn + 0.8, C.wizardIn + 1.6));
    this.ring(f, WX, WY + 1, 24 * open, 7 * open, COL.cyan, 0.85 * ringA);
    this.ring(f, WX, WY + 1, 17 * open, 5 * open, COL.ice, 0.5 * ringA);
    for (let i = 0; i < 8; i++) {
      const an = t * 0.9 + (i / 8) * Math.PI * 2;
      this.star(f, WX + Math.cos(an) * 24 * open, WY + 1 + Math.sin(an) * 7 * open, 1, COL.ice, ringA * 0.9);
    }
    if (ready(this.runeSheet.img) && open > 0) {
      f.save(); f.globalAlpha = 0.7 * ringA; f.drawImage(this.runeSheet.img, (Math.floor(t * 12) % 18) * 32, 0, 32, 32, Math.round(WX) - 16, Math.round(WY) - 30, 32, 32); f.restore();
    }
    const col = Math.sin(Math.PI * seg(t, C.wizard + 0.2, C.wizardIn + 0.9));
    if (col > 0) {
      f.save(); f.fillStyle = rgba(COL.ice, 1);
      [[9, 0.12], [6, 0.2], [3, 0.4]].forEach(([hw, a]) => { f.globalAlpha = col * a * out; f.fillRect(Math.round(WX - hw), 0, hw * 2, Math.round(WY + 1)); });
      f.restore();
    }
    this.glow(f, WX, WY - 16, 46, COL.cyan, 0.5 * open, 1);
    this.once('wiz', C.wizardIn, t, () => { this.burst(wx, wy - 120, 26, 140, COL.ice, 1.2, -20); this.doFlash(t, 0.22); });
    const reveal = easeInOutCubic(seg(t, C.wizardIn, C.wizardIn + 0.6));
    const bob = reveal >= 1 ? Math.round(Math.sin(ta * 2.1)) : 0;
    const eyes = this.wizard(g, ta, WX, WY + bob, out, reveal);
    if (reveal > 0 && reveal < 1 && this.wiz) {
      const yLine = Math.round(WY) - Math.ceil(this.wiz.h * reveal);
      f.save(); f.globalAlpha = 0.9 * out; f.fillStyle = rgba(COL.ice, 1); f.fillRect(Math.round(WX - this.wiz.w / 2) - 1, yLine, this.wiz.w + 2, 1); f.restore();
    }
    // Golden eyes kindle, and small stars orbit the mage at their own speeds.
    const eyeA = easeOutCubic(seg(t, C.wizardIn + 0.5, C.wizardIn + 1.0)) * out * (0.75 + 0.25 * Math.sin(t * 3.1));
    for (const [ex, ey] of eyes) { this.glow(f, ex + 0.5, ey + 0.5, 3, [255, 220, 90], eyeA); f.save(); f.globalAlpha = eyeA; f.fillStyle = '#fff6b0'; f.fillRect(ex, ey, 1, 1); f.restore(); }
    const orbitA = easeOutCubic(seg(t, C.wizardIn + 0.4, C.wizardIn + 1.2)) * out;
    [[16, 1.4, 0, 1], [21, -0.9, 2, 1], [12, 2.1, 4, 0], [25, 0.6, 1, 0]].forEach(([r, sp, ph, arm], i) => {
      const an = t * sp + ph, depth = Math.sin(an);
      this.star(f, WX + Math.cos(an) * r, WY - 15 + depth * r * 0.32 - i, arm, i % 2 ? COL.warm : COL.ice, orbitA * (0.55 + 0.45 * depth) * (0.7 + 0.3 * Math.sin(t * 7 + i)));
    });

    // Kael strides in from the left, plants his feet, the blade catches the light.
    const walk = seg(t, C.kael, C.kaelStop);
    const kx = lerp(-60, kxEnd, walk < 1 ? walk * (1 - 0.35 * walk * walk) / 0.65 : 1);
    const KX = Math.min(kxEnd, kx) / px, KY = ky / px;
    this.glow(f, KX, KY - 10, 40, COL.warm, 0.42 * easeOutCubic(seg(t, C.kaelStop - 0.3, C.kaelStop + 0.7)) * out, 1);
    if (t >= C.kael) {
      if (walk < 1) this.soldier(g, 'Walk', Math.floor((ta - C.kael) * 11), KX, KY, out);
      else this.soldier(g, 'Idle', Math.floor(ta * 7), KX, KY, out);
    }
    KAEL_STEPS.forEach((st, i) => this.once(`kstep${i}`, st, t, () => { const sx = lerp(-60, kxEnd, seg(st, C.kael, C.kaelStop)); for (let j = 0; j < 4; j++) this.spawn({ x: sx + (Math.random() - 0.5) * 30, y: ky - 2, vx: (Math.random() - 0.5) * 40, vy: -20 - Math.random() * 20, max: 0.5, rgb: COL.dust, mode: 1, g: 90 }); }));
    const glint = Math.sin(Math.PI * seg(t, C.draw, C.draw + 0.4));
    this.star(f, KX + 8, KY - 13, 2 + Math.round(glint), COL.white, glint * out);
  }

  private sceneBoss(g: Ctx, f: Ctx, t: number, ta: number, px: number) {
    if (t < INTRO.s4 - 0.05 || t > 22.2) return;
    const fadeEnd = 1 - seg(t, 21.9, 22.2);
    const by = 620 / px;
    // Where the Guardian stands: deep in the dark, then stepping forward into the light.
    const walkU = easeInOutCubic(seg(t, C.step, C.step + 1.0));
    let bx = lerp(1120, 1000, walkU) / px;
    // Recoil when struck.
    const rec = (at: number, amt: number) => t >= at ? amt * Math.exp(-(t - at) * 7) * Math.min(1, (t - at) * 30) : 0;
    bx += Math.round(rec(C.impact, 4) + rec(C.clash, 7));

    let row = 0, frame = Math.floor(ta * 6) % 6;
    if (t >= C.step && t < C.step + 1.0) { row = 1; frame = Math.floor((ta - C.step) * 10) % 10; }
    else if (t >= C.roar && t < C.roar + 0.9) {
      row = 4; const u = ta - C.roar;
      frame = u < 0.3 ? 2 + Math.floor(u / 0.1) : u < 0.75 ? 5 + (Math.floor(u / 0.08) % 2) : 4 - Math.min(1, Math.floor((u - 0.75) / 0.08));
    } else if (t >= C.impact && t < C.impact + 0.5) { row = 3; frame = Math.min(6, Math.floor((ta - C.impact) * 14)); }
    else if (t >= C.clash && t < C.clash + 0.7) { row = 3; frame = Math.min(6, Math.floor((ta - C.clash) * 10)); }

    // Cold light pool the Guardian walks into.
    const pool = easeOutCubic(seg(t, C.step - 0.2, C.step + 1.0)) * fadeEnd;
    this.glow(f, 1000 / px, by, 55, COL.cyan, 0.32 * pool, 0.28);
    const sil = easeOutCubic(seg(t, C.silhouette, C.silhouette + 0.7)) * fadeEnd;
    const lit = seg(t, C.step, C.step + 0.9);
    if (sil > 0) {
      if (lit > 0) this.bossSprite(g, row, frame, bx, by, lit * fadeEnd);
      if (lit < 1) this.bossSprite(g, row, frame, bx, by, sil * (1 - lit), '#06090f');
      // Hit flash: the sprite turns white for a couple of frames.
      const hf = Math.max(1 - seg(t, C.impact, C.impact + 0.09), 1 - seg(t, C.clash, C.clash + 0.1)) * (t >= C.impact ? 1 : 0);
      if (hf > 0 && t < C.clash + 0.1) this.bossSprite(g, row, frame, bx, by, hf * 0.9, '#ffffff');
      // Core / eye glows: breathing in the dark, blazing on the roar.
      const [cx, cy] = this.coreAt(row, frame, bx, by);
      const breathe = 0.6 + 0.4 * Math.sin(t * 2.6);
      const roarK = Math.sin(Math.PI * seg(t, C.roar, C.roar + 0.9));
      const coreA = sil * (0.5 * breathe + 0.6 * roarK) * fadeEnd;
      this.glow(f, cx, cy, 8 + 7 * roarK, COL.core, coreA);
      f.save(); f.globalAlpha = clamp01(coreA); f.fillStyle = '#ffd2a0'; f.fillRect(Math.round(cx) - 1, Math.round(cy), 2, 1); f.restore();
      this.once('roar', C.roar + 0.05, t, () => {
        this.shake(t, 16, 3.2); this.doFlash(t, 0.2, [170, 220, 255]);
        const [sx, sy] = [cx * px, cy * px];
        for (const p of this.parts) if (p.mode === 0) { const dx = p.x - sx, dy = p.y - sy, d = Math.hypot(dx, dy) || 1; p.vx += dx / d * 160; p.vy += dy / d * 100; }
        this.burst(sx, sy, 20, 220, COL.ice, 0.9, 120);
      });
      const sw = seg(t, C.roar + 0.05, C.roar + 0.75);
      if (sw > 0 && sw < 1) { this.ring(f, cx, cy + 10, 10 + 120 * easeOutCubic(sw), 4 + 30 * easeOutCubic(sw), COL.ice, 0.7 * (1 - sw), 1); this.ring(f, cx, cy + 10, 6 + 80 * easeOutCubic(sw), 3 + 20 * easeOutCubic(sw), COL.cyan, 0.5 * (1 - sw), 1); }
    }
    BOSS_STEPS.forEach((st, i) => this.once(`bstep${i}`, st, t, () => {
      this.shake(t, 7, 6);
      const sx = lerp(1120, 1000, easeInOutCubic(seg(st, C.step, C.step + 1.0)));
      for (let j = 0; j < 10; j++) this.spawn({ x: sx + (Math.random() - 0.5) * 140, y: 616, vx: (Math.random() - 0.5) * 120, vy: -30 - Math.random() * 50, max: 0.7, rgb: COL.dust, mode: 1, g: 160 });
    }));

    // Heroes take position in the half-light.
    const heroA = easeOutCubic(seg(t, 15.6, 16.4)) * fadeEnd;
    const WX = 230 / px, HY = 620 / px;
    // Aeris charges, then fires a jagged bolt at the core.
    const eyes = this.wizard(g, ta, WX, HY + (Math.round(Math.sin(ta * 2.1))), heroA);
    for (const [ex, ey] of eyes) { this.glow(f, ex + 0.5, ey + 0.5, 2, [255, 220, 90], heroA * 0.8); f.save(); f.globalAlpha = heroA; f.fillStyle = '#fff6b0'; f.fillRect(ex, ey, 1, 1); f.restore(); }
    const charge = seg(t, C.cast, C.bolt) * (1 - seg(t, C.clash, C.clash + 0.2));
    if (charge > 0) {
      this.ring(f, WX, HY + 1, 14 * easeOutCubic(charge), 4 * easeOutCubic(charge), COL.cyan, 0.8 * charge);
      this.glow(f, WX + 6, HY - 16, 4 + 8 * charge, COL.ice, 0.8 * charge);
    }
    const [tcx, tcy] = this.coreAt(0, 0, 1000 / px, by);
    const bolt = seg(t, C.bolt, C.clash);
    if (bolt > 0 && t < C.clash + 0.12) {
      const x0 = WX + 6, y0 = HY - 16, x1 = lerp(x0, tcx, easeInCubic(bolt) * 0.5 + bolt * 0.5), y1 = lerp(y0, tcy, bolt);
      const rnd = (i: number) => Math.sin(Math.floor(t * 30) * 12.9898 + i * 78.233) * 43758.5453 % 1;
      f.save(); f.lineCap = 'butt'; f.lineJoin = 'miter';
      [[COL.cyan, 3, 0.55], [COL.ice, 1, 1]].forEach(([rgb, lw, a]) => {
        f.strokeStyle = rgba(rgb as RGB, 1); f.lineWidth = lw as number; f.globalAlpha = a as number;
        f.beginPath(); f.moveTo(Math.round(x0), Math.round(y0));
        const n = 7; for (let i = 1; i <= n; i++) { const u = i / n; f.lineTo(Math.round(lerp(x0, x1, u) + (i < n ? rnd(i) * 3 : 0)), Math.round(lerp(y0, y1, u) + (i < n ? rnd(i + 9) * 5 : 0))); }
        f.stroke();
      });
      f.restore();
      this.glow(f, x1, y1, 7, COL.ice, 0.9);
    }

    // Kael: anticipation, dash, slash, hit-stop, leap back.
    let kx = 360 / px, clip: 'Idle' | 'Walk' | 'Attack01' = 'Idle', kf = Math.floor(ta * 7), ky = HY;
    const strikeX = 790 / px;
    if (t >= C.antic && t < C.dash) { clip = 'Attack01'; kf = 0; kx -= Math.round(3 * easeOutCubic(seg(t, C.antic, C.antic + 0.15))); }
    else if (t >= C.dash && t < C.slash) {
      const u = seg(t, C.dash, C.slash); clip = 'Walk'; kf = 3; kx = lerp(360 / px - 3, strikeX, u * u);
      for (const [dt, a] of [[0.035, 0.45], [0.07, 0.22]] as [number, number][]) { const ug = seg(t - dt, C.dash, C.slash); this.soldier(g, 'Walk', 3, lerp(360 / px - 3, strikeX, ug * ug), HY, a * heroA, '#bfeaff'); }
    } else if (t >= C.slash && t < C.back) { clip = 'Attack01'; kx = strikeX; kf = 1 + Math.min(4, Math.floor((ta - C.slash) * 14)); }
    else if (t >= C.back && t < C.back + 0.3) { const u = easeOutCubic(seg(t, C.back, C.back + 0.3)); kx = lerp(strikeX, 520 / px, u); ky = HY - Math.round(Math.sin(Math.PI * u) * 8); clip = 'Idle'; kf = 2; }
    else if (t >= C.back + 0.3) kx = 520 / px;
    this.soldier(g, clip, kf, kx, ky, heroA);
    this.star(f, 360 / px + 5, HY - 14, 2, COL.white, Math.sin(Math.PI * seg(t, C.antic + 0.05, C.antic + 0.3)) * heroA);
    // Pixel sword trail: a crescent that thins as it sweeps.
    const sl = seg(t, C.slash + 0.02, C.impact + 0.12);
    if (sl > 0 && sl < 1) {
      const cx = strikeX + 6, cy = HY - 12, r = 15, a0 = -2.1, a1 = lerp(a0, 0.9, easeOutCubic(sl * 1.3));
      f.save(); f.lineCap = 'butt';
      for (const [lw, rgb, a] of [[3, COL.warm, 0.55], [1, COL.white, 1]] as [number, RGB, number][]) {
        f.strokeStyle = rgba(rgb, 1); f.lineWidth = lw; f.globalAlpha = a * (1 - sl);
        f.beginPath(); f.arc(Math.round(cx), Math.round(cy), r, Math.max(a0, a1 - 1.6), a1); f.stroke();
      }
      f.restore();
    }
    // Impact: hit-stop, white flash, sparks, an impact star and a short shake.
    const [icx, icy] = this.coreAt(3, 0, 1000 / px, by);
    const imp = 1 - seg(t, C.impact, C.impact + 0.16);
    if (t >= C.impact && imp > 0) { this.star(f, icx - 6, icy + 6, 8, COL.white, imp); this.star(f, icx - 6, icy + 6, 4, COL.warm, imp); this.glow(f, icx - 6, icy + 6, 14, COL.warm, 0.7 * imp); }
    this.once('impact', C.impact, t, () => { this.shake(t, 12, 7); this.doFlash(t, 0.35, [255, 245, 220]); this.burst((icx - 6) * px, (icy + 6) * px, 26, 300, COL.warm, 0.7, 520); this.burst((icx - 6) * px, (icy + 6) * px, 10, 200, COL.white, 0.5, 300); });
    this.once('clash', C.clash, t, () => {
      this.shake(t, 26, 3.5); this.doFlash(t, 1, [240, 252, 255]);
      // These motes later gather into the title.
      for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, s = 120 + Math.random() * 380; this.spawn({ x: tcx * px, y: tcy * px, vx: Math.cos(a) * s, vy: Math.sin(a) * s, max: 2.6 + Math.random() * 0.8, rgb: i % 3 ? COL.ice : COL.warm, size: Math.random() < 0.3 ? 2 : 1, mode: 2 }); }
    });
    if (t >= C.clash && t < C.clash + 0.5 && ready(this.runeSheet.img)) {
      f.save(); f.globalAlpha = 1 - seg(t, C.clash + 0.2, C.clash + 0.5);
      f.drawImage(this.runeSheet.img, Math.min(17, Math.floor((t - C.clash) * 36)) * 32, 0, 32, 32, Math.round(tcx) - 16, Math.round(tcy) - 16, 32, 32); f.restore();
    }
  }

  private sceneLogoBg(f: Ctx, t: number, px: number) {
    if (t < C.gather - 0.1) return;
    // A rune circle forms behind the wordmark from the gathered light.
    const R = easeOutCubic(seg(t, C.logo - 0.2, C.logo + 0.9)), out = 1 - seg(t, INTRO.s7, INTRO.s7 + 0.5);
    const cx = 640 / px, cy = 345 / px, rx = 78 * R, ry = 50 * R;
    const a = R * out * (0.42 + 0.08 * Math.sin(t * 1.6));
    this.ring(f, cx, cy, rx, ry, COL.warm, a * 0.8);
    this.ring(f, cx, cy, rx - 5, ry - 4, COL.mote, a * 0.45);
    for (let i = 0; i < 12; i++) {
      const an = t * 0.18 + (i / 12) * Math.PI * 2;
      this.star(f, cx + Math.cos(an) * (rx - 2.5), cy + Math.sin(an) * (ry - 2), i % 3 === 0 ? 1 : 0, i % 2 ? COL.warm : COL.mote, a);
    }
    this.glow(f, cx, cy, 60, COL.warm, 0.22 * R * out, 0.7);
    this.once('logo', C.logo, t, () => this.burst(640, 345, 34, 240, COL.warm, 1.8, -10));
  }

  // ---------- particles (fx layer) ----------
  private particles(f: Ctx, t: number, dt: number, px: number) {
    const rate = t < 1 ? 4 : t < 10 ? 13 : t < 15 ? 8 : t < 19 ? 9 : t < 21 ? 5 : t < 22.6 ? 0 : t < INTRO.s7 ? 5 : 0;
    this.spawnAcc += dt * rate * (this.reduced ? 0.4 : 1);
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      const boss = t >= INTRO.s4 && t < INTRO.s6;
      this.spawn({ x: Math.random() * W, y: H * (0.3 + Math.random() * 0.62), vx: (Math.random() - 0.5) * 10, vy: -6 - Math.random() * 12, max: 4 + Math.random() * 4, size: Math.random() < 0.15 ? 2 : 1, rgb: boss ? (Math.random() < 0.6 ? COL.cyan : COL.ice) : t >= INTRO.s6 ? COL.warm : (Math.random() < 0.75 ? COL.mote : COL.warm), mode: 0 });
    }
    // Before the Guardian appears, the motes turn and drift toward the dark where it waits.
    const pull = seg(t, C.dim + 0.2, C.silhouette + 0.4) * (1 - seg(t, C.roar, C.roar + 0.05)), [px0, py0] = [1080, 420];
    const gather = t >= C.gather, gx = 640, gy = 345;
    f.save();
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i]; p.age += dt;
      if (p.age >= p.max) { this.parts.splice(i, 1); continue; }
      if (p.mode === 0) {
        p.vx += Math.sin(t * 0.9 + p.seed) * 16 * dt; p.vy += (Math.cos(t * 0.7 + p.seed * 1.3) * 10 - 3) * dt;
        if (pull > 0) { const dx = px0 - p.x, dy = py0 - p.y, d = Math.hypot(dx, dy) || 1; p.vx += dx / d * 70 * pull * dt; p.vy += dy / d * 50 * pull * dt; }
        p.vx *= 1 - 0.5 * dt; p.vy *= 1 - 0.5 * dt;
      } else if (p.mode === 1) { p.vy += p.g * dt; p.vx *= 1 - 1.6 * dt; }
      else {
        p.vx *= 1 - 2.2 * dt; p.vy *= 1 - 2.2 * dt;
        if (gather) {
          const dx = gx - p.x, dy = gy - p.y, d = Math.hypot(dx, dy);
          if (d < 10) { this.parts.splice(i, 1); continue; }
          p.vx += dx / d * 900 * dt; p.vy += dy / d * 900 * dt; p.max = Math.max(p.max, p.age + 0.5);
        }
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      const fl = p.age / p.max, a = Math.sin(Math.PI * Math.min(1, fl)) * (p.mode === 0 ? 0.75 : 1);
      f.globalAlpha = clamp01(a); f.fillStyle = rgba(p.rgb, 1);
      f.fillRect(Math.round(p.x / px), Math.round(p.y / px), p.size, p.size);
    }
    f.restore();
  }

  // ---------- frame ----------
  /** `k` = backing pixels per logical pixel; `fadeOut` 0..1 = extra fade to black (skip). */
  draw(ctx: Ctx, t: number, k = 1, fadeOut = 0) {
    const dt = Math.min(0.1, Math.max(0, t - this.lastT)); this.lastT = t;
    this.buildWizard(); this.buildBossCore(); this.buildPlantsDark();
    const L = TEXT[this.lang], px = pxAt(t), ta = this.animT(t);
    const g = this.scene.begin(px, '#020605'), f = this.fx.begin(px, null);

    // --- scene layer: backdrop, grade, mist, foliage, characters ---
    if (t < INTRO.s6 + 0.3) this.drawBackdrop(g, t, dt, px);
    const light = easeInOutCubic(seg(t, 0.4, 3.6));
    let dark = t < INTRO.s2 ? 0.95 - 0.6 * light : t < INTRO.s3 ? 0.32 : t < INTRO.s4 ? 0.5 : t < INTRO.s5 ? 0.45 : t < INTRO.s6 ? 0.55 : 1;
    if (t >= INTRO.s4 && t < INTRO.s5) dark = lerp(lerp(0.45, 0.84, easeInOutCubic(seg(t, C.dim, C.dim + 0.9))), 0.6, easeInOutCubic(seg(t, C.step, C.step + 1.0)));
    if (t >= INTRO.s5 && t < INTRO.s6) dark = lerp(0.6, 0.55, seg(t, INTRO.s5, INTRO.s5 + 0.5));
    if (t >= INTRO.s6) { g.fillStyle = '#03100b'; g.fillRect(0, 0, this.scene.w, this.scene.h); dark = 0; }
    if (dark > 0) { g.fillStyle = `rgba(3,9,8,${dark})`; g.fillRect(0, 0, this.scene.w, this.scene.h); }
    g.fillStyle = `rgba(22,70,66,${t < INTRO.s4 ? 0.12 : 0.2})`; g.fillRect(0, 0, this.scene.w, this.scene.h);
    this.drawMist(g, t, px, t < INTRO.s2 ? 1.6 : t < INTRO.s3 ? 1.1 : t < INTRO.s6 ? 0.8 : 0.5);
    if (t < INTRO.s3 + 0.3) this.sceneForest(g, f, t, px);
    this.sceneHeroes(g, f, t, ta, px);
    this.sceneBoss(g, f, t, ta, px);
    this.sceneLogoBg(f, t, px);
    g.save(); g.imageSmoothingEnabled = true; g.drawImage(this.vignette, 0, 0, this.scene.w, this.scene.h); g.restore();
    this.particles(f, t, dt, px);

    // --- composite with camera (push-in on the Guardian) and shake ---
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const [sx, sy] = this.shakeOffset(t);
    const focus = easeInOutCubic(seg(t, C.step, C.roar + 0.3)) * (1 - easeInOutCubic(seg(t, C.roar + 0.9, INTRO.s5 + 0.3)));
    const heroPush = easeInOutCubic(seg(t, INTRO.s3, INTRO.s4)) * 0.05 * (t < INTRO.s4 ? 1 : 0);
    const z = this.reduced ? 1 : 1 + 0.14 * focus + heroPush, fx = lerp(640, 990, focus), fy = lerp(360, 420, focus);
    ctx.save(); ctx.translate(fx + sx, fy + sy); ctx.scale(z, z); ctx.translate(-fx, -fy);
    ctx.drawImage(this.scene.c, 0, 0, this.scene.w * px, this.scene.h * px);
    ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(this.fx.c, 0, 0, this.fx.w * px, this.fx.h * px);
    ctx.restore();

    // --- screen-space light: flashes, scene dips, whiteout into the title ---
    const fl = this.flash.a * Math.exp(-(t - this.flash.at) * 6);
    if (fl > 0.01 && t >= this.flash.at) { ctx.fillStyle = rgba(this.flash.rgb, Math.min(1, fl)); ctx.fillRect(0, 0, W, H); }
    const dip = Math.max(1 - seg(t, 0.1, 1.0), Math.max(0, 1 - Math.abs(t - INTRO.s3) / 0.32), Math.max(0, 1 - Math.abs(t - INTRO.s4) / 0.3) * 0.85);
    if (dip > 0) { ctx.fillStyle = `rgba(0,0,0,${dip})`; ctx.fillRect(0, 0, W, H); }
    const white = this.reduced ? 0 : seg(t, C.clash, C.clash + 0.3) * (1 - seg(t, C.gather, C.gather + 0.7));
    if (white > 0) { ctx.fillStyle = `rgba(240,252,255,${white})`; ctx.fillRect(0, 0, W, H); }

    // --- typography ---
    this.nameCard(ctx, L.aeris, L.aerisSub, 975, 350, C.wizardIn + 0.35, 14.75, t, '#8fe3f2');
    this.nameCard(ctx, L.kael, L.kaelSub, 70, 392, C.kaelStop + 0.15, 15.0, t, '#f0cf8c');
    this.drawLogo(ctx, t, L);

    // --- end: fade to black (the component then reveals the menu) ---
    const black = Math.max(fadeOut, easeInOutCubic(seg(t, INTRO.s7, INTRO.s7 + 0.55)));
    // Letterbox stays constant for the whole film; subtitles sit inside the lower bar.
    const bar = 78 * easeOutCubic(seg(t, 0.15, 1.2));
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
    for (const v of INTRO_VOICE) if (t >= v.at - 0.05 && t <= v.until) this.caption(ctx, v[this.lang], t, v.at, v.until, v.role !== 'narrator');
    if (black > 0) { ctx.fillStyle = `rgba(0,0,0,${black})`; ctx.fillRect(0, 0, W, H); }
  }

  private drawLogo(ctx: Ctx, t: number, L: (typeof TEXT)[Lang]) {
    if (t < C.logo) return;
    const reveal = easeInOutCubic(seg(t, C.logo, C.logo + 1.6));
    const tc = this.logoTmp.getContext('2d')!, lw = this.logoTmp.width, lh = this.logoTmp.height, lc = lw / 2;
    tc.globalCompositeOperation = 'source-over'; tc.clearRect(0, 0, lw, lh); tc.drawImage(this.logo, 0, 0);
    // Wipe from the centre outward with a soft edge, like light spreading from the rune circle.
    tc.globalCompositeOperation = 'destination-in';
    const half = (lc + 20) * reveal + 1, g = tc.createLinearGradient(lc - half, 0, lc + half, 0), edge = Math.min(0.5, 70 / (half * 2));
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(edge, 'rgba(0,0,0,1)'); g.addColorStop(1 - edge, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    tc.fillStyle = g; tc.fillRect(0, 0, lw, lh);
    // One light sweep across the letters.
    const sw = seg(t, C.logo + 1.5, C.logo + 2.8);
    if (sw > 0 && sw < 1) {
      tc.globalCompositeOperation = 'source-atop';
      const x = lerp(-200, lw + 200, easeInOutCubic(sw)), sg = tc.createLinearGradient(x - 80, 0, x + 80, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,248,220,.8)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      tc.fillStyle = sg; tc.fillRect(0, 0, lw, lh);
    }
    const sc = lerp(1.05, 1, easeOutCubic(seg(t, C.logo, C.logo + 2.2)));
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.translate(W / 2, 345); ctx.scale(sc, sc); ctx.drawImage(this.logoTmp, -lc, -lh / 2); ctx.restore();
    this.text(ctx, L.eyebrow, W / 2, 165, { size: 14, font: 'ui-monospace, Consolas, monospace', spacing: 7, alpha: easeOutCubic(seg(t, C.logo + 0.8, C.logo + 1.8)), color: '#e0c07a' });
    this.text(ctx, L.tag, W / 2, 548, { size: 15, font: 'ui-monospace, Consolas, monospace', spacing: 10, alpha: easeOutCubic(seg(t, C.logo + 1.6, C.logo + 2.6)), color: '#c6d1b8' });
    this.text(ctx, '◇　✦　◈　✺　◆', W / 2, 590, { size: 14, spacing: 12, alpha: 0.5 * easeOutCubic(seg(t, C.logo + 2.2, C.logo + 3.2)), color: '#9eb28b' });
  }
}

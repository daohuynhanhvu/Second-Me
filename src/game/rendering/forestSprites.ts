/**
 * Hand-drawn forest art from "Secondme asset" (traps, gates, rune buttons, portals, ground,
 * props). Strips and their layout are produced by tools/assets/prepare_forest_assets.py.
 *
 * Every strip frame is aligned on the object's solid "core" box, so a frame can be drawn
 * by mapping a reference core onto the game rectangle it represents. Until an image has
 * loaded the draw helpers return false and callers keep their procedural fallback.
 */
import atlas from '../data/forestAtlas.json';

export type StripName = 'crusher' | 'rocks' | 'vines' | 'spikes' | 'portalExit' | 'portalStart' | 'door' | 'button';
interface Strip { file: string; frames: number; w: number; h: number; anchor: number[]; cores: number[][] }
const STRIPS = atlas as unknown as Record<StripName, Strip>;
const GROUND = (atlas as unknown as { ground: { file: string; w: number; h: number } }).ground;
const DECOR = (atlas as unknown as { decor: { file: string; items: number[][] } }).decor.items;

export interface Box { x: number; y: number; w: number; h: number }

const images = new Map<string, HTMLImageElement>();
function image(file: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  let img = images.get(file);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.src = `${import.meta.env.BASE_URL}assets/forest/${file}`;
    images.set(file, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

const ALL_FILES = [...Object.values(STRIPS).map(s => s.file), GROUND.file, 'decor.png'];
/** Starts every download; safe to call repeatedly. */
export function preloadForest() { for (const f of ALL_FILES) image(f); }
/** How many forest images are ready (part of cache keys, so caches rebuild as art arrives). */
export function forestLoaded() { return ALL_FILES.filter(f => image(f)).length; }
export function forestReady(...names: StripName[]) { return names.every(n => image(STRIPS[n].file) !== null); }
export const frameCount = (name: StripName) => STRIPS[name].frames;
/** Width / height of a frame's solid core. */
export const coreAspect = (name: StripName, ref = 0) => STRIPS[name].cores[ref][2] / STRIPS[name].cores[ref][3];

export interface DrawOptions {
  /** Frame whose core is mapped onto the box (keeps all frames of an animation aligned). */
  ref?: number;
  alpha?: number;
  /** Quarter turn clockwise: the art's width runs along the box's height. */
  rotate?: boolean;
  flipX?: boolean;
  /** Extra scale around the box centre (sway, pulses). */
  scale?: number;
  composite?: GlobalCompositeOperation;
}

/** Draws `frame` of a strip so that the core of frame `ref` fills `box`. */
export function drawStrip(ctx: CanvasRenderingContext2D, name: StripName, frame: number, box: Box, o: DrawOptions = {}): boolean {
  const s = STRIPS[name];
  const img = image(s.file);
  if (!img || box.w <= 0 || box.h <= 0) return false;
  const f = Math.max(0, Math.min(s.frames - 1, Math.floor(frame)));
  const [cx, cy, cw, ch] = s.cores[o.ref ?? f];
  ctx.save();
  if (o.alpha !== undefined) ctx.globalAlpha *= Math.max(0, Math.min(1, o.alpha));
  if (o.composite) ctx.globalCompositeOperation = o.composite;
  ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
  let bw = box.w, bh = box.h;
  if (o.rotate) { ctx.rotate(Math.PI / 2); [bw, bh] = [bh, bw]; }
  if (o.flipX) ctx.scale(-1, 1);
  const k = o.scale ?? 1;
  ctx.scale(k * bw / cw, k * bh / ch);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, f * s.w, 0, s.w, s.h, -(cx + cw / 2), -(cy + ch / 2), s.w, s.h);
  ctx.restore();
  return true;
}

/** Cross-fades frame `a` into frame `b` (t = 0..1), drawing `b` over `a` so opacity never dips. */
export function drawStripBlend(ctx: CanvasRenderingContext2D, name: StripName, a: number, b: number, t: number, box: Box, o: DrawOptions = {}) {
  if (!drawStrip(ctx, name, a, box, o)) return false;
  if (t > 0.01 && a !== b) drawStrip(ctx, name, b, box, { ...o, alpha: (o.alpha ?? 1) * Math.min(1, t) });
  return true;
}

/** A box of the given width centred on (x, y), with the height that keeps the core's aspect. */
export function boxAround(name: StripName, ref: number, x: number, y: number, width: number): Box {
  const h = width / coreAspect(name, ref);
  return { x: x - width / 2, y: y - h / 2, w: width, h };
}

export function groundImage() { return image(GROUND.file); }

/** Decoration props, by index in decor.png (see tools/assets/prepare_forest_assets.py). */
export const DECOR_GROUND = [6, 7, 10, 11, 12, 13, 15, 17, 18, 21, 22, 23, 25, 26, 28, 29] as const;
export const DECOR_SOLID = [0, 1, 2, 4, 5, 8, 9, 14, 16, 19, 20, 24, 27, 30] as const;
/** Long props that suit a low horizontal block; tall ones suit a column end. */
export const DECOR_LONG = [5, 8, 27, 30, 24] as const;
export const DECOR_ROUND = [0, 1, 2, 9, 20, 16, 19] as const;

export function decorSize(index: number): { w: number; h: number } {
  const it = DECOR[index];
  return it ? { w: it[2], h: it[3] } : { w: 0, h: 0 };
}
/** Draws a prop with its bottom centre at (x, y), scaled to `width` (aspect kept). */
export function drawDecor(ctx: CanvasRenderingContext2D, index: number, x: number, y: number, width: number, flipX = false): boolean {
  const img = image('decor.png');
  const it = DECOR[index];
  if (!img || !it) return false;
  const [sx, sy, sw, sh] = it;
  const h = width * sh / sw;
  ctx.save();
  ctx.translate(x, y);
  if (flipX) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, -width / 2, -h, width, h);
  ctx.restore();
  return true;
}

/**
 * pixelfx effects (public/assets/effects/fx, cut by tools/assets/prepare_pixelfx.py; table in data/pixelfx.json).
 * Every cell is drawn 1:1 around the effect's pivot, then turned and scaled about it; pixels stay sharp.
 */
import table from '../data/pixelfx.json';

export interface PfxSheet { id: string; w: number; h: number; frames: number; fps: number; loop: boolean; columns: number; pivot: number[] }
export type PfxName = keyof typeof table;
export const PFX: Record<PfxName, PfxSheet> = table;

const images: Partial<Record<PfxName, HTMLImageElement>> = {};
function sheet(name: PfxName) {
  if (typeof Image === 'undefined') return null;
  let img = images[name];
  if (!img) { img = new Image(); img.src = `${import.meta.env?.BASE_URL ?? '/'}assets/effects/fx/${name}.png`; images[name] = img; }
  return img.complete && img.naturalWidth ? img : null;
}

/** Starts loading sheets before they are first needed. */
export function preloadPfx(names: PfxName[]) { for (const n of names) sheet(n); }

/** Seconds a one-shot plays (a loop plays this long per turn). */
export const pfxSeconds = (name: PfxName) => PFX[name].frames / PFX[name].fps;

/** The cell to show at `age` s: a loop wraps, a one-shot ends (null). */
export function pfxFrame(name: PfxName, age: number): number | null {
  if (age < 0) return null;
  const s = PFX[name], f = Math.floor(age * s.fps);
  return s.loop ? f % s.frames : f < s.frames ? f : null;
}

export interface PfxDraw {
  /** Turns the effect about its pivot (radians); one aimed left is mirrored so it stays upright. */
  angle?: number;
  /** Mirrors left-right (for effects that are not turned). */
  mirror?: boolean;
  scale?: number;
  /** Extra vertical stretch about the pivot (a floor ring made taller to fit its stones). */
  scaleY?: number;
  alpha?: number;
}

/** Draws `name` as it is `age` s in, its pivot on (x, y). False when it has ended or is still loading. */
export function drawPfx(ctx: CanvasRenderingContext2D, name: PfxName, age: number, x: number, y: number, o: PfxDraw = {}) {
  const frame = pfxFrame(name, age), img = sheet(name);
  if (frame === null || !img) return false;
  const s = PFX[name], k = o.scale ?? 1;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  ctx.translate(Math.round(x), Math.round(y));
  if (o.angle !== undefined) { ctx.rotate(o.angle); if (Math.cos(o.angle) < 0) ctx.scale(1, -1); }
  ctx.scale(o.mirror ? -k : k, k * (o.scaleY ?? 1));
  ctx.drawImage(img, (frame % s.columns) * s.w, Math.floor(frame / s.columns) * s.h, s.w, s.h, -s.pivot[0], -s.pivot[1], s.w, s.h);
  ctx.restore();
  return true;
}

/** A one-shot effect in the world (GameEngine.pfx), aged by the fight's clock so hit-stop holds it too. */
export interface PfxShot extends PfxDraw {
  name: PfxName; x: number; y: number;
  /** Seconds in; below zero it has not started yet (nothing drawn). */
  age: number;
  /** Seconds it stays (a loop needs one; a one-shot defaults to its sheet). */
  life?: number;
  /** Drawn under the characters. */
  under?: boolean;
}

export function drawPfxShots(ctx: CanvasRenderingContext2D, shots: PfxShot[], under: boolean) {
  for (const s of shots) if (!!s.under === under) drawPfx(ctx, s.name, s.age, s.x, s.y, s);
}

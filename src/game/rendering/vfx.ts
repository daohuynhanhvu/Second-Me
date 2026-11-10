import {knightEffectSheet} from './knightOutfits.ts';
import type {OutfitId} from '../logic/outfits.ts';
// Sprite-sheet effects from the supplied GIFs (tools/assets/prepare_vfx_sheets.py): one row per sheet, frames
// left to right. The numbers below are the script's output; vfx.test.ts checks them against the files.

/** `size` = width the cell is drawn at, in game px; `fade` = seconds the last frame lingers, fading out. */
export const VFX_SHEETS = {
  // One-shot effects the engine starts (GameEngine.vfx):
  shieldPickup: { file: 'vfx-shield-cross', frames: 11, w: 192, h: 192, fps: 12, size: 128, fade: 0, smooth: false },   // a shield picked up
  sparkle: { file: 'vfx-sparkle', frames: 12, w: 192, h: 192, fps: 14, size: 128, fade: 0, smooth: false },             // a damage skill picked up
  healRing: { file: 'vfx-ground-ring', frames: 10, w: 384, h: 192, fps: 12, size: 256, fade: 0, smooth: false },        // Kael's Sanctuary cast
  clock: { file: 'vfx-time-clock', frames: 15, w: 160, h: 160, fps: 14, size: 112, fade: 0.35, smooth: true },          // a time potion used
  // Driven by other state:
  slash: { file: 'vfx-slash', frames: 7, w: 192, h: 192, fps: 0, size: 0, fade: 0, smooth: false },                     // Kael's sword arcs (comboFx 'arc')
  hexShield: { file: 'vfx-hex-shield', frames: 18, w: 144, h: 144, fps: 0, size: 88, fade: 0, smooth: true },           // while a picked-up shield holds
} as const;
export type VfxSheet = keyof typeof VFX_SHEETS;
export type VfxKind = 'shieldPickup' | 'sparkle' | 'healRing' | 'clock';
export interface Vfx { kind: VfxKind; x: number; y: number; age: number; /** stays on the hero instead of where it began */ follow?: boolean }

/** How long a one-shot effect lives, seconds. */
export const vfxSeconds = (kind: VfxKind) => VFX_SHEETS[kind].frames / VFX_SHEETS[kind].fps + VFX_SHEETS[kind].fade;

/** Frame and opacity of a one-shot effect at `age` seconds; null once it is over. */
export function vfxFrame(kind: VfxKind, age: number): { frame: number; alpha: number } | null {
  const s = VFX_SHEETS[kind], played = s.frames / s.fps;
  if (age < 0 || age >= played + s.fade) return null;
  return age < played ? { frame: Math.floor(age * s.fps), alpha: 1 } : { frame: s.frames - 1, alpha: 1 - (age - played) / s.fade };
}

// Hex shield sheet: 0-9 the cells assemble, 10-15 a light band sweeps down it, 16-17 it thins out and breaks.
const HEX = { build: 10, buildFps: 20, sweepFrom: 10, sweepFrames: 6, sweepFps: 14, sweepEvery: 3, breakFrom: 16, breakFrames: 2, breakFps: 10 };
/** Frame while the shield holds, `age` seconds after it appeared: assemble, then rest, with a sweep every 3 s. */
export function hexShieldFrame(age: number, still = false): number {
  if (still) return HEX.build - 1;
  if (age < HEX.build / HEX.buildFps) return Math.floor(Math.max(0, age) * HEX.buildFps);
  const cycle = (age - HEX.build / HEX.buildFps) % HEX.sweepEvery, sweep = Math.floor(cycle * HEX.sweepFps);
  return sweep < HEX.sweepFrames ? HEX.sweepFrom + sweep : HEX.build - 1;
}
/** Frame `gone` seconds after the shield ended; null once the break has played. */
export function hexShieldBreakFrame(gone: number): number | null {
  const f = Math.floor(gone * HEX.breakFps);
  return gone >= 0 && f < HEX.breakFrames ? HEX.breakFrom + f : null;
}

const images: Partial<Record<VfxSheet, HTMLImageElement>> = {};
/** Starts loading every sheet (once); call when the play scene draws, so they are ready before first use. */
export function loadVfx() {
  if (typeof Image === 'undefined' || images.slash) return;
  for (const key of Object.keys(VFX_SHEETS) as VfxSheet[]) {
    const img = new Image();
    img.src = `${import.meta.env?.BASE_URL ?? '/'}assets/effects/${VFX_SHEETS[key].file}.png`;
    images[key] = img;
  }
}
function sheet(key: VfxSheet) { const img = images[key]; return img?.complete && img.naturalWidth ? img : null; }

/** One cell, centred on (x, y), `width` game px wide. */
function drawCell(ctx: CanvasRenderingContext2D, key: VfxSheet, frame: number, x: number, y: number, width: number, alpha = 1, outfit:OutfitId='default') {
  const img = sheet(key);
  if (!img) return false;
  const s = VFX_SHEETS[key], height = width * s.h / s.w;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.imageSmoothingEnabled = s.smooth;
  ctx.drawImage(knightEffectSheet(img,outfit), frame * s.w, 0, s.w, s.h, Math.round(x - width / 2), Math.round(y - height / 2), width, height);
  ctx.restore();
  return true;
}

// Where each one-shot sits relative to its point (the hero's feet position): body height, or on the ground.
const OFFSET_Y: Record<VfxKind, number> = { shieldPickup: -18, sparkle: -18, healRing: 4, clock: -14 };

/** The engine's one-shot effects. `ground` picks the layer: under the hero (heal ring, clock) or over (the rest). */
export function drawVfx(ctx: CanvasRenderingContext2D, list: readonly Vfx[], hero: { x: number; y: number }, ground: boolean, outfit:OutfitId='default') {
  loadVfx();
  for (const fx of list) {
    if ((fx.kind === 'healRing' || fx.kind === 'clock') !== ground) continue;
    const at = vfxFrame(fx.kind, fx.age);
    if (!at) continue;
    const p = fx.follow ? hero : fx;
    drawCell(ctx, fx.kind, at.frame, p.x, p.y + OFFSET_Y[fx.kind], VFX_SHEETS[fx.kind].size, at.alpha,fx.kind==='clock'?'default':outfit);
  }
}

/**
 * Kael's sword arc from the crescent sheet: the swing wraps the cell's centre and bulges to +x, so it is turned to
 * the attack's angle about (x, y); its outer edge is 70 of the cell's 192 px from the centre, scaled to `radius`.
 * `k` runs 0 -> 1 over the arc's life. False while the sheet is not loaded (the caller draws its plain arc).
 */
export function drawSlash(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, radius: number, k: number, flip: boolean, outfit:OutfitId='default') {
  const img = sheet('slash');
  if (!img) return false;
  const s = VFX_SHEETS.slash, size = radius * 1.15 / 70 * s.w;
  const frame = Math.min(s.frames - 1, Math.floor(Math.max(0, k) * s.frames));
  ctx.save();
  ctx.globalAlpha = 1;                 // the sheet dissolves by itself
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y); ctx.rotate(angle);
  if (flip) ctx.scale(1, -1);          // the return swing mirrors the first
  ctx.drawImage(knightEffectSheet(img,outfit), frame * s.w, 0, s.w, s.h, -size / 2, -size / 2, size, size);
  ctx.restore();
  return true;
}

// The shield bubble's own clock: when it appeared and when it ended (scene seconds), and where it last was.
let shieldSince = -1, shieldGone = -1, shieldAt = { x: 0, y: 0 };
/**
 * The bubble around the hero while a picked-up shield holds, then its break. Call every frame. Returns false
 * only when the shield is up but the sheet is not loaded (the caller draws its plain ring).
 */
export function drawHexShield(ctx: CanvasRenderingContext2D, x: number, y: number, active: boolean, time: number, still: boolean, outfit:OutfitId='default') {
  if (time < shieldSince || time < shieldGone) { shieldSince = -1; shieldGone = -1; }   // a new level: the clock restarted
  if (active) {
    if (shieldSince < 0) shieldSince = time;
    shieldGone = -1; shieldAt = { x, y };
    const frame = hexShieldFrame(time - shieldSince, still);
    // See-through: the hero stays readable inside it; brighter while it assembles and during the sweep.
    return drawCell(ctx, 'hexShield', frame, x, y, VFX_SHEETS.hexShield.size, frame === HEX.build - 1 ? 0.28 : 0.5,outfit);
  }
  if (shieldSince >= 0) { shieldSince = -1; shieldGone = time; }
  if (shieldGone >= 0) {
    const frame = still ? null : hexShieldBreakFrame(time - shieldGone);
    if (frame === null) shieldGone = -1;
    else drawCell(ctx, 'hexShield', frame, shieldAt.x, shieldAt.y, VFX_SHEETS.hexShield.size, 0.6,outfit);
  }
  return true;
}

/**
 * The loading screen's forest, drawn in code as 2D pixel art: a night forest seen from the side,
 * in layers from the back:
 *   sky        dark teal, paling toward the misty floor and up right under the light shafts;
 *   far woods  two rows of trunks and crowns as silhouettes in the mist (the further, the paler),
 *              a broken rune pillar now and then;
 *   big trees  framing the clearing at the sides: bark, roots, leafy crowns, hanging vines,
 *              under a fringe of leaves along the top;
 *   floor      grass edge, moss and soil, stones, glowing mushrooms; dark bushes and ferns in front.
 *
 * One forest pixel is FOREST_PX painting pixels: the 1376x768 frame is 344x192 forest pixels,
 * scaled up with nearest-neighbour (crisp pixels). Colours come from short ramps, ordered-
 * dithered between neighbouring steps only, so gradients read as soft pixel banding. Everything
 * is placed by hashing its cell: the forest is the same every time and runs on past the frame's
 * edges as far as a screen needs (x and y may be negative or beyond the frame). Busy shapes keep
 * out of the middle, where the title, status lines, bar and (later) the arch are.
 */
import layout from '../data/loadingLayout.json';

export const FOREST_PX = 4;
export const FOREST_W = layout.width / FOREST_PX;    // 344
export const FOREST_H = layout.height / FOREST_PX;   // 192
/** Forest px: the clearing's floor. The bar runs just above it; the centred arch stands on it. */
const GROUND = 161;
/** Forest px: the middle the big trees and front bushes keep clear of. */
const OPEN_L = 66, OPEN_R = 284;

// ---------------------------------------------------------------- colour

const rgb = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const pack = ([r, g, b]: number[]) => (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;   // ABGR = RGBA bytes
/** `n` colours evenly along the stops. */
function ramp(stops: string[], n: number) {
  const c = stops.map(rgb), out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1) * (c.length - 1), j = Math.min(c.length - 2, Math.floor(t)), k = t - j;
    out.push(pack(c[j].map((v, ch) => Math.round(v + (c[j + 1][ch] - v) * k))));
  }
  return out;
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Ordered-dither threshold of a pixel, 0..1. */
const bayer = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
/** The ramp's colour at t (0..1), dithered between its two nearest steps. */
const pick = (r: number[], t: number, x: number, y: number) =>
  r[Math.max(0, Math.min(r.length - 1, Math.floor(t * (r.length - 1) + bayer(x, y))))];

const SKY = ramp(['#040d14', '#081c24', '#0e2d33', '#16403f', '#235649'], 14);
const FLOOR = ramp(['#3b7f45', '#275f35', '#1a4329', '#11301f', '#0a2016', '#05120c'], 12);
const LEAF = ramp(['#06140f', '#0c2419', '#133823', '#1d4f2e', '#2c6a3b', '#4b9150'], 12);
const BARK = ramp(['#08130f', '#11231c', '#1a3328', '#264638', '#365c48'], 10);
const ROCK = ramp(['#141d1a', '#26332f', '#3a4943', '#55665c'], 8);
const BUSH = ramp(['#030a07', '#0a1c13', '#143222', '#245035'], 8);
const C = {
  vine: pack(rgb('#23512f')), vineLeaf: pack(rgb('#3d7f45')), moss: pack(rgb('#2f6036')),
  rune: pack(rgb('#5fe6c9')), flowerY: pack(rgb('#e8d27c')), flowerB: pack(rgb('#a6dcff')),
  stem: pack(rgb('#c4e3d3')), cap: pack(rgb('#46d6ba')), capHi: pack(rgb('#b8fff0')), capDark: pack(rgb('#1e8a76')),
};

// ---------------------------------------------------------------- noise

/** 0..1 from an integer and a salt (deterministic). */
function hash(n: number, salt: number) {
  let h = Math.imul((n | 0) ^ Math.imul(salt, 0x9e3779b1), 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const hash2 = (x: number, y: number, salt: number) => hash(Math.imul(x, 73856093) ^ Math.imul(y, 19349663), salt);
/** Smooth 1D value noise, 0..1. */
function noise(x: number, salt: number) {
  const i = Math.floor(x), f = x - i, k = f * f * (3 - 2 * f);
  return hash(i, salt) * (1 - k) + hash(i + 1, salt) * k;
}

// ---------------------------------------------------------------- raster

class Raster {
  readonly data: Uint32Array;
  constructor(readonly x0: number, readonly y0: number, readonly w: number, readonly h: number) {
    this.data = new Uint32Array(w * h);
  }
  set(x: number, y: number, c: number) {
    const u = x - this.x0, v = y - this.y0;
    if (u >= 0 && v >= 0 && u < this.w && v < this.h) this.data[v * this.w + u] = c;
  }
  /** Whether any of the columns [a, b) is on the raster. */
  spans(a: number, b: number) { return b > this.x0 && a < this.x0 + this.w; }
  get x1() { return this.x0 + this.w; }
  get y1() { return this.y0 + this.h; }
}

// ---------------------------------------------------------------- sky and far woods

/** The sky's brightness at a pixel, 0..1: paler down toward the mist and up right in the shafts. */
function skyT(x: number, y: number) {
  const t = (y + 30) / (GROUND + 30);
  const glow = Math.max(0, 1 - Math.hypot((x - 258) / 150, (y - 20) / 120));
  return Math.min(1, t * 0.82 + glow * 0.3);
}

function sky(r: Raster) {
  for (let y = r.y0; y < r.y1; y++) for (let x = r.x0; x < r.x1; x++) r.set(x, y, pick(SKY, skyT(x, y), x, y));
}

/**
 * One row of woods in the mist: trunks every `step` px and a scalloped band of crowns, all a
 * shade `depth` darker than the sky behind them (so they fade into the mist low down).
 */
function woods(r: Raster, step: number, depth: number, salt: number, crownLow: number) {
  const shade = (x: number, y: number, extra = 0) => pick(SKY, skyT(x, y) - depth - extra, x, y);
  for (let k = Math.floor((r.x0 - 40) / step); k * step < r.x1 + 40; k++) {
    const x = Math.round(k * step + hash(k, salt) * step * 0.6), w = 2 + Math.floor(hash(k, salt + 1) * (step / 5));
    if (!r.spans(x, x + w + 1)) continue;
    for (let y = r.y0; y < GROUND; y++) for (let i = 0; i < w; i++) r.set(x + i, y, shade(x + i, y, i === 0 ? 0.04 : 0));
  }
  for (let x = r.x0; x < r.x1; x++) {
    const edge = crownLow * (0.45 + noise(x / (step * 1.1), salt + 2) * 0.55) + noise(x / 5, salt + 3) * 4;
    for (let y = r.y0; y < edge; y++) r.set(x, y, shade(x, y, hash2(x, y, salt + 4) < 0.1 ? -0.05 : 0.02));
  }
  // Bushes along the floor line.
  for (let x = r.x0; x < r.x1; x++) {
    const top = GROUND - 3 - noise(x / 9, salt + 5) * 9;
    for (let y = Math.floor(top); y < GROUND + 2; y++) r.set(x, y, shade(x, y, 0.02));
  }
}

/** A broken rune pillar far off, now and then (none where the painted arch stands). */
function pillars(r: Raster) {
  const step = 140;
  for (let k = Math.floor((r.x0 - 60) / step); k * step < r.x1 + 60; k++) {
    const x = Math.round(k * step + 30 + hash(k, 30) * 80), w = 6, top = GROUND - 22 - Math.floor(hash(k, 31) * 16);
    if (x > -12 && x < 92) continue;
    if (!r.spans(x, x + w)) continue;
    for (let y = top; y < GROUND + 1; y++) {
      const broken = y - top < 3 ? Math.floor(hash2(k, y, 32) * 4) : 0;
      for (let i = broken; i < w; i++) {
        const dark = (y - top) % 6 === 5 ? 0.42 : i >= w - 2 ? 0.2 : 0.3;   // block seams, lit right edge
        r.set(x + i, y, pick(SKY, skyT(x + i, y) - dark, x + i, y));
      }
    }
    for (const dy of [7, 8, 9]) r.set(x + 2, top + dy, C.rune);
    r.set(x + 1, top + 8, C.rune); r.set(x + 3, top + 8, C.rune);
  }
}

// ---------------------------------------------------------------- big trees

/** The big trees' places: one per 88 px cell, none in the open middle of the frame. */
function bigTrees(r: Raster, each: (r: Raster, x: number, w: number, k: number) => void) {
  const step = 88;
  for (let k = Math.floor((r.x0 - 120) / step); k * step < r.x1 + 120; k++) {
    const x = Math.round(k * step + 10 + hash(k, 11) * 30), w = 13 + Math.floor(hash(k, 12) * 8);
    if (x + w > OPEN_L && x < OPEN_R) continue;
    each(r, x, w, k);
  }
}

function trunk(r: Raster, x: number, w: number, k: number) {
  const flare = 18;
  for (let y = r.y0; y <= GROUND + 2; y++) {
    const below = Math.max(0, y - (GROUND - flare));
    const grow = Math.round((below / flare) ** 2.2 * 10);     // roots spread at the foot
    const l = x - grow, rr = x + w + grow;
    for (let px = l; px < rr; px++) {
      const u = (px - l) / (rr - l);
      // Rounded: dark on the left, lit on the right (the light comes from up right).
      let t = 0.15 + Math.max(0, Math.sin(u * Math.PI)) * 0.3 + u * 0.45;
      if (hash2(px, Math.floor(y / 6) + k * 31, 13) < 0.2 && u > 0.1 && u < 0.92) t -= 0.25;   // bark grooves
      let c = pick(BARK, t, px, y);
      if (below > 0 && hash2(px, y, 14) < (below / flare) * 0.55) c = C.moss;
      r.set(px, y, c);
    }
  }
  for (let i = 0; i < 2; i++) {   // knots
    const ky = 50 + Math.floor(hash(k, 15 + i) * 70), kx = x + 3 + Math.floor(hash(k, 17 + i) * (w - 7));
    r.set(kx, ky, BARK[0]); r.set(kx + 1, ky, BARK[0]); r.set(kx, ky + 1, BARK[0]); r.set(kx + 1, ky - 1, BARK[8]);
  }
}

/** A blob of leaves lit from up right, with a ragged edge. */
function leaves(r: Raster, bx: number, by: number, rad: number, salt: number, dark = 0) {
  for (let y = Math.floor(by - rad); y <= by + rad; y++) for (let px = Math.floor(bx - rad * 1.15); px <= bx + rad * 1.15; px++) {
    const dx = (px - bx) / (rad * 1.15), dy = (y - by) / rad, d = Math.hypot(dx, dy);
    if (d > 1 || (d > 0.84 && hash2(px, y, salt) < 0.5)) continue;
    let t = 0.35 + (dx * 0.5 - dy * 0.7) * 0.35 - d * 0.15 - dark;
    const n = hash2(px, y, salt + 1);
    if (n < 0.14) t -= 0.18; else if (n > 0.94) t += 0.2;              // leaf texture
    r.set(px, y, pick(LEAF, t, px, y));
  }
}

function crown(r: Raster, x: number, w: number, k: number) {
  const cx = x + w / 2;
  for (let i = 0; i < 8; i++) {
    leaves(r, cx + (hash(k, 20 + i) - 0.5) * 84, -4 + hash(k, 30 + i) * 36, 12 + hash(k, 40 + i) * 12, 50 + i);
  }
  for (let i = 0; i < 3; i++) {   // vines hanging from the crown
    const vx = Math.round(cx + (hash(k, 60 + i) - 0.5) * 64), top = 24 + Math.floor(hash(k, 63 + i) * 10);
    const len = 24 + Math.floor(hash(k, 66 + i) * 44);
    for (let j = 0; j < len; j++) {
      const sx = vx + Math.round(Math.sin((j + i * 3) / 5) * 1.2);
      r.set(sx, top + j, C.vine);
      if (j % 6 === 3) { const side = j % 12 === 3 ? 1 : -1; r.set(sx + side, top + j, C.vineLeaf); r.set(sx + side * 2, top + j - 1, C.vineLeaf); }
    }
  }
}

/** A fringe of leaves hanging along the top, darker in the middle (behind the title). */
function canopy(r: Raster) {
  for (let k = Math.floor((r.x0 - 30) / 14); k * 14 < r.x1 + 30; k++) {
    const x = k * 14 + hash(k, 80) * 10, mid = Math.abs(x - FOREST_W / 2) < 120;
    const low = mid ? 2 + hash(k, 81) * 7 : 4 + hash(k, 81) * 14;
    leaves(r, x, low - 6, 9 + hash(k, 82) * 6, 83, mid ? 0.12 : 0);
  }
}

// ---------------------------------------------------------------- floor

const groundY = (x: number) => GROUND + Math.round(noise(x / 31, 70) * 3 - 1.5 + noise(x / 9, 71) * 1.4);

function floor(r: Raster) {
  for (let x = r.x0; x < r.x1; x++) {
    const gy = groundY(x);
    // The clearing's middle is a little lighter: open moss under the open sky.
    const lit = Math.max(0, 1 - Math.abs(x - FOREST_W / 2) / 150) * 0.08;
    if (hash(x, 72) < 0.65) {   // grass blades above the line, in clumps; now and then a flower
      const tall = 1 + Math.floor(hash(x, 73) * 3 + noise(x / 6, 77) ** 3 * 5);
      for (let j = 1; j <= tall; j++) r.set(x, gy - j, j === tall ? FLOOR[0] : FLOOR[1]);
      const f = hash(x, 74);
      if (f < 0.025) r.set(x, gy - tall - 1, f < 0.012 ? C.flowerY : C.flowerB);
    }
    for (let y = gy; y < r.y1; y++) {
      const d = y - gy;
      const blotch = (noise(x / 7 + y * 0.37, 76) - 0.5) * 0.22;      // patches of moss and bare soil
      let c = d === 0 ? FLOOR[0] : pick(FLOOR, 0.16 + Math.min(1, d / 22) * 0.84 - lit + blotch, x, y);
      if (d > 3 && hash2(x, y, 75) < 0.012) c = ROCK[2];          // pebbles
      r.set(x, y, c);
    }
  }
}

function rock(r: Raster, x: number, w: number, h: number) {
  const gy = groundY(x + w / 2) + 1;
  for (let y = gy - h; y <= gy; y++) for (let px = x; px < x + w; px++) {
    const dx = (px - x - w / 2) / (w / 2), dy = (y - gy) / h, d = dx * dx + dy * dy;
    if (d > 1) continue;
    let c = pick(ROCK, 0.45 + (dx * 0.6 - dy * 0.5) * 0.4 - (d > 0.75 ? 0.35 : 0), px, y);
    if (dy < -0.55 && hash2(px, y, 80) < 0.6) c = C.moss;
    r.set(px, y, c);
  }
}

function mushrooms(r: Raster, x: number, salt: number) {
  const gy = groundY(x);
  // A soft glow first: lightens what is behind toward teal, in dithered steps.
  for (let y = gy - 16; y <= gy + 3; y++) for (let px = x - 12; px <= x + 16; px++) {
    const g = 1 - Math.hypot((px - x - 2) / 14, (y - gy + 5) / 10);
    if (g > 0 && g * 0.8 > bayer(px, y)) r.set(px, y, g > 0.55 ? pack(rgb('#2a8a72')) : pack(rgb('#1b5e4e')));
  }
  for (let i = 0; i < 3; i++) {
    const mx = x + i * 3 + Math.floor(hash(salt, i) * 2), tall = 2 + Math.floor(hash(salt, i + 5) * 4), cw = i === 1 ? 5 : 3;
    for (let j = 1; j <= tall; j++) r.set(mx, gy - j, C.stem);
    const top = gy - tall - 1, l = mx - (cw >> 1);
    for (let u = 0; u < cw; u++) r.set(l + u, top, u === 0 ? C.capDark : C.cap);
    for (let u = 1; u < cw - 1; u++) r.set(l + u, top - 1, u === cw - 2 ? C.capHi : C.cap);
  }
}

function bushes(r: Raster) {
  const step = 30;
  for (let k = Math.floor((r.x0 - 40) / step); k * step < r.x1 + 40; k++) {
    const bx = k * step + hash(k, 90) * 18, rad = 8 + hash(k, 91) * 9;
    if (bx + rad > OPEN_L + 10 && bx - rad < OPEN_R - 10) continue;
    const by = FOREST_H + 3 - hash(k, 92) * 7;
    for (let y = Math.floor(by - rad); y <= by + rad; y++) for (let px = Math.floor(bx - rad * 1.4); px <= bx + rad * 1.4; px++) {
      const dx = (px - bx) / (rad * 1.4), dy = (y - by) / rad, d = Math.hypot(dx, dy);
      if (d > 1 || (d > 0.82 && hash2(px, y, 93) < 0.5)) continue;
      r.set(px, y, pick(BUSH, 0.3 + (dx * 0.5 - dy * 0.8) * 0.45, px, y));
    }
    for (let f = 0; f < 2; f++) {   // fern fronds leaning out
      const dir = hash(k, 95 + f) < 0.5 ? -1 : 1, fx = bx + (f - 0.5) * rad, len = 9 + Math.floor(hash(k, 97 + f) * 8);
      for (let j = 0; j < len; j++) {
        const px = Math.round(fx + dir * j * 0.8), py = Math.round(by - rad * 0.6 - j * 0.9 + (j * j) / (len * 1.6));
        r.set(px, py, BUSH[5]);
        if (j % 2 === 0) { r.set(px, py - 1, BUSH[7]); r.set(px - dir, py + 1, BUSH[4]); }
      }
    }
  }
}

// ---------------------------------------------------------------- scene

/**
 * The forest over forest-pixel columns [x0, x0 + w) and rows [y0, y0 + h), where (0, 0) is the
 * frame's top-left: a canvas of w x h, one canvas pixel per forest pixel.
 */
export function paintForest(x0: number, y0: number, w: number, h: number): HTMLCanvasElement {
  const r = new Raster(x0, y0, w, h);
  sky(r);
  woods(r, 19, 0.1, 200, 34);     // the furthest row, palest
  pillars(r);
  woods(r, 26, 0.24, 300, 26);
  bigTrees(r, trunk);
  floor(r);
  bigTrees(r, crown);
  canopy(r);
  // Stones and glowing mushrooms along the floor, away from the middle.
  const step = 58;
  for (let k = Math.floor((x0 - 30) / step); k * step < x0 + w + 30; k++) {
    const x = Math.round(k * step + hash(k, 100) * 30);
    if (x > OPEN_L - 8 && x < OPEN_R + 4) continue;
    if (hash(k, 101) < 0.6) rock(r, x, 8 + Math.floor(hash(k, 102) * 8), 4 + Math.floor(hash(k, 103) * 4));
    if (hash(k, 104) < 0.75) mushrooms(r, x + 12, k);
  }
  mushrooms(r, 292, 7); mushrooms(r, 318, 9);   // past the bar's right end
  bushes(r);

  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d')!;
  const img = x.createImageData(w, h);
  new Uint32Array(img.data.buffer).set(r.data);
  x.putImageData(img, 0, 0);
  return c;
}

let frameForest: HTMLCanvasElement | null = null;
/** The forest over just the frame (FOREST_W x FOREST_H), made once. */
export function forestFrame() {
  return (frameForest ??= paintForest(0, 0, FOREST_W, FOREST_H));
}

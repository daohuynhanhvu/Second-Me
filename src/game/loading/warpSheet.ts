/**
 * Sprite sheet of the wizard (Aeris, side view) being pulled into the portal: 60 frames drawn
 * with canvas from his walk frames (public/assets/aeris/Aeris_Walk.png, 256 px cells, row 1),
 * a few at a time while the loading screen runs (prepareWarpSheet).
 *
 *   frames  0-13  lift-off: he leans back toward the portal (it is behind him, to the left),
 *                 cloak dragged back, a teal glow growing round him;
 *          14-35  tumble: he spins backward, faster and faster, tinting teal, sparks torn off him;
 *          36-59  sucked in: stretched toward the portal, shrinking, dissolving pixel by pixel
 *                 into streaks, down to a white spark.
 * All the while he flails: both arms windmill and both legs kick, wildly at first, weaker as he
 * dissolves. The walk frames have no separate limbs, so he is rigged (makeRig): his standing
 * frame without its hand and boots is the body, and the arms (sleeve, gold cuff, fist) and legs
 * (boots) are drawn with canvas in his own colours, each turning about its shoulder or hip.
 *
 * Only his pose is in the sheet; the scene (loadingScene.ts, `pull`) carries each frame along
 * the flight path from the bar's end into the vortex. Each cell is WARP_CELL px square at half
 * the source's scale (one cell px = two source px), his body's centre at the cell's centre.
 * The pull is to the left in every frame (the portal stands left of the bar).
 */
import { getWizardSheet } from '../rendering/wizardSprite.ts';

export const WARP_FRAMES = 60;
export const WARP_CELL = 160;
export const WARP_COLS = 10;
/** Cell px per source px. */
export const WARP_SCALE = 0.5;
/** The body's centre in a source cell (the pivot of every frame). */
export const WARP_PIVOT = { x: 115, y: 130 };

const SRC = 256, SRC_ROW = 1;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => { const x = clamp01((v - a) / (b - a)); return x * x * (3 - 2 * x); };
const hash = (n: number) => { let h = Math.imul(n ^ 0x5bd1e995, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/** How a frame is posed: everything the drawing needs, from t = 0 (first frame) to 1 (last). */
export function warpPose(t: number) {
  const lean = -0.38 * smooth(0, 0.22, t);                                // back, toward the portal
  const spin = -Math.PI * 2 * 1.6 * smooth(0.18, 1, t) ** 1.7;            // tumbling backward, faster
  return {
    angle: lean + spin,
    scale: 1 - 0.88 * smooth(0.5, 1, t),
    stretch: 1 + 1.6 * smooth(0.55, 0.95, t),                             // drawn out toward the portal
    drag: 0.28 * smooth(0, 0.3, t) * (1 - smooth(0.5, 0.7, t)),           // cloak and hair dragged back
    tint: 0.9 * smooth(0.12, 0.85, t),
    glow: smooth(0.04, 0.35, t),
    dissolve: smooth(0.58, 0.97, t),
    spark: smooth(0.86, 1, t),
    ...flail(t),
  };
}

/**
 * His limbs' angles (rad; 0 hangs straight down, negative swings forward, he faces right):
 * the arms windmill out of step with each other, the legs kick forward, away from the pull. Two waves each, so it never looks like a loop.
 */
export function flail(t: number) {
  const amp = smooth(0, 0.1, t) * (1 - smooth(0.68, 0.9, t)), w = Math.PI * 2;
  const wave = (cycles: number, phase: number, rough: number) =>
    Math.sin(w * cycles * t + phase) + rough * Math.sin(w * cycles * 2.3 * t + phase * 1.7);
  return {
    // Arms thrown about in a panic: the near one from straight out in front to over his head,
    // the far one flung back behind him (toward the portal), from low to high.
    armNear: -1.6 + amp * 1.3 * wave(7, 0, 0.35),
    armFar: 2.2 + amp * 1.0 * wave(6.5, 2.6, 0.3),
    legNear: -0.35 + amp * 0.85 * wave(5.5, 1.1, 0.25),
    legFar: -0.2 + amp * 0.85 * wave(5.5, 1.1 + Math.PI, 0.25),
  };
}

// ---------------------------------------------------------------- rig

/** In his standing side frame (source px): where the limbs join, and what is cut away. */
const SHOULDER_NEAR = { x: 147, y: 152 }, SHOULDER_FAR = { x: 118, y: 150 };
const HIP_NEAR = { x: 140, y: 203 }, HIP_FAR = { x: 116, y: 203 };
const HAND = { x0: 132, y0: 158, x1: 163, y1: 191 };   // his hand, painted over with cloak
const BOOTS_Y = 209;                                     // below the cloak's hem: his boots, cut away

interface Rig {
  body: HTMLCanvasElement;
  pose: HTMLCanvasElement; poseCtx: CanvasRenderingContext2D;
  cloak: string; cloakDark: string; outline: string; gold: string; skin: string; skinShade: string;
  boot: string; bootDark: string;
}
let rig: Rig | null = null;

function makeRig(src: CanvasImageSource): Rig {
  const body = document.createElement('canvas');
  body.width = body.height = SRC;
  const b = body.getContext('2d', { willReadFrequently: true })!;
  b.drawImage(src, 0, SRC_ROW * SRC, SRC, SRC, 0, 0, SRC, SRC);
  const img = b.getImageData(0, 0, SRC, SRC), d = img.data;
  const at = (x: number, y: number) => { const k = (y * SRC + x) * 4; return `rgb(${d[k]},${d[k + 1]},${d[k + 2]})`; };
  // His colours, from the frame itself.
  const col = {
    cloak: at(110, 170), cloakDark: at(80, 195), outline: at(100, 150), gold: at(140, 205),
    skin: at(146, 176), skinShade: '#d9927a', boot: at(130, 225), bootDark: at(115, 228),
  };
  const fill = [2, 67, 140];   // the cloak's blue, painted where his hand was
  for (let k = 0; k < 3; k++) fill[k] = d[(170 * SRC + 110) * 4 + k];
  for (let y = 0; y < SRC; y++) for (let x = 0; x < SRC; x++) {
    const k = (y * SRC + x) * 4;
    if (y >= BOOTS_Y) { d[k + 3] = 0; continue; }
    if (x >= HAND.x0 && x <= HAND.x1 && y >= HAND.y0 && y <= HAND.y1 && d[k + 3] > 0) { d[k] = fill[0]; d[k + 1] = fill[1]; d[k + 2] = fill[2]; }
  }
  b.putImageData(img, 0, 0);
  const pose = document.createElement('canvas');
  pose.width = pose.height = SRC;
  return { body, pose, poseCtx: pose.getContext('2d', { willReadFrequently: true })!, ...col };
}

/** An arm hanging from (0, 0) along +y: sleeve, gold cuff, fist. `far`: the one behind him, darker. */
function arm(x: CanvasRenderingContext2D, r: Rig, far: boolean) {
  const sleeve = far ? r.cloakDark : r.cloak;
  x.fillStyle = r.outline;
  x.fillRect(-10, -4, 20, 46);                                 // outline
  x.fillStyle = sleeve;
  x.fillRect(-8, -4, 16, 42);
  x.fillStyle = r.outline; x.fillRect(-8, 2, 3, 32);           // a fold down the sleeve
  x.fillStyle = r.gold; x.fillRect(-10, 36, 20, 6);            // cuff
  x.fillStyle = r.outline;
  x.beginPath(); x.arc(0, 50, 11, 0, Math.PI * 2); x.fill();  // fist outline
  x.fillStyle = far ? r.skinShade : r.skin;
  x.beginPath(); x.arc(0, 50, 9, 0, Math.PI * 2); x.fill();
  x.fillStyle = r.skinShade; x.fillRect(-7, 53, 14, 3);        // fingers' shadow
}

/** A leg hanging from (0, 0) along +y: a dark stocking and a boot whose toe points forward (+x). */
function leg(x: CanvasRenderingContext2D, r: Rig, far: boolean) {
  x.fillStyle = r.outline;
  x.fillRect(-7, -6, 14, 32);
  x.fillStyle = far ? r.outline : r.bootDark;
  x.fillRect(-5, -6, 10, 30);
  x.fillStyle = r.outline;
  x.beginPath(); x.roundRect(-11, 21, 30, 17, 7); x.fill();   // boot outline
  x.fillStyle = far ? r.bootDark : r.boot;
  x.beginPath(); x.roundRect(-9, 23, 26, 13, 6); x.fill();
  x.fillStyle = r.bootDark; x.fillRect(-9, 32, 26, 4);         // sole
  if (!far) { x.fillStyle = r.gold; x.fillRect(-6, 24, 9, 2); }  // a glint on the toe cap
}

/** Him in one flailing pose, in a 256 px source-sized canvas (pixel-crisp, like his frames). */
function rigPose(r: Rig, f: ReturnType<typeof flail>) {
  const x = r.poseCtx;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.clearRect(0, 0, SRC, SRC);
  const limb = (at: { x: number; y: number }, a: number, draw: () => void) => {
    x.setTransform(1, 0, 0, 1, at.x, at.y); x.rotate(a); draw(); x.setTransform(1, 0, 0, 1, 0, 0);
  };
  // Behind him: the far arm and both legs (the cloak's hem covers their tops); then him; then the near arm.
  limb(SHOULDER_FAR, f.armFar, () => arm(x, r, true));
  limb(HIP_FAR, f.legFar, () => leg(x, r, true));
  limb(HIP_NEAR, f.legNear, () => leg(x, r, false));
  x.drawImage(r.body, 0, 0);
  limb(SHOULDER_NEAR, f.armNear, () => arm(x, r, false));
  // Hard edges, as his own frames have (wizardSprite.ts thresholds their alpha the same way).
  const img = x.getImageData(0, 0, SRC, SRC), d = img.data;
  for (let k = 3; k < d.length; k += 4) d[k] = d[k] >= 128 ? 255 : 0;
  x.putImageData(img, 0, 0);
  return r.pose;
}

function cell(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = WARP_CELL;
  return [c, c.getContext('2d', { willReadFrequently: true })!];
}

/** One frame (0..WARP_FRAMES-1) into `out` at (ox, oy). `body`/`fx` are scratch cells. */
function drawFrame(src: CanvasImageSource, i: number, out: CanvasRenderingContext2D, ox: number, oy: number,
  body: CanvasRenderingContext2D, fx: CanvasRenderingContext2D) {
  const t = i / (WARP_FRAMES - 1), P = WARP_CELL / 2, pose = warpPose(t);

  // 1. The body: turned, stretched along the pull (to the left) and shrunk, about its centre.
  body.setTransform(1, 0, 0, 1, 0, 0);
  body.clearRect(0, 0, WARP_CELL, WARP_CELL);
  body.imageSmoothingEnabled = false;
  body.translate(P, P);
  body.scale(pose.stretch * pose.scale, pose.scale / Math.sqrt(pose.stretch));
  body.transform(1, 0, pose.drag, 1, 0, 0);                                  // the top dragged back (left)
  body.rotate(pose.angle);
  body.scale(WARP_SCALE, WARP_SCALE);
  rig ??= makeRig(src);
  body.drawImage(rigPose(rig, pose), 0, 0, SRC, SRC, -WARP_PIVOT.x, -WARP_PIVOT.y, SRC, SRC);
  body.setTransform(1, 0, 0, 1, 0, 0);
  // Tinted toward the portal's teal, whiter at the end.
  if (pose.tint > 0) {
    body.globalCompositeOperation = 'source-atop';
    body.globalAlpha = pose.tint;
    body.fillStyle = t > 0.8 ? '#c8fff3' : '#59e6cb';
    body.fillRect(0, 0, WARP_CELL, WARP_CELL);
    body.globalAlpha = 1;
    body.globalCompositeOperation = 'source-over';
  }

  // 2. Dissolving: 2 px blocks drop out in a dither order; each is torn off to the left as a streak.
  fx.setTransform(1, 0, 0, 1, 0, 0);
  fx.clearRect(0, 0, WARP_CELL, WARP_CELL);
  if (pose.dissolve > 0) {
    const img = body.getImageData(0, 0, WARP_CELL, WARP_CELL), d = img.data;
    for (let by = 0; by < WARP_CELL; by += 2) for (let bx = 0; bx < WARP_CELL; bx += 2) {
      const k = (by * WARP_CELL + bx) * 4;
      if (d[k + 3] === 0) continue;
      const order = (BAYER[((by >> 1) & 3) * 4 + ((bx >> 1) & 3)] + hash(bx * 977 + by) * 4) / 20;
      if (order >= pose.dissolve) continue;
      // Gone from the body…
      for (const o of [0, 4, WARP_CELL * 4, WARP_CELL * 4 + 4]) d[k + o + 3] = 0;
      // …and pulled left as a short streak, further the earlier it went.
      if (hash(bx * 31 + by * 7) < 0.35) {
        const len = 3 + Math.floor((pose.dissolve - order) * 46), x = bx - Math.floor((pose.dissolve - order) * 60);
        fx.fillStyle = hash(bx + by * 131) < 0.4 ? '#ffffff' : '#7ff5dc';
        fx.fillRect(x, by, len, 2);
      }
    }
    body.putImageData(img, 0, 0);
  }

  // 3. Sparks torn off him while he tumbles, streaking left.
  const sparks = Math.round(14 * smooth(0.15, 0.5, t) * (1 - pose.spark));
  for (let j = 0; j < sparks; j++) {
    const run = (i * 3 + j * 17) % 40 / 40;                                 // each spark's own cycle
    const x = Math.round(P - 18 - run * 60 - hash(j) * 10), y = Math.round(P - 34 + hash(j * 5 + 1) * 68 + (run - 0.5) * 8);
    fx.fillStyle = j % 3 === 0 ? '#ffffff' : '#7ff5dc';
    fx.fillRect(x, y, 2 + Math.round(run * 6), 2);
  }

  // 4. Into the cell: the teal glow round him (his silhouette, offset), the body, the streaks.
  out.save();
  out.translate(ox, oy);
  out.imageSmoothingEnabled = false;
  if (pose.glow > 0) {
    out.globalAlpha = 0.55 * pose.glow * (1 - pose.dissolve * 0.6);
    // A cyan silhouette two px out on every side.
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) out.drawImage(silhouette(body.canvas), dx, dy);
    out.globalAlpha = 1;
  }
  out.drawImage(body.canvas, 0, 0);
  out.globalCompositeOperation = 'lighter';
  out.drawImage(fx.canvas, 0, 0);
  // 5. The last frames: a white spark where he was, shrinking to a point.
  if (pose.spark > 0) {
    const r = Math.max(1, Math.round(9 * (1 - pose.spark) + 2));
    out.fillStyle = '#d9fff6';
    for (let y = -r; y <= r; y += 2) { const w = (r - Math.abs(y)) * 2 + 2; out.fillRect(P - w / 2, P + y - 1, w, 2); }
    out.fillStyle = '#ffffff';
    out.fillRect(P - 2, P - 2, 4, 4);
  }
  out.restore();
}

let sil: [HTMLCanvasElement, CanvasRenderingContext2D] | null = null;
/** The body in flat cyan (for its glow). */
function silhouette(body: HTMLCanvasElement) {
  sil ??= cell();
  const [c, x] = sil;
  x.globalCompositeOperation = 'copy';
  x.drawImage(body, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = '#46e0c4';
  x.fillRect(0, 0, WARP_CELL, WARP_CELL);
  x.globalCompositeOperation = 'source-over';
  return c;
}

/** All 60 frames, WARP_COLS to a row, from the wizard's walk sheet. */
export function buildWarpSheet(src: CanvasImageSource): HTMLCanvasElement {
  const sheet = document.createElement('canvas');
  sheet.width = WARP_COLS * WARP_CELL;
  sheet.height = Math.ceil(WARP_FRAMES / WARP_COLS) * WARP_CELL;
  const out = sheet.getContext('2d')!;
  const [, body] = cell(), [, fx] = cell();
  for (let i = 0; i < WARP_FRAMES; i++) drawFrame(src, i, out, (i % WARP_COLS) * WARP_CELL, Math.floor(i / WARP_COLS) * WARP_CELL, body, fx);
  return sheet;
}

let warp: HTMLCanvasElement | null = null;
let warpCtx: CanvasRenderingContext2D | null = null;
let scratch: [CanvasRenderingContext2D, CanvasRenderingContext2D] | null = null;
let built = 0;

/**
 * Draws up to `budget` more frames of the sheet (about 5 ms each), once the wizard's walk sheet
 * has loaded; the scene calls it a frame at a time while loading runs. True once all are drawn.
 */
export function prepareWarpSheet(budget = 1) {
  if (built === WARP_FRAMES) return true;
  const src = getWizardSheet();
  if (!src) return false;
  if (!warp) {
    warp = document.createElement('canvas');
    warp.width = WARP_COLS * WARP_CELL;
    warp.height = Math.ceil(WARP_FRAMES / WARP_COLS) * WARP_CELL;
    warpCtx = warp.getContext('2d')!;
    scratch = [cell()[1], cell()[1]];
  }
  for (let n = 0; n < budget && built < WARP_FRAMES; n++, built++) {
    drawFrame(src, built, warpCtx!, (built % WARP_COLS) * WARP_CELL, Math.floor(built / WARP_COLS) * WARP_CELL, scratch![0], scratch![1]);
  }
  return built === WARP_FRAMES;
}

/** The finished sheet (null until every frame is drawn). */
export function getWarpSheet() { return built === WARP_FRAMES ? warp : null; }

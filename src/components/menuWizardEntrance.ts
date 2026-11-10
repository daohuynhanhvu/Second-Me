import { WIZARD_WALK_ORDER } from '../game/rendering/wizardSprite.ts';

// Main-menu entrance: Aeris walks out of the portal to her spot right of it.
// Painting coordinates (1376 x 768). The pose is a pure function of elapsed seconds, so it runs at
// any frame rate. Feet anchor = the game's: cell (128, 201) of a 256px sheet cell (wizardSprite.ts).

/** Sheet px -> painting units at full size (the idle sprite is 81.5 units wide for its 130px). */
export const SPRITE_K = 81.5 / 130;
export const CELL = 256;
export const ANCHOR = { x: 128, y: CELL * 55 / 70 };

const PORTAL = { cx: 309, cy: 445, rx: 105, ry: 158 };
const DEEP = { x: 312, y: 540, s: 0.45 };      // far side of the portal: small, higher up
// At the portal surface; the whole body must still fit the opening here, so dropping the clip
// when she steps through shows no sudden feet (checked in menuWizardEntrance.test.ts).
const THRESHOLD = { x: 318, y: 565, s: 0.8 };
export const FINAL = { x: 539.5 + 128 * SPRITE_K, y: 593.45 + ANCHOR.y * SPRITE_K, s: 1 };
const CONTROL = { x: 420, y: 700 };            // the walk bends down toward the viewer, then right

export const T = { activateEnd: 1.2, emergeStart: 0.9, emergeEnd: 2.5, walkEnd: 5.5, calmEnd: 4.2 };
const STEP_FPS = 8;      // frames per second while stepping toward the viewer inside the portal
const STRIDE = 21;       // painting units per walk frame at full size (8 frames ~ one stride pair)

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const bezier = (u: number) => ({
  x: (1 - u) ** 2 * THRESHOLD.x + 2 * (1 - u) * u * CONTROL.x + u * u * FINAL.x,
  y: (1 - u) ** 2 * THRESHOLD.y + 2 * (1 - u) * u * CONTROL.y + u * u * FINAL.y,
});

// Arc length along the walk, so walk frames advance with distance (no foot sliding while easing).
const ARC: number[] = [0];
for (let i = 1, prev = bezier(0); i <= 64; i++) {
  const p = bezier(i / 64);
  ARC.push(ARC[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y));
  prev = p;
}
const arcAt = (u: number) => { const f = u * 64, i = Math.min(63, Math.floor(f)); return lerp(ARC[i], ARC[i + 1], f - i); };

export type WizardPose = {
  x: number; y: number; s: number;   // feet position and scale
  row: number; frame: number;        // sheet row (1 = side/right, 2 = facing viewer) and column
  opacity: number; glow: number;     // 0..1 cyan portal light on the body
  inPortal: boolean;                 // still beyond the portal surface: clip to its opening
  portalRate: number; flare: number; // portal speed multiplier and extra glow 0..1
  done: boolean;
};

export function wizardPose(t: number): WizardPose {
  const activate = smooth(clamp(t / T.activateEnd));
  const calm = smooth(clamp((t - T.emergeEnd) / (T.calmEnd - T.emergeEnd)));
  const portalRate = 1 + 1.2 * activate * (1 - calm);
  const flare = activate * (1 - calm);

  if (t < T.emergeEnd) {
    const k = clamp((t - T.emergeStart) / (T.emergeEnd - T.emergeStart));
    const e = easeOut(k);
    return {
      x: lerp(DEEP.x, THRESHOLD.x, e), y: lerp(DEEP.y, THRESHOLD.y, e), s: lerp(DEEP.s, THRESHOLD.s, e),
      row: 2, frame: WIZARD_WALK_ORDER[2][Math.floor(Math.max(0, t - T.emergeStart) * STEP_FPS) % 8],
      opacity: smooth(clamp(k / 0.6)), glow: 1 - 0.6 * k, inPortal: true, portalRate, flare, done: false,
    };
  }
  const k = clamp((t - T.emergeEnd) / (T.walkEnd - T.emergeEnd));
  const u = smooth(k);
  const p = bezier(u);
  const s = lerp(THRESHOLD.s, FINAL.s, u);
  const done = k >= 1;
  return {
    x: p.x, y: p.y, s,
    row: 1, frame: done ? 0 : WIZARD_WALK_ORDER[1][Math.floor(arcAt(u) / STRIDE) % 8],
    opacity: 1, glow: 0.4 * (1 - smooth(clamp(k / 0.3))), inPortal: false, portalRate, flare, done,
  };
}

/** True when the sprite's whole body (cell bounds at this pose) lies inside the portal opening. */
export function insidePortal(p: Pick<WizardPose, 'x' | 'y' | 's'>, box = { x0: 57, y0: 26, x1: 201, y1: 238 }): boolean {
  const k = SPRITE_K * p.s;
  const pts = [[box.x0, box.y0], [box.x1, box.y0], [box.x0, box.y1], [box.x1, box.y1]];
  return pts.every(([cx, cy]) => {
    const x = p.x + (cx - ANCHOR.x) * k, y = p.y + (cy - ANCHOR.y) * k;
    return ((x - PORTAL.cx) / PORTAL.rx) ** 2 + ((y - PORTAL.cy) / PORTAL.ry) ** 2 <= 1;
  });
}

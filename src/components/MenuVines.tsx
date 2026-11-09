import React, { useEffect, useRef } from 'react';

/**
 * The menu frame's brambles reach out and wrap the hovered main-menu slab, and draw back to the
 * frame when the pointer leaves (on top of the slab's own lift and glow, mainMenu.css).
 *
 * The growth is a sprite sheet drawn once with canvas (vineSheet): VINE_FRAMES frames in a row,
 * each the slab's sprite cell (304 x 78, as stone-button.png) with VINE_MX px either side (to
 * reach the frame's pillars, where its brambles grow) and VINE_MY px above and below, one sprite
 * px per art px. Four branches of the frame's own brambles grow out of the pillars at the slab's
 * height, cross the gap and cling along its top and bottom edges, two from each side. They are
 * drawn as the painting draws them (measured across its stems): ~10 px thick, a 1 px black
 * outline round a near-black body with a grey band of light 2-3 px wide along its upper side,
 * black thorns now and then, no leaves, tapering to a point as it grows. MenuVines plays the
 * sheet forward while its slab is selected and backward when it is not, from whatever frame it is on.
 */
export const VINE_FRAMES = 18;
export const VINE_MX = 48, VINE_MY = 18;
const SLAB_W = 304, SLAB_H = 78;
const CW = SLAB_W + 2 * VINE_MX, CH = SLAB_H + 2 * VINE_MY;
const GROW_FPS = 54, SHRINK_FPS = 72;           // frames per second growing / drawing back

// The painted brambles, measured across a stem: outline, body, the grey band and its soft edge.
const INK = '#020305', STEM = '#0a0e12', BAND_EDGE = '#1c2326', BAND = '#2b3335';
const STEM_R = 4;                               // the stem's radius inside its outline (full grown)

type P = [number, number];
interface Vine { pts: P[]; delay: number; thornSide: 1 | -1 }   // thornSide: where its first thorn points

// Paths in cell px. The slab's stone face spans x 52-342, y 23-80; the frame's pillars stand
// beyond x ~10 on the left and ~390 on the right, where every branch starts.
const VINES: Vine[] = [
  // From the left pillar, up over the slab's left end and along its top edge.
  { pts: [[4, 52], [18, 46], [34, 36], [48, 26], [70, 23], [102, 28], [136, 22], [168, 27]], delay: 0, thornSide: -1 },
  // From the right pillar, over the right end and along the top, leftward.
  { pts: [[396, 56], [382, 47], [364, 34], [346, 25], [322, 23], [292, 28], [262, 23]], delay: 0.05, thornSide: 1 },
  // From the left pillar, under the slab's left end and along its bottom edge.
  { pts: [[4, 54], [20, 62], [38, 74], [60, 81], [94, 77], [126, 82]], delay: 0.16, thornSide: 1 },
  // From the right pillar, along the bottom, leftward.
  { pts: [[396, 58], [380, 70], [358, 80], [326, 79], [294, 83]], delay: 0.22, thornSide: -1 },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (x: number) => 1 - (1 - x) ** 3;

/** Points along a Catmull-Rom spline through `pts`, every ~0.5 px, with their running length. */
function sample(pts: P[]) {
  const out: { x: number; y: number; s: number; a: number }[] = [];
  let s = 0, px = pts[0][0], py = pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const steps = Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 2);
    for (let k = 0; k <= steps; k++) {
      const t = k / steps, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      const x = f(p0[0], p1[0], p2[0], p3[0]), y = f(p0[1], p1[1], p2[1], p3[1]);
      s += Math.hypot(x - px, y - py);
      out.push({ x, y, s, a: Math.atan2(y - py, x - px) });
      px = x; py = y;
    }
  }
  return out;
}
const SAMPLES = VINES.map(v => sample(v.pts));

/** Pixel offsets of a disc of radius r (a round stamp, pixel-crisp). */
const discs = new Map<number, P[]>();
function disc(r: number): P[] {
  const k = Math.round(r * 2) / 2;
  let d = discs.get(k);
  if (!d) {
    d = [];
    const R = Math.ceil(k);
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) if (x * x + y * y <= k * k + 0.3) d.push([x, y]);
    discs.set(k, d);
  }
  return d;
}
function stamp(x: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  x.fillStyle = color;
  const X = Math.round(cx), Y = Math.round(cy);
  for (const [dx, dy] of disc(r)) x.fillRect(X + dx, Y + dy, 1, 1);
}

/** One frame: every branch grown to its share of `t` (0 bare … 1 fully grown). */
function drawFrame(x: CanvasRenderingContext2D, ox: number, t: number) {
  x.save();
  x.translate(ox, 0);
  VINES.forEach((vine, vi) => {
    const pts = SAMPLES[vi], total = pts[pts.length - 1].s;
    const len = total * easeOut(clamp01((t - vine.delay) / (1 - vine.delay)));
    if (len <= 0) return;
    const shown = pts.filter(p => p.s <= len);
    // Thick at the pillar, tapering to a point over its last 16 px.
    const radius = (p: { s: number }) => STEM_R * Math.min(1, 0.25 + (len - p.s) / 16) * (1 - 0.25 * (p.s / total));
    // Thorns first (their bases hide under the stem): black spikes every 15 px, alternating
    // sides, raked back toward the pillar the branch grew from.
    let side = vine.thornSide;
    for (let s = 9; s < len - 10; s += 15, side = (side * -1) as 1 | -1) {
      const p = pts.find(q => q.s >= s)!, n = p.a + (Math.PI / 2) * side, r = radius(p);
      for (let k = 0; k <= 6; k++) {
        const w = Math.max(1, Math.round(4 * (1 - k / 6))), d = r + k;
        const cx = p.x + Math.cos(n) * d - Math.cos(p.a) * k * 0.8, cy = p.y + Math.sin(n) * d - Math.sin(p.a) * k * 0.8;
        x.fillStyle = INK; x.fillRect(Math.round(cx - w / 2), Math.round(cy - w / 2), w, w);
      }
    }
    // The stem: the outline, the body, then the grey band along its upper side (soft edge first).
    for (const p of shown) stamp(x, p.x, p.y, radius(p) + 1, INK);
    for (const p of shown) stamp(x, p.x, p.y, radius(p), STEM);
    const band = (scale: number, color: string) => {
      for (const p of shown) {
        const r = radius(p);
        if (r < 2) continue;
        const up = Math.sin(p.a + Math.PI / 2) < 0 ? p.a + Math.PI / 2 : p.a - Math.PI / 2;   // the normal pointing up
        stamp(x, p.x + Math.cos(up) * r * 0.42, p.y + Math.sin(up) * r * 0.42, r * scale, color);
      }
    };
    band(0.42, BAND_EDGE);
    band(0.26, BAND);
  });
  x.restore();
}

let sheetUrl = '';
/** The sheet (VINE_FRAMES cells in a row) as an image URL, drawn on first use. */
export function vineSheet() {
  if (sheetUrl || typeof document === 'undefined') return sheetUrl;
  const c = document.createElement('canvas');
  c.width = CW * VINE_FRAMES; c.height = CH;
  const x = c.getContext('2d')!;
  for (let f = 0; f < VINE_FRAMES; f++) drawFrame(x, f * CW, f / (VINE_FRAMES - 1));
  sheetUrl = c.toDataURL('image/png');
  return sheetUrl;
}

/** The vines over one slab: grows while `active`, draws back when not (instantly with reduced motion). */
export function MenuVines({ active, reducedMotion = false }: { active: boolean; reducedMotion?: boolean }) {
  const el = useRef<HTMLSpanElement>(null);
  const frame = useRef(0);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    node.style.backgroundImage = `url(${vineSheet()})`;
    const target = active ? VINE_FRAMES - 1 : 0;
    const paint = () => {
      const f = Math.round(frame.current);
      node.style.backgroundPositionX = `${(f / (VINE_FRAMES - 1)) * 100}%`;
      node.style.visibility = f === 0 ? 'hidden' : 'visible';
    };
    if (reducedMotion) { frame.current = target; paint(); return; }
    let raf = 0, last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      frame.current = active ? Math.min(target, frame.current + dt * GROW_FPS) : Math.max(target, frame.current - dt * SHRINK_FPS);
      paint();
      if (frame.current !== target) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, reducedMotion]);
  return <span ref={el} className="intro-menu-vines" aria-hidden="true"/>;
}

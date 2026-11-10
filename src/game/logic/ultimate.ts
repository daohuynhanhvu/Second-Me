/**
 * Rage and the Ultimates (UPGRADE_PLAN.md §0, §3). Rage fills from landed hits and from being hurt; a full bar buys
 * one Ultimate. Which one depends on how the hero is moving when it is pressed: still = neutral, towards the aim =
 * forward, away from it = back.
 */
export const RAGE = { MAX: 100, HIT: 4, HEAVY: 10, HURT: 6 } as const;

export class RagePool {
  value = 0;
  gain(n: number) { this.value = Math.min(RAGE.MAX, this.value + n); }
  get full() { return this.value >= RAGE.MAX; }
  spend() { if (!this.full) return false; this.value = 0; return true; }
  fill() { this.value = RAGE.MAX; }
  reset() { this.value = 0; }
}

export type UltVariant = 'neutral' | 'forward' | 'back';
/** Moving less than a third towards or away from the aim counts as standing still (strafing). */
export function ultimateVariant(move: { x: number; y: number }, from: { x: number; y: number }, aim: { x: number; y: number }): UltVariant {
  const m = Math.hypot(move.x, move.y), dx = aim.x - from.x, dy = aim.y - from.y, d = Math.hypot(dx, dy);
  if (m < .1 || d < 1) return 'neutral';
  const along = (move.x * dx + move.y * dy) / (m * d);
  return along > .33 ? 'forward' : along < -.33 ? 'back' : 'neutral';
}

/** Aeris. ICICLE_IMPACT is when pixelfx ice/icicle-fall stabs the floor; BEAM_REACH is its beam's length in the sheet;
 *  STOP ends as the arcane/time-stop clock shatters (2.4 s). */
export const AERIS_ULT = {
  RAIN: { RADIUS: 150, COUNT: 12, SPAN: 1.6, DAMAGE: 30, HIT_RADIUS: 42, ICICLE_IMPACT: .944 },
  BEAM: { CHARGE: .4, TIME: 1.2, TICKS: 6, DAMAGE: 22, LENGTH: 400, HALF_WIDTH: 26, BEAM_REACH: 200 },
  STOP: { TIME: 2.4 },
} as const;

/** Where and when each icicle of the rain lands: spread evenly through the circle (sunflower), in shuffled order. */
export function icicleRain(at: { x: number; y: number }, random: () => number = Math.random) {
  const R = AERIS_ULT.RAIN, golden = Math.PI * (3 - Math.sqrt(5)), turn = random() * Math.PI * 2;
  const spots = Array.from({ length: R.COUNT }, (_, i) => {
    const r = R.RADIUS * Math.sqrt((i + .5) / R.COUNT), a = turn + i * golden;
    return { x: at.x + Math.cos(a) * r, y: at.y + Math.sin(a) * r * .75 };   // the floor is seen at a slant
  });
  for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  return spots.map((p, i) => ({ ...p, delay: i * R.SPAN / R.COUNT }));
}

/** True if `p` (hit radius r) is inside the beam fired from `from` along `angle`. */
export function insideBeam(from: { x: number; y: number }, angle: number, p: { x: number; y: number }, r: number) {
  const dx = p.x - from.x, dy = p.y - from.y, along = dx * Math.cos(angle) + dy * Math.sin(angle);
  return along >= -r && along <= AERIS_ULT.BEAM.LENGTH + r && Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle)) <= AERIS_ULT.BEAM.HALF_WIDTH + r;
}

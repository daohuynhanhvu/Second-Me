/**
 * Weight of a landed hit (UPGRADE_PLAN.md §1): a short hit-stop that holds the fight, a push that slides
 * an enemy back, and a small screen shake on heavy hits. All three start from the same landed hit.
 */
export const HIT_FEEL = { STOP: .03, STOP_HEAVY: .08, PUSH: 10, PUSH_HEAVY: 36, PUSH_RATE: 16, SHAKE: 4, SHAKE_TIME: .18 } as const;

export class HitFeel {
  /** Seconds the fight stays held. */
  stop = 0;
  /** Seconds of shake left. */
  shake = 0;

  land(heavy: boolean) {
    // Several targets struck by one hit hold the fight once, not once each.
    this.stop = Math.max(this.stop, heavy ? HIT_FEEL.STOP_HEAVY : HIT_FEEL.STOP);
    if (heavy) this.shake = HIT_FEEL.SHAKE_TIME;
  }

  /** Advances the clocks; true while the fight is held this frame. */
  hold(dt: number): boolean {
    this.shake = Math.max(0, this.shake - dt);
    if (this.stop <= 0) return false;
    this.stop = Math.max(0, this.stop - dt);
    return true;
  }

  /** Screen offset in px (none with reduced motion). */
  offset(time: number, reduced: boolean): { x: number; y: number } {
    if (reduced || this.shake <= 0) return { x: 0, y: 0 };
    const k = HIT_FEEL.SHAKE * this.shake / HIT_FEEL.SHAKE_TIME;
    return { x: Math.round(Math.sin(time * 91) * k), y: Math.round(Math.cos(time * 77) * k) };
  }

  reset() { this.stop = 0; this.shake = 0; }
}

export interface Pushable { x: number; y: number; push?: { x: number; y: number } }

/** Starts pushing `target` straight away from `from`. */
export function knockBack(target: Pushable, from: { x: number; y: number }, heavy: boolean) {
  const dx = target.x - from.x, dy = target.y - from.y, d = Math.hypot(dx, dy) || 1, n = heavy ? HIT_FEEL.PUSH_HEAVY : HIT_FEEL.PUSH;
  target.push = { x: dx / d * n, y: dy / d * n };
}

/** Slides each pushed target part of the way (fast first, easing out); `move` resolves walls. */
export function slidePushed(targets: Pushable[], dt: number, move: (t: Pushable, x: number, y: number) => void) {
  const k = Math.min(1, dt * HIT_FEEL.PUSH_RATE);
  for (const t of targets) {
    if (!t.push) continue;
    const sx = t.push.x * k, sy = t.push.y * k;
    t.push.x -= sx; t.push.y -= sy;
    move(t, t.x + sx, t.y + sy);
    if (Math.hypot(t.push.x, t.push.y) < .5) delete t.push;
  }
}

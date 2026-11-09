/**
 * Aeris's personal skill, Storm Orbs: up to MAX orbs circling her for LIFE seconds, each
 * striking whatever it touches every TICK seconds. They add to her combo instead of replacing
 * it, so their worth is in how much of the fight they actually touch:
 *
 * - The orbit (RX x RY around a point LIFT px above her feet) passes through the ring where
 *   enemies stand to attack her (their reach is 39-58 px; the boss stops 85 px away). It used to
 *   be 36 x 28, inside that ring, so the orbs seldom touched anything.
 * - An orb hits a target when its own circle (HIT_RADIUS) overlaps the target's hit circle,
 *   like every other attack (GameEngine.damageArea), not only when it passes within 22 px of the
 *   target's centre; it strikes every target it overlaps, and never through a wall.
 * - It strikes on contact, then not that target again for TICK seconds. It used to strike only at
 *   the instant of each TICK, wherever it was then: turning 1.5 rad between ticks, it mostly
 *   passed through a target between two ticks without hitting it.
 * - The orbs stay evenly spaced (spaceOrbs): a new orb used to take the fixed angle n x 120 deg
 *   while the others had already turned, which bunched three orbs into about a third of the circle.
 *
 * Damage, cost (mana.ts), cooldown, number and lifetime are unchanged.
 */
export const STORM_ORBS = { MAX: 3, LIFE: 6, TICK: .5, DAMAGE: 4, SPIN: 3, RX: 70, RY: 52, LIFT: 12, HIT_RADIUS: 10 } as const;

/** `struck`: the targets this orb hit, with the time left before it can hit each again. */
export interface StormOrb { angle: number; life: number; struck?: Map<object, number> }

/** Where an orb at `angle` is, around a hero standing at `at`. */
export function orbPoint(at: { x: number; y: number }, angle: number) {
  return { x: at.x + Math.cos(angle) * STORM_ORBS.RX, y: at.y - STORM_ORBS.LIFT + Math.sin(angle) * STORM_ORBS.RY };
}

/** Spreads the orbs evenly round the circle, keeping the first one where it is. */
export function spaceOrbs(orbs: StormOrb[]) {
  if (!orbs.length) return;
  const base = orbs[0].angle;
  orbs.forEach((orb, i) => { orb.angle = base + i * Math.PI * 2 / orbs.length; });
}

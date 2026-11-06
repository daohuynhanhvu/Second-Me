import type { Trap } from './types.ts';
import { rectIntersects, getCharacterBoundingBox } from './collision.ts';

// All damaging traps have a visible warning before their short impact window.
export function trapPhase(trap: Trap, time: number): 'idle' | 'warning' | 'impact' {
  if (trap.kind === 'vines') return 'idle';
  const phase = (time + trap.offset) % trap.period;
  if (phase >= trap.period - 0.45) return 'impact';
  if (phase >= trap.period - (trap.kind === 'rocks' ? 1.45 : 1.2)) return 'warning';
  return 'idle';
}

export function touchingTrap(trap: Trap, player: { x: number; y: number }) {
  return rectIntersects(getCharacterBoundingBox(player.x, player.y, 24, 24), trap);
}

export function trapEffects(traps: Trap[], player: { x: number; y: number }, time: number) {
  let slowed = false;
  let damage = false;
  for (const trap of traps) {
    if (!touchingTrap(trap, player)) continue;
    if (trap.kind === 'vines') slowed = true;
    else if (trapPhase(trap, time) === 'impact') damage = true;
  }
  return { slowed, damage, speedMultiplier: slowed ? 0.55 : 1 };
}

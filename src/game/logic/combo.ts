/**
 * Four-hit combo for the normal attack (Kael and Aeris): configuration and the input/timing
 * state machine. Pure logic, no rendering or damage: GameEngine reacts to `onStart` (a hit
 * begins: face the target, play its animation) and `onHit` (its hit frame: apply damage).
 *
 * Damage, all in one place for balancing:
 *   hit damage = round(ATK × multiplier)            this file (CLASS_ATK, COMBO_HITS)
 *   then the game's existing modifiers, unchanged:
 *     Kael's empowered swing (a pressure plate held down): ATK × 1.6   (was 15 → 24)
 *     Light Sanctuary (standing in Kael's circle): × 1.2               (GameEngine.strike)
 *     the boss takes nothing while a pillar stands                      (GameEngine.strike)
 *   There is no DEF and no critical hit in the game, so none is added here.
 *
 * Input:
 *   - a press with no combo running starts hit 1;
 *   - a press during a hit, once BUFFER_FROM of it has played, is remembered (one press, no
 *     stacking) and the next hit starts the moment this one ends;
 *   - a press within the hit's `window` after it ends starts the next hit;
 *   - otherwise the combo falls back to hit 1; after hit 4 it always does.
 *   Hits never overlap and never skip: the next hit can only follow the one before it.
 */
import type { CharacterClass } from './campaign.ts';

export type ComboHero = Extract<CharacterClass, 'swordsman' | 'mage'>;

export interface ComboHit {
  name: string;
  /** Vietnamese name (character screen). */
  vi: string;
  /** Animation in src/game/data/comboSprites.json. */
  anim: string;
  /** Damage = ATK × multiplier. */
  multiplier: number;
  /** Seconds per animation frame; the hit lasts frames × this. */
  frameTime: number;
  frames: number;
  /** The frame whose start applies the damage (never frame 0). */
  hitFrame: number;
  /** Seconds after the hit ends to press for the next one. */
  window: number;
  heavy?: boolean;
}

/** Base attack of each hero: the damage a normal attack did before combos (15 for both). */
export const CLASS_ATK: Record<ComboHero, number> = { swordsman: 15, mage: 15 };
/** Kael's swing while a pressure plate is held down was 24 instead of 15. */
export const EMPOWERED_ATK = 1.6;
/** Share of a hit that must have played before a press is buffered for the next one. */
export const BUFFER_FROM = 0.35;
/** Seconds the combat idle pose holds after the finisher. */
export const FINISHER_REST = 0.35;

export const COMBO_HITS: Record<ComboHero, ComboHit[]> = {
  swordsman: [
    { name: 'Quick Slash', vi: 'Chém nhanh', anim: 'quickSlash', multiplier: 0.8, frames: 3, frameTime: 0.085, hitFrame: 1, window: 0.45 },
    { name: 'Reverse Slash', vi: 'Chém ngược', anim: 'reverseSlash', multiplier: 0.9, frames: 3, frameTime: 0.085, hitFrame: 2, window: 0.45 },
    { name: 'Spinning Slash', vi: 'Chém xoáy', anim: 'spinSlash', multiplier: 1.1, frames: 4, frameTime: 0.09, hitFrame: 2, window: 0.45 },
    { name: 'Heavy Finisher', vi: 'Nhát chém kết liễu', anim: 'heavyFinisher', multiplier: 2.2, frames: 6, frameTime: 0.09, hitFrame: 3, window: 0, heavy: true },
  ],
  mage: [
    { name: 'Arcane Bolt', vi: 'Đạn bí thuật', anim: 'arcaneBolt', multiplier: 0.8, frames: 4, frameTime: 0.075, hitFrame: 3, window: 0.45 },
    { name: 'Arcane Burst', vi: 'Bùng nổ bí thuật', anim: 'arcaneBurst', multiplier: 0.9, frames: 4, frameTime: 0.08, hitFrame: 2, window: 0.45 },
    { name: 'Magic Orbit', vi: 'Quỹ đạo phép', anim: 'magicOrbit', multiplier: 1.1, frames: 4, frameTime: 0.09, hitFrame: 3, window: 0.45 },
    { name: 'Arcane Nova', vi: 'Tân tinh bí thuật', anim: 'arcaneNova', multiplier: 2.2, frames: 5, frameTime: 0.1, hitFrame: 3, window: 0, heavy: true },
  ],
};

export const hitDuration = (h: ComboHit) => h.frames * h.frameTime;
export const hitTime = (h: ComboHit) => h.hitFrame * h.frameTime;

/** Damage of one hit before the game's modifiers. */
export function comboDamage(hero: ComboHero, step: number, empowered = false): number {
  return Math.round(CLASS_ATK[hero] * (empowered ? EMPOWERED_ATK : 1) * COMBO_HITS[hero][step].multiplier);
}

export class Combo {
  /** Hit playing now (0-3), or -1. */
  step = -1;
  /** Seconds into the current hit. */
  time = 0;
  /** The hit that just finished, while its window is open (-1 otherwise). */
  private last = -1;
  private windowLeft = 0;
  private buffered = false;
  private applied = false;
  /** Seconds left of the combat idle pose (after a hit, during its window or the rest). */
  idleLeft = 0;
  /** Hits started and hits applied since creation (for tests and the dev log). */
  started = 0;
  landed = 0;

  constructor(readonly hits: ComboHit[]) {}

  get active() { return this.step >= 0; }
  get current(): ComboHit | null { return this.step >= 0 ? this.hits[this.step] : null; }
  /** The animation frame to show now (0-based), or -1 when no hit plays. */
  get frame() { const h = this.current; return h ? Math.min(h.frames - 1, Math.floor(this.time / h.frameTime)) : -1; }

  /** Normal attack pressed. Returns the hit that starts now, or -1 (buffered or ignored). */
  press(): number {
    const h = this.current;
    if (h) {
      if (this.step < this.hits.length - 1 && this.time >= hitDuration(h) * BUFFER_FROM) this.buffered = true;
      return -1;
    }
    const next = this.last >= 0 && this.windowLeft > 0 ? this.last + 1 : 0;
    this.begin(next < this.hits.length ? next : 0);
    return this.step;
  }

  /** Advances time. `onStart(step)` when a buffered hit begins, `onHit(step)` on each hit frame. */
  update(dt: number, onStart: (step: number) => void, onHit: (step: number) => void) {
    if (this.step < 0) {
      this.windowLeft = Math.max(0, this.windowLeft - dt);
      this.idleLeft = Math.max(0, this.idleLeft - dt);
      if (this.windowLeft === 0) this.last = -1;
      return;
    }
    this.time += dt;
    const h = this.hits[this.step];
    if (!this.applied && this.time >= hitTime(h)) { this.applied = true; this.landed++; onHit(this.step); }
    if (this.time < hitDuration(h)) return;
    const finished = this.step;
    if (this.buffered && finished < this.hits.length - 1) {
      this.begin(finished + 1);
      onStart(this.step);
      return;
    }
    this.step = -1;
    this.buffered = false;
    const isFinisher = finished === this.hits.length - 1;
    this.last = isFinisher ? -1 : finished;                     // after the finisher: back to hit 1
    this.windowLeft = isFinisher ? 0 : h.window;
    this.idleLeft = isFinisher ? FINISHER_REST : h.window;
  }

  /** Interrupted (hurt, dodging, dead, level left): drop the combo, nothing pending. */
  cancel() { this.step = -1; this.last = -1; this.windowLeft = 0; this.buffered = false; this.idleLeft = 0; }

  private begin(step: number) {
    this.step = step; this.time = 0; this.applied = false; this.buffered = false; this.windowLeft = 0; this.idleLeft = 0;
    this.started++;
  }
}

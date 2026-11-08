/**
 * The dev-only training ground: a level of dummies that never die and never fight back, with a
 * damage readout, for tuning combos and skills. Players never see it: the camp shows its button
 * only in dev mode, and GameEngine.enterTraining refuses outside dev mode.
 */

/** Seconds without a hit before a dummy refills, and before the readout starts a new session. */
export const DUMMY_RESET = 3;
/** Seconds of hits the DPS figure averages over. */
export const DPS_WINDOW = 5;

/** Damage dealt to the dummies: one session runs until DUMMY_RESET seconds pass without a hit. */
export class TrainingStats {
  total = 0;
  hits = 0;
  biggest = 0;
  last = 0;
  private log: { at: number; amount: number }[] = [];
  private lastAt = -Infinity;

  /** A hit of `amount` at time `at` (seconds, the level clock). */
  record(at: number, amount: number) {
    if (at - this.lastAt > DUMMY_RESET) this.reset();
    this.total += amount; this.hits++; this.last = amount;
    this.biggest = Math.max(this.biggest, amount);
    this.log.push({ at, amount });
    this.lastAt = at;
  }

  /** Damage per second over the last DPS_WINDOW seconds of this session (0 with fewer than two hits). */
  dps(now: number) {
    this.log = this.log.filter(h => now - h.at <= DPS_WINDOW);
    if (this.log.length < 2) return 0;
    const span = Math.max(1, now - this.log[0].at);
    return this.log.reduce((s, h) => s + h.amount, 0) / span;
  }

  /** True while the session is live (hit within DUMMY_RESET seconds). */
  active(now: number) { return now - this.lastAt <= DUMMY_RESET; }

  reset() { this.total = this.hits = this.biggest = this.last = 0; this.log = []; this.lastAt = -Infinity; }
}

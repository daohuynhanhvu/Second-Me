import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../GameEngine.ts';
import { LEVELS, TRAINING_LEVEL_ID } from './levels.ts';
import { TrainingStats, DUMMY_RESET } from './training.ts';
import { sounds } from './sound.ts';
sounds.setMuted(true);

function engine(t: { after(fn: () => void): void }) {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { body: { dataset: {}, classList: { toggle() {} } } } });
  t.after(() => old ? Object.defineProperty(globalThis, 'document', old) : Reflect.deleteProperty(globalThis, 'document'));
  return new GameEngine();
}
/** Enters the training ground, through the loading screen if the engine uses one. */
function enter(g: GameEngine) {
  g.enterTraining();
  if (g.screen === 'loading') { g.revealLoadedLevel(); g.finishLoading(); }
}
const tick = (g: GameEngine, seconds: number) => { for (let s = 0; s < seconds; s += 0.05) (g as unknown as { update(dt: number): void }).update(0.05); };

test('the training ground is dev-only and never part of the campaign', t => {
  const g = engine(t);
  assert.ok(!LEVELS.some(l => l.id === TRAINING_LEVEL_ID), 'not on the journey map');
  g.goToLobby(); enter(g);
  assert.equal(g.isTraining, false, 'players cannot enter');
  assert.notEqual(g.screen, 'playing');
  g.devUnlocked = true; enter(g);
  assert.equal(g.isTraining, true);
  assert.equal(g.screen, 'playing');
  assert.equal(g.legTimeRemaining, null, 'no timer');
  assert.equal(g.enemies.filter(e => e.kind === 'dummy').length, 4);
  assert.equal(g.enemies.every(e => e.kind === 'dummy'), true);
});

test('dummies take every hit, never die, never move or fight back, and give no rewards', t => {
  const g = engine(t); g.devUnlocked = true; enter(g);
  const d = g.enemies[0], start = { x: d.x, y: d.y }, charges = g.echoCharges;
  g.player.x = d.x - 30; g.player.y = d.y;                    // right next to it
  (g as unknown as { damageCombatTarget(x: number, y: number, a: number, r: number): boolean }).damageCombatTarget(d.x, d.y, 40, 10);
  assert.equal(d.hp, d.maxHp - 40);
  (g as unknown as { damageCombatTarget(x: number, y: number, a: number, r: number): boolean }).damageCombatTarget(d.x, d.y, 9999, 10);
  assert.equal(d.hp, d.maxHp, 'refills instead of dying');
  assert.equal(g.echoCharges, charges, 'no kill reward');
  assert.equal(g.training.hits, 2); assert.equal(g.training.total, 40 + 9999); assert.equal(g.training.biggest, 9999);
  const health = g.health;
  tick(g, 3);
  assert.deepEqual({ x: d.x, y: d.y }, start, 'never moves');
  assert.equal(g.health, health, 'never attacks');
  let hud: { enemiesRemaining?: number } | null = null;
  g.onHUDChange = state => { hud = state; };
  (g as unknown as { notifyHUD(): void }).notifyHUD();
  assert.equal(hud!.enemiesRemaining, 0, 'dummies are not trail enemies');
});

test('a dummy left alone refills, and the readout starts a new session', t => {
  const g = engine(t); g.devUnlocked = true; enter(g);
  const d = g.enemies[3];
  (g as unknown as { damageCombatTarget(x: number, y: number, a: number, r: number): boolean }).damageCombatTarget(d.x, d.y, 100, 10);
  tick(g, 1); assert.equal(d.hp, d.maxHp - 100);
  tick(g, DUMMY_RESET + 0.5); assert.equal(d.hp, d.maxHp);
  (g as unknown as { damageCombatTarget(x: number, y: number, a: number, r: number): boolean }).damageCombatTarget(d.x, d.y, 7, 10);
  assert.equal(g.training.total, 7); assert.equal(g.training.hits, 1);
});

test('the exit returns to the camp without a rating, reward or saved progress', t => {
  const g = engine(t); g.devUnlocked = true; g.campaign.completed = []; g.campaign.bestStars = {}; enter(g);
  g.player.x = g.currentLevel.exit.x + 30; g.player.y = g.currentLevel.exit.y + 30;
  tick(g, 1.5);
  assert.equal(g.screen, 'lobby');
  assert.deepEqual(g.campaign.completed, []);
  assert.equal(g.campaign.bestStars[TRAINING_LEVEL_ID], undefined);
  assert.equal(g.lastRating, null);
});

test('training readout: DPS over the last seconds, a new session after a pause', () => {
  const s = new TrainingStats();
  assert.equal(s.dps(0), 0);
  s.record(0, 10); s.record(1, 10); s.record(2, 20);
  assert.equal(s.total, 40); assert.equal(s.hits, 3); assert.equal(s.biggest, 20); assert.equal(s.last, 20);
  assert.equal(s.dps(2), 20);                                 // 40 damage over 2 s
  assert.ok(s.active(2) && !s.active(2 + DUMMY_RESET + 0.1));
  s.record(10, 5);                                            // after a pause: a new session
  assert.equal(s.total, 5); assert.equal(s.hits, 1);
});

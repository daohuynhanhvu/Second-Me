import test from 'node:test';
import assert from 'node:assert/strict';
import { Combo, COMBO_HITS, CLASS_ATK, comboDamage, hitDuration, hitTime, BUFFER_FROM, type ComboHero } from './combo.ts';
import { createBoss } from './campaign.ts';
import { GameEngine } from '../GameEngine.ts';
import { sounds } from './sound.ts';
sounds.setMuted(true);

const HEROES: ComboHero[] = ['swordsman', 'mage'];

test('combo config: four hits, 0.8 / 0.9 / 1.1 / 2.2 of ATK, the finisher hits hardest', () => {
  for (const hero of HEROES) {
    const hits = COMBO_HITS[hero];
    assert.equal(hits.length, 4);
    assert.deepEqual(hits.map(h => h.multiplier), [0.8, 0.9, 1.1, 2.2]);
    assert.equal(hits.reduce((s, h) => s + h.multiplier, 0).toFixed(6), (5).toFixed(6));
    assert.ok(hits[3].heavy && !hits.slice(0, 3).some(h => h.heavy));
    for (const h of hits) assert.ok(h.hitFrame > 0 && h.hitFrame < h.frames, `${h.name}: damage on a later frame, never the first`);
    const dmg = [0, 1, 2, 3].map(s => comboDamage(hero, s));
    assert.equal(Math.max(...dmg), dmg[3]);
  }
  // With 100 ATK the hits are 80 / 90 / 110 / 220 = 500 (the table in the task).
  const atk = 100;
  assert.deepEqual(COMBO_HITS.swordsman.map(h => Math.round(atk * h.multiplier)), [80, 90, 110, 220]);
  assert.equal(CLASS_ATK.swordsman, 15);
});

/** Runs a combo with presses at the given times (s); returns the order hits started and landed. */
function play(hero: ComboHero, presses: number[], until: number) {
  const combo = new Combo(COMBO_HITS[hero]);
  const log: string[] = [];
  let t = 0, p = 0;
  const dt = 1 / 120;
  while (t < until) {
    while (p < presses.length && presses[p] <= t) {
      const s = combo.press();
      if (s >= 0) log.push(`start${s + 1}`);
      p++;
    }
    combo.update(dt, s => log.push(`start${s + 1}`), s => log.push(`hit${s + 1}`));
    t += dt;
  }
  return { combo, log };
}

test('pressing in rhythm plays hits 1-4 in order, each landing once, then back to hit 1', () => {
  for (const hero of HEROES) {
    const hits = COMBO_HITS[hero];
    // Press once per hit, in the middle of the previous one (buffered).
    const presses: number[] = [0];
    let at = 0;
    for (let i = 0; i < 3; i++) { presses.push(at + hitDuration(hits[i]) * 0.6); at += hitDuration(hits[i]); }
    presses.push(at + hitDuration(hits[3]) + 0.05);              // after the finisher: starts over
    const { log } = play(hero, presses, at + hitDuration(hits[3]) + 0.6);
    assert.deepEqual(log.slice(0, 8), ['start1', 'hit1', 'start2', 'hit2', 'start3', 'hit3', 'start4', 'hit4']);
    assert.deepEqual(log.slice(8, 10), ['start1', 'hit1'], `${hero}: hit 1 again after the finisher`);
  }
});

test('mashing does not overlap or skip hits; an early press is ignored, one later press is buffered', () => {
  const hits = COMBO_HITS.swordsman;
  const mash = Array.from({ length: 60 }, (_, i) => i * 0.01);   // 60 presses in 0.6 s
  const { log } = play('swordsman', mash, 0.6);
  // Hits follow each other strictly; never two starts without the hit between.
  const order = log.filter(e => e.startsWith('start')).map(e => +e.slice(5));
  order.forEach((s, i) => assert.equal(s, i + 1));
  assert.equal(log.filter(e => e === 'hit1').length, 1);
  // A press before BUFFER_FROM of hit 1 has played does nothing.
  const c = new Combo(hits);
  c.press(); c.update(hitDuration(hits[0]) * BUFFER_FROM * 0.5, () => {}, () => {});
  assert.equal(c.press(), -1);
  c.update(hitDuration(hits[0]), () => {}, () => {});
  assert.equal(c.active, false, 'that press was not kept');
});

test('the combo resets when the window closes, and on cancel', () => {
  const hits = COMBO_HITS.mage;
  const c = new Combo(hits);
  c.press(); c.update(hitDuration(hits[0]) + 0.01, () => {}, () => {});
  assert.equal(c.active, false);
  c.update(hits[0].window + 0.05, () => {}, () => {});           // waited too long
  assert.equal(c.press(), 0, 'back to hit 1');
  c.cancel();
  assert.equal(c.active, false);
  assert.equal(c.press(), 0, 'after a cancel, hit 1');
  c.update(hitDuration(hits[0]) + 0.01, () => {}, () => {});
  assert.equal(c.press(), 1, 'within the window: hit 2');
});

function arena(t: { after(fn: () => void): void }, hero: ComboHero) {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { body: { dataset: {}, classList: { toggle() {} } } } });
  t.after(() => old ? Object.defineProperty(globalThis, 'document', old) : Reflect.deleteProperty(globalThis, 'document'));
  const g = new GameEngine(); g.screen = 'playing'; g.characterClass = hero; g.boss = createBoss();
  g.boss.pillars.forEach(p => p.hp = 0); g.boss.armor = 0;
  g.boss.x = 600; g.boss.y = 320; g.player.x = hero === 'mage' ? 420 : 560; g.player.y = 338;
  return g;
}

/**
 * Plays the full combo against the boss, pressing in rhythm (60% into each hit), and records
 * every strike the game makes: [hit step, amount].
 */
function fullCombo(g: GameEngine, hero: ComboHero) {
  const tick = (g as unknown as { updateCombo(dt: number): void }).updateCombo.bind(g);
  const engine = g as unknown as { strike(t: object, a: number, h?: boolean): boolean };
  const real = engine.strike.bind(g);
  const strikes: number[] = [];
  engine.strike = (t, a, h) => { strikes.push(a); return real(t, a, h); };
  const hits = COMBO_HITS[hero];
  const dt = 1 / 240;
  g.attack();
  for (let step = 0; step < 4; step++) {
    const press = hitDuration(hits[step]) * 0.6;
    for (let t = 0; t < hitDuration(hits[step]); t += dt) {
      tick(dt);
      if (step < 3 && t < press && t + dt >= press) g.attack();
    }
  }
  for (let i = 0; i < 480; i++) tick(dt);           // spells still in flight land
  return strikes;
}

test('Kael and Aeris: each hit deals ATK × its multiplier exactly once, the finisher the most', t => {
  for (const hero of HEROES) {
    const g = arena(t, hero);
    const strikes = fullCombo(g, hero);
    const expected = [0, 1, 2, 3].map(s => comboDamage(hero, s));
    assert.deepEqual(strikes, expected, `${hero}: ${strikes}`);
    assert.equal(240 - g.boss!.hp, expected.reduce((a, b) => a + b, 0));
    assert.equal(g.combo!.landed, 4);
    assert.equal(g.combo!.active, false);
  }
});

test('the spin, the orbit and the finishers strike several targets; light hits strike one; a spell hits each target once', t => {
  const g = arena(t, 'swordsman');
  const tick = (g as unknown as { updateCombo(dt: number): void }).updateCombo.bind(g);
  // Two pillars right next to Kael: Quick Slash takes one, the Spinning Slash both.
  g.boss!.pillars.forEach((p, i) => { p.hp = i < 2 ? 60 : 0; });
  g.boss!.pillars[0].x = g.player.x + 40; g.boss!.pillars[0].y = g.player.y - 18;
  g.boss!.pillars[1].x = g.player.x - 40; g.boss!.pillars[1].y = g.player.y - 18;
  g.boss!.x = 1100; g.boss!.y = 600;
  g.attack({ x: g.player.x + 100, y: g.player.y - 18 });
  for (let i = 0; i < 40; i++) tick(1 / 120);
  assert.deepEqual(g.boss!.pillars.slice(0, 2).map(p => p.hp), [60 - comboDamage('swordsman', 0), 60]);
  g.attack({ x: g.player.x + 100, y: g.player.y - 18 }); for (let i = 0; i < 40; i++) tick(1 / 120);   // hit 2 (buffered → plays)
  for (let i = 0; i < 40; i++) tick(1 / 120);
  g.attack({ x: g.player.x + 100, y: g.player.y - 18 }); for (let i = 0; i < 60; i++) tick(1 / 120);   // hit 3: the spin
  const spin = comboDamage('swordsman', 2);
  assert.ok(g.boss!.pillars[1].hp <= 60 - spin, 'the spin reached the pillar behind him');

  // Aeris's Arcane Burst: three spells at one pillar still count once.
  const m = arena(t, 'mage');
  const mt = (m as unknown as { updateCombo(dt: number): void }).updateCombo.bind(m);
  m.boss!.pillars.forEach((p, i) => { p.hp = i === 0 ? 60 : 0; p.x = 640; p.y = 320; });
  m.boss!.x = 1100; m.boss!.y = 600;
  m.attack({ x: 640, y: 320 }); for (let i = 0; i < 24; i++) mt(1 / 120);       // Arcane Bolt casting…
  m.attack({ x: 640, y: 320 }); for (let i = 0; i < 200; i++) mt(1 / 120);      // …then Arcane Burst (3 spells)
  assert.equal(m.boss!.pillars[0].hp, 60 - comboDamage('mage', 0) - comboDamage('mage', 1));
});

test('being hit or dodging drops the combo; Rivet keeps his old attack', t => {
  const g = arena(t, 'swordsman');
  const tick = (g as unknown as { updateCombo(dt: number): void }).updateCombo.bind(g);
  g.attack(); tick(0.01);
  assert.equal(g.combo!.active, true);
  (g as unknown as { takeDamage(): void }).takeDamage();
  assert.equal(g.combo!.active, false);
  const hp = g.boss!.hp; for (let i = 0; i < 60; i++) tick(1 / 60);
  assert.equal(g.boss!.hp, hp, 'an interrupted swing deals nothing');
  g.dodgeCooldown = 0; g.attack(); g.dodge();
  assert.equal(g.combo!.active, false);
  const r = arena(t, 'swordsman'); r.characterClass = 'mechanical';
  r.attack(); assert.equal(r.combo, null); assert.ok(r.attackCooldown > 0);
});

test('hit timing: damage lands on the hit frame, not when the swing starts', t => {
  const g = arena(t, 'swordsman');
  const tick = (g as unknown as { updateCombo(dt: number): void }).updateCombo.bind(g);
  const h = COMBO_HITS.swordsman[0];
  g.attack();
  tick(hitTime(h) * 0.9); assert.equal(g.boss!.hp, 240);
  tick(hitTime(h) * 0.2); assert.equal(g.boss!.hp, 240 - comboDamage('swordsman', 0));
});

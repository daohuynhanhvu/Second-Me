import test from 'node:test';
import assert from 'node:assert/strict';
import { AERIS_ULT, RAGE, RagePool, icicleRain, insideBeam, ultimateVariant } from './ultimate.ts';

test('rage fills to the cap and a full bar buys exactly one Ultimate', () => {
  const r = new RagePool();
  for (let i = 0; i < 40; i++) r.gain(RAGE.HIT);
  assert.equal(r.value, RAGE.MAX);
  assert.equal(r.spend(), true);
  assert.equal(r.spend(), false);
  r.gain(RAGE.HEAVY); assert.equal(r.full, false);
});

test('the variant follows the movement relative to the aim, on either side', () => {
  const me = { x: 100, y: 100 };
  assert.equal(ultimateVariant({ x: 0, y: 0 }, me, { x: 300, y: 100 }), 'neutral');
  assert.equal(ultimateVariant({ x: 1, y: 0 }, me, { x: 300, y: 100 }), 'forward');
  assert.equal(ultimateVariant({ x: -1, y: 0 }, me, { x: 300, y: 100 }), 'back');
  assert.equal(ultimateVariant({ x: -1, y: 0 }, me, { x: -100, y: 100 }), 'forward', 'aim on the left: moving left is forward');
  assert.equal(ultimateVariant({ x: 0, y: 1 }, me, { x: 300, y: 100 }), 'neutral', 'strafing');
});

test('the icicle rain lands every icicle inside its circle, one after another', () => {
  let seed = 7; const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rain = icicleRain({ x: 500, y: 400 }, random);
  assert.equal(rain.length, AERIS_ULT.RAIN.COUNT);
  for (const p of rain) assert.ok(Math.hypot(p.x - 500, (p.y - 400) / .75) <= AERIS_ULT.RAIN.RADIUS + 1e-9);
  assert.deepEqual(rain.map(p => p.delay), [...rain.map(p => p.delay)].sort((a, b) => a - b));
  assert.ok(rain[rain.length - 1].delay < AERIS_ULT.RAIN.SPAN);
});

test('the beam hits along its line, to its length, and nothing behind or beside it', () => {
  const from = { x: 0, y: 0 };
  assert.ok(insideBeam(from, 0, { x: 390, y: 10 }, 20));
  assert.ok(!insideBeam(from, 0, { x: 450, y: 0 }, 20));
  assert.ok(!insideBeam(from, 0, { x: -60, y: 0 }, 20));
  assert.ok(!insideBeam(from, 0, { x: 200, y: 60 }, 20));
  assert.ok(insideBeam(from, Math.PI / 2, { x: 0, y: 200 }, 20));
});

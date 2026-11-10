import test from 'node:test';
import assert from 'node:assert/strict';
import { HIT_FEEL, HitFeel, knockBack, slidePushed, type Pushable } from './hitFeel.ts';

test('a hit holds the fight for its hit-stop, several targets only once', () => {
  const f = new HitFeel();
  f.land(false); f.land(false); f.land(false);
  assert.equal(f.stop, HIT_FEEL.STOP);
  let held = 0;
  while (f.hold(1 / 120)) held++;
  assert.ok(held >= 3 && held <= 4, `${held} frames`);
  assert.equal(f.hold(1 / 120), false);
});

test('a heavy hit holds longer and shakes; reduced motion never shakes', () => {
  const f = new HitFeel();
  f.land(true);
  assert.equal(f.stop, HIT_FEEL.STOP_HEAVY);
  assert.ok(f.shake > 0);
  assert.deepEqual(f.offset(1.234, true), { x: 0, y: 0 });
  for (let i = 0; i < 60; i++) f.hold(1 / 60);
  assert.deepEqual(f.offset(1.234, false), { x: 0, y: 0 }, 'the shake ends');
});

test('a push slides the target away from the hitter by the push distance, then ends', () => {
  const e: Pushable = { x: 100, y: 100 };
  knockBack(e, { x: 70, y: 100 }, true);
  for (let i = 0; i < 60; i++) slidePushed([e], 1 / 60, (t, x, y) => { t.x = x; t.y = y; });
  assert.ok(Math.abs(e.x - 100 - HIT_FEEL.PUSH_HEAVY) < 1 && e.y === 100, `${e.x},${e.y}`);
  assert.equal(e.push, undefined);
});

test('a wall stops the push where it stands', () => {
  const e: Pushable = { x: 100, y: 100 };
  knockBack(e, { x: 100, y: 130 }, false);
  for (let i = 0; i < 60; i++) slidePushed([e], 1 / 60, (t, x, y) => { t.x = x; t.y = Math.max(95, y); });
  assert.equal(e.y, 95);
});

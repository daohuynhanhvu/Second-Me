import test from 'node:test';
import assert from 'node:assert/strict';
import { drawBossFrostZone } from './bossFrostZone.ts';
import { createBoss, updateBoss } from '../logic/campaign.ts';

test('frost ring rotates, switches to blue impact on damage, then disappears', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  class MockImage { complete = true; naturalWidth = 128; src = ''; }
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: MockImage });
  try {
    const calls: string[] = [];
    const ctx = {
      globalAlpha: 1,
      save() { calls.push('save'); }, restore() { calls.push('restore'); },
      translate() {}, rotate() { calls.push('rotate'); },
      drawImage(image: MockImage) { calls.push(image.src); }, arc() { calls.push('arc'); },
    } as unknown as CanvasRenderingContext2D;
    const boss = createBoss(); boss.mode = 'recover'; boss.timer = 100; boss.burstCooldown = 100;
    const player = { x: 300, y: 350 };
    boss.burstAreas = [{...player, radius: 48, timer: .5, struck: false}];
    assert.equal(updateBoss(boss, player, .2, false), false);
    drawBossFrostZone(ctx, player.x, player.y, 48, boss.burstAreas[0].struck, .2, false);
    assert.ok(calls.includes('rotate')); assert.ok(calls.some(c => c.endsWith('boss-frost-ring.png')));
    assert.ok(!calls.includes('arc'), 'no extra outer circle is drawn');
    calls.length = 0;
    assert.equal(updateBoss(boss, player, .31, false), true, 'the hit occurs after the warning');
    drawBossFrostZone(ctx, player.x, player.y, 48, boss.burstAreas[0].struck, .51, false, -boss.burstAreas[0].timer);
    assert.ok(calls.some(c => c.endsWith('boss-frost-impact.png')), 'impact shards appear on the damaging frame');
    assert.ok(!calls.some(c => c.endsWith('boss-frost-ring.png')), 'warning ring is replaced by the impact');
    calls.length = 0;
    drawBossFrostZone(ctx, player.x, player.y, 48, true, .8, false, .3);
    assert.deepEqual(calls, [], 'impact disappears after its short lifetime');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'Image', previous);
    else Reflect.deleteProperty(globalThis, 'Image');
  }
});

test('boss targeted strike damages at the transition from warning to impact', () => {
  const boss = createBoss(); boss.mode = 'warning'; boss.timer = .1; boss.burstCooldown = 100;
  const player = {x: 320, y: 360}; boss.targetX = player.x; boss.targetY = player.y;
  assert.equal(updateBoss(boss, player, .05, false), false);
  assert.equal(boss.mode, 'warning');
  assert.equal(updateBoss(boss, player, .06, false), true);
  assert.equal(boss.mode, 'strike');
  assert.equal(boss.timer, .3);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { drawBossFrostZone } from './bossFrostZone.ts';
import { createBoss, updateBoss } from '../logic/campaign.ts';

test('frost warning rotates without an outer circle, deals damage, then disappears', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  class MockImage { complete = true; naturalWidth = 128; src = ''; }
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: MockImage });
  try {
    const calls: string[] = [];
    const ctx = {
      save() { calls.push('save'); }, restore() { calls.push('restore'); },
      translate() {}, rotate() { calls.push('rotate'); },
      drawImage() { calls.push('image'); }, arc() { calls.push('arc'); },
    } as unknown as CanvasRenderingContext2D;
    const boss = createBoss(); boss.mode = 'recover'; boss.timer = 100; boss.burstCooldown = 100;
    const player = { x: 300, y: 350 };
    boss.burstAreas = [{...player, radius: 48, timer: .5, struck: false}];
    assert.equal(updateBoss(boss, player, .2, false), false);
    drawBossFrostZone(ctx, player.x, player.y, 48, boss.burstAreas[0].struck, .2, false);
    assert.ok(calls.includes('rotate')); assert.ok(calls.includes('image'));
    assert.ok(!calls.includes('arc'), 'no extra outer circle is drawn');
    calls.length = 0;
    assert.equal(updateBoss(boss, player, .31, false), true, 'the hit occurs after the warning');
    drawBossFrostZone(ctx, player.x, player.y, 48, boss.burstAreas[0].struck, .51, false);
    assert.deepEqual(calls, [], 'the ring disappears when damage is dealt');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'Image', previous);
    else Reflect.deleteProperty(globalThis, 'Image');
  }
});

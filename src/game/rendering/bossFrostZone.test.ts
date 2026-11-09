import test from 'node:test';
import assert from 'node:assert/strict';
import { drawBossFrostZone } from './bossFrostZone.ts';


test('frost rune warns, ice spikes erupt on the damaging frame, then the effect disappears', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  class MockImage { complete = true; naturalWidth = 256; naturalHeight = 128; src = ''; }
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: MockImage });
  try {
    const calls: string[] = [];
    const ctx = {
      globalAlpha: 1,
      save() { calls.push('save'); }, restore() { calls.push('restore'); },
      translate() {}, rotate() { calls.push('rotate'); },
      drawImage(image: MockImage, sourceX: number) { calls.push(`${image.src}:${sourceX}`); }, arc() { calls.push('arc'); },
    } as unknown as CanvasRenderingContext2D;
    const player = {x:300,y:350};
    drawBossFrostZone(ctx, player.x, player.y, 82, false, .2, false);
    assert.ok(calls.includes('rotate')); assert.ok(calls.some(c => c.endsWith('boss-ice-spell.png:0')));
    assert.ok(!calls.some(c => c.endsWith('boss-ice-spell.png:128')), 'spikes do not appear before damage');
    assert.ok(!calls.includes('arc'), 'no extra outer circle is drawn');
    calls.length = 0;
    drawBossFrostZone(ctx,player.x,player.y,82,true,.61,false,.01);
    assert.ok(calls.some(c => c.endsWith('boss-ice-spell.png:128')), 'ice spikes appear on the damaging frame');
    assert.ok(calls.some(c => c.endsWith('boss-ice-spell.png:0')), 'rune remains under the ice spikes');
    calls.length = 0;
    drawBossFrostZone(ctx, player.x, player.y, 48, true, .8, false, .3);
    assert.deepEqual(calls, [], 'impact disappears after its short lifetime');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'Image', previous);
    else Reflect.deleteProperty(globalThis, 'Image');
  }
});

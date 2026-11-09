import test from 'node:test';
import assert from 'node:assert/strict';
import { WIZARD_WALK_ORDER } from './wizardSprite.ts';

test('Aeris plays every walk frame once per stride, the side row stepping forward (2 before 1)', () => {
  for (const row of WIZARD_WALK_ORDER) assert.deepEqual([...row].sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
  const side = WIZARD_WALK_ORDER[1];
  assert.ok(side.indexOf(2) < side.indexOf(1));
  assert.equal(side[0], 0);   // standing still and the first walk frame stay the same pose
});

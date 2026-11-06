import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoss } from '../logic/campaign.ts';
import { frostGuardianFrame } from './frostGuardian.ts';

test('Frost Guardian uses the matching sprite row for each combat state', () => {
  const boss = createBoss();
  assert.equal(frostGuardianFrame(boss, 0, 0, false).row, 0);
  assert.equal(frostGuardianFrame(boss, 0, 0, true).row, 1);
  boss.mode = 'warning'; boss.timer = 1.1;
  assert.deepEqual(frostGuardianFrame(boss, 0), { row: 2, frame: 0 });
  boss.mode = 'strike'; boss.timer = 0.3;
  assert.deepEqual(frostGuardianFrame(boss, 0), { row: 2, frame: 6 });
  boss.hitFlash = 0.18;
  assert.equal(frostGuardianFrame(boss, 0).row, 3);
  boss.hp = 0;
  assert.deepEqual(frostGuardianFrame(boss, 0, 2), { row: 4, frame: 15 });
});

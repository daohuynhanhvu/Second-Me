import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PFX, pfxFrame, pfxSeconds, type PfxName } from './pixelfx.ts';

test('every pixelfx sheet on disk holds exactly the cells the table says', () => {
  for (const name of Object.keys(PFX) as PfxName[]) {
    const s = PFX[name];
    const png = readFileSync(new URL(`../../../public/assets/effects/fx/${name}.png`, import.meta.url));
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [s.w * s.columns, s.h * Math.ceil(s.frames / s.columns)], name);
    assert.ok(s.pivot.length === 2 && s.pivot.every(Number.isFinite), `${name} pivot`);   // may lie outside the crop (dash-strike starts behind its trail)
  }
});

test('a one-shot plays every frame once then ends; a loop wraps', () => {
  assert.equal(pfxFrame('hit-spark', 0), 0);
  assert.equal(pfxFrame('hit-spark', pfxSeconds('hit-spark') - 0.001), PFX['hit-spark'].frames - 1);
  assert.equal(pfxFrame('hit-spark', pfxSeconds('hit-spark')), null);
  assert.equal(pfxFrame('rage', pfxSeconds('rage') + 0.01), 0);
});

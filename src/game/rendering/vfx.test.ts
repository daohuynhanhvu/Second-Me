import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VFX_SHEETS, vfxFrame, vfxSeconds, hexShieldFrame, hexShieldBreakFrame, type VfxKind, type VfxSheet } from './vfx.ts';

test('every sheet on disk has exactly the cells the table says', () => {
  for (const key of Object.keys(VFX_SHEETS) as VfxSheet[]) {
    const s = VFX_SHEETS[key];
    const png = readFileSync(new URL(`../../../public/assets/effects/${s.file}.png`, import.meta.url));
    assert.equal(png.toString('latin1', 1, 4), 'PNG', s.file);
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [s.w * s.frames, s.h], `${s.file}: width x height`);
  }
});

test('a one-shot plays each frame once, in order, then ends', () => {
  for (const kind of ['shieldPickup', 'sparkle', 'healRing', 'clock'] as VfxKind[]) {
    const s = VFX_SHEETS[kind], seen: number[] = [];
    for (let age = 0; age < vfxSeconds(kind); age += 1 / 240) {
      const at = vfxFrame(kind, age)!;
      assert.ok(at.frame >= 0 && at.frame < s.frames && at.alpha > 0 && at.alpha <= 1, `${kind} at ${age}`);
      if (seen[seen.length - 1] !== at.frame) seen.push(at.frame);
    }
    assert.deepEqual(seen, Array.from({ length: s.frames }, (_, i) => i), kind);
    assert.equal(vfxFrame(kind, vfxSeconds(kind)), null);
    assert.equal(vfxFrame(kind, -0.1), null);
  }
});

test('the clock holds its last frame while it fades out', () => {
  const played = VFX_SHEETS.clock.frames / VFX_SHEETS.clock.fps;
  const early = vfxFrame('clock', played + 0.05)!, late = vfxFrame('clock', played + 0.3)!;
  assert.equal(early.frame, VFX_SHEETS.clock.frames - 1);
  assert.ok(late.alpha < early.alpha && late.alpha > 0);
});

test('the hex shield assembles, rests, sweeps every three seconds, and breaks when it ends', () => {
  assert.equal(hexShieldFrame(0), 0);
  assert.equal(hexShieldFrame(0.49), 9);
  assert.equal(hexShieldFrame(0.5), 10, 'the first sweep starts as soon as it is whole');
  assert.equal(hexShieldFrame(0.5 + 5 / 14 + 0.01), 15);
  assert.equal(hexShieldFrame(1.5), 9, 'at rest: the whole bubble');
  assert.equal(hexShieldFrame(3.5), 10, 'next sweep');
  for (let age = 0; age < 20; age += 0.01) { const f = hexShieldFrame(age); assert.ok(f >= 0 && f <= 15, `frame ${f} at ${age}`); }
  assert.equal(hexShieldFrame(7.3, true), 9, 'reduced motion: the whole bubble, still');
  assert.deepEqual([hexShieldBreakFrame(0), hexShieldBreakFrame(0.1), hexShieldBreakFrame(0.2)], [16, 17, null]);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FINAL, T, insidePortal, wizardPose } from './menuWizardEntrance.ts';

test('starts invisible inside the portal and is fully inside it when the clip drops', () => {
  const start = wizardPose(0);
  assert.equal(start.inPortal, true);
  assert.equal(start.opacity, 0);
  assert.ok(insidePortal(start));
  const atSurface = wizardPose(T.emergeEnd - 1e-6);
  assert.equal(atSurface.inPortal, true);
  assert.ok(insidePortal(atSurface), 'whole body inside the opening, so unclipping shows no jump');
  assert.equal(wizardPose(T.emergeEnd).inPortal, false);
});

test('ends idle exactly on the final spot, portal back to normal', () => {
  const end = wizardPose(T.walkEnd + 3);
  assert.equal(end.done, true);
  assert.deepEqual([end.row, end.frame], [1, 0]);
  assert.ok(Math.abs(end.x - FINAL.x) < 1e-9 && Math.abs(end.y - FINAL.y) < 1e-9 && end.s === 1);
  assert.equal(end.portalRate, 1);
  assert.equal(end.flare, 0);
});

test('moves continuously: no position or scale jump between consecutive 60fps frames', () => {
  let prev = wizardPose(0);
  for (let t = 1 / 60; t <= T.walkEnd + 0.5; t += 1 / 60) {
    const p = wizardPose(t);
    assert.ok(Math.hypot(p.x - prev.x, p.y - prev.y) < 3, `position jump at t=${t.toFixed(3)}`);
    assert.ok(Math.abs(p.s - prev.s) < 0.02, `scale jump at t=${t.toFixed(3)}`);
    assert.ok(p.frame >= 0 && p.frame < 8);
    prev = p;
  }
});

test('walks out toward the viewer and right, slowing down before the stop', () => {
  const a = wizardPose(T.emergeEnd + 0.5), b = wizardPose(T.emergeEnd + 1.5);
  assert.ok(b.x > a.x && b.y > a.y);
  const speed = (t: number) => { const p = wizardPose(t), q = wizardPose(t + 0.05); return Math.hypot(q.x - p.x, q.y - p.y); };
  assert.ok(speed(T.walkEnd - 0.1) < speed((T.emergeEnd + T.walkEnd) / 2) / 3);
});

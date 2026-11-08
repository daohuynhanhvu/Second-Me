import test from 'node:test';
import assert from 'node:assert/strict';
import { levelUses, type LevelLoadSpec } from './preloader.ts';

const level = (levelId: number, character: LevelLoadSpec['character'] = 'mage'): LevelLoadSpec => ({ levelId, character, lang: 'vi' });

test('a level loads its scenery and the chosen hero, not the menu or other heroes', () => {
  const spec = level(2, 'swordsman');
  assert.ok(levelUses('assets/forest/ground.jpg', spec));
  assert.ok(levelUses('assets/magic-effects/rune.png', spec));
  assert.ok(levelUses('assets/soldier/Soldier_Walk.png', spec));
  assert.ok(!levelUses('assets/blue-wizard/walk/01.png', spec));
  assert.ok(!levelUses('assets/menu/main-menu.jpg', spec));
  assert.ok(!levelUses('assets/loading/background.jpg', spec));
  assert.ok(!levelUses('assets/frost-guardian/sheet.png', spec));
  assert.ok(!levelUses('assets/music/Nhạc đánh boss.mp3', spec));
});

test('the boss level adds the guardian, its music and its voice in the current language', () => {
  const spec = level(6);
  assert.ok(levelUses('assets/frost-guardian/sheet.png', spec));
  assert.ok(levelUses('assets/music/Nhạc đánh boss.mp3', spec));
  assert.ok(levelUses('assets/voice/guardian/vi/g1.mp3', spec));
  assert.ok(levelUses('assets/voice/aeris/vi/a1.mp3', spec));
  assert.ok(!levelUses('assets/voice/guardian/en/g1.mp3', spec));
  assert.ok(!levelUses('assets/voice/narrator/vi/n1.mp3', spec));
});

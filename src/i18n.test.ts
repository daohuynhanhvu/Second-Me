import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from './i18n.ts';

test('intro, lobby, gameplay and ending labels translate in both directions', () => {
  const phrases = [
    ['Enter the forest', 'BƯỚC VÀO KHU RỪNG'],
    ['GAME SETTINGS', 'CÀI ĐẶT TRÒ CHƠI'],
    ['STAGE 3', 'CHẶNG 3'],
    ['REACH RUNE 2 / 3', 'ĐẾN ẤN THẠCH 2 / 3'],
    ['10-second challenge', 'Thử thách 10 giây'],
    ['FROST GUARDIAN', 'THỦ VỆ BĂNG'],
    ['TRY AGAIN', 'THỬ LẠI'],
  ];
  for (const [english, vietnamese] of phrases) {
    assert.equal(translate(vietnamese, 'en'), english);
    assert.equal(translate(english, 'vi'), vietnamese);
  }
});

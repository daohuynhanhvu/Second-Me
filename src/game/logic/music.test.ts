import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneOf } from './music.ts';

test('music files are matched to their scene by name', () => {
  assert.equal(sceneOf('Nhạc ở các màn.mp3'), 'level');
  assert.equal(sceneOf('Nhạc màn chơi.mp3'), 'level');
  assert.equal(sceneOf('Nhạc trong màn đánh bos.mp3'), 'boss');
  assert.equal(sceneOf('Nhạc đánh boss.mp3'), 'boss');
  assert.equal(sceneOf('Theme song.mp3'), 'menu');
  assert.equal(sceneOf('Nhạc intro game.mp3'), 'intro');
  assert.equal(sceneOf('Batman remix.mp3'), null);
});

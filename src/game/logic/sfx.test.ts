import test from 'node:test';
import assert from 'node:assert/strict';
import { sfxOf } from './sfx.ts';

test('sound effect files are matched by name, with or without accents, first rule wins', () => {
  const cases: [string, ReturnType<typeof sfxOf>][] = [
    ['dừng ghi.mp3', 'recordStop'], ['Bắt đầu ghi.wav', 'recordStart'], ['record_stop.ogg', 'recordStop'],
    ['hủy echo.mp3', 'echoDismiss'], ['triệu hồi echo.mp3', 'echoSpawn'], ['echo-spawn.mp3', 'echoSpawn'],
    ['nhả nút.mp3', 'plateOff'], ['nhan nut.mp3', 'plateOn'], ['plate-on.mp3', 'plateOn'],
    ['đóng cửa.mp3', 'doorClose'], ['Mở Cửa.mp3', 'doorOpen'],
    ['đòn kết liễu.mp3', 'finisher'], ['kiếm kết liễu.mp3', 'finisher'], ['arcane nova.wav', 'finisher'],
    ['chém 1.mp3', 'slash'], ['sword-swing-2.mp3', 'slash'], ['phép 3.mp3', 'spell'], ['magic_cast.ogg', 'spell'],
    ['né.mp3', 'dodge'], ['dodge roll.mp3', 'dodge'],
    ['trụ vỡ.mp3', 'break'], ['ice-shatter.mp3', 'break'], ['đánh trúng 2.mp3', 'hit'], ['hit_01.wav', 'hit'],
    ['bước chân 1.mp3', 'footstep'], ['footstep-grass.mp3', 'footstep'],
    ['chiến thắng.mp3', 'victory'], ['level win.mp3', 'victory'],
    ['rock-sliding.mp3', 'portalMove'], ['đá trượt.mp3', 'portalMove'],
    ['Hiệu ứng mở cổng ở cuối loading screen.mp3', 'portalOpen'], ['portal open.wav', 'portalOpen'],
    ['SFX Chém kiếm vào không khí.mp3', 'slash'],
    ['nhạc nền.mp3', null], ['whatever.mp3', null], ['ghichu.txt', null],
  ];
  for (const [file, id] of cases) assert.equal(sfxOf(file), id, file);
});

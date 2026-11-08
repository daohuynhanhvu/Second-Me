import type { Direction } from '../logic/types.ts';

/** Small, pixel-art wooden staff and blue crystal, positioned alongside Aeris. */
export function drawMageStaff(ctx: CanvasRenderingContext2D, x: number, y: number, direction: Direction) {
  ctx.save();
  ctx.translate(Math.round(x + (direction === 'left' ? -20 : 20)), Math.round(y));
  if (direction === 'left') ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1d1716'; ctx.fillRect(-3, -17, 6, 26); ctx.fillRect(-6, -26, 12, 11);
  ctx.fillStyle = '#593b2b'; ctx.fillRect(-2, -17, 4, 24); ctx.fillRect(-5, -25, 3, 8); ctx.fillRect(2, -25, 3, 8);
  ctx.fillStyle = '#a17952'; ctx.fillRect(-1, -14, 1, 19); ctx.fillRect(-4, -24, 1, 5);
  ctx.fillStyle = '#0b476e'; ctx.fillRect(-3, -30, 6, 12); ctx.fillRect(-5, -27, 10, 6);
  ctx.fillStyle = '#078cc5'; ctx.fillRect(-3, -28, 6, 8); ctx.fillRect(-1, -31, 2, 12);
  ctx.fillStyle = '#67e5ff'; ctx.fillRect(-2, -27, 2, 4); ctx.fillRect(0, -29, 2, 3);
  ctx.fillStyle = '#d6fcff'; ctx.fillRect(-1, -26, 2, 2);
  ctx.restore();
}

/** Blue lightning bolt with a bright core and a pixelated, directional trail. */
export function drawLightningOrb(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number, time: number) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(angle); ctx.scale(size / 12, size / 12);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha *= .9;
  ctx.fillStyle = '#164a99'; ctx.fillRect(-20, -3, 12, 3); ctx.fillRect(-17, 3, 10, 3); ctx.fillRect(-14, -8, 6, 3);
  ctx.fillStyle = '#188de4'; ctx.fillRect(-17, -2, 12, 3); ctx.fillRect(-14, 4, 8, 2); ctx.fillRect(-11, -7, 6, 2);
  ctx.fillRect(-7, -8, 13, 16); ctx.fillRect(-10, -5, 19, 10); ctx.fillRect(-5, -10, 9, 20);
  ctx.fillStyle = '#49d5ff'; ctx.fillRect(-5, -7, 10, 14); ctx.fillRect(-8, -4, 16, 8); ctx.fillRect(-3, -9, 6, 18);
  ctx.fillStyle = '#a6f5ff'; ctx.fillRect(-4, -5, 8, 10); ctx.fillRect(-6, -2, 12, 4);
  ctx.fillStyle = '#f3ffff'; ctx.fillRect(-2, -3, 5, 6); ctx.fillRect(-4, -1, 9, 2);
  ctx.fillStyle = '#6beaff'; if (Math.floor(time * 12) % 2) { ctx.fillRect(-15, -10, 4, 2); ctx.fillRect(-18, 7, 5, 2); }
  ctx.restore();
}

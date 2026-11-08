import { livingImage } from './livingAssets.ts';
import { drawPixelInteraction } from './pixelInteractions.ts';

export function drawTimeRelic(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, reducedMotion: boolean, hint: boolean) {
  const image = livingImage('time-relic.png');
  const t = reducedMotion ? 0 : time, bob = Math.sin(t * 2.3) * 3;
  ctx.save();
  ctx.fillStyle = '#071c2144';ctx.beginPath();ctx.ellipse(x, y + 11, 14, 5, 0, 0, Math.PI * 2);ctx.fill();
  const aura = ctx.createRadialGradient(x, y, 2, x, y, 34);
  aura.addColorStop(0, '#90f4df33');aura.addColorStop(1, '#70ead600');
  ctx.fillStyle = aura;ctx.fillRect(x - 34, y - 34, 68, 68);
  ctx.strokeStyle = '#b4dec288';ctx.lineWidth = 1;
  ctx.beginPath();ctx.ellipse(x, y + 10, 17 + Math.sin(t * 2) * 1.5, 6, 0, 0, Math.PI * 2);ctx.stroke();
  if (image) {
    ctx.shadowColor = '#9ce9d7';ctx.shadowBlur = 7;
    if(!drawPixelInteraction(ctx,3,x-28,y-34+bob,56,56))ctx.drawImage(image, x - 28, y - 34 + bob, 56, 56);
  } else {
    // A small hourglass silhouette stays readable while the illustrated relic loads.
    ctx.strokeStyle = '#e4c889';ctx.fillStyle = '#a8e8d5';ctx.lineWidth = 3;
    ctx.beginPath();ctx.moveTo(x - 8, y - 15);ctx.lineTo(x + 8, y - 15);ctx.lineTo(x - 7, y + 9);ctx.lineTo(x + 7, y + 9);ctx.closePath();ctx.fill();ctx.stroke();
  }
  ctx.shadowBlur = 0;
  for (let i = 0; i < 3; i++) {
    const a = t * .9 + i * Math.PI * 2 / 3;
    ctx.globalAlpha = .55;ctx.fillStyle = '#f5de9b';
    ctx.beginPath();ctx.arc(x + Math.cos(a) * 20, y - 3 + Math.sin(a) * 10 + bob, 1.2, 0, Math.PI * 2);ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (hint) {
    ctx.font = '600 11px sans-serif';ctx.textAlign = 'center';ctx.shadowColor = '#10231a';ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffedbd';ctx.fillText('+4s', x, y - 32 + bob);
  }
  ctx.restore();
}

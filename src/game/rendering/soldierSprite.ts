import type { Direction } from '../logic/types.ts';

const sheets = new Map<string, HTMLCanvasElement>();
const loading = new Set<string>();

function spriteSheet(name: string): HTMLCanvasElement | undefined {
  if (sheets.has(name)) return sheets.get(name);
  if (loading.has(name) || typeof Image === 'undefined') return;
  loading.add(name);
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Remove the faint background left around the pixel-art silhouettes.
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] >= 180 ? 255 : 0;
    ctx.putImageData(pixels, 0, 0);
    sheets.set(name, canvas);
  };
  image.src = `${import.meta.env.BASE_URL}assets/soldier/Kael_${name}.png`;
  return;
}

export function drawSoldierSprite(ctx: CanvasRenderingContext2D, x: number, y: number, direction: Direction, moving: boolean, echo: boolean, time: number, attacking = false, attackProgress = 0) {
  attacking = attacking && (direction === 'left' || direction === 'right');
  const image = spriteSheet(attacking ? 'Attack' : 'Walk');
  if (!image) return;
  const row = attacking ? 2 : direction === 'up' ? 0 : direction === 'down' ? 2 : 1;
  const frame = attacking ? Math.min(7, Math.max(0, Math.floor(attackProgress * 8))) : moving ? Math.floor(time * 10) % 8 : 0;
  ctx.save(); ctx.translate(x, y);
  if (direction === 'left') ctx.scale(-1, 1);
  if (echo) { ctx.globalAlpha *= .7; ctx.filter = 'brightness(1.6) sepia(1) saturate(4) hue-rotate(135deg)'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 12; }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, frame * 256, row * 256, 256, 256, -35, -55, 70, 70);
  ctx.restore();
}

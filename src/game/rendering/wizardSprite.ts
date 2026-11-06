import type { Direction } from '../logic/types.ts';

// Cache shared by renderers; a clip becomes visible only after every frame loads.
const clips = new Map<string, HTMLImageElement[]>();

export function loadWizardSprites() {
  if (typeof Image === 'undefined') return;
  for (const name of ['idle', 'walk']) {
    if (clips.has(name)) continue;
    const frames = Array.from({ length: 20 }, (_, index) => {
      const image = new Image();
      image.src = `${import.meta.env.BASE_URL}assets/blue-wizard/${name}/${String(index).padStart(2, '0')}.png`;
      return image;
    });
    clips.set(name, frames);
  }
}

export function drawWizardSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: Direction,
  moving: boolean,
  echo: boolean,
  time: number,
): boolean {
  const frames = clips.get(moving ? 'walk' : 'idle');
  if (!frames?.every(image => image.complete && image.naturalWidth > 0)) return false;
  const image = frames[Math.floor(time * (moving ? 24 : 16)) % frames.length];
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (direction === 'left') ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = true;
  if (echo) {
    ctx.globalAlpha *= 0.65;
    ctx.filter = 'brightness(1.65) sepia(1) saturate(4) hue-rotate(135deg)';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 8;
  }
  // Shared crop across both clips keeps the feet anchored between frames.
  ctx.drawImage(image, 170, 118, 168, 288, -13, -32, 26, 44);
  ctx.restore();
  return true;
}

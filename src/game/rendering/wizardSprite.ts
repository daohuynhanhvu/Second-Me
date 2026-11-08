import type { Direction } from '../logic/types.ts';

let sheet: HTMLCanvasElement | null = null;
let loading = false;

export function loadWizardSprites() {
  if (loading || sheet || typeof Image === 'undefined') return;
  loading = true;
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { loading = false; return; }
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] >= 180 ? 255 : 0;
    ctx.putImageData(pixels, 0, 0);
    sheet = canvas;
  };
  image.onerror = () => { loading = false; };
  image.src = `${import.meta.env.BASE_URL}assets/aeris/Aeris_Walk.png`;
}

export function getWizardSheet() { loadWizardSprites(); return sheet; }

export function drawWizardSprite(ctx: CanvasRenderingContext2D, x: number, y: number, direction: Direction, moving: boolean, echo: boolean, time: number): boolean {
  const image = getWizardSheet();
  if (!image) return false;
  const row = direction === 'up' ? 0 : direction === 'down' ? 2 : 1;
  const frame = moving ? Math.floor(time * 10) % 8 : 0;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  if (direction === 'left') ctx.scale(-1, 1);
  if (echo) { ctx.globalAlpha *= .65; ctx.filter = 'brightness(1.65) sepia(1) saturate(4) hue-rotate(135deg)'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 8; }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, frame * 256, row * 256, 256, 256, -35, -55, 70, 70);
  ctx.restore(); return true;
}

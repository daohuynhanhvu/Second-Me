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

/**
 * The order the walk sheet's frames are played in, per row (up, side, down). In the side row
 * frames 1 and 2 are drawn the wrong way round: frame 1 has the front foot already planted
 * ahead, frame 2 still swings it forward in the air, so played 0-1-2-3 the first half of every
 * stride stepped backwards. Played 0-2-1-3 both halves are the same forward stride (traced from
 * the boots: lift at the back, swing forward, plant ahead, slide back under the body).
 */
export const WIZARD_WALK_ORDER: readonly (readonly number[])[] = [
  [0, 1, 2, 3, 4, 5, 6, 7],
  [0, 2, 1, 3, 4, 5, 6, 7],
  [0, 1, 2, 3, 4, 5, 6, 7],
];

export function drawWizardSprite(ctx: CanvasRenderingContext2D, x: number, y: number, direction: Direction, moving: boolean, echo: boolean, time: number): boolean {
  const image = getWizardSheet();
  if (!image) return false;
  const row = direction === 'up' ? 0 : direction === 'down' ? 2 : 1;
  const frame = moving ? WIZARD_WALK_ORDER[row][Math.floor(time * 10) % 8] : 0;
  ctx.save(); ctx.translate(x, y);
  if (direction === 'left') ctx.scale(-1, 1);
  if (echo) { ctx.globalAlpha *= .65; ctx.filter = 'brightness(1.65) sepia(1) saturate(4) hue-rotate(135deg)'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 8; }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, frame * 256, row * 256, 256, 256, -35, -55, 70, 70);
  ctx.restore(); return true;
}

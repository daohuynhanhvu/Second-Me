const cache = new Map<string, HTMLImageElement>();
export function livingImage(file: string) {
  if (typeof Image === 'undefined') return null;
  let image = cache.get(file);
  if (!image) {
    image = new Image(); image.src = `${import.meta.env.BASE_URL}assets/biomes/${file}`;
    cache.set(file, image);
  }
  return image.complete && image.naturalWidth > 0 ? image : null;
}
export function livingReady() {
  return Number(!!livingImage('traps-pixel.png')) + Number(!!livingImage('decor-pixel.png'));
}
export function drawLivingCell(ctx: CanvasRenderingContext2D, file: string, column: number, row: number,
  x: number, y: number, width: number, height: number) {
  const image = livingImage(file);
  if (!image) return false;
  const sw = image.width / 4, sh = image.height / 3;
  ctx.drawImage(image, column * sw, row * sh, sw, sh, x, y, width, height);
  return true;
}
export function drawLivingDecor(ctx: CanvasRenderingContext2D, index: number, x: number, y: number, size: number, flip = false) {
  ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
  drawLivingCell(ctx, 'decor-pixel.png', index % 4, Math.floor(index / 4), -size / 2, -size * .66, size, size);
  ctx.restore();
}

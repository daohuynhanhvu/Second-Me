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
/** Whole sheets with a colour filter already applied, by file and filter. */
const tintedSheets = new Map<string, HTMLCanvasElement>();
/**
 * The sheet recoloured by a CSS colour filter (hue-rotate / saturate / brightness: per-pixel
 * colour only), made once. Drawing it costs the same as the plain sheet, while `ctx.filter` on
 * every draw renders through an extra pass each time (the trap tints made levels 3 and 5 several
 * times dearer to draw than the others, every frame).
 */
function tintedSheet(file: string, image: HTMLImageElement, filter: string) {
  const key = `${file}|${filter}`;
  let sheet = tintedSheets.get(key);
  if (!sheet) {
    sheet = document.createElement('canvas'); sheet.width = image.width; sheet.height = image.height;
    const g = sheet.getContext('2d')!; g.filter = filter; g.drawImage(image, 0, 0);
    tintedSheets.set(key, sheet);
  }
  return sheet;
}
/** Draws one cell of a 4x3 sheet; `tint` is a colour-only CSS filter applied to the cell. */
export function drawLivingCell(ctx: CanvasRenderingContext2D, file: string, column: number, row: number,
  x: number, y: number, width: number, height: number, tint?: string) {
  const image = livingImage(file);
  if (!image) return false;
  const sw = image.width / 4, sh = image.height / 3;
  const source = tint && typeof document !== 'undefined' ? tintedSheet(file, image, tint) : image;
  ctx.drawImage(source, column * sw, row * sh, sw, sh, x, y, width, height);
  return true;
}
export function drawLivingDecor(ctx: CanvasRenderingContext2D, index: number, x: number, y: number, size: number, flip = false) {
  ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
  drawLivingCell(ctx, 'decor-pixel.png', index % 4, Math.floor(index / 4), -size / 2, -size * .66, size, size);
  ctx.restore();
}

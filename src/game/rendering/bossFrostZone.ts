/** Pixel-art frost ring for the Guardian's area attacks. */
let ring: HTMLImageElement | null = null;
function frostRing(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!ring) {
    ring = new Image();
    ring.src = `${import.meta.env?.BASE_URL ?? "/"}assets/effects/boss-frost-ring.png`;
  }
  return ring.complete && ring.naturalWidth > 0 ? ring : null;
}

/** Rotate the warning ring until the hit; it disappears on the damaging frame. */
export function drawBossFrostZone(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, struck: boolean, time: number, reducedMotion: boolean) {
  if (struck) return;
  const image = frostRing();
  ctx.save();
  ctx.translate(x, y);
  if (!reducedMotion) ctx.rotate(time * 5);
  ctx.imageSmoothingEnabled = false;
  if (image) {
    ctx.drawImage(image, -radius, -radius, radius * 2, radius * 2);
  } else {
    // A segmented frost warning remains visible while the sprite is loading.
    ctx.strokeStyle = '#63dffa'; ctx.lineWidth = Math.max(4, radius * .09); ctx.lineCap = 'square';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.arc(0, 0, radius * .78, i * Math.PI / 3, i * Math.PI / 3 + .65); ctx.stroke();
    }
  }
  ctx.restore();
}

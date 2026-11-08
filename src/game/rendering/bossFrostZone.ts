/** Pixel-art frost ring for the Guardian's area attacks. */
let ring: HTMLImageElement | null = null;
function frostRing(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!ring) {
    ring = new Image();
    ring.src = `${import.meta.env.BASE_URL}assets/effects/boss-frost-ring.png`;
  }
  return ring.complete && ring.naturalWidth > 0 ? ring : null;
}

/** The outline stays at the actual damage radius through warning and impact. */
export function drawBossFrostZone(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, struck: boolean, time: number, reducedMotion: boolean, remaining?: number) {
  const image = frostRing();
  const fade = struck && remaining !== undefined ? Math.max(0, Math.min(1, (remaining + .3) / .3)) : 1;
  const pulse = reducedMotion ? 1 : .88 + .12 * Math.sin(time * 8);
  ctx.save();
  ctx.globalAlpha *= fade;
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = struck ? 'rgba(46,164,220,.30)' : 'rgba(57,159,208,.16)';
  ctx.fill();
  // A clear boundary is visible before the art finishes loading, and marks the danger area.
  ctx.lineWidth = 2; ctx.strokeStyle = struck ? '#c5faff' : '#87dfff'; ctx.stroke();
  if (image) {
    ctx.translate(x, y);
    if (!reducedMotion) ctx.rotate(time * .25);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha *= (struck ? .95 : .72) * pulse;
    ctx.drawImage(image, -radius, -radius, radius * 2, radius * 2);
  }
  ctx.restore();
}

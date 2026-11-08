/** The Guardian's blue warning ring and its scattered ice-pixel impact. */
const sprites: Partial<Record<'ring' | 'impact', HTMLImageElement>> = {};
const files = { ring: 'boss-frost-ring.png', impact: 'boss-frost-impact.png' } as const;
const IMPACT_DURATION = .3;

function effectImage(kind: 'ring' | 'impact'): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  let image = sprites[kind];
  if (!image) {
    image = new Image();
    image.src = `${import.meta.env?.BASE_URL ?? '/'}assets/effects/${files[kind]}`;
    sprites[kind] = image;
  }
  return image.complete && image.naturalWidth > 0 ? image : null;
}

/** Rotate the warning ring; on the damaging frame, scatter blue pixels and fade out. */
export function drawBossFrostZone(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, struck: boolean, time: number, reducedMotion: boolean, impactAge = 0) {
  const ring = effectImage('ring');
  const impact = effectImage('impact'); // preload during the warning, before the hit
  if (struck && impactAge >= IMPACT_DURATION) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.imageSmoothingEnabled = false;
  if (!struck) {
    if (!reducedMotion) ctx.rotate(time * 5);
    if (ring) ctx.drawImage(ring, -radius, -radius, radius * 2, radius * 2);
    else {
      ctx.strokeStyle = '#63dffa'; ctx.lineWidth = Math.max(4, radius * .09); ctx.lineCap = 'square';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath(); ctx.arc(0, 0, radius * .78, i * Math.PI / 3, i * Math.PI / 3 + .65); ctx.stroke();
      }
    }
  } else {
    const progress = Math.max(0, Math.min(1, impactAge / IMPACT_DURATION));
    const size = radius * (reducedMotion ? 2 : 1.35 + progress * .9);
    ctx.globalAlpha *= 1 - progress;
    if (impact) ctx.drawImage(impact, -size / 2, -size / 2, size, size);
    else {
      // Pixel shards provide visible impact feedback if the art has not loaded yet.
      const distance = radius * (.25 + .55 * progress), pixel = Math.max(2, radius * .07);
      for (let i = 0; i < 12; i++) {
        const angle = i * Math.PI / 6;
        ctx.fillStyle = i % 2 ? '#40e1eb' : '#2476ef';
        ctx.fillRect(Math.round(Math.cos(angle) * distance), Math.round(Math.sin(angle) * distance), pixel, pixel);
      }
    }
  }
  ctx.restore();
}

/** Frost Guardian spell: a warning rune followed by erupting ice crystals. */
let spellImage: HTMLImageElement | undefined;
const IMPACT_DURATION = .3;

function getSpellImage(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  if (!spellImage) {
    spellImage = new Image();
    spellImage.src = `${import.meta.env?.BASE_URL ?? '/'}assets/effects/boss-ice-spell.png`;
  }
  return spellImage.complete && spellImage.naturalWidth > 0 ? spellImage : null;
}

export function drawBossFrostZone(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, struck: boolean, time: number, reducedMotion: boolean, impactAge = 0) {
  const image = getSpellImage(); // Start loading during the warning.
  if (struck && impactAge >= IMPACT_DURATION) return;
  const progress = struck ? Math.max(0, Math.min(1, impactAge / IMPACT_DURATION)) : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha *= struck ? 1 - progress : .92;

  // The ring defines the actual danger area and remains under the spikes as they erupt.
  if (image) {
    const frame = image.naturalWidth / 2;
    ctx.save();
    if (!reducedMotion) ctx.rotate(time * 1.5);
    ctx.drawImage(image, 0, 0, frame, image.naturalHeight, -radius, -radius, radius * 2, radius * 2);
    ctx.restore();
    if (struck) {
      // The base stays on the rune as the crystals rise. They are visible immediately
      // on the damaging frame and quickly reach full height before fading.
      const rise = reducedMotion ? 1 : Math.min(1, .45 + progress * 3);
      const width = radius * 1.75, height = radius * 1.7 * rise;
      ctx.drawImage(image, frame, 0, frame, image.naturalHeight, -width / 2, radius * .38 - height, width, height);
    }
  } else {
    // Keep the danger readable even before the texture has loaded.
    ctx.strokeStyle = '#47ddf5'; ctx.lineWidth = Math.max(3, radius * .07);
    ctx.beginPath(); ctx.arc(0, 0, radius * .82, 0, Math.PI * 2); ctx.stroke();
    if (struck) {
      ctx.fillStyle = '#a9faff';
      ctx.beginPath(); ctx.moveTo(-radius * .35, radius * .2);
      ctx.lineTo(0, -radius * .85); ctx.lineTo(radius * .35, radius * .2); ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

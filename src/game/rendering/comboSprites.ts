import {outfitSheet} from './outfitSprites.ts';
/**
 * Kael's and Aeris's combo frames (public/assets/combat, cut by
 * tools/assets/prepare_combo_sprites.py), the hit effects and the damage numbers.
 *
 * Frames are pre-scaled to game pixels and all share one anchor (head centre across, ground
 * down), so a frame is drawn 1:1 with its anchor on the hero's feet: no jitter, no resampling.
 */
import sprites from '../data/comboSprites.json';
import type { GameEngine } from '../GameEngine.ts';
import { COMBO_HITS, type ComboHero } from '../logic/combo.ts';
import { drawSlash } from './vfx.ts';

interface Sheet { file: string; frameW: number; frameH: number; anchorX: number; anchorY: number; anims: Record<string, number[]> }
const SHEETS: Record<ComboHero, Sheet> = { swordsman: sprites.kael, mage: sprites.aeris };
const images: Partial<Record<ComboHero, HTMLImageElement>> = {};
/** Where the hero's feet are relative to his position (as his walk sprite). */
const FEET_Y = 7;

function image(hero: ComboHero) {
  if (typeof Image === 'undefined') return null;
  let img = images[hero];
  if (!img) {
    img = new Image();
    img.src = `${import.meta.env.BASE_URL}assets/combat/${SHEETS[hero].file}`;
    images[hero] = img;
  }
  return img.complete && img.naturalWidth ? img : null;
}

/** Starts loading both strips (called when a level is built, so the first swing is ready). */
export function preloadComboSprites() { image('swordsman'); image('mage'); }

/** The combo frame to show for the hero now, or null (walk sprite instead). */
export function comboPose(game: GameEngine): { hero: ComboHero; index: number } | null {
  const combo = game.combo;
  if (!combo || game.player.isMoving || (game.characterClass !== 'swordsman' && game.characterClass !== 'mage')) return null;
  const hero = game.characterClass;
  const anims = SHEETS[hero].anims;
  if (combo.active) {
    const hit = COMBO_HITS[hero][combo.step];
    return { hero, index: anims[hit.anim][combo.frame] };
  }
  // Between attacks, the regular idle sprite keeps the last movement direction.
  return null;
}

export function drawComboHero(ctx: CanvasRenderingContext2D, game: GameEngine): boolean {
  const pose = comboPose(game);
  if (!pose) return false;
  const img = image(pose.hero);
  if (!img) return false;
  const s = SHEETS[pose.hero];
  const left = game.comboAim.x < game.player.x;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(game.player.x), Math.round(game.player.y + FEET_Y));
  if (left) ctx.scale(-1, 1);
  ctx.drawImage(outfitSheet(img,pose.hero), pose.index * s.frameW, 0, s.frameW, s.frameH, -Math.round(s.anchorX), -Math.round(s.anchorY), s.frameW, s.frameH);
  ctx.restore();
  return true;
}

/** Sword arcs, impact bursts, the nova ring, spell projectiles and damage numbers. */
export function drawComboEffects(ctx: CanvasRenderingContext2D, game: GameEngine, time: number) {
  ctx.save();
  for (const fx of game.comboFx) {
    const k = 1 - fx.life / fx.max;                     // 0 → 1 over the effect
    ctx.globalAlpha = Math.max(0, 1 - k);
    // Kael's swings use the crescent sheet (vfx.ts); the plain arc below is the spin and the loading fallback.
    if (fx.kind === 'arc' && drawSlash(ctx, fx.x, fx.y, fx.angle, fx.radius, k, !!fx.flip)) continue;
    if (fx.kind === 'arc' || fx.kind === 'spin') {
      const r = fx.radius * (0.85 + 0.15 * k);
      const from = fx.kind === 'spin' ? fx.angle - Math.PI * 2 * Math.min(1, k * 1.6) : fx.angle - 1.15;
      const to = fx.kind === 'spin' ? fx.angle : fx.angle + 1.15;
      ctx.lineCap = 'round';
      ctx.strokeStyle = fx.heavy ? '#fff3c4' : '#f4ffe6'; ctx.lineWidth = fx.heavy ? 7 : 5;
      ctx.beginPath(); ctx.ellipse(fx.x, fx.y, r, r * 0.62, 0, fx.flip ? to : from, fx.flip ? from : to, !!fx.flip); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,214,120,.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(fx.x, fx.y, r - 6, (r - 6) * 0.62, 0, fx.flip ? to : from, fx.flip ? from : to, !!fx.flip); ctx.stroke();
    } else if (fx.kind === 'impact') {
      const r = fx.radius * (0.4 + k * 0.9);
      ctx.fillStyle = '#fffbe8';
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2 + fx.angle, len = r * (i % 2 ? 0.55 : 1);
        ctx.beginPath(); ctx.moveTo(fx.x, fx.y);
        ctx.lineTo(fx.x + Math.cos(a - 0.12) * len * 0.35, fx.y + Math.sin(a - 0.12) * len * 0.35);
        ctx.lineTo(fx.x + Math.cos(a) * len, fx.y + Math.sin(a) * len);
        ctx.lineTo(fx.x + Math.cos(a + 0.12) * len * 0.35, fx.y + Math.sin(a + 0.12) * len * 0.35);
        ctx.fill();
      }
      ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(fx.x, fx.y, r * 0.8, 0, Math.PI * 2); ctx.stroke();
    } else if (fx.kind === 'nova') {
      const r = fx.radius * (0.25 + 0.75 * Math.sqrt(k));
      ctx.fillStyle = 'rgba(120,230,255,.18)';
      ctx.beginPath(); ctx.ellipse(fx.x, fx.y, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#bff6ff'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.ellipse(fx.x, fx.y, r, r * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#3fd8ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(fx.x, fx.y, r * 0.78, r * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 12; i++) {                    // lightning spokes
        const a = i / 12 * Math.PI * 2 + time * 3;
        ctx.beginPath(); ctx.moveTo(fx.x + Math.cos(a) * r * 0.3, fx.y + Math.sin(a) * r * 0.21);
        ctx.lineTo(fx.x + Math.cos(a + 0.15) * r * 0.65, fx.y + Math.sin(a + 0.15) * r * 0.45);
        ctx.lineTo(fx.x + Math.cos(a) * r, fx.y + Math.sin(a) * r * 0.7);
        ctx.stroke();
      }
    } else if (fx.kind === 'charge') {
      ctx.strokeStyle = '#8ff3ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(fx.x, fx.y, fx.radius * (1 - k * 0.6), fx.radius * (1 - k * 0.6) * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  // Spell projectiles: a bright core in a cyan glow, with a short trail.
  for (const shot of game.comboShots) {
    const back = Math.hypot(shot.vx, shot.vy) * 0.045;
    const ux = shot.vx / Math.hypot(shot.vx, shot.vy), uy = shot.vy / Math.hypot(shot.vx, shot.vy);
    ctx.strokeStyle = 'rgba(90,220,255,.45)'; ctx.lineWidth = shot.radius * 1.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(shot.x, shot.y); ctx.lineTo(shot.x - ux * back, shot.y - uy * back); ctx.stroke();
    ctx.fillStyle = 'rgba(80,210,255,.35)';
    ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.radius * 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7fe8ff';
    ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2fdff';
    ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.radius * 0.45, 0, Math.PI * 2); ctx.fill();
  }
  // Damage numbers: rise and fade; the finisher's are larger and gold.
  ctx.textAlign = 'center';
  for (const t of game.damageTexts) {
    const k = 1 - t.life / t.max;
    ctx.globalAlpha = Math.min(1, t.life / 0.25);
    const size = t.heavy ? 22 : 16;
    ctx.font = `bold ${size}px 'Trebuchet MS', system-ui, sans-serif`;
    const y = t.y - k * 26;
    ctx.lineWidth = 4; ctx.strokeStyle = '#120b06';
    ctx.strokeText(t.text, t.x, y);
    ctx.fillStyle = t.heavy ? '#ffd76a' : t.blocked ? '#9fb7c4' : '#fff4e0';
    ctx.fillText(t.text, t.x, y);
  }
  ctx.restore();
}

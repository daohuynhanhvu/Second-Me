import {drawGuardianCast} from './guardianCasting.ts';
import type { BossState } from '../logic/campaign.ts';

// User-supplied Frost_Guardian_FREE_v1.0 sprite sheet: 192 × 128 cells.
const CELL_W = 192;
const CELL_H = 128;
let sheet: HTMLImageElement | null = null;

export function loadFrostGuardian() {
  if (sheet || typeof Image === 'undefined') return;
  sheet = new Image();
  sheet.src = `${import.meta.env.BASE_URL}assets/frost-guardian/sheet.png`;
}

export function frostGuardianFrame(
  boss: Pick<BossState, 'hp' | 'hitFlash' | 'mode' | 'timer' | 'phase' | 'warningDuration' | 'strikeDuration' | 'attack'>,
  time: number,
  deathTime = 0,
  walking = true,
): { row: number; frame: number } {
  if (boss.hp <= 0) return { row: 4, frame: Math.min(15, Math.floor(deathTime * 15)) };
  if (boss.hitFlash > 0) return { row: 3, frame: Math.min(6, Math.floor((0.18 - boss.hitFlash) / 0.18 * 7)) };
  if (boss.mode === 'warning') {
    const duration = boss.warningDuration??(boss.phase === 3 ? 0.8 : 1.1);
    return { row: 2, frame: Math.min(5, Math.floor((duration - boss.timer) / duration * 6)) };
  }
  if (boss.mode === 'strike') return { row: 2, frame: 6 + Math.min(4, Math.max(0,Math.floor(((boss.strikeDuration??.3) - boss.timer) / (boss.strikeDuration??.3) * 5))) };
  if (boss.mode === 'recover' && boss.timer > 0.9) return { row: 2, frame: 11 + Math.min(2, Math.max(0,Math.floor((1.8 - boss.timer) / 0.9 * 3))) };
  return walking
    ? { row: 1, frame: Math.floor(time * 9) % 10 }
    : { row: 0, frame: Math.floor(time * 6) % 6 };
}

export function drawFrostGuardian(
  ctx: CanvasRenderingContext2D,
  boss: BossState,
  time: number,
  deathTime: number,
  facingRight: boolean,
  walking: boolean,
): boolean {
  loadFrostGuardian();
  if (!sheet?.complete || !sheet.naturalWidth) return false;
  const { row, frame } = frostGuardianFrame(boss, time, deathTime, walking);
  ctx.save();
  ctx.translate(Math.round(boss.x), Math.round(boss.y));
  if (facingRight) ctx.scale(-1, 1); // Source art faces left.
  ctx.imageSmoothingEnabled = false;
  if (boss.hitFlash > 0) { ctx.shadowColor = '#c4fbff'; ctx.shadowBlur = 18; }
  if(boss.hp>0&&boss.hitFlash<=0&&(boss.attack==='volley'||boss.attack==='triple')&&(boss.mode==='warning'||boss.mode==='strike'))drawGuardianCast(ctx,sheet,boss);
  else ctx.drawImage(sheet, frame * CELL_W, row * CELL_H, CELL_W, CELL_H, -149, -121, 298, 199);
  ctx.restore();
  return true;
}

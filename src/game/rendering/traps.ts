import type { Trap } from '../logic/types.ts';
import { trapPhase, IMPACT_SECONDS, warningSeconds } from '../logic/traps.ts';
import { translate, getCurrentLanguage } from '../../i18n.ts';
import { drawStrip, forestReady, coreAspect, type Box } from './forestSprites.ts';

/**
 * Trap drawing comes in layers so characters can stand between them:
 * - 'floor': plates, jaws, vines and warning rings (under characters; drawn by the renderer),
 * - 'overhead': falling boulders and labels (over characters; drawn after them),
 * - 'all': the original procedural look, used until the hand-drawn art has loaded.
 */
export type TrapLayer = 'all' | 'floor' | 'overhead';

export const trapSpritesReady = () => forestReady('crusher', 'rocks', 'vines', 'spikes');

const LABEL: Record<Trap['kind'], string> = { vines: 'DÂY LEO', crusher: 'BẪY DẬP', rocks: 'ĐÁ RƠI', spikes: 'BẪY GAI' };

export function drawTrap(ctx: CanvasRenderingContext2D, trap: Trap, time: number, showLabel = true, layer: TrapLayer = 'all') {
  if (layer === 'all' || !trapSpritesReady()) {
    if (layer !== 'floor') drawTrapProcedural(ctx, trap, time, showLabel);
    return;
  }
  if (layer === 'floor') drawTrapFloor(ctx, trap, time);
  else { drawTrapOverhead(ctx, trap, time); if (showLabel) drawLabel(ctx, trap, time); }
}

/** Seconds into the trap's cycle, and how far into its warning / impact windows. */
function cycle(trap: Trap, time: number) {
  const p = ((time + trap.offset) % trap.period + trap.period) % trap.period;
  const impactAt = trap.period - IMPACT_SECONDS;
  const warnAt = trap.period - warningSeconds(trap);
  return { p, sinceImpact: p - impactAt, warn: Math.max(0, Math.min(1, (p - warnAt) / (impactAt - warnAt))) };
}

function drawTrapFloor(ctx: CanvasRenderingContext2D, trap: Trap, time: number) {
  const { x, y, width: w, height: h } = trap;
  const phase = trapPhase(trap, time);
  const { p, sinceImpact, warn } = cycle(trap, time);
  switch (trap.kind) {
    case 'vines': {
      // Dense thorn thicket, gently swaying; slightly larger than the slowing zone so it reads as a patch.
      const sway = 1 + Math.sin(time * 1.7 + x * 0.05) * 0.015;
      drawStrip(ctx, 'vines', 2, { x: x - w * 0.06, y: y - h * 0.12, w: w * 1.12, h: h * 1.18 }, { ref: 2, scale: sway });
      break;
    }
    case 'crusher': {
      // Pairs of rune slabs slam together across the zone; deep zones get a pair per row.
      const shake = phase === 'warning' ? Math.sin(time * 48) * 1.6 * warn : 0;
      const frame = phase === 'impact' ? (sinceImpact < 0.09 ? 1 : 2) : p < 0.35 ? 3 : 0;
      for (const tile of tiles({ x: x + shake, y, w, h }, coreAspect('crusher', 0))) drawStrip(ctx, 'crusher', frame, tile, { ref: 0 });
      break;
    }
    case 'spikes': {
      // Spike plates rise through the warning and stab on impact; long zones get several plates.
      const frame = phase === 'impact' ? (sinceImpact < 0.06 ? 2 : sinceImpact < 0.2 ? 4 : 3)
        : phase === 'warning' ? (warn > 0.75 ? 2 : 1) : p < 0.3 ? 5 : 0;
      for (const tile of tiles({ x, y, w, h }, coreAspect('spikes', 0))) drawStrip(ctx, 'spikes', frame, tile, { ref: 0 });
      break;
    }
    case 'rocks': {
      const zone = { x: x - w * 0.05, y: y - h * 0.05, w: w * 1.1, h: h * 1.1 };
      // Rubble marks the drop zone; fresh rubble right after a hit, faint otherwise.
      const fresh = phase === 'impact' ? 1 : Math.max(0, 1 - p / 0.7);
      drawStrip(ctx, 'rocks', 2, zone, { ref: 2, alpha: 0.28 + 0.72 * fresh });
      if (phase !== 'idle') {
        const fade = phase === 'impact' ? Math.max(0, 1 - sinceImpact / 0.3) : 1;
        const pulse = 0.55 + 0.35 * Math.sin(time * 14);
        drawStrip(ctx, 'rocks', 0, zone, { ref: 0, alpha: fade * (phase === 'warning' ? pulse * (0.5 + warn / 2) : 0.9), scale: 1.08 - 0.1 * warn });
        // The boulder's shadow grows as it falls.
        if (phase === 'warning') {
          ctx.save(); ctx.globalAlpha = 0.18 + 0.4 * warn; ctx.fillStyle = '#071510';
          ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w * 0.38 * (0.4 + 0.6 * warn), h * 0.26 * (0.4 + 0.6 * warn), 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
      }
      break;
    }
  }
}

function drawTrapOverhead(ctx: CanvasRenderingContext2D, trap: Trap, time: number) {
  if (trap.kind !== 'rocks') return;
  const { x, y, width: w, height: h } = trap;
  const phase = trapPhase(trap, time);
  const { sinceImpact, warn } = cycle(trap, time);
  const size = Math.min(w, h) * 0.86;
  let drop: number | null = null;
  if (phase === 'warning' && warn > 0.35) drop = (warn - 0.35) / 0.65;   // falls in the last part of the warning
  else if (phase === 'impact' && sinceImpact < 0.08) drop = 1;           // lands, then shatters into rubble
  if (drop === null) return;
  const fall = drop * drop;   // accelerating
  const cy = y + h / 2 - (1 - fall) * 260;
  const s = size * (1.25 - 0.25 * fall);
  drawStrip(ctx, 'rocks', 1, { x: x + w / 2 - s / 2, y: cy - s / 2, w: s, h: s }, { ref: 1, alpha: Math.min(1, drop * 3) });
}

/** Splits a long zone into plates that keep the art's aspect. */
function tiles(b: Box, aspect: number): Box[] {
  if (b.h > b.w / aspect) {
    const n = Math.max(1, Math.round(b.h / (b.w / aspect)));
    return Array.from({ length: n }, (_, i) => ({ x: b.x, y: b.y + i * b.h / n, w: b.w, h: b.h / n }));
  }
  const n = Math.max(1, Math.round(b.w / (b.h * aspect)));
  return Array.from({ length: n }, (_, i) => ({ x: b.x + i * b.w / n, y: b.y, w: b.w / n, h: b.h }));
}

function drawLabel(ctx: CanvasRenderingContext2D, trap: Trap, time: number) {
  const phase = trapPhase(trap, time);
  const warning = phase === 'warning', impact = phase === 'impact';
  ctx.save();
  ctx.textAlign = 'center'; ctx.font = 'bold 10px sans-serif';
  ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
  ctx.fillStyle = warning ? '#ffe0a3' : impact ? '#ffb399' : '#d2dbc3';
  ctx.fillText(translate(trap.kind !== 'vines' && warning ? 'CẨN THẬN!' : LABEL[trap.kind], getCurrentLanguage()), trap.x + trap.width / 2, trap.y + trap.height + 14);
  ctx.restore();
}

/** The original look, kept for the moment before the art has loaded. */
function drawTrapProcedural(ctx: CanvasRenderingContext2D, trap: Trap, time: number, showLabel: boolean) {
  const { x, y, width: w, height: h, kind } = trap;
  const phase = trapPhase(trap, time);
  const warning = phase === 'warning', impact = phase === 'impact';
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = kind === 'vines' ? 'rgba(91,126,52,.22)' : impact ? 'rgba(244,98,64,.48)' : 'rgba(19,24,19,.4)';
  ctx.strokeStyle = kind === 'vines' ? '#91af65' : warning ? '#ffce83' : impact ? '#ff8668' : '#788576';
  ctx.lineWidth = warning ? 3 : 1;
  ctx.fillRect(0, 0, w, h); ctx.setLineDash(warning ? [7,4] : [3,5]); ctx.strokeRect(0, 0, w, h); ctx.setLineDash([]);
  if (kind === 'vines') {
    for (let i = 0; i < 4; i++) {
      const yy = 9 + i * (h - 18) / 3;
      ctx.beginPath(); ctx.moveTo(3, yy); ctx.bezierCurveTo(w*.3, yy+14, w*.65, yy-14, w-3, yy);
      ctx.strokeStyle = i % 2 ? '#84a75b' : '#537e48'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#88ae62';
      for (const xx of [w*.25, w*.66]) {
        ctx.beginPath(); ctx.ellipse(xx, yy-4, 8, 3, -.6, 0, Math.PI*2); ctx.fill();
      }
    }
  } else if (kind === 'crusher' || kind === 'spikes') {
    // Two opposing stone jaws close on the marked floor at impact.
    const depth = impact ? w / 2 : warning ? 12 + Math.sin(time*30)*2 : 8;
    for (const side of [0, 1]) {
      ctx.fillStyle = impact ? '#bba392' : '#687362';
      ctx.fillRect(side ? w-depth : 0, 0, depth, h);
      ctx.strokeStyle = '#b6c0a2'; ctx.lineWidth = 2;
      ctx.strokeRect(side ? w-depth : 0, 0, depth, h);
      for(let yy=10; yy<h; yy+=20) {
        const edge = side ? w-depth : depth;
        ctx.beginPath(); ctx.moveTo(edge, yy-5); ctx.lineTo(edge+(side?-5:5), yy); ctx.lineTo(edge, yy+5); ctx.stroke();
      }
    }
  } else {
    ctx.beginPath(); ctx.ellipse(w/2, h/2, w*.34, h*.28, 0, 0, Math.PI*2);
    ctx.fillStyle = warning ? 'rgba(0,0,0,.65)' : 'rgba(0,0,0,.25)'; ctx.fill();
    if (impact || warning) {
      const lift = impact ? 0 : 35 + Math.sin(time*20)*3;
      ctx.fillStyle = impact ? '#a69c85' : '#79816f'; ctx.strokeStyle = '#c4baa0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w*.2,h*.35-lift); ctx.lineTo(w*.43,h*.15-lift);
      ctx.lineTo(w*.75,h*.29-lift); ctx.lineTo(w*.82,h*.65-lift); ctx.lineTo(w*.5,h*.82-lift); ctx.lineTo(w*.18,h*.63-lift); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = '#92977f';
      for(const [xx,yy] of [[.3,.4],[.65,.6],[.5,.3]]) ctx.fillRect(w*xx,h*yy,7,5);
    }
  }
  ctx.restore();
  if (showLabel) drawLabel(ctx, trap, time);
}

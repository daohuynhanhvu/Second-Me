import type { Trap } from '../logic/types.ts';
import { trapPhase } from '../logic/traps.ts';
import { translate, getCurrentLanguage } from '../../i18n.ts';

export function drawTrap(ctx: CanvasRenderingContext2D, trap: Trap, time: number, showLabel = true) {
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
  } else if (kind === 'crusher') {
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
  if (showLabel) {
    ctx.textAlign = 'center'; ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = warning ? '#ffe0a3' : impact ? '#ffb399' : '#d2dbc3';
    ctx.fillText(translate(kind === 'vines' ? 'DÂY LEO' : warning ? 'CẨN THẬN!' : kind === 'crusher' ? 'BẪY DẬP' : 'ĐÁ RƠI', getCurrentLanguage()), w/2, h+14);
  }
  ctx.restore();
}

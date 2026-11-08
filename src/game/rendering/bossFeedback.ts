import type { BossState } from '../logic/campaign.ts';
import { biomeLoaded, drawBiomeProp } from './biomes.ts';

export function drawPillars(ctx: CanvasRenderingContext2D, boss: BossState, time: number, reduced: boolean) {
  for (const pillar of boss.pillars) {
    const active = pillar.hp > 0, flash = pillar.hitFlash ?? 0;
    ctx.save();ctx.translate(pillar.x, pillar.y);
    if (active && flash > 0 && !reduced) ctx.translate(Math.sin(flash * 170) * flash * 15, 0);
    if (!active) {
      // Only the broken foot of the illustrated obelisk remains, never the old placeholder.
      ctx.fillStyle = '#0b253d55';ctx.beginPath();ctx.ellipse(0, 13, 32, 12, 0, 0, Math.PI * 2);ctx.fill();
      if (biomeLoaded() === 2) {
        ctx.save();ctx.beginPath();ctx.rect(-50, 4, 100, 32);ctx.clip();
        ctx.filter = 'saturate(.55) brightness(.8)';drawBiomeProp(ctx, 6, 0, 0, 100);ctx.restore();
      }
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4, age = Math.min(1, pillar.destroyedAge ?? 1);
        const distance = 12 + i * 2 + (reduced ? 1 : age) * 8;
        const x = Math.cos(a) * distance, y = 9 + Math.sin(a) * distance * .4;
        ctx.fillStyle = i % 2 ? '#759baa' : '#aed9e6';ctx.strokeStyle = '#d1f3f5';ctx.lineWidth = .7;
        ctx.beginPath();ctx.moveTo(x - 5, y + 3);ctx.lineTo(x - 2, y - 5 - i % 4);ctx.lineTo(x + 5, y);ctx.lineTo(x + 2, y + 4);ctx.closePath();ctx.fill();ctx.stroke();
      }
    } else {
      ctx.shadowColor = '#8eeaff';ctx.shadowBlur = 8 + flash * 60;
      if (flash > 0) ctx.filter = `brightness(${1 + flash * 4})`;
      if (biomeLoaded() === 2) drawBiomeProp(ctx, 6, 0, 0, 100);
      else {ctx.fillStyle='#91d1e6';ctx.fillRect(-15,-40,30,60);}
      ctx.filter = 'none';ctx.shadowBlur = 0;
      if (pillar.hp < pillar.maxHp) {
        ctx.strokeStyle = '#e0faffbb';ctx.lineWidth = 1.5;
        ctx.beginPath();ctx.moveTo(-5,-37);ctx.lineTo(4,-23);ctx.lineTo(-3,-12);ctx.lineTo(8,2);ctx.stroke();
        if (pillar.hp < pillar.maxHp * .5) {ctx.beginPath();ctx.moveTo(4,-23);ctx.lineTo(14,-17);ctx.moveTo(-3,-12);ctx.lineTo(-14,-6);ctx.stroke();}
      }
      ctx.fillStyle = '#102b3a';ctx.fillRect(-25, 31, 50, 5);
      ctx.fillStyle = flash > 0 ? '#fff6c9' : '#a0e7f5';ctx.fillRect(-25,31,50*pillar.hp/pillar.maxHp,5);
      ctx.font = '600 10px sans-serif';ctx.textAlign = 'center';ctx.fillStyle = '#d8f8ff';ctx.fillText(`${Math.round(pillar.hp*10)/10}/${pillar.maxHp}`,0,49);
    }
    ctx.restore();
  }
  if ((boss.shieldBreak ?? 0) > 0) {
    const t = 1 - boss.shieldBreak!;
    ctx.save();ctx.globalAlpha = boss.shieldBreak!;ctx.strokeStyle = '#c1faff';ctx.lineWidth = 4 * boss.shieldBreak!;
    ctx.beginPath();ctx.arc(boss.x,boss.y,64 + (reduced ? 10 : t * 110),0,Math.PI*2);ctx.stroke();
    ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillStyle='#e8fcff';ctx.fillText('SHIELD BROKEN',boss.x,boss.y-90);ctx.restore();
  }
}

export function drawCombatHits(ctx: CanvasRenderingContext2D, hits: { x:number;y:number;damage:number;life:number;broken:boolean }[], reduced: boolean) {
  for (const hit of hits) {
    const progress = 1 - hit.life / .7;
    ctx.save();ctx.translate(hit.x,hit.y);ctx.globalAlpha=Math.min(1,hit.life*5);
    if (progress < .55) {
      ctx.strokeStyle=hit.broken?'#ddfaff':'#fff4c9';ctx.lineWidth=2;
      for(let i=0;i<(hit.broken?12:6);i++) {
        const a=i*2.4, r=(reduced?8:progress*65)+5;
        ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r*.65);ctx.lineTo(Math.cos(a)*(r+7),Math.sin(a)*(r+7)*.65);ctx.stroke();
      }
    }
    ctx.shadowColor='#102339';ctx.shadowBlur=4;ctx.fillStyle=hit.broken?'#e6fbff':'#fff1bf';
    ctx.font=`bold ${hit.broken?21:17}px sans-serif`;ctx.textAlign='center';
    ctx.fillText(`−${Math.round(hit.damage*10)/10}`,0,-30-(reduced?0:progress*26));
    ctx.restore();
  }
}

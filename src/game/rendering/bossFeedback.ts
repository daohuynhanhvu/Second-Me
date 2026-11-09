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
      // Risen again with the boss's shield: it grows out of the ground in 0.7 s, glowing.
      const rise = reduced || pillar.restoreAge === undefined ? 1 : Math.min(1, pillar.restoreAge / .7);
      if (rise < 1) {
        const k = 1 - (1 - rise) ** 3;
        ctx.save();ctx.globalAlpha = 1 - rise;ctx.strokeStyle = '#c1faff';ctx.lineWidth = 3;
        ctx.beginPath();ctx.ellipse(0, 13, 20 + rise * 30, 8 + rise * 11, 0, 0, Math.PI * 2);ctx.stroke();ctx.restore();
        ctx.beginPath();ctx.rect(-60, 30 - 110 * k, 120, 110 * k + 10);ctx.clip();
        ctx.translate(0, (1 - k) * 40);
      }
      ctx.shadowColor = '#8eeaff';ctx.shadowBlur = 8 + flash * 60 + (1 - rise) * 40;
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
      // Integer pixel glyphs remain readable when the game canvas is scaled.
      ctx.fillStyle='#041521';ctx.fillRect(-47,39,94,27);
      ctx.strokeStyle='#8ddbeb';ctx.lineWidth=1;ctx.strokeRect(-46.5,39.5,93,26);
      drawBossNumbers(ctx,`${Math.ceil(pillar.hp)}/${pillar.maxHp}`,0,46,2,'#effcff');
    }
    ctx.restore();
  }
  if ((boss.shieldBreak ?? 0) > 0) {
    const t = 1 - boss.shieldBreak!;
    ctx.save();ctx.globalAlpha = boss.shieldBreak!;ctx.strokeStyle = '#c1faff';ctx.lineWidth = 4 * boss.shieldBreak!;
    ctx.beginPath();ctx.arc(boss.x,boss.y,64 + (reduced ? 10 : t * 110),0,Math.PI*2);ctx.stroke();
    ctx.font='bold 16px "Second Me Pixel", monospace';ctx.textAlign='center';ctx.fillStyle='#e8fcff';ctx.fillText('SHIELD BROKEN',boss.x,boss.y-90);ctx.restore();
  }
  if ((boss.shieldRaise ?? 0) > 0) {
    // The shield closing back round the boss: a ring shrinking onto it, and one from each pillar.
    const left = boss.shieldRaise!, t = 1 - left;
    ctx.save();ctx.globalAlpha = Math.min(1, left * 1.6);ctx.strokeStyle = '#c1faff';ctx.lineWidth = 2 + 4 * t;
    ctx.beginPath();ctx.arc(boss.x,boss.y,64 + (reduced ? 0 : left * 120),0,Math.PI*2);ctx.stroke();
    if (!reduced) {
      ctx.lineWidth = 2;ctx.setLineDash([6, 8]);
      for (const p of boss.pillars) {ctx.beginPath();ctx.moveTo(p.x + (boss.x - p.x) * t, p.y + (boss.y - p.y) * t);ctx.lineTo(p.x + (boss.x - p.x) * Math.min(1, t + .25), p.y + (boss.y - p.y) * Math.min(1, t + .25));ctx.stroke();}
      ctx.setLineDash([]);
    }
    ctx.font='bold 16px "Second Me Pixel", monospace';ctx.textAlign='center';ctx.fillStyle='#e8fcff';ctx.fillText('SHIELD RESTORED',boss.x,boss.y-90);ctx.restore();
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
    ctx.font=`bold ${hit.broken?21:17}px "Second Me Pixel", monospace`;ctx.textAlign='center';
    ctx.fillText(`−${Math.round(hit.damage*10)/10}`,0,-30-(reduced?0:progress*26));
    ctx.restore();
  }
}

const DIGITS:Record<string,string[]>={
 '0':['111','101','101','101','111'],'1':['010','110','010','010','111'],
 '2':['111','001','111','100','111'],'3':['111','001','111','001','111'],
 '4':['101','101','111','001','001'],'5':['111','100','111','001','111'],
 '6':['111','100','111','101','111'],'7':['111','001','010','010','010'],
 '8':['111','101','111','101','111'],'9':['111','101','111','001','111'],
 '/':['001','001','010','100','100']
};
function drawBossNumbers(ctx:CanvasRenderingContext2D,text:string,cx:number,y:number,scale:number,color:string){
 const width=(text.length*4-1)*scale,left=Math.round(cx-width/2);ctx.fillStyle=color;
 [...text].forEach((char,i)=>DIGITS[char]?.forEach((row,dy)=>[...row].forEach((bit,dx)=>{if(bit==='1')ctx.fillRect(left+(i*4+dx)*scale,Math.round(y)+dy*scale,scale,scale);})));
}

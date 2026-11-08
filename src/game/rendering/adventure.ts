import { drawMechanicalSprite } from './mechanicalSprite.ts';
import type { GameEngine } from '../GameEngine.ts';
import { drawTrap, trapSpritesReady } from './traps.ts';
import { translate, getCurrentLanguage } from '../../i18n.ts';
import { drawFrostGuardian } from './frostGuardian.ts';
import { drawSoldierSprite } from './soldierSprite.ts';
let echoCanvas:HTMLCanvasElement|undefined;
export const ECHO_COLORS=['#67e8f9','#c084fc','#fbbf24','#fb7185'];

export function renderAdventure(ctx: CanvasRenderingContext2D, game: GameEngine, time: number) {
  ctx.save();
  if(game.echoes.length){
    echoCanvas??=document.createElement('canvas');echoCanvas.width=96;echoCanvas.height=112;
    const layer=echoCanvas.getContext('2d')!;
    for(const echo of game.echoes){
      layer.clearRect(0,0,96,112);
      if(echo.characterClass==='swordsman')drawSoldierSprite(layer,48,70,echo.direction,echo.isMoving,true,time);
      else if(echo.characterClass==='mechanical')drawMechanicalSprite(layer,48,70,echo.direction,echo.isMoving,true,time);
      else game.renderer.drawEcho(layer,48,70,echo.direction,echo.isMoving,time);
      const slot=echo.colorSlot??0;
      ctx.save();ctx.filter=`hue-rotate(${[0,75,190,140][slot]}deg)`;ctx.drawImage(echoCanvas,echo.x-48,echo.y-70);ctx.restore();
      ctx.strokeStyle=ECHO_COLORS[slot];ctx.lineWidth=game.echo===echo?3:1.5;ctx.beginPath();ctx.ellipse(echo.x,echo.y+12,17,7,0,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=ECHO_COLORS[slot];ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(`E${slot+1}`,echo.x,echo.y-48);
    }
  }
  // With the hand-drawn art the trap floors were drawn under the characters by the renderer;
  // only falling boulders and labels go on top here.
  const trapLayer = trapSpritesReady() ? 'overhead' : 'all';
  for (const trap of game.currentLevel.traps ?? []) drawTrap(ctx, trap, time, game.showHints, trapLayer);
  if (game.legTimeRemaining !== null) {
    if (game.timePickup) {
      const { x, y } = game.timePickup;
      ctx.save(); ctx.translate(x, y); ctx.rotate(time * 1.8);
      ctx.shadowColor = '#8cfbd5'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#b7ffe4'; ctx.strokeStyle = '#3bab83'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(12, 0); ctx.lineTo(0, 15); ctx.lineTo(-12, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
      if (game.showHints) { ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#b7ffe4'; ctx.fillText('+4s', x, y - 22); }
    }
    game.currentLevel.plates.forEach((plate, index) => {
      const current = index === game.checkpointIndex;
      const visited = index < game.checkpointIndex;
      const cx = plate.x + plate.width/2, cy = plate.y - 20;
      ctx.beginPath(); ctx.arc(cx,cy,13,0,Math.PI*2);
      ctx.fillStyle = current ? '#dfbe80' : '#172920'; ctx.fill();
      ctx.strokeStyle = visited ? '#8bd8b4' : '#dfbe80'; ctx.lineWidth = current ? 3 : 1; ctx.stroke();
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = current ? '#18281f' : '#e3d8b8';
      ctx.fillText(visited ? '✓' : `${index+1}`,cx,cy+4);
      if (current) {
        ctx.strokeStyle = '#f3d79b'; ctx.setLineDash([6,5]); ctx.strokeRect(plate.x-8,plate.y-8,plate.width+16,plate.height+16); ctx.setLineDash([]);
      }
    });
    if (game.slowed) {
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#c1e28b';
      ctx.fillText(translate('CHẬM 45%', getCurrentLanguage()),game.player.x,game.player.y-40);
    }
  }
  for (const hazard of game.currentLevel.hazards ?? []) {
    const beat = (time + hazard.offset) % hazard.period;
    const active = beat < 0.9;
    ctx.beginPath(); ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
    ctx.fillStyle = active ? 'rgba(244,96,80,.36)' : 'rgba(235,170,104,.08)';
    ctx.strokeStyle = active ? '#fb8b75' : '#a77f58'; ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(hazard.x, hazard.y, hazard.radius + 5, -Math.PI / 2, -Math.PI / 2 + beat / hazard.period * Math.PI * 2);
    ctx.strokeStyle = '#f4be7a'; ctx.stroke();
    ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.fillStyle = active ? '#ffe3c1' : '#a77f58';
    ctx.fillText('✦', hazard.x, hazard.y + 7);
  }
  const boss = game.boss;
  if (boss) {
    for(const pillar of boss.pillars) {
      const active=pillar.hp>0;
      ctx.save();ctx.translate(pillar.x,pillar.y);ctx.shadowColor=active?'#8eeaff':'#536764';ctx.shadowBlur=active?22:0;
      ctx.fillStyle=active?'#477a83':'#34433d';ctx.strokeStyle=active?'#b9f7ff':'#65706a';ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(0,-36);ctx.lineTo(21,-10);ctx.lineTo(15,25);ctx.lineTo(-15,25);ctx.lineTo(-21,-10);ctx.closePath();ctx.fill();ctx.stroke();
      if(active) {ctx.fillStyle='#c6fbff';ctx.beginPath();ctx.arc(0,-12,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d8faff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(`${Math.ceil(pillar.hp)}/${pillar.maxHp}`,0,42);}
      ctx.restore();
    }
    for(const area of boss.burstAreas) {
      ctx.beginPath();ctx.arc(area.x,area.y,area.radius,0,Math.PI*2);
      ctx.fillStyle=area.struck?'rgba(137,231,255,.5)':'rgba(111,190,224,.16)';
      ctx.strokeStyle=area.struck?'#defbff':'#8bd5ef';ctx.lineWidth=3;ctx.fill();ctx.stroke();
    }
    if (boss.hp > 0 && (boss.mode === 'warning' || boss.mode === 'strike')) {
      ctx.beginPath(); ctx.arc(boss.targetX, boss.targetY, 82, 0, Math.PI * 2);
      ctx.fillStyle = boss.mode === 'warning' ? 'rgba(88,207,255,.18)' : 'rgba(91,220,255,.58)';
      ctx.strokeStyle = '#8ee9ff'; ctx.lineWidth = 3; ctx.fill(); ctx.stroke();
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#d8faff';
      ctx.fillText(translate('NÉ!', getCurrentLanguage()), boss.targetX, boss.targetY - 90);
    }
    for (const shot of boss.projectiles) {
      ctx.beginPath(); ctx.arc(shot.x, shot.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#b9f4ff'; ctx.shadowColor = '#5edcff'; ctx.shadowBlur = 15; ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.ellipse(boss.x, boss.y + 47, 65, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(9,31,39,.52)'; ctx.fill();
    const walking = boss.mode === 'stalking' && Math.hypot(game.player.x - boss.x, game.player.y - boss.y) > 85;
    drawFrostGuardian(ctx, boss, time, game.bossDeathElapsed, game.player.x > boss.x, walking);
    if(boss.armor>0) {ctx.strokeStyle='#91e8ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(boss.x,boss.y,64,0,Math.PI*2);ctx.stroke();}
    if (game.campaign.forged && game.characterClass === 'swordsman' && game.attackFlash > 0) {
      ctx.save(); ctx.translate(game.player.x, game.player.y);
      ctx.beginPath(); ctx.arc(0, 0, 64, -2, 1.4); ctx.strokeStyle = 'rgba(167,255,226,.8)'; ctx.lineWidth = 5; ctx.stroke();
      ctx.restore();
    }
  }
  if(game.lightCircle) {
    const c=game.lightCircle;ctx.save();ctx.globalAlpha=Math.min(1,c.life);
    ctx.fillStyle='rgba(255,221,132,.12)';ctx.strokeStyle='#f6df9e';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(c.x,c.y,58,38,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(c.x,c.y,48,30,0,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.fillRect(c.x+Math.cos(a)*53-2,c.y+Math.sin(a)*34-2,4,4);}
    ctx.restore();
  }
  if(game.characterClass==='mechanical')drawMechanicalSprite(ctx,game.player.x,game.player.y,game.player.direction,game.player.isMoving,false,time,game.attackFlash>0);
  for(const orb of game.orbitOrbs) {
    ctx.save();ctx.globalAlpha=Math.min(1,orb.life);ctx.shadowColor='#82cfff';ctx.shadowBlur=8;
    const x=game.player.x+Math.cos(orb.angle)*36,y=game.player.y-12+Math.sin(orb.angle)*28;
    ctx.fillStyle='#bceaff';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-3,y-4);ctx.lineTo(x+1,y);ctx.lineTo(x-2,y+4);ctx.stroke();ctx.restore();
  }
  if(game.overdrive>0){ctx.strokeStyle='#ffac52';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(game.player.x,game.player.y+4,23,10,0,0,Math.PI*2);ctx.stroke();}
  if(game.characterClass==='swordsman')drawSoldierSprite(ctx,game.player.x,game.player.y,game.player.direction,game.player.isMoving,false,time,game.attackFlash>0);
  if (game.characterClass === 'mage' && game.campaign.forged) {
    ctx.save(); ctx.translate(game.player.x+17, game.player.y);
    ctx.strokeStyle='#b69262'; ctx.lineWidth=7; ctx.beginPath();ctx.moveTo(0,11);ctx.lineTo(3,-39);ctx.stroke();
    ctx.shadowColor='#84fff2';ctx.shadowBlur=20;ctx.fillStyle='#80f5e9';ctx.beginPath();ctx.arc(3,-46,11,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  for (const shot of game.magicShots) {
    const t = Math.min(1, shot.age / 0.3);
    const x = shot.x + (shot.targetX-shot.x)*t, y=shot.y+(shot.targetY-shot.y)*t;
    ctx.save();ctx.shadowColor=shot.skill?'#f7dc83':'#82fff4';ctx.shadowBlur=25;
    ctx.fillStyle=shot.skill?'#ffe7a4':'#b5fff7';ctx.beginPath();ctx.arc(x,y,shot.skill?18:9,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  if(game.skillDrop) {
    const drop=game.skillDrop;
    const y=-35+(drop.y+35)*drop.fall;
    ctx.save();ctx.translate(drop.x,y);ctx.rotate(time*2);ctx.shadowColor='#f5d77c';ctx.shadowBlur=24;
    ctx.fillStyle='#d7af58';ctx.strokeStyle='#fff0ae';ctx.lineWidth=3;
    ctx.fillRect(-18,-18,36,36);ctx.strokeRect(-18,-18,36,36);
    ctx.rotate(-time*2);ctx.fillStyle='#153428';ctx.textAlign='center';ctx.font='bold 20px sans-serif';ctx.fillText('✦',0,7);ctx.restore();
    if(drop.fall<1) {ctx.strokeStyle='rgba(255,232,159,.5)';ctx.beginPath();ctx.arc(drop.x,drop.y,23,0,Math.PI*2);ctx.stroke();}
  }
  if(game.combatFlash) {const f=game.combatFlash;ctx.save();ctx.globalAlpha=Math.min(1,f.time*2);ctx.strokeStyle=f.kind==='fire'?'#ff8b4b':f.kind==='lightning'?'#d9f8ff':'#dfd29c';ctx.lineWidth=7;ctx.beginPath();ctx.arc(f.x,f.y,65*(1-f.time)+18,0,Math.PI*2);ctx.stroke();ctx.restore();}
  if(game.stoneShield>0 || game.armorShield>0) {ctx.strokeStyle=game.stoneShield>0?'#aeb6a3':'#e2d099';ctx.lineWidth=4;ctx.beginPath();ctx.arc(game.player.x,game.player.y-9,31,0,Math.PI*2);ctx.stroke();}
  if (game.invulnerability > 0) {
    ctx.beginPath(); ctx.arc(game.player.x, game.player.y, 24, 0, Math.PI * 2);
    ctx.strokeStyle = '#ecc99d'; ctx.globalAlpha = .5 + Math.sin(time * 25) * .3; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
}

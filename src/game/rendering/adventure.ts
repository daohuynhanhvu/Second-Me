import { drawBossFrostZone } from './bossFrostZone.ts';
import { drawEnemies, drawEnemyAttacks } from './enemies.ts';
import { drawMageStaff, drawLightningOrb } from './mageMagic.ts';
import { drawMechanicalSprite } from './mechanicalSprite.ts';
import type { GameEngine } from '../GameEngine.ts';
import { drawTrap, trapSpritesReady } from './traps.ts';
import { translate, getCurrentLanguage } from '../../i18n.ts';
import { drawFrostGuardian } from './frostGuardian.ts';
import { drawSoldierSprite } from './soldierSprite.ts';
import { drawComboHero, drawComboEffects, comboPose } from './comboSprites.ts';
import { drawTimeRelic } from './timeRelic.ts';
import { drawPillars, drawCombatHits } from './bossFeedback.ts';
let echoCanvas:HTMLCanvasElement|undefined;
export const ECHO_COLORS=['#67e8f9','#c084fc','#fbbf24','#fb7185','#a3e635','#f9a8d4'];

export function renderAdventure(ctx: CanvasRenderingContext2D, game: GameEngine, time: number) {
  ctx.save();
  drawEnemies(ctx,game.enemies,time);
  if(game.echoes.length){
    echoCanvas??=document.createElement('canvas');echoCanvas.width=96;echoCanvas.height=112;
    const layer=echoCanvas.getContext('2d')!;
    for(const echo of game.echoes){
      layer.clearRect(0,0,96,112);
      if(echo.characterClass==='swordsman')drawSoldierSprite(layer,48,70,echo.direction,echo.isMoving,true,time,(echo.attackFlash??0)>0,1-(echo.attackFlash??0)/.22);
      else if(echo.characterClass==='mechanical')drawMechanicalSprite(layer,48,70,echo.direction,echo.isMoving,true,time);
      else game.renderer.drawEcho(layer,48,70,echo.direction,echo.isMoving,time);
      const slot=echo.colorSlot??0;
      ctx.save();ctx.filter=`hue-rotate(${[0,75,190,140,245,310][slot]}deg)`;ctx.drawImage(echoCanvas,echo.x-48,echo.y-70);ctx.restore();
      if (echo.characterClass === 'mage' && (echo.attackFlash ?? 0) > 0 && echo.attackTarget) {
        const t = 1 - (echo.attackFlash ?? 0) / .22;
        const dx = echo.attackTarget.x - echo.x, dy = echo.attackTarget.y - echo.y;
        drawLightningOrb(ctx, echo.x + dx * t, echo.y - 12 + dy * t, Math.atan2(dy, dx), 5, time);
      }
      ctx.strokeStyle=ECHO_COLORS[slot];ctx.lineWidth=game.echo===echo?3:1.5;ctx.beginPath();ctx.ellipse(echo.x,echo.y+12,17,7,0,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle=ECHO_COLORS[slot];ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(`E${slot+1}`,echo.x,echo.y-48);
    }
  }
  // With the hand-drawn art the trap floors were drawn under the characters by the renderer;
  // only falling boulders go on top here.
  const trapLayer = trapSpritesReady() ? 'overhead' : 'all';
  for (const trap of game.currentLevel.traps ?? []) drawTrap(ctx, trap, time, trapLayer, game.currentLevel.id);
  if (game.legTimeRemaining !== null) {
    if (game.timePickup) {
      const { x, y } = game.timePickup;
      drawTimeRelic(ctx, x, y, time, game.reducedMotion, game.showHints);
    }
    game.currentLevel.plates.forEach((plate, index) => {
      const current = index === game.checkpointIndex;
      const visited = index < game.checkpointIndex;
      const cx = plate.x + plate.width/2, cy = plate.y - 20;
      ctx.beginPath(); ctx.arc(cx,cy,13,0,Math.PI*2);
      ctx.fillStyle = current ? '#dfbe80' : '#172920'; ctx.fill();
      ctx.strokeStyle = visited ? '#8bd8b4' : '#dfbe80'; ctx.lineWidth = current ? 3 : 1; ctx.stroke();
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = current ? '#18281f' : '#e3d8b8';
      ctx.fillText(`${index+1}`,cx,cy+4);
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
    drawPillars(ctx, boss, time, game.reducedMotion);
    for (const area of boss.burstAreas) {
      drawBossFrostZone(ctx, area.x, area.y, area.radius, area.struck, time, game.reducedMotion, Math.max(0, -area.timer));
    }
    if (boss.hp > 0 && (boss.mode === 'warning' || boss.mode === 'strike')) {
      const struck = boss.mode === 'strike';
      drawBossFrostZone(ctx, boss.targetX, boss.targetY, 82, struck, time, game.reducedMotion, struck ? Math.max(0, .3 - boss.timer) : 0);
      if (!struck) {
        ctx.save(); ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#d8faff';
        ctx.fillText(translate('NÉ!', getCurrentLanguage()), boss.targetX, boss.targetY - 90); ctx.restore();
      }
    }
    for (const shot of boss.projectiles) {
      ctx.beginPath(); ctx.arc(shot.x, shot.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#b9f4ff'; ctx.shadowColor = '#5edcff'; ctx.shadowBlur = 15; ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.ellipse(boss.x, boss.y + 47, 65, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(9,31,39,.52)'; ctx.fill();
    const bossTarget = game.echoes.slice().sort((a,b)=>Math.hypot(a.x-boss.x,a.y-boss.y)-Math.hypot(b.x-boss.x,b.y-boss.y))[0] ?? game.player;
    const walking = boss.mode === 'stalking' && Math.hypot(bossTarget.x - boss.x, bossTarget.y - boss.y) > 85;
    drawFrostGuardian(ctx, boss, time, game.bossDeathElapsed, bossTarget.x > boss.x, walking);
    if(boss.armor>0) {ctx.strokeStyle='#91e8ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(boss.x,boss.y,64,0,Math.PI*2);ctx.stroke();}

  }
    if (game.characterClass === 'swordsman' && game.attackFlash > 0) {
      ctx.save(); ctx.translate(game.player.x, game.player.y); ctx.rotate(game.attackAngle);
      ctx.beginPath(); ctx.arc(0, 0, 90, -1.05, 1.05); ctx.strokeStyle = 'rgba(167,255,226,.8)'; ctx.lineWidth = 5; ctx.stroke();
      ctx.restore();
    }
  if(game.lightCircle) {
    const c=game.lightCircle;ctx.save();ctx.globalAlpha=Math.min(1,c.life);
    ctx.fillStyle='rgba(255,221,132,.12)';ctx.strokeStyle='#f6df9e';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(c.x,c.y,58,38,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(c.x,c.y,48,30,0,0,Math.PI*2);ctx.stroke();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.fillRect(c.x+Math.cos(a)*53-2,c.y+Math.sin(a)*34-2,4,4);}
    ctx.restore();
  }
  if(game.characterClass==='mechanical' && (!game.exitTravelRemaining || game.exitTravelRemaining>.35))drawMechanicalSprite(ctx,game.player.x,game.player.y,game.player.direction,game.player.isMoving,false,time,game.attackFlash>0);
  for (const orb of game.orbitOrbs) {
    const x = game.player.x + Math.cos(orb.angle) * 36, y = game.player.y - 12 + Math.sin(orb.angle) * 28;
    ctx.save(); ctx.globalAlpha *= Math.min(1, orb.life);
    drawLightningOrb(ctx, x, y, orb.angle + Math.PI / 2, 6, time); ctx.restore();
  }
  if(game.overdrive>0){ctx.strokeStyle='#ffac52';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(game.player.x,game.player.y+4,23,10,0,0,Math.PI*2);ctx.stroke();}
  // Kael and Aeris show their combo frames while attacking (rendering/comboSprites.ts).
  const comboFrame = !game.exitTravelRemaining && comboPose(game) ? drawComboHero(ctx, game) : false;
  if(game.characterClass==='swordsman' && !comboFrame && (!game.exitTravelRemaining || game.exitTravelRemaining>.35))drawSoldierSprite(ctx,game.player.x,game.player.y,game.player.direction,game.player.isMoving,false,time,game.attackFlash>0,1-game.attackFlash/.22);
  // Match Kael's foreground layer: the legacy stage draws walls after its player pass.
  // Drawing Aeris there used to cover her head when standing below a wall.
  if (game.characterClass === 'mage' && !comboFrame && (!game.exitTravelRemaining || game.exitTravelRemaining > .35)) {
    const y = game.player.y - (game.exitTravelRemaining > 0 ? (.7 - game.exitTravelRemaining) * 65 : 0);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(game.player.x, y + 12, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    game.renderer.drawCharacterSprite(ctx, game.player.x, y, game.player.direction, 0, false, time, game.player.isMoving);
    if (game.recorder.getStatus() === 'recording') {
      ctx.fillStyle = '#fb7185'; ctx.font = 'bold 10px ui-monospace,monospace'; ctx.textAlign = 'center';
      ctx.fillText(`REC ${Math.max(0, (8000 - game.recorder.getDuration()) / 1000).toFixed(1)}s`, game.player.x, y - 58);
    }
    ctx.restore();
  }
  if (game.characterClass === 'mage' && !comboFrame && !game.exitTravelRemaining) {
    drawMageStaff(ctx, game.player.x, game.player.y, game.player.direction);
  }
  drawComboEffects(ctx, game, time);
  for (const shot of game.magicShots) {
    const t = Math.min(1, shot.age / (shot.duration ?? .3));
    const x = shot.x + (shot.targetX - shot.x) * t, y = shot.y + (shot.targetY - shot.y) * t;
    drawLightningOrb(ctx, x, y, Math.atan2(shot.targetY - shot.y, shot.targetX - shot.x), shot.skill ? 14 : 10, time);
  }
  if(game.skillDrop) {
    const drop=game.skillDrop;
    const y=drop.y-5+Math.sin(time*3)*3;
    ctx.save();ctx.globalAlpha*=Math.min(1,drop.fall*2);ctx.translate(drop.x,y);
    const color=game.characterClass==='mage'?'#91eaff':'#ffe29a';
    ctx.fillStyle='#163137';ctx.strokeStyle=color;ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,9,23,9,0,0,Math.PI*2);ctx.stroke();
    ctx.fillRect(-13,-19,26,28);ctx.strokeRect(-13,-19,26,28);
    ctx.fillStyle=color;ctx.textAlign='center';ctx.font='bold 20px monospace';
    ctx.fillText(game.characterClass==='mage'?'*':'+',0,3);
    ctx.font='bold 9px monospace';ctx.fillText('SKILL RUNE',0,30);
    ctx.restore();
  }
  if(game.combatFlash) {const f=game.combatFlash;ctx.save();ctx.globalAlpha=Math.min(1,f.time*2);ctx.strokeStyle=f.kind==='fire'?'#ff8b4b':f.kind==='lightning'?'#d9f8ff':'#dfd29c';ctx.lineWidth=7;ctx.beginPath();ctx.arc(f.x,f.y,65*(1-f.time)+18,0,Math.PI*2);ctx.stroke();ctx.restore();}
  if(game.stoneShield>0 || game.armorShield>0) {ctx.strokeStyle=game.stoneShield>0?'#aeb6a3':'#e2d099';ctx.lineWidth=4;ctx.beginPath();ctx.arc(game.player.x,game.player.y-9,31,0,Math.PI*2);ctx.stroke();}
  if (game.invulnerability > 0) {
    ctx.beginPath(); ctx.arc(game.player.x, game.player.y, 24, 0, Math.PI * 2);
    ctx.strokeStyle = '#ecc99d'; ctx.globalAlpha = .5 + Math.sin(time * 25) * .3; ctx.lineWidth = 2; ctx.stroke();
  }
  drawEnemyAttacks(ctx,game.enemies,game.reducedMotion);
  // Hits on the hero have a distinct red impact, shield feedback and actual HP loss.
  for(const hit of game.incomingHits){
    const k=1-hit.life/.85;ctx.save();ctx.globalAlpha=Math.min(1,hit.life/.2);
    ctx.textAlign='center';ctx.font='bold 19px ui-monospace,monospace';ctx.lineWidth=4;ctx.strokeStyle='#180e0b';
    const text=hit.damage>0?`−${hit.damage} HP`:`${game.language==='vi'?'CHẶN':'BLOCK'} ${hit.absorbed}`;
    const y=hit.y-(game.reducedMotion?0:k*28);ctx.strokeText(text,hit.x,y);ctx.fillStyle=hit.damage>0?'#ff947f':'#b4e9ec';ctx.fillText(text,hit.x,y);
    if(k<.35){ctx.strokeStyle=hit.damage>0?'#ffb59a':'#a4e8ed';ctx.lineWidth=3;ctx.beginPath();ctx.arc(hit.x,hit.y+35,12+k*70,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  if(game.hurtFlash>0){ctx.save();ctx.globalAlpha=game.hurtFlash/.28*.24;ctx.fillStyle='#e85c43';ctx.beginPath();ctx.ellipse(game.player.x,game.player.y-15,21,31,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  drawCombatHits(ctx, game.combatHits, game.reducedMotion);
  if (game.isTraining) drawTrainingBoard(ctx, game);
  ctx.restore();
}

/** The training ground's damage readout: a wooden board behind the dummies (logic/training.ts). */
function drawTrainingBoard(ctx: CanvasRenderingContext2D, game: GameEngine) {
  const st = game.training, now = game.levelClock, vi = game.language === 'vi';
  const live = st.active(now), x = 850, y = 66, w = 330, rowH = 24, h = 40 + rowH * 4 + 8;
  const font = (size: number) => `bold ${size}px "Segoe UI", Arial, sans-serif`;
  ctx.save();
  ctx.fillStyle = '#06110d99'; ctx.fillRect(x + 4, y + 5, w, h);                 // shadow
  ctx.fillStyle = '#2e2116'; ctx.fillRect(x, y, w, h);                           // frame
  ctx.fillStyle = '#4a3523'; ctx.fillRect(x + 3, y + 3, w - 6, 32);              // title plank
  for (let r = 0; r < 4; r++) { ctx.fillStyle = r % 2 ? '#3f2d1e' : '#46331f'; ctx.fillRect(x + 3, y + 38 + r * rowH, w - 6, rowH); }
  ctx.strokeStyle = '#140e08'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  ctx.textBaseline = 'middle';
  ctx.font = font(15); ctx.textAlign = 'left'; ctx.fillStyle = '#f0cf7a';
  ctx.fillText(vi ? 'BÃI TẬP · HÌNH NỘM' : 'TRAINING · DUMMIES', x + 14, y + 20);
  ctx.font = font(13); ctx.textAlign = 'right'; ctx.fillStyle = live ? '#a6f0b9' : '#b8a888';
  ctx.fillText(live ? (vi ? '● ĐANG ĐO' : '● LIVE') : (vi ? 'CHỜ ĐÒN' : 'WAITING'), x + w - 14, y + 20);
  const rows: [string, string][] = [
    [vi ? 'Tổng sát thương' : 'Total damage', st.total.toFixed(0)],
    ['DPS', st.dps(now).toFixed(1)],
    [vi ? 'Số đòn · đòn cuối' : 'Hits · last hit', `${st.hits} · ${st.last.toFixed(0)}`],
    [vi ? 'Đòn mạnh nhất' : 'Biggest hit', st.biggest.toFixed(0)],
  ];
  ctx.font = font(14);
  rows.forEach(([k, v], i) => {
    const ry = y + 38 + i * rowH + rowH / 2;
    ctx.textAlign = 'left'; ctx.fillStyle = '#e6d6b2'; ctx.fillText(k, x + 14, ry);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff6dc'; ctx.fillText(v, x + w - 14, ry);
  });
  ctx.restore();
}

import type { GameEngine } from '../GameEngine.ts';
import { drawTrap } from './traps.ts';
import { translate, getCurrentLanguage } from '../../i18n.ts';
import { drawFrostGuardian } from './frostGuardian.ts';

export function renderAdventure(ctx: CanvasRenderingContext2D, game: GameEngine, time: number) {
  ctx.save();
  for (const trap of game.currentLevel.traps ?? []) drawTrap(ctx, trap, time, game.showHints);
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
    if (game.campaign.forged && game.characterClass === 'swordsman') {
      ctx.save(); ctx.translate(game.player.x, game.player.y);
      const angle = game.player.direction === 'left' ? -1.5 : game.player.direction === 'up' ? -2.7 : game.player.direction === 'down' ? .4 : -0.8;
      ctx.rotate(angle + (game.attackFlash > 0 ? (0.22 - game.attackFlash) * 18 : 0));
      ctx.fillStyle = '#dcece2'; ctx.shadowColor = '#6de7d2'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(18, -7); ctx.lineTo(20, -48); ctx.lineTo(25, -56); ctx.lineTo(30, -48); ctx.lineTo(28, -7); ctx.fill();
      ctx.fillStyle = '#d5ad6c'; ctx.fillRect(12, -9, 23, 4); ctx.fillStyle = '#78553c'; ctx.fillRect(21, -5, 5, 14);
      if (game.attackFlash > 0) {
        ctx.beginPath(); ctx.arc(0, 0, 94, -2, 1.4); ctx.strokeStyle = 'rgba(167,255,226,.8)'; ctx.lineWidth = 7; ctx.stroke();
      }
      ctx.restore();
    }
  }
  if (game.characterClass === 'swordsman') {
    ctx.save(); ctx.translate(game.player.x, game.player.y - 8);
    ctx.fillStyle = '#735e4a'; ctx.strokeStyle = '#d4b986'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-17,-17); ctx.lineTo(0,-34); ctx.lineTo(17,-17); ctx.lineTo(13,16); ctx.lineTo(-13,16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8d2d1'; ctx.fillRect(-12,-29,24,14); ctx.fillStyle = '#3c5558'; ctx.fillRect(-10,-20,20,4);
    ctx.restore();
  }
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
  if (game.invulnerability > 0) {
    ctx.beginPath(); ctx.arc(game.player.x, game.player.y, 24, 0, Math.PI * 2);
    ctx.strokeStyle = '#ecc99d'; ctx.globalAlpha = .5 + Math.sin(time * 25) * .3; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
}

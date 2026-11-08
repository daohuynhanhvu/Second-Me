import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../GameEngine.ts';
import { createBoss, updateBoss } from './campaign.ts';
import { sounds } from './sound.ts';
sounds.setMuted(true);

function game() {
  const engine = new GameEngine();
  engine.boss = createBoss();
  engine.screen = 'playing';
  return engine as unknown as Pick<GameEngine, keyof GameEngine> & { damageCombatTarget(x:number,y:number,amount:number,radius?:number):boolean };
}
test('pillar hits report actual damage, flash and retain a timed destroyed state', () => {
  const engine = game(), pillar = engine.boss!.pillars[0];
  assert.equal(engine.damageCombatTarget(pillar.x,pillar.y,15), true);
  assert.equal(pillar.hp,45);assert.equal(pillar.hitFlash,.2);
  assert.equal(engine.combatHits[0].damage,15);
  engine.damageCombatTarget(pillar.x,pillar.y,100);
  assert.equal(pillar.hp,0);assert.equal(pillar.destroyedAge,0);
  assert.equal(engine.combatHits[1].damage,45);assert.equal(engine.combatHits[1].broken,true);
  updateBoss(engine.boss!,engine.player,.1,false);
  assert.equal(pillar.destroyedAge,.1);assert.ok(pillar.hitFlash! < .2);
});
test('the final pillar shatters armor and grants recovery without lingering projectiles', () => {
  const engine = game(), boss = engine.boss!;
  boss.pillars.slice(1).forEach(p=>p.hp=0);
  boss.projectiles.push({x:200,y:200,vx:1,vy:1,life:2});boss.burstRemaining=1;
  const pillar=boss.pillars[0];engine.damageCombatTarget(pillar.x,pillar.y,60);
  assert.equal(boss.armor,0);assert.equal(boss.shieldBreak,1);
  assert.equal(boss.mode,'recover');assert.equal(boss.timer,1.8);
  assert.equal(boss.projectiles.length,0);assert.equal(boss.burstRemaining,0);
  updateBoss(boss, engine.player, .1, false);
  assert.equal(boss.burstRemaining,0);assert.equal(boss.projectiles.length,0);
  assert.equal(engine.damageCombatTarget(boss.x,boss.y,15),true);assert.equal(boss.hp,225);
});
test('missing targets and hitting the protected boss never display successful damage', () => {
  const engine=game(),boss=engine.boss!;
  assert.equal(engine.damageCombatTarget(500,400,15),false);
  assert.equal(engine.damageCombatTarget(boss.x,boss.y,15),false);
  assert.equal(boss.hp,boss.maxHp);assert.equal(engine.combatHits.length,0);
});

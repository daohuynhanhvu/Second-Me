import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../GameEngine.ts';
import { createBoss } from './campaign.ts';
import { segmentCircle, segmentWall } from './combatGeometry.ts';
import { sounds } from './sound.ts';
import { comboDamage } from './combo.ts';
sounds.setMuted(true);
function setup(t:any) {
 const old=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{},classList:{toggle(){}}}}});
 t.after(()=>old?Object.defineProperty(globalThis,'document',old):Reflect.deleteProperty(globalThis,'document'));
 const g=new GameEngine();g.screen='playing';g.currentLevel.walls=[];g.currentLevel.doors=[];
 g.boss=createBoss();g.boss.pillars.forEach(p=>p.hp=0);g.boss.armor=0;
 g.player.x=300;g.player.y=350;g.boss.x=500;g.boss.y=350;return g;
}
test('swept collisions work in every direction and stop at walls',()=>{
 for(const [x,y] of [[100,0],[-100,0],[0,100],[0,-100]])assert.ok(segmentCircle({x:0,y:0},{x,y},{x:x/2,y:y/2},10)!<1);
 assert.equal(segmentWall({x:0,y:50},{x:100,y:50},{x:40,y:0,width:10,height:100},0),.4);
});
/** Runs the combo's clock (and its spells) for `seconds`. */
function run(g:GameEngine,seconds:number){const tick=(g as any).updateCombo.bind(g);for(let t=0;t<seconds;t+=1/120)tick(1/120);}
test('Aeris projectile hits along its path once and cannot pass through a wall',t=>{
 const g=setup(t);g.attack({x:700,y:350});run(g,1.5);
 assert.equal(g.boss!.hp,240-comboDamage('mage',0));assert.equal(g.comboShots.length,0);assert.equal(g.skillDrop,null);
 g.combo!.cancel();g.currentLevel.walls=[{x:400,y:0,width:30,height:720}];g.attack({x:700,y:350});
 run(g,1.5);assert.equal(g.boss!.hp,240-comboDamage('mage',0));assert.equal(g.comboShots.length,0);
});
test('Kael strikes nearby targets in the aimed direction, never behind or beyond reach',t=>{
 const g=setup(t);g.characterClass='swordsman';g.boss!.x=390;
 g.attack({x:0,y:350});run(g,.6);assert.equal(g.boss!.hp,240);
 g.combo!.cancel();g.attack({x:700,y:350});run(g,.6);assert.equal(g.boss!.hp,240-comboDamage('swordsman',0));
 g.combo!.cancel();g.boss!.x=450;g.attack({x:700,y:350});run(g,.6);assert.equal(g.boss!.hp,240-comboDamage('swordsman',0));
});
test("Kael's sword does not cut through a wall",t=>{
 const g=setup(t);g.characterClass='swordsman';g.boss!.x=380;g.currentLevel.walls=[{x:335,y:0,width:12,height:720}];
 g.attack({x:700,y:350});run(g,.6);assert.equal(g.boss!.hp,240);
});
test('uncollected skill runes are preserved instead of replaced on the next spawn',t=>{
 const g=setup(t);(g as any).spawnCombatSkill();const drop=g.skillDrop;
 (g as any).spawnCombatSkill();assert.equal(g.skillDrop,drop);
});

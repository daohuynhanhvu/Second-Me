import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../GameEngine.ts';
import {createBoss,updateBoss} from './campaign.ts';
import {createEnemies} from './enemies.ts';
import {LEVELS} from './levels.ts';
test('ice magic prioritizes boss, then living enemies, then cursor; hits once',()=>{
 const g=new GameEngine();g.screen='playing';g.boss=createBoss();g.boss.pillars=[];g.boss.armor=0;g.enemies=createEnemies(LEVELS[1]);
 g.useSkill({x:12,y:34});assert.equal(g.frostZones[0].x,g.boss.x);g.useSkill();assert.equal(g.frostZones.length,1);
 (g as any).updatePersonalSkill(.61);assert.equal(g.boss.hp,200);(g as any).updatePersonalSkill(.1);assert.equal(g.boss.hp,200);
 g.boss=null;g.skillCooldown=0;g.useSkill();assert.ok(g.enemies.some(e=>e.x===g.frostZones.at(-1)!.x));
 g.enemies=[];g.skillCooldown=0;g.useSkill({x:12,y:34});assert.equal(g.frostZones.at(-1)!.x,12);assert.equal(g.frostZones.at(-1)!.y,34);
});
test('guardian casts three ground rays, slows on contact and expires',()=>{
 const b=createBoss();b.pillars=[];b.mode='warning';b.timer=.01;b.burstCooldown=100;b.targetX=b.x+100;b.targetY=b.y;
 const p={x:b.x+100,y:b.y};updateBoss(b,p,.02,false);assert.equal(b.iceRays!.length,3);
 let slow=0,damage=0;updateBoss(b,p,.76,false,p,[],undefined,n=>damage+=n,()=>slow++);assert.ok(damage>0);assert.ok(slow>0);
 b.mode='recover';b.timer=100;updateBoss(b,p,3.1,false);assert.equal(b.iceRays!.length,0);
});

test('an eruption hits every living enemy in its radius once; dead targets do not attract the cast',()=>{
 const g=new GameEngine();g.screen='playing';g.player.x=300;g.player.y=300;
 const base=createEnemies(LEVELS[1])[0];
 g.enemies=[{...base,id:'dead',x:300,y:300,hp:0},{...base,id:'near',x:350,y:300,hp:100,maxHp:100},{...base,id:'within',x:390,y:300,hp:100,maxHp:100},{...base,id:'far',x:700,y:300,hp:100,maxHp:100}];
 g.useSkill({x:900,y:600});assert.equal(g.frostZones[0].x,350);
 (g as any).updatePersonalSkill(.61);assert.deepEqual(g.enemies.map(e=>e.hp),[0,60,60,100]);
 (g as any).updatePersonalSkill(.1);assert.deepEqual(g.enemies.map(e=>e.hp),[0,60,60,100]);
});

test('frost slows actual player movement, expires outside the rays, and reset removes it',t=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'document');Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{},classList:{toggle(){}}}}});
 t.after(()=>old?Object.defineProperty(globalThis,'document',old):Reflect.deleteProperty(globalThis,'document'));
 const g=new GameEngine();g.currentLevelIdx=5;g.restartLevel();g.beginBossFight();g.enemies=[];g.boss=null;g.currentLevel.walls=[];g.currentLevel.doors=[];g.currentLevel.traps=[];
 g.player.x=300;g.player.y=300;g.player.speed=200;g.frostSlow=1.2;(g as any).heldKeys.add('KeyD');
 (g as any).update(.1);assert.ok(Math.abs(g.player.x-311)<.01);assert.equal(g.slowed,true);
 (g as any).heldKeys.clear();for(let i=0;i<13;i++)(g as any).update(.1);
 assert.equal(g.frostSlow,0);(g as any).heldKeys.add('KeyD');const x=g.player.x;(g as any).update(.1);assert.ok(Math.abs(g.player.x-x-20)<.01);
 g.frostSlow=1;g.restartLevel();assert.equal(g.frostSlow,0);assert.equal(g.frostZones.length,0);
});

test('overlapping rays never multiply one pulse and their gaps remain safe',()=>{
 const b=createBoss();b.x=300;b.y=300;b.mode='warning';b.attack='triple';b.timer=.01;b.targetX=500;b.targetY=300;
 let hits=0;updateBoss(b,{x:310,y:300},.02,false,{x:310,y:300},[],undefined,()=>hits++);assert.equal(hits,1);
 const gap={x:540,y:342};let gapHits=0;updateBoss(b,gap,.8,false,gap,[],undefined,()=>gapHits++);assert.equal(gapHits,0);
});

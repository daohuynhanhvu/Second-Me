import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import { applyDamage } from './damage.ts';
import { GameEngine } from '../GameEngine.ts';
import { sounds } from './sound.ts';
import {createEnemies,updateEnemies,ENEMY_STATS} from './enemies.ts';
import {createBoss,updateBoss} from './campaign.ts';
import {LEVELS} from './levels.ts';
sounds.setMuted(true);
function setup(t:TestContext){const old=Object.getOwnPropertyDescriptor(globalThis,'document');Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});t.after(()=>old?Object.defineProperty(globalThis,'document',old):Reflect.deleteProperty(globalThis,'document'));const g=new GameEngine();g.restartLevel();return g;}
test('damage consumes points, shields absorb partial hits, overkill reports only actual loss',()=>{
 assert.deepEqual(applyDamage(100,28,20),{hp:92,shield:0,absorbed:20,dealt:8});
 assert.deepEqual(applyDamage(7,33),{hp:0,shield:0,absorbed:0,dealt:7});
 assert.equal(applyDamage(100,-5).hp,100);assert.equal(applyDamage(100,NaN).hp,100);
 let hp=100;for(let i=0;i<100;i++)hp=applyDamage(hp,.075).hp;assert.equal(hp,92.5);
});
test('hero receives different damage amounts and feedback, invulnerability prevents repeated damage',t=>{
 const g=setup(t),hit=(n:number)=>(g as unknown as {takeDamage(n:number):void}).takeDamage(n);
 hit(12);assert.equal(g.health,88);assert.equal(g.incomingHits.at(-1)?.damage,12);assert.ok(g.hurtFlash>0);
 hit(28);assert.equal(g.health,88);assert.equal(g.incomingHits.length,1);
 g.invulnerability=0;hit(28);assert.equal(g.health,60);assert.equal(g.incomingHits.at(-1)?.damage,28);
 g.invulnerability=0;g.stoneShield=10;hit(16);assert.equal(g.health,54);assert.equal(g.stoneShield,0);assert.equal(g.incomingHits.at(-1)?.absorbed,10);assert.equal(g.incomingHits.at(-1)?.damage,6);
 g.invulnerability=0;g.armorShield=20;hit(12);assert.equal(g.health,54);assert.equal(g.armorShield,8);assert.equal(g.incomingHits.at(-1)?.damage,0);
});
test('each enemy attack delivers its configured damage to either hero or Echo and has an impact animation',()=>{
 const level=structuredClone(LEVELS[4]);level.walls=[];level.doors=[];
 for(const e of createEnemies(level)){
  const player={x:e.x+10,y:e.y};e.mode='warning';e.timer=.01;e.targetX=player.x;e.targetY=player.y;
  let damage=0;updateEnemies([e],level,player,[],.02,(_,n)=>damage=n);
  assert.equal(damage,ENEMY_STATS[e.kind].damage);assert.equal(e.attackFx,.32);
  e.mode='warning';e.timer=.01;player.y+=100;damage=0;updateEnemies([e],level,player,[],.02,(_,n)=>damage=n);assert.equal(damage,0);assert.equal(e.attackFx,.32,'misses still animate');
 }
});
test('boss rays damage each defender once per pulse and projectiles retain their damage',()=>{
 const player={x:300,y:300},echo={x:310,y:300},g=createBoss();g.x=200;g.y=300;g.mode='warning';g.attack='triple';g.timer=.01;g.targetX=300;g.targetY=300;
 const hits:number[]=[],echoHits:number[]=[];updateBoss(g,player,.02,false,player,[echo],(_,n)=>echoHits.push(n),n=>hits.push(n));assert.deepEqual(hits,[24]);assert.deepEqual(echoHits,[24]);
 g.iceRays=[];g.mode='recover';g.timer=100;g.projectiles=[{x:300,y:300,vx:0,vy:0,life:1}];hits.length=0;updateBoss(g,player,.02,false,player,[],undefined,n=>hits.push(n));assert.deepEqual(hits,[16]);
});
test('outgoing damage text matches actual remaining HP for enemy, pillar and boss',t=>{
 const g=setup(t),hit=(target:unknown,n:number)=>(g as unknown as {strike(t:unknown,n:number):void}).strike(target,n);
 g.enemies=createEnemies(LEVELS[1]);const enemy=g.enemies[0];enemy.hp=7;hit(enemy,33);assert.equal(g.combatHits.at(-1)?.damage,7);
 g.boss=createBoss();g.boss.pillars[0].hp=5;hit(g.boss.pillars[0],33);assert.equal(g.combatHits.at(-1)?.damage,5);
 g.boss.pillars.forEach(p=>p.hp=0);g.boss.hp=9;hit(g.boss,33);assert.equal(g.combatHits.at(-1)?.damage,9);
});

test('Sanctuary damage bonus uses the attacker position, not a remote player position',t=>{
 const g=setup(t);g.lightCircle={x:100,y:100,life:5,heal:0};g.player.x=100;g.player.y=100;
 const e=createEnemies(LEVELS[1])[0];e.hp=e.maxHp=100;g.enemies=[e];
 const strike=(source:{x:number;y:number})=>(g as unknown as {strike(t:unknown,n:number,h:boolean,s:{x:number;y:number}):void}).strike(e,10,false,source);
 strike({x:400,y:300});assert.equal(e.hp,90,'remote Echo gets no Sanctuary bonus');
 strike({x:100,y:100});assert.equal(e.hp,78,'attacker inside receives 20 percent');
});

import test from 'node:test';import assert from 'node:assert/strict';
import {createBoss,updateBoss} from './campaign.ts';
import {chooseBossAttack,recordBossSwing} from './bossBehavior.ts';
test('approach before melee; exactly three swings then one random special',()=>{
 const b=createBoss();assert.equal(chooseBossAttack(b,300),null);
 for(let i=0;i<3;i++){assert.equal(chooseBossAttack(b,90),'melee');recordBossSwing(b,true);}
 assert.equal(chooseBossAttack(b,300,()=>.1),'volley');assert.equal(chooseBossAttack(b,300),null);assert.equal(chooseBossAttack(b,90),'melee');
});
test('three consecutive misses enrage; exactly two random skills then resume melee',()=>{
 const b=createBoss();for(let i=0;i<3;i++)recordBossSwing(b,false);
 assert.equal(b.enraged,true);assert.equal(b.skillQueue,2);
 assert.equal(chooseBossAttack(b,400,()=>.1),'volley');assert.equal(b.skillQueue,1);
 assert.equal(chooseBossAttack(b,400,()=>.9),'triple');assert.equal(b.skillQueue,0);
 assert.equal(chooseBossAttack(b,400),null);assert.equal(chooseBossAttack(b,90),'melee');
});
test('a hit resets the consecutive miss counter; no rage from separated misses',()=>{
 const b=createBoss();recordBossSwing(b,false);recordBossSwing(b,false);recordBossSwing(b,true);assert.equal(b.meleeMisses,0);assert.ok(!b.enraged);assert.equal(chooseBossAttack(b,400,()=>.9),'triple');assert.equal(b.skillQueue,0);
});
test('real impact records a missed dodge once, and third miss queues two skills',()=>{
 const b=createBoss();b.pillars=[];const p={x:b.x+90,y:b.y};
 for(let i=0;i<3;i++){
  b.mode='stalking';b.timer=0;updateBoss(b,p,.01,false);assert.equal(b.attack,'melee');
  let damage=0;updateBoss(b,p,1.16,false,p,[],undefined,n=>damage+=n,undefined,true);assert.equal(damage,0);
  const swings=b.meleeSwings;updateBoss(b,p,.05,false);assert.equal(b.meleeSwings,swings);
 }
 assert.equal(b.enraged,true);assert.equal(b.skillQueue,2);
 b.mode='stalking';b.timer=0;updateBoss(b,p,.01,false,p,[],undefined,undefined,undefined,false,()=>.9);assert.equal(b.attack,'triple');assert.equal(b.skillQueue,1);
});
test('boss chases actual player instead of starting distant punches or skills',()=>{
 const b=createBoss();b.timer=0;const p={x:200,y:350},echo={x:900,y:350},x=b.x;
 updateBoss(b,echo,.1,false,p);assert.equal(b.mode,'stalking');assert.equal(b.attack,undefined);assert.ok(b.x<x);assert.equal(b.projectiles.length,0);
});

test('complete combat cycles produce three punches, one skill, then punches again',()=>{
 const b=createBoss();b.pillars=[];const p={x:b.x+90,y:b.y},sequence:string[]=[];const mode=()=>b.mode;
 for(let turn=0;turn<5;turn++){
  let steps=0;while(b.mode==='stalking'&&steps++<200)updateBoss(b,p,.05,false,p,[],undefined,undefined,undefined,false,()=>.1);
  assert.equal(b.mode,'warning');sequence.push(b.attack!);
  while(mode()!=='stalking'&&steps++<400)updateBoss(b,p,.05,false,p,[],undefined,undefined,undefined,false,()=>.1);
  assert.equal(b.mode,'stalking');
 }
 assert.deepEqual(sequence,['melee','melee','melee','volley','melee']);
});

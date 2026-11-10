import test from 'node:test';
import assert from 'node:assert/strict';
import {createBoss,updateBoss} from './campaign.ts';
const player={x:240,y:600};
test('later phases schedule more volley waves but retain an escape lane',()=>{
 for(const [hp,waves] of [[240,2],[150,3],[70,4]]){
  const b=createBoss();b.hp=hp;b.pillars.forEach(p=>p.hp=0);b.timer=0;b.attackIndex=1;
  updateBoss(b,player,.01,false);assert.equal(b.attack,'volley');assert.equal(b.mode,'warning');assert.equal(b.projectiles.length,0);
  updateBoss(b,player,1.16,false);assert.equal(b.burstRemaining,waves);
  updateBoss(b,player,.21,false);assert.ok(b.projectiles.length>=7);
  for(const p of b.projectiles){const angle=Math.atan2(p.vy,p.vx),gap=b.safeAngle!;assert.ok(Math.abs(Math.atan2(Math.sin(angle-gap),Math.cos(angle-gap)))>=.43);}
 }
});
test('three ground rays warn before damage and the complete attack expires',()=>{
 const b=createBoss();b.pillars=[];b.x=300;b.y=300;b.timer=0;
 const player={x:450,y:300};let hits=0,slows=0;
 updateBoss(b,player,.01,false,player,[],undefined,()=>hits++,()=>slows++);
 assert.equal(b.attack,'triple');assert.equal(b.mode,'warning');assert.equal(hits,0);assert.equal(b.iceRays.length,0);
 updateBoss(b,player,1.16,false,player,[],undefined,()=>hits++,()=>slows++);
 assert.equal(b.iceRays.length,3);assert.equal(hits,1);assert.equal(slows,1);
 for(let i=0;i<60;i++)updateBoss(b,{x:100,y:600},.05,false);
 assert.equal(b.iceRays.length,0);assert.equal(b.mode,'recover');
});
test('recovery never starts independent attacks and attack patterns alternate',()=>{
 const b=createBoss();b.mode='recover';b.timer=1.8;b.burstCooldown=-100;
 for(let i=0;i<20;i++)updateBoss(b,player,.05,false);
 assert.equal(b.mode,'recover');assert.equal(b.projectiles.length,0);assert.equal(b.iceRays.length,0);
 b.mode='stalking';b.timer=0;updateBoss(b,player,.01,false);assert.equal(b.attack,'triple');
 b.mode='stalking';b.timer=0;updateBoss(b,player,.01,false);assert.equal(b.attack,'volley');
 b.mode='stalking';b.timer=0;updateBoss(b,player,.01,false);assert.equal(b.attack,'triple');
});

test('melee is chosen only in close range and never emits ice rays or projectiles',()=>{
 const b=createBoss();b.pillars=[];b.attackIndex=2;b.timer=0;const p={x:b.x+90,y:b.y};
 updateBoss(b,p,.01,false);assert.equal(b.attack,'melee');assert.equal(b.mode,'warning');
 let damage=0;updateBoss(b,p,1.16,false,p,[],undefined,n=>damage+=n);
 assert.equal(damage,30);assert.equal(b.iceRays.length,0);assert.equal(b.burstRemaining,0);
 const far=createBoss();far.attackIndex=2;far.timer=0;updateBoss(far,{x:100,y:600},.01,false);assert.notEqual(far.attack,'melee');
});

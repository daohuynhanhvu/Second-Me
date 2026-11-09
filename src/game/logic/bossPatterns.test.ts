import test from 'node:test';
import assert from 'node:assert/strict';
import {createBoss,updateBoss} from './campaign.ts';
const player={x:240,y:600};
test('later phases schedule more volley waves but retain an escape lane',()=>{
 for(const [hp,waves] of [[240,2],[150,3],[70,4]]){
  const b=createBoss();b.hp=hp;b.pillars.forEach(p=>p.hp=0);b.timer=0;b.attackIndex=hp===240?1:2;
  updateBoss(b,player,.01,false);assert.equal(b.attack,'volley');assert.equal(b.mode,'warning');assert.equal(b.projectiles.length,0);
  updateBoss(b,player,1.16,false);assert.equal(b.burstRemaining,waves);
  updateBoss(b,player,.21,false);assert.ok(b.projectiles.length>=7);
  for(const p of b.projectiles){const angle=Math.atan2(p.vy,p.vx),gap=b.safeAngle!;assert.ok(Math.abs(Math.atan2(Math.sin(angle-gap),Math.cos(angle-gap)))>=.43);}
 }
});
test('frost zones are warned before damage and do not stack at arena edges',()=>{
 const b=createBoss();b.hp=70;b.pillars.forEach(p=>p.hp=0);b.timer=0;b.attackIndex=1;
 let hits=0;updateBoss(b,{x:80,y:85},.01,false,{x:80,y:85},[],undefined,()=>hits++);
 assert.equal(b.attack,'frost');assert.equal(hits,0);assert.ok(b.burstAreas.length>=2);
 for(let i=0;i<b.burstAreas.length;i++)for(let j=0;j<i;j++)assert.ok(Math.hypot(b.burstAreas[i].x-b.burstAreas[j].x,b.burstAreas[i].y-b.burstAreas[j].y)>85);
 updateBoss(b,{x:80,y:85},.3,false,{x:80,y:85},[],undefined,()=>hits++);assert.equal(hits,0);
});
test('recovery never starts independent attacks and attack patterns alternate',()=>{
 const b=createBoss();b.mode='recover';b.timer=1.8;b.burstCooldown=-100;
 for(let i=0;i<20;i++)updateBoss(b,player,.05,false);
 assert.equal(b.mode,'recover');assert.equal(b.projectiles.length,0);assert.equal(b.burstAreas.length,0);
 b.mode='stalking';b.timer=0;updateBoss(b,player,.01,false);assert.equal(b.attack,'slam');
 b.mode='stalking';b.timer=0;updateBoss(b,player,.01,false);assert.equal(b.attack,'volley');
 b.mode='stalking';b.timer=0;updateBoss(b,player,.01,false);assert.equal(b.attack,'frost');
});

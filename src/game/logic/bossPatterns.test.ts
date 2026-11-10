import test from 'node:test';
import assert from 'node:assert/strict';
import {createBoss,updateBoss} from './campaign.ts';
const player={x:240,y:600};
test('later phases fire dense complete rings without a reserved escape sector',()=>{
 for(const [hp,waves] of [[240,4],[150,5],[70,6]]){
  const b=createBoss();b.hp=hp;b.pillars.forEach(p=>p.hp=0);b.timer=0;b.skillQueue=1;
  updateBoss(b,player,.01,false,player,[],undefined,undefined,undefined,false,()=>.1);assert.equal(b.attack,'volley');assert.equal(b.mode,'warning');assert.equal(b.projectiles.length,0);
  updateBoss(b,player,1.16,false);assert.equal(b.burstRemaining,waves);
  updateBoss(b,player,.21,false);assert.equal(b.projectiles.length,hp===240?36:hp===150?48:60);
  const angles=b.projectiles.map(p=>(Math.atan2(p.vy,p.vx)+Math.PI*2)%(Math.PI*2)).sort((a,b)=>a-b);
  const step=Math.PI*2/angles.length;
  for(let i=0;i<angles.length;i++){const next=i+1<angles.length?angles[i+1]:angles[0]+Math.PI*2;assert.ok(Math.abs(next-angles[i]-step)<1e-6);}

 }
});
test('three ground rays warn before damage and the complete attack expires',()=>{
 const b=createBoss();b.pillars=[];b.x=300;b.y=300;b.timer=0;b.skillQueue=1;
 const player={x:450,y:300};let hits=0,slows=0;
 updateBoss(b,player,.01,false,player,[],undefined,()=>hits++,()=>slows++,false,()=>.9);
 assert.equal(b.attack,'triple');assert.equal(b.mode,'warning');assert.equal(hits,0);assert.equal(b.iceRays.length,0);
 updateBoss(b,player,1.16,false,player,[],undefined,()=>hits++,()=>slows++);
 assert.equal(b.iceRays.length,3);assert.equal(hits,1);assert.equal(slows,1);
 for(let i=0;i<60;i++)updateBoss(b,{x:100,y:600},.05,false);
 assert.equal(b.iceRays.length,0);assert.equal(b.mode,'recover');
});
test('recovery never starts independent attacks',()=>{
 const b=createBoss();b.mode='recover';b.timer=1.8;b.burstCooldown=-100;
 for(let i=0;i<20;i++)updateBoss(b,player,.05,false);
 assert.equal(b.mode,'recover');assert.equal(b.projectiles.length,0);assert.equal(b.iceRays.length,0);
});

test('melee is chosen only in close range and never emits ice rays or projectiles',()=>{
 const b=createBoss();b.pillars=[];b.attackIndex=2;b.timer=0;const p={x:b.x+90,y:b.y};
 updateBoss(b,p,.01,false);assert.equal(b.attack,'melee');assert.equal(b.mode,'warning');
 let damage=0;updateBoss(b,p,1.16,false,p,[],undefined,n=>damage+=n);
 assert.equal(damage,30);assert.equal(b.iceRays.length,0);assert.equal(b.burstRemaining,0);
 const far=createBoss();far.attackIndex=2;far.timer=0;updateBoss(far,{x:100,y:600},.01,false);assert.notEqual(far.attack,'melee');
});

test('ice missiles travel beyond 600 pixels and survive the start of recovery',()=>{
 const b=createBoss();b.pillars=[];b.x=1100;b.y=350;b.mode='warning';b.attack='volley';b.timer=.01;
 const p={x:100,y:640};updateBoss(b,p,.02,false);updateBoss(b,p,.21,false);
 const shot=b.projectiles.find(s=>s.vx<0&&Math.abs(s.vy)<.01)!;assert.ok(shot);const start=shot.x;
 for(let i=0;i<60;i++)updateBoss(b,p,.05,false);
 assert.equal(b.mode,'recover');assert.ok(b.projectiles.includes(shot));assert.ok(start-shot.x>600);assert.ok(shot.life>0);
});

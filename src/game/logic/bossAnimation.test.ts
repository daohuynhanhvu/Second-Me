import test from 'node:test';import assert from 'node:assert/strict';
import {bossActionPose} from './bossAnimation.ts';import {createBoss,updateBoss} from './campaign.ts';
test('three attacks use distinct full-body rows, impact frames and recovery frames',()=>{
 const b=createBoss();b.mode='warning';b.warningDuration=1;b.timer=.2;
 b.attack='melee';assert.equal(bossActionPose(b)?.sheet,'original');
 b.attack='triple';assert.equal(bossActionPose(b)?.row,0);
 b.attack='volley';assert.equal(bossActionPose(b)?.row,1);
 b.mode='strike';b.strikeDuration=2;b.timer=2;b.attack='triple';assert.equal(bossActionPose(b)?.frame,5);
 b.attack='volley';assert.equal(bossActionPose(b)?.frame,5);b.timer=1.79;assert.equal(bossActionPose(b)?.frame,6);
 b.mode='recover';b.recoveryDuration=.9;b.timer=.01;assert.equal(bossActionPose(b)?.frame,15);
 b.mode='stalking';assert.equal(bossActionPose(b),null);
});
test('casting locks aim direction and melee cannot hit a distant player at an old mark',()=>{
 const b=createBoss();b.timer=0;b.skillQueue=1;updateBoss(b,{x:b.x-200,y:b.y},.01,false);assert.equal(b.attackFacingRight,false);
 updateBoss(b,{x:b.x+200,y:b.y},.1,false);assert.equal(b.attackFacingRight,false);
 b.attack='melee';b.mode='warning';b.timer=.01;b.targetX=100;b.targetY=100;let damage=0;
 updateBoss(b,{x:100,y:100},.02,false,{x:100,y:100},[],undefined,n=>damage+=n);assert.equal(damage,0);
});

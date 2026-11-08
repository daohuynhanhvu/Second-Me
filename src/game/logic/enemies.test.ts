import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnemies, updateEnemies, ENEMY_STATS } from './enemies.ts';
import { LEVELS } from './levels.ts';
import { rectIntersects, getCharacterBoundingBox } from './collision.ts';
test('trails 2–5 introduce progressively more enemies without blocking gates or switches; tutorial and boss have none',()=>{
 assert.equal(createEnemies(LEVELS[0]).length,0);assert.equal(createEnemies(LEVELS[5]).length,0);
 for(let i=1;i<5;i++){
  const enemies=createEnemies(LEVELS[i]);assert.equal(enemies.length,i+1);
  for(const e of enemies){const box=getCharacterBoundingBox(e.x,e.y,30,30);assert.ok(LEVELS[i].walls.every(w=>!rectIntersects(box,w)),`${e.id} inside wall`);assert.ok(LEVELS[i].doors.every(w=>!rectIntersects(box,w)));assert.ok(LEVELS[i].plates.every(w=>!rectIntersects(box,w)));assert.ok((LEVELS[i].traps??[]).every(w=>!rectIntersects(box,w)),`${e.id} inside trap`);assert.ok(Math.hypot(e.x-LEVELS[i].playerSpawn.x,e.y-LEVELS[i].playerSpawn.y)>120);}
 }
});
test('enemy locks a telegraphed position, dodging avoids it, and walls block aggression',()=>{
 const level=structuredClone(LEVELS[1]);level.walls=[];level.doors=[];const enemies=createEnemies(level).slice(0,1),e=enemies[0];const player={x:e.x+30,y:e.y};e.timer=0;let hits=0;
 updateEnemies(enemies,level,player,[],.01,()=>hits++);assert.equal(e.mode,'warning');assert.equal(hits,0);player.y+=100;updateEnemies(enemies,level,player,[],.8,()=>hits++);assert.equal(hits,0);
 e.mode='idle';e.timer=0;player.y=e.y;updateEnemies(enemies,level,player,[],.01,()=>hits++);updateEnemies(enemies,level,player,[],.8,()=>hits++);assert.equal(hits,1);
 e.mode='idle';e.timer=0;level.walls=[{x:e.x+12,y:e.y-50,width:10,height:100}];updateEnemies(enemies,level,player,[],.01,()=>hits++);assert.notEqual(e.mode,'warning');
});
test('enemies can target Echo decoys and never transfer a pending strike to a replacement Echo',()=>{
 const level=structuredClone(LEVELS[1]);level.walls=[];level.doors=[];const enemies=createEnemies(level).slice(0,1),e=enemies[0];e.timer=0;
 const echo={x:e.x+20,y:e.y,aggroTime:5};let hits=0;updateEnemies(enemies,level,{x:900,y:600},[echo],.01,()=>hits++);assert.equal(e.mode,'warning');assert.equal(e.targetEcho,echo);
 updateEnemies(enemies,level,{x:900,y:600},[{...echo}],.8,()=>hits++);assert.equal(hits,0);
 e.mode='idle';e.timer=0;updateEnemies(enemies,level,{x:900,y:600},[echo],.01,()=>hits++);updateEnemies(enemies,level,{x:900,y:600},[echo],.8,target=>{assert.equal(target.echoIndex,0);hits++;});assert.equal(hits,1);
});

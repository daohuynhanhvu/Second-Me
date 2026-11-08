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

test('all enemies pursue the nearest Echo even after its original attraction timer expires',()=>{
 const level=structuredClone(LEVELS[1]);level.walls=[];level.doors=[];const enemies=createEnemies(level);const e=enemies[0];
 e.x=200;e.y=300;e.homeX=200;e.homeY=300;e.timer=0;
 const distant={x:700,y:300,aggroTime:0}, nearby={x:500,y:300,aggroTime:0};
 updateEnemies([e],level,{x:210,y:300},[distant,nearby],.1,()=>{});
 assert.ok(e.x>200,'enemy moves toward the distant Echo rather than the nearby player');
 assert.equal(e.facingLeft,false);
});

test('an enemy can route around a wall to reach an Echo',()=>{
 const level=structuredClone(LEVELS[1]);level.walls=[{x:500,y:100,width:30,height:300}];level.doors=[];
 const e=createEnemies(level)[0];e.x=440;e.y=240;e.homeX=e.x;e.homeY=e.y;e.timer=0;
 const echo={x:590,y:240,aggroTime:0};let hits=0;
 for(let i=0;i<350;i++)updateEnemies([e],level,{x:100,y:600},[echo],.05,()=>hits++);
 assert.ok(hits>0,`enemy should route around wall and attack, ended at ${e.x.toFixed(0)},${e.y.toFixed(0)}`);
});

test('ranged enemies close to within Echo combat range before attacking',()=>{
 const level=structuredClone(LEVELS[3]);level.walls=[];level.doors=[];
 const e=createEnemies(level).find(e=>e.kind==='shaman')!;e.x=300;e.y=300;e.homeX=300;e.homeY=300;e.timer=0;
 const echo={x:480,y:300,aggroTime:0};let attackedAt=Infinity;
 for(let i=0;i<200&&attackedAt===Infinity;i++){
  updateEnemies([e],level,{x:100,y:100},[echo],.05,()=>{attackedAt=Math.hypot(e.x-echo.x,e.y-echo.y);});
 }
 assert.ok(attackedAt<120,`ranged enemy should enter the Echo's 3m area before attacking, got ${attackedAt}`);
});

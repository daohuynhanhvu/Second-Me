import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnemies, updateEnemies, ENEMY_STATS, LURE_MEMORY } from './enemies.ts';
import { reachableWaypoint } from './enemyNavigation.ts';
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

test('an enemy is drawn to the nearest Echo it can see within its lure range, not to one beyond it',()=>{
 const level=structuredClone(LEVELS[1]);level.walls=[];level.doors=[];const e=createEnemies(level)[0];
 e.x=200;e.y=300;e.homeX=200;e.homeY=300;e.timer=0;
 const lure=ENEMY_STATS[e.kind].lure, near={x:200+lure-40,y:300}, far={x:200,y:300+lure+60};
 updateEnemies([e],level,{x:1100,y:650},[far,near],.1,()=>{});
 assert.ok(e.x>200,'moves toward the Echo inside its lure range');assert.equal(e.lureEcho,near);
 const alone=createEnemies(level)[0];alone.x=200;alone.y=300;alone.homeX=200;alone.homeY=300;alone.timer=0;
 updateEnemies([alone],level,{x:1100,y:650},[far],.1,()=>{});
 assert.equal(alone.x,200);assert.equal(alone.y,300);assert.equal(alone.lureEcho,undefined);
});

test('walls and closed gates hide an Echo from enemies; an open gate does not',()=>{
 const level=structuredClone(LEVELS[1]);level.doors=[];
 level.walls=[{x:300,y:200,width:30,height:200}];
 const e=createEnemies(level)[0];e.x=200;e.y=300;e.homeX=200;e.homeY=300;e.timer=0;
 const echo={x:400,y:300};
 updateEnemies([e],level,{x:1100,y:650},[echo],.1,()=>{});
 assert.equal(e.lureEcho,undefined,'not drawn through a wall');assert.equal(e.x,200);
 level.walls=[];
 const gate={id:'g',x:300,y:200,width:30,height:200,isOpen:false,openProgress:0,requiredPlates:[],orientation:'vertical' as const};
 level.doors=[gate];
 updateEnemies([e],level,{x:1100,y:650},[echo],.1,()=>{});
 assert.equal(e.lureEcho,undefined,'not drawn through a closed gate');
 gate.isOpen=true;gate.openProgress=1;
 updateEnemies([e],level,{x:1100,y:650},[echo],.1,()=>{});
 assert.equal(e.lureEcho,echo,'drawn once the gate is open');
});

test('an enemy that saw an Echo follows it round a wall, and gives up after losing it for a while',()=>{
 const level=structuredClone(LEVELS[1]);level.walls=[{x:500,y:100,width:30,height:300}];level.doors=[];
 const e=createEnemies(level)[0];e.x=440;e.y=420;e.homeX=e.x;e.homeY=e.y;e.timer=0;
 const echo={x:560,y:430};let hits=0;
 updateEnemies([e],level,{x:100,y:650},[echo],.05,()=>{});
 assert.equal(e.lureEcho,echo,'sees the Echo past the end of the wall');
 echo.x=590;echo.y=240;   // the Echo walks on, behind the wall
 for(let i=0;i<350;i++)updateEnemies([e],level,{x:100,y:650},[echo],.05,()=>hits++);
 assert.ok(hits>0,`enemy should route around wall and attack, ended at ${e.x.toFixed(0)},${e.y.toFixed(0)}`);
 // Lost from sight for longer than LURE_MEMORY: back home.
 const g=createEnemies(level)[0];g.x=440;g.y=420;g.homeX=g.x;g.homeY=g.y;g.timer=0;
 const hidden={x:560,y:430};
 updateEnemies([g],level,{x:100,y:650},[hidden],.05,()=>{});
 hidden.x=1100;hidden.y=130;
 for(let i=0;i<Math.ceil((LURE_MEMORY+.5)/.05);i++)updateEnemies([g],level,{x:100,y:650},[hidden],.05,()=>{});
 assert.equal(g.lureEcho,undefined);
 for(let i=0;i<200;i++)updateEnemies([g],level,{x:100,y:650},[hidden],.05,()=>{});
 assert.ok(Math.hypot(g.x-g.homeX,g.y-g.homeY)<10,'returned home');
});

test('no route to the target (a sealed room) is reported instead of walking into the wall',()=>{
 const walls=[{x:600,y:200,width:200,height:20},{x:600,y:400,width:200,height:20},{x:600,y:200,width:20,height:220},{x:780,y:200,width:20,height:220}];
 assert.equal(reachableWaypoint({x:300,y:300},{x:700,y:310},walls,.05),null);
 assert.notEqual(reachableWaypoint({x:300,y:300},{x:700,y:520},walls,.05),null);
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

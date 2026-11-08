import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../GameEngine.ts';
import { LEVELS } from './levels.ts';
import { getActiveObstacles, rectIntersects, getCharacterBoundingBox } from './collision.ts';
import { trapPhase, trapEffects } from './traps.ts';
import { isPuzzleExitOpen } from './puzzle.ts';
import { MapValidator } from './mapValidator.ts';
import { sounds } from './sound.ts';
import { createBoss, updateBoss } from './campaign.ts';
sounds.setMuted(true);

test('redesigned maps have no geometry errors and require escalating simultaneous Echo holds',()=>{
 const audit=MapValidator.validateAll(LEVELS);assert.equal(audit.errorsCount,0,JSON.stringify(audit.issues));
 assert.deepEqual(LEVELS.slice(0,5).map(l=>l.plates.length),[1,2,3,4,5]);
 for(const level of LEVELS.slice(0,5)) {
  const copy=structuredClone(level);assert.equal(isPuzzleExitOpen(copy,copy.plates.length),false);
  copy.plates.forEach(p=>p.isPressed=true);assert.equal(isPuzzleExitOpen(copy,copy.plates.length),true);
  copy.plates.find(p=>p.id===copy.exitRequiredPlates![0])!.isPressed=false;assert.equal(isPuzzleExitOpen(copy,copy.plates.length),false);
 }
});

function route(game:GameEngine,x:number,y:number) {
 const obstacles=getActiveObstacles(game.currentLevel.walls,game.currentLevel.doors),step=20;
 const start=[Math.round(game.player.x/step),Math.round(game.player.y/step)],end=[Math.round(x/step),Math.round(y/step)];
 for(const avoid of [true,false]) {
  const id=(a:number,b:number)=>`${a},${b}`,from=new Map<string,string|null>([[id(...start as [number,number]),null]]),q=[start];
  for(let n=0;n<q.length;n++) {
   const [a,b]=q[n];
   if(a===end[0]&&b===end[1]) {
    const path:number[][]=[];let key:string|null=id(a,b);
    while(key!==null){path.push(key.split(',').map(Number).map(v=>v*step));key=from.get(key)!;}return path.reverse();
   }
   for(const [da,db] of [[1,0],[0,1],[-1,0],[0,-1]]) {
    const aa=a+da,bb=b+db,key=id(aa,bb),box=getCharacterBoundingBox(aa*step,bb*step,26,26);
    if(aa<3||aa>61||bb<3||bb>33||from.has(key)||obstacles.some(o=>rectIntersects(box,o)))continue;
    if(avoid&&game.currentLevel.traps?.some(t=>t.kind!=='vines'&&rectIntersects(box,t)))continue;
    from.set(key,id(a,b));q.push([aa,bb]);
   }
  }
 }
 throw new Error(`No route in level ${game.currentLevel.id} to ${x},${y}`);
}

for(let index=0;index<5;index++)test(`trail ${index+1}: real movement, timed traps and ${LEVELS[index].plates.length} recorded Echoes can reach victory`,t=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
 t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):Reflect.deleteProperty(globalThis,'document'));
 const game=new GameEngine();game.currentLevelIdx=index;game.restartLevel();
 const control=game as unknown as {update(dt:number):void;heldKeys:Set<string>;elapsedLevelTime:number};
 const tick=(dt:number)=>{control.update(dt);assert.ok(game.screen==='playing'||game.screen==='victory',`level ${index+1}: ${game.defeatReason} at ${game.player.x},${game.player.y}`);};
 const move=(x:number,y:number)=>{
  for(const [px,py] of route(game,x,y))for(const axis of ['x','y'] as const) {
   const goal=axis==='x'?px:py;let guard=0;
   while(Math.abs(game.player[axis]-goal)>.2&&game.screen==='playing') {
    assert.ok(++guard<2000,'movement blocked');
    const delta=goal-game.player[axis],dir=Math.sign(delta),next={...game.player,[axis]:game.player[axis]+dir*4};
    const hazards=game.currentLevel.traps!.filter(trap=>trap.kind!=='vines'&&!rectIntersects(getCharacterBoundingBox(game.player.x,game.player.y,24,24),trap)&&rectIntersects(getCharacterBoundingBox(next.x,next.y,24,24),trap));
    if(hazards.some(trap=>Array.from({length:21},(_,i)=>trapPhase(trap,control.elapsedLevelTime+i*.05)).includes('impact'))) {tick(.02);continue;}
    const key=axis==='x'?(dir>0?'KeyD':'KeyA'):(dir>0?'KeyS':'KeyW');
    control.heldKeys.add(key);const speed=game.player.speed*trapEffects(game.currentLevel.traps!,game.player,control.elapsedLevelTime).speedMultiplier;
    tick(Math.min(.02,Math.abs(delta)/speed));control.heldKeys.clear();
   }
  }
 };
 for(const plate of game.currentLevel.plates) {
  if(game.echoes.length===4) {
   const obsolete=game.echoes.findIndex(e=>game.currentLevel.plates.some(p=>!game.currentLevel.exitRequiredPlates!.includes(p.id)&&Math.hypot(p.x+25-e.x,p.y+25-e.y)<35));
   assert.ok(obsolete>=0,'the final relay needs one reusable Echo');game.selectedEcho=obsolete;game.dismissEcho();
  }
  game.toggleRecording();move(plate.x+25,plate.y+25);game.toggleRecording();
  const recording=game.recorder.getDuration();game.spawnEcho();const summoned=game.echo!;
  for(let time=0;time<recording/1000+.35;time+=.02)tick(.02);
  // Echo may pause its recording to fight; wait until it actually reaches the rune
  // instead of mistaking the player standing on it for an Echo holding it.
  for(let time=0;time<10 && game.echoes.includes(summoned) && !rectIntersects(getCharacterBoundingBox(summoned.x,summoned.y,24,24),plate);time+=.02)tick(.02);
  assert.ok(game.echoes.includes(summoned) && rectIntersects(getCharacterBoundingBox(summoned.x,summoned.y,24,24),plate), 'Echo reaches its rune after combat');
  assert.ok(game.currentLevel.plates.find(p=>p.id===plate.id)!.isPressed);
 }
 assert.equal(game.echoes.length,game.currentLevel.exitRequiredPlates!.length);
 assert.equal(isPuzzleExitOpen(game.currentLevel,game.checkpointIndex),true);
 move(game.currentLevel.exit.x+30,game.currentLevel.exit.y+30);
 for(let i=0;i<45&&game.screen==='playing';i++)tick(.02);
 assert.equal(game.screen,'victory');assert.ok(game.health>0);
 console.log(`Solved trail ${index+1}: ${control.elapsedLevelTime.toFixed(1)}s, ${game.health}/5 HP, ${game.echoes.length} Echoes`);
});

test('a decoy redirects targeting but cannot grant immunity to projectiles hitting the player',()=>{
 const boss=createBoss();boss.timer=100;boss.burstCooldown=100;
 boss.projectiles=[{x:500,y:400,vx:0,vy:0,life:1}];
 assert.equal(updateBoss(boss,{x:100,y:100},.01,false,{x:500,y:400}),true);
});

test('puzzle preparation does not drain health and paused Echoes survive deliberate planning',()=>{
 const game=new GameEngine();game.screen='playing';game.legTimeRemaining=null;game.player.x=1000;game.player.y=550;
 const control=game as unknown as {update(dt:number):void};
 for(let i=0;i<60;i++)control.update(.1);
 assert.equal(game.health,5,'no automatic dissonance damage in puzzle rooms');
 game.recorder.startRecording(game.player.x,game.player.y,'right');game.toggleRecording();game.spawnEcho();game.pauseEcho();
 for(let i=0;i<60;i++)control.update(.1);
 assert.equal(game.echoes.length,1);assert.ok(game.echo!.stability!>=90);
});

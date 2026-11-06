import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../GameEngine.ts';
import { trapEffects, trapPhase } from './traps.ts';
import { sounds } from './sound.ts';
import { LEVELS } from './levels.ts';
import { rectIntersects } from './collision.ts';
sounds.setMuted(true);

function setup(t: TestContext, index = 0) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
  t.after(()=>previous ? Object.defineProperty(globalThis,'document',previous) : Reflect.deleteProperty(globalThis,'document'));
  const game = new GameEngine(); game.currentLevelIdx = index; game.restartLevel();
  const controls = game as unknown as { update(dt: number): void; heldKeys: Set<string> };
  const advance = (seconds: number) => { for(let i=0; i<Math.round(seconds*100); i++) controls.update(.01); };
  const checkpoint = (index: number) => { const p = game.currentLevel.plates[index]; game.player.x=p.x+p.width/2; game.player.y=p.y+p.height/2; advance(.01); };
  return { game, controls, advance, checkpoint };
}

test('ten-second timeout shows defeat and retry resets every stage of the attempt', t => {
  const { game, advance } = setup(t);
  advance(9.99); assert.equal(game.screen,'playing');
  advance(.01); assert.equal(game.screen,'defeat'); assert.equal(game.defeatReason,'timeout');
  assert.equal(game.legTimeRemaining,0); assert.equal(game.campaign.completed.length,0);
  game.restartLevel(); assert.equal(game.legTimeRemaining,10); assert.equal(game.checkpointIndex,0);
  assert.equal(game.screen,'playing'); assert.equal(game.echo,null);
});

test('only the player reaching the next new checkpoint replenishes ten seconds', t => {
  const { game, advance, checkpoint } = setup(t,1);
  checkpoint(1); assert.equal(game.checkpointIndex,0); // Out of order.
  advance(1); checkpoint(0); assert.equal(game.checkpointIndex,1); assert.equal(game.legTimeRemaining,10);
  advance(1); assert.ok(game.legTimeRemaining! < 9.01); // Staying cannot farm time.
  game.toggleRecording();game.toggleRecording();game.spawnEcho();
  const next=game.currentLevel.plates[1]; game.echo!.x=next.x+25;game.echo!.y=next.y+25;game.echo!.status='finished';
  advance(.5);assert.equal(game.checkpointIndex,1);assert.ok(game.legTimeRemaining!<8.51);
  checkpoint(1);assert.equal(game.checkpointIndex,2);assert.equal(game.legTimeRemaining,10);
  advance(10);assert.equal(game.screen,'defeat'); // Final portal leg is timed too.
});

test('pause freezes the checkpoint clock and boss arena has no checkpoint deadline',t=>{
  const { game, advance }=setup(t);
  advance(1); const remaining=game.legTimeRemaining;game.pauseGame();advance(8);
  assert.equal(game.legTimeRemaining,remaining);game.resumeGame();advance(1);assert.ok(game.legTimeRemaining!<8.01);
  game.currentLevelIdx=5;game.restartLevel();assert.equal(game.legTimeRemaining,null);
  game.boss!.timer=100;game.boss!.burstCooldown=100;advance(10);assert.equal(game.screen,'playing');assert.equal(game.defeatReason,'damage');
});

test('damaging traps warn before impact and vines slow without dealing damage',()=>{
  for(const kind of ['crusher','rocks'] as const) {
    const trap={kind,x:0,y:0,width:80,height:80,period:4,offset:0};
    assert.equal(trapPhase(trap,0),'idle');assert.equal(trapPhase(trap,3),'warning');assert.equal(trapPhase(trap,3.8),'impact');
    assert.equal(trapEffects([trap],{x:40,y:40},3).damage,false);
    assert.equal(trapEffects([trap],{x:40,y:40},3.8).damage,true);
    assert.equal(trapEffects([trap],{x:140,y:40},3.8).damage,false);
  }
  const vines={kind:'vines' as const,x:0,y:0,width:80,height:80,period:4,offset:0};
  assert.deepEqual(trapEffects([vines],{x:40,y:40},0),{damage:false,slowed:true,speedMultiplier:.55});
});

test('vine movement slowdown clears on leaving and trap impact cannot drain health every frame',t=>{
  const {game,controls,advance}=setup(t);
  game.currentLevel.traps=[{kind:'vines',x:200,y:300,width:80,height:100,period:4,offset:0}];
  controls.heldKeys.add('KeyD');advance(.1);assert.ok(Math.abs(game.player.x-231)<.01);
  game.player.x=400;advance(.1);assert.ok(Math.abs(game.player.x-420)<.01);assert.equal(game.slowed,false);
  controls.heldKeys.clear();
  game.currentLevel.traps=[{kind:'crusher',x:390,y:310,width:80,height:100,period:4,offset:3.5}];
  advance(.2);assert.equal(game.health,4);
});

test('all five trials contain three distinct trap types in clear walkable space; boss has none',()=>{
  for(const level of LEVELS.slice(0,5)) {
    assert.equal(new Set(level.traps!.map(t=>t.kind)).size,3);
    for(const trap of level.traps!) {
      assert.ok(!level.walls.some(w=>rectIntersects(trap,w)),`level ${level.id} trap overlaps wall at ${trap.x},${trap.y}`);
      assert.ok(!level.plates.some(p=>rectIntersects(trap,p)),`level ${level.id} unsafe checkpoint`);
    }
  }
  assert.equal(LEVELS[5].traps,undefined);
});

test('time shards appear every three seconds nearby and add four seconds once',t=>{
  const {game,advance}=setup(t);
  advance(2.99); assert.equal(game.timePickup,null);
  advance(.02); assert.ok(game.timePickup);
  const shard=game.timePickup as {x:number;y:number} | null;
  assert.ok(shard);
  assert.ok(Math.hypot(shard.x-game.player.x,shard.y-game.player.y)<=111);
  assert.ok(!game.currentLevel.walls.some(w=>rectIntersects({x:shard.x-12,y:shard.y-12,width:24,height:24},w)));
  const remaining=game.legTimeRemaining!;
  game.player.x=shard.x;game.player.y=shard.y;advance(.01);
  assert.equal(game.timePickup,null);
  assert.ok(Math.abs(game.legTimeRemaining!-(remaining+4-.01))<.001);
  advance(.01);assert.ok(game.legTimeRemaining!<remaining+4);
});

test('a crusher hit roots the player for a quarter second',t=>{
  const {game,controls,advance}=setup(t);
  game.currentLevel.traps=[{kind:'crusher',x:180,y:320,width:80,height:80,period:4,offset:3.6}];
  advance(.01); assert.equal(game.health,4); assert.ok(game.trappedTime>=.25);
  game.currentLevel.traps=[]; controls.heldKeys.add('KeyD');
  const x=game.player.x;advance(.2);assert.equal(game.player.x,x);
  advance(.1);assert.ok(game.player.x>x);
});

import { COMBO_HITS, hitDuration } from './combo.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Campaign, createBoss, swordHit, updateBoss, levelRating } from './campaign.ts';
import { GameEngine } from '../GameEngine.ts';
import { LEVELS } from './levels.ts';
import { sounds } from './sound.ts';
sounds.setMuted(true);

test('each of five trails grants a unique material; replay cannot duplicate it', () => {
  const campaign = new Campaign();
  assert.equal(campaign.forge(), false);
  for (let i=1;i<=5;i++) {
    assert.equal(campaign.award(i), true);
    assert.equal(campaign.award(i), false);
  }
  assert.equal(campaign.completed.length, 5);
  assert.equal(campaign.award(6), false);
  assert.equal(campaign.canForge, true);
  assert.equal(campaign.forge(), true);
  assert.equal(campaign.forge(), false);
  campaign.reset();
  assert.equal(campaign.completed.length, 0);
  assert.equal(campaign.forged, false);
});

test('star thresholds pay the correct coins and time items are single use', () => {
  assert.deepEqual([15, 15.01, 20, 20.01, 25, 25.01].map(levelRating), [
    {stars:3,coins:12},{stars:2,coins:8},{stars:2,coins:8},
    {stars:1,coins:4},{stars:1,coins:4},{stars:0,coins:0},
  ]);
  const campaign = new Campaign();
  campaign.completeLevel(1, 14);
  assert.equal(campaign.coins, 12);
  assert.equal(campaign.buyTimeItem(), true);
  assert.equal(campaign.buyTimeItem(), true);
  assert.equal(campaign.buyTimeItem(), false);
  assert.equal(campaign.coins, 2);
  assert.equal(campaign.timeItems, 2);
  assert.equal(campaign.useTimeItem(), true);
  assert.equal(campaign.useTimeItem(), true);
  assert.equal(campaign.useTimeItem(), false);
  campaign.completeLevel(1, 24);
  assert.equal(campaign.bestStars[1], 3);
});

test('mage magic and class skill damage the boss, while the class fixes the weapon', t => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
  t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):Reflect.deleteProperty(globalThis,'document'));
  const game = new GameEngine();
  assert.equal(game.weapon, 'staff');
  for(let i=1;i<=5;i++)game.campaign.award(i);
  game.screen='forge';game.forgeWeapon();game.enterBoss();
  game.boss!.pillars.forEach(p=>p.hp=0);game.boss!.armor=0;
  const update = (game as unknown as {update(dt:number):void}).update.bind(game);
  game.player.x=game.boss!.x-200;game.player.y=game.boss!.y;
  const target = {x:game.boss!.x,y:game.boss!.y};
  game.attack(target);
  assert.equal(game.boss!.hp,240);                 // no damage when the cast starts
  for(let i=0;i<20;i++)update(.05);
  assert.equal(game.boss!.hp,228);                 // Arcane Bolt: 0.8 × 15 ATK, once
  game.useSkill({x:game.boss!.x,y:game.boss!.y});
  for(let i=0;i<7;i++)update(.05);
  assert.equal(game.boss!.hp,228);
  assert.equal(game.orbitOrbs.length,1);
  game.goToLobby();game.selectClass('swordsman');
  assert.equal(game.weapon,'sword');
});

test('all five wins unlock the forge, forging gates the boss, and the boss gates the ending', t => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
  t.after(()=> previous ? Object.defineProperty(globalThis,'document',previous) : Reflect.deleteProperty(globalThis,'document'));
  const game = new GameEngine();
  game.screen='lobby';game.selectClass('swordsman');
  const controls = game as unknown as { update(dt:number):void; handleVictory():void };
  game.startGame();
  game.selectLevel(5);
  assert.equal(game.currentLevelIdx, 0);
  for(let i=0;i<5;i++) {
    assert.equal(game.currentLevelIdx, i);
    controls.handleVictory();
    assert.equal(game.screen, 'victory');
    assert.equal(game.lastReward, i+1);
    game.nextLevel();
  }
  assert.equal(game.screen, 'forge');
  game.enterBoss();
  assert.equal(game.screen, 'forge');
  game.forgeWeapon();
  assert.equal(game.campaign.forged, true);
  game.enterBoss();
  assert.equal(game.currentLevelIdx, 5);
  assert.equal(game.screen, 'playing');
  game.boss!.pillars.forEach(p=>p.hp=0);game.boss!.armor=0;
  // Walking through the old portal cannot bypass combat.
  game.player.x=LEVELS[5].exit.x+30;game.player.y=LEVELS[5].exit.y+30;
  controls.update(0.05);
  assert.equal(game.screen,'playing');
  for(let i=0;i<4000 && game.boss!.hp>0;i++) {
    game.player.x=game.boss!.x-70;game.player.y=game.boss!.y;game.invulnerability=9;
    game.attack();controls.update(0.05);
  }
  assert.equal(game.boss!.hp,0);
  assert.equal(game.screen,'playing'); // Play the death animation before showing the ending.
  controls.update(1.1);
  assert.equal(game.screen,'ending');
  assert.equal(game.campaign.bossDefeated,true);
  game.startGame();
  assert.equal(game.currentLevelIdx,0);
  assert.equal(game.campaign.completed.length,0);
  assert.equal(game.campaign.forged,false);
});

test('boss sword requires range, phases escalate, and attacks have a warning',()=>{
  const boss=createBoss();
  assert.equal(swordHit(boss,100,100),0);
  assert.equal(swordHit(boss,boss.x,boss.y),15);
  assert.equal(swordHit(boss,boss.x,boss.y,true),24);
  boss.hp=70; boss.timer=0;
  assert.equal(updateBoss(boss,{x:boss.x,y:boss.y},.05,false),false);
  assert.equal(boss.phase,3); assert.equal(boss.mode,'warning');
  updateBoss(boss,{x:100,y:100},1,false);
  assert.equal(boss.mode,'strike');
  assert.equal(boss.projectiles.length,8);
});

test('four pillars shield the boss until destroyed, then damage reaches its health',t=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
  t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):Reflect.deleteProperty(globalThis,'document'));
  const game=new GameEngine();for(let i=1;i<=5;i++)game.campaign.award(i);
  game.screen='forge';game.forgeWeapon();game.enterBoss();
  const hit=game as unknown as {damageCombatTarget(x:number,y:number,amount:number,radius?:number):boolean};
  assert.equal(game.boss!.pillars.length,4);
  assert.equal(game.boss!.armor,100);
  hit.damageCombatTarget(game.boss!.x,game.boss!.y,60);
  assert.equal(game.boss!.hp,240);
  for(const pillar of game.boss!.pillars)hit.damageCombatTarget(pillar.x,pillar.y,60);
  assert.equal(game.boss!.armor,0);
  hit.damageCombatTarget(game.boss!.x,game.boss!.y,60);
  assert.equal(game.boss!.hp,180);
});

test('skill drops are class-specific and Echo cannot collect one',t=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
  t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):Reflect.deleteProperty(globalThis,'document'));
  const game=new GameEngine();for(let i=1;i<=5;i++)game.campaign.award(i);
  game.screen='forge';game.forgeWeapon();game.enterBoss();
  game.boss!.timer=100;game.boss!.burstCooldown=100;
  const update=(game as unknown as {update(dt:number):void}).update.bind(game);
  for(let i=0;i<101;i++)update(.05);
  assert.ok(game.skillDrop);
  assert.ok(['fire','lightning','stone'].includes(game.skillDrop!.kind));
  game.echo={x:game.skillDrop!.x,y:game.skillDrop!.y,direction:'right',isMoving:false,elapsedMs:0,status:'finished',samples:[],combatLife:8,aggroTime:0,attackTimer:1,characterClass:'mage'};
  for(let i=0;i<16;i++)update(.05);
  assert.ok(game.skillDrop);
  game.player.x=game.skillDrop!.x;game.player.y=game.skillDrop!.y;update(.05);
  assert.equal(game.skillDrop,null);
});

test('Echo draws boss attention and spends stability to absorb a hit',t=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
  t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):Reflect.deleteProperty(globalThis,'document'));
  const game=new GameEngine();for(let i=1;i<=5;i++)game.campaign.award(i);
  game.screen='forge';game.forgeWeapon();game.enterBoss();
  game.toggleRecording();game.toggleRecording();game.spawnEcho();
  assert.equal(game.echo?.aggroTime,3);
  game.boss!.mode='warning';game.boss!.timer=.01;game.boss!.targetX=game.echo!.x;game.boss!.targetY=game.echo!.y;
  game.boss!.burstCooldown=100;
  (game as unknown as {update(dt:number):void}).update(.05);
  assert.ok(game.echo);
  assert.ok(game.echo!.stability!<100);
  assert.equal(game.health,5);
});

test('boss begins a two-second projectile and area burst every five seconds',()=>{
  const boss=createBoss();boss.mode='recover';boss.timer=100;
  const player={x:300,y:350};
  for(let i=0;i<101;i++)updateBoss(boss,player,.05,false);
  assert.ok(boss.burstRemaining>0);
  const firstProjectiles=boss.projectiles.length;
  assert.ok(firstProjectiles>=5);
  assert.ok(boss.burstAreas.length>=2);
  for(let i=0;i<10;i++)updateBoss(boss,player,.05,false);
  assert.ok(boss.projectiles.length>firstProjectiles);
  for(let i=0;i<40;i++)updateBoss(boss,player,.05,false);
  assert.equal(boss.burstRemaining,0);
});

test('combat Echo replays a recorded attack instead of auto attacking',t=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
  t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):Reflect.deleteProperty(globalThis,'document'));
  const game=new GameEngine();for(let i=1;i<=5;i++)game.campaign.award(i);
  game.screen='forge';game.forgeWeapon();game.enterBoss();
  game.boss!.pillars.forEach(p=>p.hp=0);game.boss!.armor=0;game.boss!.timer=100;game.boss!.burstCooldown=100;
  game.echo={x:game.boss!.x-80,y:game.boss!.y,direction:'right',isMoving:false,elapsedMs:0,status:'replaying',samples:[{time:0,x:game.boss!.x-80,y:game.boss!.y,direction:'right'},{time:100,x:game.boss!.x-80,y:game.boss!.y,direction:'right'}],events:[{time:40,kind:'attack',x:game.boss!.x-80,y:game.boss!.y,targetX:game.boss!.x,targetY:game.boss!.y}],nextEvent:0,stability:100,aggroTime:3,characterClass:'mage'};
  (game as unknown as {update(dt:number):void}).update(.05);
  assert.equal(game.boss!.hp,230);
});

test('all six class pickups apply their distinct damage or defense',t=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
  t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):Reflect.deleteProperty(globalThis,'document'));
  const game=new GameEngine();for(let i=1;i<=5;i++)game.campaign.award(i);
  game.screen='forge';game.forgeWeapon();game.enterBoss();
  game.boss!.pillars.forEach(p=>p.hp=0);game.boss!.armor=0;
  const internal=game as unknown as {collectCombatSkill(kind:import('../GameEngine.ts').CombatSkill):void;takeDamage():void};
  internal.collectCombatSkill('fire');assert.equal(game.boss!.hp,205);assert.equal(game.fireBurnTime,3);
  internal.collectCombatSkill('lightning');assert.equal(game.boss!.hp,155);
  internal.collectCombatSkill('stone');assert.equal(game.stoneShield,2);
  internal.takeDamage();assert.equal(game.health,5);assert.equal(game.stoneShield,1);
  game.invulnerability=0;internal.takeDamage();assert.equal(game.stoneShield,0);
  game.characterClass='swordsman';
  internal.collectCombatSkill('haste');assert.equal(game.hasteTime,6);
  game.player.x=game.boss!.x-80;game.player.y=game.boss!.y;
  game.attackCooldown=0;game.attack();             // haste plays the combo twice as fast
  assert.equal(game.attackCooldown,hitDuration(COMBO_HITS.swordsman[0])/2);
  internal.collectCombatSkill('armor');assert.equal(game.armorShield,1);
  game.invulnerability=0;internal.takeDamage();assert.equal(game.health,5);assert.equal(game.armorShield,0);
  const before=game.boss!.hp;internal.collectCombatSkill('wave');assert.equal(game.boss!.hp,before-55);
});

test('later trails increase gate and trap count',()=>{
  assert.equal(LEVELS.length,6);
  assert.equal(LEVELS[3].doors.length,3);
  assert.equal(LEVELS[4].doors.length,4);
  assert.ok(LEVELS[4].traps!.length>LEVELS[3].traps!.length);
  assert.ok(LEVELS[4].doors[0].height<LEVELS[3].doors[0].height);
});

test('saved materials and forged sword survive reload, but invalid saves cannot unlock a boss', t=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  let value='{}';
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>value,setItem:(_key:string,next:string)=>{value=next;}}});
  t.after(()=>previous?Object.defineProperty(globalThis,'localStorage',previous):Reflect.deleteProperty(globalThis,'localStorage'));
  const original=new Campaign();for(let i=1;i<=5;i++)original.award(i);original.forge();
  const restored=new Campaign();restored.load();
  assert.deepEqual(restored.completed,[1,2,3,4,5]);assert.equal(restored.forged,true);
  value=JSON.stringify({completed:[1,3,4,5],forged:true,bossDefeated:true});
  restored.load();assert.deepEqual(restored.completed,[1]);assert.equal(restored.forged,false);assert.equal(restored.bossDefeated,false);
});

test('attack cooldown prevents duplicate hits and a dodge prevents immediate damage',t=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
  t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):Reflect.deleteProperty(globalThis,'document'));
  const game=new GameEngine();for(let i=1;i<=5;i++)game.campaign.award(i);
  game.screen='lobby';game.selectClass('swordsman');
  game.screen='forge';game.forgeWeapon();game.enterBoss();
  game.boss!.pillars.forEach(p=>p.hp=0);game.boss!.armor=0;
  game.player.x=game.boss!.x-70;game.player.y=game.boss!.y;
  game.attack();game.attack();                     // the second press is too early to count
  assert.equal(game.boss!.hp,240);
  const tick=(game as unknown as {updateCombo(dt:number):void}).updateCombo.bind(game);
  for(let i=0;i<10;i++)tick(.05);
  assert.equal(game.boss!.hp,228);
  game.dodge();(game as unknown as {takeDamage():void}).takeDamage();
  assert.equal(game.health,5);assert.ok(game.dodgeCooldown>0);
});

test('losing and retrying a boss fight keeps sword and restores health and boss', t=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
  t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):Reflect.deleteProperty(globalThis,'document'));
  const game=new GameEngine();
  for(let i=1;i<=5;i++)game.campaign.award(i);
  game.screen='forge';game.forgeWeapon();game.enterBoss();
  const internal=game as unknown as {takeDamage():void};
  for(let i=0;i<5;i++){game.invulnerability=0;internal.takeDamage();}
  assert.equal(game.screen,'defeat');game.restartLevel();
  assert.equal(game.screen,'playing');assert.equal(game.health,5);
  assert.equal(game.boss!.hp,240);assert.equal(game.campaign.forged,true);
  assert.equal(game.campaign.completed.length,5);
});

for (const levelIndex of [0,1,2,3,4]) test(`trail ${levelIndex+1} is solvable with one Echo and real gate collisions`, t=>{
  const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
  t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):Reflect.deleteProperty(globalThis,'document'));
  const game=new GameEngine();for(let i=1;i<=levelIndex;i++)game.campaign.award(i);
  game.selectLevel(levelIndex);
  const controls=game as unknown as {heldKeys:Set<string>;update(dt:number):void};
  function walk(x:number,y:number, allowVictory=false) {
    for(const axis of ['x','y'] as const) {
      let steps=0;
      while(Math.abs(game.player[axis]-(axis==='x'?x:y))>.1) {
        const delta=(axis==='x'?x:y)-game.player[axis];
        const key=axis==='x'?(delta>0?'KeyD':'KeyA'):(delta>0?'KeyS':'KeyW');
        controls.heldKeys.add(key);controls.update(Math.min(.01,Math.abs(delta)/200));controls.heldKeys.delete(key);
        if (allowVictory && game.screen === 'victory') return;
        assert.equal(game.screen,'playing', `level ${levelIndex+1} at ${game.player.x},${game.player.y}: ${game.defeatReason}, checkpoint ${game.checkpointIndex}`);assert.ok(++steps<2000,'waypoint unreachable');
      }
    }
  }
  function holdRune(x:number,y:number) {
    walk(x,y);game.toggleRecording();game.toggleRecording();game.spawnEcho();
    for(let i=0;i<40;i++)controls.update(.01);
  }
  if(levelIndex===0) {
    holdRune(465,205);walk(610,360);walk(760,360);walk(1070,390,true);
  } else if(levelIndex===1) {
    walk(90,205);holdRune(385,205);walk(520,260);walk(650,260);
    holdRune(785,505);walk(870,360);walk(1000,360);walk(1110,390,true);
  } else if(levelIndex===2) {
    walk(260,360);walk(400,360);holdRune(445,205);
    walk(500,250);walk(740,250);walk(740,440);walk(900,440);
    holdRune(925,205);walk(990,360);walk(1120,360);walk(1170,390,true);
  } else if(levelIndex===3) {
    holdRune(202,202);walk(280,495);walk(420,495);
    holdRune(482,562);walk(600,210);walk(720,210);
    holdRune(802,172);walk(920,495);walk(1060,495);
    walk(1180,420);
  } else {
    holdRune(162,542);walk(220,198);walk(320,198);
    holdRune(372,142);walk(430,498);walk(540,498);
    holdRune(582,552);walk(650,198);walk(760,198);
    holdRune(812,142);walk(875,498);walk(980,498);walk(1120,420);
  }
  if (game.screen !== 'victory') walk(1180,360,true);
  assert.equal(game.screen,'victory');assert.ok(game.health>0);
});

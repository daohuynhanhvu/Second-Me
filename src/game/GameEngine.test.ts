import {ECHO_RUNES} from './logic/echoRunes.ts';
import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from './GameEngine.ts';
import { sounds } from './logic/sound.ts';
import { LEVELS } from './logic/levels.ts';
import { comboPose } from './rendering/comboSprites.ts';

sounds.setMuted(true);

test('summoning creates a foreground effect at the resolved Echo spawn and expires it', () => {
  const {engine,advance}=setup();
  engine.recorder.startRecording(engine.player.x,engine.player.y,'right');
  engine.spawnEcho();
  assert.equal(engine.summonEffects.length,1);
  assert.equal(engine.summonEffects[0].x,engine.echo!.x);
  advance(1.1);assert.equal(engine.summonEffects.length,0);
});

test('exit travel freezes movement before committing victory and pause freezes travel', t => {
  mockDocument(t);
  const {engine,controls,advance}=setup();
  const x=engine.player.x,y=engine.player.y;
  engine.exitTravelRemaining=.7;controls.heldKeys.add('KeyD');
  advance(.3);assert.equal(engine.screen,'playing');assert.equal(engine.player.x,x);assert.equal(engine.player.y,y);
  engine.screen='paused';const remaining=engine.exitTravelRemaining;advance(.2);assert.equal(engine.exitTravelRemaining,remaining);
  engine.screen='playing';advance(.45);assert.equal(engine.screen,'victory');assert.equal(engine.exitTravelRemaining,0);
});

function mockDocument(t: TestContext) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const document = { body: { dataset: { state: 'gameover' } } };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: document });
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else Reflect.deleteProperty(globalThis, 'document');
  });
  return document;
}

function setup() {
  const engine = new GameEngine();
  engine.screen = 'playing';
  const controls = engine as unknown as {
    update(dt: number): void;
    handleKeyDown(event: KeyboardEvent): void;
    handleKeyUp(event: KeyboardEvent): void;
    heldKeys: Set<string>;
  };
  function advance(seconds: number) {
    while (seconds > 0.000001) {
      const dt = Math.min(0.05, seconds);
      controls.update(dt);
      seconds -= dt;
    }
  }
  function walk(code: string, seconds: number) {
    controls.heldKeys.add(code);
    advance(seconds);
    controls.heldKeys.delete(code);
    advance(0.05);
  }
  function recordToPlate() {
    engine.toggleRecording();
    walk('KeyW', 0.775);
    walk('KeyD', 1.225);
  }
  return { engine, controls, advance, walk, recordToPlate };
}

test('E stops on the plate: walking away cannot extend the saved path', () => {
  const { engine, advance, walk, recordToPlate } = setup();
  recordToPlate();
  engine.toggleRecording();
  const saved = structuredClone(engine.recorder.getSamples());
  walk('KeyS', 0.6);
  engine.spawnEcho();
  advance(5);
  assert.deepEqual(engine.recorder.getSamples(), saved);
  assert.ok(Math.abs(engine.echo!.x - 465) < 0.001);
  assert.ok(Math.abs(engine.echo!.y - 205) < 0.001);
  assert.equal(engine.echo!.status, 'finished');
  assert.equal(engine.currentLevel.plates[0].isPressed, true);
  assert.equal(engine.currentLevel.doors[0].openProgress, 1);
});

test('Q finishes an active recording before the player walks away', () => {
  const { engine, advance, walk, recordToPlate } = setup();
  recordToPlate();
  engine.spawnEcho();
  assert.equal(engine.recorder.getStatus(), 'recorded');
  walk('KeyS', 0.6);
  advance(5);
  assert.ok(Math.abs(engine.echo!.y - 205) < 0.001);
  assert.equal(engine.currentLevel.plates[0].isPressed, true);
});

test('an existing Echo holds its original destination during a new recording', () => {
  const { engine, advance, walk, recordToPlate } = setup();
  recordToPlate();
  engine.toggleRecording();
  engine.spawnEcho();
  advance(5);
  engine.toggleRecording();
  walk('KeyS', 0.6);
  engine.toggleRecording();
  advance(5);
  assert.ok(Math.abs(engine.echo!.y - 205) < 0.001);
  assert.equal(engine.echo!.status, 'finished');
  assert.equal(engine.echo!.isMoving, false);
  assert.equal(engine.currentLevel.plates[0].isPressed, true);
});

test('holding E cannot stop and restart a recording through key repeat', () => {
  const { engine, controls, advance } = setup();
  const event = (repeat: boolean) => ({
    code: 'KeyE', key: 'e', repeat, preventDefault() {},
  }) as KeyboardEvent;
  controls.handleKeyDown(event(false));
  advance(0.1);
  controls.handleKeyDown(event(true));
  assert.equal(engine.recorder.getStatus(), 'recording');
  controls.handleKeyUp(event(false));
  controls.handleKeyDown(event(false));
  controls.handleKeyDown(event(true));
  assert.equal(engine.recorder.getStatus(), 'recorded');
});

test('E records, Q summons, Space uses skill, and R spends one time item', t => {
  mockDocument(t);
  const { engine, controls } = setup();
  engine.restartLevel();
  const press = (key: string, code: string) => controls.handleKeyDown({key,code,repeat:false,preventDefault(){}} as KeyboardEvent);
  press('e','KeyE');
  assert.equal(engine.recorder.getStatus(),'recording');
  press('e','KeyE');
  assert.equal(engine.recorder.getStatus(),'recorded');
  press('q','KeyQ');
  assert.ok(engine.echo);
  press(' ','Space');
  assert.ok(engine.skillCooldown > 0);
  engine.campaign.timeItems=1;
  const before=engine.legTimeRemaining!;
  press('r','KeyR');
  assert.equal(engine.campaign.timeItems,0);
  assert.equal(engine.legTimeRemaining,before+2);
  press('j','KeyJ');
  assert.equal(engine.attackCooldown,0);
});

test('right mouse uses skill, left mouse attacks, and the game suppresses its context menu', t => {
  mockDocument(t);
  const {engine} = setup();
  engine.restartLevel();
  const canvas = {width:1280,height:720,getBoundingClientRect:()=>({left:10,top:20,width:640,height:360})};
  (engine as unknown as {canvas:unknown}).canvas=canvas;
  const input=engine as unknown as {handleCanvasMouseDown(e:MouseEvent):void;handleCanvasContextMenu(e:MouseEvent):void};
  let prevented=false;
  input.handleCanvasMouseDown({button:2,clientX:110,clientY:120,preventDefault(){prevented=true;}} as MouseEvent);
  assert.equal(prevented,true);
  assert.equal(engine.skillCooldown,6);
  assert.equal(engine.frostZones.length,1);
  assert.equal(engine.magicShots.length,0);
  input.handleCanvasMouseDown({button:0,clientX:110,clientY:120,preventDefault(){}} as MouseEvent);
  assert.equal(engine.combo?.step,0);              // left mouse starts the normal-attack combo
  assert.deepEqual(engine.comboAim,{x:200,y:200}); // aimed where the mouse is
  prevented=false;
  input.handleCanvasContextMenu({preventDefault(){prevented=true;}} as MouseEvent);
  assert.equal(prevented,true);
});

test('character screen selects only playable classes and returns to lobby', t => {
  mockDocument(t);
  const engine=new GameEngine();engine.goToLobby();engine.openCharacters();
  assert.equal(engine.screen,'characters');
  engine.selectClass('swordsman');
  assert.equal(engine.weapon,'sword');
  engine.goToLobby();
  assert.equal(engine.screen,'lobby');
});

test('retry after the final victory closes the overlay and starts a playable fresh level', t => {
  const document = mockDocument(t);
  const { engine, controls, advance } = setup();
  engine.campaign.award(1);
  engine.campaign.award(2);
  engine.selectLevel(2);
  engine.toggleRecording();
  advance(0.1);
  engine.spawnEcho();
  engine.currentLevel.plates[0].isPressed = true;
  engine.currentLevel.doors[0].openProgress = 1;
  engine.player.x = engine.currentLevel.exit.x;
  controls.heldKeys.add('KeyD');
  engine.screen = 'victory';
  let hudScreen = '';
  engine.onHUDChange = hud => { hudScreen = hud.screen; };
  engine.restartLevel();
  assert.equal(engine.screen, 'playing');
  assert.equal(document.body.dataset.state, 'playing');
  assert.equal(hudScreen, 'playing');
  assert.equal(engine.currentLevelIdx, 2);
  assert.equal(engine.player.x, LEVELS[2].playerSpawn.x);
  assert.equal(engine.player.y, LEVELS[2].playerSpawn.y);
  assert.equal(engine.echo, null);
  assert.equal(engine.recorder.getStatus(), 'idle');
  assert.equal(engine.currentLevel.plates.some(plate => plate.isPressed), false);
  assert.equal(engine.currentLevel.doors.some(door => door.openProgress > 0), false);
  assert.equal(controls.heldKeys.size, 0);
  advance(0.1);
  assert.equal(engine.screen, 'playing');
  assert.equal(engine.player.x, LEVELS[2].playerSpawn.x);
});

test('restart from pause resumes the level rather than leaving the pause overlay open', t => {
  const document = mockDocument(t);
  const { engine } = setup();
  engine.screen = 'paused';
  engine.restartLevel();
  assert.equal(engine.screen, 'playing');
  assert.equal(document.body.dataset.state, 'playing');
});

test('advancing after the last level immediately starts a new run at level one', t => {
  const document = mockDocument(t);
  const { engine } = setup();
  engine.currentLevelIdx = LEVELS.length - 1;
  engine.screen = 'victory';
  engine.nextLevel();
  assert.equal(engine.currentLevelIdx, 0);
  assert.equal(engine.currentLevel.id, LEVELS[0].id);
  assert.equal(engine.screen, 'playing');
  assert.equal(document.body.dataset.state, 'playing');
  assert.equal(engine.player.x, LEVELS[0].playerSpawn.x);
});

test('an animation frame timestamp before startup cannot move the game clock backwards', t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
  Object.defineProperty(globalThis,'requestAnimationFrame',{configurable:true,value:()=>1});
  t.after(()=>original?Object.defineProperty(globalThis,'requestAnimationFrame',original):Reflect.deleteProperty(globalThis,'requestAnimationFrame'));
  const { engine } = setup();
  const clock=engine as unknown as {lastTimestamp:number;elapsedLevelTime:number;loop(timestamp:number):void};
  clock.lastTimestamp=100;
  clock.loop(99);
  assert.equal(clock.elapsedLevelTime,0);
});

test('intro opens loading lobby without resetting saved progress', t => {
  const document = mockDocument(t);
  const engine = new GameEngine();
  engine.campaign.completed = [1,2];
  engine.openLobby();
  assert.equal(engine.screen,'loading');
  assert.equal(document.body.dataset.state,'loading');
  engine.finishLoading();
  assert.equal(engine.screen,'lobby');
  assert.deepEqual(engine.campaign.completed,[1,2]);
});

test('with the loading screen on, picking a level and the next level go through loading', t => {
  const document = mockDocument(t);
  const engine = new GameEngine();
  engine.levelLoading = true;
  engine.campaign.completed = [1];
  engine.goToLobby();
  engine.selectLevel(1);
  assert.equal(engine.screen,'loading');
  assert.equal(document.body.dataset.state,'loading');
  assert.equal(engine.currentLevelIdx,0, 'the level is only set up once loading ends');
  engine.selectLevel(0);   // a second click while loading is ignored
  engine.revealLoadedLevel();
  assert.equal(engine.currentLevelIdx,1);
  assert.equal(engine.screen,'loading', 'built behind the screen, but not playing yet');
  engine.finishLoading();
  assert.equal(engine.screen,'playing');
  assert.equal(engine.currentLevel.id,2);
  engine.screen = 'victory';
  engine.nextLevel();
  assert.equal(engine.screen,'loading');
  engine.finishLoading();   // also works without the reveal step
  assert.equal(engine.screen,'playing');
  assert.equal(engine.currentLevel.id,3);
  engine.restartLevel();   // a restart stays instant
  assert.equal(engine.screen,'playing');
});

test('pressing Y four times unlocks every trail for the current dev session', t => {
  mockDocument(t);
  const engine = new GameEngine();
  engine.screen='lobby';
  const controls=engine as unknown as {handleKeyDown(event:KeyboardEvent):void};
  const event={key:'y',code:'KeyY',repeat:false,preventDefault(){}} as KeyboardEvent;
  for(let i=0;i<3;i++)controls.handleKeyDown(event);
  assert.equal(engine.devUnlocked,false);
  controls.handleKeyDown(event);
  assert.equal(engine.devUnlocked,true);
  assert.equal(engine.campaign.coins,99999);
  assert.equal(engine.campaign.timeItems,0);
  assert.equal(engine.campaign.mechanicalOwned,true);
  assert.equal(engine.campaign.limitRings,0);
  assert.equal(engine.campaign.chestKeys,0);
  for(const rune of ECHO_RUNES)assert.equal(engine.campaign.echoRunes[rune.id],9999);
  assert.equal(engine.campaign.runeLoadout.length,5);
  assert.deepEqual(engine.campaign.pendingRuneChoices,[]);
  engine.selectClass('mechanical');
  assert.equal(engine.characterClass,'mage');
  engine.campaign.coins=12;engine.campaign.timeItems=0;
  engine.campaign.limitRings=0;engine.campaign.chestKeys=0;engine.campaign.echoRunes.guard=0;
  engine.setInventoryOpen(true);engine.setRuneEditing(true);
  engine.campaign.runeLoadout=['swap','regen'];engine.campaign.pendingRuneChoices=['call','guard','power'];
  for(let i=0;i<4;i++)controls.handleKeyDown(event);
  assert.equal(engine.campaign.coins,99999);
  assert.equal(engine.campaign.timeItems,0);
  assert.equal(engine.campaign.limitRings,0);assert.equal(engine.campaign.chestKeys,0);
  assert.equal(engine.campaign.echoRunes.guard,9999);
  assert.deepEqual(engine.campaign.runeLoadout.slice(0,2),['swap','regen']);
  assert.equal(engine.campaign.runeLoadout.length,5);assert.deepEqual(engine.campaign.pendingRuneChoices,[]);
  assert.deepEqual(engine.campaign.completed,[1,2,3,4,5]);
  assert.equal(engine.campaign.forged,true);
  engine.setInventoryOpen(false);engine.setRuneEditing(false);
  engine.selectLevel(5);
  assert.equal(engine.currentLevelIdx,5);
  assert.equal(engine.screen,'playing');
});

test('completed campaign can replay any level from lobby',t=>{
  mockDocument(t);
  const engine=new GameEngine();
  engine.campaign.completed=[1,2,3,4,5];engine.campaign.forged=true;engine.campaign.bossDefeated=true;
  engine.goToLobby();engine.selectLevel(1);
  assert.equal(engine.currentLevelIdx,1);assert.equal(engine.screen,'playing');
  engine.goToLobby();engine.selectLevel(5);
  assert.equal(engine.currentLevelIdx,5);assert.ok(engine.boss);
});

test('the lobby and its sub-screens can return to the main menu, but a level in play cannot', t => {
  const document = mockDocument(t);
  const engine = new GameEngine();
  for (const open of [() => {}, () => engine.openShop(), () => engine.openCharacters()]) {
    engine.goToLobby(); open();
    engine.goToMainMenu();
    assert.equal(engine.screen, 'intro'); assert.equal(document.body.dataset.state, 'intro');
  }
  engine.goToLobby(); engine.selectLevel(0);
  engine.goToMainMenu();
  assert.equal(engine.screen, 'playing');
});

test('dev countdown reaches zero without defeat and checkpoints refill it',t=>{
  mockDocument(t);
  const engine=new GameEngine();engine.restartLevel();engine.legTimeRemaining=.1;
  const controls=engine as unknown as {handleKeyDown(event:KeyboardEvent):void;update(dt:number):void};
  const event={key:'y',code:'KeyY',repeat:false,preventDefault(){}} as KeyboardEvent;
  for(let i=0;i<4;i++)controls.handleKeyDown(event);
  assert.equal(engine.legTimeRemaining,.1);
  controls.update(.05);assert.equal(engine.legTimeRemaining,.05);
  controls.update(.1);assert.equal(engine.legTimeRemaining,0);
  controls.update(.1);assert.equal(engine.screen,'playing');assert.equal(engine.legTimeRemaining,0);
  for(let level=0;level<5;level++){
    engine.selectLevel(level);assert.ok(engine.legTimeRemaining!>0);
    engine.restartLevel();assert.ok(engine.legTimeRemaining!>0);
  }
  engine.selectLevel(0);engine.legTimeRemaining=0;
  engine.pauseGame();engine.resumeGame();assert.equal(engine.legTimeRemaining,0);
  const plate=engine.currentLevel.plates[0];engine.player.x=plate.x+plate.width/2;engine.player.y=plate.y+plate.height/2;
  controls.update(.05);assert.equal(engine.checkpointIndex,1);assert.equal(engine.legTimeRemaining,16);
  const normal=new GameEngine();normal.restartLevel();normal.legTimeRemaining=.01;
  (normal as unknown as {update(dt:number):void}).update(.05);
  assert.equal(normal.screen,'defeat');assert.equal(normal.defeatReason,'timeout');
});


test('heroes face their movement in every level, including the boss arena, and Echo records it', t => {
  mockDocument(t);
  for (let level = 0; level < LEVELS.length; level++) {
    for (const character of ['mage', 'swordsman', 'mechanical'] as const) {
      const {engine, controls, advance} = setup();
      engine.currentLevelIdx = level;
      engine.characterClass = character;
      engine.restartLevel();engine.beginBossFight();
      engine.enemies = [];
      if (engine.boss) { engine.boss.x = engine.player.x + 300; engine.boss.y = engine.player.y; }
      engine.recorder.startRecording(engine.player.x, engine.player.y, engine.player.direction);
      for (const [key, direction] of [['KeyA','left'], ['KeyW','up'], ['KeyS','down'], ['KeyD','right']] as const) {
        controls.heldKeys.add(key);
        advance(.1);
        controls.heldKeys.delete(key);
        assert.equal(engine.player.direction, direction, `${character} level ${level + 1}: ${key}`);
        assert.equal(engine.recorder.getSamples().at(-1)?.direction, direction, `Echo records ${direction}`);
        advance(.05);
        assert.equal(engine.player.direction, direction, 'standing still retains the last movement direction');
      }
      engine.spawnEcho();
      advance(.1);
      assert.equal(engine.echo?.direction, 'left', `Echo replays the first movement in level ${level + 1}`);
    }
  }
});


test('moving during combat keeps the movement-facing sprite while attacks remain active', t => {
  mockDocument(t);
  for (const character of ['mage', 'swordsman'] as const) {
    const {engine, controls, advance} = setup();
    engine.currentLevelIdx = 5; engine.characterClass = character; engine.restartLevel();engine.beginBossFight();
    engine.attack({x: engine.player.x + 200, y: engine.player.y});
    assert.ok(engine.combo?.active, `${character} starts an attack`);
    controls.heldKeys.add('KeyW'); advance(.05);
    assert.equal(engine.player.direction, 'up');
    assert.equal(comboPose(engine), null, 'movement uses the directional sprite instead of the side-facing attack sprite');
    assert.ok(engine.combo?.active, 'the attack continues while moving');
  }
});

test('boss introduction freezes combat and the clock until explicitly started', t=>{
 mockDocument(t);
 const {engine,advance}=setup();engine.currentLevelIdx=5;engine.restartLevel();
 assert.equal(engine.bossIntroduction,true);
 const x=engine.boss!.x,y=engine.boss!.y;
 engine.attack();engine.useSkill();advance(1);
 assert.equal((engine as unknown as {elapsedLevelTime:number}).elapsedLevelTime,0);assert.equal(engine.boss!.x,x);assert.equal(engine.boss!.y,y);assert.equal(engine.mana.value,100);
 engine.beginBossFight();advance(.1);assert.equal(engine.bossIntroduction,false);assert.ok((engine as unknown as {elapsedLevelTime:number}).elapsedLevelTime>0);
});

test('touch stick moves exactly like the keys, at any stick deflection, and keys win when both are used', () => {
  const after = (drive: (e: GameEngine, keys: Set<string>) => void) => {
    const {engine,controls,advance}=setup();
    const x=engine.player.x,y=engine.player.y;
    drive(engine,controls.heldKeys);advance(.3);
    return {dx:engine.player.x-x,dy:engine.player.y-y,dir:engine.player.direction};
  };
  const keysRight=after((_,k)=>k.add('KeyD'));
  assert.ok(keysRight.dx>0);
  assert.deepEqual(after(e=>e.setTouchMove(46,0)),keysRight);
  assert.deepEqual(after(e=>e.setTouchMove(9.5,0)),keysRight, 'a light push walks at full speed too');
  const keysDiagonal=after((_,k)=>{k.add('KeyD');k.add('KeyS');});
  assert.deepEqual(after(e=>e.setTouchMove(30,30)),keysDiagonal, 'diagonals are not faster than on keys');
  assert.deepEqual(after((e,k)=>{e.setTouchMove(-40,0);k.add('KeyD');}),keysRight);
  assert.deepEqual(after(e=>e.setTouchMove(0,0)),{dx:0,dy:0,dir:after(e=>e.setTouchMove(0,0)).dir});
});

test('sprite effects start with their triggers and end by themselves', t => {
  mockDocument(t);
  const {engine,advance}=setup();
  engine.currentLevelIdx=5;engine.characterClass='swordsman';engine.restartLevel();engine.beginBossFight();
  const kinds=()=>engine.vfx.map(fx=>fx.kind);
  const collect=(kind:string)=>(engine as unknown as {collectCombatSkill(kind:string):void}).collectCombatSkill(kind);
  assert.deepEqual(kinds(),[]);
  collect('stone');assert.deepEqual(kinds(),['shieldPickup'],'a shield pickup: the cross shield');
  assert.ok(engine.stoneShield>0,'and the shield itself is up (the hex bubble follows this state)');
  collect('armor');assert.deepEqual(kinds(),['shieldPickup','shieldPickup']);
  collect('fire');assert.deepEqual(kinds().slice(2),['sparkle'],'a damage pickup: sparkles');
  collect('haste');assert.equal(engine.vfx.length,3,'haste is neither: no new sprite');
  engine.useSkill();assert.equal(kinds().at(-1),'healRing','Kael heals in Sanctuary: the ground ring, where he cast it');
  const ring=engine.vfx.at(-1)!;assert.deepEqual([ring.x,ring.y,!!ring.follow],[engine.player.x,engine.player.y,false]);
  engine.campaign.timeItems=1;
  if(engine.legTimeRemaining===null)engine.legTimeRemaining=10;
  assert.equal(engine.useTimeItem(),true);assert.equal(kinds().at(-1),'clock');assert.equal(engine.vfx.at(-1)!.follow,true);
  advance(2);assert.deepEqual(kinds(),[],'all of them are over within two seconds');
  collect('stone');engine.restartLevel();assert.deepEqual(kinds(),[],'a restart clears them');
});

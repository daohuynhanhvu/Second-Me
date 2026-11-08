import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from './GameEngine.ts';
import { sounds } from './logic/sound.ts';
import { LEVELS } from './logic/levels.ts';

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

test('E records, Q summons, Space uses skill, and F spends one time item', t => {
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
  press('f','KeyF');
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
  assert.equal(engine.skillCooldown,1);
  assert.equal(engine.orbitOrbs.length,1);
  assert.equal(engine.magicShots.length,0);
  input.handleCanvasMouseDown({button:0,clientX:110,clientY:120,preventDefault(){}} as MouseEvent);
  assert.equal(engine.attackCooldown,.55);
  assert.equal(engine.magicShots[0].targetX,200);
  assert.equal(engine.magicShots[0].targetY,200);
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
  assert.equal(engine.campaign.timeItems,99999);
  assert.equal(engine.campaign.mechanicalOwned,true);
  engine.selectClass('mechanical');
  assert.equal(engine.characterClass,'mage');
  engine.campaign.coins=12;engine.campaign.timeItems=0;
  for(let i=0;i<4;i++)controls.handleKeyDown(event);
  assert.equal(engine.campaign.coins,99999);
  assert.equal(engine.campaign.timeItems,99999);
  assert.deepEqual(engine.campaign.completed,[1,2,3,4,5]);
  assert.equal(engine.campaign.forged,true);
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

test('yyyy removes the active deadline and keeps all subsequent trials untimed',t=>{
  mockDocument(t);
  const engine=new GameEngine();engine.restartLevel();engine.legTimeRemaining=.1;
  const controls=engine as unknown as {handleKeyDown(event:KeyboardEvent):void;update(dt:number):void};
  const event={key:'y',code:'KeyY',repeat:false,preventDefault(){}} as KeyboardEvent;
  for(let i=0;i<4;i++)controls.handleKeyDown(event);
  assert.equal(engine.legTimeRemaining,null);
  for(let i=0;i<240;i++)controls.update(.05);
  assert.equal(engine.screen,'playing');
  for(let level=0;level<5;level++){
    engine.selectLevel(level);assert.equal(engine.legTimeRemaining,null);
    engine.restartLevel();assert.equal(engine.legTimeRemaining,null);
  }
  engine.pauseGame();engine.resumeGame();assert.equal(engine.legTimeRemaining,null);
  engine.selectLevel(0);
  const plate=engine.currentLevel.plates[0];engine.player.x=plate.x+plate.width/2;engine.player.y=plate.y+plate.height/2;
  controls.update(.05);assert.equal(engine.checkpointIndex,1);assert.equal(engine.legTimeRemaining,null);
  const normal=new GameEngine();normal.restartLevel();assert.equal(normal.legTimeRemaining,10);
});

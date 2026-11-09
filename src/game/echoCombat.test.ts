import test, {type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from './GameEngine.ts';
import { createEnemies } from './logic/enemies.ts';
import { createBoss, updateBoss } from './logic/campaign.ts';
import { sounds } from './logic/sound.ts';

sounds.setMuted(true);
function setup(t: TestContext, level = 1) {
  const old = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable:true, value:{body:{dataset:{}}} });
  t.after(() => old ? Object.defineProperty(globalThis, 'document', old) : Reflect.deleteProperty(globalThis, 'document'));
  const game = new GameEngine(); game.currentLevelIdx = level; game.restartLevel();game.beginBossFight();
  game.currentLevel = structuredClone(game.currentLevel); game.currentLevel.walls=[]; game.currentLevel.doors=[]; game.currentLevel.traps=[];
  game.enemies=[]; game.legTimeRemaining=null; game.player.x=100; game.player.y=600;
  const update = (dt=.05) => (game as unknown as {update(dt:number):void}).update(dt);
  const summon = (x:number,y:number) => { const before={x:game.player.x,y:game.player.y}; game.player.x=x; game.player.y=y; game.recorder.startRecording(x,y,'right'); game.spawnEcho(); game.player.x=before.x; game.player.y=before.y; return game.echo!; };
  return {game, update, summon};
}

test('every Echo pursues and damages nearby enemies within its fixed 3m area, then resumes its recording',t=>{
  const {game,update,summon}=setup(t);
  const first=summon(400,300), second=summon(700,300);
  first.samples=[{time:0,x:400,y:300,direction:'right',isMoving:true},{time:2000,x:440,y:300,direction:'right',isMoving:true}];
  first.elapsedMs=0;first.status='replaying';second.status='finished';
  const template=createEnemies(game.currentLevel)[0];
  const enemy1={...template,id:'a',x:505,y:300,homeX:505,homeY:300,hp:300,maxHp:300,timer:100};
  const enemy2={...template,id:'b',x:800,y:300,homeX:800,homeY:300,hp:300,maxHp:300,timer:100};
  game.enemies=[enemy1,enemy2];
  for(let i=0;i<35;i++){
    update();
    assert.ok(Math.hypot(first.x-400,first.y-300)<=120.01);
    assert.ok(Math.hypot(second.x-700,second.y-300)<=120.01);
  }
  assert.ok(enemy1.hp<300 && enemy2.hp<300,'both Echoes attack autonomously');
  assert.equal(first.elapsedMs,0,'recorded route is paused during combat');
  enemy1.hp=0;enemy2.hp=0;
  for(let i=0;i<40;i++)update();
  assert.ok(first.elapsedMs>0,'recording resumes after returning to its anchor');
});

for (const characterClass of ['mage', 'swordsman', 'mechanical'] as const) {
  test(`${characterClass} Echo automatically damages nearby enemies`, t => {
    const {game, update, summon} = setup(t);
    game.characterClass = characterClass;
    const echo = summon(400, 300); echo.status = 'finished';
    const enemy = {...createEnemies(game.currentLevel)[0], x: 435, y: 300, homeX: 435, homeY: 300, hp: 300, maxHp: 300, timer: 100};
    game.enemies = [enemy];
    for (let i = 0; i < 5; i++) update();
    assert.ok(enemy.hp < 300);
  });
}

test('targets outside the 3m anchor cannot pull an Echo farther or take automatic damage',t=>{
  const {game,update,summon}=setup(t);const echo=summon(400,300);echo.status='finished';
  const enemy={...createEnemies(game.currentLevel)[0],x:510,y:300,homeX:510,homeY:300,hp:300,maxHp:300,timer:100};game.enemies=[enemy];
  for(let i=0;i<8;i++)update();
  assert.ok(echo.combatAnchor);
  enemy.x=800;enemy.homeX=800;const hp=enemy.hp;
  for(let i=0;i<10;i++){update();assert.ok(Math.hypot(echo.x-400,echo.y-300)<=120.01);}
  assert.equal(enemy.hp,hp);
});

test('guard reduces incoming damage and recalls only the depleted Echo',t=>{
  const {game,update,summon}=setup(t);const echo=summon(400,300),other=summon(700,300);echo.status='finished';other.status='finished';game.activeEchoRunes.add('guard');
  const enemy={...createEnemies(game.currentLevel)[0],x:420,y:300,homeX:420,homeY:300,hp:300,maxHp:300,timer:100};game.enemies=[enemy];
  for(let i=1;i<=13;i++){
    enemy.mode='warning';enemy.timer=.01;enemy.targetEcho=echo;enemy.targetId=game.echoes.indexOf(echo);enemy.targetX=echo.x;enemy.targetY=echo.y;enemy.x=echo.x+20;enemy.y=echo.y;
    update();assert.equal(game.echoes.includes(echo),i<13);assert.ok(game.echoes.includes(other));
  }
});

test('boss slams deal 30 stability damage and prioritize Echo over the player',t=>{
  const {game,update,summon}=setup(t,5);const echo=summon(400,300);echo.status='finished';const boss=game.boss!;boss.x=850;boss.y=300;boss.burstCooldown=100;
  for(let i=1;i<=4;i++){
    boss.mode='warning';boss.timer=.01;boss.targetX=echo.x;boss.targetY=echo.y;update();
    assert.equal(game.echoes.includes(echo),i<4);assert.equal(game.health,100);
  }
});

test('boss area attacks hit every Echo and the player; a projectile is consumed by the Echo it hits',()=>{
  const boss=createBoss();boss.mode='recover';boss.timer=100;boss.burstCooldown=100;
  const player={x:300,y:300}, echoes=[{x:300,y:300},{x:310,y:300}], hits:number[]=[];
  boss.burstAreas=[{x:300,y:300,radius:48,timer:.01,struck:false}];
  assert.equal(updateBoss(boss,player,.05,false,player,echoes,i=>hits.push(i)),true);
  assert.deepEqual(hits,[0,1]);
  boss.projectiles=[{x:500,y:300,vx:0,vy:0,life:1}];hits.length=0;
  assert.equal(updateBoss(boss,player,.05,false,player,[{x:500,y:300}],i=>hits.push(i)),false);
  assert.deepEqual(hits,[0]);assert.equal(boss.projectiles.length,0);
});

test('automatic Echo attacks damage a boss after its existing armor is broken',t=>{
  const {game,update,summon}=setup(t,5);const echo=summon(500,350);echo.status='finished';
  const boss=game.boss!;boss.x=565;boss.y=350;boss.mode='recover';boss.timer=100;boss.burstCooldown=100;
  update();assert.equal(boss.hp,240,'armor still protects the boss');
  boss.pillars.forEach(p=>p.hp=0);boss.armor=0;
  for(let i=0;i<21;i++)update();
  assert.ok(boss.hp<240,'Echo damages the exposed boss');
});

test('enemy and boss damage accumulate in the same stability pool',t=>{
  const {game,update,summon}=setup(t,5);const echo=summon(400,300);echo.status='finished';
  const boss=game.boss!;boss.x=900;boss.y=300;boss.mode='recover';boss.timer=100;boss.burstCooldown=100;
  const enemy={...createEnemies({...game.currentLevel,id:2})[0],x:420,y:300,homeX:420,homeY:300,hp:300,maxHp:300,timer:100};game.enemies=[enemy];
  for(let i=0;i<2;i++){
    enemy.mode='warning';enemy.timer=.01;enemy.targetEcho=echo;enemy.targetId=0;enemy.targetX=echo.x;enemy.targetY=echo.y;enemy.x=echo.x+20;enemy.y=echo.y;
    update();assert.ok(game.echoes.includes(echo));
  }
  boss.mode='warning';boss.timer=.01;boss.targetX=echo.x;boss.targetY=echo.y;update();
  assert.ok(game.echoes.includes(echo),'24 enemy damage plus 30 boss damage leaves 46 stability');
  assert.equal(echo.stability,46);
  boss.mode='warning';boss.timer=.01;boss.targetX=echo.x;boss.targetY=echo.y;update();
  assert.equal(echo.stability,16);
  boss.mode='warning';boss.timer=.01;boss.targetX=echo.x;boss.targetY=echo.y;update();
  assert.equal(game.echoes.length,0,'a further 30 damage depletes the Echo');
});

test('Echo combat cannot damage an enemy through a closed wall',t=>{
  const {game,summon}=setup(t);const echo=summon(400,300);echo.status='finished';
  game.currentLevel.walls=[{x:445,y:230,width:20,height:140}];
  const enemy={...createEnemies({...game.currentLevel,id:2})[0],x:500,y:300,homeX:500,homeY:300,hp:100,maxHp:100};game.enemies=[enemy];
  const combat=(game as unknown as {updateEchoCombat(e:typeof echo,dt:number):boolean}).updateEchoCombat.bind(game);
  for(let i=0;i<30;i++)combat(echo,.05);
  assert.equal(enemy.hp,100);assert.equal(echo.combatAnchor,undefined);
});

test('passive stability depletion recalls an Echo without any enemy hits',t=>{
  const {game,update,summon}=setup(t);const echo=summon(400,300);echo.status='paused';echo.stability=1;
  for(let i=0;i<20;i++)update(.1);
  assert.equal(echo.stability,0);assert.ok(!game.echoes.includes(echo));
});

 test('damage magnitude and Restoration determine Echo survival, not hit count',t=>{
  const {game,summon}=setup(t);const echo=summon(400,300);
  const hit=(damage:number)=>(game as unknown as {hitEcho(e:typeof echo,n:number):void}).hitEcho(echo,damage);
  for(let i=0;i<5;i++)hit(5);
  assert.equal(echo.stability,75);assert.ok(game.echoes.includes(echo));
  hit(60);assert.equal(echo.stability,15);
  game.campaign.echoRunes.restore=1;game.useEchoRune('restore');
  assert.equal(echo.stability,65);
  hit(64);assert.ok(game.echoes.includes(echo));
  hit(1);assert.ok(!game.echoes.includes(echo));
});

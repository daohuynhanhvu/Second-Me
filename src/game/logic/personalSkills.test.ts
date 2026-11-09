import test from 'node:test';
import assert from 'node:assert/strict';
import { Campaign, createBoss } from './campaign.ts';
import { GameEngine } from '../GameEngine.ts';
import { sounds } from './sound.ts';
import { STORM_ORBS, orbPoint } from './stormOrbs.ts';
sounds.setMuted(true);
function setup(t: any) {
  const old=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{},classList:{toggle(){}}}}});
  t.after(()=>old?Object.defineProperty(globalThis,'document',old):Reflect.deleteProperty(globalThis,'document'));
  const game=new GameEngine();game.screen='playing';game.boss=createBoss();
  game.boss.pillars.forEach(p=>p.hp=0);game.boss.armor=0;
  return game;
}
test('Rivet costs exactly 100, cannot be bought twice, and ownership survives reload and new journeys',t=>{
  const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');const storage=new Map<string,string>();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v)}});
  t.after(()=>old?Object.defineProperty(globalThis,'localStorage',old):Reflect.deleteProperty(globalThis,'localStorage'));
  const c=new Campaign();c.coins=99;assert.equal(c.buyMechanical(),false);assert.equal(c.coins,99);
  c.coins=112;assert.equal(c.buyMechanical(),true);assert.equal(c.coins,12);assert.equal(c.buyMechanical(),false);
  const reloaded=new Campaign();reloaded.load();assert.equal(reloaded.mechanicalOwned,true);assert.equal(reloaded.coins,12);
  reloaded.reset();assert.equal(reloaded.mechanicalOwned,true);
});
test('locked mechanical class cannot be selected; purchased class gets its own skill',t=>{
  const g=setup(t);g.screen='characters';g.selectClass('mechanical');assert.equal(g.characterClass,'mage');
  g.campaign.coins=100;g.screen='shop';g.buyMechanical();g.screen='characters';g.selectClass('mechanical');assert.equal(g.characterClass,'mage');
  assert.equal(g.campaign.coins,100);
  g.characterClass='mechanical';
  g.screen='playing';g.useSkill();assert.equal(g.overdrive,5);g.attack();assert.equal(g.attackCooldown,.27);
});
test('orbs cap at three, orbit and deal nearby damage, then expire',t=>{
  const g=setup(t);g.currentLevel.walls=[];g.currentLevel.doors=[];const tick=(g as any).updatePersonalSkill.bind(g);
  g.player.x=500;g.player.y=300;const at=orbPoint(g.player,0);g.boss!.x=at.x+20;g.boss!.y=at.y;
  g.useSkill();g.useSkill();assert.equal(g.orbitOrbs.length,1);
  tick(.01);assert.equal(g.boss!.hp,240-STORM_ORBS.DAMAGE);assert.ok(g.orbitOrbs[0].angle>0);
  for(let i=0;i<4;i++){g.skillCooldown=0;g.useSkill();}assert.equal(g.orbitOrbs.length,STORM_ORBS.MAX);
  tick(6.1);assert.equal(g.orbitOrbs.length,0);
});
test('orbs stay evenly spaced, however far the others have turned, and spread out again when one expires',t=>{
  const g=setup(t);g.currentLevel.walls=[];g.currentLevel.doors=[];g.boss=null;const tick=(g as any).updatePersonalSkill.bind(g);
  const gap=(a:number,b:number)=>((b-a)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
  g.useSkill();tick(1);g.skillCooldown=0;g.useSkill();tick(1.3);g.skillCooldown=0;g.useSkill();
  const [a,b,c]=g.orbitOrbs.map(o=>o.angle);
  for(const d of [gap(a,b),gap(b,c),gap(c,a)])assert.ok(Math.abs(d-Math.PI*2/3)<1e-9,`gap ${d}`);
  tick(STORM_ORBS.LIFE-2.3+.01);                     // the first orb expires
  assert.equal(g.orbitOrbs.length,2);
  assert.ok(Math.abs(gap(g.orbitOrbs[0].angle,g.orbitOrbs[1].angle)-Math.PI)<1e-9);
});
test('orbs strike an enemy standing in its attack reach, every target they touch, and never through a wall',t=>{
  const g=setup(t);g.currentLevel.walls=[];g.currentLevel.doors=[];g.boss=null;const tick=(g as any).updatePersonalSkill.bind(g);
  g.player.x=500;g.player.y=300;
  const enemy=(x:number,y:number)=>({id:`e${x}`,kind:'goblin' as const,x,y,homeX:x,homeY:y,hp:30,maxHp:30,mode:'idle' as const,timer:9,targetX:0,targetY:0,facingLeft:false,hitFlash:0,deathAge:0,targetId:null});
  const left=enemy(450,300),right=enemy(550,300);g.enemies=[left,right];   // 50 px either side: where melee enemies stand to strike
  g.useSkill();for(let i=0;i<Math.round(2.2/.05);i++)tick(.05);             // one full turn
  assert.ok(left.hp<30&&right.hp<30,`both struck: ${left.hp} ${right.hp}`);
  const hidden=enemy(550,300);g.enemies=[hidden];g.currentLevel.walls=[{x:520,y:200,width:10,height:200}];
  g.orbitOrbs=[];g.skillCooldown=0;g.useSkill();for(let i=0;i<Math.round(2.2/.05);i++)tick(.05);
  assert.equal(hidden.hp,30);
});
test('sanctuary heals and boosts damage only inside its fixed radius, and expires',t=>{
  const g=setup(t);g.currentLevel.walls=[];g.currentLevel.doors=[];g.characterClass='swordsman';g.health=40;g.player.x=500;g.player.y=300;
  g.useSkill();const tick=(g as any).updatePersonalSkill.bind(g);tick(2);assert.equal(g.health,60);
  const combo=(g as any).updateCombo.bind(g);
  g.boss!.x=540;g.boss!.y=300;g.attack();combo(.1);assert.equal(g.boss!.hp,240-12*1.2);   // Quick Slash, +20% in the circle
  g.player.x=650;tick(2);assert.equal(g.health,60);g.attack({x:540,y:300});combo(.3);combo(.3);
  assert.ok(Math.abs(g.boss!.hp-(240-12*1.2-14))<1e-9);                                     // Reverse Slash outside it
  tick(1.1);assert.equal(g.lightCircle,null);
});
test('restart clears personal effects and cooldowns',t=>{
  const g=setup(t);g.useSkill();g.lightCircle={x:0,y:0,life:5,heal:0};g.overdrive=5;
  g.restartLevel();assert.equal(g.orbitOrbs.length,0);assert.equal(g.lightCircle,null);assert.equal(g.overdrive,0);assert.equal(g.skillCooldown,0);
});
test('swordsman and mechanical still activate pressure plates, and pause freezes personal effects',t=>{
  const g=setup(t);
  for(const kind of ['swordsman','mechanical'] as const) {
    g.characterClass=kind;g.restartLevel();
    const plate=g.currentLevel.plates[0];g.player.x=plate.x+plate.width/2;g.player.y=plate.y+plate.height/2;
    (g as any).update(.05);assert.equal(plate.isPressed,true);
  }
  g.characterClass='mage';g.useSkill();const life=g.orbitOrbs[0].life;
  g.screen='paused';(g as any).update(.05);assert.equal(g.orbitOrbs[0].life,life);
});

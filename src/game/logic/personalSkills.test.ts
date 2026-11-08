import test from 'node:test';
import assert from 'node:assert/strict';
import { Campaign, createBoss } from './campaign.ts';
import { GameEngine } from '../GameEngine.ts';
import { sounds } from './sound.ts';
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
  const g=setup(t);const tick=(g as any).updatePersonalSkill.bind(g);
  g.player.x=500;g.player.y=300;g.boss!.x=536;g.boss!.y=288;
  g.useSkill();g.useSkill();assert.equal(g.orbitOrbs.length,1);
  tick(.01);assert.equal(g.boss!.hp,236);assert.ok(g.orbitOrbs[0].angle>0);
  for(let i=0;i<4;i++){g.skillCooldown=0;g.useSkill();}assert.equal(g.orbitOrbs.length,3);
  tick(6.1);assert.equal(g.orbitOrbs.length,0);
});
test('sanctuary heals and boosts damage only inside its fixed radius, and expires',t=>{
  const g=setup(t);g.currentLevel.walls=[];g.currentLevel.doors=[];g.characterClass='swordsman';g.health=2;g.player.x=500;g.player.y=300;
  g.useSkill();const tick=(g as any).updatePersonalSkill.bind(g);tick(2);assert.equal(g.health,3);
  g.boss!.x=540;g.boss!.y=300;g.attack();assert.equal(g.boss!.hp,222);
  g.player.x=650;tick(2);assert.equal(g.health,3);g.attackCooldown=0;g.attack({x:540,y:300});assert.equal(g.boss!.hp,207);
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

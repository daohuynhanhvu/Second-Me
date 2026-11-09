import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from '../GameEngine.ts';
import {sounds} from './sound.ts';
sounds.setMuted(true);
function setup(t:TestContext){const old=Object.getOwnPropertyDescriptor(globalThis,'document');Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});t.after(()=>old?Object.defineProperty(globalThis,'document',old):Reflect.deleteProperty(globalThis,'document'));const g=new GameEngine();g.currentLevelIdx=1;g.restartLevel();g.tutorialEnabled=false;g.campaign.timeItems=2;g.campaign.echoRunes.guard=2;return g;}
test('inventory freezes the entire combat clock but allows one deliberate consumable activation',t=>{
 const g=setup(t);const time=g.legTimeRemaining!;g.setInventoryOpen(true);(g as any).update(2);assert.equal(g.legTimeRemaining,time);assert.equal(g.health,100);
 assert.ok(g.canUseTimeItem());assert.ok(g.useTimeItem());assert.equal(g.campaign.timeItems,1);assert.equal(g.legTimeRemaining,time+2);assert.ok(g.useTimeItem());assert.equal(g.campaign.timeItems,0);assert.equal(g.legTimeRemaining,time+4);assert.equal(g.useTimeItem(),false);
 assert.ok(g.useEchoRune('guard'));assert.equal(g.campaign.echoRunes.guard,1);assert.equal(g.useEchoRune('guard'),false);
 g.setInventoryOpen(false);(g as any).update(.1);assert.equal(g.legTimeRemaining,time+3.9);
});
test('closing nested rune editing keeps the inventory pause and does not consume a potion outside gameplay',t=>{
 const g=setup(t);g.setInventoryOpen(true);g.setRuneEditing(true);assert.equal(g.canUseTimeItem(),false);g.setRuneEditing(false);const time=g.legTimeRemaining;(g as any).update(1);assert.equal(g.legTimeRemaining,time);
 g.goToLobby();assert.equal(g.canUseTimeItem(),false);assert.equal(g.useTimeItem(),false);assert.equal(g.campaign.timeItems,2);
});

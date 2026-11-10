import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {Campaign} from './campaign.ts';
import {SHOP_ITEMS} from './shopItems.ts';
import {GameEngine} from '../GameEngine.ts';
import {createEnemies} from './enemies.ts';
import {LEVELS} from './levels.ts';
function game(t:TestContext){const old=Object.getOwnPropertyDescriptor(globalThis,'document');Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});t.after(()=>old?Object.defineProperty(globalThis,'document',old):Reflect.deleteProperty(globalThis,'document'));const g=new GameEngine();g.currentLevelIdx=1;g.tutorialEnabled=false;g.restartLevel();return g;}
function hit(g:GameEngine){g.invulnerability=0;(g as any).takeDamage(1000);}
test('catalogue purchases are atomic, bounded by quantity, funds, inventory caps and unlocks',()=>{
 const c=new Campaign();c.coins=100;assert.ok(c.buyShopItem('healSmall',5));assert.equal(c.coins,70);assert.equal(c.supplies.healSmall,5);
 const before=JSON.stringify({coins:c.coins,supplies:c.supplies});for(const qty of [0,-1,1.5,NaN,100,Number.MAX_SAFE_INTEGER])assert.equal(c.buyShopItem('healSmall',qty),false);assert.equal(JSON.stringify({coins:c.coins,supplies:c.supplies}),before);
 assert.equal(c.buyShopItem('aid'),false);c.supplies.healLarge=98;assert.equal(c.buyShopItem('healLarge',2),false);assert.ok(c.buyShopItem('healLarge'));assert.equal(c.supplies.healLarge,99);
 assert.deepEqual(SHOP_ITEMS.slice(0,5).map(i=>[i.price,i.cap]),[[6,99],[10,99],[12,10],[22,2],[0,1]]);
});
test('aid unlock tracks both heroes through all six trials across fresh journeys',()=>{
 const c=new Campaign();for(let id=1;id<=6;id++)c.recordHeroClear('mage',id);c.reset();for(let id=1;id<=5;id++)c.recordHeroClear('swordsman',id);assert.equal(c.aidUnlocked,false);
 c.recordHeroClear('swordsman',6);assert.equal(c.aidUnlocked,true);assert.equal(c.supplies.aid,1);c.recordHeroClear('swordsman',6);assert.equal(c.supplies.aid,1);c.supplies.aid=0;assert.equal(c.buyShopItem('aid'),false,'earned aid cannot be repurchased');
});
test('new item inventory, partial chance charges and hero clears survive saving; corrupt inventory is sanitized',t=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');let save='{}';Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>save,setItem:(_k:string,v:string)=>save=v}});t.after(()=>old?Object.defineProperty(globalThis,'localStorage',old):Reflect.deleteProperty(globalThis,'localStorage'));
 const c=new Campaign();c.supplies.healSmall=9;c.chanceCharges=2;c.recordHeroClear('mage',6);c.save();const reload=new Campaign();reload.load();assert.equal(reload.supplies.healSmall,9);assert.equal(reload.chanceCharges,2);assert.deepEqual(reload.heroClears.mage,[6]);
 save=JSON.stringify({supplies:{healSmall:999,healLarge:-1,revive:1.5,chances:NaN},chanceCharges:50,heroClears:{mage:[1,1,7,'2']}});reload.load();assert.equal(reload.supplies.healSmall,99);assert.equal(reload.supplies.healLarge,0);assert.equal(reload.supplies.revive,0);assert.equal(reload.chanceCharges,3);assert.deepEqual(reload.heroClears.mage,[1]);
});
test('healing consumes only when useful, supports multiple uses, and respects the current maximum',t=>{
 const g=game(t);g.campaign.supplies.healSmall=5;g.campaign.supplies.healLarge=2;assert.equal(g.useSupply('healSmall'),false);g.health=85;assert.ok(g.useSupply('healSmall'));assert.equal(g.health,95);assert.ok(g.useSupply('healSmall'));assert.equal(g.health,100);assert.equal(g.campaign.supplies.healSmall,3);assert.equal(g.useSupply('healSmall'),false);
 g.maxHealth=80;g.health=40;assert.ok(g.useSupply('healLarge'));assert.equal(g.health,80);g.screen='paused';g.health=20;assert.equal(g.useSupply('healLarge'),false);
});
test('three chances is passive, once per attempt, carries charges and revives with 100/90/80 HP',t=>{
 const g=game(t);g.campaign.supplies.chances=2;const x=g.player.x,y=g.player.y;
 hit(g);assert.equal(g.screen,'playing');assert.equal(g.health,100);assert.equal(g.maxHealth,100);assert.equal(g.campaign.chanceCharges,2);assert.equal(g.campaign.supplies.chances,1);assert.equal(g.player.x,x);assert.equal(g.player.y,y);
 hit(g);assert.equal(g.screen,'defeat');assert.equal(g.campaign.chanceCharges,2);
 g.restartLevel();hit(g);assert.equal(g.maxHealth,90);assert.equal(g.health,90);assert.equal(g.campaign.chanceCharges,1);
 g.restartLevel();hit(g);assert.equal(g.maxHealth,80);assert.equal(g.health,80);assert.equal(g.campaign.chanceCharges,0);
 g.restartLevel();hit(g);assert.equal(g.maxHealth,100);assert.equal(g.campaign.supplies.chances,0);assert.equal(g.campaign.chanceCharges,2);
});
test('scroll revives at altar without resetting enemies, runes or clock; rejects timeout and repeated use',t=>{
 const g=game(t);g.campaign.supplies.revive=2;g.player.x+=50;const enemies=g.enemies,time=g.legTimeRemaining;hit(g);assert.equal(g.screen,'defeat');assert.ok(g.useSupply('revive'));assert.equal(g.health,g.maxHealth);assert.equal(g.player.x,g.currentLevel.playerSpawn.x);assert.equal(g.player.y,g.currentLevel.playerSpawn.y);assert.equal(g.enemies,enemies);assert.equal(g.legTimeRemaining,time);assert.equal(g.campaign.supplies.revive,1);assert.ok(g.invulnerability>0);
 hit(g);assert.equal(g.useSupply('revive'),false);g.restartLevel();g.screen='defeat';g.defeatReason='timeout';assert.equal(g.useSupply('revive'),false);
});
test('aid is the other hero, has 15 HP, attacks independently, cannot hold a gate rune, and cannot be stacked',t=>{
 const g=game(t);g.campaign.aidUnlocked=true;g.campaign.supplies.aid=1;assert.ok(g.useSupply('aid'));assert.equal(g.supportAlly?.hero,'swordsman');assert.equal(g.supportAlly?.hp,15);assert.equal(g.echoes.length,0);
 const enemy=createEnemies(LEVELS[1])[0];enemy.x=g.player.x+35;enemy.y=g.player.y;enemy.hp=30;g.enemies=[enemy];(g as any).updateSupport(.4);assert.equal(enemy.hp,20);
 g.enemies=[];const p=g.currentLevel.plates[0];g.supportAlly!.x=p.x+25;g.supportAlly!.y=p.y+25;(g as any).update(.01);assert.equal(p.isPressed,false);assert.equal(g.echoes.length,0);
 (g as any).hitSupport(20);assert.equal(g.supportAlly,null);g.campaign.supplies.aid=1;assert.equal(g.useSupply('aid'),false);g.restartLevel();assert.ok(g.useSupply('aid'));
});
test('dev mode grants coins and runes while keeping shop purchases available',t=>{
 const g=game(t);g.campaign.supplies.healSmall=7;g.campaign.supplies.healLarge=99;g.campaign.supplies.revive=10;g.campaign.supplies.chances=2;g.campaign.timeItems=99999;g.campaign.limitRings=99999;
 g.unlockDevMode();assert.equal(g.campaign.coins,99999);assert.ok(Object.values(g.campaign.echoRunes).every(n=>n===9999));assert.equal(g.campaign.supplies.healSmall,7);assert.equal(g.campaign.aidUnlocked,true);
 for(const id of ['time','ring','healLarge','revive','chances'] as const)assert.equal(g.campaign.shopStock(id),0);
 g.screen='shop';for(const item of SHOP_ITEMS.filter(i=>i.id!=='aid'))assert.ok(g.buyShopItem(item.id),item.id);
 const stock=g.campaign.timeItems;g.unlockDevMode();assert.equal(g.campaign.timeItems,stock,'ordinary purchases survive repeated code entry');
});

test('legacy supply saves migrate without losing stock, opened revival charges or hero progress',t=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');let data=JSON.stringify({supplies:{heal10:7,heal50:2,revive:3,chances:2,support:1},chanceUses:1,supportClaimed:true,heroClears:{mage:[1,2,3],swordsman:[1]},timeItems:11,limitRings:4});
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>data,setItem:(_key:string,value:string)=>data=value}});t.after(()=>old?Object.defineProperty(globalThis,'localStorage',old):Reflect.deleteProperty(globalThis,'localStorage'));
 const c=new Campaign();c.load();assert.equal(c.supplies.healSmall,7);assert.equal(c.supplies.healLarge,2);assert.equal(c.supplies.aid,1);assert.equal(c.supplies.chances,1);assert.equal(c.chanceCharges,2);assert.equal(c.aidUnlocked,true);assert.equal(c.timeItems,11);assert.equal(c.limitRings,4);assert.deepEqual(c.heroClears.mage,[1,2,3]);c.save();const next=new Campaign();next.load();assert.deepEqual(next.supplies,c.supplies);assert.equal(next.chanceCharges,2);
});

 test('old full dev saves become buyable automatically on load without losing coins or runes',t=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');let data=JSON.stringify({coins:100011,timeItems:99999,limitRings:99999,supplies:{healSmall:99,healLarge:99,revive:10,chances:2},echoRunes:{calling:9999}});
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>data,setItem:(_k:string,v:string)=>data=v}});t.after(()=>old?Object.defineProperty(globalThis,'localStorage',old):Reflect.deleteProperty(globalThis,'localStorage'));
 const c=new Campaign();c.load();assert.equal(c.coins,100011);for(const i of SHOP_ITEMS.filter(i=>i.id!=='aid')){assert.equal(c.shopStock(i.id),0);assert.ok(c.buyShopItem(i.id));}
 const next=new Campaign();next.load();assert.equal(next.timeItems,1);assert.equal(next.supplies.revive,1);assert.equal(next.devShopStockMigrated,true);
 });

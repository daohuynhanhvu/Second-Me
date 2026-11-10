import test from 'node:test';
import assert from 'node:assert/strict';
import {Campaign} from './campaign.ts';
import {canWearOutfit,cleanOwnedOutfits,outfitTone,type ShopOutfitId} from './outfits.ts';
import {GameEngine} from '../GameEngine.ts';
test('each intermediate costume costs exactly 100 and can be bought only once',()=>{
 const c=new Campaign();c.coins=200;
 assert.equal(c.buyOutfit('ice-knight'),true);assert.equal(c.coins,100);
 assert.equal(c.buyOutfit('ice-knight'),false);assert.equal(c.coins,100);
 assert.equal(c.buyOutfit('void-knight'),true);assert.equal(c.coins,0);
 assert.deepEqual(c.ownedOutfits,['ice-knight','void-knight']);
});
test('insufficient or invalid funds and unknown products never mutate the wallet',()=>{
 const c=new Campaign();for(const coins of [0,99,-1,NaN,Infinity,100.5]){c.coins=coins;assert.equal(c.buyOutfit('ice-knight'),false);assert.ok(Object.is(c.coins,coins));}
 c.coins=100;assert.equal(c.buyOutfit('forged' as ShopOutfitId),false);assert.equal(c.coins,100);assert.deepEqual(c.ownedOutfits,[]);
});
test('ownership is cleaned, saved, restored, and preserved when restarting the campaign',t=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');const data=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)}});
 t.after(()=>{if(previous)Object.defineProperty(globalThis,'localStorage',previous);else Reflect.deleteProperty(globalThis,'localStorage');});
 const c=new Campaign();c.coins=200;c.buyOutfit('ice-knight');c.buyOutfit('void-knight');const reloaded=new Campaign();reloaded.load();assert.equal(reloaded.coins,0);assert.deepEqual(reloaded.ownedOutfits,c.ownedOutfits);reloaded.reset();const reset=new Campaign();reset.load();assert.deepEqual(reset.ownedOutfits,c.ownedOutfits);
 assert.deepEqual(cleanOwnedOutfits(['void-knight','void-knight','default','invalid']),['void-knight']);
});
test('paid costumes are restricted to owned swordsman outfits, independent of legacy palettes',()=>{
 assert.equal(canWearOutfit('swordsman','ice-knight',[]),false);assert.equal(canWearOutfit('mage','ice-knight',['ice-knight']),false);assert.equal(canWearOutfit('swordsman','ice-knight',['ice-knight']),true);assert.equal(canWearOutfit('mage','woodland',[]),true);
 assert.equal(outfitTone('mage','void-knight'),null);assert.notEqual(outfitTone('swordsman','ice-knight')?.color,outfitTone('swordsman','void-knight')?.color);
});
test('engine enforces shop purchase and outfit equip boundaries',()=>{
 const e=new GameEngine();e.campaign.coins=200;e.campaign.ownedOutfits=[];e.screen='playing';assert.equal(e.buyOutfit('ice-knight'),false);assert.equal(e.setCharacterOutfit('swordsman','ice-knight'),false);
 e.screen='shop';assert.equal(e.setCharacterOutfit('swordsman','ice-knight'),false);assert.equal(e.buyOutfit('ice-knight'),true);assert.equal(e.setCharacterOutfit('mage','ice-knight'),false);assert.equal(e.setCharacterOutfit('swordsman','ice-knight'),true);assert.equal(e.buyOutfit('ice-knight'),false);assert.equal(e.campaign.coins,100);e.setCharacterOutfit('swordsman','default');
});

test('legacy Frostbound and Ember require separate purchases for each hero while Woodland stays gifted',()=>{
 const c=new Campaign();c.coins=240;
 for(const hero of ['mage','swordsman'] as const){
  assert.equal(canWearOutfit(hero,'default',c.ownedOutfits),true);
  assert.equal(canWearOutfit(hero,'woodland',c.ownedOutfits),true);
  assert.equal(canWearOutfit(hero,'frost',c.ownedOutfits),false);
  assert.equal(canWearOutfit(hero,'ember',c.ownedOutfits),false);
 }
 for(const id of ['mage-frost','mage-ember','swordsman-frost','swordsman-ember'] as const){assert.equal(c.buyOutfit(id),true);assert.equal(c.buyOutfit(id),false);}
 assert.equal(c.coins,0);
 for(const hero of ['mage','swordsman'] as const)for(const outfit of ['frost','ember'] as const)assert.equal(canWearOutfit(hero,outfit,c.ownedOutfits),true);
});

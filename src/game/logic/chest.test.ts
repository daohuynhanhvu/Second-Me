import {puzzleBalance} from './balance.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Campaign} from './campaign.ts';
import {CHEST_POOL,rollChest} from './chest.ts';
test('100 equally spaced rolls yield the published probabilities',()=>{
 assert.equal(CHEST_POOL.reduce((sum,item)=>sum+item.weight,0),100);
 const results=Array.from({length:100},(_,i)=>rollChest(()=>(i+.5)/100));
 for(const item of CHEST_POOL)assert.equal(results.filter(id=>id===item.id).length,item.weight);
});
test('x1 and x10 charge keys once and credit every reward once',()=>{
 const c=new Campaign();c.chestKeys=55;c.coins=100;
 assert.deepEqual(c.openChest(1,()=>.99),['revive']);assert.equal(c.supplies.revive,1);assert.equal(c.chestKeys,50);assert.equal(c.coins,100);
 const sequence=[0,.4,.6,.74,.8,.88,.94,.99,0,.4];let i=0;
 assert.equal(c.openChest(10,()=>sequence[i++])?.length,10);
 assert.equal(c.chestKeys,0);assert.equal(c.coins,270);assert.equal(c.timeItems,1);
 assert.equal(c.supplies.healSmall,1);assert.equal(c.supplies.healLarge,1);assert.equal(c.supplies.revive,2);assert.equal(c.limitRings,0);
 const before=JSON.stringify(c);assert.equal(c.openChest(1),null);assert.equal(JSON.stringify(c),before);
});
test('keys and awarded rewards survive reload; old saves start with zero keys',t=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');let data='{}';
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>data,setItem:(_key:string,value:string)=>{data=value;}}});
 t.after(()=>old?Object.defineProperty(globalThis,'localStorage',old):Reflect.deleteProperty(globalThis,'localStorage'));
 const c=new Campaign();c.load();assert.equal(c.chestKeys,0);c.chestKeys=10;c.openChest(1,()=>.99);
 const loaded=new Campaign();loaded.load();assert.equal(loaded.chestKeys,5);assert.equal(loaded.supplies.revive,1);assert.deepEqual(loaded.lastChestRewards,['revive']);
});
test('trail stars award 5, 4, 3 keys; boss awards 3–5 independently of rating',()=>{
 const c=new Campaign();
 assert.equal(c.completeLevel(1,0).keys,5);
 assert.equal(c.completeLevel(1,10000).keys,0);
 assert.equal(c.completeLevel(6,10000,()=>0).keys,3);
 assert.equal(c.completeLevel(6,0,()=>.5).keys,4);
 assert.equal(c.completeLevel(6,0,()=>.99).keys,5);
 const target=puzzleBalance(1).threeStars;
 assert.equal(c.completeLevel(1,target*1.1).keys,4);
 assert.equal(c.completeLevel(1,target*1.5).keys,3);
 assert.equal(c.chestKeys,24);
});

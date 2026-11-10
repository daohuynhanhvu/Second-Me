import test from 'node:test';
import assert from 'node:assert/strict';
import {ManaPool,COMBO_MP,comboManaCost,skillManaCost} from './mana.ts';
test('combo costs MP and an unaffordable hit spends nothing',()=>{const m=new ManaPool();for(const n of COMBO_MP.swordsman)assert.equal(m.spend(n),true);assert.equal(m.value,69);assert.equal(m.spend(70),false);assert.equal(m.value,69);assert.equal(m.spend(69),true);assert.equal(m.spend(0),true);assert.equal(m.value,0);});
test('regeneration waits 1.5 seconds and is independent of frame size',()=>{const m=new ManaPool();m.spend(50);m.update(1);assert.equal(m.value,50);m.update(1);assert.equal(m.value,54);const other=new ManaPool();other.spend(50);other.update(2);assert.equal(other.value,m.value);m.update(100);assert.equal(m.value,100);m.reset();assert.equal(m.value,100);});
test('Aeris pays more than Kael: two full combos empty her pool, Kael keeps his old costs',()=>{
 const sum=(h:'mage'|'swordsman')=>COMBO_MP[h].reduce((a:number,b:number)=>a+b,0);
 assert.equal(sum('mage'),50);assert.equal(sum('swordsman'),31);
 assert.deepEqual([skillManaCost('mage'),skillManaCost('swordsman')],[40,30]);
 const m=new ManaPool();for(let c=0;c<2;c++)for(let s=0;s<4;s++)assert.equal(m.spend(comboManaCost('mage',s)),true);
 assert.equal(m.value,0);assert.equal(m.spend(comboManaCost('mage',1)),false,'the third combo stalls at its second hit');
 assert.equal(comboManaCost('mage',9),0,'past the last hit: free, never NaN');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {ManaPool,COMBO_MP} from './mana.ts';
test('combo costs MP and an unaffordable hit spends nothing',()=>{const m=new ManaPool();for(const n of COMBO_MP)assert.equal(m.spend(n),true);assert.equal(m.value,69);assert.equal(m.spend(70),false);assert.equal(m.value,69);assert.equal(m.spend(69),true);assert.equal(m.spend(0),true);assert.equal(m.value,0);});
test('regeneration waits 1.5 seconds and is independent of frame size',()=>{const m=new ManaPool();m.spend(50);m.update(1);assert.equal(m.value,50);m.update(1);assert.equal(m.value,54);const other=new ManaPool();other.spend(50);other.update(2);assert.equal(other.value,m.value);m.update(100);assert.equal(m.value,100);m.reset();assert.equal(m.value,100);});

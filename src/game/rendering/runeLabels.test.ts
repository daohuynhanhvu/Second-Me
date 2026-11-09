import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS} from '../logic/levels.ts';
import {gateLabelLayout,overlaps,romanRune} from './runeLabels.ts';
test('Roman rune strips clear every campaign rune, other strip, and HUD',()=>{
 for(const level of LEVELS){const boxes=gateLabelLayout(level);for(const [i,box] of boxes.entries()){
  assert.ok(box.x>=44&&box.x+box.width<=1236&&box.y>=44&&box.y+box.height<=676,`bounds ${level.id}/${i}`);
  for(const plate of level.plates)assert.ok(!overlaps(box,{x:plate.x-12,y:plate.y-55,width:plate.width+24,height:plate.height+67}),`rune ${level.id}/${i}`);
  assert.ok(!overlaps(box,{x:450,y:0,width:360,height:140}),`HUD ${level.id}/${i}`);
  assert.ok(box.y>=105,`toolbar ${level.id}/${i}`);
  for(const other of boxes.slice(0,i))assert.ok(!overlaps(box,other),`strip ${level.id}/${i}`);
 }}assert.deepEqual([0,1,2,3,4].map(romanRune),['I','II','III','IV','V']);
});

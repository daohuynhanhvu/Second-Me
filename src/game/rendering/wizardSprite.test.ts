import test from 'node:test';
import assert from 'node:assert/strict';
import {WIZARD_WALK_ORDER,wizardFrameOffsets} from './wizardSprite.ts';
test('Aeris preserves the authored forward stride in all directions',()=>{
 for(const row of WIZARD_WALK_ORDER)assert.deepEqual(row,[0,1,2,3,4,5,6,7]);
});
test('shifted frames align to the idle hood anchor without moving centred frames',()=>{
 const width=2048,pixels=new Uint8ClampedArray(width*768*4);
 for(let row=0;row<3;row++)for(let f=0;f<8;f++)for(let x=100-(f===1?28:0);x<140-(f===1?28:0);x++)pixels[((row*256+50)*width+f*256+x)*4+3]=255;
 for(const offsets of wizardFrameOffsets(pixels,width))assert.deepEqual(offsets,[0,28,0,0,0,0,0,0]);
});

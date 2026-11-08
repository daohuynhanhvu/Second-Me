import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from './GameEngine.ts';
import {updatePressurePlates,updateSecurityDoors} from './logic/puzzle.ts';

test('four independent echoes keep unique colors; fifth summon preserves them',t=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
 t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):Reflect.deleteProperty(globalThis,'document'));
 const game=new GameEngine();game.restartLevel();
 for(let i=0;i<4;i++){game.player.x=200+i*30;game.toggleRecording();game.toggleRecording();game.spawnEcho();}
 assert.equal(game.echoes.length,4);assert.equal(new Set(game.echoes.map(e=>e.colorSlot)).size,4);
 const original=[...game.echoes];game.spawnEcho();assert.deepEqual(game.echoes,original);
 game.selectEcho(1);game.dismissEcho();assert.equal(game.echoes.length,3);assert.ok(game.echoes.includes(original[0]));
 game.echoCharges=1;game.spawnEcho();assert.equal(game.echoes.length,4);assert.equal(new Set(game.echoes.map(e=>e.colorSlot)).size,4);
 game.legTimeRemaining=null;(game as any).update(.05);
 assert.ok(game.echoes.every(e=>e.elapsedMs===50));
 game.restartLevel();assert.equal(game.echoes.length,0);
});

test('three echoes jointly open a gate; removing one closes it and any echo protects threshold',()=>{
 const plates=[0,1,2].map(i=>({id:`p${i}`,x:100+i*100,y:100,width:40,height:40,isPressed:false}));
 const echoes=plates.map(p=>({x:p.x+20,y:p.y+20}));
 const player={x:40,y:40};
 const doors=[{id:'gate',x:500,y:100,width:40,height:80,isOpen:false,openProgress:0,requiredPlates:plates.map(p=>p.id),orientation:'vertical' as const}];
 updatePressurePlates(plates,player,echoes,.5);updateSecurityDoors(doors,plates,player,echoes,.5);
 assert.equal(doors[0].openProgress,1);
 updatePressurePlates(plates,player,echoes.slice(1),.5);
 updateSecurityDoors(doors,plates,player,[...echoes.slice(1),{x:520,y:140}],.5);
 assert.equal(doors[0].isOpen,false);assert.equal(doors[0].openProgress,1);
 updateSecurityDoors(doors,plates,player,echoes.slice(1),.5);assert.equal(doors[0].openProgress,0);
});

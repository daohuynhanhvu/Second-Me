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
 const input=game as unknown as {handleKeyDown(event:KeyboardEvent):void};
 const press=(key:string,code:string)=>input.handleKeyDown({key,code,repeat:false,preventDefault(){}} as KeyboardEvent);
 press('2','Digit2');assert.equal(game.selectedEcho,1);
 press('c','KeyC');assert.equal(game.echo?.status,'paused');
 press('c','KeyC');assert.equal(game.echo?.status,'replaying');
 const original=[...game.echoes];game.spawnEcho();assert.deepEqual(game.echoes,original);
 press('x','KeyX');assert.equal(game.echoes.length,3);assert.ok(!game.echoes.includes(original[0]));assert.equal(game.echo,original[1], 'selection follows the same surviving Echo');
 game.echoCharges=1;game.spawnEcho();assert.equal(game.echoes.length,4);assert.equal(new Set(game.echoes.map(e=>e.colorSlot)).size,4);
 const replacement=game.echo!;
 press('x','KeyX');assert.deepEqual(game.echoes,[original[2],original[3],replacement]);
 press('x','KeyX');assert.deepEqual(game.echoes,[original[3],replacement]);
 press('x','KeyX');assert.deepEqual(game.echoes,[replacement]);
 game.legTimeRemaining=null;(game as any).update(.05);
 assert.ok(game.echoes.every(e=>e.elapsedMs===50));
 game.restartLevel();assert.equal(game.echoes.length,0);
});

test('recall skips Echoes already lost to combat and keeps summon order despite color reuse', t => {
 const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
 Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
 t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):Reflect.deleteProperty(globalThis,'document'));
 const game=new GameEngine();game.restartLevel();
 for(let i=0;i<3;i++){game.toggleRecording();game.toggleRecording();game.spawnEcho();}
 const [first,second,third]=game.echoes;
 const hit=(game as unknown as {hitEcho(e:typeof first,amount:number):void}).hitEcho.bind(game);
 hit(first,30);hit(first,30);hit(first,40);
 assert.deepEqual(game.echoes,[second,third]);
 game.echoCharges=1;game.spawnEcho();const newest=game.echo!;
 assert.equal(newest.colorSlot,first.colorSlot,'new Echo can reuse an old color');
 game.dismissEcho();assert.deepEqual(game.echoes,[third,newest]);
 game.dismissEcho();assert.deepEqual(game.echoes,[newest]);
 game.dismissEcho();game.dismissEcho();assert.equal(game.echoes.length,0);
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

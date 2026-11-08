import test from 'node:test';
import assert from 'node:assert/strict';
import {GameEngine} from './GameEngine.ts';
import {Campaign} from './logic/campaign.ts';

test('shop rings cost 30 coins, persist, and are only sold in the shop', t => {
  const documentDescriptor=Object.getOwnPropertyDescriptor(globalThis,'document');
  const storageDescriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  let saved='{}';
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>saved,setItem:(_key:string,value:string)=>{saved=value;}}});
  t.after(()=>{documentDescriptor?Object.defineProperty(globalThis,'document',documentDescriptor):Reflect.deleteProperty(globalThis,'document');storageDescriptor?Object.defineProperty(globalThis,'localStorage',storageDescriptor):Reflect.deleteProperty(globalThis,'localStorage');});
  const game=new GameEngine();game.campaign.coins=60;
  game.buyLimitRing();assert.equal(game.campaign.limitRings,0);
  game.screen='shop';game.buyLimitRing();game.buyLimitRing();game.buyLimitRing();
  assert.equal(game.campaign.coins,0);assert.equal(game.campaign.limitRings,2);
  const loaded=new Campaign();loaded.load();assert.equal(loaded.limitRings,2);assert.equal(loaded.coins,0);
});

test('consumed rings grant two slots and charges for one attempt without stacking', t => {
  const previous=Object.getOwnPropertyDescriptor(globalThis,'document');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});
  t.after(()=>previous?Object.defineProperty(globalThis,'document',previous):Reflect.deleteProperty(globalThis,'document'));
  const game=new GameEngine();game.restartLevel();game.campaign.limitRings=3;
  for(let i=0;i<4;i++){game.recorder.startRecording(game.player.x,game.player.y,'right');game.spawnEcho();}
  assert.equal(game.echoes.length,4);assert.equal(game.echoLimit,4);
  assert.equal(game.useLimitRing(),true);assert.equal(game.echoLimit,6);assert.equal(game.echoCharges,2);
  assert.equal(game.useLimitRing(),true);assert.equal(game.campaign.limitRings,1);assert.equal(game.echoCharges,2);assert.equal(game.echoLimit,6);
  for(let i=0;i<2;i++){game.recorder.startRecording(game.player.x,game.player.y,'right');game.spawnEcho();}
  assert.equal(game.echoes.length,6);assert.equal(new Set(game.echoes.map(e=>e.colorSlot)).size,6);
  game.recorder.startRecording(game.player.x,game.player.y,'right');game.spawnEcho();assert.equal(game.echoes.length,6);
  const input=game as unknown as {handleKeyDown(event:KeyboardEvent):void};
  input.handleKeyDown({key:'6',code:'Digit6',repeat:false,preventDefault(){}} as KeyboardEvent);assert.equal(game.selectedEcho,5);
  game.restartLevel();assert.equal(game.echoLimit,4);assert.equal(game.campaign.limitRings,1);assert.equal(game.limitRingActive,false);
  game.pauseGame();assert.equal(game.useLimitRing(),false);assert.equal(game.campaign.limitRings,1);
});

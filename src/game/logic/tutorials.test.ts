import test from 'node:test';
import assert from 'node:assert/strict';
import { TutorialDirector } from './tutorials.ts';
import { GameEngine } from '../GameEngine.ts';

test('first encounters queue once and acknowledged topics persist across reloads',()=>{
 let saved:string|null=null;const storage={getItem:()=>saved,setItem:(_key:string,value:string)=>{saved=value;}};
 const guide=new TutorialDirector(storage);guide.offer('links');guide.offer('links');guide.offer('rocks');guide.offer('rocks');
 assert.equal(guide.active,'links');guide.dismiss();assert.equal(guide.active,'rocks');guide.dismiss();assert.equal(guide.blocking,false);
 const reload=new TutorialDirector(storage);reload.offer('links');reload.offer('rocks');assert.equal(reload.blocking,false);
 reload.offer('multi');assert.equal(reload.active,'multi');
});
test('the library can replay a seen topic without clearing discovery history',()=>{
 const guide=new TutorialDirector(null);guide.offer('links');guide.dismiss();guide.openLibrary();assert.equal(guide.blocking,true);
 guide.replay('links');assert.equal(guide.libraryOpen,false);assert.equal(guide.active,'links');guide.dismiss();
 assert.equal(guide.seen.has('links'),true);assert.equal(guide.blocking,false);
});
test('corrupt or unavailable storage does not break guidance',()=>{
 assert.doesNotThrow(()=>new TutorialDirector({getItem:()=>'{bad',setItem:()=>{throw new Error('blocked');}}));
 const guide=new TutorialDirector({getItem:()=>null,setItem:()=>{throw new Error('blocked');}});
 guide.offer('echo');assert.doesNotThrow(()=>guide.dismiss());assert.equal(guide.seen.has('echo'),true);
});
test('a mechanic guide freezes the world, traps and timer and releases movement keys',()=>{
 const game=new GameEngine();game.screen='playing';game.tutorialEnabled=true;game.legTimeRemaining=10;
 const internals=game as unknown as {update(dt:number):void;heldKeys:Set<string>;elapsedLevelTime:number};
 game.guides.offer('links');internals.heldKeys.add('KeyD');const x=game.player.x;
 for(let i=0;i<40;i++)internals.update(.1);
 assert.equal(game.legTimeRemaining,10);assert.equal(internals.elapsedLevelTime,0);assert.equal(game.player.x,x);assert.equal(game.health,100);assert.equal(internals.heldKeys.size,0);
 game.dismissGuide();internals.update(.1);assert.ok(game.legTimeRemaining!<10);
 game.openGuide();const remaining=game.legTimeRemaining;internals.update(2);assert.equal(game.legTimeRemaining,remaining);
 game.closeGuide();internals.update(.1);assert.ok(game.legTimeRemaining!<remaining!);
});
test('rune links are discovered near the rune and do not appear again after acknowledgement',()=>{
 const game=new GameEngine();game.screen='playing';game.tutorialEnabled=true;
 const internal=game as unknown as {update(dt:number):void};const plate=game.currentLevel.plates[0];
 game.player.x=plate.x+25;game.player.y=plate.y+25;internal.update(.01);assert.equal(game.guides.active,'links');
 game.dismissGuide();internal.update(.01);assert.equal(game.guides.active,null);
});

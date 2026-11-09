import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {needsLandscape} from './orientation.ts';
import {GameEngine} from '../GameEngine.ts';
import {sounds} from './sound.ts';
sounds.setMuted(true);
test('touch portrait requires landscape; desktop and landscape do not',()=>{assert.equal(needsLandscape(390,844,true),true);assert.equal(needsLandscape(844,390,true),false);assert.equal(needsLandscape(768,1024,true),true);assert.equal(needsLandscape(390,844,false),false);});
test('rotating portrait freezes combat, recording and consumables and resumes without changing a manual pause',t=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'document');Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});t.after(()=>old?Object.defineProperty(globalThis,'document',old):Reflect.deleteProperty(globalThis,'document'));
 const g=new GameEngine();g.currentLevelIdx=1;g.restartLevel();g.tutorialEnabled=false;g.campaign.timeItems=2;g.campaign.echoRunes.guard=1;g.recorder.startRecording(g.player.x,g.player.y,'right');const time=g.legTimeRemaining,duration=g.recorder.getDuration();g.setOrientationBlocked(true);(g as any).update(5);
 assert.equal(g.legTimeRemaining,time);assert.equal(g.recorder.getDuration(),duration);assert.equal(g.health,100);assert.equal(g.canUseTimeItem(),false);assert.equal(g.useEchoRune('guard'),false);g.attack();assert.equal(g.combo,null);g.spawnEcho();assert.equal(g.echoes.length,0);
 g.setOrientationBlocked(false);(g as any).update(.1);assert.ok(g.legTimeRemaining!<time!);g.pauseGame();g.setOrientationBlocked(true);g.setOrientationBlocked(false);assert.equal(g.screen,'paused');
});

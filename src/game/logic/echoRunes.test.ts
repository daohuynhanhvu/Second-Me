import test from 'node:test';
import assert from 'node:assert/strict';
import { Campaign } from './campaign.ts';
import { ECHO_RUNES, rollRuneChoices } from './echoRunes.ts';
import { GameEngine } from '../GameEngine.ts';
import { sounds } from './sound.ts';
sounds.setMuted(true);
function setup(t:any){
 const old=Object.getOwnPropertyDescriptor(globalThis,'document');Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{},classList:{toggle(){}}}}});t.after(()=>old?Object.defineProperty(globalThis,'document',old):Reflect.deleteProperty(globalThis,'document'));
 const g=new GameEngine();g.restartLevel();return g;
}
test('all equally-sized branches yield unique triples with identical rune frequencies',()=>{
 const n=ECHO_RUNES.length;
 const counts=Object.fromEntries(ECHO_RUNES.map(r=>[r.id,0]));const outcomes=new Set<string>();
 for(let a=0;a<n;a++)for(let b=0;b<n-1;b++)for(let c=0;c<n-2;c++){
  const values=[(a+.5)/n,(b+.5)/(n-1),(c+.5)/(n-2)];const choice=rollRuneChoices(()=>values.shift()!);
  assert.equal(new Set(choice).size,3);outcomes.add(choice.join(','));for(const id of choice)counts[id]++;
 }
 assert.equal(outcomes.size,n*(n-1)*(n-2));assert.deepEqual(Object.values(counts),Array(n).fill(3*(n-1)*(n-2)));
});
test('each clear offers choices, only one offered rune is granted, repeat clears can grant duplicates',()=>{
 const c=new Campaign();c.completeLevel(1,10);assert.equal(c.pendingRuneChoices.length,3);assert.equal(Object.values(c.echoRunes).length,0);
 const first=c.pendingRuneChoices[0];assert.equal(c.chooseRune(first),true);assert.equal(c.chooseRune(first),false);assert.equal(c.echoRunes[first],1);
 c.pendingRuneChoices=[first,...ECHO_RUNES.filter(r=>r.id!==first).slice(0,2).map(r=>r.id)];assert.equal(c.chooseRune(first),true);assert.equal(c.echoRunes[first],2);
 c.completeLevel(6,30);assert.equal(c.pendingRuneChoices.length,0);
});
test('pending choices and inventory survive reload; invalid saved entries are rejected',t=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),m=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>m.set(k,v)}});t.after(()=>old?Object.defineProperty(globalThis,'localStorage',old):Reflect.deleteProperty(globalThis,'localStorage'));
 const c=new Campaign();c.completeLevel(2,20);const reload=new Campaign();reload.load();assert.deepEqual(reload.pendingRuneChoices,c.pendingRuneChoices);assert.equal(reload.chooseRune(reload.pendingRuneChoices[0]),true);
 const again=new Campaign();again.load();assert.deepEqual(again.echoRunes,reload.echoRunes);assert.equal(again.pendingRuneChoices.length,0);
 m.set('second-me-campaign-v3',JSON.stringify({echoRunes:{guard:-1,power:2,call:'10'},pendingRuneChoices:['call','call','power']}));const bad=new Campaign();bad.load();assert.deepEqual(bad.echoRunes,{power:2});assert.deepEqual(bad.pendingRuneChoices,[]);
});
test('pending reward blocks continuing and retrying until chosen, even after returning to lobby',t=>{
 const g=setup(t);(g as any).handleVictory();const offer=[...g.campaign.pendingRuneChoices];assert.equal(offer.length,3);g.nextLevel();assert.equal(g.currentLevelIdx,0);g.restartLevel();assert.equal(g.screen,'lobby');assert.deepEqual(g.campaign.pendingRuneChoices,offer);assert.equal(g.chooseRune(offer[0]),true);g.selectLevel(1);assert.equal(g.currentLevelIdx,1);
});
test('runes cannot be consumed in level 1 or pause; buffs do not stack and reset on retry',t=>{
 const g=setup(t);g.campaign.echoRunes={guard:2,power:2};assert.equal(g.useEchoRune('guard'),false);g.currentLevelIdx=1;g.restartLevel();assert.equal(g.useEchoRune('guard'),true);assert.equal(g.campaign.echoRunes.guard,1);assert.equal(g.useEchoRune('guard'),false);g.screen='paused';assert.equal(g.useEchoRune('power'),false);g.restartLevel();assert.equal(g.activeEchoRunes.size,0);assert.equal(g.campaign.echoRunes.guard,1);
});
test('restoration requires an injured Echo; Calling caps at four total summons; Pursuit persists for existing and new Echoes',t=>{
 const g=setup(t);g.currentLevelIdx=1;g.restartLevel();g.enemies=[];g.campaign.echoRunes={call:2,restore:2,lure:1};assert.equal(g.useEchoRune('call'),false);assert.equal(g.useEchoRune('restore'),false);
 g.toggleRecording();g.toggleRecording();g.spawnEcho();assert.equal(g.useEchoRune('call'),true);assert.equal(g.campaign.echoRunes.call,1);assert.equal(g.useEchoRune('call'),false);
 g.echo!.stability=30;assert.equal(g.useEchoRune('restore'),true);assert.equal(g.echo!.stability,80);assert.equal(g.useEchoRune('lure'),true);assert.ok(g.activeEchoRunes.has('lure'));g.spawnEcho();assert.ok(g.activeEchoRunes.has('lure'));
});
test('Amplification increases only Echo replay damage against trail enemies',t=>{
 const g=setup(t);g.currentLevelIdx=1;g.restartLevel();g.currentLevel.walls=[];g.currentLevel.doors=[];g.player.x=340;g.player.y=110;g.campaign.echoRunes={power:1};
 g.toggleRecording();g.toggleRecording();g.spawnEcho();const enemy=g.enemies[0];g.echo!.x=enemy.x-100;g.echo!.y=enemy.y;
 const event={time:0,kind:'attack' as const,x:0,y:0,targetX:100,targetY:0};(g as any).replayEchoEvent(event);assert.equal(enemy.hp,20);g.useEchoRune('power');(g as any).replayEchoEvent(event);assert.equal(enemy.hp,7);
});

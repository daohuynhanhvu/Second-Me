import test,{type TestContext} from 'node:test';
import assert from 'node:assert/strict';
import {Campaign} from './campaign.ts';
import {ECHO_RUNES} from './echoRunes.ts';
import {GameEngine} from '../GameEngine.ts';
function storage(t:TestContext){const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),map=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>map.set(k,v)}});t.after(()=>old?Object.defineProperty(globalThis,'localStorage',old):Reflect.deleteProperty(globalThis,'localStorage'));return map;}
test('loadout holds five unique rune types, replaces or swaps slots without consuming stock',()=>{
 const c=new Campaign();c.echoRunes=Object.fromEntries(ECHO_RUNES.map(r=>[r.id,2]));
 for(let i=0;i<5;i++)assert.ok(c.setRuneSlot(i,ECHO_RUNES[i].id));
 assert.equal(c.runeLoadout.length,5);const stock={...c.echoRunes};assert.ok(c.setRuneSlot(0,'cleave'));assert.equal(c.runeLoadout[0],'cleave');assert.deepEqual(c.echoRunes,stock);
 const second=c.runeLoadout[1];assert.ok(c.setRuneSlot(1,'cleave'));assert.equal(c.runeLoadout[1],'cleave');assert.equal(c.runeLoadout[0],second);assert.equal(new Set(c.runeLoadout).size,5);
 assert.equal(c.setRuneSlot(5,'vamp'),false);assert.equal(c.setRuneSlot(-1,'vamp'),false);c.echoRunes.vamp=0;assert.equal(c.setRuneSlot(0,'vamp'),false);
});
test('old saves pick at most five owned runes; selected empty-stock slots and intentional empty sets survive reload',t=>{
 const m=storage(t);m.set('second-me-campaign-v3',JSON.stringify({echoRunes:Object.fromEntries(ECHO_RUNES.map(r=>[r.id,2]))}));const c=new Campaign();c.load();assert.deepEqual(c.runeLoadout,ECHO_RUNES.slice(0,5).map(r=>r.id));
 c.echoRunes.call=0;c.setRuneSlot(2,'cleave');c.save();const reload=new Campaign();reload.load();assert.deepEqual(reload.runeLoadout,c.runeLoadout);assert.equal(reload.runeLoadout[0],'call');
 while(c.runeLoadout.length)c.setRuneSlot(0,null);const empty=new Campaign();empty.load();assert.deepEqual(empty.runeLoadout,[]);
});
test('rewards fill unused slots, but never replace a full set or add duplicate rune types',()=>{
 const c=new Campaign();for(const id of ECHO_RUNES.slice(0,5).map(r=>r.id)){c.pendingRuneChoices=[id,'rapid','vamp'];c.chooseRune(id);}const before=[...c.runeLoadout];
 c.pendingRuneChoices=['cleave','anchor','execute'];c.chooseRune('cleave');assert.deepEqual(c.runeLoadout,before);assert.equal(c.echoRunes.cleave,1);c.setRuneSlot(0,null);c.pendingRuneChoices=['guard','rapid','vamp'];c.chooseRune('guard');assert.equal(c.runeLoadout.length,4);
 c.pendingRuneChoices=['rapid','anchor','vamp'];c.chooseRune('rapid');assert.equal(c.runeLoadout.length,5);c.reset();assert.deepEqual(c.runeLoadout,[]);
});
test('editing freezes combat and timers, leaves active buffs intact, then gameplay resumes',t=>{
 const old=Object.getOwnPropertyDescriptor(globalThis,'document');Object.defineProperty(globalThis,'document',{configurable:true,value:{body:{dataset:{}}}});t.after(()=>old?Object.defineProperty(globalThis,'document',old):Reflect.deleteProperty(globalThis,'document'));
 const g=new GameEngine();g.currentLevelIdx=1;g.restartLevel();g.tutorialEnabled=false;g.campaign.echoRunes.guard=2;g.activeEchoRunes.add('guard');const time=g.legTimeRemaining;
 g.setRuneEditing(true);(g as any).update(1);assert.equal(g.legTimeRemaining,time);assert.ok(g.setRuneSlot(0,'guard'));assert.ok(g.activeEchoRunes.has('guard'));assert.equal(g.campaign.echoRunes.guard,2);assert.equal(g.useEchoRune('guard'),false);
 g.setRuneEditing(false);(g as any).update(.1);assert.ok(g.legTimeRemaining!<time!);
});

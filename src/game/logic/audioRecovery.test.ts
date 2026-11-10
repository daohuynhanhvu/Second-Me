import test from 'node:test';
import assert from 'node:assert/strict';
import {sounds} from './sound.ts';
test('a failed audio download is retried instead of cached as permanent silence',async t=>{
 const originalGraph=sounds.graph,originalFetch=globalThis.fetch;let calls=0;
 sounds.graph=(()=>({ctx:{decodeAudioData:async()=>({duration:2})}})) as unknown as typeof sounds.graph;
 globalThis.fetch=(async()=>{calls++;return calls===1?new Response('',{status:503}):new Response(new Uint8Array([1,2,3]));}) as typeof fetch;
 t.after(()=>{sounds.graph=originalGraph;globalThis.fetch=originalFetch;});
 assert.equal(await sounds.loadBuffer('test-audio-recovery.mp3'),null);
 assert.ok(await sounds.loadBuffer('test-audio-recovery.mp3'));assert.equal(calls,2);
});
test('an interrupted mobile audio context is resumed',()=>{
 const engine=sounds as unknown as {ctx:{state:string;resume:()=>Promise<void>}|null},old=engine.ctx;let resumed=0;
 engine.ctx={state:'interrupted',resume:async()=>{resumed++;}};
 try{sounds.graph();assert.equal(resumed,1);}finally{engine.ctx=old;}
});

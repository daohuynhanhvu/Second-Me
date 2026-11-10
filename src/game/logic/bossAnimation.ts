import type {BossState} from './campaign.ts';
export interface BossPose {sheet:'original'|'cast';row:number;frame:number}
const clamp=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));
/** One timeline for the complete action; taking damage must not cancel an active cast. */
export function bossActionPose(b:Pick<BossState,'mode'|'attack'|'timer'|'warningDuration'|'strikeDuration'|'recoveryDuration'>):BossPose|null{
 if(!b.attack||b.mode==='stalking')return null;
 const recovery=b.recoveryDuration??1.8;
 const progress=clamp(1-b.timer/(b.warningDuration??1.15),0,1),age=Math.max(0,(b.strikeDuration??.3)-b.timer);
 if(b.attack==='melee')return {sheet:'original',row:2,frame:b.mode==='warning'?Math.min(5,Math.floor(progress*6)):b.mode==='strike'?6+Math.min(2,Math.floor(age/.1)):Math.min(13,9+Math.floor(Math.max(0,recovery-b.timer)/recovery*5))};
 const triple=b.attack==='triple';
 if(b.mode==='warning')return {sheet:'cast',row:triple?0:1,frame:Math.min(triple?4:5,Math.floor(progress*(triple?5:6)))};
 if(b.mode==='strike')return {sheet:'cast',row:triple?0:1,frame:triple?(age<.12?5:age<.3?6:7):(age<.2?5:age<.4?6:age<.65?7:8)};
 return {sheet:'cast',row:triple?0:1,frame:triple?Math.min(10,8+Math.floor(Math.max(0,recovery-b.timer)/recovery*3)):Math.min(15,9+Math.floor(Math.max(0,recovery-b.timer)/recovery*7))};
}

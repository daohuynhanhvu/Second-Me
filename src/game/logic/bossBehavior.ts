export const BOSS_BEHAVIOR={MELEE_COMBO:3,MISS_LIMIT:3,RAGE_CASTS:2,MELEE_REACH:115} as const;
export interface BossBehavior {meleeSwings?:number;meleeMisses?:number;skillQueue?:number;enraged?:boolean}
export function wantsBossSkill(b:BossBehavior){return (b.skillQueue??0)>0||(b.meleeSwings??0)>=BOSS_BEHAVIOR.MELEE_COMBO;}
export function chooseBossAttack(b:BossBehavior,distance:number,random:()=>number=Math.random):'melee'|'volley'|'triple'|null{
 if(!(b.skillQueue??0)&&(b.meleeSwings??0)>=BOSS_BEHAVIOR.MELEE_COMBO)b.skillQueue=1;
 if((b.skillQueue??0)>0){b.skillQueue=(b.skillQueue??0)-1;if(!b.skillQueue){b.meleeSwings=0;b.meleeMisses=0;}return random()<.5?'volley':'triple';}
 return distance<=BOSS_BEHAVIOR.MELEE_REACH?'melee':null;
}
export function recordBossSwing(b:BossBehavior,hitPlayer:boolean){
 b.meleeSwings=(b.meleeSwings??0)+1;b.meleeMisses=hitPlayer?0:(b.meleeMisses??0)+1;
 if(b.meleeMisses>=BOSS_BEHAVIOR.MISS_LIMIT){b.enraged=true;b.skillQueue=BOSS_BEHAVIOR.RAGE_CASTS;b.meleeSwings=0;b.meleeMisses=0;}
}

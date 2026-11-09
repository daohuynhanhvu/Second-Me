export const MAX_MP=100;
export const COMBO_MP=[0,6,9,16] as const;
export const skillManaCost=(hero:string)=>hero==='mage'?25:30;
export class ManaPool {
 value=MAX_MP;
 private delay=0;
 reset(){this.value=MAX_MP;this.delay=0;}
 spend(cost:number){if(cost<0||!Number.isFinite(cost)||this.value+1e-6<cost)return false;if(cost>0){this.value=Math.max(0,this.value-cost);this.delay=1.5;}return true;}
 update(dt:number){const elapsed=Math.max(0,dt),regenTime=Math.max(0,elapsed-this.delay);this.delay=Math.max(0,this.delay-elapsed);this.value=Math.min(MAX_MP,this.value+regenTime*8);}
}

import type {BossState} from '../logic/campaign.ts';
import {FROST_STRIKE,makeIceRays} from '../logic/iceMagic.ts';
let sprite:HTMLImageElement|undefined;
export function drawTripleFrost(ctx:CanvasRenderingContext2D,boss:BossState,reducedMotion:boolean){
 if(typeof Image!=='undefined'&&!sprite){sprite=new Image();sprite.src=`${import.meta.env?.BASE_URL??'/'}assets/effects/boss-triple-frost.png`;}
 const warning=boss.mode==='warning'&&boss.attack==='triple';
 const rays=warning?makeIceRays({x:boss.x,y:boss.y},Math.atan2(boss.targetY-boss.y,boss.targetX-boss.x)):boss.iceRays;
 if(!rays.length)return;
 const fade=warning?1:Math.min(1,Math.max(0,(rays[0].timer+FROST_STRIKE.FADE)/FROST_STRIKE.FADE));
 for(const ray of rays){
  ctx.save();ctx.translate(ray.x,ray.y);ctx.rotate(ray.angle);ctx.globalAlpha*=fade;
  ctx.fillStyle=warning?'#59d9ff30':'#5bbbd928';ctx.strokeStyle=warning?'#8beaff':'#c5f7ff';ctx.lineWidth=2;
  ctx.fillRect(0,-FROST_STRIKE.HALF_WIDTH,FROST_STRIKE.LENGTH,FROST_STRIKE.HALF_WIDTH*2);
  if(warning)ctx.strokeRect(0,-FROST_STRIKE.HALF_WIDTH,FROST_STRIKE.LENGTH,FROST_STRIKE.HALF_WIDTH*2);
  if(!warning&&(!sprite?.complete||!sprite.naturalWidth)){
   for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#dffaff':'#75cde9';ctx.beginPath();ctx.moveTo(i*25,-20);ctx.lineTo(i*25+30,0);ctx.lineTo(i*25,20);ctx.closePath();ctx.fill();}
  }
  ctx.restore();
 }
 if(!warning&&sprite?.complete&&sprite.naturalWidth){
  const center=rays[1];ctx.save();ctx.translate(center.x,center.y);ctx.rotate(center.angle+.64);ctx.globalAlpha*=fade;ctx.imageSmoothingEnabled=false;
  // The supplied three-pronged sprite fans out from this shared bottom-left origin.
  const grow=reducedMotion?1:Math.min(1,.7+(FROST_STRIKE.LIFE-center.timer)*3);
  ctx.scale(.25*grow,.25*grow);ctx.drawImage(sprite,-210,-935);ctx.restore();
 }
}

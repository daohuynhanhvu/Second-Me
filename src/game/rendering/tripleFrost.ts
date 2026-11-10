import type {BossState} from '../logic/campaign.ts';
import {FROST_STRIKE,makeIceRays} from '../logic/iceMagic.ts';
let sprite:HTMLImageElement|undefined;

/** Three frames adapted from the supplied growing / raised / bursting ice-spike references. */
export function drawTripleFrost(ctx:CanvasRenderingContext2D,boss:BossState,reducedMotion:boolean){
 if(typeof Image!=='undefined'&&!sprite){sprite=new Image();sprite.src=`${import.meta.env?.BASE_URL??'/'}assets/effects/boss-triple-frost-spikes.png`;}
 const warning=boss.mode==='warning'&&boss.attack==='triple';
 const rays=warning?makeIceRays({x:boss.x,y:boss.y},Math.atan2(boss.targetY-boss.y,boss.targetX-boss.x)):boss.iceRays;
 if(!rays.length)return;
 const center=rays[1],age=Math.max(0,FROST_STRIKE.LIFE-center.timer);
 const fade=warning?1:Math.min(1,Math.max(0,(center.timer+FROST_STRIKE.FADE)/FROST_STRIKE.FADE));
 for(const ray of rays){
  ctx.save();ctx.translate(ray.x,ray.y);ctx.rotate(ray.angle);ctx.globalAlpha*=fade;
  ctx.fillStyle=warning?'#59d9ff30':'#5bbbd914';ctx.strokeStyle='#8beaff';ctx.lineWidth=2;
  ctx.fillRect(0,-FROST_STRIKE.HALF_WIDTH,FROST_STRIKE.LENGTH,FROST_STRIKE.HALF_WIDTH*2);
  if(warning)ctx.strokeRect(0,-FROST_STRIKE.HALF_WIDTH,FROST_STRIKE.LENGTH,FROST_STRIKE.HALF_WIDTH*2);
  ctx.restore();
 }
 if(warning)return;
 if(sprite?.complete&&sprite.naturalWidth){
  // Keep the fully grown blue crystal teeth on screen for the entire damaging period.
  // The old sprite depicted only the final melted grooves, so could never show rising spikes.
  const frame=reducedMotion?1:age<.14?0:age<.34?2:1;
  const cell=sprite.naturalWidth/3,size=FROST_STRIKE.LENGTH/.82;
  const rootX=frame===0?.22:.18,rootY=frame===2?.80:.78;
  const rise=reducedMotion?1:Math.min(1,.72+age*2);
  const melt=center.timer<0?Math.max(.65,1+center.timer*.7):1;
  ctx.save();ctx.translate(center.x,center.y);ctx.rotate(center.angle+.8);ctx.globalAlpha*=fade;ctx.imageSmoothingEnabled=false;
  ctx.scale(rise*melt,rise*melt);
  ctx.drawImage(sprite,frame*cell,0,cell,sprite.naturalHeight,-size*rootX,-size*rootY,size,size);ctx.restore();
 }else{
  // Even before the sprite loads, show upright crystal teeth rather than flat scratches.
  const teeth=rays.flatMap(ray=>Array.from({length:8},(_,i)=>({x:ray.x+Math.cos(ray.angle)*(30+i*35),y:ray.y+Math.sin(ray.angle)*(30+i*35),height:32+i*3}))).sort((a,b)=>a.y-b.y);
  ctx.save();ctx.globalAlpha*=fade;
  for(const tooth of teeth){
   ctx.fillStyle='#3d9ed3';ctx.strokeStyle='#b9f5ff';ctx.lineWidth=1.5;
   ctx.beginPath();ctx.moveTo(tooth.x-10,tooth.y);ctx.lineTo(tooth.x+4,tooth.y-tooth.height);ctx.lineTo(tooth.x+12,tooth.y-4);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#e0fbff';ctx.beginPath();ctx.moveTo(tooth.x+4,tooth.y-tooth.height);ctx.lineTo(tooth.x+2,tooth.y-6);ctx.lineTo(tooth.x+12,tooth.y-4);ctx.closePath();ctx.fill();
  }
  ctx.restore();
 }
}

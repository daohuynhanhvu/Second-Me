import type {BossState} from '../logic/campaign.ts';
import {FROST_STRIKE,makeIceRays} from '../logic/iceMagic.ts';
let sprite:HTMLImageElement|undefined;
/** The pixelfx ice/ice-spikes sheet (tools/assets/source/pixelfx/ice-spikes.json): 91 cells of 264 x 112 in
 *  7 columns, 30 fps, 3 s, one-shot. The frost line starts at PIVOT (on the ground); the blades reach REACH px
 *  to its right, which is scaled to the ray's length. HOLD = a fully grown frame for reduced motion. */
export const ICE_SPIKES={W:264,H:112,COLUMNS:7,FRAMES:91,FPS:30,PIVOT_X:24,PIVOT_Y:96,REACH:226,HOLD:30} as const;

/** The Guardian's three frost rays: the warning lanes, then an ice-spikes eruption along each ray. */
export function drawTripleFrost(ctx:CanvasRenderingContext2D,boss:BossState,reducedMotion:boolean){
 if(typeof Image!=='undefined'&&!sprite){sprite=new Image();sprite.src=`${import.meta.env?.BASE_URL??'/'}assets/effects/ice-spikes.png`;}
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
  // Each ray plays the pixelfx ice-spikes sheet (public/assets/effects/ice-spikes.png, tools/assets/source/pixelfx):
  // a frost line runs out from the boss, jagged blades burst up behind it, glint, flash white and shatter.
  const s=ICE_SPIKES,frame=reducedMotion?s.HOLD:Math.min(s.FRAMES-1,Math.floor(age*s.FPS));
  const k=FROST_STRIKE.LENGTH/s.REACH,sx=(frame%s.COLUMNS)*s.W,sy=Math.floor(frame/s.COLUMNS)*s.H;
  ctx.save();ctx.imageSmoothingEnabled=false;
  for(const ray of rays){
   ctx.save();ctx.translate(ray.x,ray.y);ctx.rotate(ray.angle);
   if(Math.cos(ray.angle)<0)ctx.scale(1,-1);   // a ray to the left: keep the blades pointing up the screen
   ctx.scale(k,k);
   ctx.drawImage(sprite,sx,sy,s.W,s.H,-s.PIVOT_X,-s.PIVOT_Y,s.W,s.H);
   ctx.restore();
  }
  ctx.restore();
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

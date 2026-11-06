import type { Direction } from '../logic/types.ts';

const clips = new Map<string, HTMLImageElement>();
const sizes: Record<string, number> = { Idle: 6, Walk: 8, Attack01: 6 };

export function drawSoldierSprite(ctx:CanvasRenderingContext2D,x:number,y:number,direction:Direction,moving:boolean,echo:boolean,time:number,attacking=false) {
  if(typeof Image==='undefined')return;
  const clip=attacking?'Attack01':moving?'Walk':'Idle';
  let image=clips.get(clip);
  if(!image) { image=new Image();image.src=`${import.meta.env.BASE_URL}assets/soldier/Soldier_${clip}.png`;clips.set(clip,image); }
  if(!image.complete || !image.naturalWidth)return;
  const frame=Math.floor(time*(moving?12:attacking?18:7))%sizes[clip];
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  if(direction==='left')ctx.scale(-1,1);
  if(echo) {ctx.globalAlpha*=.7;ctx.filter='brightness(1.6) sepia(1) saturate(4) hue-rotate(135deg)';ctx.shadowColor='#22d3ee';ctx.shadowBlur=12;}
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,frame*100,0,100,100,-80,-95,160,160);
  ctx.restore();
}

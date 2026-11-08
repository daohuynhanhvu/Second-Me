import type { Rect } from './types.ts';
export interface Point {x:number;y:number}
/** First intersection on a swept segment; fast projectiles cannot skip their target. */
export function segmentCircle(a:Point,b:Point,c:Point,r:number):number|null {
  const dx=b.x-a.x,dy=b.y-a.y,fx=a.x-c.x,fy=a.y-c.y;
  if(fx*fx+fy*fy<=r*r)return 0;
  const aa=dx*dx+dy*dy;if(aa<1e-9)return null;
  const bb=2*(fx*dx+fy*dy),cc=fx*fx+fy*fy-r*r,disc=bb*bb-4*aa*cc;
  if(disc<0)return null;
  const t=(-bb-Math.sqrt(disc))/(2*aa);return t>=0&&t<=1?t:null;
}
export function segmentWall(a:Point,b:Point,wall:Rect,pad=4):number|null {
  let lo=0,hi=1;
  for(const [start,delta,min,max] of [[a.x,b.x-a.x,wall.x-pad,wall.x+wall.width+pad],[a.y,b.y-a.y,wall.y-pad,wall.y+wall.height+pad]]) {
    if(Math.abs(delta)<1e-9){if(start<min||start>max)return null;continue;}
    const first=(min-start)/delta,last=(max-start)/delta;
    lo=Math.max(lo,Math.min(first,last));hi=Math.min(hi,Math.max(first,last));if(lo>hi)return null;
  }
  return lo;
}

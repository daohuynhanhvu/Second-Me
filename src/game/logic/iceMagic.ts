export const ICE_MAGIC={RADIUS:82,WARNING:.6,IMPACT:.3,DAMAGE:40,COOLDOWN:6} as const;
export const FROST_STRIKE={LENGTH:300,HALF_WIDTH:22,SPREAD:.35,LIFE:2.3,FADE:.5,TICK:.75,DAMAGE:24,SLOW:.55,SLOW_TIME:1.2} as const;
export interface FrostZone {x:number;y:number;radius:number;timer:number;struck:boolean}
export interface IceRay {x:number;y:number;angle:number;timer:number;tick:number}
export function makeIceRays(at:{x:number;y:number},angle:number):IceRay[]{return [-1,0,1].map(i=>({...at,angle:angle+i*FROST_STRIKE.SPREAD,timer:FROST_STRIKE.LIFE,tick:0}));}
export function insideIceRay(ray:IceRay,p:{x:number;y:number},radius=12){
 const dx=p.x-ray.x,dy=p.y-ray.y,along=dx*Math.cos(ray.angle)+dy*Math.sin(ray.angle);
 return ray.timer>0&&along>=0&&along<=FROST_STRIKE.LENGTH&&Math.abs(-dx*Math.sin(ray.angle)+dy*Math.cos(ray.angle))<=FROST_STRIKE.HALF_WIDTH+radius;
}

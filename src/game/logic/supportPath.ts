import type {Rect} from './types.ts';
import {segmentWall} from './combatGeometry.ts';
type Point={x:number;y:number};
/** Short-lived route cache; recalculated when doors, destination or movement change. */
export function supportRoute(start:Point,end:Point,walls:Rect[]):Point[]{
 const blocked=walls.map(w=>({x:w.x-13,y:w.y-13,width:w.width+26,height:w.height+26}));
 const clear=(a:Point,b:Point)=>!blocked.some(w=>segmentWall(a,b,w,0)!==null);
 if(clear(start,end))return [end];
 const step=24,cols=54,rows=31;
 const points=Array.from({length:cols*rows},(_,i)=>({x:12+(i%cols)*step,y:12+Math.floor(i/cols)*step}));
 const valid=(p:Point)=>p.x>=24&&p.x<=1256&&p.y>=24&&p.y<=696&&!blocked.some(w=>p.x>=w.x&&p.x<=w.x+w.width&&p.y>=w.y&&p.y<=w.y+w.height);
 const candidates=points.map((p,i)=>({p,i})).filter(({p})=>valid(p)&&Math.hypot(p.x-start.x,p.y-start.y)<48&&clear(start,p)).sort((a,b)=>Math.hypot(a.p.x-start.x,a.p.y-start.y)-Math.hypot(b.p.x-start.x,b.p.y-start.y));
 if(!candidates.length)return [];
 const origin=candidates[0].i,queue=[origin],prev=new Map<number,number>([[origin,-1]]);let found=-1;
 for(let q=0;q<queue.length;q++){const i=queue[q],p=points[i];if(Math.hypot(p.x-end.x,p.y-end.y)<48&&clear(p,end)){found=i;break;}
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i%cols+dx,y=Math.floor(i/cols)+dy,j=y*cols+x;if(x<0||x>=cols||y<0||y>=rows||prev.has(j)||!valid(points[j])||!clear(p,points[j]))continue;prev.set(j,i);queue.push(j);}}
 if(found<0)return [];const path:Point[]=[end];for(let i=found;i!==-1;i=prev.get(i)!)path.push(points[i]);return path.reverse();
}

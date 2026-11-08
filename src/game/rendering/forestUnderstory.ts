import type { LevelData, Rect } from '../logic/types.ts';
import { livingImage } from './livingAssets.ts';

export interface Plant { index:number;x:number;y:number;size:number;flip:boolean;phase:number;animated:boolean }
const plans=new Map<number,Plant[]>();
let pixelSheet:HTMLCanvasElement|null=null;
const overlaps=(a:Rect,b:Rect,pad=0)=>a.x<b.x+b.width+pad&&a.x+a.width>b.x-pad&&a.y<b.y+b.height+pad&&a.y+a.height>b.y-pad;
export const understoryReady=()=>!!livingImage('understory-pixel.png');

/** Seeded plant communities share a focal log/shrub, with small companion plants around it. */
export function planUnderstory(level:LevelData,w:number,h:number,clear:Rect[]):Plant[] {
  let seed=level.id*917+31;
  const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const cold=level.id>=5,night=level.id===3,autumn=level.id===4;
  const main=cold?[12,13,15]:night?[8,4,1]:autumn?[10,4,1]:[0,1,4,7];
  const companions=cold?[14,14,13]:night?[9,2,8]:autumn?[11,5,6]:[2,3,5,6];
  const groups:{x:number;y:number;r:number}[]=[],plants:Plant[]=[];
  const allowed=(x:number,y:number,size:number)=>{
    const r={x:x-size*.43,y:y-size*.66,width:size*.86,height:size*.9};
    return r.x>=72&&r.y>=70&&r.x+r.width<=w-72&&r.y+r.height<=h-65
      &&!clear.some(c=>overlaps(r,c,12))&&!level.walls.some(c=>overlaps(r,c,8));
  };
  const push=(index:number,x:number,y:number,size:number,animated:boolean)=>{
    if(!allowed(x,y,size))return false;
    plants.push({index,x,y,size,flip:rand()>.5,phase:rand()*Math.PI*2,animated});return true;
  };
  for(let attempt=0;attempt<700&&groups.length<(level.id===6?8:14);attempt++) {
    let x:number,y:number;
    // Most communities grow in shelter beside walls; a few low patches occupy open pockets.
    if(attempt%3===0) {
      const wall=level.walls[Math.floor(rand()*level.walls.length)];
      const side=rand()>.5?1:-1;
      x=wall.x+(side>0?wall.width+50:-50)+rand()*20;
      y=wall.y+rand()*wall.height;
    } else if(attempt%3===1) {
      x=100+rand()*(w-200);y=rand()>.5?110+rand()*45:h-100-rand()*45;
    } else {x=115+rand()*(w-230);y=115+rand()*(h-230);}
    if(groups.some(c=>Math.hypot(x-c.x,y-c.y)<125))continue;
    const nearEdge=x<180||x>w-180||y<160||y>h-150;
    const index=main[Math.floor(rand()*main.length)];
    // Tall saplings stay near shelter. Open ground receives low logs or berry shrubs.
    const primary=(index===0||index===10||index===12)&&!nearEdge?(cold?15:4):index;
    const size=primary===0||primary===10||primary===12?100+rand()*20:72+rand()*23;
    if(!push(primary,x,y,size,false))continue;
    groups.push({x,y,r:size*.5});
    const count=3+Math.floor(rand()*4);
    for(let j=0;j<count;j++) {
      const angle=j*2.4+rand(),distance=22+rand()*33;
      const idx=companions[Math.floor(rand()*companions.length)];
      const small=idx===5||idx===9?25+rand()*12:36+rand()*18;
      push(idx,x+Math.cos(angle)*distance,y+Math.sin(angle)*distance*.65,small,(idx===2||idx===6||idx===11||idx===14)&&j%2===0);
    }
  }
  plants.sort((a,b)=>a.y-b.y);plans.set(level.id,plants);return plants;
}

function drawPlant(ctx:CanvasRenderingContext2D,plant:Plant,time:number) {
  const image=livingImage('understory-pixel.png');if(!image)return;
  if(!pixelSheet){
    pixelSheet=document.createElement('canvas');pixelSheet.width=pixelSheet.height=192;
    const p=pixelSheet.getContext('2d')!;p.imageSmoothingEnabled=false;p.drawImage(image,0,0,192,192);
  }
  const sheet=pixelSheet;
  const sw=sheet.width/4,sh=sheet.height/4;
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(plant.x),Math.round(plant.y));
  if(plant.flip)ctx.scale(-1,1);
  if(plant.animated)ctx.rotate(Math.sin(time*1.3+plant.phase)*.018);
  ctx.drawImage(sheet,plant.index%4*sw,Math.floor(plant.index/4)*sh,sw,sh,-plant.size/2,-plant.size/2,plant.size,plant.size);
  ctx.restore();
}
export function drawUnderstoryStatic(ctx:CanvasRenderingContext2D,plants:Plant[]) {
  for(const plant of plants)if(!plant.animated)drawPlant(ctx,plant,0);
}
export function drawUnderstoryMotion(ctx:CanvasRenderingContext2D,id:number,time:number) {
  for(const plant of plans.get(id)??[])if(plant.animated)drawPlant(ctx,plant,time);
}

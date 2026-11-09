import type {LevelData,Rect} from '../logic/types.ts';
export const romanRune=(index:number)=>['I','II','III','IV','V','VI'][index]??String(index+1);
export const overlaps=(a:Rect,b:Rect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
/** A compact strip beside each gate, kept clear of rune badges and the top HUD. */
export function gateLabelLayout(level:LevelData):Rect[]{
 const occupied:Rect[]=[{x:0,y:0,width:1280,height:105},{x:450,y:0,width:360,height:140},...level.plates.map(p=>({x:p.x-12,y:p.y-55,width:p.width+24,height:p.height+67}))];
 return level.doors.map(door=>{
  const width=door.requiredPlates.length*34+8,height=32,cx=door.x+door.width/2,cy=door.y+door.height/2;
  const candidates=[{x:cx-width/2,y:door.y-height-10},{x:cx-width/2,y:door.y+door.height+10},{x:door.x+door.width+10,y:cy-height/2},{x:door.x-width-10,y:cy-height/2}].map(p=>({...p,width,height}));
  const score=(r:Rect)=>occupied.filter(o=>overlaps(r,o)).length*1000+(r.x<44||r.x+r.width>1236||r.y<44||r.y+r.height>676?10000:0);
  const selected=candidates.reduce((best,r)=>score(r)<score(best)?r:best);occupied.push(selected);return selected;
 });
}

export function drawGateLabels(ctx:CanvasRenderingContext2D,level:LevelData){
 const labels=gateLabelLayout(level);
 level.doors.forEach((door,doorIndex)=>{
  const box=labels[doorIndex];
  ctx.save();ctx.font='24px "Second Me Pixel", monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#06150f';ctx.fillRect(box.x,box.y,box.width,box.height);
  ctx.strokeStyle='#ad986b';ctx.lineWidth=2;ctx.strokeRect(box.x,box.y,box.width,box.height);
  door.requiredPlates.forEach((id,i)=>{
   const index=level.plates.findIndex(p=>p.id===id),pressed=level.plates[index]?.isPressed,x=box.x+4+i*34;
   if(pressed){ctx.fillStyle='#28523b';ctx.fillRect(x,box.y+4,34,box.height-8);}
   if(i){ctx.strokeStyle='#6a7250';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,box.y+7);ctx.lineTo(x,box.y+box.height-7);ctx.stroke();}
   ctx.fillStyle=pressed?'#caffdf':'#fff0bd';ctx.fillText(romanRune(index),x+17,box.y+box.height/2+1);
  });ctx.restore();
 });
}

import type {BossState} from '../logic/campaign.ts';
const TAU=Math.PI*2;
/** Frost shell has a rear layer and a sparse front layer so the boss silhouette stays readable. */
export function drawGuardianShield(ctx:CanvasRenderingContext2D,boss:BossState,time:number,reduced:boolean,front:boolean){
 if(boss.hp<=0)return;
 const active=boss.pillars.filter(p=>p.hp>0).length;
 const breakLeft=boss.shieldBreak??0;
 if(!active&&!breakLeft)return;
 const t=reduced?0:time;
 ctx.save();ctx.translate(boss.x,boss.y-28);ctx.imageSmoothingEnabled=false;
 if(!active){
  if(front){const age=1-breakLeft;ctx.globalAlpha=breakLeft;
   for(let i=0;i<16;i++){const a=i*TAU/16,r=75+(reduced?15:age*85),x=Math.cos(a)*r,y=Math.sin(a)*r*1.12+age*18;ctx.save();ctx.translate(x,y);ctx.rotate(a+age);ctx.fillStyle=i%2?'#baf6ff':'#4cb9e0';ctx.beginPath();ctx.moveTo(-4,5);ctx.lineTo(0,-12);ctx.lineTo(5,3);ctx.closePath();ctx.fill();ctx.restore();}
  }ctx.restore();return;
 }
 const pulse=.5+.5*Math.sin(t*1.7),raise=boss.shieldRaise??0,rx=68+raise*7,ry=84+raise*9;
 if(!front){
  // A low frost aura under the feet and glass facets behind the character.
  ctx.save();ctx.translate(0,67);ctx.strokeStyle='#64cbe64d';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,65,16,0,0,TAU);ctx.stroke();
  ctx.strokeStyle='#b6f6ff66';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,57,12,0,0,TAU);ctx.stroke();
  for(let i=0;i<8;i++){const a=i*TAU/8+t*.12,x=Math.cos(a)*61,y=Math.sin(a)*14;ctx.fillStyle='#a8f4ff99';ctx.fillRect(x-2,y-2,4,4);}ctx.restore();
  ctx.beginPath();for(let i=0;i<12;i++){const a=-Math.PI/2+i*TAU/12,x=Math.cos(a)*rx,y=Math.sin(a)*ry;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fillStyle=`rgba(76,190,233,${.025+raise*.08})`;ctx.fill();
 }
 // Each obelisk powers one quarter of the crystalline rim; broken quarters go dark.
 for(let i=0;i<12;i++){
  const sector=Math.floor(i/3),powered=(boss.pillars[sector]?.hp??0)>0;
  const a=-Math.PI/2+i*TAU/12,b=a+TAU/12;
  if(!powered)continue;
  const x1=Math.cos(a)*rx,y1=Math.sin(a)*ry,x2=Math.cos(b)*rx,y2=Math.sin(b)*ry;
  ctx.strokeStyle=front?'#caf9ffb8':'#3ba4d666';ctx.lineWidth=front?1.4:7;
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  if(front){
   ctx.fillStyle=i%2?'#9beaff38':'#399bc633';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x2*.89,y2*.89);ctx.lineTo(x1*.89,y1*.89);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#53d2f088';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x1*.93,y1*.93);ctx.lineTo(x2*.93,y2*.93);ctx.stroke();
   if(i%3===0){ctx.save();ctx.translate(x1,y1);ctx.rotate(a+Math.PI/2);ctx.fillStyle='#298eb8';ctx.strokeStyle='#d0faff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-5,3);ctx.lineTo(0,-10);ctx.lineTo(5,3);ctx.lineTo(0,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#e2ffff';ctx.fillRect(-1,-5,2,6);ctx.restore();}
  }
 }
 if(front){
  // Slow highlights sweep the rim continuously; the interior remains clear over the face.
  ctx.strokeStyle=`rgba(225,255,255,${.35+pulse*.35})`;ctx.lineWidth=3;
  for(let i=0;i<2;i++){const a=t*.38+i*Math.PI;ctx.beginPath();ctx.ellipse(0,0,rx+2,ry+2,0,a,a+.34);ctx.stroke();}
  for(let i=0;i<6;i++){const a=t*.22+i*TAU/6,x=Math.cos(a)*(rx+7),y=Math.sin(a)*(ry+7);ctx.globalAlpha=.35+.3*Math.sin(t*2+i);ctx.fillStyle='#cefbff';ctx.fillRect(x-1,y-3,2,6);ctx.fillRect(x-3,y-1,6,2);}ctx.globalAlpha=1;
 }ctx.restore();
}

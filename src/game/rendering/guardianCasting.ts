/** Articulated cast poses built exclusively from pixels of the original idle frame. */
import type {BossState} from '../logic/campaign.ts';
let parts:HTMLCanvasElement[]|undefined;
const outlines=[[[67,53],[65,59],[60,62],[55,65],[56,70],[60,75],[66,79],[70,83],[77,82],[79,77],[75,73],[70,71],[67,68],[69,64],[72,61]],[[120,42],[129,44],[132,53],[134,60],[133,69],[132,78],[127,86],[122,91],[115,88],[113,83],[117,78],[120,72],[122,67],[120,61],[116,57]]];
function layers(sheet:HTMLImageElement){
 if(parts)return parts;
 const all=Array.from({length:5},()=>{const c=document.createElement('canvas');c.width=192;c.height=128;return c;});
 all[0].getContext('2d')!.drawImage(sheet,0,0,192,128,0,0,192,128);
 outlines.forEach((points,i)=>{
  const arm=all[i+1].getContext('2d')!,body=all[0].getContext('2d')!;
  for(const c of [arm,body]){c.save();c.beginPath();points.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();if(c===body)c.clearRect(0,0,192,128);else c.drawImage(sheet,0,0,192,128,0,0,192,128);c.restore();}
 });
 // Restore the thigh hidden behind the original resting fist from the matching original leg.
 const body=all[0].getContext('2d')!;body.save();body.globalCompositeOperation='destination-over';body.translate(203,0);body.scale(-1,1);body.drawImage(sheet,78,76,19,18,78,76,19,18);body.restore();
 const raised=[[[70,40],[61,33],[51,33],[50,45],[56,58],[65,64],[78,62],[75,53]],[[122,42],[135,39],[140,35],[152,35],[155,45],[151,57],[142,64],[130,61]]];
 raised.forEach((poly,i)=>{const c=all[i+3].getContext('2d')!;c.save();c.beginPath();poly.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();c.drawImage(sheet,768,512,192,128,0,0,192,128);c.restore();});
 return parts=all;
}
export function drawGuardianCast(ctx:CanvasRenderingContext2D,sheet:HTMLImageElement,boss:BossState){
 const p=layers(sheet),volley=boss.attack==='volley';
 const wind=boss.mode==='warning',duration=boss.warningDuration??1.15;
 const progress=wind?Math.max(0,Math.min(1,1-boss.timer/duration)):1;
 const elapsed=wind?0:Math.max(0,(boss.strikeDuration??1)-boss.timer);
 let angle:number,crouch=0;
 if(volley){angle=wind?-1.15*Math.min(1,progress*2):2.45*Math.min(1,elapsed/.2);if(!wind&&elapsed>1.5)angle*=Math.max(0,1-(elapsed-1.5)/.7);crouch=wind?progress*3:0;}
 else{angle=wind?(progress<.85?2.45*Math.min(1,progress*1.4):2.45*(1-progress)/.15):0;crouch=wind?-progress*2:Math.max(0,1-elapsed/.6)*9;}
 ctx.save();ctx.translate(-149,-121+crouch);ctx.scale(298/192,199/128);ctx.drawImage(p[0],0,0);
 for(let i=0;i<2;i++){const x=i?123:67,y=i?51:57;ctx.save();ctx.translate(x,y);if(angle>1.5){ctx.rotate(i?-.4:.4);ctx.drawImage(p[i+3],-(i?130:70),-55);}else{ctx.rotate(i?-angle:angle);ctx.drawImage(p[i+1],-x,-y);}ctx.restore();}
 ctx.restore();
}

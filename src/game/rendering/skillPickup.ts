import type {CombatSkill} from '../GameEngine.ts';
import {SKILL_PICKUPS} from '../logic/skillPickups.ts';
export function drawSkillPickup(ctx:CanvasRenderingContext2D,drop:{kind:CombatSkill;x:number;y:number;fall:number},time:number,vi:boolean,near:boolean,reduced:boolean){
 const info=SKILL_PICKUPS[drop.kind],bob=reduced?0:Math.round(Math.sin(time*3)*2),x=Math.round(drop.x),y=Math.round(drop.y-8+bob);
 ctx.save();ctx.globalAlpha*=Math.min(1,drop.fall*2);ctx.translate(x,y);
 ctx.strokeStyle=info.color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,17,24,8,0,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#061b29';ctx.fillRect(-19,-26,38,38);ctx.strokeRect(-19,-26,38,38);
 ctx.fillStyle=info.color;info.icon.forEach((row,dy)=>[...row].forEach((bit,dx)=>{if(bit==='1')ctx.fillRect(-14+dx*4,-21+dy*4,4,4);}));
 if(!near){ctx.restore();return;}
 if(y>550)ctx.translate(0,-70);
 const name=vi?info.vi:info.en;
 ctx.font='20px "Second Me Pixel", monospace';ctx.textAlign='center';ctx.textBaseline='middle';
 const width=Math.max(116,Math.ceil(ctx.measureText(name).width)+18),labelX=Math.max(44-x,Math.min(-width/2,1236-x-width));
 ctx.fillStyle='#04131f';ctx.fillRect(labelX,29,width,26);ctx.strokeStyle=info.color;ctx.strokeRect(labelX,29,width,26);ctx.fillStyle=info.color;ctx.fillText(name,labelX+width/2,42);

 ctx.restore();
}

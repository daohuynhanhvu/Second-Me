/** A crystalline core, refracted facets and a continuous frost wake, aligned with velocity. */
export function drawIceProjectile(ctx:CanvasRenderingContext2D,shot:{x:number;y:number;vx:number;vy:number;life?:number},time:number,reducedMotion:boolean){
 ctx.save();ctx.translate(shot.x,shot.y);const angle=Math.atan2(shot.vy,shot.vx);ctx.rotate(angle);ctx.imageSmoothingEnabled=false;
 const t=reducedMotion?0:time,seed=angle*2.71,fade=Math.min(1,(shot.life??1)/.18);
 ctx.globalAlpha=.12*fade;ctx.fillStyle='#6be8ff';
 ctx.beginPath();ctx.moveTo(22,0);ctx.lineTo(-4,-12);ctx.lineTo(-20,0);ctx.lineTo(-4,12);ctx.closePath();ctx.fill();
 // Layered wake: widths stay constant so motion never jumps or changes the hit silhouette.
 ctx.globalAlpha=.16*fade;ctx.fillStyle='#61d0f2';ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(-48,-2);ctx.lineTo(-54,0);ctx.lineTo(-48,2);ctx.lineTo(0,5);ctx.closePath();ctx.fill();
 ctx.globalAlpha=.48*fade;ctx.fillStyle='#a1edff';ctx.beginPath();ctx.moveTo(1,-2);ctx.lineTo(-39,0);ctx.lineTo(1,2);ctx.closePath();ctx.fill();
 for(let i=0;i<4;i++){
  const progress=reducedMotion?(i+1)/5:((t*1.3+i*.25+seed)%1+1)%1;
  ctx.globalAlpha=(1-progress)*.6*fade;ctx.fillStyle=i%2?'#b7f8ff':'#62ccf3';
  const x=-12-progress*36,y=(i%2?1:-1)*(4+progress*6);
  ctx.fillRect(x,y,2,2);
 }
 ctx.globalAlpha=fade;ctx.strokeStyle='#235478';ctx.lineWidth=1.5;ctx.fillStyle='#258ac5';
 ctx.beginPath();ctx.moveTo(19,0);ctx.lineTo(4,-6);ctx.lineTo(-4,-9);ctx.lineTo(-14,-5);ctx.lineTo(-10,0);ctx.lineTo(-14,5);ctx.lineTo(-4,9);ctx.lineTo(4,6);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#74e2fa';ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-4,-7);ctx.lineTo(-10,-3);ctx.lineTo(-3,1);ctx.closePath();ctx.fill();
 ctx.fillStyle='#d8fbff';ctx.beginPath();ctx.moveTo(19,0);ctx.lineTo(-3,-2);ctx.lineTo(-10,0);ctx.lineTo(-3,2);ctx.closePath();ctx.fill();
 ctx.fillStyle='#45b7e6';ctx.beginPath();ctx.moveTo(17,1);ctx.lineTo(-4,7);ctx.lineTo(-9,4);ctx.lineTo(-2,2);ctx.closePath();ctx.fill();
 ctx.globalAlpha=(reducedMotion?.65:.65+.25*Math.sin(t*5+seed))*fade;ctx.strokeStyle='#f1ffff';ctx.lineWidth=1;
 ctx.beginPath();ctx.moveTo(13,-1);ctx.lineTo(-4,-5);ctx.lineTo(-8,-3);ctx.stroke();
 ctx.restore();
}

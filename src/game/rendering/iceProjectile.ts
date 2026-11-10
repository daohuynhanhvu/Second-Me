/** Faceted pixel ice missile: the bright point follows velocity, the frost trail stays behind. */
export function drawIceProjectile(ctx:CanvasRenderingContext2D,shot:{x:number;y:number;vx:number;vy:number},time:number,reducedMotion:boolean){
 ctx.save();ctx.translate(Math.round(shot.x),Math.round(shot.y));ctx.rotate(Math.atan2(shot.vy,shot.vx));ctx.imageSmoothingEnabled=false;
 const phase=reducedMotion?0:Math.floor(time*12+shot.x*.03+shot.y*.03)%3;
 // Stepped cyan wake and detached crystal fragments, all behind the damage center.
 ctx.globalAlpha=.38;ctx.fillStyle='#71dff5';ctx.fillRect(-28-phase*3,-2,22,4);ctx.fillRect(-21,-4,12,2);ctx.fillRect(-21,2,12,2);
 ctx.globalAlpha=.8;ctx.fillStyle='#baf8ff';ctx.fillRect(-25-phase*3,-6,3,2);ctx.fillRect(-30+phase*2,4,2,2);ctx.fillRect(-16,-8,2,2);
 ctx.globalAlpha=1;ctx.strokeStyle='#245985';ctx.lineWidth=2;ctx.fillStyle='#399bcf';
 ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(3,-5);ctx.lineTo(-4,-8);ctx.lineTo(-12,-5);ctx.lineTo(-8,0);ctx.lineTo(-12,5);ctx.lineTo(-4,8);ctx.lineTo(3,5);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#8aeeff';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-4,-6);ctx.lineTo(-8,-2);ctx.lineTo(-2,1);ctx.closePath();ctx.fill();
 ctx.fillStyle='#e9ffff';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-3,-2);ctx.lineTo(-8,0);ctx.lineTo(-2,2);ctx.closePath();ctx.fill();
 ctx.fillStyle='#55c3ed';ctx.beginPath();ctx.moveTo(13,1);ctx.lineTo(-3,6);ctx.lineTo(-7,3);ctx.lineTo(-1,2);ctx.closePath();ctx.fill();
 ctx.restore();
}

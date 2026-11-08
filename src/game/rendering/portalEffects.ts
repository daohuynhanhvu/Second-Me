// Foreground effects deliberately render after the actors, so the summoning beam is visible.
export function drawPortalEnergy(ctx: CanvasRenderingContext2D, x: number, y: number, time: number,
  strength = 1, reduced = false, opening = false) {
  if (strength <= 0) return;
  const t = reduced ? 0 : time;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  ctx.globalCompositeOperation='screen';
  ctx.globalAlpha=Math.min(1,strength);
  const beam=ctx.createLinearGradient(0,-135,0,18);
  beam.addColorStop(0,'#83efff00');beam.addColorStop(.5,'#6bd9ed44');beam.addColorStop(1,'#b9fff6aa');
  ctx.fillStyle=beam;ctx.fillRect(-25,-135,50,150);
  ctx.strokeStyle='#b8fff4';ctx.lineWidth=2;
  for(let ring=0;ring<3;ring++) {
    const r=28+ring*12+(opening&&!reduced?Math.min(time,1)*18:0);
    ctx.beginPath();ctx.ellipse(0,8,r,r*.38,0,t*(ring%2?-1:1),t*(ring%2?-1:1)+Math.PI*1.65);ctx.stroke();
  }
  for(let i=0;i<20;i++) {
    const phase=(t*.7+i/20)%1,angle=i*2.4+t*1.7;
    const radius=28*(1-phase)+7;
    ctx.globalAlpha=strength*(.35+.65*(1-phase));
    ctx.fillStyle=i%3?'#bafff1':'#fff0b9';
    const size=i%4===0?4:2;
    ctx.fillRect(Math.round(Math.cos(angle)*radius),Math.round(-phase*115+Math.sin(angle)*10),size,size);
  }
  ctx.restore();
}

let pixels: HTMLCanvasElement | null = null;
/** One consistent two-screen-pixel grid across old art, new art, characters and VFX. */
export function finishPixelFrame(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  pixels??=document.createElement('canvas');
  const w=Math.ceil(canvas.width/2),h=Math.ceil(canvas.height/2);
  if(pixels.width!==w||pixels.height!==h){pixels.width=w;pixels.height=h;}
  const low=pixels.getContext('2d')!;low.imageSmoothingEnabled=false;
  low.clearRect(0,0,w,h);low.drawImage(canvas,0,0,w,h);
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(pixels,0,0,canvas.width,canvas.height);ctx.restore();
  canvas.style.imageRendering='pixelated';
}

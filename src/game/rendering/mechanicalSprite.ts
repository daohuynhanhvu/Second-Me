import type { Direction } from '../logic/types.ts';

// Original user-supplied sheet; white is its background key, not part of the silhouette.
let sheet: HTMLCanvasElement | null = null;
let pending: Promise<void> | undefined;
export function loadMechanicalSprite() {
  if (typeof Image === 'undefined') return Promise.resolve();
  return pending ??= new Promise<void>(resolve => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image,0,0);
      const data = ctx.getImageData(0,0,canvas.width,canvas.height);
      for(let i=0;i<data.data.length;i+=4) {
        if(data.data[i]>245 && data.data[i+1]>245 && data.data[i+2]>245) data.data[i+3]=0;
      }
      ctx.putImageData(data,0,0); sheet=canvas; resolve();
    };
    image.onerror = () => resolve();
    image.src = `${import.meta.env.BASE_URL}assets/mechanical/rivet-sheet.png`;
  });
}
export function drawMechanicalSprite(ctx:CanvasRenderingContext2D,x:number,y:number,direction:Direction,moving:boolean,echo:boolean,time:number,attacking=false) {
  void loadMechanicalSprite();
  ctx.save(); ctx.globalAlpha=echo?.5:1; ctx.imageSmoothingEnabled=false;
  const sx=direction==='up'?70:direction==='left'?218:direction==='right'?290:0;
  const bob=moving?Math.sin(time*14)*1.5:0;
  if(sheet) {
    ctx.drawImage(sheet,sx,4,46,58,x-21,y-43+bob,42,52);
    if(attacking) {
      ctx.translate(x,y-13);if(direction==='left')ctx.scale(-1,1);
      ctx.drawImage(sheet,480,18,55,25,4,-5,30,14);
    }
  }
  else {ctx.fillStyle='#7b8992';ctx.fillRect(x-12,y-30,24,36);ctx.fillStyle='#ff9c42';ctx.fillRect(x-9,y-25,18,5);}
  ctx.restore();
}

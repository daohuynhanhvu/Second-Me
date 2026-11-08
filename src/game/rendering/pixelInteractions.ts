import { livingImage } from './livingAssets.ts';
export function drawPixelInteraction(ctx: CanvasRenderingContext2D, cell: number, x:number,y:number,w:number,h:number,open=0) {
  const image=livingImage('interactions-pixel.png');if(!image)return false;
  const sw=image.width/2,sh=image.height/2,sx=cell%2*sw,sy=Math.floor(cell/2)*sh;
  ctx.save();ctx.imageSmoothingEnabled=false;
  const piece=(a:number,b:number,c:number,d:number,dy=0)=>ctx.drawImage(image,sx+a*sw,sy+b*sh,c*sw,d*sh,x+a*w,y+b*h+dy,c*w,d*h);
  if(cell!==2||open<=0)piece(0,0,1,1);
  else {
    piece(0,0,.28,1);piece(.72,0,.28,1);piece(.28,0,.44,.22);piece(.28,.9,.44,.1);
    ctx.beginPath();ctx.rect(x+w*.28,y+h*.22,w*.44,h*.68);ctx.clip();
    piece(.28,.22,.44,.68,-open*h*.68);
  }
  ctx.restore();return true;
}

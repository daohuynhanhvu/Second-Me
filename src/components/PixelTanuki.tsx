import {useEffect,useRef} from 'react';

/** The booth always uses frame zero. Only the transparent character layer animates. */
export function PixelTanuki({frame}:{frame:number}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const images=useRef<HTMLImageElement[]>([]);
  useEffect(()=>{
    if(!images.current.length)images.current=[new Image(),new Image()];
    const [booth,actor]=images.current;
    const draw=()=>{
      const ctx=canvas.current?.getContext('2d');if(!ctx||!booth.complete||!booth.naturalWidth||!actor.complete||!actor.naturalWidth)return;
      ctx.clearRect(0,0,176,176);ctx.imageSmoothingEnabled=false;
      ctx.drawImage(booth,0,0,booth.naturalWidth/9,booth.naturalHeight/5,0,0,176,176);
      // Remove the old mascot inside the opening, preserving every wooden edge.
      ctx.fillStyle='#17100e';ctx.fillRect(52,57,70,59);
      const pose=frame<12?0:frame<17?1:2+Math.floor((frame-17)/4)%6;
      const w=actor.naturalWidth/4,h=actor.naturalHeight/2;
      ctx.save();ctx.beginPath();ctx.rect(49,52,76,64);ctx.clip();
      ctx.drawImage(actor,(pose%4)*w,Math.floor(pose/4)*h,w,h,45,35,95,95);ctx.restore();
      // Counter top and the goods sit in front of the mascot, never move.
      ctx.drawImage(booth,0,116,176,60,0,116,176,60);
      ctx.drawImage(booth,120,98,25,18,120,98,25,18);
    };
    for(const image of images.current)image.onload=draw;
    if(!booth.src)booth.src=`${import.meta.env.BASE_URL}assets/ui/tanuki-greeting.png`;
    if(!actor.src)actor.src=`${import.meta.env.BASE_URL}assets/ui/tanuki-character.png`;
    draw();return()=>{for(const image of images.current)image.onload=null;};
  },[frame]);
  return <canvas ref={canvas} width={176} height={176} className="tanuki-turn-sprite" style={{imageRendering:'pixelated'}} aria-hidden="true"/>;
}

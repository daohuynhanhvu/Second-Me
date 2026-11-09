import {useEffect,useRef} from 'react';

/** Render the atlas at its intended game-pixel resolution before scaling it up. */
export function PixelTanuki({frame}:{frame:number}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const image=useRef<HTMLImageElement|null>(null);
  useEffect(()=>{
    const texture=image.current??new Image();image.current=texture;
    const draw=()=>{
      const ctx=canvas.current?.getContext('2d');if(!ctx||!texture.complete||!texture.naturalWidth)return;
      const w=texture.naturalWidth/9,h=texture.naturalHeight/5;
      ctx.clearRect(0,0,88,88);ctx.imageSmoothingEnabled=false;
      ctx.drawImage(texture,(frame%9)*w,Math.floor(frame/9)*h,w,h,0,0,88,88);
    };
    texture.onload=draw;
    if(!texture.src)texture.src=`${import.meta.env.BASE_URL}assets/ui/tanuki-pixel-greeting.png`;
    draw();return()=>{texture.onload=null;};
  },[frame]);
  return <canvas ref={canvas} width={88} height={88} className="tanuki-turn-sprite" style={{imageRendering:'pixelated'}} aria-hidden="true"/>;
}

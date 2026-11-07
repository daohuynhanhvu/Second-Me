import React, { useEffect, useRef } from 'react';
import { loadMechanicalSprite, drawMechanicalSprite } from '../game/rendering/mechanicalSprite.ts';
export function MechanicalPortrait() {
  const canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{let mounted=true; void loadMechanicalSprite().then(()=>{
    if(!mounted || !canvas.current)return;
    const ctx=canvas.current.getContext('2d')!;ctx.clearRect(0,0,96,144);ctx.scale(2,2);
    drawMechanicalSprite(ctx,24,62,'down',false,false,0);
  });return ()=>{mounted=false;};},[]);
  return <canvas ref={canvas} width={96} height={144} className="mechanical-portrait" role="img" aria-label="Rivet-07"/>;
}

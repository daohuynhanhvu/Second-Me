import {useEffect, useState} from 'react';

export type ChestTier = 'gold'|'fire'|'aurora';

/** Original uploaded 160px frames; no generated or repainted artwork. */
export function ChestSprite({tier=null, reducedMotion=false}: {tier?:ChestTier|null; reducedMotion?:boolean}) {
  const [age, setAge] = useState(0);
  useEffect(()=>{
    setAge(0);
    if(!tier || reducedMotion)return;
    const started=performance.now();
    const timer=window.setInterval(()=>setAge((performance.now()-started)/1000),50);
    return ()=>window.clearInterval(timer);
  },[tier,reducedMotion]);
  const opening=!!tier && age<.8 && !reducedMotion;
  const count=opening?8:12;
  const frame=opening?Math.min(7,Math.floor(age*10)):reducedMotion?0:Math.floor(Math.max(0,age-.8)*8)%12;
  const file=tier?`chest_${tier}_${opening?'opening':'open_loop'}.png`:'chest_open_empty.png';
  return <span aria-hidden="true" className="reward-chest-sprite" style={{display:'block',width:'100%',aspectRatio:'1',imageRendering:'pixelated',backgroundImage:`url(${import.meta.env.BASE_URL}assets/chest/${file})`,backgroundRepeat:'no-repeat',backgroundSize:tier?`${count*100}% 100%`:'100% 100%',backgroundPosition:tier?`${frame*100/(count-1)}% 0`:'0 0'}}/>;
}

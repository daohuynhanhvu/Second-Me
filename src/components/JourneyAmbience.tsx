import { useEffect, useId, useRef, type CSSProperties } from 'react';
import { PFX, drawPfx, type PfxName, type PfxSheet } from '../game/rendering/pixelfx.ts';

/** A looping pixelfx on a canvas the size of its sheet, its pivot at (pivot.x, pivot.y). Nothing until the sheet is cut. */
export function FxCanvas({name,still,className,style}:{name:string;still?:boolean;className?:string;style?:CSSProperties}){
 const ref=useRef<HTMLCanvasElement>(null),s=(PFX as Record<string,PfxSheet|undefined>)[name];
 useEffect(()=>{
  const c=ref.current,ctx=c?.getContext('2d');if(!c||!ctx||!s)return;
  const t0=performance.now(),draw=()=>{ctx.clearRect(0,0,s.w,s.h);drawPfx(ctx,name as PfxName,still?0:(performance.now()-t0)/1000,s.pivot[0],s.pivot[1]);};
  draw();if(still)return;
  const id=setInterval(draw,1000/s.fps);return ()=>clearInterval(id);
 },[name,s,still]);
 return s?<canvas ref={ref} className={className} width={s.w} height={s.h} style={style}/>:null;
}
/** The same, placed on the painted map at native 1536x1024 coordinates with its pivot on (x, y). */
function MapFx({name,x,y,still}:{name:string;x:number;y:number;still?:boolean}){
 const s=(PFX as Record<string,PfxSheet|undefined>)[name];
 return s?<FxCanvas name={name} still={still} className="map-fx" style={{left:`${(x-s.pivot[0])/15.36}%`,top:`${(y-s.pivot[1])/10.24}%`,width:`${s.w/15.36}%`}}/>:null;
}

const at = (x:number,y:number,delay:number,duration=4):CSSProperties => ({
  left:`${x/1536*100}%`,top:`${y/1024*100}%`,animationDelay:`${-delay}s`,animationDuration:`${duration}s`,
});
const lanterns=[[253,627],[375,488],[530,479],[766,497],[780,347],[1046,427],[1349,303],[1156,830]];
const water=[[1494,623],[1460,677],[1389,712],[1299,733],[1245,766],[1190,815],[1042,810],[1017,870],[944,919],[865,938],[804,987]];

/** A fixed number of compositor-animated details, anchored to the painted scenery. */
export function JourneyAmbience({still}:{still?:boolean}){
 const waterId=`river-${useId().replace(/:/g,'')}`;
 const upper='M1494 642 C1498 669 1467 685 1436 701 S1381 717 1347 725 S1309 744 1274 752 S1259 787 1228 800 L1186 814';
 const lower='M1083 809 C1056 788 1027 803 1022 826 S1022 861 994 881 S952 914 917 923 S862 935 837 952 S804 984 795 1024';
 return <div className="journey-ambience" aria-hidden="true">
   <svg className="map-river-svg" viewBox="0 0 1536 1024" focusable="false">
     <defs><clipPath id={waterId}>
       <path d={upper} fill="none" stroke="white" strokeWidth="23"/>
       <path d={lower} fill="none" stroke="white" strokeWidth="23"/>
       <path d="M1482 601 L1511 600 L1505 653 L1475 655 Z"/>
     </clipPath></defs>
     <g clipPath={`url(#${waterId})`}>
       {[upper,lower].map((d,i)=><g key={i}>
         <path d={d} className="river-flow river-flow-wide"/>
         <path d={d} className="river-flow river-flow-fine" transform="translate(0 6)"/>
         <path d={d} className="river-flow river-flow-fine river-flow-shadow" transform="translate(0 -6)"/>
       </g>)}
       {Array.from({length:7},(_,i)=><path key={i} d={`M${1482+i*4} 599 l-2 17 l-2 12 l-1 25`} className="river-cascade" style={{animationDelay:`${-i*.17}s`}}/>)}
       {[[1491,652],[1435,702],[1325,735],[1235,799],[1046,815],[989,887],[912,928],[835,961]].map(([x,y],i)=><ellipse key={i} cx={x} cy={y} rx="9" ry="3" className="river-ripple" style={{transformOrigin:`${x}px ${y}px`,animationDelay:`${-i*.37}s`}}/>)}
     </g>
     <g className="river-spray">
       {Array.from({length:6},(_,i)=><rect key={i} x={1481+i*5} y={650+i%3*2} width="2" height="2" style={{animationDelay:`${-i*.19}s`}}/>)}
     </g>
   </svg>
   {lanterns.map(([x,y],i)=><i key={`lamp-${i}`} className="map-lantern" style={at(x,y,i*.71,2.7+i%3*.4)}/>)}
   {Array.from({length:24},(_,i)=>{
     const area=i%3,x=area===0?325+(i*53)%230:area===1?590+(i*73)%290:995+(i*47)%240;
     const y=area===0?270+(i*43)%190:area===1?550+(i*29)%160:670+(i*31)%140;
     return <i key={`fly-${i}`} className={`map-firefly fly-${i%3}`} style={at(x,y,i*.89,4.8+i%5)}/>;
   })}
   {water.map(([x,y],i)=><i key={`water-${i}`} className="map-water" style={at(x,y,i*.57,3.4+i%3*.3)}/>)}
   {Array.from({length:18},(_,i)=><i key={`snow-${i}`} className="map-snow" style={at(1255+(i*43)%250,55+(i*37)%235,i*.71,5+i%4)}/>)}
   {Array.from({length:7},(_,i)=><i key={`ember-${i}`} className="map-ember" style={at(207+(i*7)%22,708+(i%3)*3,i*.47,2.7+i%3*.3)}/>)}
   {Array.from({length:7},(_,i)=><i key={`leaf-${i}`} className="map-leaf" style={at(820+(i*43)%255,190+(i*31)%180,i*1.13,7+i%3)}/>)}
   <i className="map-portal-breath" style={at(1367,130,0,4)}/>
   <MapFx name="portal" x={1367} y={150} still={still}/>
   <i className="map-cloud map-cloud-one"/><i className="map-cloud map-cloud-two"/><i className="map-cloud map-cloud-three"/>
   <i className="map-mist map-mist-one"/><i className="map-mist map-mist-two"/>
 </div>;
}

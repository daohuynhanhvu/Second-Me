/** Require landscape on phones and tablets, without locking narrow desktop windows. */
export function needsLandscape(width:number,height:number,touch:boolean){
 return touch&&width>0&&height>width;
}
export function readLandscapeRequirement(){
 if(typeof window==='undefined')return false;
 const touch=window.matchMedia('(pointer: coarse)').matches||window.matchMedia('(any-pointer: coarse)').matches||(navigator.maxTouchPoints>0&&Math.max(window.innerWidth,window.innerHeight)<=1366);
 return needsLandscape(window.innerWidth,window.innerHeight,touch);
}

/** Require landscape on phones and tablets, without locking narrow desktop windows. */
export function needsLandscape(width:number,height:number,touch:boolean){
 return touch&&width>0&&height>width;
}
/** Phones and tablets (also used to show the on-screen touch controls). */
export function isTouchDevice(){
 if(typeof window==='undefined')return false;
 return window.matchMedia('(pointer: coarse)').matches||window.matchMedia('(any-pointer: coarse)').matches||(navigator.maxTouchPoints>0&&Math.max(window.innerWidth,window.innerHeight)<=1366);
}
export function readLandscapeRequirement(){
 if(typeof window==='undefined')return false;
 return needsLandscape(window.innerWidth,window.innerHeight,isTouchDevice());
}

export type OutfitHero='mage'|'swordsman';
export type OutfitId='default'|'frost'|'woodland'|'ember';
export const OUTFITS=[
 {id:'default',vi:'Nguyên bản',en:'Original',color:'#e2c585'},
 {id:'frost',vi:'Băng giá',en:'Frostbound',color:'#8cdef1'},
 {id:'woodland',vi:'Rừng xanh',en:'Woodland',color:'#9bd18a'},
 {id:'ember',vi:'Than hồng',en:'Ember',color:'#edaa7e'},
] as const;
export const OUTFIT_KEY='second-me-outfits-v1';
export function cleanOutfits(value:unknown):Record<OutfitHero,OutfitId>{
 const raw=value&&typeof value==='object'?value as Record<string,unknown>:{};
 const valid=(id:unknown):OutfitId=>OUTFITS.some(o=>o.id===id)?id as OutfitId:'default';
 return{mage:valid(raw.mage),swordsman:valid(raw.swordsman)};
}
let equipped:Record<OutfitHero,OutfitId>={mage:'default',swordsman:'default'};
export function restoreOutfits(){try{equipped=cleanOutfits(JSON.parse(localStorage.getItem(OUTFIT_KEY)??'{}'));}catch{equipped=cleanOutfits(null);}return{...equipped};}
export const getOutfit=(hero:OutfitHero)=>equipped[hero];
export const getOutfits=()=>({...equipped});
export function equipOutfit(hero:OutfitHero,id:OutfitId){if(!['mage','swordsman'].includes(hero)||!OUTFITS.some(o=>o.id===id))return false;equipped={...equipped,[hero]:id};try{localStorage.setItem(OUTFIT_KEY,JSON.stringify(equipped));}catch{/* Cosmetics still work without storage. */}return true;}
/** Recolor cloth and cold metal only; preserve skin, hair, outlines and alpha. */
export function outfitPixel(r:number,g:number,b:number,hero:OutfitHero,id:OutfitId):[number,number,number]{
 if(id==='default')return[r,g,b];
 const blue=b>r*1.22&&b>g*1.12&&b>40;
 const red=hero==='swordsman'&&r>g*1.45&&r>b*1.35&&r<210&&g<110&&b>=g*.95;
 if(!blue&&!red)return[r,g,b];
 const light=Math.max(r,g,b)/255;
 const palette=id==='frost'?[115,218,239]:id==='woodland'?[100,165,86]:[203,98,63];
 return palette.map(c=>Math.round(c*light)) as [number,number,number];
}

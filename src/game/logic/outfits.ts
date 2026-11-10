export type OutfitHero='mage'|'swordsman';
export type OutfitId='default'|'frost'|'woodland'|'ember'|'ice-knight'|'void-knight';
export const OUTFITS=[
 {id:'default',vi:'Nguyên bản',en:'Original',color:'#e2c585'},
 {id:'frost',vi:'Băng giá',en:'Frostbound',color:'#8cdef1'},
 {id:'woodland',vi:'Rừng xanh',en:'Woodland',color:'#9bd18a'},
 {id:'ember',vi:'Than hồng',en:'Ember',color:'#edaa7e'},
 {id:'ice-knight',vi:'Kiếm sĩ Băng Lam',en:'Iceblade Knight',color:'#8cdef1'},
 {id:'void-knight',vi:'Kiếm sĩ Hắc Diệm',en:'Voidflame Knight',color:'#b773f4'},
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

export const SHOP_OUTFITS = [
 {id:'mage-frost',outfit:'frost',hero:'mage',price:60,cap:1,rarity:'basic',vi:'Pháp sư Băng giá',en:'Mage Frostbound',color:'#8cdef1',detailVi:'Trang phục Băng giá dành cho Pháp sư.',detailEn:'Frostbound outfit for the Mage.'},
 {id:'mage-ember',outfit:'ember',hero:'mage',price:60,cap:1,rarity:'basic',vi:'Pháp sư Than hồng',en:'Mage Ember',color:'#edaa7e',detailVi:'Trang phục Than hồng dành cho Pháp sư.',detailEn:'Ember outfit for the Mage.'},
 {id:'swordsman-frost',outfit:'frost',hero:'swordsman',price:60,cap:1,rarity:'basic',vi:'Kiếm sĩ Băng giá',en:'Swordsman Frostbound',color:'#8cdef1',detailVi:'Trang phục Băng giá dành cho Kiếm sĩ.',detailEn:'Frostbound outfit for the Swordsman.'},
 {id:'swordsman-ember',outfit:'ember',hero:'swordsman',price:60,cap:1,rarity:'basic',vi:'Kiếm sĩ Than hồng',en:'Swordsman Ember',color:'#edaa7e',detailVi:'Trang phục Than hồng dành cho Kiếm sĩ.',detailEn:'Ember outfit for the Swordsman.'},
 {id:'ice-knight',outfit:'ice-knight',hero:'swordsman',price:100,cap:1,rarity:'intermediate',vi:'Kiếm sĩ Băng Lam',en:'Iceblade Knight',color:'#8cdef1',detailVi:'Tóc vàng, giáp băng xanh, áo choàng navy và kiếm băng. Đòn chém cùng kỹ năng mang sắc băng lam.',detailEn:'Blond hair, icy blue armor, navy cape and ice sword. Slashes and skills share an icy blue palette.'},
 {id:'void-knight',outfit:'void-knight',hero:'swordsman',price:100,cap:1,rarity:'intermediate',vi:'Kiếm sĩ Hắc Diệm',en:'Voidflame Knight',color:'#b773f4',detailVi:'Tóc bạc, giáp đen, áo choàng tím và kiếm hắc diệm. Đòn chém cùng kỹ năng mang sắc lửa tím.',detailEn:'Silver hair, black armor, purple cape and void blade. Slashes and skills share a purple flame palette.'},
] as const;
export type ShopOutfitId=typeof SHOP_OUTFITS[number]['id'];
export const isShopOutfit=(id:unknown):id is 'ice-knight'|'void-knight'=>id==='ice-knight'||id==='void-knight';
export const cleanOwnedOutfits=(value:unknown):ShopOutfitId[]=>Array.isArray(value)?[...new Set(value.filter((id):id is ShopOutfitId=>SHOP_OUTFITS.some(o=>o.id===id)))]:[];
/** Owned first; the catalogue order is the order outfits were added to the game. */
export function orderedShopOutfits(owned:readonly ShopOutfitId[]){
 const has=new Set(owned);
 return [...SHOP_OUTFITS.filter(o=>has.has(o.id)),...SHOP_OUTFITS.filter(o=>!has.has(o.id))];
}
export function canWearOutfit(hero:OutfitHero,id:OutfitId,owned:readonly ShopOutfitId[]){
 if(!OUTFITS.some(o=>o.id===id))return false;
 if(id==='default'||id==='woodland')return true;
 return SHOP_OUTFITS.some(o=>o.hero===hero&&o.outfit===id&&owned.includes(o.id));
}
export function orderedCharacterOutfits(hero:OutfitHero,owned:readonly ShopOutfitId[]){
 return [...OUTFITS.filter(o=>canWearOutfit(hero,o.id,owned)),...OUTFITS.filter(o=>!canWearOutfit(hero,o.id,owned))].filter(o=>hero==='swordsman'||!isShopOutfit(o.id));
}
export function outfitTone(hero:OutfitHero,id:OutfitId=getOutfit(hero)){
 return hero==='swordsman'&&isShopOutfit(id)?id==='ice-knight'?{core:'#e5fbff',color:'#72d6f7',dark:'#28678e',glow:'rgba(91,205,255,.22)'}:{core:'#ead2ff',color:'#b256ef',dark:'#351050',glow:'rgba(153,55,230,.22)'}:null;
}

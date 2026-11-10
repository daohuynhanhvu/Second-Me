export const RARITIES = {
  common: {vi:'Đại Trà',en:'Common'},
  refined: {vi:'Tinh Chế',en:'Refined'},
  deluxe: {vi:'Thượng Hạng',en:'Deluxe'},
  bespoke: {vi:'Độc Bản',en:'Bespoke'},
  ultimate: {vi:'Tối Thượng',en:'Ultimate'},
} as const;

export type Rarity = keyof typeof RARITIES;
export const RARITY_ORDER: readonly Rarity[] = ['common','refined','deluxe','bespoke','ultimate'];
export function rarityName(rarity:Rarity,vi:boolean){return RARITIES[rarity][vi?'vi':'en'];}
export const RARITY_COLORS:Record<Rarity,string> = {
  common:'#76c96b',
  refined:'#59adf4',
  deluxe:'#b579e8',
  bespoke:'#f0a154',
  ultimate:'#e75c5c',
};

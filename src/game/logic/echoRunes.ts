export const ECHO_RUNES = [
 {id:'call',glyph:'ᚠ',vi:'Triệu hồi',en:'Calling',detailVi:'Thêm 1 lượt gọi Echo (tối đa 4).',detailEn:'Gain 1 Echo summon charge (up to 4).',color:'#dfc687'},
 {id:'guard',glyph:'ᚢ',vi:'Bền bỉ',en:'Endurance',detailVi:'Echo mất ít hơn 35% ổn định trong màn hiện tại.',detailEn:'Echoes lose 35% less stability this level attempt.',color:'#9bd8c0'},
 {id:'power',glyph:'ᚦ',vi:'Khuếch đại',en:'Amplification',detailVi:'Đòn phát lại của Echo mạnh hơn 30% trong màn hiện tại.',detailEn:'Echo replay attacks deal 30% more damage this level attempt.',color:'#e3a684'},
 {id:'lure',glyph:'ᚨ',vi:'Dẫn dụ',en:'Luring',detailVi:'Echo thu hút quái/boss thêm 3 giây; áp dụng cả Echo gọi sau.',detailEn:'Echoes distract enemies and the boss for 3 extra seconds, including future summons.',color:'#a9c5ef'},
 {id:'restore',glyph:'ᚱ',vi:'Hồi phục',en:'Restoration',detailVi:'Hồi 50 ổn định cho mọi Echo hiện có, tối đa 100.',detailEn:'Restore 50 stability to every active Echo, up to 100.',color:'#c7b2e7'},
] as const;
export type EchoRuneId = typeof ECHO_RUNES[number]['id'];
export type EchoRuneStock = Partial<Record<EchoRuneId,number>>;
/** Independent uniform rolls: no level/rarity weighting, duplicate protection or pity. */
export function rollEchoRune(random:()=>number=Math.random):EchoRuneId {
 return ECHO_RUNES[Math.min(4,Math.max(0,Math.floor(random()*5)))].id;
}
export function cleanRuneStock(value:unknown):EchoRuneStock {
 const stock:EchoRuneStock={};
 if(!value||typeof value!=='object'||Array.isArray(value))return stock;
 for(const rune of ECHO_RUNES){const n=(value as Record<string,unknown>)[rune.id];if(Number.isSafeInteger(n)&&Number(n)>0)stock[rune.id]=Math.min(9999,Number(n));}
 return stock;
}

export function rollRuneChoices(random:()=>number=Math.random):EchoRuneId[]{
 const pool:EchoRuneId[]=ECHO_RUNES.map(r=>r.id),choices:EchoRuneId[]=[];
 while(choices.length<3){const index=Math.min(pool.length-1,Math.max(0,Math.floor(random()*pool.length)));choices.push(pool.splice(index,1)[0]);}
 return choices;
}
export function cleanRuneChoices(value:unknown):EchoRuneId[]{
 if(!Array.isArray(value)||value.length!==3||new Set(value).size!==3)return [];
 return value.every(id=>ECHO_RUNES.some(r=>r.id===id))?value as EchoRuneId[]:[];
}

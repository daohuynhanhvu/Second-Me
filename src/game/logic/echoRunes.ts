export const ECHO_RUNES = [
 {id:'call',glyph:'ᚠ',vi:'Triệu hồi',en:'Calling',detailVi:'Thêm 1 lượt gọi Echo, tối đa 4; tối đa 6 khi dùng nhẫn tăng giới hạn.',detailEn:'Gain 1 summon charge, up to 4; up to 6 with an active limit ring.',color:'#dfc687'},
 {id:'guard',glyph:'ᚢ',vi:'Bền bỉ',en:'Endurance',detailVi:'Giảm 35% sát thương và hao ổn định khi tạm dừng cho Echo trong màn này. Hoán đổi vẫn tốn 30.',detailEn:'Echoes take 35% less damage and paused stability drain this attempt. Swapping still costs 30.',color:'#9bd8c0'},
 {id:'power',glyph:'ᚦ',vi:'Khuếch đại',en:'Amplification',detailVi:'Đòn đánh của Echo mạnh hơn 30% trong màn hiện tại.',detailEn:'Echo attacks deal 30% more damage this level attempt.',color:'#e3a684'},
 {id:'lure',glyph:'ᚨ',vi:'Truy kích',en:'Pursuit',detailVi:'Echo di chuyển nhanh hơn 25% khi truy kích trong phạm vi chiến đấu.',detailEn:'Echoes move 25% faster while pursuing targets within their combat range.',color:'#a9c5ef'},
 {id:'restore',glyph:'ᚱ',vi:'Hồi phục',en:'Restoration',detailVi:'Hồi 50 ổn định cho mọi Echo hiện có, tối đa 100.',detailEn:'Restore 50 stability to every active Echo, up to 100.',color:'#c7b2e7'},
 {id:'rapid',glyph:'ᚲ',vi:'Liên kích',en:'Quickening',detailVi:'Đòn tự đánh của Echo hồi nhanh hơn 20% trong màn này.',detailEn:'Echo automatic attacks have 20% shorter cooldowns this attempt.',color:'#f1cc7b'},
 {id:'vamp',glyph:'ᛉ',vi:'Hút sinh lực',en:'Siphon',detailVi:'Mỗi đòn Echo đánh trúng hồi 4 ổn định cho chính Echo, tối đa 100.',detailEn:'Each successful Echo attack restores 4 stability to that Echo, up to 100.',color:'#e798aa'},
 {id:'cleave',glyph:'ᛃ',vi:'Lan truyền',en:'Resonance',detailVi:'Đòn Echo lan 40% sát thương tới tối đa 2 mục tiêu khác trong bán kính 55; không xuyên tường.',detailEn:'Echo attacks splash 40% damage to up to 2 other targets within 55 units; walls block it.',color:'#dbb9f0'},
 {id:'anchor',glyph:'ᛏ',vi:'Trấn giữ',en:'Sentinel',detailVi:'Echo đang đứng trên rune giữ vị trí khi có địch; chỉ đánh mục tiêu trong tầm, không đuổi khỏi rune.',detailEn:'An Echo on a gate rune holds position in combat and attacks only within reach, without chasing off it.',color:'#a9d4ac'},
 {id:'regen',glyph:'ᛒ',vi:'Tái tạo',en:'Renewal',detailVi:'Echo hồi 2 ổn định mỗi giây khi không giao chiến, tối đa 100. Không hồi sinh Echo đã mất.',detailEn:'Echoes regenerate 2 stability per second outside combat, up to 100. Does not revive lost Echoes.',color:'#8ddcba'},
 {id:'swap',glyph:'ᛞ',vi:'Hoán ảnh',en:'Phasewalk',detailVi:'Hoán đổi Shift+Q chỉ tốn 15 ổn định và hồi trong 4 giây. Vẫn không xuyên tường.',detailEn:'Shift+Q swaps cost 15 stability and recharge in 4 seconds. Walls still block swapping.',color:'#a4cdeb'},
 {id:'execute',glyph:'ᛟ',vi:'Kết liễu',en:'Execution',detailVi:'Echo gây thêm 25% sát thương lên mục tiêu còn tối đa 30% HP. Không bỏ qua giáp boss.',detailEn:'Echoes deal 25% more damage to targets at or below 30% HP. Does not bypass boss armor.',color:'#f0a576'},
] as const;
export type EchoRuneId = typeof ECHO_RUNES[number]['id'];
export type EchoRuneStock = Partial<Record<EchoRuneId,number>>;
/** Independent uniform rolls: no level/rarity weighting, duplicate protection or pity. */
export function rollEchoRune(random:()=>number=Math.random):EchoRuneId {
 return ECHO_RUNES[Math.min(ECHO_RUNES.length-1,Math.max(0,Math.floor(random()*ECHO_RUNES.length)))].id;
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

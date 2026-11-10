export const TIME_ITEM_PRICE=4,TIME_ITEM_CAP=99;
export const SHOP_ITEMS = [
 {id:'healSmall',vi:'Bình hồi phục nhỏ',en:'Small healing potion',price:6,cap:99,rarity:'common',icon:'heal10',detailVi:'Hồi 10 máu, tối đa bằng máu tối đa. Có thể dùng nhiều bình trong màn.',detailEn:'Restore 10 HP, up to your current maximum. Multiple uses per level.'},
 {id:'healLarge',vi:'Bình hồi phục lớn',en:'Large healing potion',price:10,cap:99,rarity:'common',icon:'heal50',detailVi:'Hồi 50 máu, tối đa bằng máu tối đa. Có thể dùng nhiều bình trong màn.',detailEn:'Restore 50 HP, up to your current maximum. Multiple uses per level.'},
 {id:'revive',vi:'Trục phục sinh',en:'Revival scroll',price:12,cap:10,rarity:'refined',icon:'scroll',detailVi:'Sau khi gục ngã vì hết máu, dùng để hồi sinh đầy máu tại pháp đàn. Một lần mỗi màn; không cứu hết giờ.',detailEn:'After a damage defeat, revive at the starting altar with full HP. Once per level; cannot undo a timeout.'},
 {id:'chances',vi:'3 cơ hội',en:'Three chances',price:22,cap:2,rarity:'refined',icon:'chances',detailVi:'Tự hồi sinh tại chỗ, tối đa một lần mỗi màn. Một món có 3 lượt giữ qua nhiều màn; máu tối đa khi hồi sinh lần lượt 100 / 90 / 80.',detailEn:'Auto-revive in place, once per level. One item has 3 charges shared across levels; revived max HP is 100 / 90 / 80.'},
 {id:'aid',vi:'Lời gọi chi viện',en:'Call for aid',price:0,cap:1,rarity:'bespoke',icon:'aid',detailVi:'Hoàn thành 6 màn bằng cả Aeris và Kael để mở. Gọi Echo của nhân vật còn lại, 15 HP, tự chiến đấu; không giữ rune. Một lần mỗi màn.',detailEn:'Unlock by clearing all 6 trials with both Aeris and Kael. Summon the other hero’s combat Echo with 15 HP; cannot hold runes. Once per level.'},
 {id:'time',vi:'Bình thời gian',en:'Time potion',price:TIME_ITEM_PRICE,cap:TIME_ITEM_CAP,rarity:'common',icon:'time',detailVi:'Thêm 2 giây cho chặng hiện tại. Tối đa 5 lần mỗi màn, nhấn R hoặc dùng trong Túi đồ.',detailEn:'Add 2 seconds to the current leg. Up to 5 uses per level, with R or from Inventory.'},
 {id:'ring',vi:'Nhẫn giới hạn Echo',en:'Echo limit ring',price:30,cap:99999,rarity:'common',icon:'ring',detailVi:'Tăng giới hạn từ 4 lên 6 Echo trong màn. Không cộng dồn.',detailEn:'Raise the Echo limit from 4 to 6 this level. Does not stack.'},
] as const;
export type ShopItemId=(typeof SHOP_ITEMS)[number]['id'];
export type SupplyId=Exclude<ShopItemId,'time'|'ring'>;
export type Supplies=Record<SupplyId,number>;
export const emptySupplies=():Supplies=>({healSmall:0,healLarge:0,revive:0,chances:0,aid:0});
export function cleanSupplies(value:unknown):Supplies{
 const result=emptySupplies();if(!value||typeof value!=='object')return result;
 for(const item of SHOP_ITEMS){if(item.id==='time'||item.id==='ring')continue;const raw=value as Record<string,unknown>,aliases:Record<string,string>={healSmall:'heal10',healLarge:'heal50',aid:'support'};const n=raw[item.id]??raw[aliases[item.id]];if(typeof n==='number'&&Number.isSafeInteger(n)&&n>=0)result[item.id]=Math.min(item.cap,n);}
 return result;
}

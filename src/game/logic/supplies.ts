export const SUPPLIES = [
 {id:'heal10',vi:'Bình hồi phục nhỏ',en:'Small healing bottle',price:6,cap:99,image:1,detail:'Hồi 10 máu · Dùng nhiều lần',detailEn:'Restore 10 HP · Repeatable'},
 {id:'heal50',vi:'Lọ hồi phục nhỏ',en:'Small healing vial',price:10,cap:99,image:2,detail:'Hồi 50 máu · Dùng nhiều lần',detailEn:'Restore 50 HP · Repeatable'},
 {id:'revive',vi:'Trục phục sinh',en:'Resurrection scroll',price:12,cap:10,image:3,detail:'Hồi sinh tại pháp đàn · Một lần mỗi ải',detailEn:'Revive at the altar · Once per level'},
 {id:'chances',vi:'3 cơ hội',en:'Three chances',price:22,cap:2,image:4,detail:'Tự hồi sinh 3 lần · Máu tối đa 100% / 90% / 80%',detailEn:'3 automatic revivals · Max HP 100% / 90% / 80%'},
 {id:'support',vi:'Lời gọi chi viện',en:'Call for aid',price:0,cap:1,image:5,detail:'Echo khác class · 15 HP · Không đạp nút · Một lần mỗi ải',detailEn:'Other-class Echo · 15 HP · Cannot press plates · Once per level'},
] as const;
export type SupplyId=typeof SUPPLIES[number]['id'];
export type SupplyStock=Record<SupplyId,number>;
export const emptySupplies=():SupplyStock=>({heal10:0,heal50:0,revive:0,chances:0,support:0});

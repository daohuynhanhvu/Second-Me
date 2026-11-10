export const CHEST_POOL = [
  {id:'coins5', weight:35, tier:'gold', vi:'5 xu', en:'5 coins'},
  {id:'coins15', weight:24, tier:'gold', vi:'15 xu', en:'15 coins'},
  {id:'coins30', weight:14, tier:'gold', vi:'30 xu', en:'30 coins'},
  {id:'coins100', weight:2, tier:'fire', vi:'100 xu', en:'100 coins'},
  {id:'time', weight:9, tier:'gold', vi:'Bình thời gian', en:'Time potion'},
  {id:'healSmall', weight:8, tier:'gold', vi:'Bình hồi phục nhỏ', en:'Small healing potion'},
  {id:'healLarge', weight:5, tier:'gold', vi:'Bình hồi phục lớn', en:'Large healing potion'},
  {id:'revive', weight:3, tier:'fire', vi:'Trục phục sinh', en:'Revival scroll'},
] as const;
export type ChestRewardId = typeof CHEST_POOL[number]['id'];
export function rollChest(random:()=>number=Math.random):ChestRewardId {
  const value=random();
  if(!Number.isFinite(value)||value<0||value>=1)throw new RangeError('Random value must be in [0, 1)');
  let total=0;
  for(const item of CHEST_POOL){total+=item.weight;if(value*100<total)return item.id;}
  return 'revive';
}

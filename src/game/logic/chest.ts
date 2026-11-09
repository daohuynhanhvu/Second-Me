export const CHEST_POOL = [
  {id:'coins5', weight:72, tier:'gold', vi:'5 xu', en:'5 coins'},
  {id:'coins15', weight:25, tier:'gold', vi:'15 xu', en:'15 coins'},
  {id:'time', weight:0, tier:'gold', vi:'Thêm một chút', en:'A Little More'},
  {id:'ring', weight:3, tier:'fire', vi:'Nhẫn tăng giới hạn', en:'Echo limit ring'},
] as const;
export type ChestRewardId = typeof CHEST_POOL[number]['id'];
export function rollChest(random:()=>number=Math.random):ChestRewardId {
  const value=random();
  if(!Number.isFinite(value)||value<0||value>=1)throw new RangeError('Random value must be in [0, 1)');
  let total=0;
  for(const item of CHEST_POOL){total+=item.weight;if(value*100<total)return item.id;}
  return 'ring';
}

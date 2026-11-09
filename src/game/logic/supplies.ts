/** Compatibility export: all item data is maintained in one catalogue. */
import {SHOP_ITEMS} from './shopItems.ts';
export {emptySupplies} from './shopItems.ts';
export type {SupplyId,Supplies as SupplyStock} from './shopItems.ts';
export const SUPPLIES=SHOP_ITEMS.filter(i=>i.id!=='time'&&i.id!=='ring').map((item,index)=>({...item,image:index+1,detail:item.detailVi}));

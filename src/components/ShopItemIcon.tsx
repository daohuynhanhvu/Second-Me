import type {ShopItemId} from '../game/logic/shopItems.ts';
/** Keep the original hourglass and blue Echo ring; new item art comes from the supplied Word file. */
export function ShopItemIcon({id}:{id:ShopItemId}){
 const atlasIndex=['healSmall','healLarge','revive','chances','aid'].indexOf(id);
 if(atlasIndex>=0)return <span className="shop-item-icon shop-item-atlas" aria-hidden="true" style={{backgroundImage:`url(${import.meta.env.BASE_URL}assets/shop/item-atlas.png)`,backgroundPosition:`${atlasIndex%3*50}% ${Math.floor(atlasIndex/3)*100}%`}}/>;
 return <img className="shop-item-icon shop-original-item" src={`${import.meta.env.BASE_URL}assets/${id==='ring'?'effects/echo-limit-ring.png':'ui/them-mot-chut.png'}`} alt="" aria-hidden="true"/>;
}

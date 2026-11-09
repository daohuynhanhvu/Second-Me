import {SUPPLIES} from '../game/logic/supplies.ts';
import type {GameEngine} from '../game/GameEngine.ts';
export function SupplyItems({engine,vi,shop=false}:{engine:GameEngine|null;vi:boolean;shop?:boolean}){
 if(!engine)return null;
 return <>{SUPPLIES.map(item=>{const count=engine.campaign.supplies[item.id],support=item.id==='support';return <article key={item.id} className={shop?'tanuki-product':undefined}>
 <div className={shop?'tanuki-product-art':'supply-icon'}><img src={import.meta.env.BASE_URL+'assets/ui/shop-item-'+item.image+'.png'} alt=""/></div>
 <div className={shop?'tanuki-product-copy':undefined}><h3>{vi?item.vi:item.en}</h3><p>{vi?item.detail:item.detailEn}</p><small>{support?(vi?'Cao':'High'):(vi?'Thấp':'Low')} · {count}/{item.cap}</small>
 {item.id==='chances'&&count>0&&<p>{vi?'Lượt còn lại trong vật phẩm đang dùng: ':'Charges in current item: '}{3-engine.campaign.chanceUses}</p>}
 {support&&<p>{vi?'Thắng cả 6 ải với Aeris và Kael để nhận một lần.':'Clear all six levels with both Aeris and Kael to earn once.'} ({(engine.campaign.heroClears.mage??[]).length}/6 · {(engine.campaign.heroClears.swordsman??[]).length}/6)</p>}
 {shop?<div className="tanuki-product-bottom"><b>{support?(vi?'PHẦN THƯỞNG':'REWARD'):item.price+(vi?' xu':' coins')}</b>{!support&&<button disabled={count>=item.cap||engine.campaign.coins<item.price} onClick={()=>engine.buySupply(item.id)}>{count>=item.cap?(vi?'ĐÃ ĐẦY':'FULL'):(vi?'MUA':'BUY')}</button>}</div>:item.id==='chances'?<p>{vi?'Tự kích hoạt khi gục ngã':'Activates automatically on death'}</p>:item.id==='revive'?<p>{vi?'Chọn dùng tại màn Gục ngã':'Use on the defeat screen'}</p>:<button disabled={!engine.canUseSupply(item.id)} onClick={()=>engine.useSupply(item.id)}>{vi?'DÙNG':'USE'}</button>}
 </div></article>;})}</>;
}

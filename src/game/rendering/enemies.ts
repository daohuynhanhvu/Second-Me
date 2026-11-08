import type { Enemy, EnemyKind } from '../logic/enemies.ts';
const sheets=new Map<string,HTMLCanvasElement>();const loading=new Set<string>();
const cells:Record<EnemyKind,number>={goblin:256,bear:256,skull:192,shaman:192,minotaur:320};
function sheet(kind:EnemyKind,moving:boolean){
 const clip=moving?(kind==='minotaur'?'walk':'run'):'idle',key=`${kind}_${clip}`;
 if(sheets.has(key))return sheets.get(key);
 if(!loading.has(key)&&typeof Image!=='undefined'){
  loading.add(key);const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const g=c.getContext('2d')!;g.drawImage(img,0,0);const pixels=g.getImageData(0,0,c.width,c.height);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=180?255:0;g.putImageData(pixels,0,0);sheets.set(key,c);};img.src=`${import.meta.env.BASE_URL}assets/enemies/${key}.png`;
 }
}
export function drawEnemies(ctx:CanvasRenderingContext2D,enemies:Enemy[],time:number){
 for(const e of [...enemies].sort((a,b)=>a.y-b.y)){
  if(e.hp<=0&&e.deathAge>.55)continue;const moving=e.mode==='chase',image=sheet(e.kind,moving),cell=cells[e.kind];
  if(!image)continue;const size=e.kind==='minotaur'?180:e.kind==='bear'?154:e.kind==='goblin'?150:e.kind==='shaman'?126:110;
  ctx.save();ctx.globalAlpha=e.hp>0?1:Math.max(0,1-e.deathAge/.55);ctx.translate(Math.round(e.x),Math.round(e.y));
  ctx.fillStyle='#06171180';ctx.beginPath();ctx.ellipse(0,4,size*.18,7,0,0,Math.PI*2);ctx.fill();
  ctx.save();if(e.facingLeft)ctx.scale(-1,1);ctx.imageSmoothingEnabled=false;if(e.hitFlash>0)ctx.filter='brightness(1.8)';
  const frame=e.mode==='warning'?0:Math.floor(time*(moving?10:6))%(image.width/cell);
  ctx.drawImage(image,frame*cell,0,cell,cell,-size/2,-size*.67,size,size);ctx.restore();
  if(e.hp>0){ctx.fillStyle='#121e18';ctx.fillRect(-18,-size*.36,36,4);ctx.fillStyle=e.mode==='warning'?'#ffd18b':'#e19378';ctx.fillRect(-18,-size*.36,36*e.hp/e.maxHp,4);}
  ctx.restore();
  if(e.mode==='warning'&&e.hp>0){ctx.save();ctx.strokeStyle='#f7b872';ctx.fillStyle='#e969413b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.targetX,e.targetY,e.kind==='shaman'?34:44,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ffe2ac';ctx.textAlign='center';ctx.font='bold 19px monospace';ctx.fillText('!',e.x,e.y-size*.50);ctx.restore();}
 }
}

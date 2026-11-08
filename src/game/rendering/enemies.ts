import type { Enemy, EnemyKind } from '../logic/enemies.ts';
const sheets=new Map<string,HTMLCanvasElement>();const loading=new Set<string>();
const cells:Record<Exclude<EnemyKind,'dummy'>,number>={goblin:256,bear:256,skull:192,shaman:192,minotaur:320};
function sheet(kind:Exclude<EnemyKind,'dummy'>,moving:boolean){
 const clip=moving?(kind==='minotaur'?'walk':'run'):'idle',key=`${kind}_${clip}`;
 if(sheets.has(key))return sheets.get(key);
 if(!loading.has(key)&&typeof Image!=='undefined'){
  loading.add(key);const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const g=c.getContext('2d')!;g.drawImage(img,0,0);const pixels=g.getImageData(0,0,c.width,c.height);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=180?255:0;g.putImageData(pixels,0,0);sheets.set(key,c);};img.src=`${import.meta.env.BASE_URL}assets/enemies/${key}.png`;
 }
}
export function drawEnemies(ctx:CanvasRenderingContext2D,enemies:Enemy[],time:number){
 for(const e of [...enemies].sort((a,b)=>a.y-b.y)){
  if(e.kind==='dummy'){drawDummy(ctx,e);continue;}
  if(e.hp<=0&&e.deathAge>.55)continue;const moving=e.mode==='chase',image=sheet(e.kind,moving),cell=cells[e.kind];
  if(!image)continue;const size=e.kind==='minotaur'?180:e.kind==='bear'?154:e.kind==='goblin'?150:e.kind==='shaman'?126:110;
  ctx.save();ctx.globalAlpha=e.hp>0?1:Math.max(0,1-e.deathAge/.55);const impact=1-Math.max(0,e.attackFx??0)/.32;
  const dx=e.targetX-e.x,dy=e.targetY-e.y,len=Math.hypot(dx,dy)||1;
  const lunge=(e.attackFx??0)>0?Math.sin(impact*Math.PI)*12:e.mode==='warning'?-Math.sin(Math.min(1,e.timer)*Math.PI)*5:0;
  ctx.translate(Math.round(e.x+dx/len*lunge),Math.round(e.y+dy/len*lunge));
  ctx.fillStyle='#06171180';ctx.beginPath();ctx.ellipse(0,4,size*.18,7,0,0,Math.PI*2);ctx.fill();
  ctx.save();if(e.facingLeft)ctx.scale(-1,1);ctx.imageSmoothingEnabled=false;if(e.hitFlash>0)ctx.filter='brightness(1.8)';
  const frame=e.mode==='warning'?0:Math.floor(time*(moving?10:6))%(image.width/cell);
  ctx.drawImage(image,frame*cell,0,cell,cell,-size/2,-size*.67,size,size);ctx.restore();
  if(e.hp>0){ctx.fillStyle='#121e18';ctx.fillRect(-18,-size*.36,36,4);ctx.fillStyle=e.mode==='warning'?'#ffd18b':'#e19378';ctx.fillRect(-18,-size*.36,36*e.hp/e.maxHp,4);if(e.hp<e.maxHp){ctx.font='bold 9px ui-monospace,monospace';ctx.textAlign='center';ctx.fillStyle='#ffe2b6';ctx.fillText(`${Math.round(e.hp*10)/10}/${e.maxHp}`,0,-size*.36-5);}}
  ctx.restore();
  if(e.mode==='warning'&&e.hp>0){ctx.save();ctx.strokeStyle='#f7b872';ctx.fillStyle='#e969413b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.targetX,e.targetY,e.kind==='shaman'?34:44,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ffe2ac';ctx.textAlign='center';ctx.font='bold 19px monospace';ctx.fillText('!',e.x,e.y-size*.50);ctx.restore();}
 }
}

/**
 * The training dummy (dev training ground): a straw sack with a painted target on a post with a
 * crossbar, drawn in flat pixel blocks. It rocks on its post after a hit (timer = seconds since
 * the last hit) and flashes; its bar shows how far it is from refilling.
 */
function drawDummy(ctx:CanvasRenderingContext2D,e:Enemy){
 const since=e.timer,rock=since<1.2?Math.sin(since*22)*Math.exp(-since*4)*.22:0;
 const px=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
 ctx.save();ctx.translate(Math.round(e.x),Math.round(e.y));
 ctx.fillStyle='#06171180';ctx.beginPath();ctx.ellipse(0,4,22,7,0,0,Math.PI*2);ctx.fill();
 px(-10,-2,20,6,'#3b2a1c');px(-8,-2,16,2,'#5a412b');                       // base block
 ctx.rotate(rock);
 px(-3,-62,6,62,'#4a3322');px(-3,-62,2,62,'#6b4c31');                        // post
 px(-26,-50,52,5,'#4a3322');px(-26,-50,52,2,'#6b4c31');                      // crossbar arms
 const flash=e.hitFlash>0;
 const straw=flash?'#fff1c4':'#c9a35b',shade=flash?'#f4d99a':'#9c7a3f',rope=flash?'#ffffff':'#5b4630';
 px(-14,-58,28,30,shade);px(-13,-58,24,28,straw);                            // body sack
 px(-14,-46,28,3,rope);                                                      // waist rope
 px(-9,-80,18,20,shade);px(-8,-80,15,18,straw);                              // head sack
 px(-9,-63,18,3,rope);                                                       // neck rope
 px(-6,-55,12,12,flash?'#ffd0c4':'#a5402f');px(-4,-53,8,8,straw);px(-2,-51,4,4,flash?'#ffd0c4':'#a5402f');  // target
 px(-5,-74,3,3,'#3b2a1c');px(2,-74,3,3,'#3b2a1c');                           // stitched eyes
 for(const [x,y] of [[-15,-40],[13,-36],[-11,-30],[10,-56]])px(x,y,3,2,shade); // loose straw
 ctx.rotate(-rock);
 // Bar: how much of the dummy's pool is left before it refills.
 ctx.fillStyle='#121e18';ctx.fillRect(-20,-92,40,4);ctx.fillStyle='#e9c46a';ctx.fillRect(-20,-92,40*Math.max(0,e.hp)/e.maxHp,4);
 ctx.restore();
}
/** Attack effects persist through recovery, including attacks the player dodges. */
export function drawEnemyAttacks(ctx:CanvasRenderingContext2D,enemies:Enemy[],reduced=false){
 for(const e of enemies){
  if(e.hp<=0||(e.attackFx??0)<=0)continue;
  const progress=1-e.attackFx!/.32,angle=Math.atan2(e.targetY-e.y,e.targetX-e.x);
  ctx.save();ctx.globalAlpha=Math.min(1,e.attackFx!/.08);ctx.lineCap='round';
  if(e.kind==='shaman'){
   ctx.strokeStyle='#c898ef';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.x,e.y-20);ctx.lineTo((e.x+e.targetX)/2+8,e.targetY-15);ctx.lineTo(e.targetX,e.targetY);ctx.stroke();
   ctx.strokeStyle='#e7c5ff';ctx.beginPath();ctx.arc(e.targetX,e.targetY,12+progress*23,0,Math.PI*2);ctx.stroke();
  }else{
   ctx.strokeStyle=e.kind==='minotaur'?'#ffc183':'#fff0cf';ctx.lineWidth=e.kind==='minotaur'?6:4;
   ctx.beginPath();ctx.arc(e.x,e.y,28+progress*18,angle-1.1+progress*.4,angle+1.1);ctx.stroke();
   if(e.kind==='bear')for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(e.targetX-12+i*8,e.targetY-16);ctx.lineTo(e.targetX+5+i*8,e.targetY+12);ctx.stroke();}
  }
  ctx.translate(e.targetX,e.targetY);ctx.strokeStyle='#e7a77d';ctx.lineWidth=2;
  for(let i=0;i<6;i++){const a=i*Math.PI/3,r=6+(reduced?6:progress*24);ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);ctx.lineTo(Math.cos(a)*(r+8),Math.sin(a)*(r+8));ctx.stroke();}
  ctx.restore();
 }
}

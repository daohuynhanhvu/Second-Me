/** Prebaked full-body keyframes made from original sprite pixels. No moving cutouts at runtime. */
let atlas:HTMLCanvasElement|undefined;
const outline=[[[67,53],[65,59],[60,62],[55,65],[56,70],[60,75],[66,79],[70,83],[77,82],[79,77],[75,73],[70,71],[67,68],[69,64],[72,61]],[[120,42],[129,44],[132,53],[134,60],[133,69],[132,78],[127,86],[122,91],[115,88],[113,83],[117,78],[120,72],[122,67],[120,61],[116,57]]];
const raised=[[[70,40],[61,33],[51,33],[50,45],[56,58],[65,64],[78,62],[75,53]],[[122,42],[135,39],[140,35],[152,35],[155,45],[151,57],[142,64],[130,61]]];
export function guardianCastAtlas(sheet:HTMLImageElement){
 if(atlas)return atlas;
 const parts=Array.from({length:5},()=>{const c=document.createElement('canvas');c.width=192;c.height=128;return c;});
 const body=parts[0].getContext('2d')!;body.drawImage(sheet,0,0,192,128,0,0,192,128);
 [outline,raised].forEach((polys,type)=>polys.forEach((poly,i)=>{
  const c=parts[1+i+type*2].getContext('2d')!;c.save();c.beginPath();poly.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();c.drawImage(sheet,type?768:0,type?512:0,192,128,0,0,192,128);c.restore();
  if(!type){body.save();body.beginPath();poly.forEach(([x,y],j)=>j?body.lineTo(x,y):body.moveTo(x,y));body.closePath();body.clip();body.clearRect(0,0,192,128);body.restore();}
 }));
 body.save();body.globalCompositeOperation='destination-over';body.translate(203,0);body.scale(-1,1);body.drawImage(sheet,78,76,19,18,78,76,19,18);body.restore();
 atlas=document.createElement('canvas');atlas.width=3072;atlas.height=256;
 const c=atlas.getContext('2d')!;c.imageSmoothingEnabled=false;
 // [arm angle, torso compression, raised original arms]. Feet remain anchored at y=110.
 const slam=[[0,1,0],[.6,1,0],[1.2,1,0],[.25,1,1],[.5,1,1],[0,.72,0],[0,.75,0],[0,.83,0],[0,.9,0],[0,.96,0],[0,1,0]];
 const volley=[[0,1,0],[-.4,1,0],[-.8,.98,0],[-1.1,.96,0],[-1.15,.96,0],[-.7,.98,0],[0,1,1],[.25,1,1],[.1,1,1],[.1,1,1],[0,1,1],[.9,1,0],[.6,1,0],[.3,1,0],[.15,1,0],[0,1,0]];
 [slam,volley].forEach((frames,row)=>frames.forEach(([angle,compress,high],frame)=>{
  c.save();c.translate(frame*192,row*128);c.translate(0,110);c.scale(1,compress);c.translate(0,-110);c.drawImage(parts[0],0,0);
  for(let i=0;i<2;i++){const x=i?123:67,y=i?51:57;c.save();c.translate(x,y);c.rotate(i?-angle:angle);if(high)c.drawImage(parts[3+i],-(i?130:70),-55);else{if(compress<.9)c.scale(1,i?1.7:2.1);c.drawImage(parts[i+1],-x,-y);}c.restore();}
  c.restore();
 }));
 return atlas;
}

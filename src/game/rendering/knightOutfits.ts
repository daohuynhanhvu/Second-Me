import {getOutfit,isShopOutfit,outfitTone,type OutfitId} from '../logic/outfits.ts';
import type {Direction} from '../logic/types.ts';
let atlas:HTMLImageElement|undefined;
export function knightAtlasReady(){
 if(!atlas&&typeof Image!=='undefined'){atlas=new Image();atlas.src=`${import.meta.env.BASE_URL}assets/outfits/kael-costumes.png`;}
 return !!atlas?.complete&&!!atlas.naturalWidth;
}
/** One 8×8 atlas: front, back, side and slash for each reference costume. */
export function drawKnightOutfit(ctx:CanvasRenderingContext2D,x:number,y:number,direction:Direction,moving:boolean,time:number,attacking=false,progress=0,id:OutfitId=getOutfit('swordsman')){
 if(!isShopOutfit(id))return false;
 if(!knightAtlasReady()||!atlas)return false;
 const cellW=atlas.naturalWidth/8,cellH=atlas.naturalHeight/8;
 const row=(id==='void-knight'?4:0)+(attacking?3:direction==='up'?1:direction==='down'?0:2);
 const frame=attacking?Math.min(7,Math.max(0,Math.floor(progress*8))):moving?Math.floor(time*10)%8:0;
 ctx.save();ctx.translate(Math.round(x),Math.round(y));if(direction==='left')ctx.scale(-1,1);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(atlas,frame*cellW,row*cellH,cellW,cellH,-42,-74,84,84);ctx.restore();return true;
}
const effects=new WeakMap<object,Map<string,HTMLCanvasElement>>();
/** Cache palette variants once; retain the sheet's original alpha and luminance. */
export function knightEffectSheet(image:HTMLImageElement,id:OutfitId=getOutfit('swordsman')):HTMLImageElement|HTMLCanvasElement{
 const tone=outfitTone('swordsman',id);if(!tone||!image.naturalWidth)return image;
 const variants=effects.get(image)??new Map<string,HTMLCanvasElement>();effects.set(image,variants);
 const cached=variants.get(id);if(cached)return cached;
 const cv=document.createElement('canvas');cv.width=image.naturalWidth;cv.height=image.naturalHeight;
 const ctx=cv.getContext('2d');if(!ctx)return image;ctx.drawImage(image,0,0);
 const data=ctx.getImageData(0,0,cv.width,cv.height),p=data.data;
 const base=id==='ice-knight'?[92,198,243]:[153,56,222];
 for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const l=Math.max(p[i],p[i+1],p[i+2])/255;for(let c=0;c<3;c++)p[i+c]=Math.round(base[c]*l+(255-base[c])*Math.max(0,l-.75)*2);}
 ctx.putImageData(data,0,0);variants.set(id,cv);return cv;
}

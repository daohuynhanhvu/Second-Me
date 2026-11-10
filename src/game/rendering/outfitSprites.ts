import {getOutfit,outfitPixel,type OutfitHero,type OutfitId} from '../logic/outfits.ts';
const cache=new WeakMap<object,Map<string,HTMLCanvasElement>>();
export function outfitSheet(image:HTMLImageElement|HTMLCanvasElement,hero:OutfitHero,id:OutfitId=getOutfit(hero)):HTMLImageElement|HTMLCanvasElement{
 if(id==='default'||typeof document==='undefined')return image;
 const key=hero+':'+id,variants=cache.get(image)??new Map<string,HTMLCanvasElement>();cache.set(image,variants);
 const existing=variants.get(key);if(existing)return existing;
 const canvas=document.createElement('canvas');canvas.width=image instanceof HTMLImageElement?image.naturalWidth:image.width;canvas.height=image instanceof HTMLImageElement?image.naturalHeight:image.height;
 if(!canvas.width||!canvas.height)return image;
 const ctx=canvas.getContext('2d');if(!ctx)return image;
 ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height),p=data.data;
 for(let i=0;i<p.length;i+=4){if(!p[i+3])continue;const [r,g,b]=outfitPixel(p[i],p[i+1],p[i+2],hero,id);p[i]=r;p[i+1]=g;p[i+2]=b;}
 ctx.putImageData(data,0,0);variants.set(key,canvas);return canvas;
}

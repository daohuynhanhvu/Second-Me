import type { LevelData } from '../logic/types.ts';
import { livingImage } from './livingAssets.ts';

/**
 * Built boundary layers by level, the most recent last. More than one: the cinematic intro
 * cross-fades two levels and renders them on alternate frames, which would otherwise rebuild a
 * layer (hundreds of sprites) every frame.
 */
const layers = new Map<string, HTMLCanvasElement>();
const MAX_LAYERS = 3;
/** Level 3's recoloured sheet: its colour filter applied once to the whole sheet, not per sprite. */
const LEVEL3_FILTER = 'hue-rotate(100deg) saturate(.65) brightness(.8)';
let tinted: { source: HTMLImageElement; sheet: HTMLCanvasElement } | null = null;
function level3Sheet(image: HTMLImageElement): CanvasImageSource {
  if (tinted?.source !== image) {
    const sheet = document.createElement('canvas'); sheet.width = image.width; sheet.height = image.height;
    const g = sheet.getContext('2d')!; g.filter = LEVEL3_FILTER; g.drawImage(image, 0, 0);
    tinted = { source: image, sheet };
  }
  return tinted.sheet;
}
export const forestBoundaryReady = () => !!livingImage('forest-edge-pixel.png');

/** Collision rectangles stay fixed; their visible material becomes roots, rock and canopy. */
export function drawForestBoundary(ctx: CanvasRenderingContext2D, level: LevelData, w = 1280, h = 720) {
  const image = livingImage('forest-edge-pixel.png');
  if (!image || typeof document === 'undefined') return false;
  const key = `${w}:${h}:${level.id}:${JSON.stringify(level.walls)}`;
  let layer = layers.get(key);
  if (layer) layers.delete(key);                         // re-inserted below as most recent
  else {
    layer = document.createElement('canvas');layer.width=w;layer.height=h;
    const g=layer.getContext('2d')!;g.imageSmoothingEnabled=false;
    const row=level.id>=5?2:level.id===4?1:0;
    const sw=image.width/4,sh=image.height/3;
    const sheet=level.id===3?level3Sheet(image):image;
    const noise=(n:number)=>{const a=Math.sin(n*127.1+level.id*91.7)*43758.5453;return a-Math.floor(a);};
    const sprite=(col:number,x:number,y:number,size:number,angle=0,flip=false)=>{
      g.save();g.translate(Math.round(x),Math.round(y));g.rotate(angle);if(flip)g.scale(-1,1);
      g.drawImage(sheet,col*sw,row*sh,sw,sh,-size/2,-size/2,size,size);g.restore();
    };
    // Fill only impassable space with forest shadow, then break every edge with silhouettes.
    for(const wall of level.walls) {
      const {x,y,width,height}=wall;
      const outer=x<=0||y<=0||x+width>=w||y+height>=h;
      if(outer) {
        g.fillStyle=level.id>=5?'#172d36':'#10291e';g.fillRect(x,y,width,height);
        continue;
      }
      if(width>=height*1.5&&Math.max(width,height)<=160) {
        g.drawImage(image,3*sw,row*sh,sw,sh,x-12,y-14,width+24,height+28);   // never recoloured
        continue;
      }
      g.save();g.beginPath();g.rect(x-10,y,width+20,height);g.clip();
      const vertical=height>width,length=vertical?height:width;
      // Dense root/rock masses read as an impassable barrier without brick seams.
      for(let at=0,i=0;at<length+20;at+=38,i++) {
        const size=66+noise(i+x+y)*13;
        sprite(i%4===2?2:3,vertical?x+width/2+(noise(i+20)-.5)*7:x+at,vertical?y+at:y+height/2,size,i%4===2&&vertical?Math.PI/2:0,i%2===0);
      }
      g.restore();
    }
    // Large overlapping canopy groups sit mostly outside the world; inner leaves vary in depth.
    for(let x=-30,i=0;x<w+80;x+=66,i++) {
      const size=122+noise(i+10)*38;
      sprite(i%4===1?1:0,x,-size/2+62+noise(i+40)*22,size,0,i%2===0);
      const size2=125+noise(i+80)*34;
      sprite(i%3===0?1:0,x+20,h+size2/2-62-noise(i+90)*22,size2,Math.PI,i%2===1);
    }
    for(let y=65,i=0;y<h-45;y+=64,i++) {
      const size=125+noise(i+120)*30;
      sprite(i%4===0?3:0,-size/2+57+noise(i+140)*18,y,size,0,i%2===1);
      sprite(i%3===0?1:0,w+size/2-57-noise(i+160)*18,y+14,size,0,i%2===0);
    }
  }
  layers.set(key, layer);
  if (layers.size > MAX_LAYERS) layers.delete(layers.keys().next().value!);
  ctx.drawImage(layer,0,0);
  return true;
}

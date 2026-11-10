import {outfitSheet} from './outfitSprites.ts';
import type {OutfitId} from '../logic/outfits.ts';
import type { Direction } from '../logic/types.ts';

let sheet: HTMLCanvasElement | null = null;
let loading = false;

export function loadWizardSprites() {
  if (loading || sheet || typeof Image === 'undefined') return;
  loading = true;
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { loading = false; return; }
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] >= 180 ? 255 : 0;
    ctx.putImageData(pixels, 0, 0);
    const aligned=document.createElement('canvas');aligned.width=canvas.width;aligned.height=canvas.height;
    const alignedCtx=aligned.getContext('2d');
    if(!alignedCtx){sheet=canvas;return;}
    const offsets=wizardFrameOffsets(pixels.data,canvas.width);
    for(let row=0;row<3;row++)for(let frame=0;frame<8;frame++){
      alignedCtx.save();alignedCtx.beginPath();alignedCtx.rect(frame*256,row*256,256,256);alignedCtx.clip();
      alignedCtx.drawImage(canvas,frame*256,row*256,256,256,frame*256+offsets[row][frame],row*256,256,256);alignedCtx.restore();
    }
    sheet = aligned;
  };
  image.onerror = () => { loading = false; };
  image.src = `${import.meta.env.BASE_URL}assets/aeris/Aeris_Walk.png`;
}

export function getWizardSheet() { loadWizardSprites(); return sheet; }

/** The sheet is an eight-frame stride; keep its authored temporal order. */
export const WIZARD_WALK_ORDER: readonly (readonly number[])[] = [
  [0,1,2,3,4,5,6,7],
  [0,1,2,3,4,5,6,7],
  [0,1,2,3,4,5,6,7],
];
/** Match the hood anchor of each frame to its row's idle pose. Keep the leg motion and bob. */
export function wizardFrameOffsets(alpha:Uint8ClampedArray,width:number):number[][]{
 const rows:number[][]=[];
 for(let row=0;row<3;row++){
  const centres:number[]=[];
  for(let frame=0;frame<8;frame++){
   let left=256,right=-1;
   for(let y=0;y<135;y++)for(let x=0;x<256;x++)if(alpha[((row*256+y)*width+frame*256+x)*4+3]>=180){left=Math.min(left,x);right=Math.max(right,x);}
   centres.push(right>=left?(left+right)/2:128);
  }
  rows.push(centres.map(x=>Math.round(centres[0]-x)));
 }
 return rows;
}

export function drawWizardSprite(ctx: CanvasRenderingContext2D, x: number, y: number, direction: Direction, moving: boolean, echo: boolean, time: number, outfit?:OutfitId): boolean {
  const image = getWizardSheet();
  if (!image) return false;
  const row = direction === 'up' ? 0 : direction === 'down' ? 2 : 1;
  const frame = moving ? WIZARD_WALK_ORDER[row][Math.floor(time * 10) % 8] : 0;
  ctx.save(); ctx.translate(x, y);
  if (direction === 'left') ctx.scale(-1, 1);
  if (echo) { ctx.globalAlpha *= .65; ctx.filter = 'brightness(1.65) sepia(1) saturate(4) hue-rotate(135deg)'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 8; }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(outfitSheet(image,'mage',outfit), frame * 256, row * 256, 256, 256, -35, -55, 70, 70);
  ctx.restore(); return true;
}

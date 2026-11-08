import { NatureRenderer } from './natureLegacy.js';
import type { Direction, LevelData, MovementSample } from '../logic/types.ts';
import { drawWizardSprite, loadWizardSprites } from './wizardSprite.ts';
import { installForestStage, type StageState } from './forestStage.ts';

// Keep the supplied forest sprites and rendering, without the old application.
interface ForestRenderer {
  particles: { emit(...args: any[]): void };
  scene: Parameters<typeof installForestStage>[0];
  drawCharacterSprite(ctx: CanvasRenderingContext2D, x: number, y: number, direction: Direction, frame: number, echo: boolean, time: number, moving?: boolean): void;
  reset(): void;
  update(dt: number, moving: boolean): void;
  emitMagic(kind: string, x: number, y: number, size?: number): void;
  drawEcho(ctx:CanvasRenderingContext2D,x:number,y:number,direction:Direction,moving:boolean,time:number):void;
  render(ctx: CanvasRenderingContext2D, width: number, height: number, level: LevelData,
    player: {x:number;y:number;direction:Direction;isMoving:boolean}, echo: any,
    recording: boolean, duration: number, samples: MovementSample[], time: number): void;
}
const Base = NatureRenderer as unknown as { new(): ForestRenderer };

export class GameRenderer extends Base {
  /** Set by the engine each frame: level clock and whether the exit is open (hand-drawn stage). */
  readonly stage: StageState = { levelTime: 0, exitOpen: true };
  constructor() {
    super();
    installForestStage(this.scene, this.stage);
    loadWizardSprites();
  }
  drawCharacterSprite(ctx: CanvasRenderingContext2D, x: number, y: number, direction: Direction, frame: number, echo: boolean, time: number, moving = false) {
    if (!drawWizardSprite(ctx, x, y, direction, moving, echo, time)) super.drawCharacterSprite(ctx, x, y, direction, frame, echo, time, moving);
  }

}

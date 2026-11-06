/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Rect, SecurityDoor } from './types.ts';

export function rectIntersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function pointInRect(px: number, py: number, rect: Rect): boolean {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

export function getCharacterBoundingBox(
  centerX: number,
  centerY: number,
  width: number = 24,
  height: number = 24
): Rect {
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
}

/**
 * Checks if a bounding box overlaps any active obstacle.
 */
export function isBoxColliding(box: Rect, obstacles: Rect[]): boolean {
  for (const obs of obstacles) {
    if (rectIntersects(box, obs)) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a character center position is completely walkable.
 */
export function isPositionWalkable(
  x: number,
  y: number,
  charWidth: number,
  charHeight: number,
  obstacles: Rect[]
): boolean {
  const box = getCharacterBoundingBox(x, y, charWidth, charHeight);
  // Outer playfield bounds check [40..1240, 40..680]
  if (box.x < 40 || box.y < 40 || box.x + box.width > 1240 || box.y + box.height > 680) {
    return false;
  }
  return !isBoxColliding(box, obstacles);
}

/**
 * Automatically moves any character spawning inside a wall/door to the nearest valid walkable position.
 */
export function resolveSpawnPosition(
  spawnX: number,
  spawnY: number,
  charWidth: number,
  charHeight: number,
  obstacles: Rect[]
): { x: number; y: number } {
  if (isPositionWalkable(spawnX, spawnY, charWidth, charHeight, obstacles)) {
    return { x: spawnX, y: spawnY };
  }

  // Spiral search in 4px steps up to 120px radius
  const maxRadius = 120;
  const step = 4;

  for (let r = step; r <= maxRadius; r += step) {
    // Check 16 directions around the ring
    const angles = 16;
    for (let i = 0; i < angles; i++) {
      const angle = (i * Math.PI * 2) / angles;
      const testX = Math.round(spawnX + Math.cos(angle) * r);
      const testY = Math.round(spawnY + Math.sin(angle) * r);
      if (isPositionWalkable(testX, testY, charWidth, charHeight, obstacles)) {
        return { x: testX, y: testY };
      }
    }
  }

  // Fallback to original if search exhausts
  return { x: spawnX, y: spawnY };
}

/**
 * Calculates active collision obstacles from walls and doors.
 * Dynamically models door opening progress:
 * - Closed (< 0.75): Full door rectangle blocks movement.
 * - Open (>= 0.75): Door panels slide into wall recesses, leaving doorway completely clear.
 */
export function getActiveObstacles(
  walls: Rect[],
  doors: SecurityDoor[]
): Rect[] {
  const obstacles: Rect[] = [...walls];

  for (const door of doors) {
    // If door is closed or still opening/closing below threshold
    if (door.openProgress < 0.75) {
      if (door.openProgress === 0) {
        // Fully closed door: single solid obstacle
        obstacles.push({
          x: door.x,
          y: door.y,
          width: door.width,
          height: door.height,
        });
      } else if (door.orientation === 'vertical') {
        const halfHeight = door.height / 2;
        const progress = door.openProgress;
        // Remaining top and bottom panel heights
        const topH = halfHeight * (1 - progress);
        const bottomH = halfHeight * (1 - progress);

        if (topH > 2) {
          obstacles.push({
            x: door.x,
            y: door.y,
            width: door.width,
            height: topH,
          });
        }
        if (bottomH > 2) {
          obstacles.push({
            x: door.x,
            y: door.y + door.height - bottomH,
            width: door.width,
            height: bottomH,
          });
        }
      } else {
        // Horizontal door
        obstacles.push({
          x: door.x,
          y: door.y,
          width: door.width * (1 - door.openProgress),
          height: door.height,
        });
      }
    }
  }

  return obstacles;
}

/**
 * Resolves movement with wall/door collisions using separate X and Y axis sliding,
 * sub-stepping to prevent tunneling, and corner slide assistance.
 */
export function resolveMovement(
  currentX: number,
  currentY: number,
  targetX: number,
  targetY: number,
  charWidth: number,
  charHeight: number,
  obstacles: Rect[]
): { x: number; y: number } {
  const totalDx = targetX - currentX;
  const totalDy = targetY - currentY;
  const totalDist = Math.hypot(totalDx, totalDy);

  if (totalDist === 0) {
    return { x: currentX, y: currentY };
  }

  // Sub-stepping: step size max 6px to avoid tunneling through thin obstacles
  const maxStepSize = 6;
  const steps = Math.max(1, Math.ceil(totalDist / maxStepSize));
  const stepDx = totalDx / steps;
  const stepDy = totalDy / steps;

  let curX = currentX;
  let curY = currentY;

  for (let s = 0; s < steps; s++) {
    const nextX = curX + stepDx;
    const nextY = curY + stepDy;

    // Try X movement first
    const boxX = getCharacterBoundingBox(nextX, curY, charWidth, charHeight);
    let collidesX = isBoxColliding(boxX, obstacles);

    if (!collidesX) {
      curX = nextX;
    } else {
      // Corner assist on X: if moving along X and blocked, check if slight Y nudge helps
      const nudgeAmount = 2.5;
      const boxXUp = getCharacterBoundingBox(nextX, curY - nudgeAmount, charWidth, charHeight);
      const boxXDown = getCharacterBoundingBox(nextX, curY + nudgeAmount, charWidth, charHeight);
      if (!isBoxColliding(boxXUp, obstacles)) {
        curY -= 1.0;
        curX = nextX;
        collidesX = false;
      } else if (!isBoxColliding(boxXDown, obstacles)) {
        curY += 1.0;
        curX = nextX;
        collidesX = false;
      }
    }

    // Try Y movement
    const boxY = getCharacterBoundingBox(curX, nextY, charWidth, charHeight);
    let collidesY = isBoxColliding(boxY, obstacles);

    if (!collidesY) {
      curY = nextY;
    } else {
      // Corner assist on Y: if moving along Y and blocked, check if slight X nudge helps
      const nudgeAmount = 2.5;
      const boxYLeft = getCharacterBoundingBox(curX - nudgeAmount, nextY, charWidth, charHeight);
      const boxYRight = getCharacterBoundingBox(curX + nudgeAmount, nextY, charWidth, charHeight);
      if (!isBoxColliding(boxYLeft, obstacles)) {
        curX -= 1.0;
        curY = nextY;
        collidesY = false;
      } else if (!isBoxColliding(boxYRight, obstacles)) {
        curX += 1.0;
        curY = nextY;
        collidesY = false;
      }
    }
  }

  return { x: curX, y: curY };
}

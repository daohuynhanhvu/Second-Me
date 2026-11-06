/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { pointInRect, rectIntersects, getCharacterBoundingBox } from './collision.ts';
import { PressurePlate, SecurityDoor, ExitPortal, Rect } from './types.ts';

export interface CharacterPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/**
 * Checks which pressure plates are currently occupied by player or echo.
 */
export function updatePressurePlates(
  plates: PressurePlate[],
  player: CharacterPosition,
  echo: CharacterPosition | null,
  dt: number
): { plateChanged: boolean; activatedIds: string[]; deactivatedIds: string[] } {
  let plateChanged = false;
  const activatedIds: string[] = [];
  const deactivatedIds: string[] = [];

  const playerBox = getCharacterBoundingBox(
    player.x,
    player.y,
    player.width ?? 24,
    player.height ?? 24
  );

  const echoBox = echo
    ? getCharacterBoundingBox(
        echo.x,
        echo.y,
        echo.width ?? 24,
        echo.height ?? 24
      )
    : null;

  for (const plate of plates) {
    const plateRect: Rect = {
      x: plate.x,
      y: plate.y,
      width: plate.width,
      height: plate.height,
    };

    const playerOn = rectIntersects(playerBox, plateRect);
    const echoOn = echoBox ? rectIntersects(echoBox, plateRect) : false;
    const isNowPressed = playerOn || echoOn;

    if (isNowPressed !== plate.isPressed) {
      plateChanged = true;
      if (isNowPressed) {
        activatedIds.push(plate.id);
      } else {
        deactivatedIds.push(plate.id);
      }
    }

    plate.isPressed = isNowPressed;
    if (isNowPressed) {
      plate.pressTimer = (plate.pressTimer ?? 0) + dt;
    } else {
      plate.pressTimer = 0;
    }
  }

  return { plateChanged, activatedIds, deactivatedIds };
}

/**
 * Updates doors based on required pressure plates.
 * Handles safe closing (never crush player or echo while occupying door threshold).
 */
export function updateSecurityDoors(
  doors: SecurityDoor[],
  plates: PressurePlate[],
  player: CharacterPosition,
  echo: CharacterPosition | null,
  dt: number,
  openSpeed: number = 3.5 // full open/close in ~0.3 seconds
): { doorStateChanged: boolean; openedDoorIds: string[]; closedDoorIds: string[] } {
  let doorStateChanged = false;
  const openedDoorIds: string[] = [];
  const closedDoorIds: string[] = [];

  const playerBox = getCharacterBoundingBox(
    player.x,
    player.y,
    player.width ?? 26,
    player.height ?? 26
  );
  const echoBox = echo
    ? getCharacterBoundingBox(
        echo.x,
        echo.y,
        echo.width ?? 26,
        echo.height ?? 26
      )
    : null;

  // Build a lookup map of plate states
  const plateStateMap = new Map<string, boolean>();
  for (const plate of plates) {
    plateStateMap.set(plate.id, plate.isPressed);
  }

  for (const door of doors) {
    // Check if all required plates are pressed
    const allRequiredPressed = door.requiredPlates.every(
      (id) => plateStateMap.get(id) === true
    );

    const prevOpen = door.isOpen;
    door.isOpen = allRequiredPressed;

    if (allRequiredPressed !== prevOpen) {
      doorStateChanged = true;
      if (allRequiredPressed) {
        openedDoorIds.push(door.id);
      } else {
        closedDoorIds.push(door.id);
      }
    }

    const doorRect: Rect = {
      x: door.x,
      y: door.y,
      width: door.width,
      height: door.height,
    };

    if (door.isOpen) {
      // Animate opening
      if (door.openProgress < 1) {
        door.openProgress = Math.min(1, door.openProgress + dt * openSpeed);
      }
    } else {
      // Safety check: is player or echo inside the doorway?
      const playerInside = rectIntersects(playerBox, doorRect);
      const echoInside = echoBox ? rectIntersects(echoBox, doorRect) : false;

      // Only close if doorway is unoccupied to prevent getting crushed or stuck
      if (!playerInside && !echoInside) {
        if (door.openProgress > 0) {
          door.openProgress = Math.max(0, door.openProgress - dt * openSpeed);
        }
      }
    }
  }

  return { doorStateChanged, openedDoorIds, closedDoorIds };
}

/**
 * Checks if the player has entered the exit portal.
 */
export function checkExitReached(
  playerX: number,
  playerY: number,
  exit: ExitPortal
): boolean {
  const portalCenterX = exit.x + exit.width / 2;
  const portalCenterY = exit.y + exit.height / 2;
  const dist = Math.hypot(playerX - portalCenterX, playerY - portalCenterY);
  return dist <= exit.radius;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Direction, MovementSample, RecordingStatus } from './types.ts';

export const MAX_RECORDING_DURATION_MS = 8000;
export const SAMPLE_INTERVAL_MS = 50;

export class RecordingManager {
  private samples: MovementSample[] = [];
  private status: RecordingStatus = 'idle';
  private startTime: number = 0;
  private lastSampleTime: number = -1;
  private currentDuration: number = 0;

  public getStatus(): RecordingStatus {
    return this.status;
  }

  public getSamples(): MovementSample[] {
    return this.samples;
  }

  public getDuration(): number {
    if (this.status === 'recording') {
      return this.currentDuration;
    }
    if (this.samples.length > 0) {
      return this.samples[this.samples.length - 1].time;
    }
    return 0;
  }

  public getRemainingTimeMs(): number {
    return Math.max(0, MAX_RECORDING_DURATION_MS - this.getDuration());
  }

  public startRecording(
    initialX: number,
    initialY: number,
    direction: Direction
  ): void {
    this.samples = [
      {
        time: 0,
        x: initialX,
        y: initialY,
        direction,
        isMoving: false,
      },
    ];
    this.status = 'recording';
    this.startTime = 0;
    this.lastSampleTime = 0;
    this.currentDuration = 0;
  }

  public updateRecording(
    dtMs: number,
    x: number,
    y: number,
    direction: Direction,
    isMoving: boolean
  ): { autoStopped: boolean } {
    if (this.status !== 'recording') {
      return { autoStopped: false };
    }

    this.currentDuration += dtMs;

    // Check auto-stop limit
    if (this.currentDuration >= MAX_RECORDING_DURATION_MS) {
      this.currentDuration = MAX_RECORDING_DURATION_MS;
      // Add final sample at max duration
      this.samples.push({
        time: MAX_RECORDING_DURATION_MS,
        x,
        y,
        direction,
        isMoving,
      });
      this.status = 'recorded';
      return { autoStopped: true };
    }

    // Add sample if interval has passed
    if (this.currentDuration - this.lastSampleTime >= SAMPLE_INTERVAL_MS) {
      this.samples.push({
        time: this.currentDuration,
        x,
        y,
        direction,
        isMoving,
      });
      this.lastSampleTime = this.currentDuration;
    }

    return { autoStopped: false };
  }

  public stopRecording(
    finalX: number,
    finalY: number,
    direction: Direction,
    isMoving: boolean
  ): boolean {
    if (this.status !== 'recording') {
      return false;
    }

    // Commit the exact endpoint, including when stopping on a sample boundary.
    const finalSample: MovementSample = {
      time: this.currentDuration,
      x: finalX,
      y: finalY,
      direction,
      isMoving,
    };
    const last = this.samples[this.samples.length - 1];
    if (last && last.time === this.currentDuration) {
      this.samples[this.samples.length - 1] = finalSample;
    } else {
      this.samples.push(finalSample);
    }

    this.status = 'recorded';
    return true;
  }

  public clear(): void {
    this.samples = [];
    this.status = 'idle';
    this.startTime = 0;
    this.lastSampleTime = -1;
    this.currentDuration = 0;
  }
}

/**
 * Interpolates movement sample at given elapsed time.
 */
export function interpolateSample(
  samples: MovementSample[],
  elapsedMs: number
): {
  x: number;
  y: number;
  direction: Direction;
  isMoving: boolean;
  isFinished: boolean;
  progress: number;
} {
  if (samples.length === 0) {
    return {
      x: 0,
      y: 0,
      direction: 'down',
      isMoving: false,
      isFinished: true,
      progress: 1,
    };
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  const totalDuration = last.time;

  if (samples.length === 1 || elapsedMs >= totalDuration) {
    return {
      x: last.x,
      y: last.y,
      direction: last.direction,
      isMoving: false,
      isFinished: true,
      progress: 1,
    };
  }

  if (elapsedMs <= 0) {
    return {
      x: first.x,
      y: first.y,
      direction: first.direction,
      isMoving: false,
      isFinished: false,
      progress: 0,
    };
  }

  // Binary search or linear scan for the enclosing interval
  let s0 = samples[0];
  let s1 = samples[samples.length - 1];

  for (let i = 0; i < samples.length - 1; i++) {
    if (samples[i].time <= elapsedMs && samples[i + 1].time >= elapsedMs) {
      s0 = samples[i];
      s1 = samples[i + 1];
      break;
    }
  }

  const interval = s1.time - s0.time;
  const factor = interval > 0 ? (elapsedMs - s0.time) / interval : 0;
  const clampedFactor = Math.max(0, Math.min(1, factor));

  const x = s0.x + (s1.x - s0.x) * clampedFactor;
  const y = s0.y + (s1.y - s0.y) * clampedFactor;

  // Moving state: if moving between s0 and s1 or distance > threshold
  const dist = Math.hypot(s1.x - s0.x, s1.y - s0.y);
  const isMoving = dist > 0.5 || !!s0.isMoving;

  return {
    x,
    y,
    direction: s0.direction,
    isMoving,
    isFinished: false,
    progress: totalDuration > 0 ? elapsedMs / totalDuration : 1,
  };
}

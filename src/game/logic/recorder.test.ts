/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RecordingManager,
  interpolateSample,
  MAX_RECORDING_DURATION_MS,
} from './recorder.ts';
import { MovementSample } from './types.ts';

test('RecordingManager records samples and stops cleanly', () => {
  const rm = new RecordingManager();
  assert.equal(rm.getStatus(), 'idle');

  rm.startRecording(100, 200, 'right');
  assert.equal(rm.getStatus(), 'recording');
  assert.equal(rm.getSamples().length, 1);
  assert.equal(rm.getSamples()[0].x, 100);
  assert.equal(rm.getSamples()[0].y, 200);

  // Update with 60ms
  rm.updateRecording(60, 110, 200, 'right', true);
  assert.equal(rm.getSamples().length, 2);

  // Stop recording
  const stopped = rm.stopRecording(150, 200, 'right', false);
  assert.equal(stopped, true);
  assert.equal(rm.getStatus(), 'recorded');
  assert.ok(rm.getSamples().length >= 2);
});

test('RecordingManager auto-stops at MAX_RECORDING_DURATION_MS', () => {
  const rm = new RecordingManager();
  rm.startRecording(50, 50, 'down');

  // Push time up to 8000ms
  const res = rm.updateRecording(8500, 200, 200, 'down', true);
  assert.equal(res.autoStopped, true);
  assert.equal(rm.getStatus(), 'recorded');
  assert.equal(rm.getDuration(), MAX_RECORDING_DURATION_MS);
});

test('stopping on a sample boundary saves the exact final pose', () => {
  const rm = new RecordingManager();
  rm.startRecording(100, 200, 'right');
  rm.updateRecording(60, 110, 200, 'right', true);
  rm.stopRecording(110, 200, 'down', false);
  assert.deepEqual(rm.getSamples().at(-1), {
    time: 60, x: 110, y: 200, direction: 'down', isMoving: false,
  });
});

test('a stationary zero-duration recording finishes at its saved position', () => {
  const rm = new RecordingManager();
  rm.startRecording(465, 205, 'down');
  rm.stopRecording(465, 205, 'down', false);
  const result = interpolateSample(rm.getSamples(), 1000);
  assert.equal(result.x, 465);
  assert.equal(result.y, 205);
  assert.equal(result.isFinished, true);
  assert.equal(result.isMoving, false);
  assert.equal(result.progress, 1);
});

test('interpolateSample smoothly interpolates between waypoints', () => {
  const samples: MovementSample[] = [
    { time: 0, x: 0, y: 0, direction: 'right', isMoving: true },
    { time: 1000, x: 100, y: 0, direction: 'right', isMoving: true },
    { time: 2000, x: 100, y: 200, direction: 'down', isMoving: true },
  ];

  // At t = 0
  const at0 = interpolateSample(samples, 0);
  assert.equal(at0.x, 0);
  assert.equal(at0.y, 0);
  assert.equal(at0.isFinished, false);

  // At t = 500 (halfway between 0 and 1000)
  const at500 = interpolateSample(samples, 500);
  assert.equal(at500.x, 50);
  assert.equal(at500.y, 0);
  assert.equal(at500.isFinished, false);

  // At t = 1500 (halfway between 1000 and 2000)
  const at1500 = interpolateSample(samples, 1500);
  assert.equal(at1500.x, 100);
  assert.equal(at1500.y, 100);
  assert.equal(at1500.isFinished, false);

  // Beyond finish
  const at3000 = interpolateSample(samples, 3000);
  assert.equal(at3000.x, 100);
  assert.equal(at3000.y, 200);
  assert.equal(at3000.isFinished, true);
});

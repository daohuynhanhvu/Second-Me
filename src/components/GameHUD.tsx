/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, RotateCcw, Pause, Disc, UserCheck, XCircle } from 'lucide-react';
import { HUDState } from '../game/GameEngine.ts';

interface GameHUDProps {
  hud: HUDState;
  onToggleRecord: () => void;
  onSpawnEcho: () => void;
  onDismissEcho: () => void;
  onRestart: () => void;
  onPause: () => void;
  onToggleMute: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  onToggleRecord,
  onSpawnEcho,
  onDismissEcho,
  onRestart,
  onPause,
  onToggleMute,
}) => {
  const isRecording = hud.recordingStatus === 'recording';
  const hasRecording = hud.recordingStatus === 'recorded';
  const hasEcho = hud.echoCount > 0;

  // Format elapsed level time as MM:SS
  const mins = Math.floor(hud.elapsedLevelTime / 60);
  const secs = Math.floor(hud.elapsedLevelTime % 60);
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const remainingSeconds = (hud.recordingTimeRemaining / 1000).toFixed(1);
  const recordProgress = Math.max(0, Math.min(1, (8000 - hud.recordingTimeRemaining) / 8000));

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Bar: Sector Info, Context Banner, and Utility Buttons */}
      <div className="flex justify-between items-start gap-4">
        {/* Left: Sector & Timer cluster */}
        <div className="bg-slate-950/85 border border-slate-800/80 rounded px-4 py-2.5 shadow-lg backdrop-blur-none pointer-events-auto flex items-center space-x-4">
          <div>
            <div className="text-[10px] font-mono tracking-widest text-cyan-400 font-semibold uppercase">
              {hud.levelName}
            </div>
            <div className="text-base font-bold text-white tracking-wider">
              {hud.levelSubtitle}
            </div>
          </div>
          <div className="h-7 w-[1px] bg-slate-800" />
          <div className="text-right font-mono">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">TIME</div>
            <div className="text-sm font-bold text-slate-200 tabular-nums">
              {formattedTime}
            </div>
          </div>
        </div>

        {/* Center: Live Notification Banner */}
        {hud.bannerMessage && (
          <div className="hidden sm:flex items-center space-x-2 bg-slate-900/95 border border-cyan-400 text-cyan-300 px-4 py-2 rounded shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-mono tracking-wide">{hud.bannerMessage}</span>
          </div>
        )}

        {/* Right: Quick action buttons */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={onToggleMute}
            title="Toggle Audio [M]"
            aria-label={hud.isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2.5 rounded bg-slate-950/85 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 transition-colors"
          >
            {hud.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            onClick={onRestart}
            title="Restart Level [T]"
            aria-label="Restart Level"
            className="p-2.5 rounded bg-slate-950/85 border border-slate-800 hover:border-amber-500 text-slate-300 hover:text-amber-400 transition-colors"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={onPause}
            title="Pause Simulation [Esc]"
            aria-label="Pause Simulation"
            className="p-2.5 rounded bg-slate-950/85 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 transition-colors"
          >
            <Pause size={16} />
          </button>
        </div>
      </div>

      {/* Bottom Temporal Command Deck */}
      <div className="flex flex-col items-center gap-3">
        {/* Central interactive action dock */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 shadow-2xl flex items-center gap-3 pointer-events-auto">
          {/* [R] Record Action */}
          <button
            onClick={onToggleRecord}
            className={`flex items-center space-x-3 px-4 py-2.5 rounded border transition-all ${
              isRecording
                ? 'bg-red-950/80 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : hasRecording
                ? 'bg-slate-900 border-emerald-500/70 text-emerald-300 hover:bg-slate-800'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-red-500/70'
            }`}
          >
            <Disc
              size={18}
              className={isRecording ? 'text-red-400' : hasRecording ? 'text-emerald-400' : 'text-slate-400'}
            />
            <div className="text-left font-mono">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400">[R]</span>
                <span className="text-xs font-bold tracking-wider">
                  {isRecording ? 'STOP REC' : hasRecording ? 'RE-RECORD' : 'RECORD'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 tabular-nums">
                {isRecording ? `${remainingSeconds}s left` : hasRecording ? '8.0s saved' : 'Max 8.0s'}
              </div>
            </div>
          </button>

          {/* Record progress mini-bar */}
          {isRecording && (
            <div className="w-16 h-2 bg-slate-900 border border-red-900 rounded overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-75"
                style={{ width: `${recordProgress * 100}%` }}
              />
            </div>
          )}

          {/* [E] Spawn Echo Action */}
          <button
            onClick={onSpawnEcho}
            className={`flex items-center space-x-3 px-4 py-2.5 rounded border transition-all ${
              hasEcho
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                : hasRecording
                ? 'bg-cyan-900/40 border-cyan-500/80 text-cyan-300 hover:bg-cyan-900/60'
                : 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <UserCheck
              size={18}
              className={hasEcho ? 'text-cyan-300' : hasRecording ? 'text-cyan-400' : 'text-slate-600'}
            />
            <div className="text-left font-mono">
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400">[E]</span>
                <span className="text-xs font-bold tracking-wider">
                  {hasEcho ? 'REPLAY ECHO' : 'SPAWN ECHO'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {hasEcho ? (hud.echoStatus === 'replaying' ? 'Replaying...' : 'Echo Holding') : 'Echo: 0/1'}
              </div>
            </div>
          </button>

          {/* [Q] Clear Echo Action */}
          {hasEcho && (
            <button
              onClick={onDismissEcho}
              title="Clear Echo [Q]"
              className="flex items-center space-x-1 px-3 py-2.5 rounded bg-slate-900 border border-slate-700 hover:border-purple-500 text-purple-300 hover:text-purple-200 transition-colors font-mono text-xs"
            >
              <XCircle size={15} />
              <span>[Q] CLEAR</span>
            </button>
          )}
        </div>

        {/* Flat control hints */}
        <div className="text-[11px] font-mono text-slate-500 text-center tracking-wider">
          <span>WASD: Move</span>
          <span className="mx-2 text-slate-700">·</span>
          <span className="text-cyan-400">R: Record</span>
          <span className="mx-2 text-slate-700">·</span>
          <span className="text-cyan-400">E: Echo</span>
          <span className="mx-2 text-slate-700">·</span>
          <span>Q: Clear</span>
          <span className="mx-2 text-slate-700">·</span>
          <span>T: Reset</span>
          <span className="mx-2 text-slate-700">·</span>
          <span>Esc: Pause</span>
        </div>
      </div>
    </div>
  );
};

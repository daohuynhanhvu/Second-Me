/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, RotateCcw, Home, Award } from 'lucide-react';

interface VictoryModalProps {
  levelName: string;
  levelSubtitle: string;
  elapsedTime: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onMainMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  levelName,
  levelSubtitle,
  elapsedTime,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onMainMenu,
}) => {
  const mins = Math.floor(elapsedTime / 60);
  const secs = Math.floor(elapsedTime % 60);
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 pointer-events-auto select-none">
      <div className="bg-slate-900 border border-emerald-500/70 rounded-xl p-8 max-w-md w-full text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.35)]">
        {/* Animated Trophy / Portal Emblem */}
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/80 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]">
          <Award size={32} />
        </div>

        <div>
          <div className="text-xs font-mono text-emerald-400 tracking-widest uppercase">
            TEMPORAL RIFT STABILIZED
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider mt-1">
            LEVEL COMPLETE
          </h2>
          <p className="text-sm text-slate-300 mt-1 font-mono">
            {levelName}: {levelSubtitle}
          </p>
        </div>

        {/* Run Stats */}
        <div className="bg-slate-950/80 border border-slate-800 rounded p-4 flex justify-around font-mono">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">CLEAR TIME</div>
            <div className="text-xl font-bold text-emerald-400 tabular-nums">
              {formattedTime}
            </div>
          </div>
          <div className="w-[1px] bg-slate-800" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">CHRONO SYNC</div>
            <div className="text-xl font-bold text-cyan-400">
              100%
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 font-mono">
          {hasNextLevel ? (
            <button
              data-start="true"
              onClick={onNextLevel}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] transform hover:scale-102"
            >
              <span>PROCEED TO NEXT SECTOR</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              data-start="true"
              onClick={onNextLevel}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <RotateCcw size={18} />
              <span>REPLAY SIMULATION</span>
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={onReplay}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center justify-center space-x-2 transition-colors text-xs"
            >
              <RotateCcw size={14} />
              <span>RETRY SECTOR</span>
            </button>

            <button
              onClick={onMainMenu}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center justify-center space-x-2 transition-colors text-xs"
            >
              <Home size={14} />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

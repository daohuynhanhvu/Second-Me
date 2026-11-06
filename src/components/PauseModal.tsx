/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 pointer-events-auto select-none">
      <div className="bg-slate-900 border border-cyan-500/60 rounded-xl p-8 max-w-sm w-full text-center space-y-6 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
        <div>
          <div className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
            CHRONAL STASIS
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wider mt-1">
            EXPERIMENT PAUSED
          </h2>
        </div>

        <div className="space-y-3 font-mono">
          <button
            onClick={onResume}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded flex items-center justify-center space-x-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            <Play size={16} fill="currentColor" />
            <span>RESUME [ESC]</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-amber-300 rounded border border-slate-700 flex items-center justify-center space-x-2 transition-colors"
          >
            <RotateCcw size={16} />
            <span>RESTART SECTOR [T]</span>
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-300 rounded border border-slate-700 flex items-center justify-center space-x-2 transition-colors"
          >
            <Home size={16} />
            <span>MAIN MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};

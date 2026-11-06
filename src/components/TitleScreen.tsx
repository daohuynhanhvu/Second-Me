/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, HelpCircle, Layers, Volume2, VolumeX } from 'lucide-react';
import { LEVELS } from '../game/logic/levels.ts';

interface TitleScreenProps {
  onStart: () => void;
  onSelectLevel: (idx: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onSelectLevel,
  isMuted,
  onToggleMute,
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-8 text-white select-none">
      {/* Top utility row */}
      <div className="w-full max-w-5xl flex justify-between items-center">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs tracking-widest bg-cyan-950/40 border border-cyan-800/50 px-3 py-1.5 rounded">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>TEMPORAL LAB SIMULATION v1.0</span>
        </div>

        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2.5 rounded bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 transition-colors pointer-events-auto"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Main Title Emblem & Actions */}
      <div className="flex flex-col items-center max-w-xl text-center space-y-8 my-auto">
        {/* Bespoke Sci-Fi SVG Logo Lockup */}
        <div className="relative flex flex-col items-center">
          <svg
            className="w-80 h-24 sm:w-96 sm:h-28"
            viewBox="0 0 400 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background geometric circuit grid */}
            <path
              d="M 20 60 H 120 L 140 30 H 260 L 280 60 H 380"
              stroke="#0e7490"
              strokeWidth="2"
              strokeDasharray="4 6"
              opacity="0.6"
            />
            {/* Ambient chronal rings */}
            <circle cx="200" cy="55" r="48" stroke="#0891b2" strokeWidth="1" opacity="0.3" />
            <circle cx="200" cy="55" r="32" stroke="#22d3ee" strokeWidth="1" strokeDasharray="6 4" opacity="0.5" />

            {/* Glowing Text "SECOND ME" */}
            <text
              x="200"
              y="58"
              textAnchor="middle"
              className="font-bold"
              fill="#ffffff"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '44px',
                fontWeight: 800,
                letterSpacing: '0.25em',
                filter: 'drop-shadow(0 0 16px rgba(34, 211, 238, 0.7))',
              }}
            >
              SECOND ME
            </text>

            {/* Sub-label */}
            <text
              x="200"
              y="86"
              textAnchor="middle"
              fill="#38bdf8"
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '12px',
                letterSpacing: '0.4em',
              }}
            >
              TEMPORAL PUZZLE EXPERIMENT
            </text>
          </svg>

          <p className="text-slate-400 font-mono text-sm tracking-widest mt-2">
            &ldquo;Your past is the key.&rdquo;
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center pointer-events-auto">
          <button
            data-start="true"
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold tracking-wider rounded border border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center justify-center space-x-2 transition-all transform hover:scale-105 active:scale-95"
          >
            <Play size={18} fill="currentColor" />
            <span>INITIALIZE EXPERIMENT</span>
          </button>

          <button
            onClick={() => setShowLevelSelect(true)}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 font-medium tracking-wider rounded border border-slate-700 hover:border-cyan-500/70 flex items-center justify-center space-x-2 transition-colors"
          >
            <Layers size={18} />
            <span>SECTORS</span>
          </button>

          <button
            onClick={() => setShowHowToPlay(true)}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 font-medium tracking-wider rounded border border-slate-700 hover:border-cyan-500/70 flex items-center justify-center space-x-2 transition-colors"
          >
            <HelpCircle size={18} />
            <span>HOW TO PLAY</span>
          </button>
        </div>
      </div>

      {/* Flat Bottom Control Hints */}
      <div className="w-full text-center text-xs font-mono text-slate-500 border-t border-slate-800/80 pt-3">
        <span>WASD / Arrows: Move</span>
        <span className="mx-2 text-slate-700">·</span>
        <span className="text-cyan-400/80">R: Record</span>
        <span className="mx-2 text-slate-700">·</span>
        <span className="text-cyan-400/80">E: Spawn Echo</span>
        <span className="mx-2 text-slate-700">·</span>
        <span>Q: Clear</span>
        <span className="mx-2 text-slate-700">·</span>
        <span>T: Reset</span>
        <span className="mx-2 text-slate-700">·</span>
        <span>Esc: Pause</span>
      </div>

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-lg max-w-lg w-full p-6 space-y-5 shadow-[0_0_30px_rgba(6,182,212,0.25)]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-cyan-400 tracking-wider">
                TEMPORAL PROTOCOL BRIEFING
              </h3>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-slate-400 hover:text-white font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-slate-300">
              <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded border border-slate-800">
                <span className="font-mono text-cyan-400 font-bold text-base">01</span>
                <div>
                  <strong className="text-white">Record Your Past:</strong> Press{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded border border-slate-700 font-mono text-xs">R</kbd>{' '}
                  to activate the chronal recorder. Move to a pressure plate, then press{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded border border-slate-700 font-mono text-xs">R</kbd>{' '}
                  again to seal the recording.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded border border-slate-800">
                <span className="font-mono text-cyan-400 font-bold text-base">02</span>
                <div>
                  <strong className="text-white">Summon Your Echo:</strong> Step away and press{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded border border-slate-700 font-mono text-xs">E</kbd>.
                  An Echo of yourself will replay your exact movements and stand on the pressure switch.
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded border border-slate-800">
                <span className="font-mono text-cyan-400 font-bold text-base">03</span>
                <div>
                  <strong className="text-white">Cooperate & Escape:</strong> While your Echo holds the switch, walk through the opened blast door and reach the green Temporal Exit!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded tracking-wider transition-colors"
            >
              UNDERSTOOD
            </button>
          </div>
        </div>
      )}

      {/* Level Select Modal */}
      {showLevelSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 pointer-events-auto">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-lg max-w-lg w-full p-6 space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.25)]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-cyan-400 tracking-wider">
                SELECT SECTOR
              </h3>
              <button
                onClick={() => setShowLevelSelect(false)}
                className="text-slate-400 hover:text-white font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {LEVELS.map((lvl, idx) => (
                <button
                  key={lvl.id}
                  onClick={() => {
                    onSelectLevel(idx);
                    setShowLevelSelect(false);
                  }}
                  className="w-full text-left p-3.5 bg-slate-950/60 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/60 rounded flex items-center justify-between transition-colors group"
                >
                  <div>
                    <div className="font-bold text-white group-hover:text-cyan-300 font-mono">
                      {lvl.name}: {lvl.subtitle}
                    </div>
                    <div className="text-xs text-slate-400 line-clamp-1">
                      {lvl.description}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 border border-cyan-800/80 px-2 py-1 rounded">
                    START
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

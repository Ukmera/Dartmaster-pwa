import React, { useState } from 'react';
import { Undo2, Check, Zap, Hash, CircleDot } from 'lucide-react';
import type { Multiplier, DartThrow } from '../../types/dart';

interface DartKeypadProps {
  onDartThrow: (sector: number, multiplier: Multiplier) => void;
  onQuickScore?: (score: number) => void;
  currentDarts: DartThrow[];
  canUndo: boolean;
  onUndo: () => void;
  showQuickScores?: boolean;
}

export const DartKeypad: React.FC<DartKeypadProps> = ({
  onDartThrow,
  onQuickScore,
  currentDarts,
  canUndo,
  onUndo,
  showQuickScores = true
}) => {
  const [multiplier, setMultiplier] = useState<Multiplier>(1);
  const [activeTab, setActiveTab] = useState<'keypad' | 'quick'>('keypad');
  const [customScoreInput, setCustomScoreInput] = useState<string>('');

  const handleNumberClick = (num: number) => {
    onDartThrow(num, multiplier);
    // Reset multiplier back to 1 for quick next throw
    setMultiplier(1);
  };

  const handleBullClick = (isDouble: boolean) => {
    if (multiplier === 3) return; // Triple Bull doesn't exist
    if (isDouble) {
      onDartThrow(25, 2); // 50 pts
    } else {
      onDartThrow(25, 1); // 25 pts
    }
    setMultiplier(1);
  };

  const handleMissClick = () => {
    onDartThrow(0, 0);
    setMultiplier(1);
  };

  const handleCustomScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customScoreInput, 10);
    if (!isNaN(val) && val >= 0 && val <= 180 && onQuickScore) {
      onQuickScore(val);
      setCustomScoreInput('');
    }
  };

  const quickScores = [26, 41, 45, 60, 81, 85, 100, 140, 180];

  return (
    <div className="w-full glass-panel rounded-3xl p-3 sm:p-4 border border-slate-700/80 shadow-2xl flex flex-col gap-3">
      {/* Current Turn Status & Undo */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Volée :</span>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((idx) => {
              const dart = currentDarts[idx];
              return (
                <div
                  key={idx}
                  className={`min-w-[46px] h-8 px-2 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                    dart
                      ? dart.multiplier === 3
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : dart.multiplier === 2
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : dart.sector === 0
                        ? 'bg-slate-800 border-slate-700 text-slate-500'
                        : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-500 border-dashed'
                  }`}
                >
                  {dart ? dart.label : `#${idx + 1}`}
                </div>
              );
            })}
          </div>
        </div>

        {/* Persistent Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Annuler le dernier coup"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            canUndo
              ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white active:scale-95 shadow-md'
              : 'bg-slate-800/30 border-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Annuler</span>
        </button>
      </div>

      {/* Tabs if Quick Scores available */}
      {showQuickScores && (
        <div className="flex rounded-xl bg-slate-950/60 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('keypad')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'keypad'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Clavier Flèche par Flèche</span>
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'quick'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Score Rapide (Volée)</span>
          </button>
        </div>
      )}

      {activeTab === 'keypad' ? (
        <>
          {/* Multiplier Selectors (Simple, Double, Triple) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMultiplier(1)}
              className={`py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide border transition-all active:scale-95 ${
                multiplier === 1
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg glow-emerald'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              SIMPLE (1x)
            </button>
            <button
              onClick={() => setMultiplier(2)}
              className={`py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide border transition-all active:scale-95 ${
                multiplier === 2
                  ? 'bg-rose-600 border-rose-400 text-white shadow-lg glow-rose'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              DOUBLE (2x)
            </button>
            <button
              onClick={() => setMultiplier(3)}
              className={`py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide border transition-all active:scale-95 ${
                multiplier === 3
                  ? 'bg-amber-600 border-amber-400 text-white shadow-lg glow-amber'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              TRIPLE (3x)
            </button>
          </div>

          {/* Numbers Grid (1 to 20) */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((num) => {
              const previewPoints = num * multiplier;
              return (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className={`h-11 sm:h-13 rounded-2xl flex flex-col items-center justify-center font-black transition-all active:scale-95 border ${
                    multiplier === 3
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200 hover:bg-amber-900/40'
                      : multiplier === 2
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-200 hover:bg-rose-900/40'
                      : 'bg-slate-800/90 border-slate-700 text-white hover:bg-slate-750 hover:border-slate-600'
                  }`}
                >
                  <span className="text-base sm:text-lg leading-none">{num}</span>
                  {multiplier > 1 && (
                    <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                      ={previewPoints}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Special Targets: Bull 25, Bullseye 50, Miss 0 */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => handleBullClick(false)}
              disabled={multiplier === 3}
              className={`h-11 sm:h-12 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                multiplier === 3
                  ? 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
                  : 'bg-emerald-950/40 border-emerald-500/50 hover:bg-emerald-900/50 text-emerald-300'
              }`}
            >
              <CircleDot className="w-4 h-4 text-emerald-400" />
              <span>Bull (25)</span>
            </button>

            <button
              onClick={() => handleBullClick(true)}
              disabled={multiplier === 3}
              className={`h-11 sm:h-12 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                multiplier === 3
                  ? 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
                  : 'bg-rose-950/40 border-rose-500/50 hover:bg-rose-900/50 text-rose-300 shadow-lg glow-rose'
              }`}
            >
              <CircleDot className="w-4 h-4 text-rose-400 fill-rose-500/30" />
              <span>D-Bull (50)</span>
            </button>

            <button
              onClick={handleMissClick}
              className="h-11 sm:h-12 rounded-2xl bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center active:scale-95 transition-all"
            >
              <span>Manqué (0)</span>
            </button>
          </div>
        </>
      ) : (
        /* Quick Scores Tab */
        <div className="flex flex-col gap-3 py-1">
          {currentDarts.length > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-between">
              <span>⚠️ Volée en cours ({currentDarts.length} flèche{currentDarts.length > 1 ? 's' : ''})</span>
              <span className="text-[11px] text-amber-200">Sera remplacée par le score rapide</span>
            </div>
          )}

          {/* Custom Score Form */}
          <form onSubmit={handleCustomScoreSubmit} className="flex gap-2">
            <input
              type="number"
              min="0"
              max="180"
              placeholder="Score de la volée (0-180)..."
              value={customScoreInput}
              onChange={(e) => setCustomScoreInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!customScoreInput}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Valider</span>
            </button>
          </form>

          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-2">
            {quickScores.map((score) => (
              <button
                key={score}
                onClick={() => onQuickScore && onQuickScore(score)}
                className={`py-3 rounded-2xl font-black text-base border transition-all active:scale-95 ${
                  score === 180
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-400 shadow-lg glow-amber'
                    : score >= 100
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                    : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-750'
                }`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Target, RotateCcw } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { usePlayers } from '../../context/PlayerContext';
import { Modal } from '../common/Modal';
import type { Multiplier } from '../../types/dart';
import type { Player } from '../../types/player';
import { getActiveCricketTargets, calculateMPR } from '../../utils/dartCalculations';

export const CricketGame: React.FC = () => {
  const {
    currentPlayerIndex,
    currentDarts,
    cricketStates,
    cricketConfig,
    canUndo,
    pendingCricketChoice,
    resolveCricketChoice,
    recordDirectCricketMark,
    recordDart,
    undoLastAction
  } = useGame();

  const { players, selectedPlayerIds } = usePlayers();
  const activePlayers = selectedPlayerIds
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => !!p);
  const currentPlayer = activePlayers[currentPlayerIndex];

  const [selectedMultiplier, setSelectedMultiplier] = useState<Multiplier>(1);

  const activeTargets = getActiveCricketTargets(cricketConfig);

  // Render Mark Icon: 1 = '/', 2 = 'X', 3+ = '⨂'
  const renderMark = (count: number) => {
    if (!count || count <= 0) return <span className="text-slate-700 font-mono">-</span>;
    if (count === 1) return <span className="text-emerald-400 font-bold text-base leading-none">/</span>;
    if (count === 2) return <span className="text-amber-400 font-black text-base leading-none">✕</span>;
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/40">
        ⨂
      </span>
    );
  };

  const handleTargetClick = (target: number | string) => {
    if (target === 'D' || target === 'T') {
      recordDirectCricketMark(target);
    } else if (target === 25 || target === '25') {
      if (selectedMultiplier === 3) return;
      recordDart(25, selectedMultiplier);
    } else {
      recordDart(Number(target), selectedMultiplier);
    }
    setSelectedMultiplier(1);
  };

  return (
    <div className="flex flex-col gap-2 max-w-5xl mx-auto">
      {/* Game Mode Header Banner */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-2xl glass-panel border border-slate-800">
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">
            Cricket {cricketConfig.cutThroat ? '(Cut-Throat)' : 'Standard'}
            {cricketConfig.includeDoublesTriples && ` • ${cricketConfig.doublesTriplesMode === 'in_sector' ? 'Avec Secteur' : 'Hors Secteur'}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Tour :</span>
          <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            {currentPlayer?.avatar} {currentPlayer?.name}
          </span>
        </div>
      </div>

      {/* Cricket Scoreboard Grid (Chalkboard) */}
      <div className="glass-panel rounded-3xl p-2.5 sm:p-3 border border-slate-700/80 shadow-xl overflow-x-auto">
        <table className="w-full text-center border-collapse min-w-[300px]">
          <thead>
            <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
              {activePlayers.map((player, idx) => {
                const isActive = idx === currentPlayerIndex;
                const state = cricketStates[player.id];
                const mpr = state ? calculateMPR(state.totalMarks, state.dartsThrown) : 0;

                return (
                  <React.Fragment key={player.id}>
                    <th
                      className={`p-1.5 transition-all ${
                        state?.hasFinished
                          ? 'bg-amber-950/20 text-amber-300'
                          : isActive
                          ? 'bg-emerald-950/40 text-emerald-300 font-bold rounded-t-xl'
                          : 'text-slate-300'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <span className="text-sm">{player.avatar}</span>
                          {state?.finishRank && (
                            <span className="absolute -top-2 -right-3 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black shadow-md">
                              #{state.finishRank}
                            </span>
                          )}
                        </div>
                        <span className="truncate max-w-[70px] font-bold text-[11px]">{player.name}</span>
                        <span className="text-lg sm:text-xl font-black text-white mt-0.5">
                          {state?.points || 0}
                        </span>
                        <span className="text-[9px] text-slate-400 font-normal">
                          {mpr} MPR
                        </span>
                      </div>
                    </th>
                    {idx === 0 && activePlayers.length > 1 && (
                      <th className="w-14 p-1 text-slate-500 font-black text-xs uppercase">Cible</th>
                    )}
                  </React.Fragment>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {activeTargets.map((target) => {
              const targetKey = String(target);
              const isDTLine = target === 'D' || target === 'T';

              return (
                <tr
                  key={targetKey}
                  className={`border-b border-slate-800/60 hover:bg-slate-800/20 ${
                    isDTLine ? 'bg-slate-950/40 font-semibold' : ''
                  }`}
                >
                  {activePlayers.map((player, idx) => {
                    const state = cricketStates[player.id];
                    const marks = state?.marks[targetKey] || 0;
                    const isActive = idx === currentPlayerIndex;

                    return (
                      <React.Fragment key={player.id}>
                        <td
                          className={`py-1.5 px-1 transition-colors ${
                            isActive ? 'bg-emerald-950/20 font-bold' : ''
                          }`}
                        >
                          {renderMark(marks)}
                        </td>
                        {idx === 0 && activePlayers.length > 1 && (
                          <td className="py-1 px-1">
                            <button
                              onClick={() => handleTargetClick(target)}
                              className={`w-10 h-7 mx-auto rounded-lg border hover:bg-emerald-600 hover:text-white font-black text-xs shadow active:scale-95 transition-all flex items-center justify-center ${
                                isDTLine
                                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                                  : 'bg-slate-800/90 border-slate-700 text-white'
                              }`}
                            >
                              {target === 25 || target === '25' ? 'B' : target}
                            </button>
                          </td>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cricket Input Panel */}
      <div className="glass-panel rounded-3xl p-2.5 sm:p-3 border border-slate-700/80 shadow-xl flex flex-col gap-2.5">
        {/* Volée & Vibrant Undo */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Volée :</span>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((idx) => {
                const dart = currentDarts[idx];
                return (
                  <div
                    key={idx}
                    className={`min-w-[42px] sm:min-w-[46px] h-7 sm:h-8 px-2 rounded-xl flex items-center justify-center font-bold text-xs border transition-all ${
                      dart
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-600 border-dashed'
                    }`}
                  >
                    {dart ? dart.label : `#${idx + 1}`}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={undoLastAction}
            disabled={!canUndo}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all active:scale-95 ${
              canUndo
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 border-amber-300 shadow-lg glow-amber cursor-pointer'
                : 'bg-slate-900/80 border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Annuler (Undo)</span>
          </button>
        </div>

        {/* Multiplier Selector */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setSelectedMultiplier(1)}
            className={`py-1.5 rounded-xl font-bold text-xs tracking-wide border transition-all ${
              selectedMultiplier === 1
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg glow-emerald'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
          >
            SIMPLE (1x)
          </button>
          <button
            onClick={() => setSelectedMultiplier(2)}
            className={`py-1.5 rounded-xl font-bold text-xs tracking-wide border transition-all ${
              selectedMultiplier === 2
                ? 'bg-rose-600 border-rose-400 text-white shadow-lg glow-rose'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
          >
            DOUBLE (2x)
          </button>
          <button
            onClick={() => setSelectedMultiplier(3)}
            className={`py-1.5 rounded-xl font-bold text-xs tracking-wide border transition-all ${
              selectedMultiplier === 3
                ? 'bg-amber-600 border-amber-400 text-white shadow-lg glow-amber'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
          >
            TRIPLE (3x)
          </button>
        </div>

        {/* Quick Targets Touch Buttons */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {activeTargets.map((target) => {
            const isBull = target === 25 || target === '25';
            const isDTLine = target === 'D' || target === 'T';
            const isTripleBullDisabled = isBull && selectedMultiplier === 3;

            return (
              <button
                key={String(target)}
                disabled={isTripleBullDisabled}
                onClick={() => handleTargetClick(target)}
                className={`py-2 rounded-2xl border font-black text-base shadow-md active:scale-95 transition-all flex flex-col items-center justify-center ${
                  isTripleBullDisabled
                    ? 'bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
                    : isDTLine
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                    : 'bg-slate-800 border-slate-700 hover:bg-emerald-600 hover:border-emerald-400 text-white'
                }`}
              >
                <span>{isBull ? 'BULL' : target}</span>
                <span className="text-[9px] text-slate-400 font-normal">
                  {isDTLine ? 'Direct' : selectedMultiplier > 1 && !isBull ? `x${selectedMultiplier}` : '+1'}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => recordDart(0, 0)}
            className="py-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 font-bold text-xs col-span-2 sm:col-span-1 active:scale-95 transition-all"
          >
            Manqué
          </button>
        </div>
      </div>

      {/* Choice Modal when hitting a Double / Triple on an open number */}
      {pendingCricketChoice && (
        <Modal
          isOpen={true}
          onClose={() => resolveCricketChoice('number')}
          title="Choix d'affectation de la fléchette"
          maxWidth="max-w-md"
        >
          <div className="space-y-3 text-center py-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-xl font-black">
              {pendingCricketChoice.multiplier === 2 ? 'D' : 'T'}{pendingCricketChoice.sector === 25 ? 'Bull' : pendingCricketChoice.sector}
            </div>

            <div>
              <h3 className="text-base font-black text-white">
                Où souhaitez-vous placer cette fléchette ?
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                La ligne <strong>{pendingCricketChoice.multiplier === 2 ? 'Double (D)' : 'Triple (T)'}</strong> n'est pas encore complétée.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => resolveCricketChoice('line')}
                className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/50 hover:bg-amber-900/50 text-white font-bold text-xs shadow-md transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95"
              >
                <span className="text-amber-400 font-black text-base">
                  Ligne {pendingCricketChoice.multiplier === 2 ? 'Double (D)' : 'Triple (T)'}
                </span>
                <span className="text-[10px] text-slate-300">+1 marque sur la ligne {pendingCricketChoice.multiplier === 2 ? 'D' : 'T'}</span>
              </button>

              <button
                onClick={() => resolveCricketChoice('number')}
                className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 hover:bg-emerald-900/50 text-white font-bold text-xs shadow-md transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95"
              >
                <span className="text-emerald-400 font-black text-base">
                  Numéro {pendingCricketChoice.sector === 25 ? 'Bull' : pendingCricketChoice.sector}
                </span>
                <span className="text-[10px] text-slate-300">
                  +1 marque sur {pendingCricketChoice.sector === 25 ? 'Bull' : pendingCricketChoice.sector}
                </span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

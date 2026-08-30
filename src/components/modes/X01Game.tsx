import React from 'react';
import { TrendingUp, History } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { usePlayers } from '../../context/PlayerContext';
import { DartKeypad } from '../game/DartKeypad';
import { CheckoutGuide } from '../game/CheckoutGuide';
import { calculate3DartAverage } from '../../utils/dartCalculations';
import type { Player } from '../../types/player';

export const X01Game: React.FC = () => {
  const {
    currentPlayerIndex,
    currentDarts,
    x01States,
    canUndo,
    recordDart,
    recordQuickScore,
    undoLastAction
  } = useGame();

  const { players, selectedPlayerIds } = usePlayers();
  const activePlayers = selectedPlayerIds
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => !!p);
  const currentPlayer = activePlayers[currentPlayerIndex];
  const currentPlayerState = currentPlayer ? x01States[currentPlayer.id] : null;

  return (
    <div className="flex flex-col gap-2 max-w-5xl mx-auto">
      {/* Player Score Cards Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {activePlayers.map((player, idx) => {
          const isActive = idx === currentPlayerIndex;
          const state = x01States[player.id];
          const score = state ? state.currentScore : 501;
          const avg = state ? calculate3DartAverage(state.totalScoreScored, state.dartsThrown) : 0;
          const lastTurn = state?.turns[state.turns.length - 1];

          return (
            <div
              key={player.id}
              className={`p-2.5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-900 border-emerald-500/80 shadow-xl glow-emerald active-player-glow'
                  : 'bg-slate-900/60 border-slate-800 opacity-80'
              }`}
            >
              {/* Player Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="text-lg">{player.avatar}</span>
                  <span className="font-bold text-xs sm:text-sm text-white truncate">{player.name}</span>
                </div>
                {isActive && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                )}
              </div>

              {/* Big Score Display */}
              <div className="my-1 text-center">
                <span className={`text-3xl sm:text-4xl font-black tracking-tight ${
                  score <= 170 && score > 0 ? 'text-emerald-400' : 'text-white'
                }`}>
                  {score}
                </span>
                {lastTurn && (
                  <p className="text-[10px] text-slate-400 font-medium">
                    Dernière : <span className={lastTurn.isBust ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {lastTurn.isBust ? 'BUST' : `+${lastTurn.totalScore}`}
                    </span>
                  </p>
                )}
              </div>

              {/* Stats Footer */}
              <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  Moy. {avg}
                </span>
                <span>{state?.dartsThrown || 0} flèches</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Guide for Active Player */}
      {currentPlayerState && currentPlayerState.currentScore <= 170 && (
        <CheckoutGuide remainingScore={currentPlayerState.currentScore} />
      )}

      {/* Main Scoring Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-start">
        {/* Left / Center Keypad */}
        <div className="lg:col-span-8">
          <DartKeypad
            onDartThrow={recordDart}
            onQuickScore={recordQuickScore}
            currentDarts={currentDarts}
            canUndo={canUndo}
            onUndo={undoLastAction}
            showQuickScores={true}
          />
        </div>

        {/* Right Turn History (Volées) */}
        <div className="hidden lg:flex lg:col-span-4 glass-panel rounded-3xl p-3 border border-slate-700/80 shadow-xl flex-col max-h-[380px]">
          <div className="flex items-center gap-2 pb-1.5 border-b border-slate-800 text-slate-300">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Historique des volées</h3>
          </div>

          <div className="overflow-y-auto space-y-1.5 pt-1.5 pr-1 flex-1">
            {currentPlayerState && currentPlayerState.turns.length > 0 ? (
              [...currentPlayerState.turns].reverse().map((turn, i) => (
                <div
                  key={turn.id || i}
                  className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                    turn.isBust
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      : turn.totalScore >= 100
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                      : 'bg-slate-900/90 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-semibold text-slate-400">Tour #{turn.roundIndex}</span>
                    <div className="flex gap-1 mt-0.5">
                      {turn.throws.map((d, dIdx) => (
                        <span key={dIdx} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                          {d.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm text-white">
                      {turn.isBust ? 'BUST' : `+${turn.totalScore}`}
                    </div>
                    <div className="text-[10px] text-slate-400">Reste: {turn.scoreAfter}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                Aucune volée enregistrée
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

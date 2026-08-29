import React, { useState } from 'react';
import { Crown, Skull, Shuffle, Undo2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { usePlayers } from '../../context/PlayerContext';
import type { Multiplier } from '../../types/dart';

// Component to draw the dynamic 'K' (1 = |, 2 = |\, 3 = K)
const LetterKVisualizer: React.FC<{ lives: number; isKing: boolean; isEliminated: boolean }> = ({
  lives,
  isKing,
  isEliminated
}) => {
  if (isEliminated) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-center text-rose-400">
        <Skull className="w-6 h-6" />
      </div>
    );
  }

  if (lives < 0) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-500 flex flex-col items-center justify-center text-rose-400 shadow-md animate-pulse">
        <span className="text-xs font-black">VIES</span>
        <span className="text-sm font-black text-white">{lives}</span>
      </div>
    );
  }

  // Draw SVG K with strokes based on lives (0, 1, 2, 3)
  const hasStroke1 = lives >= 1;
  const hasStroke2 = lives >= 2;
  const hasStroke3 = lives >= 3;

  return (
    <div
      className={`w-12 h-12 rounded-2xl p-1.5 flex items-center justify-center border transition-all ${
        isKing
          ? 'bg-amber-950/40 border-amber-400 shadow-lg glow-amber'
          : lives > 0
          ? 'bg-slate-900 border-emerald-500/50'
          : 'bg-slate-950/60 border-slate-800 opacity-60'
      }`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Ghost background K */}
        <g stroke="#334155" strokeWidth="12" strokeLinecap="round" opacity="0.3">
          <line x1="25" y1="15" x2="25" y2="85" />
          <line x1="25" y1="50" x2="75" y2="15" />
          <line x1="25" y1="50" x2="75" y2="85" />
        </g>

        {/* 1st Stroke: Vertical Line (|) */}
        {hasStroke1 && (
          <line
            x1="25"
            y1="15"
            x2="25"
            y2="85"
            stroke={isKing ? '#fbbf24' : '#34d399'}
            strokeWidth="14"
            strokeLinecap="round"
          />
        )}

        {/* 2nd Stroke: Upper Diagonal (\) */}
        {hasStroke2 && (
          <line
            x1="25"
            y1="50"
            x2="75"
            y2="15"
            stroke={isKing ? '#fbbf24' : '#34d399'}
            strokeWidth="14"
            strokeLinecap="round"
          />
        )}

        {/* 3rd Stroke: Lower Diagonal (/) */}
        {hasStroke3 && (
          <line
            x1="25"
            y1="50"
            x2="75"
            y2="85"
            stroke="#fbbf24"
            strokeWidth="14"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};

export const KingGame: React.FC = () => {
  const {
    currentPlayerIndex,
    currentDarts,
    kingStates,
    canUndo,
    recordDart,
    undoLastAction,
    assignKingNumber,
    autoAssignKingNumbers
  } = useGame();

  const { players, selectedPlayerIds } = usePlayers();
  const activePlayers = players.filter((p) => selectedPlayerIds.includes(p.id));
  const currentPlayer = activePlayers[currentPlayerIndex];
  const curState = currentPlayer ? kingStates[currentPlayer.id] : null;

  const [selectedMultiplier, setSelectedMultiplier] = useState<Multiplier>(1);
  const [assigningPlayerId, setAssigningPlayerId] = useState<string | null>(null);

  // Check if any player still lacks an assigned number
  const unassignedPlayer = activePlayers.find((p) => !kingStates[p.id]?.assignedNumber);

  // Assignment / Tir Main Faible screen (includes 1-20 and Bull 25)
  if (unassignedPlayer) {
    const activeAssignee = assigningPlayerId
      ? activePlayers.find((p) => p.id === assigningPlayerId) || unassignedPlayer
      : unassignedPlayer;

    const assignedNumbers = activePlayers
      .map((p) => kingStates[p.id]?.assignedNumber)
      .filter(Boolean) as number[];

    const allAssignableTargets = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25
    ];

    return (
      <div className="max-w-2xl mx-auto glass-panel rounded-3xl p-5 border border-slate-700/80 shadow-2xl space-y-5">
        <div className="text-center space-y-1">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
            <Crown className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Attribution des Numéros King</h2>
          <p className="text-xs text-slate-400">
            Chaque joueur doit obtenir son numéro de 1 à 20 ou le <strong>Centre (Bull/25)</strong> par tir main faible.
          </p>
        </div>

        {/* Current Player Assigning Box */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl">{activeAssignee.avatar}</span>
            <span className="text-lg font-black text-white">{activeAssignee.name}</span>
          </div>
          <p className="text-xs text-emerald-400 font-semibold">
            🎯 Effectuez le tir main faible et sélectionnez le numéro touché :
          </p>

          {/* Numbers 1-20 Grid + Bull */}
          <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 pt-2">
            {allAssignableTargets.map((num) => {
              const isTaken = assignedNumbers.includes(num);
              const owner = isTaken ? activePlayers.find((p) => kingStates[p.id]?.assignedNumber === num) : null;

              return (
                <button
                  key={num}
                  disabled={isTaken}
                  onClick={() => {
                    assignKingNumber(activeAssignee.id, num);
                    setAssigningPlayerId(null);
                  }}
                  className={`h-12 rounded-xl font-black text-base flex flex-col items-center justify-center border transition-all ${
                    isTaken
                      ? 'bg-slate-950/60 border-slate-800 text-slate-600 cursor-not-allowed'
                      : num === 25
                      ? 'bg-rose-950/40 border-rose-500 text-rose-300 hover:bg-rose-900/60 active:scale-95'
                      : 'bg-slate-800 border-slate-600 text-white hover:bg-emerald-600 hover:border-emerald-400 active:scale-95'
                  }`}
                >
                  <span>{num === 25 ? 'BULL' : num}</span>
                  {owner && (
                    <span className="text-[9px] text-slate-400 truncate max-w-[40px]">
                      {owner.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto Assign button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={autoAssignKingNumbers}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors"
          >
            <Shuffle className="w-4 h-4 text-amber-400" />
            <span>Tirage Aléatoire Rapide pour tous</span>
          </button>
        </div>
      </div>
    );
  }

  // Active King Gameplay View
  const anyKingActive = Object.values(kingStates).some((s) => s.isKing && !s.isEliminated);

  return (
    <div className="flex flex-col gap-3 max-w-5xl mx-auto">
      {/* Active player in danger alert */}
      {curState?.isInDanger && !curState.isEliminated && anyKingActive && (
        <div className="px-4 py-2.5 rounded-2xl bg-rose-950/70 border border-rose-500 text-rose-200 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 text-xs font-bold">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span>⚠️ DROIT DE RÉPONSE EN COURS : Vous êtes à {curState.lives} vie(s) ! Visez votre numéro (#{curState.assignedNumber === 25 ? 'BULL' : curState.assignedNumber}) pour remonter à au moins 1 vie.</span>
          </div>
        </div>
      )}

      {/* Player Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {activePlayers.map((player, idx) => {
          const state = kingStates[player.id];
          const isActive = idx === currentPlayerIndex;
          const isEliminated = state?.isEliminated;
          const isKing = state?.isKing;
          const lives = state?.lives || 0;

          return (
            <div
              key={player.id}
              className={`p-4 rounded-3xl border transition-all relative flex flex-col justify-between ${
                isEliminated
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-40'
                  : isActive
                  ? 'bg-slate-900 border-amber-500/80 shadow-xl glow-amber active-player-glow'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              {/* Header with Name, Avatar & Letter K Visualizer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="relative">
                    <span className="text-2xl">{player.avatar}</span>
                    {isKing && !isEliminated && (
                      <span className="absolute -top-2 -right-2 text-sm animate-bounce">👑</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white flex items-center gap-1.5">
                      {player.name}
                      {isKing && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          KING
                        </span>
                      )}
                    </h3>
                    <span className="text-xs font-black text-amber-400">
                      Cible : #{state?.assignedNumber === 25 ? 'BULL' : state?.assignedNumber || '?'}
                    </span>
                  </div>
                </div>

                {/* The Letter K Drawing */}
                <LetterKVisualizer lives={lives} isKing={!!isKing} isEliminated={!!isEliminated} />
              </div>

              {/* Status Bar */}
              <div className="my-3 py-2 px-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                {isEliminated ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <Skull className="w-3.5 h-3.5" /> Éliminé
                  </span>
                ) : isKing ? (
                  <span className="text-amber-300 font-black flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> King Actif (3/3 Vies)
                  </span>
                ) : lives <= 0 ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> En sursis ({lives} vies)
                  </span>
                ) : (
                  <span className="text-slate-300 font-semibold">
                    K en cours : {lives}/3 touches
                  </span>
                )}

                <span className="text-slate-400 font-mono text-[11px]">
                  {lives} vie{Math.abs(lives) > 1 ? 's' : ''}
                </span>
              </div>

              {/* Turn indicator */}
              {isActive && !isEliminated && (
                <div className="text-[11px] font-bold text-emerald-400 text-center uppercase tracking-wider">
                  ▶ Tour en cours ({3 - currentDarts.length} flèches)
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* King Action Panel */}
      <div className="glass-panel rounded-3xl p-3 sm:p-4 border border-slate-700/80 shadow-2xl flex flex-col gap-3">
        {/* Volée & Undo */}
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
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-500 border-dashed'
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              canUndo
                ? 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 active:scale-95'
                : 'bg-slate-800/30 border-slate-800 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Annuler</span>
          </button>
        </div>

        {/* Multiplier Selectors */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setSelectedMultiplier(1)}
            className={`py-2 rounded-xl font-bold text-xs tracking-wide border transition-all ${
              selectedMultiplier === 1
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg glow-emerald'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
          >
            SIMPLE (1x)
          </button>
          <button
            onClick={() => setSelectedMultiplier(2)}
            className={`py-2 rounded-xl font-bold text-xs tracking-wide border transition-all ${
              selectedMultiplier === 2
                ? 'bg-rose-600 border-rose-400 text-white shadow-lg glow-rose'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
          >
            DOUBLE (2x)
          </button>
          <button
            onClick={() => setSelectedMultiplier(3)}
            className={`py-2 rounded-xl font-bold text-xs tracking-wide border transition-all ${
              selectedMultiplier === 3
                ? 'bg-amber-600 border-amber-400 text-white shadow-lg glow-amber'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }`}
          >
            TRIPLE (3x)
          </button>
        </div>

        {/* Attack / Qualification Targets */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            {curState?.isKing
              ? '👑 Cibles disponibles pour attaque (K actifs) :'
              : `🎯 Touchez votre numéro (#${curState?.assignedNumber === 25 ? 'BULL' : curState?.assignedNumber}) pour compléter le K :`}
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {activePlayers.map((player) => {
              const pSt = kingStates[player.id];
              const isSelf = player.id === currentPlayer?.id;
              const isEliminated = pSt?.isEliminated;
              const targetNum = pSt?.assignedNumber;

              if (!targetNum) return null;

              const isTargetBull = targetNum === 25;
              const isTripleBullDisabled = isTargetBull && selectedMultiplier === 3;

              return (
                <button
                  key={player.id}
                  disabled={isEliminated || isTripleBullDisabled}
                  onClick={() => recordDart(targetNum, selectedMultiplier)}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all active:scale-95 ${
                    isEliminated || isTripleBullDisabled
                      ? 'bg-slate-950/40 border-slate-800 opacity-40 cursor-not-allowed'
                      : isSelf
                      ? 'bg-emerald-950/30 border-emerald-500/50 hover:bg-emerald-900/40 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-500/50 hover:bg-rose-900/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-lg">{player.avatar}</span>
                    <div className="text-left truncate">
                      <div className="text-xs font-bold truncate">
                        {isSelf ? 'Moi (K)' : player.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isSelf ? `${pSt?.lives}/3 K` : `${pSt?.lives} vies`}
                      </div>
                    </div>
                  </div>

                  <span className="w-10 h-9 rounded-xl bg-slate-800 font-black text-sm text-white flex items-center justify-center shadow-md">
                    {targetNum === 25 ? 'BULL' : targetNum}
                  </span>
                </button>
              );
            })}

            {/* Miss Button */}
            <button
              onClick={() => recordDart(0, 0)}
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 font-bold text-xs flex items-center justify-center col-span-2 sm:col-span-1 active:scale-95 transition-all"
            >
              Manqué (0)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Trophy, RotateCcw, Home, Play } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useGame } from '../../context/GameContext';
import { usePlayers } from '../../context/PlayerContext';
import { calculate3DartAverage, calculateMPR } from '../../utils/dartCalculations';

interface MatchWinnerModalProps {
  isOpen: boolean;
  isPodium?: boolean;
  onNewGame: () => void;
  onHome: () => void;
  onContinueMatch?: () => void;
}

export const MatchWinnerModal: React.FC<MatchWinnerModalProps> = ({
  isOpen,
  isPodium = false,
  onNewGame,
  onHome,
  onContinueMatch
}) => {
  const { mode, winnerId, roundIndex, x01States, cricketStates, kingStates, podiumWinners } = useGame();
  const { players, selectedPlayerIds } = usePlayers();

  const winner = players.find((p) => p.id === winnerId);
  const activePlayers = players.filter((p) => selectedPlayerIds.includes(p.id));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onHome}
      title={isPodium ? '1ère Place Validée !' : 'Partie Terminée !'}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center text-center space-y-4 py-2">
        {/* Trophy & Winner Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-1 shadow-2xl glow-amber flex items-center justify-center animate-bounce">
            <span className="text-5xl">{winner?.avatar || '🏆'}</span>
          </div>
          <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
            👑
          </div>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1">
            <Trophy className="w-4 h-4" /> {isPodium ? 'Vainqueur de la 1ère place' : 'Vainqueur du Match'}
          </span>
          <h3 className="text-2xl font-black text-white mt-0.5">{winner?.name || 'Joueur'}</h3>
          <p className="text-xs text-slate-400 mt-1">
            Mode {mode.toUpperCase()} • {roundIndex} volées jouées
          </p>
        </div>

        {/* Match Recap Table */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-3 text-left space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            {podiumWinners.length > 0 ? 'Classement du match' : 'Statistiques du match'}
          </h4>

          <div className="space-y-1.5">
            {activePlayers.map((player) => {
              const isWin = player.id === winnerId;
              const podiumEntry = podiumWinners.find((p) => p.playerId === player.id);
              let statLabel = '';
              let statValue = '';

              if (mode === '301' || mode === '501' || mode === '701') {
                const state = x01States[player.id];
                const avg = state ? calculate3DartAverage(state.totalScoreScored, state.dartsThrown) : 0;
                statLabel = 'Moyenne 3 Flèches';
                statValue = `${avg} pts`;
              } else if (mode === 'cricket') {
                const state = cricketStates[player.id];
                const mpr = state ? calculateMPR(state.totalMarks, state.dartsThrown) : 0;
                statLabel = 'Points & MPR';
                statValue = `${state?.points || 0} pts (${mpr} MPR)`;
              } else if (mode === 'king') {
                const state = kingStates[player.id];
                statLabel = 'Statut';
                statValue = state?.isEliminated ? '💀 Éliminé' : `${state?.lives} vies (${state?.kills || 0} kills)`;
              }

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2 rounded-xl border ${
                    podiumEntry?.rank === 1 || isWin
                      ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      : podiumEntry?.rank === 2
                      ? 'bg-slate-800 border-slate-600 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{player.avatar}</span>
                    <span className="text-sm font-bold">{player.name}</span>
                    {podiumEntry?.rank && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        #{podiumEntry.rank}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">{statValue}</div>
                    <div className="text-[10px] text-slate-400">{statLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2 pt-2">
          {isPodium && onContinueMatch && (
            <button
              onClick={onContinueMatch}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg glow-emerald transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Continuer la partie (pour les places suivantes)</span>
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={onHome}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Menu Principal</span>
            </button>

            <button
              onClick={onNewGame}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rejouer</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

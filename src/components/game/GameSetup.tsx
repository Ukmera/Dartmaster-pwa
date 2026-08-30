import React, { useState } from 'react';
import { Play, Sparkles, Plus, Check, Shuffle, PlayCircle, Trash2 } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { usePlayers } from '../../context/PlayerContext';
import type { GameMode } from '../../types/game';

interface GameSetupProps {
  onManagePlayers: () => void;
}

export const GameSetup: React.FC<GameSetupProps> = ({ onManagePlayers }) => {
  const {
    mode,
    setMode,
    x01Config,
    setX01Config,
    cricketConfig,
    setCricketConfig,
    kingConfig,
    setKingConfig,
    hasSavedSession,
    savedSessionSummary,
    resumeSavedSession,
    discardSavedSession,
    startNewGame
  } = useGame();

  const { players, selectedPlayerIds, togglePlayerSelection, shuffleSelectedPlayers } = usePlayers();
  const activePlayers = selectedPlayerIds
    .map((id) => players.find((p) => p.id === id))
    .filter((p) => !!p);

  const currentLegsToWin =
    mode === 'cricket'
      ? cricketConfig.legsToWin
      : mode === 'king'
      ? kingConfig.legsToWin
      : x01Config.legsToWin;

  const [isCustomLegs, setIsCustomLegs] = useState<boolean>(![1, 2, 3, 5].includes(currentLegsToWin));

  const handleLegsChange = (valStr: string) => {
    if (valStr === 'custom') {
      setIsCustomLegs(true);
    } else {
      setIsCustomLegs(false);
      const val = parseInt(valStr, 10);
      if (mode === 'cricket') setCricketConfig((p) => ({ ...p, legsToWin: val }));
      else if (mode === 'king') setKingConfig((p) => ({ ...p, legsToWin: val }));
      else setX01Config((p) => ({ ...p, legsToWin: val }));
    }
  };

  const handleCustomLegsInput = (customVal: number) => {
    const clamped = Math.max(1, Math.min(25, customVal || 1));
    if (mode === 'cricket') setCricketConfig((p) => ({ ...p, legsToWin: clamped }));
    else if (mode === 'king') setKingConfig((p) => ({ ...p, legsToWin: clamped }));
    else setX01Config((p) => ({ ...p, legsToWin: clamped }));
  };

  const gameModes: { id: GameMode; title: string; subtitle: string; icon: string }[] = [
    {
      id: '501',
      title: '501',
      subtitle: 'Classique tournoi avec décompte',
      icon: '🎯'
    },
    {
      id: '301',
      title: '301',
      subtitle: 'Partie rapide et nerveuse',
      icon: '⚡'
    },
    {
      id: 'cricket',
      title: 'Cricket',
      subtitle: '15 à 20 + Bull, D/T & Cut-throat',
      icon: '🏏'
    },
    {
      id: 'king',
      title: 'King (Killer)',
      subtitle: 'Tir main faible, dessin du K & survie',
      icon: '👑'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-3 pb-16 animate-fadeIn">
      {/* Active Game Session Recovery Banner */}
      {hasSavedSession && savedSessionSummary && (
        <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-amber-950/90 via-slate-900 to-orange-950/90 border border-amber-500/70 shadow-2xl glow-amber flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">Partie en cours détectée</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black">
                  Mode {savedSessionSummary.mode}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Manche #{savedSessionSummary.leg} • {savedSessionSummary.playerNames.join(', ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={discardSavedSession}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs transition-colors"
              title="Abandonner la partie sauvegardée"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={resumeSavedSession}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg glow-amber flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <PlayCircle className="w-4 h-4 fill-current" />
              <span>Reprendre la Partie</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-3 sm:p-4 border border-slate-800 relative overflow-hidden flex items-center justify-between">
        <div className="relative z-10 space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Nouvelle Partie
          </span>
          <h2 className="text-lg sm:text-xl font-black text-white">Choisissez votre mode</h2>
          <p className="text-[11px] text-slate-400">
            L'ordre des joueurs alterne automatiquement et équitablement entre chaque partie.
          </p>
        </div>

        <div className="text-5xl opacity-10 pointer-events-none select-none pr-2">
          🎯
        </div>
      </div>

      {/* Game Modes Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {gameModes.map((m) => {
          const isSelected = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between active:scale-95 ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/80 shadow-lg glow-emerald'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <span className="text-2xl block mb-1">{m.icon}</span>
                <h3 className="font-black text-base text-white">{m.title}</h3>
                <p className="text-[10px] text-slate-400 leading-tight">{m.subtitle}</p>
              </div>

              {isSelected && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <Check className="w-3 h-3" />
                  <span>Sélectionné</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Mode Specific Settings */}
      <div className="glass-panel rounded-3xl p-3 sm:p-3.5 border border-slate-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Options de la partie ({mode.toUpperCase()})
          </h3>

          {/* Legs to Win Selector (Presets + Custom) */}
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-slate-400 text-[11px]">Manches (Legs) :</span>
            <select
              value={isCustomLegs ? 'custom' : String(currentLegsToWin)}
              onChange={(e) => handleLegsChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-emerald-400 font-black text-xs focus:outline-none"
            >
              <option value="1">1 Leg (Mort subite)</option>
              <option value="2">Premier à 2 Legs</option>
              <option value="3">Premier à 3 Legs</option>
              <option value="5">Premier à 5 Legs</option>
              <option value="custom">✏️ Personnalisé...</option>
            </select>

            {isCustomLegs && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={currentLegsToWin}
                  onChange={(e) => handleCustomLegsInput(parseInt(e.target.value, 10))}
                  className="w-12 px-1.5 py-0.5 rounded-lg bg-slate-950 border border-emerald-500 text-white font-black text-xs text-center focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-semibold">legs</span>
              </div>
            )}
          </div>
        </div>

        {(mode === '501' || mode === '301' || mode === '701') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Double Out */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-white">Double Out (Finir sur un Double)</div>
                <div className="text-[10px] text-slate-400">Recommandé règles officielles</div>
              </div>
              <input
                type="checkbox"
                checked={x01Config.doubleOut}
                onChange={(e) => setX01Config((prev) => ({ ...prev, doubleOut: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Double In */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-white">Double In (Débuter sur un Double)</div>
                <div className="text-[10px] text-slate-400">Option avancée</div>
              </div>
              <input
                type="checkbox"
                checked={x01Config.doubleIn}
                onChange={(e) => setX01Config((prev) => ({ ...prev, doubleIn: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {mode === 'cricket' && (
          <div className="space-y-2">
            {/* 1. Primary Option: Avec Secteur vs Hors Secteur */}
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-white">Secteur des Doubles & Triples</div>
                <span className="text-[10px] text-slate-400">Comptabilisation D/T</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setCricketConfig((prev) => ({ ...prev, doublesTriplesMode: 'in_sector' }))}
                  className={`p-2 rounded-lg text-xs font-bold border transition-all text-left flex flex-col justify-between ${
                    cricketConfig.doublesTriplesMode === 'in_sector'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-black text-white text-xs">Avec secteur</span>
                  <span className="text-[9px] text-slate-400">15 à 20 + Bull</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCricketConfig((prev) => ({ ...prev, doublesTriplesMode: 'any_sector' }))}
                  className={`p-2 rounded-lg text-xs font-bold border transition-all text-left flex flex-col justify-between ${
                    cricketConfig.doublesTriplesMode === 'any_sector'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-black text-white text-xs">Hors secteur</span>
                  <span className="text-[9px] text-slate-400">Tous les D/T (1 à 20)</span>
                </button>
              </div>
            </div>

            {/* 2. Toggle to exclude Doubles & Triples & 3. Cut-Throat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Lignes D & T</div>
                  <div className="text-[10px] text-slate-400">2 lignes bonus</div>
                </div>
                <input
                  type="checkbox"
                  checked={cricketConfig.includeDoublesTriples}
                  onChange={(e) =>
                    setCricketConfig((prev) => ({ ...prev, includeDoublesTriples: e.target.checked }))
                  }
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Cut-Throat</div>
                  <div className="text-[10px] text-slate-400">Points aux adversaires</div>
                </div>
                <input
                  type="checkbox"
                  checked={cricketConfig.cutThroat}
                  onChange={(e) =>
                    setCricketConfig((prev) => ({ ...prev, cutThroat: e.target.checked }))
                  }
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {mode === 'king' && (
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <span>👑</span>
              <span>Règles King (Killer)</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Attribution main faible $\rightarrow$ 3 touches pour devenir King 👑 $\rightarrow$ Attaque cibles adverses $\rightarrow$ Droit de réponse si $\le 0$.
            </p>
          </div>
        )}
      </div>

      {/* Players Selection */}
      <div className="glass-panel rounded-3xl p-3 sm:p-3.5 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Joueurs ({activePlayers.length} sélectionnés)
            </h3>
            {activePlayers.length > 1 && (
              <button
                type="button"
                onClick={shuffleSelectedPlayers}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[9px] border border-slate-700 transition-colors"
                title="Mélanger l'ordre manuellement"
              >
                <Shuffle className="w-2.5 h-2.5" />
                <span>Mélanger</span>
              </button>
            )}
          </div>

          <button
            onClick={onManagePlayers}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5"
          >
            <Plus className="w-3 h-3" />
            <span>Gérer</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {players.map((player) => {
            const isSelected = selectedPlayerIds.includes(player.id);
            const playerIndex = selectedPlayerIds.indexOf(player.id);

            return (
              <button
                key={player.id}
                onClick={() => togglePlayerSelection(player.id)}
                className={`p-2 sm:p-2.5 rounded-xl border flex items-center space-x-2 transition-all text-left relative ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/70 shadow text-white'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="text-xl">{player.avatar}</span>
                <div className="truncate flex-1">
                  <div className="text-xs font-bold truncate">{player.name}</div>
                  <div className="text-[9px] text-slate-400">
                    {isSelected ? `J#${playerIndex + 1} (Tireur)` : 'En réserve'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Big Launch Game Button */}
      <div className="pt-1">
        <button
          onClick={startNewGame}
          disabled={activePlayers.length === 0}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-base shadow-xl glow-emerald flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-40"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Lancer la Partie ({mode.toUpperCase()})</span>
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Play, Sparkles, Plus, Check, Shuffle } from 'lucide-react';
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
    startNewGame
  } = useGame();

  const { players, selectedPlayerIds, togglePlayerSelection, shuffleSelectedPlayers } = usePlayers();
  const activePlayers = players.filter((p) => selectedPlayerIds.includes(p.id));

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
    <div className="max-w-4xl mx-auto space-y-5 pb-20 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Nouvelle Partie
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Choisissez votre mode</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
            Sélectionnez un mode de jeu, configurez vos règles et lancez les fléchettes !
          </p>
        </div>

        <div className="absolute -right-6 -bottom-6 text-8xl opacity-10 pointer-events-none select-none">
          🎯
        </div>
      </div>

      {/* Game Modes Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {gameModes.map((m) => {
          const isSelected = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`p-4 rounded-3xl border text-left transition-all relative flex flex-col justify-between active:scale-95 ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/80 shadow-xl glow-emerald'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
              }`}
            >
              <div>
                <span className="text-3xl block mb-2">{m.icon}</span>
                <h3 className="font-black text-lg text-white">{m.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{m.subtitle}</p>
              </div>

              {isSelected && (
                <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>Sélectionné</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Mode Specific Settings */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Options de la partie ({mode.toUpperCase()})
          </h3>

          {/* Legs to Win Selector (Presets + Custom) */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-slate-400">Manches (Legs) :</span>
            <select
              value={isCustomLegs ? 'custom' : String(currentLegsToWin)}
              onChange={(e) => handleLegsChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-emerald-400 font-black focus:outline-none"
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
                  className="w-14 px-2 py-1 rounded-lg bg-slate-950 border border-emerald-500 text-white font-black text-xs text-center focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-semibold">legs</span>
              </div>
            )}
          </div>
        </div>

        {(mode === '501' || mode === '301' || mode === '701') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Double Out */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-white">Double Out (Finir sur un Double)</div>
                <div className="text-[11px] text-slate-400">Recommandé pour les règles officielles</div>
              </div>
              <input
                type="checkbox"
                checked={x01Config.doubleOut}
                onChange={(e) => setX01Config((prev) => ({ ...prev, doubleOut: e.target.checked }))}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Double In */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-white">Double In (Débuter sur un Double)</div>
                <div className="text-[11px] text-slate-400">Option avancée</div>
              </div>
              <input
                type="checkbox"
                checked={x01Config.doubleIn}
                onChange={(e) => setX01Config((prev) => ({ ...prev, doubleIn: e.target.checked }))}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {mode === 'cricket' && (
          <div className="space-y-3">
            {/* 1. Primary Option: Avec Secteur vs Hors Secteur */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Secteur des Doubles & Triples</div>
                  <div className="text-[11px] text-slate-400">
                    Détermine quels Doubles/Triples de la cible sont comptabilisés
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCricketConfig((prev) => ({ ...prev, doublesTriplesMode: 'in_sector' }))}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex flex-col justify-between ${
                    cricketConfig.doublesTriplesMode === 'in_sector'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-black text-white">Avec secteur</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Uniquement 15 à 20 + Bull</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCricketConfig((prev) => ({ ...prev, doublesTriplesMode: 'any_sector' }))}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex flex-col justify-between ${
                    cricketConfig.doublesTriplesMode === 'any_sector'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-black text-white">Hors secteur</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">N'importe quel D/T (1 à 20)</span>
                </button>
              </div>
            </div>

            {/* 2. Toggle to exclude Doubles & Triples */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Lignes Doubles & Triples (D & T)</div>
                <div className="text-[11px] text-slate-400">
                  {cricketConfig.includeDoublesTriples ? 'Activées par défaut (2 lignes supplémentaires)' : 'Désactivées (uniquement 15-20 + Bull)'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={cricketConfig.includeDoublesTriples}
                onChange={(e) =>
                  setCricketConfig((prev) => ({ ...prev, includeDoublesTriples: e.target.checked }))
                }
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* 3. Cut-Throat option */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Mode Cut-Throat (Coupe-Gorge)</div>
                <div className="text-[11px] text-slate-400">
                  Les points vont aux adversaires n'ayant pas fermé la cible (le score le plus bas gagne).
                </div>
              </div>
              <input
                type="checkbox"
                checked={cricketConfig.cutThroat}
                onChange={(e) =>
                  setCricketConfig((prev) => ({ ...prev, cutThroat: e.target.checked }))
                }
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {mode === 'king' && (
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>👑</span>
              <span>Règles Officielles du King (Killer)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              • <strong>Attribution</strong> : Tir main faible (1 à 20 ou Bull/25) pour chaque joueur.<br />
              • <strong>Départ à 0 vie</strong> : Tous les joueurs débutent à 0 (aucun K tracé).<br />
              • <strong>Dessin du K</strong> : 3 touches sur son propre numéro complètent le K et activent le statut <strong>King 👑</strong>.<br />
              • <strong>Attaque & Vies négatives</strong> : Seuls les Kings à 3 vies peuvent attaquer. Les vies des cibles peuvent descendre en dessous de 0.<br />
              • <strong>Droit de réponse</strong> : Un joueur à $\le 0$ quand un King est actif dispose d'un tour pour remonter à $\ge 1$, sinon il est éliminé.
            </p>
          </div>
        )}
      </div>

      {/* Players Selection */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Joueurs participants ({activePlayers.length} sélectionnés)
            </h3>
            {activePlayers.length > 1 && (
              <button
                type="button"
                onClick={shuffleSelectedPlayers}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[10px] border border-slate-700 transition-colors"
                title="Mélanger l'ordre de passage"
              >
                <Shuffle className="w-3 h-3" />
                <span>Mélanger l'ordre</span>
              </button>
            )}
          </div>

          <button
            onClick={onManagePlayers}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gérer</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {players.map((player) => {
            const isSelected = selectedPlayerIds.includes(player.id);
            const playerIndex = selectedPlayerIds.indexOf(player.id);

            return (
              <button
                key={player.id}
                onClick={() => togglePlayerSelection(player.id)}
                className={`p-3 rounded-2xl border flex items-center space-x-2.5 transition-all text-left relative ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/70 shadow-md text-white'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="text-2xl">{player.avatar}</span>
                <div className="truncate flex-1">
                  <div className="text-xs font-bold truncate">{player.name}</div>
                  <div className="text-[10px] text-slate-400">
                    {isSelected ? `J#${playerIndex + 1} (Passage)` : 'En réserve'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Big Launch Game Button */}
      <div className="pt-2">
        <button
          onClick={startNewGame}
          disabled={activePlayers.length === 0}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-lg shadow-xl glow-emerald flex items-center justify-center gap-2.5 active:scale-98 transition-all disabled:opacity-40"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Lancer la Partie ({mode.toUpperCase()})</span>
        </button>
      </div>
    </div>
  );
};

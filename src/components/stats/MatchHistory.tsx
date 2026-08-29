import React, { useState } from 'react';
import { History, Trophy, Calendar, Clock, Target, Trash2 } from 'lucide-react';
import type { MatchRecord } from '../../types/game';
import { loadLocalMatches, saveLocalMatches } from '../../lib/storage';

export const MatchHistory: React.FC = () => {
  const [matches, setMatches] = useState<MatchRecord[]>(() => loadLocalMatches());

  const handleClearHistory = () => {
    if (window.confirm('Voulez-vous vraiment effacer tout l\'historique des parties ?')) {
      saveLocalMatches([]);
      setMatches([]);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>Historique des Parties</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
              {matches.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Détail des manches et résultats enregistrés.
          </p>
        </div>

        {matches.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors border border-slate-800"
            title="Vider l'historique"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Matches List */}
      {matches.length === 0 ? (
        <div className="glass-panel rounded-3xl p-10 text-center space-y-2 border border-slate-800">
          <Target className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Aucune partie enregistrée</h3>
          <p className="text-xs text-slate-500">
            Les parties terminées s'afficheront automatiquement ici avec leurs statistiques.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const winner = match.players.find((p) => p.id === match.winnerId);

            return (
              <div
                key={match.id}
                className="p-4 rounded-2xl glass-panel border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                {/* Header: Mode & Winner */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/30 uppercase tracking-wider">
                      {match.mode}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(match.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDuration(match.durationSeconds || 0)}</span>
                  </div>
                </div>

                {/* Match Summary */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-lg shadow-sm">
                      {winner?.avatar || '🏆'}
                    </div>
                    <div>
                      <div className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" /> Vainqueur
                      </div>
                      <div className="text-sm font-black text-white">{winner?.name || 'Inconnu'}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-300 font-semibold">
                      {match.players.length} Joueurs • {match.summary?.rounds || 1} Volées
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {match.players.map((p) => p.name).join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

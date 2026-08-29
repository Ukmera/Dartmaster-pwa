import React, { useState } from 'react';
import { Flame, Swords, Smartphone, UserCheck, Award, ArrowUpRight } from 'lucide-react';
import { usePlayers } from '../../context/PlayerContext';
import { loadLocalMatches } from '../../lib/storage';

export const Leaderboard: React.FC = () => {
  const { players, playerStats, ownerPlayerId } = usePlayers();
  const [activeTab, setActiveTab] = useState<'general' | 'x01' | 'cricket' | 'king' | 'h2h'>('general');

  // Head to Head state
  const [h2hPlayer1, setH2hPlayer1] = useState<string>(players[0]?.id || '');
  const [h2hPlayer2, setH2hPlayer2] = useState<string>(players[1]?.id || '');

  const matches = loadLocalMatches();

  const calculateFairScore = (stats: any) => {
    if (!stats || stats.totalGames === 0) return 0;
    const winRate = (stats.totalWins / stats.totalGames) * 100;
    const avg501Bonus = Math.min(100, (stats.x01BestAverage || 0) * 1.2);
    const mprBonus = Math.min(100, (stats.cricketBestMPR || 0) * 25);
    const weight = Math.min(1, stats.totalGames / 3);
    const score = (winRate * 0.5 + avg501Bonus * 0.25 + mprBonus * 0.25) * weight;
    return Number(score.toFixed(1));
  };

  const getSortedPlayers = () => {
    return [...players].sort((a, b) => {
      const sA = playerStats[a.id];
      const sB = playerStats[b.id];
      if (!sA && !sB) return 0;
      if (!sA) return 1;
      if (!sB) return -1;

      if (activeTab === 'general') {
        const scoreA = calculateFairScore(sA);
        const scoreB = calculateFairScore(sB);
        return scoreB - scoreA;
      } else if (activeTab === 'x01') {
        return (sB.x01BestAverage || 0) - (sA.x01BestAverage || 0);
      } else if (activeTab === 'cricket') {
        return (sB.cricketBestMPR || 0) - (sA.cricketBestMPR || 0);
      } else if (activeTab === 'king') {
        return (sB.kingTotalEliminations || 0) - (sA.kingTotalEliminations || 0);
      }
      return 0;
    });
  };

  const sorted = getSortedPlayers();
  const leaderPlayer = sorted[0];
  const leaderStats = leaderPlayer ? playerStats[leaderPlayer.id] : null;
  const leaderScore = calculateFairScore(leaderStats);

  // Find owner in sorted list
  const ownerPlayer = players.find((p) => p.id === ownerPlayerId);
  const ownerRank = ownerPlayer ? sorted.findIndex((p) => p.id === ownerPlayerId) + 1 : 0;
  const ownerPlayerStats = ownerPlayer ? playerStats[ownerPlayer.id] : null;
  const ownerScore = calculateFairScore(ownerPlayerStats);

  const getHeadToHeadStats = () => {
    if (!h2hPlayer1 || !h2hPlayer2 || h2hPlayer1 === h2hPlayer2) return null;

    const commonMatches = matches.filter(
      (m) => m.playerIds.includes(h2hPlayer1) && m.playerIds.includes(h2hPlayer2)
    );

    const p1Wins = commonMatches.filter((m) => m.winnerId === h2hPlayer1).length;
    const p2Wins = commonMatches.filter((m) => m.winnerId === h2hPlayer2).length;

    const p1 = players.find((p) => p.id === h2hPlayer1);
    const p2 = players.find((p) => p.id === h2hPlayer2);
    const s1 = playerStats[h2hPlayer1];
    const s2 = playerStats[h2hPlayer2];

    return {
      total: commonMatches.length,
      p1,
      p2,
      s1,
      s2,
      p1Wins,
      p2Wins
    };
  };

  const h2h = getHeadToHeadStats();

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span>🏆</span>
            <span>Classement & Statistiques</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Classement équitable par performance, ratios de victoire et duels face-à-face entre amis.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex rounded-2xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'general' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            Général
          </button>
          <button
            onClick={() => setActiveTab('x01')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'x01' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            501/301
          </button>
          <button
            onClick={() => setActiveTab('cricket')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'cricket' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            Cricket
          </button>
          <button
            onClick={() => setActiveTab('king')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'king' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400'
            }`}
          >
            King
          </button>
          <button
            onClick={() => setActiveTab('h2h')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
              activeTab === 'h2h' ? 'bg-amber-600 text-white shadow' : 'text-amber-400'
            }`}
          >
            <Swords className="w-3 h-3" />
            <span>Face-à-Face</span>
          </button>
        </div>
      </div>

      {/* Sticky "Mon Profil" Card (If owner set) */}
      {ownerPlayer && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/60 shadow-xl glow-emerald flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-2xl flex items-center justify-center font-black text-emerald-300">
              #{ownerRank}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white">{ownerPlayer.name} (Mon Profil)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                  Rang #{ownerRank}
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {ownerPlayerStats?.totalWins || 0}V / {ownerPlayerStats?.totalGames || 0}P • Score DartMaster : <strong className="text-emerald-400">{ownerScore} pts</strong>
              </div>
            </div>
          </div>

          {leaderPlayer && leaderPlayer.id !== ownerPlayer.id && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Écart avec #1 ({leaderPlayer.name}) :</span>
              <span className="font-black text-amber-400 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                -{(leaderScore - ownerScore).toFixed(1)} pts
              </span>
            </div>
          )}
        </div>
      )}

      {activeTab !== 'h2h' ? (
        /* Leaderboard Table */
        <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-slate-800 space-y-3">
          <div className="text-[11px] text-slate-400 font-semibold px-2 flex items-center justify-between">
            <span>
              {activeTab === 'general' && '⭐ Rang basé sur l\'Indice de Performance DartMaster (Victoires + Moyennes)'}
              {activeTab === 'x01' && '🎯 Classé par Meilleure Moyenne 3 Flèches'}
              {activeTab === 'cricket' && '🏏 Classé par Meilleur MPR (Marks Per Round)'}
              {activeTab === 'king' && '👑 Classé par Nombre de Kills / Éliminations'}
            </span>
          </div>

          <div className="space-y-2">
            {sorted.map((player, idx) => {
              const stats = playerStats[player.id];
              const isOwner = ownerPlayerId === player.id;
              const fairScore = calculateFairScore(stats);
              const totalGames = stats?.totalGames || 0;
              const winRate = totalGames > 0 ? Math.round(((stats?.totalWins || 0) / totalGames) * 100) : 0;

              return (
                <div
                  key={player.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isOwner
                      ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg'
                      : idx === 0
                      ? 'bg-amber-950/20 border-amber-500/60 shadow-lg glow-amber'
                      : idx === 1
                      ? 'bg-slate-900/90 border-slate-700'
                      : idx === 2
                      ? 'bg-slate-900/60 border-slate-800'
                      : 'bg-slate-950/40 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    {/* Avatar */}
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center border text-xl relative overflow-hidden"
                      style={{ borderColor: player.color, backgroundColor: `${player.color}15` }}
                    >
                      {player.avatarType === 'image' && player.avatar.startsWith('data:') ? (
                        <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{player.avatar}</span>
                      )}
                    </div>

                    {/* Player Info */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{player.name}</span>
                        {isOwner && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-0.5">
                            <Smartphone className="w-2.5 h-2.5" /> Moi
                          </span>
                        )}
                        {player.isGuest && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-0.5">
                            <UserCheck className="w-2.5 h-2.5" /> Invité
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {stats?.totalWins || 0}V / {totalGames}P ({winRate}%)
                      </span>
                    </div>
                  </div>

                  {/* Primary Stat Display */}
                  <div className="text-right">
                    {activeTab === 'general' && (
                      <div>
                        <div className="text-sm font-black text-emerald-400 flex items-center justify-end gap-1">
                          <Award className="w-4 h-4" />
                          <span>{fairScore} pts</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Indice DartMaster</div>
                      </div>
                    )}

                    {activeTab === 'x01' && (
                      <div>
                        <div className="text-sm font-black text-white">
                          {stats?.x01BestAverage || 0} pts
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {stats?.x01Count180 || 0} x 180s • Max {stats?.x01HighestCheckout || 0}
                        </div>
                      </div>
                    )}

                    {activeTab === 'cricket' && (
                      <div>
                        <div className="text-sm font-black text-white">
                          {stats?.cricketBestMPR || 0} MPR
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {stats?.cricketWins || 0} victoires
                        </div>
                      </div>
                    )}

                    {activeTab === 'king' && (
                      <div>
                        <div className="text-sm font-black text-white flex items-center justify-end gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          <span>{stats?.kingTotalEliminations || 0} kills</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {stats?.kingWins || 0} victoires King
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Head-to-Head Comparator */
        <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-5">
          <div className="text-center space-y-1">
            <div className="inline-flex p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
              <Swords className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Face-à-Face entre Amis</h3>
            <p className="text-xs text-slate-400">
              Sélectionnez deux joueurs pour comparer leurs statistiques directes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Joueur 1</label>
              <select
                value={h2hPlayer1}
                onChange={(e) => setH2hPlayer1(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Joueur 2</label>
              <select
                value={h2hPlayer2}
                onChange={(e) => setH2hPlayer2(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {h2h && (
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-center">
                <div className="flex-1">
                  <span className="text-3xl">{h2h.p1?.avatar}</span>
                  <h4 className="font-bold text-sm text-white mt-1">{h2h.p1?.name}</h4>
                  <div className="text-2xl font-black text-emerald-400">{h2h.p1Wins}</div>
                  <span className="text-[10px] text-slate-500">Victoires</span>
                </div>

                <div className="px-3 py-1 rounded-xl bg-slate-800 text-xs font-black text-slate-400">
                  {h2h.total} duels
                </div>

                <div className="flex-1">
                  <span className="text-3xl">{h2h.p2?.avatar}</span>
                  <h4 className="font-bold text-sm text-white mt-1">{h2h.p2?.name}</h4>
                  <div className="text-2xl font-black text-emerald-400">{h2h.p2Wins}</div>
                  <span className="text-[10px] text-slate-500">Victoires</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-white">{h2h.s1?.x01BestAverage || 0} pts</span>
                  <span className="text-slate-400 font-semibold">Moyenne 501</span>
                  <span className="font-bold text-white">{h2h.s2?.x01BestAverage || 0} pts</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-white">{h2h.s1?.cricketBestMPR || 0}</span>
                  <span className="text-slate-400 font-semibold">Meilleur MPR</span>
                  <span className="font-bold text-white">{h2h.s2?.cricketBestMPR || 0}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="font-bold text-white">{h2h.s1?.x01Count180 || 0}</span>
                  <span className="text-slate-400 font-semibold">Nombre de 180s</span>
                  <span className="font-bold text-white">{h2h.s2?.x01Count180 || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

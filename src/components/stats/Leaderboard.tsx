import React, { useState } from 'react';
import { Flame, Swords, Smartphone, UserCheck, Award, ArrowUpRight, Percent, Trophy, Zap, Target } from 'lucide-react';
import { usePlayers } from '../../context/PlayerContext';
import { loadLocalMatches } from '../../lib/storage';

type LeaderboardCategory = 'general' | 'x01' | 'cricket' | 'king' | 'h2h';
type GeneralSortFilter = 'dartmaster_index' | 'win_rate' | 'total_wins' | 'avg_501' | 'mpr_cricket' | 'count_180';

export const Leaderboard: React.FC = () => {
  const { players, playerStats, ownerPlayerId } = usePlayers();
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('general');
  const [generalSortFilter, setGeneralSortFilter] = useState<GeneralSortFilter>('dartmaster_index');

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
        if (generalSortFilter === 'dartmaster_index') {
          return calculateFairScore(sB) - calculateFairScore(sA);
        } else if (generalSortFilter === 'win_rate') {
          const rateA = sA.totalGames > 0 ? (sA.totalWins / sA.totalGames) * 100 : 0;
          const rateB = sB.totalGames > 0 ? (sB.totalWins / sB.totalGames) * 100 : 0;
          return rateB - rateA || sB.totalWins - sA.totalWins;
        } else if (generalSortFilter === 'total_wins') {
          return (sB.totalWins || 0) - (sA.totalWins || 0);
        } else if (generalSortFilter === 'avg_501') {
          return (sB.x01BestAverage || 0) - (sA.x01BestAverage || 0);
        } else if (generalSortFilter === 'mpr_cricket') {
          return (sB.cricketBestMPR || 0) - (sA.cricketBestMPR || 0);
        } else if (generalSortFilter === 'count_180') {
          return (sB.x01Count180 || 0) - (sA.x01Count180 || 0);
        }
        return calculateFairScore(sB) - calculateFairScore(sA);
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

  // Owner data
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
    <div className="max-w-4xl mx-auto space-y-4 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>🏆</span>
            <span>Classements & Statistiques</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Classement équitable, filtres par performance et duels face-à-face entre amis.
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

      {/* General Multi-Filter Selector Bar */}
      {activeTab === 'general' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
          <span className="text-[11px] text-slate-400 font-semibold shrink-0 pr-1">Trier par :</span>
          
          <button
            onClick={() => setGeneralSortFilter('dartmaster_index')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 shrink-0 transition-all ${
              generalSortFilter === 'dartmaster_index'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Indice DartMaster</span>
          </button>

          <button
            onClick={() => setGeneralSortFilter('win_rate')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 shrink-0 transition-all ${
              generalSortFilter === 'win_rate'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Taux de Victoire (%)</span>
          </button>

          <button
            onClick={() => setGeneralSortFilter('total_wins')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 shrink-0 transition-all ${
              generalSortFilter === 'total_wins'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Total Victoires</span>
          </button>

          <button
            onClick={() => setGeneralSortFilter('avg_501')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 shrink-0 transition-all ${
              generalSortFilter === 'avg_501'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Moyenne 501</span>
          </button>

          <button
            onClick={() => setGeneralSortFilter('mpr_cricket')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 shrink-0 transition-all ${
              generalSortFilter === 'mpr_cricket'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🏏 MPR Cricket</span>
          </button>

          <button
            onClick={() => setGeneralSortFilter('count_180')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1 shrink-0 transition-all ${
              generalSortFilter === 'count_180'
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>180s</span>
          </button>
        </div>
      )}

      {/* Sticky "Mon Profil" Card (If owner set) */}
      {ownerPlayer && (
        <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/60 shadow-xl glow-emerald flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-xl flex items-center justify-center font-black text-emerald-300">
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
                {ownerPlayerStats?.totalWins || 0}V / {ownerPlayerStats?.totalGames || 0}P ({ownerPlayerStats?.totalGames ? Math.round(((ownerPlayerStats.totalWins || 0) / ownerPlayerStats.totalGames) * 100) : 0}%) • Indice DartMaster : <strong className="text-emerald-400">{ownerScore} pts</strong>
              </div>
            </div>
          </div>

          {leaderPlayer && leaderPlayer.id !== ownerPlayer.id && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
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
        <div className="glass-panel rounded-3xl p-3 sm:p-4 border border-slate-800 space-y-2.5">
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
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
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
                  <div className="flex items-center space-x-2.5">
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
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
                      className="w-10 h-10 rounded-2xl flex items-center justify-center border text-lg relative overflow-hidden"
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
                      <div className="flex items-center gap-1">
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
                      <span className="text-[11px] text-slate-400">
                        {stats?.totalWins || 0}V / {totalGames}P ({winRate}%)
                      </span>
                    </div>
                  </div>

                  {/* Primary Stat Display */}
                  <div className="text-right">
                    {activeTab === 'general' && (
                      <div>
                        {generalSortFilter === 'dartmaster_index' && (
                          <>
                            <div className="text-sm font-black text-emerald-400 flex items-center justify-end gap-1">
                              <Award className="w-3.5 h-3.5" />
                              <span>{fairScore} pts</span>
                            </div>
                            <div className="text-[10px] text-slate-400">Indice DartMaster</div>
                          </>
                        )}
                        {generalSortFilter === 'win_rate' && (
                          <>
                            <div className="text-sm font-black text-emerald-400 flex items-center justify-end gap-1">
                              <Percent className="w-3.5 h-3.5" />
                              <span>{winRate}%</span>
                            </div>
                            <div className="text-[10px] text-slate-400">{stats?.totalWins || 0} victoires</div>
                          </>
                        )}
                        {generalSortFilter === 'total_wins' && (
                          <>
                            <div className="text-sm font-black text-amber-400 flex items-center justify-end gap-1">
                              <Trophy className="w-3.5 h-3.5" />
                              <span>{stats?.totalWins || 0} victoires</span>
                            </div>
                            <div className="text-[10px] text-slate-400">sur {totalGames} parties</div>
                          </>
                        )}
                        {generalSortFilter === 'avg_501' && (
                          <>
                            <div className="text-sm font-black text-white">
                              {stats?.x01BestAverage || 0} pts
                            </div>
                            <div className="text-[10px] text-slate-400">Moy. 501</div>
                          </>
                        )}
                        {generalSortFilter === 'mpr_cricket' && (
                          <>
                            <div className="text-sm font-black text-white">
                              {stats?.cricketBestMPR || 0} MPR
                            </div>
                            <div className="text-[10px] text-slate-400">Cricket</div>
                          </>
                        )}
                        {generalSortFilter === 'count_180' && (
                          <>
                            <div className="text-sm font-black text-amber-300">
                              {stats?.x01Count180 || 0} x 180s
                            </div>
                            <div className="text-[10px] text-slate-400">Maximums</div>
                          </>
                        )}
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
        <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-slate-800 space-y-4">
          <div className="text-center space-y-1">
            <div className="inline-flex p-2 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-0.5">
              <Swords className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-white">Face-à-Face entre Amis</h3>
            <p className="text-xs text-slate-400">
              Sélectionnez deux joueurs pour comparer leurs confrontations directes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Joueur 1</label>
              <select
                value={h2hPlayer1}
                onChange={(e) => setH2hPlayer1(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs"
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
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs"
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
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-center">
                <div className="flex-1">
                  <span className="text-2xl">{h2h.p1?.avatar}</span>
                  <h4 className="font-bold text-xs sm:text-sm text-white mt-0.5">{h2h.p1?.name}</h4>
                  <div className="text-xl font-black text-emerald-400">{h2h.p1Wins}</div>
                  <span className="text-[9px] text-slate-500">Victoires</span>
                </div>

                <div className="px-2.5 py-1 rounded-xl bg-slate-800 text-[11px] font-black text-slate-400">
                  {h2h.total} duels
                </div>

                <div className="flex-1">
                  <span className="text-2xl">{h2h.p2?.avatar}</span>
                  <h4 className="font-bold text-xs sm:text-sm text-white mt-0.5">{h2h.p2?.name}</h4>
                  <div className="text-xl font-black text-emerald-400">{h2h.p2Wins}</div>
                  <span className="text-[9px] text-slate-500">Victoires</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="font-bold text-white">{h2h.s1?.x01BestAverage || 0} pts</span>
                  <span className="text-slate-400 font-semibold text-[11px]">Moyenne 501</span>
                  <span className="font-bold text-white">{h2h.s2?.x01BestAverage || 0} pts</span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="font-bold text-white">{h2h.s1?.cricketBestMPR || 0}</span>
                  <span className="text-slate-400 font-semibold text-[11px]">Meilleur MPR</span>
                  <span className="font-bold text-white">{h2h.s2?.cricketBestMPR || 0}</span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="font-bold text-white">{h2h.s1?.x01Count180 || 0}</span>
                  <span className="text-slate-400 font-semibold text-[11px]">Nombre de 180s</span>
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

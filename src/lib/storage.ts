import type { Player, PlayerStats } from '../types/player';
import type { MatchRecord } from '../types/game';
import { getSupabaseClient } from './supabase';

const PLAYERS_KEY = 'dartmaster_local_players';
const STATS_KEY = 'dartmaster_local_stats';
const MATCHES_KEY = 'dartmaster_local_matches';

const DEFAULT_PLAYERS: Player[] = [
  {
    id: 'player-1',
    name: 'Alex',
    avatar: '🎯',
    color: '#10b981',
    createdAt: new Date().toISOString()
  },
  {
    id: 'player-2',
    name: 'Sam',
    avatar: '⚡',
    color: '#f59e0b',
    createdAt: new Date().toISOString()
  },
  {
    id: 'player-3',
    name: 'Max',
    avatar: '🔥',
    color: '#ec4899',
    createdAt: new Date().toISOString()
  }
];

export function createEmptyStats(playerId: string): PlayerStats {
  return {
    playerId,
    totalGames: 0,
    totalWins: 0,
    x01Games: 0,
    x01Wins: 0,
    x01TotalDarts: 0,
    x01TotalScore: 0,
    x01BestAverage: 0,
    x01Count180: 0,
    x01Count140Plus: 0,
    x01Count100Plus: 0,
    x01HighestCheckout: 0,
    cricketGames: 0,
    cricketWins: 0,
    cricketTotalMarks: 0,
    cricketTotalRounds: 0,
    cricketBestMPR: 0,
    kingGames: 0,
    kingWins: 0,
    kingTotalEliminations: 0
  };
}

// Local Storage Helpers
export function loadLocalPlayers(): Player[] {
  if (typeof window === 'undefined') return DEFAULT_PLAYERS;
  try {
    const raw = localStorage.getItem(PLAYERS_KEY);
    if (!raw) {
      saveLocalPlayers(DEFAULT_PLAYERS);
      return DEFAULT_PLAYERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PLAYERS;
  } catch {
    return DEFAULT_PLAYERS;
  }
}

export function saveLocalPlayers(players: Player[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  } catch (err) {
    console.error('Error saving local players', err);
  }
}

export function loadLocalStats(): Record<string, PlayerStats> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalStats(stats: Record<string, PlayerStats>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Error saving local stats', err);
  }
}

export function loadLocalMatches(): MatchRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MATCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalMatches(matches: MatchRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  } catch (err) {
    console.error('Error saving local matches', err);
  }
}

// Recalculate stats entirely from match history
export function recalculateAllStats(matches: MatchRecord[], players: Player[]): Record<string, PlayerStats> {
  const newStats: Record<string, PlayerStats> = {};

  players.forEach((p) => {
    newStats[p.id] = createEmptyStats(p.id);
  });

  matches.forEach((match) => {
    match.players.forEach((player) => {
      if (!newStats[player.id]) {
        newStats[player.id] = createEmptyStats(player.id);
      }
      const ps = newStats[player.id];
      ps.totalGames += 1;
      if (match.winnerId === player.id) {
        ps.totalWins += 1;
      }

      const playerMatchStats = match.summary?.finalStats?.[player.id];

      if (match.mode === '301' || match.mode === '501' || match.mode === '701') {
        ps.x01Games += 1;
        if (match.winnerId === player.id) ps.x01Wins += 1;
        if (playerMatchStats) {
          ps.x01TotalDarts += playerMatchStats.dartsThrown || 0;
          ps.x01TotalScore += playerMatchStats.totalScoreScored || 0;
          const avg = playerMatchStats.average3Darts || 0;
          if (avg > ps.x01BestAverage) ps.x01BestAverage = avg;
          ps.x01Count180 += playerMatchStats.count180 || 0;
          ps.x01Count140Plus += playerMatchStats.count140Plus || 0;
          ps.x01Count100Plus += playerMatchStats.count100Plus || 0;
          if ((playerMatchStats.highestCheckout || 0) > ps.x01HighestCheckout) {
            ps.x01HighestCheckout = playerMatchStats.highestCheckout;
          }
        }
      } else if (match.mode === 'cricket') {
        ps.cricketGames += 1;
        if (match.winnerId === player.id) ps.cricketWins += 1;
        if (playerMatchStats) {
          ps.cricketTotalMarks += playerMatchStats.totalMarks || 0;
          ps.cricketTotalRounds += playerMatchStats.roundsPlayed || 1;
          const mpr = playerMatchStats.mpr || 0;
          if (mpr > ps.cricketBestMPR) ps.cricketBestMPR = mpr;
        }
      } else if (match.mode === 'king') {
        ps.kingGames += 1;
        if (match.winnerId === player.id) ps.kingWins += 1;
        if (playerMatchStats) {
          ps.kingTotalEliminations += playerMatchStats.kills || 0;
        }
      }
    });
  });

  return newStats;
}

// Delete a specific match and recalculate stats
export async function deleteMatchRecord(matchId: string): Promise<Record<string, PlayerStats>> {
  const matches = loadLocalMatches().filter((m) => m.id !== matchId);
  saveLocalMatches(matches);

  const players = loadLocalPlayers();
  const updatedStats = recalculateAllStats(matches, players);
  saveLocalStats(updatedStats);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('matches').delete().eq('id', matchId);
      for (const p of players) {
        const s = updatedStats[p.id];
        if (s) {
          await supabase.from('player_stats').upsert({
            player_id: p.id,
            total_games: s.totalGames,
            total_wins: s.totalWins,
            x01_games: s.x01Games,
            x01_wins: s.x01Wins,
            x01_total_darts: s.x01TotalDarts,
            x01_total_score: s.x01TotalScore,
            x01_best_average: s.x01BestAverage,
            x01_count_180: s.x01Count180,
            x01_count_140_plus: s.x01Count140Plus,
            x01_count_100_plus: s.x01Count100Plus,
            x01_highest_checkout: s.x01HighestCheckout,
            cricket_games: s.cricketGames,
            cricket_wins: s.cricketWins,
            cricket_total_marks: s.cricketTotalMarks,
            cricket_total_rounds: s.cricketTotalRounds,
            cricket_best_mpr: s.cricketBestMPR,
            king_games: s.kingGames,
            king_wins: s.kingWins,
            king_total_eliminations: s.kingTotalEliminations
          });
        }
      }
    } catch (err) {
      console.warn('Failed to delete match on Supabase:', err);
    }
  }

  return updatedStats;
}

// Sync with Supabase (Offline-first)
export async function syncPlayersFromRemote(): Promise<Player[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return loadLocalPlayers();
  }

  try {
    const { data, error } = await supabase.from('players').select('*').order('created_at', { ascending: true });
    if (error || !data) {
      console.warn('Supabase fetch players warning:', error?.message);
      return loadLocalPlayers();
    }
    if (data.length > 0) {
      saveLocalPlayers(data as Player[]);
      return data as Player[];
    } else {
      const local = loadLocalPlayers();
      await supabase.from('players').upsert(local);
      return local;
    }
  } catch (err) {
    console.warn('Supabase sync exception, fallback to local:', err);
    return loadLocalPlayers();
  }
}

export async function savePlayer(player: Player): Promise<Player> {
  const local = loadLocalPlayers();
  const existingIndex = local.findIndex((p) => p.id === player.id);
  let updated: Player[];

  if (existingIndex >= 0) {
    updated = [...local];
    updated[existingIndex] = player;
  } else {
    updated = [...local, player];
  }

  saveLocalPlayers(updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('players').upsert(player);
    } catch (err) {
      console.warn('Failed to sync player to Supabase:', err);
    }
  }

  return player;
}

export async function deletePlayer(playerId: string): Promise<void> {
  const local = loadLocalPlayers().filter((p) => p.id !== playerId);
  saveLocalPlayers(local);

  const stats = loadLocalStats();
  delete stats[playerId];
  saveLocalStats(stats);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('players').delete().eq('id', playerId);
      await supabase.from('player_stats').delete().eq('player_id', playerId);
    } catch (err) {
      console.warn('Failed to delete player on Supabase:', err);
    }
  }
}

export async function recordMatchResult(match: MatchRecord): Promise<Record<string, PlayerStats>> {
  const matches = [match, ...loadLocalMatches()];
  saveLocalMatches(matches);

  const statsMap = loadLocalStats();

  match.players.forEach((player) => {
    if (!statsMap[player.id]) {
      statsMap[player.id] = createEmptyStats(player.id);
    }
    const ps = statsMap[player.id];
    ps.totalGames += 1;
    if (match.winnerId === player.id) {
      ps.totalWins += 1;
    }

    const playerMatchStats = match.summary?.finalStats?.[player.id];

    if (match.mode === '301' || match.mode === '501' || match.mode === '701') {
      ps.x01Games += 1;
      if (match.winnerId === player.id) ps.x01Wins += 1;
      if (playerMatchStats) {
        ps.x01TotalDarts += playerMatchStats.dartsThrown || 0;
        ps.x01TotalScore += playerMatchStats.totalScoreScored || 0;
        const avg = playerMatchStats.average3Darts || 0;
        if (avg > ps.x01BestAverage) ps.x01BestAverage = avg;
        ps.x01Count180 += playerMatchStats.count180 || 0;
        ps.x01Count140Plus += playerMatchStats.count140Plus || 0;
        ps.x01Count100Plus += playerMatchStats.count100Plus || 0;
        if ((playerMatchStats.highestCheckout || 0) > ps.x01HighestCheckout) {
          ps.x01HighestCheckout = playerMatchStats.highestCheckout;
        }
      }
    } else if (match.mode === 'cricket') {
      ps.cricketGames += 1;
      if (match.winnerId === player.id) ps.cricketWins += 1;
      if (playerMatchStats) {
        ps.cricketTotalMarks += playerMatchStats.totalMarks || 0;
        ps.cricketTotalRounds += playerMatchStats.roundsPlayed || 1;
        const mpr = playerMatchStats.mpr || 0;
        if (mpr > ps.cricketBestMPR) ps.cricketBestMPR = mpr;
      }
    } else if (match.mode === 'king') {
      ps.kingGames += 1;
      if (match.winnerId === player.id) ps.kingWins += 1;
      if (playerMatchStats) {
        ps.kingTotalEliminations += playerMatchStats.kills || 0;
      }
    }
  });

  saveLocalStats(statsMap);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('matches').insert({
        id: match.id,
        mode: match.mode,
        winner_id: match.winnerId || null,
        player_ids: match.playerIds,
        players_data: match.players,
        duration_seconds: match.durationSeconds,
        summary: match.summary,
        created_at: match.date
      });

      for (const player of match.players) {
        const s = statsMap[player.id];
        await supabase.from('player_stats').upsert({
          player_id: player.id,
          total_games: s.totalGames,
          total_wins: s.totalWins,
          x01_games: s.x01Games,
          x01_wins: s.x01Wins,
          x01_total_darts: s.x01TotalDarts,
          x01_total_score: s.x01TotalScore,
          x01_best_average: s.x01BestAverage,
          x01_count_180: s.x01Count180,
          x01_count_140_plus: s.x01Count140Plus,
          x01_count_100_plus: s.x01Count100Plus,
          x01_highest_checkout: s.x01HighestCheckout,
          cricket_games: s.cricketGames,
          cricket_wins: s.cricketWins,
          cricket_total_marks: s.cricketTotalMarks,
          cricket_total_rounds: s.cricketTotalRounds,
          cricket_best_mpr: s.cricketBestMPR,
          king_games: s.kingGames,
          king_wins: s.kingWins,
          king_total_eliminations: s.kingTotalEliminations
        });
      }
    } catch (err) {
      console.warn('Failed to sync match to Supabase:', err);
    }
  }

  return statsMap;
}

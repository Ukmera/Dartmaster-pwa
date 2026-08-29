import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Player, PlayerStats, AvatarType } from '../types/player';
import {
  loadLocalPlayers,
  loadLocalStats,
  savePlayer,
  deletePlayer as deletePlayerStorage,
  saveLocalPlayers,
  saveLocalStats,
  loadLocalMatches,
  saveLocalMatches,
  syncPlayersFromRemote,
  createEmptyStats
} from '../lib/storage';
import { getSupabaseConfig } from '../lib/supabase';

const OWNER_KEY = 'dartmaster_owner_player_id';

interface PlayerContextType {
  players: Player[];
  rawPlayers: Player[];
  playerStats: Record<string, PlayerStats>;
  selectedPlayerIds: string[];
  ownerPlayerId: string | null;
  isSupabaseConnected: boolean;
  isLoading: boolean;
  togglePlayerSelection: (id: string) => void;
  setSelectedPlayerIds: (ids: string[]) => void;
  setOwnerPlayerId: (id: string | null, pinAttempt?: string) => { success: boolean; error?: string };
  shuffleSelectedPlayers: () => void;
  rotateSelectedPlayers: () => void;
  addPlayer: (name: string, avatar: string, color: string, avatarType?: AvatarType, isGuest?: boolean, pinCode?: string) => Promise<Player>;
  updatePlayer: (player: Player) => Promise<Player>;
  deletePlayer: (id: string) => Promise<void>;
  mergeGuestIntoPlayer: (guestId: string, targetPlayerId: string) => Promise<void>;
  refreshPlayers: () => Promise<void>;
  updateStatsState: (newStats: Record<string, PlayerStats>) => void;
  getPlayerStats: (id: string) => PlayerStats;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawPlayers, setRawPlayers] = useState<Player[]>(() => loadLocalPlayers());
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>(() => loadLocalStats());
  const [ownerPlayerId, setOwnerPlayerIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(OWNER_KEY) || (loadLocalPlayers()[0]?.id || null);
  });

  // Reorder players so that owner ("Moi") is always first visually
  const players = useMemo(() => {
    if (!ownerPlayerId) return rawPlayers;
    const owner = rawPlayers.find((p) => p.id === ownerPlayerId);
    if (!owner) return rawPlayers;
    const others = rawPlayers.filter((p) => p.id !== ownerPlayerId);
    return [owner, ...others];
  }, [rawPlayers, ownerPlayerId]);

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(() => {
    const loaded = loadLocalPlayers();
    const owner = typeof window !== 'undefined' ? localStorage.getItem(OWNER_KEY) : null;
    if (owner && loaded.some((p) => p.id === owner)) {
      const others = loaded.filter((p) => p.id !== owner);
      return [owner, ...(others.slice(0, 1).map((p) => p.id))];
    }
    return loaded.slice(0, 2).map((p) => p.id);
  });

  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const setOwnerPlayerId = (id: string | null, pinAttempt?: string): { success: boolean; error?: string } => {
    if (id) {
      const targetPlayer = rawPlayers.find((p) => p.id === id);
      if (targetPlayer?.pinCode) {
        if (pinAttempt !== targetPlayer.pinCode) {
          return { success: false, error: 'Code PIN incorrect' };
        }
      }
      setOwnerPlayerIdState(id);
      localStorage.setItem(OWNER_KEY, id);
      setSelectedPlayerIds((prev) => (prev.includes(id) ? prev : [id, ...prev]));
      return { success: true };
    } else {
      setOwnerPlayerIdState(null);
      localStorage.removeItem(OWNER_KEY);
      return { success: true };
    }
  };

  const refreshPlayers = useCallback(async () => {
    setIsLoading(true);
    const config = getSupabaseConfig();
    setIsSupabaseConnected(!!config);

    try {
      const synched = await syncPlayersFromRemote();
      setRawPlayers(synched);
      setPlayerStats(loadLocalStats());
    } catch (err) {
      console.error('Failed to sync players:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPlayers();
  }, [refreshPlayers]);

  const updateStatsState = (newStats: Record<string, PlayerStats>) => {
    setPlayerStats(newStats);
  };

  const togglePlayerSelection = (id: string) => {
    setSelectedPlayerIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((pId) => pId !== id);
      } else {
        if (prev.length >= 8) return prev;
        return [...prev, id];
      }
    });
  };

  const shuffleSelectedPlayers = () => {
    setSelectedPlayerIds((prev) => {
      const copy = [...prev];
      return copy.sort(() => Math.random() - 0.5);
    });
  };

  const rotateSelectedPlayers = () => {
    setSelectedPlayerIds((prev) => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  };

  const addPlayer = async (
    name: string,
    avatar: string,
    color: string,
    avatarType: AvatarType = 'emoji',
    isGuest: boolean = false,
    pinCode?: string
  ): Promise<Player> => {
    const newPlayer: Player = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name.trim() || 'Joueur',
      avatar: avatar || '🎯',
      avatarType,
      color: color || '#10b981',
      isGuest,
      pinCode: pinCode ? pinCode.trim() : undefined,
      createdAt: new Date().toISOString()
    };

    const saved = await savePlayer(newPlayer);
    setRawPlayers((prev) => [...prev, saved]);
    setSelectedPlayerIds((prev) => (prev.length < 2 ? [...prev, saved.id] : prev));
    return saved;
  };

  const updatePlayer = async (player: Player): Promise<Player> => {
    const updated = await savePlayer(player);
    setRawPlayers((prev) => prev.map((p) => (p.id === player.id ? updated : p)));
    return updated;
  };

  const deletePlayer = async (id: string): Promise<void> => {
    await deletePlayerStorage(id);
    setRawPlayers((prev) => prev.filter((p) => p.id !== id));
    setSelectedPlayerIds((prev) => prev.filter((pId) => pId !== id));
    setPlayerStats((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const mergeGuestIntoPlayer = async (guestId: string, targetPlayerId: string): Promise<void> => {
    if (guestId === targetPlayerId) return;

    const stats = loadLocalStats();
    const guestStats = stats[guestId] || createEmptyStats(guestId);
    const targetStats = stats[targetPlayerId] || createEmptyStats(targetPlayerId);

    targetStats.totalGames += guestStats.totalGames;
    targetStats.totalWins += guestStats.totalWins;
    targetStats.x01Games += guestStats.x01Games;
    targetStats.x01Wins += guestStats.x01Wins;
    targetStats.x01TotalDarts += guestStats.x01TotalDarts;
    targetStats.x01TotalScore += guestStats.x01TotalScore;
    targetStats.x01BestAverage = Math.max(targetStats.x01BestAverage, guestStats.x01BestAverage);
    targetStats.x01Count180 += guestStats.x01Count180;
    targetStats.x01Count140Plus += guestStats.x01Count140Plus;
    targetStats.x01Count100Plus += guestStats.x01Count100Plus;
    targetStats.x01HighestCheckout = Math.max(targetStats.x01HighestCheckout, guestStats.x01HighestCheckout);

    targetStats.cricketGames += guestStats.cricketGames;
    targetStats.cricketWins += guestStats.cricketWins;
    targetStats.cricketTotalMarks += guestStats.cricketTotalMarks;
    targetStats.cricketTotalRounds += guestStats.cricketTotalRounds;
    targetStats.cricketBestMPR = Math.max(targetStats.cricketBestMPR, guestStats.cricketBestMPR);

    targetStats.kingGames += guestStats.kingGames;
    targetStats.kingWins += guestStats.kingWins;
    targetStats.kingTotalEliminations += guestStats.kingTotalEliminations;

    stats[targetPlayerId] = targetStats;
    delete stats[guestId];
    saveLocalStats(stats);
    setPlayerStats(stats);

    const matches = loadLocalMatches();
    matches.forEach((m) => {
      if (m.winnerId === guestId) m.winnerId = targetPlayerId;
      m.playerIds = m.playerIds.map((id) => (id === guestId ? targetPlayerId : id));
      m.players = m.players.map((p) => (p.id === guestId ? { ...p, id: targetPlayerId } : p));
    });
    saveLocalMatches(matches);

    const updatedPlayers = loadLocalPlayers().filter((p) => p.id !== guestId);
    saveLocalPlayers(updatedPlayers);
    setRawPlayers(updatedPlayers);
    setSelectedPlayerIds((prev) => prev.map((id) => (id === guestId ? targetPlayerId : id)));
  };

  const getPlayerStats = (id: string): PlayerStats => {
    return playerStats[id] || createEmptyStats(id);
  };

  return (
    <PlayerContext.Provider
      value={{
        players,
        rawPlayers,
        playerStats,
        selectedPlayerIds,
        ownerPlayerId,
        isSupabaseConnected,
        isLoading,
        togglePlayerSelection,
        setSelectedPlayerIds,
        setOwnerPlayerId,
        shuffleSelectedPlayers,
        rotateSelectedPlayers,
        addPlayer,
        updatePlayer,
        deletePlayer,
        mergeGuestIntoPlayer,
        refreshPlayers,
        updateStatsState,
        getPlayerStats
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export function usePlayers(): PlayerContextType {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayers must be used within PlayerProvider');
  return ctx;
}

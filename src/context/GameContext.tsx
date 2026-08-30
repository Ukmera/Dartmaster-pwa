import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import type {
  GameMode,
  GameStatus,
  X01Config,
  CricketConfig,
  KingConfig,
  X01PlayerState,
  CricketPlayerState,
  KingPlayerState,
  MatchRecord,
  PendingCricketChoice
} from '../types/game';
import type { DartThrow, Multiplier } from '../types/dart';
import type { Player } from '../types/player';
import { usePlayers } from './PlayerContext';
import { useSound } from './SoundContext';
import {
  createDartThrow,
  checkX01Bust,
  calculate3DartAverage,
  hasPlayerClosedAllCricketTargets,
  calculateMPR
} from '../utils/dartCalculations';
import { announceTurnScore } from '../utils/voiceCaller';
import { recordMatchResult } from '../lib/storage';

interface GameStateSnapshot {
  mode: GameMode;
  status: GameStatus;
  currentPlayerIndex: number;
  currentDarts: DartThrow[];
  roundIndex: number;
  x01States: Record<string, X01PlayerState>;
  cricketStates: Record<string, CricketPlayerState>;
  kingStates: Record<string, KingPlayerState>;
  winnerId: string | null;
  podiumWinners: { playerId: string; rank: number }[];
}

interface GameContextType {
  mode: GameMode;
  status: GameStatus;
  x01Config: X01Config;
  cricketConfig: CricketConfig;
  kingConfig: KingConfig;
  randomizeOrder: boolean;
  setRandomizeOrder: (val: boolean) => void;
  setMode: (mode: GameMode) => void;
  setX01Config: React.Dispatch<React.SetStateAction<X01Config>>;
  setCricketConfig: React.Dispatch<React.SetStateAction<CricketConfig>>;
  setKingConfig: React.Dispatch<React.SetStateAction<KingConfig>>;
  
  // Active game state
  currentPlayerIndex: number;
  currentDarts: DartThrow[];
  roundIndex: number;
  currentLeg: number;
  x01States: Record<string, X01PlayerState>;
  cricketStates: Record<string, CricketPlayerState>;
  kingStates: Record<string, KingPlayerState>;
  winnerId: string | null;
  podiumWinners: { playerId: string; rank: number }[];
  canUndo: boolean;

  // Pending Cricket Choice
  pendingCricketChoice: PendingCricketChoice | null;
  resolveCricketChoice: (choice: 'line' | 'number') => void;
  recordDirectCricketMark: (lineKey: 'D' | 'T') => void;

  // Actions
  startNewGame: () => void;
  quitGame: () => void;
  recordDart: (sector: number, multiplier: Multiplier) => void;
  recordQuickScore: (score: number) => void;
  commitTurn: () => void;
  undoLastAction: () => void;
  continueCricketMatch: () => void;
  addPlayerMidGame: (playerId: string) => void;
  
  // King Mode Specific
  assignKingNumber: (playerId: string, number: number) => void;
  autoAssignKingNumbers: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { players, selectedPlayerIds, setSelectedPlayerIds, updateStatsState } = usePlayers();
  const sound = useSound();

  const [mode, setMode] = useState<GameMode>('501');
  const [status, setStatus] = useState<GameStatus>('setup');
  const [randomizeOrder, setRandomizeOrder] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('dartmaster_random_order');
    return saved !== null ? saved === 'true' : true;
  });

  const handleSetRandomizeOrder = (val: boolean) => {
    setRandomizeOrder(val);
    localStorage.setItem('dartmaster_random_order', String(val));
  };

  const [x01Config, setX01Config] = useState<X01Config>({
    startingScore: 501,
    doubleIn: false,
    doubleOut: true,
    legsToWin: 1,
    setsToWin: 1
  });

  const [cricketConfig, setCricketConfig] = useState<CricketConfig>({
    cutThroat: false,
    legsToWin: 1,
    includeDoublesTriples: true,
    doublesTriplesMode: 'in_sector'
  });

  const [kingConfig, setKingConfig] = useState<KingConfig>({
    qualificationTarget: 3,
    allowNegativeLives: true,
    legsToWin: 1
  });

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [currentDarts, setCurrentDarts] = useState<DartThrow[]>([]);
  const [roundIndex, setRoundIndex] = useState<number>(1);
  const [currentLeg, setCurrentLeg] = useState<number>(1);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [podiumWinners, setPodiumWinners] = useState<{ playerId: string; rank: number }[]>([]);
  const [pendingCricketChoice, setPendingCricketChoice] = useState<PendingCricketChoice | null>(null);

  const [x01States, setX01States] = useState<Record<string, X01PlayerState>>({});
  const [cricketStates, setCricketStates] = useState<Record<string, CricketPlayerState>>({});
  const [kingStates, setKingStates] = useState<Record<string, KingPlayerState>>({});

  const historyStack = useRef<GameStateSnapshot[]>([]);
  const matchStartTime = useRef<number>(Date.now());

  // CRITICAL FIX: Active players MUST follow selectedPlayerIds exact order!
  const activePlayers = useMemo(() => {
    return selectedPlayerIds
      .map((id) => players.find((p) => p.id === id))
      .filter((p): p is Player => !!p);
  }, [selectedPlayerIds, players]);

  const saveSnapshot = useCallback(() => {
    historyStack.current.push({
      mode,
      status,
      currentPlayerIndex,
      currentDarts: [...currentDarts],
      roundIndex,
      x01States: JSON.parse(JSON.stringify(x01States)),
      cricketStates: JSON.parse(JSON.stringify(cricketStates)),
      kingStates: JSON.parse(JSON.stringify(kingStates)),
      winnerId,
      podiumWinners: [...podiumWinners]
    });
    if (historyStack.current.length > 50) {
      historyStack.current.shift();
    }
  }, [
    mode,
    status,
    currentPlayerIndex,
    currentDarts,
    roundIndex,
    x01States,
    cricketStates,
    kingStates,
    winnerId,
    podiumWinners
  ]);

  const startNewGame = useCallback(() => {
    if (selectedPlayerIds.length === 0) return;

    let orderedIds = [...selectedPlayerIds];

    if (randomizeOrder && orderedIds.length > 1) {
      // Shuffle order
      orderedIds = [...orderedIds].sort(() => Math.random() - 0.5);
      setSelectedPlayerIds(orderedIds);
    } else if (!randomizeOrder && orderedIds.length > 1) {
      // Rotate order
      const [first, ...rest] = orderedIds;
      orderedIds = [...rest, first];
      setSelectedPlayerIds(orderedIds);
    }

    const currentParticipants = orderedIds
      .map((id) => players.find((p) => p.id === id))
      .filter((p): p is Player => !!p);

    historyStack.current = [];
    matchStartTime.current = Date.now();
    setCurrentPlayerIndex(0);
    setCurrentDarts([]);
    setRoundIndex(1);
    setCurrentLeg(1);
    setWinnerId(null);
    setPodiumWinners([]);
    setPendingCricketChoice(null);

    if (mode === '301' || mode === '501' || mode === '701') {
      const startingScore = mode === '301' ? 301 : mode === '701' ? 701 : 501;
      const initialX01: Record<string, X01PlayerState> = {};
      currentParticipants.forEach((p) => {
        initialX01[p.id] = {
          playerId: p.id,
          currentScore: startingScore,
          legsWon: 0,
          setsWon: 0,
          dartsThrown: 0,
          totalScoreScored: 0,
          first9DartsScore: 0,
          first9DartsCount: 0,
          checkoutOpportunities: 0,
          checkoutsHit: 0,
          highestTurn: 0,
          turns: []
        };
      });
      setX01States(initialX01);
    } else if (mode === 'cricket') {
      const initialCricket: Record<string, CricketPlayerState> = {};
      currentParticipants.forEach((p) => {
        initialCricket[p.id] = {
          playerId: p.id,
          points: 0,
          marks: { '15': 0, '16': 0, '17': 0, '18': 0, '19': 0, '20': 0, '25': 0, 'D': 0, 'T': 0 },
          legsWon: 0,
          dartsThrown: 0,
          totalMarks: 0,
          hasFinished: false,
          finishRank: undefined,
          turns: []
        };
      });
      setCricketStates(initialCricket);
    } else if (mode === 'king') {
      const initialKing: Record<string, KingPlayerState> = {};
      currentParticipants.forEach((p) => {
        initialKing[p.id] = {
          playerId: p.id,
          assignedNumber: null,
          lives: 0,
          legsWon: 0,
          isKing: false,
          isEliminated: false,
          isInDanger: false,
          hasUsedRightOfReply: false,
          eliminatedOrder: null,
          kills: 0,
          dartsThrown: 0,
          turns: []
        };
      });
      setKingStates(initialKing);
    }

    setStatus('in_progress');
  }, [selectedPlayerIds, players, randomizeOrder, setSelectedPlayerIds, mode]);

  const quitGame = () => {
    setStatus('setup');
    setWinnerId(null);
    setPodiumWinners([]);
    setCurrentDarts([]);
    setCurrentLeg(1);
    setPendingCricketChoice(null);
    historyStack.current = [];
  };

  const declareWinner = useCallback(
    async (winId: string, podium?: { playerId: string; rank: number }[]) => {
      setWinnerId(winId);
      setStatus('finished');
      sound.playVictory();

      confetti({
        particleCount: 130,
        spread: 80,
        origin: { y: 0.6 }
      });

      const durationSeconds = Math.max(1, Math.round((Date.now() - matchStartTime.current) / 1000));
      const finalStats: Record<string, any> = {};

      if (mode === '301' || mode === '501' || mode === '701') {
        Object.values(x01States).forEach((st) => {
          finalStats[st.playerId] = {
            dartsThrown: st.dartsThrown,
            totalScoreScored: st.totalScoreScored,
            average3Darts: calculate3DartAverage(st.totalScoreScored, st.dartsThrown),
            highestTurn: st.highestTurn,
            count180: st.turns.filter((t) => t.totalScore === 180).length,
            count140Plus: st.turns.filter((t) => t.totalScore >= 140 && t.totalScore < 180).length,
            count100Plus: st.turns.filter((t) => t.totalScore >= 100 && t.totalScore < 140).length,
            highestCheckout: winId === st.playerId ? st.turns[st.turns.length - 1]?.totalScore || 0 : 0
          };
        });
      } else if (mode === 'cricket') {
        Object.values(cricketStates).forEach((st) => {
          finalStats[st.playerId] = {
            points: st.points,
            totalMarks: st.totalMarks,
            dartsThrown: st.dartsThrown,
            roundsPlayed: Math.ceil(st.dartsThrown / 3) || 1,
            mpr: calculateMPR(st.totalMarks, st.dartsThrown)
          };
        });
      } else if (mode === 'king') {
        Object.values(kingStates).forEach((st) => {
          finalStats[st.playerId] = {
            kills: st.kills,
            lives: st.lives,
            isKing: st.isKing,
            dartsThrown: st.dartsThrown
          };
        });
      }

      const matchRec: MatchRecord = {
        id: 'match_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        mode,
        date: new Date().toISOString(),
        playerIds: activePlayers.map((p) => p.id),
        players: activePlayers,
        winnerId: winId,
        durationSeconds,
        summary: {
          rounds: roundIndex,
          totalDarts: roundIndex * 3 * activePlayers.length,
          podium: podium || [{ playerId: winId, rank: 1 }],
          finalStats
        }
      };

      const updatedStats = await recordMatchResult(matchRec);
      updateStatsState(updatedStats);
    },
    [mode, activePlayers, roundIndex, sound, x01States, cricketStates, kingStates, updateStatsState]
  );

  const startNextLeg = useCallback(
    (legWinnerId: string) => {
      sound.playVictory();
      setCurrentLeg((l) => l + 1);
      setCurrentPlayerIndex(0);
      setCurrentDarts([]);
      setRoundIndex(1);
      setPodiumWinners([]);
      setPendingCricketChoice(null);

      if (mode === '301' || mode === '501' || mode === '701') {
        const startingScore = mode === '301' ? 301 : mode === '701' ? 701 : 501;
        setX01States((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((pId) => {
            updated[pId] = {
              ...updated[pId],
              currentScore: startingScore,
              legsWon: pId === legWinnerId ? updated[pId].legsWon + 1 : updated[pId].legsWon
            };
          });
          return updated;
        });
      } else if (mode === 'cricket') {
        setCricketStates((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((pId) => {
            updated[pId] = {
              ...updated[pId],
              points: 0,
              marks: { '15': 0, '16': 0, '17': 0, '18': 0, '19': 0, '20': 0, '25': 0, 'D': 0, 'T': 0 },
              hasFinished: false,
              finishRank: undefined,
              legsWon: pId === legWinnerId ? updated[pId].legsWon + 1 : updated[pId].legsWon
            };
          });
          return updated;
        });
      } else if (mode === 'king') {
        setKingStates((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((pId) => {
            updated[pId] = {
              ...updated[pId],
              assignedNumber: null,
              lives: 0,
              isKing: false,
              isEliminated: false,
              isInDanger: false,
              legsWon: pId === legWinnerId ? updated[pId].legsWon + 1 : updated[pId].legsWon
            };
          });
          return updated;
        });
      }
    },
    [mode, sound]
  );

  const addPlayerMidGame = (newPlayerId: string) => {
    saveSnapshot();
    if (!selectedPlayerIds.includes(newPlayerId)) {
      setSelectedPlayerIds([...selectedPlayerIds, newPlayerId]);
    }

    if (mode === '301' || mode === '501' || mode === '701') {
      const startingScore = mode === '301' ? 301 : mode === '701' ? 701 : 501;
      setX01States((prev) => ({
        ...prev,
        [newPlayerId]: {
          playerId: newPlayerId,
          currentScore: startingScore,
          legsWon: 0,
          setsWon: 0,
          dartsThrown: 0,
          totalScoreScored: 0,
          first9DartsScore: 0,
          first9DartsCount: 0,
          checkoutOpportunities: 0,
          checkoutsHit: 0,
          highestTurn: 0,
          turns: []
        }
      }));
    } else if (mode === 'cricket') {
      setCricketStates((prev) => ({
        ...prev,
        [newPlayerId]: {
          playerId: newPlayerId,
          points: 0,
          marks: { '15': 0, '16': 0, '17': 0, '18': 0, '19': 0, '20': 0, '25': 0, 'D': 0, 'T': 0 },
          legsWon: 0,
          dartsThrown: 0,
          totalMarks: 0,
          hasFinished: false,
          finishRank: undefined,
          turns: []
        }
      }));
    } else if (mode === 'king') {
      setKingStates((prev) => ({
        ...prev,
        [newPlayerId]: {
          playerId: newPlayerId,
          assignedNumber: null,
          lives: 0,
          legsWon: 0,
          isKing: false,
          isEliminated: false,
          isInDanger: false,
          hasUsedRightOfReply: false,
          eliminatedOrder: null,
          kills: 0,
          dartsThrown: 0,
          turns: []
        }
      }));
    }
  };

  const nextPlayer = useCallback(
    (customKingStates?: Record<string, KingPlayerState>, customCricketStates?: Record<string, CricketPlayerState>) => {
      setCurrentDarts([]);
      setPendingCricketChoice(null);
      const kStates = customKingStates || kingStates;
      const cStates = customCricketStates || cricketStates;

      if (mode === 'king') {
        let nextIdx = (currentPlayerIndex + 1) % activePlayers.length;
        let attempts = 0;
        while (
          attempts < activePlayers.length &&
          kStates[activePlayers[nextIdx].id]?.isEliminated
        ) {
          nextIdx = (nextIdx + 1) % activePlayers.length;
          attempts++;
        }

        if (nextIdx <= currentPlayerIndex) {
          setRoundIndex((r) => r + 1);
        }
        setCurrentPlayerIndex(nextIdx);
      } else if (mode === 'cricket') {
        let nextIdx = (currentPlayerIndex + 1) % activePlayers.length;
        let attempts = 0;
        while (
          attempts < activePlayers.length &&
          cStates[activePlayers[nextIdx].id]?.hasFinished
        ) {
          nextIdx = (nextIdx + 1) % activePlayers.length;
          attempts++;
        }

        if (nextIdx <= currentPlayerIndex) {
          setRoundIndex((r) => r + 1);
        }
        setCurrentPlayerIndex(nextIdx);
      } else {
        const nextIdx = (currentPlayerIndex + 1) % activePlayers.length;
        if (nextIdx === 0) {
          setRoundIndex((r) => r + 1);
        }
        setCurrentPlayerIndex(nextIdx);
      }
    },
    [currentPlayerIndex, activePlayers, mode, kingStates, cricketStates]
  );

  // ==========================================
  // X01 GAME LOGIC
  // ==========================================
  const handleX01Dart = (dart: DartThrow) => {
    saveSnapshot();
    const curPlayer = activePlayers[currentPlayerIndex];
    if (!curPlayer) return;
    const pState = { ...x01States[curPlayer.id] };
    const updatedDarts = [...currentDarts, dart];

    if (dart.multiplier === 3) sound.playTripleHit();
    else if (dart.multiplier === 2) sound.playDoubleHit();
    else if (dart.sector === 25 || dart.sector === 50) sound.playBullseye();
    else sound.playDartHit();

    const { isBust, isWin, remainingScore } = checkX01Bust(
      pState.currentScore,
      [dart],
      x01Config.doubleOut
    );

    if (isWin) {
      pState.currentScore = 0;
      pState.dartsThrown += 1;
      pState.totalScoreScored += dart.points;
      const turnScore = updatedDarts.reduce((sum, d) => sum + d.points, 0);
      if (turnScore > pState.highestTurn) pState.highestTurn = turnScore;

      pState.turns.push({
        id: 't_' + Date.now(),
        playerId: curPlayer.id,
        roundIndex,
        throws: updatedDarts,
        totalScore: turnScore,
        isBust: false,
        scoreBefore: pState.currentScore + dart.points,
        scoreAfter: 0,
        timestamp: Date.now()
      });

      announceTurnScore(turnScore, false);

      const newLegsWon = pState.legsWon + 1;
      pState.legsWon = newLegsWon;
      setX01States((prev) => ({ ...prev, [curPlayer.id]: pState }));

      if (newLegsWon >= x01Config.legsToWin) {
        declareWinner(curPlayer.id);
      } else {
        startNextLeg(curPlayer.id);
      }
      return;
    }

    if (isBust) {
      sound.playBust();
      announceTurnScore(0, true);
      pState.dartsThrown += 1;
      pState.turns.push({
        id: 't_' + Date.now(),
        playerId: curPlayer.id,
        roundIndex,
        throws: updatedDarts,
        totalScore: 0,
        isBust: true,
        scoreBefore: pState.currentScore,
        scoreAfter: pState.currentScore,
        timestamp: Date.now()
      });

      setX01States((prev) => ({ ...prev, [curPlayer.id]: pState }));
      nextPlayer();
      return;
    }

    pState.currentScore = remainingScore;
    pState.dartsThrown += 1;
    pState.totalScoreScored += dart.points;
    if (pState.dartsThrown <= 9) {
      pState.first9DartsScore += dart.points;
      pState.first9DartsCount += 1;
    }

    if (updatedDarts.length >= 3) {
      const turnScore = updatedDarts.reduce((sum, d) => sum + d.points, 0);
      if (turnScore === 180) sound.play180();
      announceTurnScore(turnScore, false);
      if (turnScore > pState.highestTurn) pState.highestTurn = turnScore;

      pState.turns.push({
        id: 't_' + Date.now(),
        playerId: curPlayer.id,
        roundIndex,
        throws: updatedDarts,
        totalScore: turnScore,
        isBust: false,
        scoreBefore: pState.currentScore + turnScore,
        scoreAfter: pState.currentScore,
        timestamp: Date.now()
      });

      setX01States((prev) => ({ ...prev, [curPlayer.id]: pState }));
      nextPlayer();
    } else {
      setCurrentDarts(updatedDarts);
      setX01States((prev) => ({ ...prev, [curPlayer.id]: pState }));
    }
  };

  const recordQuickScore = (turnScore: number) => {
    if (mode !== '301' && mode !== '501' && mode !== '701') return;
    if (status !== 'in_progress') return;

    saveSnapshot();
    const curPlayer = activePlayers[currentPlayerIndex];
    if (!curPlayer) return;
    const pState = { ...x01States[curPlayer.id] };

    if (currentDarts.length > 0) {
      const partialPoints = currentDarts.reduce((sum, d) => sum + d.points, 0);
      pState.currentScore += partialPoints;
      pState.dartsThrown -= currentDarts.length;
      pState.totalScoreScored -= partialPoints;
      setCurrentDarts([]);
    }

    if (turnScore < 0 || turnScore > 180) return;

    const newScore = pState.currentScore - turnScore;

    if (newScore < 0 || (x01Config.doubleOut && newScore === 1)) {
      sound.playBust();
      announceTurnScore(0, true);
      pState.dartsThrown += 3;
      pState.turns.push({
        id: 't_' + Date.now(),
        playerId: curPlayer.id,
        roundIndex,
        throws: [createDartThrow(0, 0), createDartThrow(0, 0), createDartThrow(0, 0)],
        totalScore: 0,
        isBust: true,
        scoreBefore: pState.currentScore,
        scoreAfter: pState.currentScore,
        timestamp: Date.now()
      });
      setX01States((prev) => ({ ...prev, [curPlayer.id]: pState }));
      nextPlayer();
      return;
    }

    if (newScore === 0) {
      pState.currentScore = 0;
      pState.dartsThrown += 3;
      pState.totalScoreScored += turnScore;
      if (turnScore > pState.highestTurn) pState.highestTurn = turnScore;
      pState.turns.push({
        id: 't_' + Date.now(),
        playerId: curPlayer.id,
        roundIndex,
        throws: [createDartThrow(0, 0), createDartThrow(0, 0), createDartThrow(20, 2)],
        totalScore: turnScore,
        isBust: false,
        scoreBefore: turnScore,
        scoreAfter: 0,
        timestamp: Date.now()
      });

      announceTurnScore(turnScore, false);
      const newLegsWon = pState.legsWon + 1;
      pState.legsWon = newLegsWon;
      setX01States((prev) => ({ ...prev, [curPlayer.id]: pState }));

      if (newLegsWon >= x01Config.legsToWin) {
        declareWinner(curPlayer.id);
      } else {
        startNextLeg(curPlayer.id);
      }
      return;
    }

    if (turnScore === 180) sound.play180();
    else sound.playDartHit();
    announceTurnScore(turnScore, false);

    pState.currentScore = newScore;
    pState.dartsThrown += 3;
    pState.totalScoreScored += turnScore;
    if (turnScore > pState.highestTurn) pState.highestTurn = turnScore;
    pState.turns.push({
      id: 't_' + Date.now(),
      playerId: curPlayer.id,
      roundIndex,
      throws: [createDartThrow(0, 0), createDartThrow(0, 0), createDartThrow(0, 0)],
      totalScore: turnScore,
      isBust: false,
      scoreBefore: pState.currentScore + turnScore,
      scoreAfter: newScore,
      timestamp: Date.now()
    });

    setX01States((prev) => ({ ...prev, [curPlayer.id]: pState }));
    nextPlayer();
  };

  // ==========================================
  // CRICKET GAME LOGIC
  // ==========================================
  const applyCricketMarks = (
    dart: DartThrow,
    targetKey: string,
    marksToAdd: number,
    pointValue: number
  ) => {
    saveSnapshot();
    const curPlayer = activePlayers[currentPlayerIndex];
    if (!curPlayer) return;
    const updatedCricket = { ...cricketStates };
    const pState = { ...updatedCricket[curPlayer.id] };
    const updatedDarts = [...currentDarts, dart];

    pState.dartsThrown += 1;

    const currentMarks = pState.marks[targetKey] || 0;
    const neededToClose = Math.max(0, 3 - currentMarks);
    const appliedToClose = Math.min(neededToClose, marksToAdd);
    const overflowMarks = marksToAdd - appliedToClose;

    pState.marks[targetKey] = currentMarks + appliedToClose;
    pState.totalMarks += marksToAdd;

    if (overflowMarks > 0 && pointValue > 0) {
      const pointsToAdd = overflowMarks * pointValue;

      if (cricketConfig.cutThroat) {
        activePlayers.forEach((opp) => {
          if (opp.id !== curPlayer.id && !updatedCricket[opp.id]?.hasFinished) {
            const oppMarks = updatedCricket[opp.id]?.marks[targetKey] || 0;
            if (oppMarks < 3) {
              updatedCricket[opp.id] = {
                ...updatedCricket[opp.id],
                points: updatedCricket[opp.id].points + pointsToAdd
              };
            }
          }
        });
      } else {
        const isTargetOpenForAnyOpponent = activePlayers.some(
          (opp) => opp.id !== curPlayer.id && !updatedCricket[opp.id]?.hasFinished && (updatedCricket[opp.id]?.marks[targetKey] || 0) < 3
        );
        if (isTargetOpenForAnyOpponent) {
          pState.points += pointsToAdd;
        }
      }
    }

    updatedCricket[curPlayer.id] = pState;
    setCricketStates(updatedCricket);

    const hasClosedAll = hasPlayerClosedAllCricketTargets(pState.marks, cricketConfig);
    if (hasClosedAll && !pState.hasFinished) {
      let isWinner = false;
      const activeUnfinishedOpponents = activePlayers.filter(
        (p) => p.id !== curPlayer.id && !updatedCricket[p.id]?.hasFinished
      );

      if (cricketConfig.cutThroat) {
        const minOppPoints = activeUnfinishedOpponents.length > 0
          ? Math.min(...activeUnfinishedOpponents.map((p) => updatedCricket[p.id].points))
          : pState.points;
        if (pState.points <= minOppPoints) isWinner = true;
      } else {
        const maxOppPoints = activeUnfinishedOpponents.length > 0
          ? Math.max(...activeUnfinishedOpponents.map((p) => updatedCricket[p.id].points))
          : pState.points;
        if (pState.points >= maxOppPoints) isWinner = true;
      }

      if (isWinner) {
        const currentRank = podiumWinners.length + 1;
        pState.hasFinished = true;
        pState.finishRank = currentRank;
        const newPodium = [...podiumWinners, { playerId: curPlayer.id, rank: currentRank }];
        setPodiumWinners(newPodium);

        if (currentRank === 1) {
          const newLegs = pState.legsWon + 1;
          pState.legsWon = newLegs;
          if (newLegs >= cricketConfig.legsToWin) {
            setWinnerId(curPlayer.id);
            if (activePlayers.length <= 2) {
              declareWinner(curPlayer.id, newPodium);
              return;
            } else {
              setStatus('podium');
              return;
            }
          } else {
            startNextLeg(curPlayer.id);
            return;
          }
        } else {
          const remaining = activePlayers.filter((p) => !updatedCricket[p.id]?.hasFinished);
          if (remaining.length <= 1) {
            declareWinner(podiumWinners[0]?.playerId || curPlayer.id, newPodium);
            return;
          }
        }
      }
    }

    if (updatedDarts.length >= 3) {
      nextPlayer(undefined, updatedCricket);
    } else {
      setCurrentDarts(updatedDarts);
    }
  };

  const recordDirectCricketMark = (lineKey: 'D' | 'T') => {
    if (status !== 'in_progress') return;
    const curPlayer = activePlayers[currentPlayerIndex];
    if (!curPlayer) return;
    const pState = cricketStates[curPlayer.id];
    if (!pState) return;

    if (lineKey === 'D') sound.playDoubleHit();
    else sound.playTripleHit();

    const dartLabel = lineKey === 'D' ? 'D (Ligne)' : 'T (Ligne)';
    const dart: DartThrow = {
      sector: lineKey === 'D' ? 2 : 3,
      multiplier: lineKey === 'D' ? 2 : 3,
      points: 0,
      label: dartLabel
    };

    applyCricketMarks(dart, lineKey, 1, 0);
  };

  const handleCricketDart = (dart: DartThrow) => {
    const curPlayer = activePlayers[currentPlayerIndex];
    if (!curPlayer) return;
    const pState = cricketStates[curPlayer.id];
    if (!pState) return;

    if (dart.multiplier === 3) sound.playTripleHit();
    else if (dart.multiplier === 2) sound.playDoubleHit();
    else if (dart.sector === 25 || dart.sector === 50) sound.playBullseye();
    else sound.playDartHit();

    const baseTargetNum = dart.sector === 50 ? 25 : dart.sector;
    const isBaseNumberTarget = (baseTargetNum >= 15 && baseTargetNum <= 20) || baseTargetNum === 25;
    const targetKey = String(baseTargetNum);

    if (cricketConfig.includeDoublesTriples) {
      const isSectorValid =
        cricketConfig.doublesTriplesMode === 'any_sector'
          ? dart.sector >= 1 && dart.sector <= 20
          : (dart.sector >= 15 && dart.sector <= 20) || dart.sector === 25 || dart.sector === 50;

      if (dart.multiplier === 2 || dart.sector === 50) {
        const dLineMarks = pState.marks['D'] || 0;
        const numberMarks = isBaseNumberTarget ? (pState.marks[targetKey] || 0) : 3;

        if (dLineMarks < 3 && numberMarks < 3 && isBaseNumberTarget && isSectorValid) {
          setPendingCricketChoice({ dart, sector: baseTargetNum, multiplier: 2 });
          return;
        } else if (dLineMarks < 3 && !isBaseNumberTarget && isSectorValid) {
          applyCricketMarks(dart, 'D', 1, 0);
          return;
        } else if (dLineMarks >= 3 && isBaseNumberTarget) {
          applyCricketMarks(dart, targetKey, dart.sector === 50 ? 2 : 2, baseTargetNum);
          return;
        } else if (numberMarks >= 3 && dLineMarks < 3 && isSectorValid) {
          applyCricketMarks(dart, 'D', 1, 0);
          return;
        }
      } else if (dart.multiplier === 3) {
        const tLineMarks = pState.marks['T'] || 0;
        const numberMarks = isBaseNumberTarget ? (pState.marks[targetKey] || 0) : 3;

        if (tLineMarks < 3 && numberMarks < 3 && isBaseNumberTarget && isSectorValid) {
          setPendingCricketChoice({ dart, sector: baseTargetNum, multiplier: 3 });
          return;
        } else if (tLineMarks < 3 && !isBaseNumberTarget && isSectorValid) {
          applyCricketMarks(dart, 'T', 1, 0);
          return;
        } else if (tLineMarks >= 3 && isBaseNumberTarget) {
          applyCricketMarks(dart, targetKey, 3, baseTargetNum);
          return;
        } else if (numberMarks >= 3 && tLineMarks < 3 && isSectorValid) {
          applyCricketMarks(dart, 'T', 1, 0);
          return;
        }
      }
    }

    if (isBaseNumberTarget) {
      const marksToAdd = dart.sector === 50 ? 2 : dart.multiplier;
      applyCricketMarks(dart, targetKey, marksToAdd, baseTargetNum);
    } else {
      saveSnapshot();
      const updatedDarts = [...currentDarts, dart];
      const updatedCricket = { ...cricketStates };
      updatedCricket[curPlayer.id] = {
        ...pState,
        dartsThrown: pState.dartsThrown + 1
      };
      setCricketStates(updatedCricket);

      if (updatedDarts.length >= 3) {
        nextPlayer(undefined, updatedCricket);
      } else {
        setCurrentDarts(updatedDarts);
      }
    }
  };

  const resolveCricketChoice = (choice: 'line' | 'number') => {
    if (!pendingCricketChoice) return;
    const { dart, sector, multiplier } = pendingCricketChoice;
    setPendingCricketChoice(null);

    if (choice === 'line') {
      const lineKey = multiplier === 2 ? 'D' : 'T';
      applyCricketMarks(dart, lineKey, 1, 0);
    } else {
      applyCricketMarks(dart, String(sector), 1, sector);
    }
  };

  const continueCricketMatch = () => {
    setStatus('in_progress');
    nextPlayer();
  };

  // ==========================================
  // KING (KILLER) GAME LOGIC
  // ==========================================
  const assignKingNumber = (playerId: string, targetNum: number) => {
    saveSnapshot();
    setKingStates((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        assignedNumber: targetNum
      }
    }));
  };

  const autoAssignKingNumbers = () => {
    saveSnapshot();
    const available = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];
    const shuffled = [...available].sort(() => Math.random() - 0.5);

    setKingStates((prev) => {
      const updated = { ...prev };
      activePlayers.forEach((p, idx) => {
        if (updated[p.id]) {
          updated[p.id] = {
            ...updated[p.id],
            assignedNumber: shuffled[idx % shuffled.length]
          };
        }
      });
      return updated;
    });
  };

  const handleKingDart = (dart: DartThrow) => {
    saveSnapshot();
    const curPlayer = activePlayers[currentPlayerIndex];
    if (!curPlayer) return;
    const updatedKing = { ...kingStates };
    const pState = { ...updatedKing[curPlayer.id] };
    const updatedDarts = [...currentDarts, dart];

    pState.dartsThrown += 1;
    const hitSector = dart.sector === 50 ? 25 : dart.sector;
    const hitMultiplier = dart.sector === 50 ? 2 : dart.multiplier;

    if (!pState.isKing) {
      if (hitSector === pState.assignedNumber && hitMultiplier > 0) {
        const newLives = Math.min(3, pState.lives + hitMultiplier);
        pState.lives = newLives;

        if (newLives >= 3) {
          pState.lives = 3;
          pState.isKing = true;
          pState.isInDanger = false;
          sound.playKingCrowned();
        } else {
          sound.playDartHit();
        }
      } else {
        sound.playDartHit();
      }
    } else {
      const targetPlayer = activePlayers.find(
        (opp) => opp.id !== curPlayer.id && !updatedKing[opp.id]?.isEliminated && updatedKing[opp.id]?.assignedNumber === hitSector
      );

      if (targetPlayer && hitMultiplier > 0) {
        const victimState = { ...updatedKing[targetPlayer.id] };
        const damage = hitMultiplier;
        victimState.lives = victimState.lives - damage;

        if (victimState.lives < 3) {
          victimState.isKing = false;
        }

        if (victimState.lives <= 0) {
          victimState.isInDanger = true;
        }

        sound.playLifeLost();
        updatedKing[targetPlayer.id] = victimState;
      } else {
        sound.playDartHit();
      }
    }

    updatedKing[curPlayer.id] = pState;
    setKingStates(updatedKing);

    if (updatedDarts.length >= 3) {
      const anyKingExists = Object.values(updatedKing).some((st) => st.isKing && !st.isEliminated);

      if (anyKingExists && pState.lives <= 0) {
        pState.isEliminated = true;
        pState.isInDanger = false;
        sound.playEliminated();
        updatedKing[curPlayer.id] = pState;

        const survivors = activePlayers.filter((p) => !updatedKing[p.id]?.isEliminated);
        if (survivors.length <= 1) {
          const legWinnerId = survivors[0]?.id || curPlayer.id;
          const newLegs = (updatedKing[legWinnerId]?.legsWon || 0) + 1;
          if (newLegs >= kingConfig.legsToWin) {
            setKingStates(updatedKing);
            declareWinner(legWinnerId);
            return;
          } else {
            startNextLeg(legWinnerId);
            return;
          }
        }
      } else if (pState.lives > 0) {
        pState.isInDanger = false;
        updatedKing[curPlayer.id] = pState;
      }

      nextPlayer(updatedKing);
    } else {
      setCurrentDarts(updatedDarts);
    }
  };

  const recordDart = (sector: number, multiplier: Multiplier) => {
    if (status !== 'in_progress') return;
    const dart = createDartThrow(sector, multiplier);

    if (mode === '301' || mode === '501' || mode === '701') {
      handleX01Dart(dart);
    } else if (mode === 'cricket') {
      handleCricketDart(dart);
    } else if (mode === 'king') {
      handleKingDart(dart);
    }
  };

  const commitTurn = () => {
    if (currentDarts.length === 0) return;
    nextPlayer();
  };

  const undoLastAction = useCallback(() => {
    if (historyStack.current.length === 0) return;

    const previousSnapshot = historyStack.current.pop();
    if (!previousSnapshot) return;

    setMode(previousSnapshot.mode);
    setStatus(previousSnapshot.status);
    setCurrentPlayerIndex(previousSnapshot.currentPlayerIndex);
    setCurrentDarts(previousSnapshot.currentDarts);
    setRoundIndex(previousSnapshot.roundIndex);
    setX01States(previousSnapshot.x01States);
    setCricketStates(previousSnapshot.cricketStates);
    setKingStates(previousSnapshot.kingStates);
    setWinnerId(previousSnapshot.winnerId);
    setPodiumWinners(previousSnapshot.podiumWinners || []);
    setPendingCricketChoice(null);
  }, []);

  return (
    <GameContext.Provider
      value={{
        mode,
        status,
        x01Config,
        cricketConfig,
        kingConfig,
        randomizeOrder,
        setRandomizeOrder: handleSetRandomizeOrder,
        setMode,
        setX01Config,
        setCricketConfig,
        setKingConfig,
        currentPlayerIndex,
        currentDarts,
        roundIndex,
        currentLeg,
        x01States,
        cricketStates,
        kingStates,
        winnerId,
        podiumWinners,
        canUndo: historyStack.current.length > 0,
        pendingCricketChoice,
        resolveCricketChoice,
        recordDirectCricketMark,
        startNewGame,
        quitGame,
        recordDart,
        recordQuickScore,
        commitTurn,
        undoLastAction,
        continueCricketMatch,
        addPlayerMidGame,
        assignKingNumber,
        autoAssignKingNumbers
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

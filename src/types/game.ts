import type { DartThrow, Turn, Multiplier } from './dart';
import type { Player } from './player';

export type { Multiplier };
export type GameMode = '301' | '501' | '701' | 'cricket' | 'king';
export type GameStatus = 'setup' | 'in_progress' | 'podium' | 'finished';

export interface X01PlayerState {
  playerId: string;
  currentScore: number;
  legsWon: number;
  setsWon: number;
  dartsThrown: number;
  totalScoreScored: number;
  legDartsThrown: number;
  legScoreScored: number;
  first9DartsScore: number;
  first9DartsCount: number;
  checkoutOpportunities: number;
  checkoutsHit: number;
  highestTurn: number;
  turns: Turn[];
}

export type CricketTarget = 15 | 16 | 17 | 18 | 19 | 20 | 25 | 'D' | 'T';

export interface CricketPlayerState {
  playerId: string;
  points: number;
  marks: Record<string, number>; // key: '15', '16', ..., '25', 'D', 'T'
  legsWon: number;
  dartsThrown: number;
  totalMarks: number;
  hasFinished?: boolean;
  finishRank?: number;
  turns: {
    id: string;
    roundIndex: number;
    throws: DartThrow[];
    marksGained: number;
    pointsGained: number;
  }[];
}

export interface PendingCricketChoice {
  dart: DartThrow;
  sector: number;
  multiplier: 2 | 3;
}

export interface KingPlayerState {
  playerId: string;
  assignedNumber: number | null; // 1-20 or 25 (Bull)
  lives: number;                 // Starts at 0, max 3 (King), can go negative
  legsWon: number;
  isKing: boolean;               // true when lives === 3
  isEliminated: boolean;         // true when eliminated after right of reply
  isInDanger: boolean;           // true if lives <= 0 and at least one King exists
  hasUsedRightOfReply: boolean;  // true after using their right of reply turn
  eliminatedOrder: number | null;
  kills: number;                 // number of opponents eliminated
  dartsThrown: number;
  turns: {
    id: string;
    roundIndex: number;
    throws: DartThrow[];
    livesBefore: number;
    livesAfter: number;
  }[];
}

export interface X01Config {
  startingScore: 301 | 501 | 701;
  doubleIn: boolean;
  doubleOut: boolean;
  legsToWin: number;
  setsToWin: number;
}

export interface CricketConfig {
  cutThroat: boolean;
  legsToWin: number;
  includeDoublesTriples: boolean;
  doublesTriplesMode: 'in_sector' | 'any_sector'; // 'in_sector' (15-20+Bull) or 'any_sector' (1-20)
}

export interface KingConfig {
  qualificationTarget: number; // 3 lives
  allowNegativeLives: boolean;
  legsToWin: number;
}

export interface MatchRecord {
  id: string;
  mode: GameMode;
  date: string;
  playerIds: string[];
  players: Player[];
  winnerId: string;
  durationSeconds: number;
  summary: {
    rounds: number;
    totalDarts: number;
    podium?: { playerId: string; rank: number }[];
    finalStats: Record<string, any>;
  };
}

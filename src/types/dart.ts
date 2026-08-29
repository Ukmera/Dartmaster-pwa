export type Multiplier = 0 | 1 | 2 | 3;

export interface DartThrow {
  sector: number; // 0 for Miss, 1-20 for numbers, 25 for Outer Bull, 50 for Bullseye
  multiplier: Multiplier; // 0 = Miss, 1 = Single, 2 = Double, 3 = Triple
  points: number; // sector * multiplier (or 25/50 for bulls)
  label: string; // e.g. "T20", "D16", "S5", "Bull", "DBull", "Miss"
}

export interface Turn {
  id: string;
  playerId: string;
  roundIndex: number;
  throws: DartThrow[];
  totalScore: number;
  isBust: boolean;
  scoreBefore: number;
  scoreAfter: number;
  timestamp: number;
}

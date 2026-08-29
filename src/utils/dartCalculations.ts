import type { DartThrow, Multiplier } from '../types/dart';
import type { CricketConfig } from '../types/game';

// Helper to create a standard DartThrow object
export function createDartThrow(sector: number, multiplier: Multiplier): DartThrow {
  if (sector === 0 || multiplier === 0) {
    return { sector: 0, multiplier: 0, points: 0, label: 'Manqué' };
  }

  if (sector === 25) {
    if (multiplier === 2) {
      return { sector: 50, multiplier: 2, points: 50, label: 'Double Bull' };
    }
    return { sector: 25, multiplier: 1, points: 25, label: 'Bull' };
  }

  const prefix = multiplier === 3 ? 'T' : multiplier === 2 ? 'D' : 'S';
  const points = sector * multiplier;
  return {
    sector,
    multiplier,
    points,
    label: `${prefix}${sector}`
  };
}

// Check if a throw is a valid double finish (including 50 bullseye)
export function isDoubleFinish(t: DartThrow): boolean {
  if (t.sector === 50 && t.multiplier === 2) return true;
  return t.multiplier === 2 && t.sector >= 1 && t.sector <= 20;
}

// X01 Bust validation
export function checkX01Bust(
  scoreBeforeTurn: number,
  throwsInTurn: DartThrow[],
  doubleOut: boolean = true
): { isBust: boolean; isWin: boolean; remainingScore: number } {
  let current = scoreBeforeTurn;

  for (let i = 0; i < throwsInTurn.length; i++) {
    const t = throwsInTurn[i];
    const newScore = current - t.points;

    if (newScore < 0) {
      return { isBust: true, isWin: false, remainingScore: scoreBeforeTurn };
    }

    if (doubleOut) {
      if (newScore === 1) {
        return { isBust: true, isWin: false, remainingScore: scoreBeforeTurn };
      }
      if (newScore === 0) {
        if (isDoubleFinish(t)) {
          return { isBust: false, isWin: true, remainingScore: 0 };
        } else {
          return { isBust: true, isWin: false, remainingScore: scoreBeforeTurn };
        }
      }
    } else {
      if (newScore === 0) {
        return { isBust: false, isWin: true, remainingScore: 0 };
      }
    }

    current = newScore;
  }

  return { isBust: false, isWin: false, remainingScore: current };
}

// Calculate 3-dart average
export function calculate3DartAverage(totalScoreScored: number, totalDartsThrown: number): number {
  if (totalDartsThrown <= 0) return 0;
  return Number(((totalScoreScored / totalDartsThrown) * 3).toFixed(2));
}

// Calculate MPR (Marks Per Round) for Cricket (1 round = 3 darts)
export function calculateMPR(totalMarks: number, totalDarts: number): number {
  if (totalDarts <= 0) return 0;
  const rounds = totalDarts / 3;
  return Number((totalMarks / (rounds || 1)).toFixed(2));
}

// Standard Cricket Targets
export const BASE_CRICKET_TARGETS: (number | string)[] = [20, 19, 18, 17, 16, 15, 25];

export function getActiveCricketTargets(config: CricketConfig): (number | string)[] {
  if (config.includeDoublesTriples) {
    return [20, 19, 18, 17, 16, 15, 25, 'D', 'T'];
  }
  return BASE_CRICKET_TARGETS;
}

// Check if all Cricket targets are closed for a player
export function hasPlayerClosedAllCricketTargets(
  marks: Record<string, number>,
  config: CricketConfig
): boolean {
  const targets = getActiveCricketTargets(config);
  return targets.every((target) => (marks[String(target)] || 0) >= 3);
}

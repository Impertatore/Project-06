import { MAX_ROWS } from './game.js';

export function emptyStats() {
  return {
    played: 0,
    wins: 0,
    losses: 0, // includes quits
    quits: 0,
    currentStreak: 0,
    maxStreak: 0,
    winsByRows: Array(MAX_ROWS).fill(0),
    wordCount: 0, // guesses submitted; hint rows are not counted
    hintsUsed: 0,
  };
}

const isCount = (n) => Number.isInteger(n) && n >= 0;

/** Turns whatever was stored into valid statistics; anything unreadable becomes zero. */
export function normalizeStats(raw) {
  const stats = emptyStats();
  if (!raw || typeof raw !== 'object') return stats;
  for (const key of Object.keys(stats)) {
    if (key === 'winsByRows') {
      if (Array.isArray(raw.winsByRows) && raw.winsByRows.length === MAX_ROWS && raw.winsByRows.every(isCount)) {
        stats.winsByRows = [...raw.winsByRows];
      }
    } else if (isCount(raw[key])) {
      stats[key] = raw[key];
    }
  }
  return stats;
}

/** Adds one finished game. result is 'won', 'lost' or 'quit'; a quit also counts as a loss. */
export function recordGame(stats, { result, rowsUsed, guesses, hints }) {
  const next = { ...stats, winsByRows: [...stats.winsByRows] };
  next.played += 1;
  next.wordCount += guesses;
  next.hintsUsed += hints;
  if (result === 'won') {
    next.wins += 1;
    next.currentStreak += 1;
    next.maxStreak = Math.max(next.maxStreak, next.currentStreak);
    next.winsByRows[rowsUsed - 1] += 1;
  } else {
    next.losses += 1;
    if (result === 'quit') next.quits += 1;
    next.currentStreak = 0;
  }
  return next;
}

export function winPercent(stats) {
  return stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);
}

/** Average hints per game played, to one decimal place. */
export function hintsPerGame(stats) {
  return (stats.played === 0 ? 0 : stats.hintsUsed / stats.played).toFixed(1);
}

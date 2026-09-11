// Local storage access. Every read and write is guarded: if storage is blocked
// or holds junk, the game still works and starts from defaults.

import { emptyStats, normalizeStats } from './logic/stats.js';

const KEYS = {
  stats: 'wordle-practice.stats',
  settings: 'wordle-practice.settings',
  activeGame: 'wordle-practice.active-game',
};

function read(key) {
  try {
    const text = localStorage.getItem(key);
    return text === null ? null : JSON.parse(text);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full: carry on without saving.
  }
}

export const loadStats = () => normalizeStats(read(KEYS.stats));
export const saveStats = (stats) => write(KEYS.stats, stats);
export const resetStats = () => {
  const stats = emptyStats();
  saveStats(stats);
  return stats;
};

/** darkMode is null until the player chooses, so the system setting is used. */
export function loadSettings() {
  const raw = read(KEYS.settings) ?? {};
  return {
    hardMode: raw.hardMode === true,
    darkMode: typeof raw.darkMode === 'boolean' ? raw.darkMode : null,
    highContrast: raw.highContrast === true,
  };
}
export const saveSettings = (settings) => write(KEYS.settings, settings);

/**
 * A started, unfinished game is remembered here, so that leaving the page
 * (reload or close) can be counted as a quit on the next visit.
 */
export function loadActiveGame() {
  const raw = read(KEYS.activeGame);
  if (!raw || !Number.isInteger(raw.guesses) || !Number.isInteger(raw.hints)) return null;
  return { guesses: raw.guesses, hints: raw.hints };
}
export const saveActiveGame = (summary) => write(KEYS.activeGame, summary);
export const clearActiveGame = () => write(KEYS.activeGame, null);

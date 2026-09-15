import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyStats } from '../src/logic/stats.js';
import {
  clearActiveGame,
  loadActiveGame,
  loadSettings,
  loadStats,
  resetStats,
  saveActiveGame,
  saveSettings,
  saveStats,
} from '../src/storage.js';

// The keys are the saved-data format: renaming one orphans every player's data.
const STATS_KEY = 'wordle-practice.stats';
const SETTINGS_KEY = 'wordle-practice.settings';
const ACTIVE_GAME_KEY = 'wordle-practice.active-game';

const DEFAULT_SETTINGS = { hardMode: false, darkMode: null, highContrast: false };

/**
 * Installs an in-memory localStorage on globalThis; storage.js reads the global
 * at call time. failRead / failWrite stand in for blocked or full storage.
 */
function useStorage(entries = {}, { failRead = false, failWrite = false } = {}) {
  const store = new Map(Object.entries(entries));
  const storage = {
    store,
    getItem(key) {
      if (failRead) throw new Error('storage blocked');
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      if (failWrite) throw new Error('storage full');
      store.set(key, String(value));
    },
    removeItem(key) {
      if (failWrite) throw new Error('storage blocked');
      store.delete(key);
    },
  };
  globalThis.localStorage = storage;
  return storage;
}

test('each kind of saved data uses its own key', () => {
  const storage = useStorage();
  saveStats(emptyStats());
  saveSettings(DEFAULT_SETTINGS);
  saveActiveGame({ guesses: 1, hints: 0 });
  assert.deepEqual([...storage.store.keys()].sort(), [ACTIVE_GAME_KEY, SETTINGS_KEY, STATS_KEY].sort());
  assert.deepEqual(JSON.parse(storage.store.get(STATS_KEY)), emptyStats());
  assert.deepEqual(JSON.parse(storage.store.get(SETTINGS_KEY)), DEFAULT_SETTINGS);
  assert.deepEqual(JSON.parse(storage.store.get(ACTIVE_GAME_KEY)), { guesses: 1, hints: 0 });
});

test('empty storage gives statistics of zero', () => {
  useStorage();
  assert.deepEqual(loadStats(), emptyStats());
});

test('unreadable stored statistics give statistics of zero', () => {
  useStorage({ [STATS_KEY]: '{not json' });
  assert.deepEqual(loadStats(), emptyStats());
  useStorage({ [STATS_KEY]: '"nonsense"' });
  assert.deepEqual(loadStats(), emptyStats());
});

test('partly valid stored statistics keep the valid counts', () => {
  useStorage({ [STATS_KEY]: JSON.stringify({ wins: 4, played: -1, winsByRows: [1, 2], junk: 9 }) });
  const stats = loadStats();
  assert.equal(stats.wins, 4);
  assert.equal(stats.played, 0);
  assert.deepEqual(stats.winsByRows, [0, 0, 0, 0, 0, 0]);
  assert.equal(stats.junk, undefined);
});

test('saved statistics are read back', () => {
  useStorage();
  // Every emptyStats() field is non-zero, so a field dropped on load cannot pass the deepEqual below.
  const stats = { played: 3, wins: 2, losses: 1, quits: 1, currentStreak: 2, maxStreak: 2, winsByRows: [0, 1, 1, 0, 0, 0], wordCount: 14, hintsUsed: 3 };
  assert.deepEqual(Object.keys(stats).sort(), Object.keys(emptyStats()).sort());
  saveStats(stats);
  assert.deepEqual(loadStats(), stats);
});

test('resetting statistics returns zeroes and saves them', () => {
  const storage = useStorage({ [STATS_KEY]: JSON.stringify({ ...emptyStats(), played: 5, wins: 5 }) });
  assert.deepEqual(resetStats(), emptyStats());
  assert.deepEqual(JSON.parse(storage.store.get(STATS_KEY)), emptyStats());
  assert.deepEqual(loadStats(), emptyStats());
});

test('missing settings default to off, with dark mode left to the system', () => {
  useStorage();
  assert.deepEqual(loadSettings(), DEFAULT_SETTINGS);
  useStorage({ [SETTINGS_KEY]: '{}' });
  assert.deepEqual(loadSettings(), DEFAULT_SETTINGS);
});

test('settings that are not booleans fall back to the defaults', () => {
  useStorage({ [SETTINGS_KEY]: JSON.stringify({ hardMode: 'true', darkMode: 1, highContrast: 'yes' }) });
  assert.deepEqual(loadSettings(), DEFAULT_SETTINGS);
});

test('dark mode keeps both true and false, and is null only when unset', () => {
  useStorage({ [SETTINGS_KEY]: JSON.stringify({ darkMode: true }) });
  assert.equal(loadSettings().darkMode, true);
  useStorage({ [SETTINGS_KEY]: JSON.stringify({ darkMode: false }) });
  assert.equal(loadSettings().darkMode, false);
  useStorage({ [SETTINGS_KEY]: JSON.stringify({ hardMode: true }) });
  assert.equal(loadSettings().darkMode, null);
});

test('saved settings are read back', () => {
  useStorage();
  const settings = { hardMode: true, darkMode: false, highContrast: true };
  saveSettings(settings);
  assert.deepEqual(loadSettings(), settings);
});

test('no stored active game gives null', () => {
  useStorage();
  assert.equal(loadActiveGame(), null);
});

test('an active game without whole-number guesses and hints is ignored', () => {
  for (const raw of ['null', '"nonsense"', '{}', '{"guesses":1}', '{"hints":0}', '{"guesses":1.5,"hints":0}', '{"guesses":"1","hints":0}', '{"guesses":1,"hints":null}']) {
    useStorage({ [ACTIVE_GAME_KEY]: raw });
    assert.equal(loadActiveGame(), null, `expected null for ${raw}`);
  }
});

test('a stored active game is read back as guesses and hints only', () => {
  useStorage({ [ACTIVE_GAME_KEY]: JSON.stringify({ guesses: 2, hints: 1, answer: 'CRANE' }) });
  assert.deepEqual(loadActiveGame(), { guesses: 2, hints: 1 });
});

test('a saved active game is read back', () => {
  useStorage();
  saveActiveGame({ guesses: 0, hints: 0 });
  assert.deepEqual(loadActiveGame(), { guesses: 0, hints: 0 });
});

test('clearing the active game removes it from storage', () => {
  const storage = useStorage();
  saveActiveGame({ guesses: 3, hints: 2 });
  clearActiveGame();
  assert.equal(storage.store.has(ACTIVE_GAME_KEY), false);
  assert.equal(loadActiveGame(), null);
});

test('blocked reads fall back to the defaults instead of throwing', () => {
  useStorage({ [STATS_KEY]: JSON.stringify(emptyStats()) }, { failRead: true });
  assert.deepEqual(loadStats(), emptyStats());
  assert.deepEqual(loadSettings(), DEFAULT_SETTINGS);
  assert.equal(loadActiveGame(), null);
});

test('blocked writes are dropped instead of throwing', () => {
  const storage = useStorage({}, { failWrite: true });
  assert.doesNotThrow(() => saveStats(emptyStats()));
  assert.doesNotThrow(() => saveSettings(DEFAULT_SETTINGS));
  assert.doesNotThrow(() => saveActiveGame({ guesses: 1, hints: 1 }));
  assert.doesNotThrow(() => clearActiveGame());
  assert.deepEqual(resetStats(), emptyStats());
  assert.equal(storage.store.size, 0);
});

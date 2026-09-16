import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyStats, hintsPerGame, normalizeStats, recordGame, winPercent } from '../src/logic/stats.js';

const win = (rowsUsed, hints = 0) => ({ result: 'won', rowsUsed, guesses: rowsUsed - hints, hints });

test('a win adds to wins, streak and wins by rows used', () => {
  const stats = recordGame(emptyStats(), win(3));
  assert.equal(stats.played, 1);
  assert.equal(stats.wins, 1);
  assert.equal(stats.currentStreak, 1);
  assert.equal(stats.maxStreak, 1);
  assert.deepEqual(stats.winsByRows, [0, 0, 1, 0, 0, 0]);
  assert.equal(stats.wordCount, 3);
});

test('a quit counts as a loss and a quit, and ends the streak', () => {
  let stats = recordGame(emptyStats(), win(2));
  stats = recordGame(stats, { result: 'quit', rowsUsed: 1, guesses: 1, hints: 0 });
  assert.equal(stats.losses, 1);
  assert.equal(stats.quits, 1);
  assert.equal(stats.currentStreak, 0);
  assert.equal(stats.maxStreak, 1);
});

test('a loss is not a quit', () => {
  const stats = recordGame(emptyStats(), { result: 'lost', rowsUsed: 6, guesses: 6, hints: 0 });
  assert.equal(stats.losses, 1);
  assert.equal(stats.quits, 0);
});

test('word count leaves out hint rows', () => {
  const stats = recordGame(emptyStats(), win(2, 1));
  assert.equal(stats.wordCount, 1);
  assert.equal(stats.hintsUsed, 1);
});

test('hints per game is an average to one decimal place', () => {
  let stats = recordGame(emptyStats(), win(4, 3));
  stats = recordGame(stats, win(3, 0));
  assert.equal(hintsPerGame(stats), '1.5');
  assert.equal(hintsPerGame(emptyStats()), '0.0');
});

test('win percentage', () => {
  let stats = recordGame(emptyStats(), win(1));
  stats = recordGame(stats, { result: 'lost', rowsUsed: 6, guesses: 6, hints: 0 });
  stats = recordGame(stats, win(4));
  assert.equal(winPercent(stats), 67);
  assert.equal(winPercent(emptyStats()), 0);
});

test('unreadable stored statistics become zero', () => {
  assert.deepEqual(normalizeStats(null), emptyStats());
  assert.deepEqual(normalizeStats('nonsense'), emptyStats());
  const partial = normalizeStats({ wins: 4, played: -1, winsByRows: [1, 2] });
  assert.equal(partial.wins, 4);
  assert.equal(partial.played, 0);
  assert.deepEqual(partial.winsByRows, [0, 0, 0, 0, 0, 0]);
});

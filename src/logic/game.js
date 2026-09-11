import { hardModeProblem } from './hardMode.js';
import { CORRECT, scoreGuess } from './score.js';

export const WORD_LENGTH = 5;
export const MAX_ROWS = 6;
export const HINTS_PER_GAME = 2;

export const WIN_MESSAGES = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'];

export const WARNINGS = {
  tooShort: 'Please enter 5 letters before pressing Enter',
  notAWord: 'Not a valid word, please try again',
};

const KEY_RANK = { absent: 1, present: 2, correct: 3 };

/**
 * A game is a plain object; every function here returns a new one.
 * status: 'playing' | 'won' | 'lost' | 'quit'
 * rows: [{ word, score, hint }]
 */
export function newGame(answer, { hardMode = false } = {}) {
  return {
    answer: answer.toUpperCase(),
    rows: [],
    current: '',
    hintsLeft: HINTS_PER_GAME,
    status: 'playing',
    hardMode,
  };
}

export const isOver = (game) => game.status !== 'playing';

/** A game has started once a guess has been submitted or a hint used. */
export const hasStarted = (game) => game.rows.length > 0;

export const guessCount = (game) => game.rows.filter((row) => !row.hint).length;

export const hintsUsed = (game) => HINTS_PER_GAME - game.hintsLeft;

export const winMessage = (rowsUsed) => WIN_MESSAGES[rowsUsed - 1];

export function addLetter(game, letter) {
  if (isOver(game) || game.current.length >= WORD_LENGTH || !/^[a-z]$/i.test(letter)) return game;
  return { ...game, current: game.current + letter.toUpperCase() };
}

export function removeLetter(game) {
  if (isOver(game) || game.current === '') return game;
  return { ...game, current: game.current.slice(0, -1) };
}

function addRow(game, word, hint) {
  const score = scoreGuess(word, game.answer);
  const rows = [...game.rows, { word, score, hint }];
  let status = 'playing';
  if (score.every((s) => s === CORRECT)) status = 'won';
  else if (rows.length >= MAX_ROWS) status = 'lost';
  return { ...game, rows, current: '', status };
}

/**
 * Submits the current row. Returns { game, error }.
 * On error the game is unchanged and no row is used.
 */
export function submitGuess(game, isValidWord) {
  if (isOver(game)) return { game, error: null };
  const word = game.current;
  if (word.length < WORD_LENGTH) return { game, error: WARNINGS.tooShort };
  if (!isValidWord(word)) return { game, error: WARNINGS.notAWord };
  if (game.hardMode) {
    const problem = hardModeProblem(word, game.rows);
    if (problem) return { game, error: problem };
  }
  return { game: addRow(game, word, false), error: null };
}

/** Hints need one left, and are never allowed on the last row, so a hint can't lose the game. */
export function canUseHint(game) {
  return !isOver(game) && game.hintsLeft > 0 && game.rows.length < MAX_ROWS - 1;
}

/** Puts the hint word in the current row, replacing anything typed there. */
export function useHint(game, hintWord) {
  if (!canUseHint(game) || !hintWord) return game;
  return { ...addRow(game, hintWord, true), hintsLeft: game.hintsLeft - 1 };
}

export function quitGame(game) {
  if (isOver(game)) return game;
  return { ...game, status: 'quit', current: '' };
}

/** The best score each letter has had so far: correct beats present beats absent. */
export function keyStates(game) {
  const states = {};
  for (const row of game.rows) {
    [...row.word].forEach((letter, i) => {
      const state = row.score[i];
      if (!states[letter] || KEY_RANK[state] > KEY_RANK[states[letter]]) states[letter] = state;
    });
  }
  return states;
}

/** What the statistics need to know about a finished game. */
export function gameSummary(game) {
  return {
    result: game.status,
    rowsUsed: game.rows.length,
    guesses: guessCount(game),
    hints: hintsUsed(game),
  };
}

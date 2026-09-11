import { ABSENT, CORRECT } from './score.js';

const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th'];

function countLetter(word, letter) {
  return [...word].filter((l) => l === letter).length;
}

/**
 * Returns a warning if the guess breaks a hard mode rule, otherwise null.
 * Rules come from every earlier row, including hint rows:
 * - a green letter must stay in the same place;
 * - a yellow (or green) letter must appear in the guess at least as often.
 */
export function hardModeProblem(guess, rows) {
  for (const row of rows) {
    for (let i = 0; i < row.word.length; i++) {
      if (row.score[i] === CORRECT && guess[i] !== row.word[i]) {
        return `${ORDINALS[i]} letter must be ${row.word[i]}`;
      }
    }
  }

  for (const row of rows) {
    const needed = {};
    for (let i = 0; i < row.word.length; i++) {
      if (row.score[i] !== ABSENT) needed[row.word[i]] = (needed[row.word[i]] ?? 0) + 1;
    }
    for (const [letter, count] of Object.entries(needed)) {
      if (countLetter(guess, letter) < count) return `Guess must contain ${letter}`;
    }
  }

  return null;
}

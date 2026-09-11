export const CORRECT = 'correct';
export const PRESENT = 'present';
export const ABSENT = 'absent';

/**
 * Scores a guess against the answer, letter by letter.
 * Correct letters are matched first; present letters are then matched left to
 * right, using only answer letters that are still unmatched.
 */
export function scoreGuess(guess, answer) {
  const score = Array(guess.length).fill(ABSENT);
  const unmatched = {};

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) {
      score[i] = CORRECT;
    } else {
      unmatched[answer[i]] = (unmatched[answer[i]] ?? 0) + 1;
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (score[i] !== CORRECT && unmatched[guess[i]] > 0) {
      score[i] = PRESENT;
      unmatched[guess[i]]--;
    }
  }

  return score;
}

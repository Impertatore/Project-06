import { hardModeProblem } from './hardMode.js';
import { ABSENT, CORRECT, scoreGuess } from './score.js';

/**
 * What the player has found so far: the places known to be green, and for each
 * letter the most copies shown green or yellow in any one row.
 */
function knownFinds(rows) {
  const greens = new Set();
  const letters = {};
  for (const row of rows) {
    const inRow = {};
    row.score.forEach((s, i) => {
      if (s === CORRECT) greens.add(i);
      if (s !== ABSENT) inRow[row.word[i]] = (inRow[row.word[i]] ?? 0) + 1;
    });
    for (const [letter, count] of Object.entries(inRow)) {
      letters[letter] = Math.max(letters[letter] ?? 0, count);
    }
  }
  return { greens, letters };
}

/**
 * True if the word would show something new: a green in a place not yet known,
 * or a letter (or an extra copy of one) not yet found in the answer.
 * With nothing found yet, any green or yellow letter is new.
 */
function addsNewFind(word, answer, known) {
  const score = scoreGuess(word, answer);
  if (score.some((s, i) => s === CORRECT && !known.greens.has(i))) return true;
  const found = {};
  score.forEach((s, i) => {
    if (s !== ABSENT) found[word[i]] = (found[word[i]] ?? 0) + 1;
  });
  return Object.entries(found).some(([letter, count]) => count > (known.letters[letter] ?? 0));
}

/**
 * Words that may be given as a hint: from the answer list, not the answer,
 * not already in the grid. A hint keeps what the player has found: every green
 * letter from earlier rows stays in its place, and every yellow letter appears
 * somewhere (possibly in its right place, by chance). These are the hard mode
 * rules, applied to hints whether hard mode is on or not. A hint must also add
 * at least one new find.
 */
export function hintCandidates(game, answers) {
  const used = new Set(game.rows.map((row) => row.word));
  const known = knownFinds(game.rows);
  return answers.filter(
    (word) =>
      word !== game.answer &&
      !used.has(word) &&
      hardModeProblem(word, game.rows) === null &&
      addsNewFind(word, game.answer, known),
  );
}

/** Picks a hint word at random, or returns null if no word other than the answer qualifies. */
export function pickHint(game, answers, random = Math.random) {
  const candidates = hintCandidates(game, answers);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(random() * candidates.length)];
}

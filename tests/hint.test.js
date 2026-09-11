import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addLetter, newGame, submitGuess, useHint } from '../src/logic/game.js';
import { hintCandidates, pickHint } from '../src/logic/hint.js';
import { ABSENT, scoreGuess } from '../src/logic/score.js';
import { ANSWERS } from '../src/words/answers.js';

const guess = (game, word) => submitGuess([...word].reduce(addLetter, game), () => true).game;

test('a hint word follows every rule in spec 3.7', () => {
  const answerSet = new Set(ANSWERS);
  let game = newGame('CRANE');
  game = useHint(game, 'SLATE'); // SLATE is now in the grid

  for (let i = 0; i < 500; i++) {
    const word = pickHint(game, ANSWERS);
    assert.ok(answerSet.has(word), `${word} is in the answer list`);
    assert.notEqual(word, 'CRANE', 'never the answer');
    assert.notEqual(word, 'SLATE', 'never a word already in the grid');
    assert.ok(scoreGuess(word, 'CRANE').some((s) => s !== ABSENT), `${word} has a green or yellow letter`);
    // SLATE already found A and E, so a hint must find C, R or N.
    const found = [...word].filter((letter, i) => scoreGuess(word, 'CRANE')[i] !== ABSENT);
    assert.ok(found.some((letter) => 'CRN'.includes(letter)), `${word} finds something new`);
  }
});

test('a hint must add a new find (bug: NERVE after APPLE and FERAL)', () => {
  // Answer THREW. APPLE shows E yellow; FERAL shows E yellow and R green.
  // NERVE kept R and E but found nothing new: its N, V and second E were grey.
  let game = guess(newGame('THREW'), 'APPLE');
  game = guess(game, 'FERAL');
  const candidates = hintCandidates(game, ANSWERS);
  assert.ok(!candidates.includes('NERVE'), 'NERVE is not a hint');
  assert.ok(candidates.includes('HORSE'), 'HORSE is a hint: it finds H');
  assert.ok(candidates.length > 0);
  for (const word of candidates) {
    const score = scoreGuess(word, 'THREW');
    const newGreen = score.some((s, i) => s === 'correct' && i !== 2);
    const newLetter = [...word].some((letter, i) => score[i] !== ABSENT && 'THW'.includes(letter));
    assert.ok(newGreen || newLetter, `${word} finds something new`);
  }
});

test('moving a yellow letter into its right place counts as a new find', () => {
  const game = guess(newGame('CRANE'), 'TRAIN'); // N yellow
  assert.deepEqual(hintCandidates(game, ['BRAND', 'GRAIN']), ['BRAND']); // GRAIN leaves N yellow
});

test('finding a second copy of a letter counts as a new find', () => {
  // Answer BELLE. SMELT shows E yellow and L green (4th): one L is known.
  const game = guess(newGame('BELLE'), 'SMELT');
  // Made-up strings isolate the rule: both keep L 4th and use E, with no new green.
  // LXELX shows a second L (yellow); XXELX shows nothing new.
  assert.deepEqual(hintCandidates(game, ['LXELX', 'XXELX']), ['LXELX']);
});

test('a hint keeps green letters in place', () => {
  const game = guess(newGame('CRANE'), 'SLATE'); // A 3rd and E 5th are green
  const candidates = hintCandidates(game, ANSWERS);
  assert.ok(candidates.length > 0);
  for (const word of candidates) {
    assert.equal(word[2], 'A', `${word} keeps A 3rd`);
    assert.equal(word[4], 'E', `${word} keeps E 5th`);
  }
});

test('a hint uses yellow letters, in any place', () => {
  const game = guess(newGame('CRANE'), 'TRAIN'); // R and A green, N yellow
  const candidates = hintCandidates(game, ['BRAND', 'PRANK', 'BRAKE', 'GROAN', 'CRANE']);
  // BRAND puts N in its right place by chance; PRANK does not. Both are fine.
  // BRAKE has no N, GROAN moves A, CRANE is the answer.
  assert.deepEqual(candidates, ['BRAND', 'PRANK']);
  for (const word of hintCandidates(game, ANSWERS)) {
    assert.ok(word[1] === 'R' && word[2] === 'A' && word.includes('N'), word);
  }
});

test('finds from an earlier hint are kept too', () => {
  const game = useHint(newGame('CRANE'), 'TRAIN');
  const candidates = hintCandidates(game, ANSWERS);
  assert.ok(candidates.length > 0);
  for (const word of candidates) {
    assert.ok(word[1] === 'R' && word[2] === 'A' && word.includes('N'), word);
  }
});

test('finds from every earlier row are kept', () => {
  let game = guess(newGame('CRANE'), 'PLATE'); // A 3rd, E 5th green
  game = guess(game, 'NOISY'); // N yellow
  const candidates = hintCandidates(game, ANSWERS);
  assert.ok(candidates.length > 0);
  for (const word of candidates) {
    assert.ok(word[2] === 'A' && word[4] === 'E' && word.includes('N'), word);
  }
});

test('no hint when only the answer fits', () => {
  const game = guess(newGame('CRANE'), 'DRANE'); // R, A, N, E green
  assert.equal(pickHint(game, ['CRANE', 'CRONE', 'PRANK']), null);
  assert.equal(pickHint(game, ANSWERS), null);
});

// The first hint table in spec section 3.7: [already in grid, possible hint word, allowed?]
const HINT_TABLE = [
  [[], 'TRAIN', true],
  [[], 'SLATE', true],
  [['SLATE'], 'SLATE', false],
  [[], 'PLUMB', false],
  [[], 'CRANE', false],
  [['SLATE'], 'SNAKE', true],
  [['SLATE'], 'STAKE', false],
  [['SLATE'], 'TRAIN', false],
  [['TRAIN'], 'GRAIN', false],
  [['TRAIN'], 'PRANK', true],
  [['TRAIN'], 'BRAND', true],
  [['TRAIN'], 'BRAKE', false],
];

for (const [earlier, word, allowed] of HINT_TABLE) {
  test(`with ${earlier.join(', ') || 'nothing'} in the grid, ${word} is ${allowed ? '' : 'not '}a hint`, () => {
    const game = earlier.reduce(guess, newGame('CRANE'));
    assert.equal(hintCandidates(game, [word]).length === 1, allowed);
  });
}

test('with CRANK in the grid, only the answer fits, so there is no hint', () => {
  assert.equal(pickHint(guess(newGame('CRANE'), 'CRANK'), ANSWERS), null);
});

test('pickHint returns null when no word qualifies', () => {
  assert.equal(pickHint(newGame('CRANE'), ['PLUMB', 'CRANE']), null);
});

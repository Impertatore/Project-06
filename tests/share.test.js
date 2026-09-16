import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addLetter, newGame, quitGame, submitGuess, useHint } from '../src/logic/game.js';
import { shareText } from '../src/logic/share.js';

const guess = (game, word) => submitGuess([...word].reduce(addLetter, game), () => true).game;

test('share text matches the example in spec 3.6', () => {
  let game = useHint(newGame('CRANE'), 'TRAIN');
  game = guess(game, 'SLATE');
  game = guess(game, 'CRANE');
  assert.equal(shareText(game), 'Wordle Practice 3/6\n⬜🟩🟩⬜🟨 💡\n⬜⬜🟩⬜🟩\n🟩🟩🟩🟩🟩');
});

test('share text has no letters of the answer', () => {
  const game = guess(newGame('CRANE'), 'CRANE');
  assert.doesNotMatch(shareText(game).replace('Wordle Practice', ''), /[A-Z]/);
});

test('a game using all three hints marks three rows with the hint emoji (spec 3.6, criterion 12)', () => {
  let game = newGame('CRANE');
  for (const word of ['TRAIN', 'SLATE', 'PLACE']) game = useHint(game, word);
  game = guess(game, 'CRANE');
  const lines = shareText(game).split('\n');
  assert.equal(lines.length, 5); // title + 3 hint rows + 1 guess row
  assert.ok(lines.slice(1, 4).every((line) => line.endsWith(' 💡')));
  assert.ok(!lines[4].endsWith(' 💡'));
  assert.doesNotMatch(lines.join('\n').replace('Wordle Practice', ''), /[A-Z]/);
});

test('a quit shows X/6, hard mode adds *, high contrast swaps colours', () => {
  const game = quitGame(guess(newGame('CRANE', { hardMode: true }), 'TRAIN'));
  assert.equal(shareText(game, { highContrast: true }), 'Wordle Practice X/6*\n⬜🟧🟧⬜🟦');
});

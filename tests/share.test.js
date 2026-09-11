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

test('a quit shows X/6, hard mode adds *, high contrast swaps colours', () => {
  const game = quitGame(guess(newGame('CRANE', { hardMode: true }), 'TRAIN'));
  assert.equal(shareText(game, { highContrast: true }), 'Wordle Practice X/6*\n⬜🟧🟧⬜🟦');
});

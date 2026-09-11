import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scoreGuess } from '../src/logic/score.js';

const EMOJI = { correct: '🟩', present: '🟨', absent: '⬜' };
const asEmoji = (score) => score.map((s) => EMOJI[s]).join('');

// The colouring table in spec section 3.5.
const TABLE = [
  ['CRANE', 'CRANE', '🟩🟩🟩🟩🟩'],
  ['CRANE', 'SLATE', '⬜⬜🟩⬜🟩'],
  ['CRANE', 'EERIE', '⬜⬜🟨⬜🟩'],
  ['APPLE', 'PUPPY', '🟨⬜🟩⬜⬜'],
  ['ROBOT', 'FLOOR', '⬜⬜🟨🟩🟨'],
];

for (const [answer, guess, expected] of TABLE) {
  test(`${guess} against ${answer} scores ${expected}`, () => {
    assert.equal(asEmoji(scoreGuess(guess, answer)), expected);
  });
}

test('hint examples from spec 3.7 score as described', () => {
  assert.equal(asEmoji(scoreGuess('TRAIN', 'CRANE')), '⬜🟩🟩⬜🟨');
  assert.equal(asEmoji(scoreGuess('PLUMB', 'CRANE')), '⬜⬜⬜⬜⬜');
});

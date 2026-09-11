import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ANSWERS } from '../src/words/answers.js';
import { GUESSES } from '../src/words/guesses.js';

const guessSet = new Set(GUESSES);

test('every answer is in the guess list', () => {
  const missing = ANSWERS.filter((w) => !guessSet.has(w));
  assert.deepEqual(missing, []);
});

test('every word is exactly 5 letters, A-Z only', () => {
  const bad = [...ANSWERS, ...GUESSES].filter((w) => !/^[A-Z]{5}$/.test(w));
  assert.deepEqual(bad, []);
});

test('the answer list has at least 2,000 words and the guess list at least 10,000', () => {
  assert.ok(ANSWERS.length >= 2000, `answers: ${ANSWERS.length}`);
  assert.ok(GUESSES.length >= 10000, `guesses: ${GUESSES.length}`);
});

test('US and UK spellings are both accepted', () => {
  for (const word of ['FIBER', 'FIBRE', 'SABER', 'SABRE']) assert.ok(guessSet.has(word), word);
});

test('lists have no duplicates', () => {
  assert.equal(new Set(ANSWERS).size, ANSWERS.length);
  assert.equal(guessSet.size, GUESSES.length);
});

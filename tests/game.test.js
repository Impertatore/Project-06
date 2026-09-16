import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  addLetter,
  canUseHint,
  gameSummary,
  HINTS_PER_GAME,
  keyStates,
  newGame,
  quitGame,
  removeLetter,
  submitGuess,
  useHint,
  WARNINGS,
  winMessage,
} from '../src/logic/game.js';

const WORDS = new Set(['CRANE', 'SLATE', 'TRAIN', 'PLACE', 'BRINE', 'BRAKE', 'PRANK', 'MOIST', 'FIBER', 'FIBRE']);
const isValid = (w) => WORDS.has(w);

const type = (game, text) => [...text].reduce(addLetter, game);
function guess(game, word) {
  const result = submitGuess(type(game, word), isValid);
  assert.equal(result.error, null, `expected ${word} to be accepted`);
  return result.game;
}

describe('typing', () => {
  test('letters show in uppercase', () => {
    assert.equal(type(newGame('CRANE'), 'cra').current, 'CRA');
  });

  test('a sixth letter is ignored', () => {
    assert.equal(type(newGame('CRANE'), 'cranes').current, 'CRANE');
  });

  test('only A-Z are accepted', () => {
    assert.equal(type(newGame('CRANE'), 'cr1! é').current, 'CR');
  });

  test('backspace removes the last letter, and does nothing on an empty row', () => {
    const game = type(newGame('CRANE'), 'cr');
    assert.equal(removeLetter(game).current, 'C');
    const empty = newGame('CRANE');
    assert.equal(removeLetter(empty), empty);
  });

  test('typing does nothing after the game ends', () => {
    const won = guess(newGame('CRANE'), 'CRANE');
    assert.equal(addLetter(won, 'A'), won);
    assert.equal(removeLetter(won), won);
  });
});

describe('submitting', () => {
  test('fewer than 5 letters is rejected without using a row', () => {
    const game = type(newGame('CRANE'), 'cran');
    const result = submitGuess(game, isValid);
    assert.equal(result.error, WARNINGS.tooShort);
    assert.equal(result.game, game);
  });

  test('a word not in the list is rejected and keeps its letters', () => {
    const game = type(newGame('CRANE'), 'zzzzz');
    const result = submitGuess(game, isValid);
    assert.equal(result.error, 'Not a valid word, please try again');
    assert.equal(result.game.current, 'ZZZZZ');
    assert.equal(result.game.rows.length, 0);
  });

  test('US and UK spellings are both accepted', () => {
    assert.equal(guess(newGame('CRANE'), 'fiber').rows.length, 1);
    assert.equal(guess(newGame('CRANE'), 'fibre').rows.length, 1);
  });

  test('a valid guess is coloured and the next row becomes current', () => {
    const game = guess(newGame('CRANE'), 'slate');
    assert.deepEqual(game.rows[0].score, ['absent', 'absent', 'correct', 'absent', 'correct']);
    assert.equal(game.current, '');
  });
});

describe('winning and losing', () => {
  test('an all-green guess wins', () => {
    assert.equal(guess(newGame('CRANE'), 'CRANE').status, 'won');
  });

  test('six wrong guesses lose', () => {
    let game = newGame('CRANE');
    for (let i = 0; i < 5; i++) game = guess(game, 'MOIST');
    assert.equal(game.status, 'playing');
    game = guess(game, 'MOIST');
    assert.equal(game.status, 'lost');
  });

  test('win messages match spec 3.6', () => {
    assert.deepEqual(
      [1, 2, 3, 4, 5, 6].map(winMessage),
      ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'],
    );
  });

  test('a hint row counts towards rows used', () => {
    let game = useHint(newGame('CRANE'), 'TRAIN');
    game = guess(game, 'CRANE');
    assert.equal(game.rows.length, 2);
    assert.equal(winMessage(game.rows.length), 'Magnificent');
  });

  test('quitting ends the game and clears typed letters', () => {
    const game = quitGame(type(guess(newGame('CRANE'), 'SLATE'), 'cr'));
    assert.equal(game.status, 'quit');
    assert.equal(game.current, '');
  });
});

describe('hints', () => {
  test('a new game starts with three hints', () => {
    assert.equal(HINTS_PER_GAME, 3);
    assert.equal(newGame('CRANE').hintsLeft, 3);
  });

  test('a hint fills the current row, replacing typed letters', () => {
    const game = useHint(type(newGame('CRANE'), 'cr'), 'TRAIN');
    assert.equal(game.rows[0].word, 'TRAIN');
    assert.equal(game.rows[0].hint, true);
    assert.equal(game.current, '');
    assert.equal(game.hintsLeft, HINTS_PER_GAME - 1);
  });

  test('only three hints per game', () => {
    let game = useHint(newGame('CRANE'), 'TRAIN');
    game = useHint(game, 'SLATE');
    assert.equal(game.hintsLeft, 1);
    assert.equal(canUseHint(game), true);
    game = useHint(game, 'PLACE');
    assert.equal(game.hintsLeft, 0);
    assert.equal(game.rows.length, 3);
    assert.ok(game.rows.every((row) => row.hint));
    assert.equal(canUseHint(game), false);
    assert.equal(useHint(game, 'BRINE'), game);
  });

  test('three hints then a winning guess counts as four rows used', () => {
    let game = useHint(newGame('CRANE'), 'TRAIN');
    game = useHint(game, 'SLATE');
    game = useHint(game, 'PLACE');
    game = guess(game, 'CRANE');
    const summary = gameSummary(game);
    assert.equal(summary.result, 'won');
    assert.equal(summary.hints, 3);
    assert.equal(summary.guesses, 1);
    assert.equal(summary.rowsUsed, 4);
    assert.equal(winMessage(summary.rowsUsed), 'Splendid');
  });

  test('no hint when only the last row is left', () => {
    let game = newGame('CRANE');
    for (let i = 0; i < 5; i++) game = guess(game, 'MOIST');
    assert.equal(game.hintsLeft, HINTS_PER_GAME);
    assert.equal(canUseHint(game), false);
  });

  test('no hint after the game ends', () => {
    assert.equal(canUseHint(guess(newGame('CRANE'), 'CRANE')), false);
  });
});

describe('hard mode', () => {
  // The hard mode table in spec section 3.10.
  const TABLE = [
    [['SLATE'], 'BRINE', '3rd letter must be A'],
    [['SLATE'], 'PLACE', null],
    [['TRAIN'], 'BRAKE', 'Guess must contain N'],
    [['TRAIN'], 'PRANK', null],
  ];

  for (const [earlier, next, expected] of TABLE) {
    test(`after ${earlier.join(', ')}, ${next} is ${expected ?? 'accepted'}`, () => {
      let game = newGame('CRANE', { hardMode: true });
      for (const word of earlier) game = guess(game, word);
      const result = submitGuess(type(game, next), isValid);
      assert.equal(result.error, expected);
    });
  }

  test('letters revealed by a hint row count for later guesses', () => {
    const game = useHint(newGame('CRANE', { hardMode: true }), 'TRAIN');
    assert.equal(submitGuess(type(game, 'BRAKE'), isValid).error, 'Guess must contain N');
  });

  test('hard mode rules do not apply when hard mode is off', () => {
    const game = guess(newGame('CRANE'), 'SLATE');
    assert.equal(submitGuess(type(game, 'BRINE'), isValid).error, null);
  });
});

test('key colours keep the best score for each letter', () => {
  let game = guess(newGame('CRANE'), 'TRAIN'); // N present
  game = guess(game, 'BRINE'); // N correct
  const keys = keyStates(game);
  assert.equal(keys.N, 'correct');
  assert.equal(keys.T, 'absent');
  assert.equal(keys.R, 'correct');
});

test('game summary counts guesses and hints separately', () => {
  let game = useHint(newGame('CRANE'), 'TRAIN');
  game = guess(game, 'SLATE');
  game = guess(game, 'CRANE');
  assert.deepEqual(gameSummary(game), { result: 'won', rowsUsed: 3, guesses: 2, hints: 1 });
});

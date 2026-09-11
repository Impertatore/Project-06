import { MAX_ROWS } from './game.js';

const EMOJI = { correct: '🟩', present: '🟨', absent: '⬜' };
const HIGH_CONTRAST_EMOJI = { correct: '🟧', present: '🟦', absent: '⬜' };

/** The text copied by Share: a score line, then one emoji row per used row. No letters. */
export function shareText(game, { highContrast = false } = {}) {
  const emoji = highContrast ? HIGH_CONTRAST_EMOJI : EMOJI;
  const score = game.status === 'won' ? game.rows.length : 'X';
  const title = `Wordle Practice ${score}/${MAX_ROWS}${game.hardMode ? '*' : ''}`;
  const rows = game.rows.map(
    (row) => row.score.map((s) => emoji[s]).join('') + (row.hint ? ' 💡' : ''),
  );
  return [title, ...rows].join('\n');
}

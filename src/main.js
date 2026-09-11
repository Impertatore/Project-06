import './style.css';
import * as Game from './logic/game.js';
import { pickHint } from './logic/hint.js';
import { shareText } from './logic/share.js';
import { hintsPerGame, recordGame, winPercent } from './logic/stats.js';
import * as storage from './storage.js';
import { ANSWERS } from './words/answers.js';
import { GUESSES } from './words/guesses.js';

const GUESS_SET = new Set(GUESSES);
const isValidWord = (word) => GUESS_SET.has(word);

const FLIP_MS = 500;
const STAGGER_MS = 250;
const TOAST_MS = 2500;
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', ['Enter', ...'ZXCVBNM', 'Backspace']];

const $ = (id) => document.getElementById(id);
const el = {
  game: $('game'),
  board: $('board'),
  keyboard: $('keyboard'),
  hintBtn: $('hint-btn'),
  toast: $('toast'),
  announcePolite: $('announce-polite'),
  announceAssertive: $('announce-assertive'),
  endDialog: $('end-dialog'),
  endTitle: $('end-title'),
  endText: $('end-text'),
  statsDialog: $('stats-dialog'),
  statGrid: $('stat-grid'),
  distribution: $('distribution'),
  statsShareBtn: $('stats-share-btn'),
  helpDialog: $('help-dialog'),
  settingsDialog: $('settings-dialog'),
  hardModeSwitch: $('hard-mode-switch'),
  darkModeSwitch: $('dark-mode-switch'),
  highContrastSwitch: $('high-contrast-switch'),
  confirmDialog: $('confirm-dialog'),
  confirmMessage: $('confirm-message'),
  confirmOk: $('confirm-ok'),
};

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const systemDark = matchMedia('(prefers-color-scheme: dark)');

let settings = storage.loadSettings();
let stats = storage.loadStats();
let game;
let busy = false; // true while a row is being revealed

// ---------------------------------------------------------------------------
// Testing aid (spec 3.13): with `npm run dev`, ?answer=CRANE fixes the answer.
// import.meta.env.DEV is false in the built app, so this has no effect there.
function fixedAnswer() {
  if (!import.meta.env.DEV) return null;
  const value = new URLSearchParams(location.search).get('answer');
  return value && /^[a-z]{5}$/i.test(value) ? value.toUpperCase() : null;
}

function randomAnswer() {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}

// ---------------------------------------------------------------------------
// Game flow

function startGame() {
  game = Game.newGame(fixedAnswer() ?? randomAnswer(), { hardMode: settings.hardMode });
  if (el.endDialog.open) el.endDialog.close();
  render();
  announce('New game. Guess the 5-letter word.');
}

/** Saves progress, or records the game in the statistics once it is over. */
function saveProgress() {
  if (Game.isOver(game)) {
    stats = recordGame(stats, Game.gameSummary(game));
    storage.saveStats(stats);
    storage.clearActiveGame();
  } else if (Game.hasStarted(game)) {
    storage.saveActiveGame({ guesses: Game.guessCount(game), hints: Game.hintsUsed(game) });
  }
}

/** A started game left by reloading or closing the page counts as a quit. */
function recordLeftGame() {
  const left = storage.loadActiveGame();
  if (!left) return;
  stats = recordGame(stats, { result: 'quit', rowsUsed: 0, ...left });
  storage.saveStats(stats);
  storage.clearActiveGame();
}

function typeLetter(letter) {
  if (busy) return;
  game = Game.addLetter(game, letter);
  renderBoard();
}

function backspace() {
  if (busy) return;
  game = Game.removeLetter(game);
  renderBoard();
}

async function submit() {
  if (busy || Game.isOver(game)) return;
  const { game: next, error } = Game.submitGuess(game, isValidWord);
  if (error) {
    shakeCurrentRow();
    showToast(error);
    return;
  }
  game = next;
  await revealNewRow();
}

async function useHint() {
  if (busy || !Game.canUseHint(game)) return;
  const word = pickHint(game, ANSWERS);
  if (!word) {
    // No hint is used up.
    showToast('No hint available: no word other than the answer keeps your finds and adds a new one');
    return;
  }
  game = Game.useHint(game, word);
  await revealNewRow();
}

async function revealNewRow() {
  busy = true;
  saveProgress();
  const index = game.rows.length - 1;
  renderBoard({ reveal: index });
  renderHintButton();
  await wait(reducedMotion.matches ? 0 : STAGGER_MS * (Game.WORD_LENGTH - 1) + FLIP_MS);
  renderKeyboard();
  announceRow(index);
  busy = false;
  if (Game.isOver(game)) showEndDialog();
}

async function newGamePressed() {
  if (busy) return;
  if (!Game.hasStarted(game) || Game.isOver(game)) {
    startGame();
    return;
  }
  const quit = await confirm('Quit this game? It will count as a loss.', 'Quit');
  if (!quit || Game.isOver(game)) return;
  game = Game.quitGame(game);
  saveProgress();
  render();
  showEndDialog();
}

async function share() {
  try {
    await navigator.clipboard.writeText(shareText(game, { highContrast: settings.highContrast }));
    showToast('Copied');
  } catch {
    showToast('Could not copy to the clipboard');
  }
}

// ---------------------------------------------------------------------------
// Rendering

function buildBoard() {
  for (let r = 0; r < Game.MAX_ROWS; r++) {
    const row = document.createElement('div');
    row.className = 'row';
    row.setAttribute('role', 'group');
    for (let i = 0; i < Game.WORD_LENGTH; i++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.style.setProperty('--i', i);
      tile.setAttribute('aria-hidden', 'true');
      row.append(tile);
    }
    el.board.append(row);
  }
}

function buildKeyboard() {
  for (const keys of KEY_ROWS) {
    const row = document.createElement('div');
    row.className = 'key-row';
    for (const key of keys) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'key';
      button.dataset.key = key;
      if (key === 'Enter') {
        button.textContent = 'Enter';
        button.classList.add('wide');
      } else if (key === 'Backspace') {
        button.textContent = '⌫';
        button.classList.add('wide');
        button.setAttribute('aria-label', 'Backspace');
      } else {
        button.textContent = key;
      }
      row.append(button);
    }
    el.keyboard.append(row);
  }
}

function render() {
  renderBoard();
  renderKeyboard();
  renderHintButton();
}

function renderBoard({ reveal = -1 } = {}) {
  [...el.board.children].forEach((rowEl, r) => {
    const row = game.rows[r];
    const isCurrent = r === game.rows.length && !Game.isOver(game);
    const letters = row ? row.word : isCurrent ? game.current : '';
    [...rowEl.children].forEach((tile, i) => {
      tile.textContent = letters[i] ?? '';
      tile.dataset.state = row ? row.score[i] : letters[i] ? 'filled' : 'empty';
      tile.classList.toggle('reveal', r === reveal);
    });
    rowEl.classList.toggle('hint-row', Boolean(row?.hint));
    rowEl.setAttribute('aria-label', rowLabel(r, row, letters));
  });
}

function rowLabel(index, row, letters) {
  const name = `Row ${index + 1}`;
  if (row) return `${name}${row.hint ? ', hint' : ''}: ${row.word}. ${describeScore(row)}`;
  return letters ? `${name}: ${[...letters].join(' ')}` : `${name}: empty`;
}

function describeScore(row) {
  return [...row.word].map((letter, i) => `${letter} ${row.score[i]}`).join(', ');
}

function renderKeyboard() {
  const states = Game.keyStates(game);
  for (const key of el.keyboard.querySelectorAll('.key')) {
    const letter = key.dataset.key;
    if (letter.length !== 1) continue;
    const state = states[letter];
    if (state) key.dataset.state = state;
    else delete key.dataset.state;
    key.setAttribute('aria-label', state ? `${letter}, ${state}` : letter);
  }
}

function renderHintButton() {
  el.hintBtn.textContent = `Hint (${game.hintsLeft})`;
  el.hintBtn.disabled = !Game.canUseHint(game);
}

function shakeCurrentRow() {
  const rowEl = el.board.children[game.rows.length];
  if (!rowEl) return;
  rowEl.classList.remove('shake');
  void rowEl.offsetWidth; // restart the animation
  rowEl.classList.add('shake');
  rowEl.addEventListener('animationend', () => rowEl.classList.remove('shake'), { once: true });
}

function showEndDialog() {
  const answer = game.answer;
  if (game.status === 'won') {
    const rows = game.rows.length;
    el.endTitle.textContent = Game.winMessage(rows);
    el.endText.textContent = `You found ${answer} in ${rows} ${rows === 1 ? 'row' : 'rows'}.`;
  } else if (game.status === 'lost') {
    el.endTitle.textContent = 'Out of rows';
    el.endText.textContent = `The word was ${answer}.`;
  } else {
    el.endTitle.textContent = 'Game quit';
    el.endText.textContent = `The word was ${answer}.`;
  }
  openDialog(el.endDialog);
  announce(`${el.endTitle.textContent}. ${el.endText.textContent}`);
}

function renderStats() {
  const items = [
    ['Played', stats.played],
    ['Wins', stats.wins],
    ['Losses', stats.losses],
    ['Quits', stats.quits],
    ['Win %', winPercent(stats)],
    ['Current streak', stats.currentStreak],
    ['Max streak', stats.maxStreak],
    ['Word count', stats.wordCount],
    ['Hints per game', hintsPerGame(stats)],
  ];
  el.statGrid.replaceChildren(
    ...items.map(([label, value]) => {
      const item = document.createElement('div');
      item.className = 'stat';
      const dd = document.createElement('dd');
      dd.textContent = value;
      const dt = document.createElement('dt');
      dt.textContent = label;
      item.append(dd, dt);
      return item;
    }),
  );

  const most = Math.max(1, ...stats.winsByRows);
  const thisGame = game.status === 'won' ? game.rows.length - 1 : -1;
  el.distribution.replaceChildren(
    ...stats.winsByRows.map((count, i) => {
      const li = document.createElement('li');
      li.setAttribute('aria-label', `${i + 1} ${i === 0 ? 'row' : 'rows'}: ${count} ${count === 1 ? 'win' : 'wins'}`);
      const label = document.createElement('span');
      label.className = 'dist-label';
      label.textContent = i + 1;
      label.setAttribute('aria-hidden', 'true');
      const bar = document.createElement('span');
      bar.className = 'dist-bar';
      bar.classList.toggle('this-game', i === thisGame);
      bar.style.width = `${Math.max(8, (count / most) * 100)}%`;
      bar.textContent = count;
      bar.setAttribute('aria-hidden', 'true');
      li.append(label, bar);
      return li;
    }),
  );

  el.statsShareBtn.hidden = !Game.isOver(game);
}

function applySettings() {
  const dark = settings.darkMode ?? systemDark.matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.contrast = settings.highContrast ? 'high' : 'normal';
  el.hardModeSwitch.checked = settings.hardMode;
  el.darkModeSwitch.checked = dark;
  el.highContrastSwitch.checked = settings.highContrast;
}

// ---------------------------------------------------------------------------
// Messages, dialogs and focus

let toastTimer;
function showToast(message) {
  el.toast.textContent = message;
  // Re-show so the popover sits above any panel that opened since.
  if (el.toast.matches(':popover-open')) el.toast.hidePopover();
  el.toast.showPopover();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.hidePopover(), TOAST_MS);
  announce(message, true);
}

function announce(message, urgent = false) {
  const region = urgent ? el.announceAssertive : el.announcePolite;
  region.textContent = '';
  // A fresh text node makes screen readers read the same message again.
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

function announceRow(index) {
  const row = game.rows[index];
  const hints = row.hint ? ` ${game.hintsLeft} ${game.hintsLeft === 1 ? 'hint' : 'hints'} left.` : '';
  announce(`${rowLabel(index, row, row.word)}.${hints}`);
}

function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
}

function confirm(message, confirmLabel) {
  el.confirmMessage.textContent = message;
  el.confirmOk.textContent = confirmLabel;
  el.confirmDialog.returnValue = '';
  openDialog(el.confirmDialog);
  return new Promise((resolve) => {
    el.confirmDialog.addEventListener('close', () => resolve(el.confirmDialog.returnValue === 'confirm'), {
      once: true,
    });
  });
}

/** After a button press or a panel closing, focus goes back to the game so Enter submits. */
function focusGame() {
  if (!document.querySelector('dialog[open]')) el.game.focus({ preventScroll: true });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Events

function onKeyDown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (document.querySelector('dialog[open]')) return; // panels handle their own keys
  const onControl = event.target instanceof Element && event.target.closest('button, input, a');
  if (onControl && (event.key === 'Enter' || event.key === ' ')) return; // press the focused button

  if (event.key === 'Enter') {
    event.preventDefault();
    submit();
  } else if (event.key === 'Backspace') {
    event.preventDefault();
    backspace();
  } else if (/^[a-z]$/i.test(event.key)) {
    typeLetter(event.key);
  }
}

function onScreenKey(event) {
  const key = event.target.closest('.key')?.dataset.key;
  if (!key) return;
  if (key === 'Enter') submit();
  else if (key === 'Backspace') backspace();
  else typeLetter(key);
  focusGame();
}

function onHardModeChange() {
  if (Game.hasStarted(game)) {
    el.hardModeSwitch.checked = settings.hardMode;
    showToast('Hard mode can only be changed at the start of a game');
    return;
  }
  settings = { ...settings, hardMode: el.hardModeSwitch.checked };
  game = { ...game, hardMode: settings.hardMode };
  storage.saveSettings(settings);
}

function wireEvents() {
  document.addEventListener('keydown', onKeyDown);
  el.keyboard.addEventListener('click', onScreenKey);

  el.hintBtn.addEventListener('click', () => {
    useHint();
    focusGame();
  });
  $('new-game-btn').addEventListener('click', () => {
    newGamePressed();
    focusGame();
  });
  $('stats-btn').addEventListener('click', () => {
    renderStats();
    openDialog(el.statsDialog);
  });
  $('help-btn').addEventListener('click', () => openDialog(el.helpDialog));
  $('settings-btn').addEventListener('click', () => {
    applySettings();
    openDialog(el.settingsDialog);
  });

  $('end-share-btn').addEventListener('click', share);
  el.statsShareBtn.addEventListener('click', share);
  $('end-new-game-btn').addEventListener('click', () => {
    startGame();
    focusGame();
  });
  $('reset-stats-btn').addEventListener('click', async () => {
    if (await confirm('Reset all statistics? This cannot be undone.', 'Reset')) {
      stats = storage.resetStats();
      renderStats();
      announce('Statistics reset.');
    }
  });

  el.hardModeSwitch.addEventListener('change', onHardModeChange);
  el.darkModeSwitch.addEventListener('change', () => {
    settings = { ...settings, darkMode: el.darkModeSwitch.checked };
    storage.saveSettings(settings);
    applySettings();
  });
  el.highContrastSwitch.addEventListener('change', () => {
    settings = { ...settings, highContrast: el.highContrastSwitch.checked };
    storage.saveSettings(settings);
    applySettings();
  });
  systemDark.addEventListener('change', applySettings);

  for (const dialog of document.querySelectorAll('dialog')) {
    // A click on the dialog element itself is a click outside its panel.
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', focusGame);
  }
  for (const button of document.querySelectorAll('[data-close]')) {
    button.addEventListener('click', () => button.closest('dialog').close());
  }
}

// ---------------------------------------------------------------------------

buildBoard();
buildKeyboard();
applySettings();
recordLeftGame();
wireEvents();
startGame();
el.game.focus({ preventScroll: true });

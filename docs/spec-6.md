# Spec: Wordle Practice

Source: [spec.notes.md](spec.notes.md), plus answers to the open questions in [spec-1.md](spec-1.md) and [spec-2.md](spec-2.md). History: [spec-history.md](spec-history.md).

Status: round 6. Same as [spec-4.md](spec-4.md), except for hints (section 3.7). After the first build the user asked that hints keep what the player has found (round 5), and then that every hint also finds something new (round 6, a bug report). No open questions are left. The questions left in [spec-3.md](spec-3.md) were decided by inference in round 4, at the user's request.

Tags:

- `[assumed]`: a detail not stated by the user, filled in during rounds 1–3.
- `[inferred]`: a decision made in round 4 in place of an open question. Each one is listed in section 6.

## 1. Intent

A Wordle game that runs in a desktop web browser.

- The player has 6 guesses to find a hidden 5-letter word.
- Each guess is coloured letter by letter to show how close it is.
- The player gets 2 hints per game. A hint fills the next empty row with a word that shares at least one letter with the answer, keeps every letter found so far, and finds something new.
- The player's statistics and settings are kept in the browser between visits.

What matters, from the notes and answers:

- English only. Keep it simple.
- Only valid words are accepted as guesses. The word lists are static.
- A new answer is picked at random for each new game.
- Winning shows a message that depends on how many rows it took.
- Losing, or quitting, shows the correct word.
- Quitting a game before it ends counts as a loss, and is also counted as a quit.
- Statistics are stored in the browser's local storage, and can be reset.
- Keep the traditional features of a typical Wordle app: key colouring, tile flip, row shake, hard mode, sharing, help, dark mode and high contrast.
- Very few dependencies: JavaScript and Vite.
- Usable with a keyboard alone and with a screen reader.

## 2. Non-goals

- Other languages. The notes say: "Support only English language for now; keep it simple".
- Phones and tablets. Asked "Must it work on phones and tablets?", the answer was "no".
- Avoiding repeat answers. The answer was: "It's random selection so no."
- Extra libraries. The answer was: "JS, vite - try not to include any other dependencies."
- Safari [inferred: only Chrome, Firefox and Edge were named, and phones and tablets are excluded].
- A daily word [inferred: the answer was "yes if it's easy", and a daily word would clash with a random answer per game and need its own statistics].

## 3. User-visible behaviour

### 3.1 Page layout

- Header, top-left: the title "Wordle Practice".
- Header, top-right, in this order: "Hint (2)", "Stats", "New Game", "Help", "Settings".
  - The first three are in the order listed in the notes [assumed].
  - "Help" and "Settings" come after them [inferred: extra buttons go after the ones the notes fixed].
- Main area: a grid of 6 rows by 5 tiles. Each row holds one guess or one hint.
- Under the grid: an on-screen keyboard with these three rows:
  - `Q W E R T Y U I O P`
  - `A S D F G H J K L`
  - `Enter Z X C V B N M ⌫`
- Messages (warnings, end of game, quit confirmation) appear in the centre of the screen [assumed].
- Stats, Help and Settings open as panels on top of the game. Each panel closes when:
  - the player presses its close control, or
  - clicks anywhere outside the panel, or
  - presses Escape [assumed].

### 3.2 Starting and quitting a game

- Pressing "New Game" starts a new game.
- A game is also started when the page is opened [assumed].
- A new game picks an answer at random from the answer list (see 3.9).
- The same answer can come up twice in a row. Recent answers are not avoided.
- A new game clears the grid and the key colours, and resets the hint button to "Hint (2)" [assumed].
- A game has "started" once the player has submitted a guess or used a hint.
- Pressing "New Game" when the game has not started, or has ended, starts a new game straight away.
- Pressing "New Game" on a started, unfinished game asks: "Quit this game? It will count as a loss." with "Quit" and "Cancel" [inferred: quitting costs a loss and a streak, so it should not happen by accident].
  - "Cancel" closes the question. The game carries on unchanged.
  - "Quit" ends the game as a quit. The answer is shown in the end-of-game message (see 3.6), as for a loss. The next "New Game" press starts a new game.
- Reloading or closing the page during a started game also counts as a quit [assumed for closing: treated the same as reloading].
  - The game is not restored. The next visit starts a new game.
  - The answer of that game is not shown on the next visit [inferred: keep it simple].
- A quit game counts as a loss and as a quit in the statistics (see 3.8).
- A game that has not started is not counted at all when it is left [assumed].

### 3.3 Typing and keyboard focus

- Letters can be typed on the physical keyboard or by clicking on-screen keys. Both behave the same.
- Letters show in uppercase. Only A–Z are accepted.
- The current row holds at most 5 letters. Extra letters are ignored.
- Backspace (physical key or `⌫`) removes the last letter. On an empty row it does nothing.
- The row being typed is always the first unused row.
- Typed letters show only while the game is in play.
- Key presses with Ctrl, Alt or Meta held do not type letters, so browser shortcuts still work [assumed].
- While a panel or message is open, typing does not reach the grid [assumed].
- After the game ends (won, lost or quit), typing, Backspace, Enter and Hint do nothing until a new game starts.
- Keyboard focus and Enter [inferred: standard web behaviour]:
  - When a button has keyboard focus (reached with Tab), Enter presses that button.
  - After any button is pressed, or any panel or message closes, focus goes back to the game. The next Enter then submits the guess.
  - So clicking "Stats", closing it, typing a word and pressing Enter submits the word.

| Situation | Input | Result |
|---|---|---|
| Empty row | `c`, `r`, `a` | Row shows `C R A` |
| Row has `CRANE` | `s` | Ignored. Row still shows `CRANE` |
| Row has `CR` | `1`, `!`, space, `é` | Ignored. Row still shows `CR` |
| Row has `CR` | Backspace | Row shows `C` |
| Empty row | Backspace | Nothing happens |
| Row has `CRANE`, game not started | Ctrl+R | Browser reloads. No letter typed [assumed]. Game not counted |
| Row 2 has `CRANE` | Ctrl+R | Browser reloads. The game counts as quit |
| Game won, lost or quit | `a`, Backspace, Enter, Hint | Nothing happens |
| Tab to "Help" | Enter | Help panel opens |
| Help panel open | Escape, then `crane`, Enter | Panel closes. `CRANE` is submitted |

### 3.4 Submitting a guess

- Enter (physical key or on-screen `Enter`) submits the current row.
- A 5-letter word in the guess list is accepted. The row is coloured and the next row becomes current.
- A rejected guess never uses up a row. The letters stay, the row shakes, and a warning shows for a few seconds. The player can press Backspace and try again.
- A guess is rejected when:
  - it has fewer than 5 letters. Warning: "Please enter 5 letters before pressing Enter".
  - it is not in the guess list. Warning: "Not a valid word, please try again".
  - hard mode is on and the guess breaks a hard mode rule (see 3.10).
- "A few seconds" means the warning is gone within 5 seconds [assumed].
- Upper or lower case typing makes no difference to whether a word is valid [assumed].

| Row has | Input | Result |
|---|---|---|
| `CRANE` (in list) | Enter | Row coloured. Next row becomes current |
| `ZZZZZ` (not in list) | Enter | Row shakes. "Not a valid word, please try again". Row still shows `ZZZZZ`. No row used |
| `ZZZZZ` after the warning | Backspace ×5, then `slate`, Enter | Row shows `SLATE` and is coloured |
| `CRAN` | Enter | Row shakes. "Please enter 5 letters before pressing Enter". No row used |
| `FIBER` or `FIBRE` | Enter | Accepted. US and UK spellings are both valid |

### 3.5 Colouring a guess

Each letter gets one of three scores:

- correct (green): right letter, right place.
- present (yellow): the letter is in the answer, in another place, and an unmatched copy is left.
- absent (grey): otherwise.

Correct letters are matched first. Present letters are then matched left to right, using only answer letters not already matched [assumed].

| Answer | Guess | Result (letter by letter) | Why |
|---|---|---|---|
| CRANE | CRANE | 🟩🟩🟩🟩🟩 | All correct. Game won in 1 |
| CRANE | SLATE | ⬜⬜🟩⬜🟩 | A and E in the right place. S, L, T not in answer |
| CRANE | EERIE | ⬜⬜🟨⬜🟩 | The last E is correct and uses up the only E. The first two E's are grey |
| APPLE | PUPPY | 🟨⬜🟩⬜⬜ | Middle P is correct. First P takes the other P. Fourth P has no copy left |
| ROBOT | FLOOR | ⬜⬜🟨🟩🟨 | Fourth O is correct. Third O takes the other O. R is in the answer elsewhere |

- The tiles of a submitted row flip over as their colours are shown.
- The on-screen keys are coloured with the best score each letter has had so far: green beats yellow, yellow beats grey.

### 3.6 Winning, losing, quitting and sharing

- The game is won when a guess is all green.
- The game is lost when the 6th row is used and is not all green.
- On a win, a message is shown based on the number of rows used, counting hint rows [inferred: hints use up a row, so they count like guesses].

| Rows used | Message |
|---|---|
| 1 | Genius |
| 2 | Magnificent |
| 3 | Impressive [assumed] |
| 4 | Splendid [assumed] |
| 5 | Great [assumed] |
| 6 | Phew [assumed] |

- Example: a hint on row 1 and a correct guess on row 2 shows "Magnificent". "Genius" is only possible without a hint, because a hint is never the answer.
- On a loss or a quit, the message shows the correct word.
- The end-of-game message appears in the centre of the screen. Nothing closes it on its own.
- The player can close it the same ways as a panel (3.1), to see the grid [inferred: "keep it on screen" read as "never disappears by itself"]. The game stays over.
- The Stats panel does not open by itself at the end of a game.
- The end-of-game message has a "Share" button. After the game ends, the Stats panel also has one [inferred: standard Wordle puts sharing in the stats view].
- Sharing copies text to the clipboard [assumed] and shows "Copied" [assumed]. The text shows the score and an emoji grid, with no letters [assumed]. Hint rows end with 💡 [inferred: so a shared score is honest about hints].

```
Wordle Practice 3/6
⬜🟩🟩⬜🟨 💡
⬜⬜🟩⬜🟩
🟩🟩🟩🟩🟩
```

(Answer CRANE. Hint TRAIN, then guesses SLATE and CRANE.)

- A loss or quit shows `X/6` [assumed]. Hard mode adds `*` after the score [assumed]. High contrast mode uses 🟧 and 🟦 in place of 🟩 and 🟨 [assumed].

### 3.7 Hints

- The player has 2 hints per game.
- The hint button shows how many are left: "Hint (2)", "Hint (1)", "Hint (0)".
- A hint can be used at any point while the game is in play, including before the first guess.
- Pressing "Hint" fills the current row with a hint word, and uses up that row.
- Any letters already typed in the current row are replaced by the hint word [inferred: the hint goes in "the next empty row", which is the row being typed].
- The hint row is coloured against the answer, exactly like a guess (3.5), including the flip and key colours.
- A hint word:
  - is a complete 5-letter word from the answer list [inferred: the answer "Yes" is read as yes to the first option, the common-word list].
  - has at least one green or yellow letter against the answer. It may have more.
  - is never the answer [assumed].
  - is never a word already in the grid this game.
  - keeps every green letter from earlier rows (guesses and hints) in the same place.
  - contains every yellow letter from earlier rows. It can be in any place, including its right place by chance.
  - finds at least one new thing. A new find is either:
    - a green in a place that was not green before (including a yellow letter landing in its right place), or
    - a letter in the answer that was not found before, or an extra copy of one that was.
  - With nothing found yet, any green or yellow letter is a new find.
- So a hint never loses what the player has already found, and always adds to it. The keep rules are the same as hard mode (3.10), and they apply to hints whether hard mode is on or off.
- Letters a hint reveals also count for hard mode rules on later guesses.
- If no word other than the answer meets all these rules, pressing "Hint" shows "No hint available: no word other than the answer keeps your finds and adds a new one". No hint is used up.
- The hint button is disabled, and looks disabled, when [inferred]:
  - no hints are left ("Hint (0)"), or
  - only the last row is left, so a hint can never lose the game, or
  - the game has ended.
- Hint rows count for the win message and for wins by rows used. They do not count in word count (3.8).

| Answer | Already in grid | Possible hint word | Allowed? | Why |
|---|---|---|---|---|
| CRANE | nothing | TRAIN | Yes | R and A green, N yellow |
| CRANE | nothing | SLATE | Yes | A and E green |
| CRANE | SLATE | SLATE | No | Already in the grid |
| CRANE | nothing | PLUMB | No | No letter in common with the answer |
| CRANE | nothing | CRANE | No | It is the answer [assumed] |
| CRANE | SLATE ⬜⬜🟩⬜🟩 | SNAKE | Yes | Keeps A 3rd and E 5th, finds N |
| CRANE | SLATE ⬜⬜🟩⬜🟩 | STAKE | No | Keeps A and E but finds nothing new |
| CRANE | SLATE ⬜⬜🟩⬜🟩 | TRAIN | No | Loses E in 5th place |
| CRANE | TRAIN ⬜🟩🟩⬜🟨 | PRANK | Yes | Keeps R and A in place. N lands in its right place: a new green |
| CRANE | TRAIN ⬜🟩🟩⬜🟨 | BRAND | Yes | Keeps R and A in place. N lands in its right place: a new green |
| CRANE | TRAIN ⬜🟩🟩⬜🟨 | GRAIN | No | Keeps R, A and N, but N stays yellow: nothing new |
| THREW | APPLE ⬜⬜⬜⬜🟨, FERAL ⬜🟨🟩⬜⬜ | NERVE | No | Keeps R and E, but N, V and the second E are grey: nothing new (the reported bug) |
| THREW | APPLE ⬜⬜⬜⬜🟨, FERAL ⬜🟨🟩⬜⬜ | HORSE | Yes | Keeps R and E, finds H |
| CRANE | TRAIN ⬜🟩🟩⬜🟨 | BRAKE | No | Leaves out N |
| CRANE | CRANK 🟩🟩🟩🟩⬜ | any | No | Only the answer fits |

| Situation | Press "Hint" | Result |
|---|---|---|
| Row 1, empty, "Hint (2)" | Yes | Row 1 gets a hint word, coloured. "Hint (1)" |
| Row 3 has `CR` typed, "Hint (1)" | Yes | `CR` is replaced by a hint word, coloured. "Hint (0)" |
| "Hint (0)" | Yes | Nothing. Button is disabled |
| Rows 1–5 used, "Hint (1)" | Yes | Nothing. Button is disabled |
| Answer CRANE, row 1 is CRANK, "Hint (2)" | Yes | "No hint available: no word other than the answer keeps your finds and adds a new one". Still "Hint (2)" |

### 3.8 Statistics

- Pressing "Stats" opens the Stats panel (3.1).
- Statistics are stored in the browser's local storage.
- Statistics survive a page reload and closing and reopening the browser.
- Statistics shown:
  - games played
  - wins
  - losses (including quits)
  - quits
  - win percentage
  - current streak (a loss or quit ends it)
  - max streak
  - wins by number of rows used (1 to 6)
  - word count: the number of guesses the player submitted, across all games. Rejected guesses and hint rows do not count [inferred: hints have their own statistic].
  - hints per game: the average number of hints used per game played, to one decimal place [inferred: "per game" read as an average, like win percentage].
- The panel has a "Reset statistics" control [assumed].
- Reset asks the player to confirm [assumed]. After confirming, every statistic is zero.
- If local storage is empty, unreadable or blocked, the game still works and statistics start at zero [assumed].

### 3.9 Word lists

- There are two lists, as in traditional Wordle:
  - the answer list: common words that can be picked as the answer.
  - the guess list: a bigger list of words accepted as guesses. It includes every answer.
- Why two: the bigger list lets players guess less common words, without those words ever being the answer.
- Sizes, based on the original Wordle (about 2,300 answers and about 13,000 guesses) [inferred]:
  - the answer list has at least 2,000 words.
  - the guess list has at least 10,000 words.
- Both lists are static. They are part of the app and do not change while it runs.
- Both US and UK spellings are accepted.
- The answer list has no plurals, proper nouns or offensive words.
- The lists come from a public source whose licence allows reuse. They are not copied from the New York Times Wordle lists [inferred: those lists belong to The New York Times].
  - An example of a suitable source is SCOWL (Spell Checker Oriented Word Lists). It covers US and UK spelling and ranks words by how common they are.
- The source and licence of each list are written down in the repository [inferred].

### 3.10 Settings

- Pressing "Settings" opens the Settings panel (3.1) [inferred: standard Wordle keeps these switches in a settings view].
- The panel has three switches: "Hard mode", "Dark mode" and "High contrast".
- Settings are kept in local storage and survive a reload [assumed].
- Hard mode rules [assumed: traditional Wordle rules]:
  - a green letter must stay in the same place in every later guess.
  - a yellow letter must appear somewhere in every later guess.
  - a guess that breaks a rule is rejected (see 3.4), with a warning that names the rule [assumed].
- Hard mode can only be switched on or off before the game has started [inferred: standard Wordle rule]. Trying it mid-game leaves the switch unchanged and shows "Hard mode can only be changed at the start of a game" [inferred].
- Dark mode and high contrast can be switched at any time.
- Dark mode shows the page with a dark background [assumed: it starts on if the system is set to dark].
- High contrast mode uses orange for correct and blue for present, in place of green and yellow [assumed].
- Colours, fonts and sizes are chosen by best judgement. None are fixed.

| Answer | Earlier row and result | Next guess (hard mode) | Result |
|---|---|---|---|
| CRANE | SLATE ⬜⬜🟩⬜🟩 | BRINE | Rejected. 3rd letter must be A [assumed wording] |
| CRANE | SLATE ⬜⬜🟩⬜🟩 | PLACE | Accepted. A and E are in place |
| CRANE | TRAIN ⬜🟩🟩⬜🟨 | BRAKE | Rejected. Guess must contain N [assumed wording] |
| CRANE | TRAIN ⬜🟩🟩⬜🟨 | PRANK | Accepted. R and A in place, N used |
| CRANE | TRAIN as a hint | BRAKE | Rejected. Letters from hint rows count [inferred] |

### 3.11 Help

- Pressing "Help" opens the Help panel (3.1).
- It explains how to play, including the colours, hints, hard mode and quitting [inferred].

### 3.12 Accessibility

- Everything can be done with the keyboard alone: typing, submitting, hints, new game, quitting, Stats, Help, Settings and share.
- Buttons can be reached with Tab and pressed with Enter or Space [assumed]. Focus rules are in 3.3.
- A screen reader announces [assumed]:
  - each tile's letter and score after a guess or hint.
  - warnings.
  - the end-of-game message and the answer.
  - the number of hints left.
- Text meets WCAG 2.1 AA contrast in light, dark and high contrast modes [assumed].

### 3.13 Testing aid

- A test-only way to set the answer exists, so the colouring, win message, hint and hard mode checks can be run with a known answer [inferred: the criteria need it].
- It works only when the app is run with `npm run dev`. It has no effect in the built app [inferred: so players can't use it].

## 4. Constraints

- Platform: desktop web browsers.
- Supported browsers: Chrome, Firefox and Edge, current releases only [inferred: the answer "yes" is read as "current release is enough"].
- Language: JavaScript [assumed: plain JavaScript, not TypeScript].
- Tools: Vite to run and build the app. No other dependency.
- Tests use the test runner built into Node.js, so no test dependency is added [inferred: "try not to include any other dependencies"].
- Node.js: the current LTS release [inferred].
- Offline: the app must work with no internet connection, once `npm install` has been run [assumed].
- Storage: browser local storage, for statistics and settings.
- Language of play: English only.
- Word lists: static, two lists, from a public source whose licence allows reuse.
- Tests: automated tests of the main logic only ("critical path; don't overthink it; we can get to that later").
- Starting state: the repository has no code and no commits. It holds only `.claude/`, `docs/` and `notes/`.
- Phases and checkpoints:
  1. The user reviews and confirms this spec before design or code starts [assumed].
  2. The app is built and `npm test` passes.
  3. The user runs the manual steps in section 5 before sign-off [inferred].

## 5. Acceptance criteria

Unless said otherwise, "manual step" means: run the app with `npm run dev`, open it in current desktop Chrome, Firefox and Edge, and do what is described in each. The step passes only if it passes in all three. Steps marked "known answer" use the testing aid in 3.13.

Setup and tooling

1. `npm install` exits with code 0 [assumed: npm is the package manager].
2. `npm run dev` starts the app and prints a local address [assumed].
3. `npm run build` exits with code 0 [assumed].
4. `npm test` exits with code 0.
5. Reading `package.json`: `vite` is the only entry across `dependencies` and `devDependencies`.
6. Reading `package.json`: the `test` script runs `node --test`.
7. Reading the code: all app source is JavaScript [assumed].
8. Reading the code: the app makes no requests to outside services while it runs.
9. Manual step: disconnect the computer from the network, run the app, and play a full game. Word checking, statistics and settings all work.

Layout

10. Manual step: on first load, the header shows "Wordle Practice" at the top-left.
11. Manual step: the header shows "Hint (2)", "Stats", "New Game", "Help" and "Settings" at the top-right, in that order.
12. Manual step: the main area shows 30 empty tiles in 6 rows of 5.
13. Manual step: under the grid, the on-screen keyboard shows exactly the three rows listed in 3.1, including `Enter` and `⌫`.

Typing and focus

14. Manual step: typing `crane` on the physical keyboard shows `CRANE` in the first row.
15. Manual step: clicking on-screen keys C, R, A, N, E shows `CRANE` in the first row.
16. Manual step: each row of the table in 3.3 gives the result shown.
17. Manual step: after one guess is submitted, typing fills the second row, not the first.
18. Manual step: with the Stats panel open, typing `a` adds nothing to the grid.
19. Manual step: click "Stats", close the panel, type 5 letters, press Enter. The guess is submitted.

Submitting

20. Manual step: each row of the table in 3.4 gives the result shown.
21. Manual step: each warning is visible straight after Enter and is gone within 5 seconds.
22. Manual step: after any rejected guess, the number of rows used is unchanged.

Colouring

23. An automated test checks every row of the colouring table in 3.5.
24. Manual step, known answer `CRANE`: guess `SLATE`. The row matches the table, and on-screen A and E are green and S, L, T are grey.
25. Manual step: the tiles of a submitted row flip over as their colours appear.

Winning, losing and quitting

26. An automated test checks that each number of rows used gives the message in the table in 3.6.
27. Manual step, known answer `CRANE`: use a hint on row 1, then guess `CRANE`. The message is "Magnificent".
28. Manual step: on a win, the message appears in the centre of the screen and is still there after 30 seconds [assumed].
29. Manual step: after closing the end-of-game message, the grid is visible and typing does nothing.
30. Manual step: making 6 wrong valid guesses ends the game and shows the correct word.
31. Manual step: after a win or a loss, the Stats panel does not open by itself.
32. Manual step: after a game ends, press "Share" and paste into a text editor. It shows "Wordle Practice", the score, and one emoji row per used row, with 💡 on hint rows. It contains no letters of the answer.
33. Manual step: after a game ends, the Stats panel has a "Share" button that copies the same text.

New game and quitting

34. Manual step: starting 20 new games in a row gives at least 2 different answers [assumed].
35. Manual step: after "New Game", the grid and key colours are cleared and the button shows "Hint (2)".
36. Manual step: submit one guess, press "New Game", press "Cancel". The game carries on with the guess still in row 1.
37. Manual step: submit one guess, press "New Game", press "Quit". The answer is shown, and typing does nothing. Pressing "New Game" again starts a new game.
38. Manual step: open the app and press "New Game" without guessing or using a hint. No question is asked and the statistics do not change.

Hints

39. Manual step: each row of the second table in 3.7 gives the result shown.
40. Manual step: before any guess, press "Hint". Row 1 fills with a word, coloured, with at least one green or yellow tile.
41. Manual step: press "Hint" twice in one game. Two different words fill two rows.
42. An automated test checks, for a fixed answer, that a hint word is in the answer list, is never the answer, is never a word already in the grid, and always has at least one green or yellow letter.
42a. An automated test checks every row of the first table in 3.7, including that a hint keeps green letters from earlier rows in place, uses their yellow letters, finds something new, and is not given when only the answer would.
42b. Manual step, known answer `CRANE`: guess `SLATE`, then press "Hint". The hint word has A 3rd and E 5th.
42c. Manual step, known answer `CRANE`: guess `CRANK`, then press "Hint". The "No hint available" message shows, no row is filled, and the button still shows "Hint (2)".
42d. Manual step, known answer `THREW`: guess `APPLE` and `FERAL`, then press "Hint". The hint has R 3rd and an E, and shows either a new green or one of T, H or W.
43. Manual step: after a win, loss or quit, the hint button is disabled.

Statistics

44. Manual step: win a game, reload the page, open Stats. Wins and games played have each gone up by 1.
45. Manual step: submit one guess, quit with "New Game", open Stats. Losses and quits have each gone up by 1. The current streak is 0.
46. Manual step: submit one guess, reload the page, open Stats. Losses and quits have each gone up by 1.
47. Manual step: use 1 hint and 2 guesses to win. Word count has gone up by 2.
48. Manual step: reset statistics, then play one game using 2 hints and one using none. Hints per game shows 1.0.
49. Manual step: win a game on row 3. The wins-by-rows count for 3 has gone up by 1.
50. Manual step: finish a game, close the browser, reopen the app, open Stats. The finished game is counted.
51. Manual step: in browser developer tools, local storage for the app holds the statistics and settings.
52. Manual step: clear local storage for the app and reload. The game works and statistics show zero.
53. Manual step: Stats, Help, Settings and the end-of-game message each close with the close control, with a click outside, and with Escape.
54. Manual step: reset statistics and confirm. Every statistic shows zero, and still does after a reload.

Settings and help

55. Manual step, known answer: each row of the hard mode table in 3.10 gives the result shown.
56. Manual step: after the first guess, try to switch hard mode. It stays as it was, and "Hard mode can only be changed at the start of a game" shows.
57. Manual step: switching on dark mode gives a dark background. It is still on after a reload.
58. Manual step: switching on high contrast mode shows correct tiles and keys in orange and present ones in blue. It is still on after a reload.
59. Manual step: "Help" opens a panel that explains colours, hints, hard mode and quitting.

Accessibility

60. Manual step: with the mouse unplugged, play a full game, use a hint, quit a game, open and close Stats, Help and Settings, change each setting, and share.
61. Manual step, in Edge with Windows Narrator [inferred: built into Windows, and works best with Edge]: submit a guess. Each tile's letter and score is announced. A warning and the end-of-game message are also announced.
62. Manual step: a contrast checker in browser developer tools reports no text below WCAG 2.1 AA in light, dark and high contrast modes [assumed].

Word lists

63. An automated test checks that every answer is in the guess list.
64. An automated test checks that every word in both lists is exactly 5 letters, A–Z only.
65. An automated test checks that the answer list has at least 2,000 words and the guess list at least 10,000.
66. Manual step: `FIBER`, `FIBRE`, `SABER` and `SABRE` are all accepted as guesses.
67. Manual step: a random sample of 100 words from the answer list has no plurals, proper nouns or offensive words [assumed].
68. Reading the repository: the word lists are part of it, and their source and licence are written down.
69. Reading the code: the word lists are not fetched from an outside service or generated at run time.

Testing aid, language and tests

70. Manual step: run `npm run build` and `npm run preview`. The test-only way to set the answer has no effect.
71. Reading the code: there is no language setting or non-English word list.
72. Reading the tests: automated tests cover scoring a guess, word checking, win and loss, hint word choice, hard mode rules and statistics updates [assumed].

## 6. Open questions

None. At the user's request, every question left in [spec-3.md](spec-3.md) was decided by inference. The table lists each decision so it can be changed.

| spec-3 Q | Question | Decision | Based on |
|---|---|---|---|
| 1a | Hint word from which list? | The answer list (common words) | "Yes" read as yes to the first option |
| 1b | Current browser versions enough? | Yes, current releases only | "yes" read as yes to the first option |
| 1c | Is Safari needed? | No | Only three browsers named; no phones or tablets |
| 1d | Hints "per game" | Average hints per game played | Other statistics are totals and averages |
| 1e | Do hint rows count in word count? | No | Hints have their own statistic |
| 2 | Does a hint row count for the win message? | Yes, count rows used | Hints use up a row |
| 2 | Hint on the last row? | Not allowed. Button disabled | A hint could otherwise lose the game |
| 2 | Letters typed when Hint is pressed? | Replaced by the hint word | Hint goes in "the next empty row" |
| 2 | Hints and hard mode? | **Changed in round 5 by the user:** hints always keep green letters in place and use yellow letters (the hard mode rules), whether hard mode is on or off. Their letters count afterwards. **Round 6:** a hint must also find something new | "We should not lose the existing finds with the hint"; "It should use the existing green and yellow letters, but also introduce a new one" |
| 2 | Hint rows in shared results? | Marked with 💡 | Keeps shared scores honest |
| 2 | Disabled look at "Hint (0)"? | Yes | Standard for a button that does nothing |
| 3 | List sizes? | At least 2,000 answers and 10,000 guesses | Original Wordle sizes |
| 3 | Licence? | Openly licensed public source, recorded in the repository | NYT owns the original lists |
| 4 | When does the new game start after a quit? | On the next "New Game" press | Same as after a loss |
| 4 | Confirm before quitting? | Yes | Quitting costs a loss and a streak |
| 4 | Show the answer after reload or close? | No | Keep it simple |
| 5 | Can the end message be closed? | Yes. Nothing closes it on its own | "Keep it on screen" plus seeing the grid |
| 5 | Where is Share? | End message, and Stats once the game ends | Standard Wordle |
| 6 | Where does Help go? | Header, after "New Game" | Extra buttons go after the fixed ones |
| 6 | Where are the switches? | A "Settings" button and panel | Standard Wordle |
| 6 | Hard mode mid-game? | Not allowed | Standard Wordle |
| 7 | Daily word? | Not included | "If easy", clashes with random answers |
| 8 | Test runner? | Node.js built-in runner | "No other dependencies" |
| 8 | Node.js version? | Current LTS | Common default |
| 9 | Enter with a focused button? | Presses the button. Focus then returns to the game | Standard web behaviour |
| 10 | Fix the answer for tests? | Yes, in `npm run dev` only | Criteria need a known answer |
| 10 | Who runs manual steps? | The user, before sign-off | The user owns the spec |
| 10 | Which screen reader? | Windows Narrator, in Edge | Built into Windows |

## 7. Out of scope

- Languages other than English ("Support only English language for now").
- Phones and tablets (asked "Must it work on phones and tablets?", the answer was "no").

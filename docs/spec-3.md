# Spec: Wordle Practice

Source: [spec.notes.md](spec.notes.md), plus answers to the open questions in [spec-1.md](spec-1.md) and [spec-2.md](spec-2.md). History: [spec-history.md](spec-history.md).

Status: draft, round 3. Most questions are answered. The ones left are in section 6.

## 1. Intent

A Wordle game that runs in a desktop web browser.

- The player has 6 guesses to find a hidden 5-letter word.
- Each guess is coloured letter by letter to show how close it is.
- The player gets 2 hints per game. A hint fills the next empty row with a word that shares at least one letter with the answer.
- The player's statistics and settings are kept in the browser between visits.

What matters, from the notes and answers:

- English only. Keep it simple.
- Only valid words are accepted as guesses. The word lists are static.
- A new answer is picked at random for each new game.
- Winning shows a message that depends on how many guesses it took.
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

## 3. User-visible behaviour

### 3.1 Page layout

- Header, top-left: the title "Wordle Practice".
- Header, top-right: buttons "Hint (2)", "Stats", "New Game" and "Help".
  - The first three are in that order [assumed: order as listed in the notes].
  - Where "Help" goes is TBD (see Open question 6).
  - Where the hard mode, dark mode and high contrast switches go is TBD (see Open question 6).
- Main area: a grid of 6 rows by 5 tiles. Each row holds one guess or one hint.
- Under the grid: an on-screen keyboard with these three rows:
  - `Q W E R T Y U I O P`
  - `A S D F G H J K L`
  - `Enter Z X C V B N M ⌫`
- Messages (warnings, end of game) appear in the centre of the screen [assumed: the centre was suggested for end-of-game messages; warnings use the same place].

### 3.2 Starting and quitting a game

- Pressing "New Game" starts a new game.
- A game is also started when the page is opened [assumed].
- A new game picks an answer at random from the answer list (see 3.9).
- The same answer can come up twice in a row. Recent answers are not avoided.
- A new game clears the grid and the key colours, and resets the hint button to "Hint (2)" [assumed].
- A game has "started" once the player has submitted a guess or used a hint.
- A started game counts as quit if it is left unfinished by:
  - pressing "New Game", or
  - reloading the page, or
  - closing the page [assumed: treated the same as reloading].
- A quit game counts as a loss and as a quit in the statistics (see 3.8).
- A game that has not started is not counted at all when it is left [assumed: it does not count as played either].
- When a started game is quit with "New Game", the answer is shown. Whether the new game starts straight away or after the message is closed is TBD (see Open question 4).
- A game left by reloading or closing is not restored. The next visit starts a new game.
- A daily word mode is undecided (see Open question 7).

### 3.3 Typing

- Letters can be typed on the physical keyboard or by clicking on-screen keys. Both behave the same.
- Letters show in uppercase. Only A–Z are accepted.
- The current row holds at most 5 letters. Extra letters are ignored.
- Backspace (physical key or `⌫`) removes the last letter. On an empty row it does nothing.
- The row being typed is always the first unused row.
- Typed letters show only while the game is in play.
- Key presses with Ctrl, Alt or Meta held do not type letters, so browser shortcuts still work [assumed].
- While the Stats or Help panel is open, typing does not reach the grid [assumed].
- After the game ends (won or lost), typing, Backspace, Enter and Hint do nothing until a new game starts.
- What physical Enter does when keyboard focus is on a button is TBD (see Open question 9).

| Situation | Input | Result |
|---|---|---|
| Empty row | `c`, `r`, `a` | Row shows `C R A` |
| Row has `CRANE` | `s` | Ignored. Row still shows `CRANE` |
| Row has `CR` | `1`, `!`, space, `é` | Ignored. Row still shows `CR` |
| Row has `CR` | Backspace | Row shows `C` |
| Empty row | Backspace | Nothing happens |
| Row has `CRANE`, first guess not yet made | Ctrl+R | Browser reloads. No letter typed [assumed]. Game not counted |
| Row 2 has `CRANE` | Ctrl+R | Browser reloads. The game counts as quit |
| Game won or lost | `a`, Backspace, Enter, Hint | Nothing happens |

### 3.4 Submitting a guess

- Enter (physical key or on-screen `Enter`) submits the current row.
- A 5-letter word in the guess list is accepted. The row is coloured and the next row becomes current.
- A rejected guess never uses up a row. The letters stay, the row shakes, and a warning shows for a few seconds. The player can press Backspace and try again.
- A guess is rejected when:
  - it has fewer than 5 letters. Warning: "Please enter 5 letters before pressing Enter" (wording may vary; the answer said "something like that").
  - it is not in the guess list. Warning: "Not a valid word, please try again".
  - hard mode is on and the guess breaks a hard mode rule (see 3.10).
- "A few seconds" means the warning is gone within 5 seconds [assumed: this is how "a few seconds" is checked].
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

Correct letters are matched first. Present letters are then matched left to right, using only answer letters not already matched [assumed: this is how "an unmatched copy is left" is read].

| Answer | Guess | Result (letter by letter) | Why |
|---|---|---|---|
| CRANE | CRANE | 🟩🟩🟩🟩🟩 | All correct. Game won in 1 |
| CRANE | SLATE | ⬜⬜🟩⬜🟩 | A and E in the right place. S, L, T not in answer |
| CRANE | EERIE | ⬜⬜🟨⬜🟩 | The last E is correct and uses up the only E. The first two E's are grey |
| APPLE | PUPPY | 🟨⬜🟩⬜⬜ | Middle P is correct. First P takes the other P. Fourth P has no copy left |
| ROBOT | FLOOR | ⬜⬜🟨🟩🟨 | Fourth O is correct. Third O takes the other O. R is in the answer elsewhere |

- The tiles of a submitted row flip over as their colours are shown.
- The on-screen keys are coloured with the best score each letter has had so far: green beats yellow, yellow beats grey.

### 3.6 Winning, losing and sharing

- The game is won when a guess is all green.
- The game is lost when the 6th row is used and is not all green.
- On a win, a message is shown based on the number of guesses:

| Guesses | Message |
|---|---|
| 1 | Genius |
| 2 | Magnificent |
| 3 | Impressive [assumed] |
| 4 | Splendid [assumed] |
| 5 | Great [assumed] |
| 6 | Phew [assumed] |

- The notes set 1 and 2 and say "make up the rest". Rows 3 to 6 follow the traditional Wordle wording [assumed].
- Whether hint rows count towards this number is TBD (see Open question 2).
- On a loss, the correct word is shown.
- The win message and the correct word appear in the centre of the screen and stay until a new game starts.
- Whether the player can close the message to see the grid is TBD (see Open question 5).
- The Stats panel does not open by itself at the end of a game.
- At the end of a game, the player can share the result [assumed: the share button is on the end-of-game message, see Open question 5].
- Sharing copies text to the clipboard [assumed] and shows "Copied" [assumed]. The text shows the score and an emoji grid, and no letters [assumed: traditional format]:

```
Wordle Practice 3/6
⬜⬜🟩⬜🟩
⬜🟩🟩⬜🟨
🟩🟩🟩🟩🟩
```

(Answer CRANE, guesses SLATE, TRAIN, CRANE.)

- A loss shows `X/6` [assumed]. Hard mode adds `*` after the score [assumed]. High contrast mode uses 🟧 and 🟦 in place of 🟩 and 🟨 [assumed].
- How hint rows appear in the shared grid is TBD (see Open question 2).

### 3.7 Hints

- The player has 2 hints per game.
- The hint button shows how many are left: "Hint (2)", "Hint (1)", "Hint (0)".
- A hint can be used at any point while the game is in play, including before the first guess.
- Pressing "Hint" fills the next empty row with a hint word, and uses up that row.
- The hint row is coloured against the answer, exactly like a guess (3.5), including the flip and key colours.
- A hint word:
  - is a complete 5-letter word.
  - has at least one green or yellow letter against the answer. It may have more.
  - is never the answer [assumed].
  - is never a word already in the grid this game.
- Whether the hint word comes from the answer list or the guess list is TBD (see Open question 1a).
- At "Hint (0)", pressing the button does nothing. Whether it also looks disabled is TBD (see Open question 2).
- Hint does nothing after the game ends.
- Still TBD (see Open question 2):
  - what happens to letters already typed in the current row.
  - whether Hint works when only the last row is left. (A hint there fills row 6 with a wrong word, so the game is lost.)
  - whether the hint word must follow hard mode rules.

| Answer | Already in grid | Possible hint word | Allowed? | Why |
|---|---|---|---|---|
| CRANE | nothing | TRAIN | Yes | R and A green, N yellow |
| CRANE | nothing | SLATE | Yes | A and E green |
| CRANE | SLATE | SLATE | No | Already in the grid |
| CRANE | nothing | PLUMB | No | No letter in common with the answer |
| CRANE | nothing | CRANE | No | It is the answer [assumed] |

### 3.8 Statistics

- Pressing "Stats" opens a panel on top of the game.
- The panel closes when:
  - the player presses its close control, or
  - clicks anywhere outside the panel, or
  - presses Escape [assumed: needed for keyboard-only use].
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
  - wins by number of guesses (1 to 6)
  - word count: the number of guesses submitted, across all games [assumed: rejected guesses do not count; whether hint rows count, see Open question 1e]
  - hints per game [assumed: the average number of hints used per game, see Open question 1d]
- The panel has a "Reset statistics" control [assumed: in the Stats panel].
- Reset asks the player to confirm [assumed]. After confirming, every statistic is zero.
- If local storage is empty, unreadable or blocked, the game still works and statistics start at zero [assumed].

### 3.9 Word lists

- There are two lists, as in traditional Wordle:
  - the answer list: common words that can be picked as the answer.
  - the guess list: a bigger list of words accepted as guesses. It includes every answer.
- Why two: the bigger list lets players guess less common words, without those words ever being the answer.
- Both lists are static. They are part of the app and do not change while it runs.
- Both US and UK spellings are accepted.
- The answer list has no plurals, proper nouns or offensive words.
- The lists come from a public source (the answer was "Recover it from your data (internet, wiki?)"). Licence limits are TBD (see Open question 3).
- The size of each list is TBD (see Open question 3).

### 3.10 Settings

- Hard mode, dark mode and high contrast mode can each be switched on and off.
- Where these switches are is TBD (see Open question 6).
- Settings are kept in local storage and survive a reload [assumed].
- Hard mode rules [assumed: traditional Wordle rules]:
  - a green letter must stay in the same place in every later guess.
  - a yellow letter must appear somewhere in every later guess.
  - a guess that breaks a rule is rejected (see 3.4), with a warning that names the rule [assumed].
- Whether hard mode can be changed mid-game is TBD (see Open question 6).
- Dark mode shows the page with a dark background [assumed: it starts on if the system is set to dark].
- High contrast mode uses orange for correct and blue for present, in place of green and yellow [assumed: traditional Wordle colours].
- Colours, fonts and sizes are chosen by best judgement. None are fixed.

| Answer | Earlier guess and result | Next guess (hard mode) | Result |
|---|---|---|---|
| CRANE | SLATE ⬜⬜🟩⬜🟩 | BRINE | Rejected. 3rd letter must be A [assumed wording] |
| CRANE | SLATE ⬜⬜🟩⬜🟩 | PLACE | Accepted. A and E are in place |
| CRANE | TRAIN ⬜🟩🟩⬜🟨 | BRAKE | Rejected. Guess must contain N [assumed wording] |
| CRANE | TRAIN ⬜🟩🟩⬜🟨 | PRANK | Accepted. R and A in place, N used |

### 3.11 Help

- Pressing "Help" opens a panel that explains how to play.
- It opens and closes the same way as the Stats panel.

### 3.12 Accessibility

- Everything can be done with the keyboard alone: typing, submitting, hints, new game, Stats, Help, share and settings.
- Buttons can be reached with Tab and pressed with Enter or Space [assumed]. Panels close with Escape [assumed].
- A screen reader announces [assumed: what "work with a screen reader" means]:
  - each tile's letter and score after a guess or hint.
  - warnings.
  - the end-of-game message and the answer.
  - the number of hints left.
- Text meets WCAG 2.1 AA contrast in light, dark and high contrast modes [assumed: how "best judgement" colours are checked].

## 4. Constraints

- Platform: desktop web browsers.
- Supported browsers: Chrome, Firefox and Edge, current releases [assumed, see Open question 1b].
- Language: JavaScript [assumed: plain JavaScript, not TypeScript].
- Tools: Vite to run and build the app. Try not to add any other dependency.
- Node.js and npm are needed to run Vite. Versions are not stated [assumed: current LTS]. See Open question 8.
- Offline: the app must work with no internet connection [assumed: once installed; installing may need the internet].
- Storage: browser local storage, for statistics and settings.
- Language of play: English only.
- Word lists: static, two lists, from a public source.
- Tests: automated tests of the main logic only ("critical path; don't overthink it; we can get to that later").
- Starting state: the repository has no code and no commits. It holds only `.claude/`, `docs/` and `notes/`.
- Phases and checkpoints:
  - Two testing questions were put off ("we'll answer this another time"). See Open question 10.
  - The spec should be confirmed before design or code starts [assumed].

## 5. Acceptance criteria

Unless said otherwise, "manual step" means: run the app locally, open it in current desktop Chrome, Firefox and Edge, and do what is described in each. The step passes only if it passes in all three.

Setup and tooling

1. `npm install` exits with code 0 [assumed: npm is the package manager].
2. `npm run dev` starts the app and prints a local address [assumed: script name].
3. `npm run build` exits with code 0 [assumed: script name].
4. `npm test` exits with code 0 [assumed: script name].
5. Reading `package.json`: the only dependency is `vite`. A test runner is allowed only if Open question 8 says so.
6. Reading the code: all app source is JavaScript [assumed].
7. Reading the code: the app makes no requests to outside services while it runs.
8. Manual step: disconnect the computer from the network, run the app locally, and play a full game. Word checking, statistics and settings all work.

Layout

9. Manual step: on first load, the header shows "Wordle Practice" at the top-left.
10. Manual step: the header shows "Hint (2)", "Stats", "New Game" and "Help" at the top-right. The first three are in that order.
11. Manual step: the main area shows 30 empty tiles in 6 rows of 5.
12. Manual step: under the grid, the on-screen keyboard shows exactly the three rows listed in 3.1, including `Enter` and `⌫`.

Typing

13. Manual step: typing `crane` on the physical keyboard shows `CRANE` in the first row.
14. Manual step: clicking on-screen keys C, R, A, N, E shows `CRANE` in the first row.
15. Manual step: each row of the table in 3.3 gives the result shown.
16. Manual step: after one guess is submitted, typing fills the second row, not the first.
17. Manual step: with the Stats panel open, typing `a` adds nothing to the grid [assumed].

Submitting

18. Manual step: each row of the table in 3.4 gives the result shown.
19. Manual step: each warning is visible straight after Enter and is gone within 5 seconds.
20. Manual step: after any rejected guess, the number of rows used is unchanged.

Colouring

21. Every row of the colouring table in 3.5 gives the result shown. Checked by an automated test [assumed], and by a manual step once Open question 10 is settled.
22. Manual step: after guessing `SLATE` against `CRANE`, on-screen A and E are green and S, L, T are grey. (Needs a known answer, see Open question 10.)
23. Manual step: the tiles of a submitted row flip over as their colours appear.

Winning and losing

24. For each row of the win-message table in 3.6, winning on that guess shows that message. Checked by an automated test [assumed].
25. Manual step: on a win, the message appears in the centre of the screen and is still there after 30 seconds [assumed: how "keep it on screen" is checked].
26. Manual step: making 6 wrong valid guesses ends the game and shows the correct word in the centre of the screen. It stays until "New Game".
27. Manual step: after a win or a loss, typing, Backspace, Enter and Hint change nothing on screen.
28. Manual step: after a win or a loss, the Stats panel does not open by itself.
29. Manual step: after a game ends, share the result and paste it into a text editor. It shows "Wordle Practice", the score and one emoji row per used row. It contains no letters of the answer.

New game and quitting

30. Manual step: starting 20 new games in a row gives at least 2 different answers [assumed: this is how "random" is checked].
31. Manual step: after "New Game", the grid and key colours are cleared and the button shows "Hint (2)".
32. Manual step: submit one guess, then press "New Game". The answer is shown.
33. Manual step: open the app and press "New Game" without guessing or using a hint. The statistics do not change.

Hints

34. Manual step: before any guess, press "Hint". Row 1 fills with a word, coloured, with at least one green or yellow tile. The button shows "Hint (1)".
35. Manual step: press "Hint" twice in one game. Two different words fill two rows. The button shows "Hint (0)". A third press changes nothing.
36. Manual step: after using 2 hints and making 4 wrong guesses, the game is lost.
37. An automated test checks, for a fixed answer, that a hint word is never the answer, never a word already in the grid, and always has at least one green or yellow letter [assumed].
38. Manual step: after a win or a loss, pressing "Hint" changes nothing.

Statistics

39. Manual step: win a game, reload the page, open Stats. Wins and games played have each gone up by 1.
40. Manual step: submit one guess, press "New Game", open Stats. Losses and quits have each gone up by 1. The current streak is 0.
41. Manual step: submit one guess, reload the page, open Stats. Losses and quits have each gone up by 1.
42. Manual step: finish a game with 3 submitted guesses and no hints. Word count has gone up by 3.
43. Manual step: reset statistics, then play one game using 2 hints and one using none. Hints per game shows 1 [assumed: average].
44. Manual step: win a game in 3 guesses. The wins-by-guesses count for 3 has gone up by 1.
45. Manual step: finish a game, close the browser, reopen the app, open Stats. The finished game is counted.
46. Manual step: in browser developer tools, local storage for the app holds the statistics.
47. Manual step: clear local storage for the app and reload. The game works and statistics show zero.
48. Manual step: the Stats panel closes with its close control, with a click outside it, and with Escape.
49. Manual step: reset statistics and confirm. Every statistic shows zero, and still does after a reload.

Help and settings

50. Manual step: "Help" opens a panel that explains the rules. It closes the same three ways as Stats.
51. Manual step: each row of the hard mode table in 3.10 gives the result shown. (Needs a known answer, see Open question 10.)
52. Manual step: switching on dark mode gives a dark background. It is still on after a reload.
53. Manual step: switching on high contrast mode shows correct tiles and keys in orange and present ones in blue. It is still on after a reload.

Accessibility

54. Manual step: with the mouse unplugged, play a full game, use a hint, open and close Stats and Help, share, change each setting, and start a new game.
55. Manual step: with a screen reader on (see Open question 10), submit a guess. Each tile's letter and score is announced. A warning and the end-of-game message are also announced.
56. Manual step: a contrast checker in browser developer tools reports no text below WCAG 2.1 AA in light, dark and high contrast modes [assumed].

Word lists

57. An automated test checks that every answer is in the guess list [assumed].
58. An automated test checks that every word in both lists is exactly 5 letters, A–Z only [assumed].
59. Manual step: `FIBER`, `FIBRE`, `SABER` and `SABRE` are all accepted as guesses.
60. Manual step: a random sample of 100 words from the answer list has no plurals, proper nouns or offensive words [assumed: how this is checked].
61. Reading the code: the word lists are part of the repository. They are not fetched from an outside service or generated at run time.

Language and tests

62. Reading the code: there is no language setting or non-English word list.
63. Reading the tests: automated tests cover scoring a guess, word checking, win and loss, hint word choice, hard mode rules and statistics updates [assumed: what "main logic" means].

## 6. Open questions

1. Answers to confirm. These answers could be read more than one way.
   - a. Hints: asked "from the common-word list, or any valid word?", the answer was "Yes". Which one?
   - b. Browsers: asked "is current release enough, or must older versions work?", the answer was "yes". Assumed: current release is enough.
   - c. Safari: asked "Is Safari not needed?", the answer was "no". My question was worded badly. Is Safari needed or not? It is left out of Out of scope until this is clear.
   - d. Hints used: the answer was "per game". Assumed: the average number of hints per game. Or should each past game be listed with its hint count?
   - e. Word count: assumed to be the number of guesses submitted. Do hint rows count as words?
2. Hints, now that they use a row.
   - Does a hint row count as a guess for the win message? For example, a hint on row 1 and a correct guess on row 2: "Genius" or "Magnificent"? The same applies to wins by number of guesses.
   - Can Hint be used when only the last row is left? It would fill row 6 with a wrong word and end the game as a loss.
   - If the player has typed letters in the current row, what happens to them when Hint is pressed?
   - In hard mode, must the hint word follow the hard mode rules?
   - In a shared result, are hint rows marked differently from guesses?
   - At "Hint (0)", should the button look disabled?
3. Word lists.
   - How many words should each list have? The question about list size was answered with "6 attempts, so 6 rows", which looks like an answer to a different question. The original Wordle had about 2,300 answers and about 13,000 accepted guesses. Is that the rough target?
   - Many public lists are copies of the original Wordle lists, which now belong to The New York Times. Must the list have a clear licence that allows reuse?
4. Quitting with "New Game".
   - The answer is shown when a started game is quit. Does the new game start straight away, or when the player closes the message?
   - Should the player be asked to confirm before quitting, since it counts as a loss?
   - When a game is quit by reloading or closing, is the answer shown on the next visit?
5. End-of-game message.
   - It stays in the centre until "New Game". Can the player close it to see the grid underneath?
   - Is the share button on this message, or somewhere else?
6. Header and settings.
   - The notes fix three header buttons. "Help" makes four. Where does it go?
   - Where are the switches for hard mode, dark mode and high contrast? For example, a "Settings" button that opens a panel like Stats.
   - Can hard mode be switched on or off mid-game, or only before the first guess, as in traditional Wordle?
7. Daily word. The answer was "not sure yes if its easy to do". "Easy" can't be checked, so it needs a yes or no.
   - Is a daily word included?
   - If yes: how does the player choose between the daily word and a random game, and does the daily word have its own statistics?
8. Tests and dependencies.
   - Automated tests need something to run them, but the answers allow only JavaScript and Vite. May a test runner be added as a dependency? Or must tests use what Node.js already provides?
   - Which Node.js version must work?
9. Enter key and keyboard focus.
   - Keyboard-only players press Enter on a focused button to use it. Enter also submits a guess. When a button has focus, should Enter press the button or submit the guess?
10. Testing (put off: "we'll answer this another time").
    - Is a way to fix the answer (for testing only) allowed? Criteria 21, 22, 24, 37 and 51 need a known answer.
    - Who runs the manual steps?
    - Which screen reader is used for criterion 55? [assumed until answered: Windows Narrator]

## 7. Out of scope

- Languages other than English ("Support only English language for now").
- Phones and tablets (asked "Must it work on phones and tablets?", the answer was "no").

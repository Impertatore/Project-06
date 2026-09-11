# Spec: Wordle Practice

Source: [spec.notes.md](spec.notes.md)

Status: draft. The notes ask for questions to be raised before the spec is completed. See Open questions.

## 1. Intent

A Wordle game that runs in a web browser.

- The player has 6 guesses to find a hidden 5-letter word.
- Each guess is coloured letter by letter to show how close it is.
- The player gets 2 hints per game.
- The player's statistics are kept in the browser between visits.

What matters, from the notes:

- English only. Keep it simple.
- Only valid words are accepted as guesses, so a word list is needed.
- A new answer is picked at random for each new game.
- Winning shows a message that depends on how many guesses it took.
- Losing shows the correct word.
- Statistics are stored in the browser's local storage.
- Keep the traditional features of a typical Wordle app (which ones is undecided, see Open question 8).

## 2. Non-goals

- Other languages. The notes say: "Support only English language for now; keep it simple".

## 3. User-visible behaviour

### 3.1 Page layout

- Header, top-left: the title "Wordle Practice".
- Header, top-right: three buttons, "Hint", "Stats" and "New Game", in that order [assumed: order as listed in the notes].
- Main area: a grid of 6 rows by 5 tiles. Each row holds one guess.
- Under the grid: an on-screen keyboard with these three rows:
  - `Q W E R T Y U I O P`
  - `A S D F G H J K L`
  - `Enter Z X C V B N M ⌫`

### 3.2 Starting a game

- Pressing "New Game" starts a new game.
- A new game picks an answer at random from the answer word list (see Open question 2).
- A new game clears the grid and resets the hint count to 2 [assumed].
- A game is also started when the page is first opened [assumed].
- Whether the previous answer can come up again is TBD (see Open question 6).
- What pressing "New Game" during an unfinished game does to statistics is TBD (see Open question 4).

### 3.3 Typing

- Letters can be typed on the physical keyboard or by clicking on-screen keys. Both behave the same.
- Letters show in uppercase. Only A–Z are accepted.
- The current row holds at most 5 letters. Extra letters are ignored.
- Backspace (physical key or `⌫`) removes the last letter. On an empty row it does nothing.
- The row being typed is always the first unused row.
- Typed letters show only while the game is in play.
- Key presses with Ctrl, Alt or Meta held do not type letters, so browser shortcuts still work [assumed].
- Pressing Enter on the physical keyboard submits the guess, even if an on-screen button was the last thing clicked [assumed].
- After the game ends (won or lost), typing, Backspace, Enter and Hint do nothing until a new game starts.

| Situation | Input | Result |
|---|---|---|
| Empty row | `c`, `r`, `a` | Row shows `C R A` |
| Row has `CRANE` | `s` | Ignored. Row still shows `CRANE` |
| Row has `CR` | `1`, `!`, space, `é` | Ignored. Row still shows `CR` |
| Row has `CR` | Backspace | Row shows `C` |
| Empty row | Backspace | Nothing happens |
| Row has `CRANE` | Ctrl+R | Browser reloads. No letter typed [assumed] |
| Game won or lost | `a`, Backspace, Enter, Hint | Nothing happens |

### 3.4 Submitting a guess

- Enter (physical key or on-screen `Enter`) submits the current row.
- A 5-letter word that is in the valid-word list is accepted. The row is coloured and the next row becomes current.
- A 5-letter word that is not in the list is not accepted. The row is not used up and the letters stay [assumed].
- Enter with fewer than 5 letters does not submit. The row is not used up [assumed].
- What the player is told when a guess is not accepted is TBD (see Open question 3).
- Upper or lower case typing makes no difference to whether a word is valid [assumed].

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

- The on-screen keys are coloured with the best score each letter has had so far: green beats yellow, yellow beats grey [assumed: traditional Wordle feature].

### 3.6 Winning and losing

- The game is won when a guess is all green.
- The game is lost when the 6th guess is not all green.
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
- On a loss, the correct word is shown.
- Where these messages appear and how long they stay is TBD (see Open question 7).

### 3.7 Hints

- The player has 2 hints per game.
- Pressing "Hint" uses one hint.
- Once 2 hints are used, pressing "Hint" gives no further hints [assumed].
- Hint does nothing after the game ends.
- What a hint reveals is TBD (see Open question 1). This blocks the rest of this section.

### 3.8 Statistics

- Pressing "Stats" shows the player's statistics.
- Statistics are stored in the browser's local storage.
- Statistics survive a page reload and closing and reopening the browser.
- Which statistics are kept is TBD (see Open question 4). The traditional Wordle set is: games played, win percentage, current streak, max streak, and a distribution of wins by number of guesses [assumed until confirmed].
- If local storage is empty, unreadable or blocked, the game still works and statistics start at zero [assumed].

## 4. Constraints

- Platform: runs in a web browser. Which browsers and versions is TBD (see Open question 9).
- Storage: browser local storage.
- Language: English only.
- Starting state: the repository has no code and no commits. It holds only `.claude/`, `docs/` and `notes/`.
- Tools and versions: none stated. See Open question 9.
- Phases and checkpoints: the notes ask for questions before the spec is completed. The spec should be confirmed before design or code starts [assumed].

## 5. Acceptance criteria

Unless said otherwise, "manual step" means: open the app in a supported browser (TBD, see Open question 9) and do what is described.

Layout

1. Manual step: on first load, the header shows "Wordle Practice" at the top-left.
2. Manual step: the header shows buttons labelled "Hint", "Stats" and "New Game" at the top-right, in that order.
3. Manual step: the main area shows 30 empty tiles in 6 rows of 5.
4. Manual step: under the grid, the on-screen keyboard shows exactly the three rows listed in 3.1, including `Enter` and `⌫`.

Typing

5. Manual step: typing `crane` on the physical keyboard shows `CRANE` in the first row.
6. Manual step: clicking on-screen keys C, R, A, N, E shows `CRANE` in the first row.
7. Manual step: each row of the table in 3.3 gives the result shown.
8. Manual step: after one guess is submitted, typing fills the second row, not the first.
9. Manual step: click "New Game", type 5 letters, press physical Enter. The guess is submitted and no new game starts.

Submitting

10. Manual step: submitting a valid 5-letter word colours the row and moves typing to the next row.
11. Manual step: submitting `ZZZZZ` (assumed not in the list) does not colour the row or use up a guess [assumed].
12. Manual step: pressing Enter with 4 letters does not colour the row or use up a guess [assumed].

Colouring

13. Every row of the colouring table in 3.5 gives the result shown. [assumed: checked with a way to fix the answer for testing, see Open question 11]
14. Manual step: after guessing `SLATE` against `CRANE`, on-screen A and E are green and S, L, T are grey [assumed].

Winning and losing

15. For each row of the win-message table in 3.6, winning on that guess shows that message. [assumed: checked with a fixed answer, see Open question 11]
16. Manual step: making 6 wrong valid guesses ends the game and shows the correct word.
17. Manual step: after a win or a loss, typing, Backspace, Enter and Hint change nothing on screen.
18. Manual step: after a win or a loss, "New Game" starts a new game with an empty grid.

New game

19. Manual step: starting 20 new games in a row gives at least 2 different answers [assumed: this is how "random" is checked].
20. Manual step: after "New Game", the hint count is back to 2. TBD how the count is shown (see Open question 1).

Hints

21. Manual step: in one game, "Hint" gives a hint twice and nothing on the third press. What counts as "a hint" is TBD (see Open question 1).

Statistics

22. Manual step: finish a game, reload the page, press "Stats". The finished game is counted.
23. Manual step: finish a game, close the browser, reopen the app, press "Stats". The finished game is counted.
24. Manual step: in browser developer tools, local storage for the app holds the statistics.
25. Manual step: clear local storage for the app and reload. The game works and statistics show zero [assumed].
26. Which statistics are shown and how they are checked is TBD (see Open question 4).

Word lists

27. Every word in the answer list is also in the valid-word list [assumed]. Checked by a command over the list files. The command is TBD until the list format is known (see Open question 2).
28. Every word in both lists is exactly 5 letters, A–Z only. Checked the same way as 27.

Language

29. Reading the code: there is no language setting or non-English word list.

## 6. Open questions

1. Hints.
   - What does a hint reveal? For example: one correct letter in its place, a letter that is in the word, or greying out absent keys.
   - Can a hint reveal something the player already knows?
   - Is a hint shown on the grid, on the keyboard, or as a message?
   - Can a hint be used before the first guess?
   - How does the player see how many hints are left? Is the button disabled after 2?
   - Does using hints affect statistics?
2. Word lists.
   - Where do the valid-word list and the answer list come from?
   - Is the answer list a smaller set of common words, as in traditional Wordle, or the same as the valid-word list?
   - Roughly how many words should each list have?
   - US or UK spelling, or both? (The notes use "colour".)
   - Are plurals, proper nouns and offensive words excluded from answers?
   - Are there licensing limits on the list source?
3. Rejected guesses.
   - What is the player told when Enter is pressed with fewer than 5 letters?
   - What is the player told when the word is not in the list?
   - Should the row shake or animate, as in traditional Wordle?
4. Statistics.
   - Which statistics are kept and shown? Confirm or change the traditional set in 3.8.
   - How are they shown: a pop-up, a panel, or something else?
   - If "New Game" is pressed mid-game, does it count as a loss, reset the streak, or not count?
   - Is there a way to reset statistics?
5. Reloading mid-game.
   - If the page is reloaded mid-game, is the game in progress restored?
   - If not, does the lost game count as a loss?
6. Answer selection.
   - Can the same answer come up twice in a row?
   - Should recent answers be avoided?
7. End of game display.
   - Where do the win message and the correct word appear?
   - Do they stay until "New Game", or disappear after a few seconds?
   - Should statistics open on their own at the end of a game, as in traditional Wordle?
8. Traditional Wordle features. Which of these are in scope?
   - On-screen key colouring (assumed in 3.5).
   - Tile flip animation when a guess is coloured.
   - Hard mode (revealed hints must be used in later guesses).
   - Share results as an emoji grid.
   - A "How to play" help screen.
   - A daily word, as well as or instead of random words.
   - Dark mode.
   - High-contrast or colour-blind mode.
9. Platform and tools.
   - Which browsers and versions must be supported?
   - Must it work on phones and tablets with touch and a small screen?
   - Must it work offline?
   - Must it run by opening a file directly, or is a local server or build step allowed?
   - Are any tools, languages or libraries required or banned?
10. Visual design and accessibility.
    - Are exact colours, fonts or sizes required?
    - Must it work with a screen reader?
    - Must it be fully usable without a mouse?
11. Testing.
    - Are automated tests required? If so, of what?
    - Is a way to fix the answer (for testing only) allowed, so criteria 13 and 15 can be checked?
    - Who runs the manual steps, and in which browser?

## 7. Out of scope

- Languages other than English ("Support only English language for now").

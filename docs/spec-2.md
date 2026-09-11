# Spec: Wordle Practice

Source: [spec.notes.md](spec.notes.md), plus answers to the open questions in [spec-1.md](spec-1.md). History: [spec-history.md](spec-history.md).

Status: draft. The notes ask for questions to be raised before the spec is completed. See Open questions.

## 1. Intent

A Wordle game that runs in a web browser.

- The player has 6 guesses to find a hidden 5-letter word.
- Each guess is coloured letter by letter to show how close it is.
- The player gets 2 hints per game. A hint is a whole word that shares at least one letter with the answer.
- The player's statistics are kept in the browser between visits.

What matters, from the notes and answers:

- English only. Keep it simple.
- Only valid words are accepted as guesses. The word list is static.
- A new answer is picked at random for each new game.
- Winning shows a message that depends on how many guesses it took.
- Losing shows the correct word.
- Quitting a game before it ends counts as a loss, and is also counted as a quit.
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

### 3.2 Starting and quitting a game

- Pressing "New Game" starts a new game.
- A new game picks an answer at random from the list of common words (see Open question 2).
- A new game clears the grid and resets the hint count to 2 [assumed].
- A game is also started when the page is opened [assumed].
- Whether the previous answer can come up again is TBD (see Open question 6).
- A game counts as quit if it is left unfinished by:
  - pressing "New Game", or
  - reloading the page, or
  - closing the page [assumed: treated the same as reloading].
- A quit game counts as a loss and as a quit in the statistics (see 3.8).
- A game left unfinished by reloading or closing is not restored. The next visit starts a new game.
- Whether a game with no guesses and no hints yet counts as quit is TBD (see Open question 4).

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

| Situation        | Input                       | Result                                                              |
| ---------------- | --------------------------- | ------------------------------------------------------------------- |
| Empty row        | `c`, `r`, `a`               | Row shows `C R A`                                                   |
| Row has `CRANE`  | `s`                         | Ignored. Row still shows `CRANE`                                    |
| Row has `CR`     | `1`, `!`, space, `é`        | Ignored. Row still shows `CR`                                       |
| Row has `CR`     | Backspace                   | Row shows `C`                                                       |
| Empty row        | Backspace                   | Nothing happens                                                     |
| Row has `CRANE`  | Ctrl+R                      | Browser reloads. No letter typed [assumed]. The game counts as quit |
| Game won or lost | `a`, Backspace, Enter, Hint | Nothing happens                                                     |

### 3.4 Submitting a guess

- Enter (physical key or on-screen `Enter`) submits the current row.
- A 5-letter word that is in the valid-word list is accepted. The row is coloured and the next row becomes current.
- A 5-letter word that is not in the list is not accepted:
  - A warning is shown when Enter is pressed.
  - The letters stay in the row and no guess is used up.
  - The player can press Backspace to delete letters and try another word.
- The wording of the warning and how long it stays are TBD (see Open question 3).
- Enter with fewer than 5 letters does not submit. The row is not used up [assumed]. Whether a warning is shown is TBD (see Open question 3).
- Upper or lower case typing makes no difference to whether a word is valid [assumed].

| Row has                   | Input                             | Result                                                |
| ------------------------- | --------------------------------- | ----------------------------------------------------- |
| `CRANE` (in list)         | Enter                             | Row coloured. Next row becomes current                |
| `ZZZZZ` (not in list)     | Enter                             | Warning shown. Row still shows `ZZZZZ`. No guess used |
| `ZZZZZ` after the warning | Backspace ×5, then `slate`, Enter | Row shows `SLATE` and is coloured                     |
| `CRAN`                    | Enter                             | Not submitted. No guess used [assumed]                |

### 3.5 Colouring a guess

Each letter gets one of three scores:

- correct (green): right letter, right place.
- present (yellow): the letter is in the answer, in another place, and an unmatched copy is left.
- absent (grey): otherwise.

Correct letters are matched first. Present letters are then matched left to right, using only answer letters not already matched [assumed: this is how "an unmatched copy is left" is read].

| Answer | Guess | Result (letter by letter) | Why                                                                          |
| ------ | ----- | ------------------------- | ---------------------------------------------------------------------------- |
| CRANE  | CRANE | 🟩🟩🟩🟩🟩                | All correct. Game won in 1                                                   |
| CRANE  | SLATE | ⬜⬜🟩⬜🟩                | A and E in the right place. S, L, T not in answer                            |
| CRANE  | EERIE | ⬜⬜🟨⬜🟩                | The last E is correct and uses up the only E. The first two E's are grey     |
| APPLE  | PUPPY | 🟨⬜🟩⬜⬜                | Middle P is correct. First P takes the other P. Fourth P has no copy left    |
| ROBOT  | FLOOR | ⬜⬜🟨🟩🟨                | Fourth O is correct. Third O takes the other O. R is in the answer elsewhere |

- The on-screen keys are coloured with the best score each letter has had so far: green beats yellow, yellow beats grey [assumed: traditional Wordle feature].

### 3.6 Winning and losing

- The game is won when a guess is all green.
- The game is lost when the 6th guess is not all green.
- On a win, a message is shown based on the number of guesses:

| Guesses | Message              |
| ------- | -------------------- |
| 1       | Genius               |
| 2       | Magnificent          |
| 3       | Impressive [assumed] |
| 4       | Splendid [assumed]   |
| 5       | Great [assumed]      |
| 6       | Phew [assumed]       |

- The notes set 1 and 2 and say "make up the rest". Rows 3 to 6 follow the traditional Wordle wording [assumed].
- On a loss, the correct word is shown.
- Where these messages appear and how long they stay is TBD (see Open question 7).

### 3.7 Hints

- The player has 2 hints per game.
- Pressing "Hint" uses one hint and shows the player a hint word.
- A hint word is a complete 5-letter word. Scored against the answer (as in 3.5), it has at least one green or yellow letter. It may have more.
- A hint word is never the answer itself [assumed].
- A hint word comes from the valid-word list [assumed].
- The second hint in a game is a different word from the first [assumed].
- Once 2 hints are used, pressing "Hint" gives no further hints [assumed].
- Hint does nothing after the game ends.
- Where the hint word is shown, whether it is coloured, and whether it uses up a row are TBD (see Open question 1).

| Answer | Possible hint word | Allowed? | Why                                 |
| ------ | ------------------ | -------- | ----------------------------------- |
| CRANE  | TRAIN              | Yes      | R and A green, N yellow             |
| CRANE  | SLATE              | Yes      | A and E green                       |
| CRANE  | PLUMB              | No       | No letter in common with the answer |
| CRANE  | CRANE              | No       | It is the answer [assumed]          |

### 3.8 Statistics

- Pressing "Stats" shows the player's statistics.
- Statistics are stored in the browser's local storage.
- Statistics survive a page reload and closing and reopening the browser.
- A quit game counts as a loss and is also counted as a quit.
- Statistics kept, as stated in the answers:
  - wins
  - quits
  - hints used
  - words (meaning TBD, see Open question 4) - this should be Word Count
- Statistics added under "if there are more stats add them" [assumed: traditional Wordle set]:
  - games played
  - losses (including quits)
  - win percentage
  - current streak (a loss or quit ends it)
  - max streak
  - wins by number of guesses (1 to 6)
- How the statistics are laid out is TBD (see Open question 4).
- If local storage is empty, unreadable or blocked, the game still works and statistics start at zero [assumed].

## 4. Constraints

- Platform: runs in a web browser.
- Supported browsers: Chrome, Firefox and Edge. Versions: current releases [assumed]. See Open question 9.
- Storage: browser local storage.
- Language: English only.
- Word lists: static. They are part of the app and do not change while it runs [assumed: this is what "static" means].
- Starting state: the repository has no code and no commits. It holds only `.claude/`, `docs/` and `notes/`.
- Tools and versions: none stated. See Open question 9.
- Phases and checkpoints: the notes ask for questions before the spec is completed. The spec should be confirmed before design or code starts [assumed].

## 5. Acceptance criteria

Unless said otherwise, "manual step" means: open the app in current Chrome, Firefox and Edge, and do what is described in each. The step passes only if it passes in all three.

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
9. Manual step: click "Stats", close the stats view, type 5 letters, press physical Enter. The guess is submitted [assumed].

Submitting

10. Manual step: each row of the table in 3.4 gives the result shown.
11. Manual step: after the not-in-list warning, the number of rows used is unchanged.

Colouring

12. Every row of the colouring table in 3.5 gives the result shown. [assumed: checked with a way to fix the answer for testing, see Open question 11]
13. Manual step: after guessing `SLATE` against `CRANE`, on-screen A and E are green and S, L, T are grey [assumed].

Winning and losing

14. For each row of the win-message table in 3.6, winning on that guess shows that message. [assumed: checked with a fixed answer, see Open question 11]
15. Manual step: making 6 wrong valid guesses ends the game and shows the correct word.
16. Manual step: after a win or a loss, typing, Backspace, Enter and Hint change nothing on screen.
17. Manual step: after a win or a loss, "New Game" starts a new game with an empty grid.

New game

18. Manual step: starting 20 new games in a row gives at least 2 different answers [assumed: this is how "random" is checked].
19. Manual step: after "New Game", 2 hints are available again.

Hints

20. Manual step: pressing "Hint" shows a 5-letter word that is in the valid-word list.
21. With a fixed answer, each hint word scores at least one green or yellow against it, and is not the answer. [assumed: checked with a fixed answer, see Open question 11]
22. Manual step: in one game, the first two presses of "Hint" show two different words. The third press shows nothing new.
23. Manual step: after a win or a loss, pressing "Hint" shows nothing new.

Statistics

24. Manual step: win a game, reload the page, press "Stats". Wins and games played have each gone up by 1.
25. Manual step: submit one guess, press "New Game", press "Stats". Losses and quits have each gone up by 1. The current streak is 0.
26. Manual step: submit one guess, reload the page, press "Stats". Losses and quits have each gone up by 1.
27. Manual step: use 2 hints in a game, finish it, press "Stats". Hints used has gone up by 2.
28. Manual step: win a game in 3 guesses. The wins-by-guesses count for 3 has gone up by 1.
29. Manual step: finish a game, close the browser, reopen the app, press "Stats". The finished game is counted.
30. Manual step: in browser developer tools, local storage for the app holds the statistics.
31. Manual step: clear local storage for the app and reload. The game works and statistics show zero [assumed].

Word lists

32. Every word in the answer list is also in the valid-word list [assumed]. Checked by a command over the lists. The command is TBD until the list format is known (see Open question 2).
33. Every word in both lists is exactly 5 letters, A–Z only. Checked the same way as 32.
34. Reading the code: the word lists are part of the repository. They are not fetched from an outside service or generated at run time.
35. Manual step: with the browser's network turned off after the page has loaded, guesses are still checked against the list [assumed: this is how "static" is checked].

Language

36. Reading the code: there is no language setting or non-English word list.

## 6. Open questions

1. Hints (partly answered: a hint is a whole word with at least one green or yellow letter).
   - Where is the hint word shown: in the grid, as a message, or somewhere else?
     -- A: It is type in the next empty row
   - Is it shown coloured against the answer, or as plain letters?
     -- A: There should be at least one colored letter in the hint and it should be colored correctly.
   - Does it use up one of the 6 guess rows?
     -- A: Yes
   - Should it avoid words the player has already guessed?
     -- A: Yes
   - Should it be picked from the common-word list, or can it be any valid word?
     -- A: Yes
   - Can a hint be used before the first guess?
     -- A: Yes
   - How does the player see how many hints are left? Is the button disabled after 2?
     -- A: in the button where it says Hint include the hints left in parentesis; like Hint (2)
2. Word lists (partly answered: common words, a big list, static).
   - Is there one list, or two (a smaller list of common answers, and a bigger list of accepted guesses, as in traditional Wordle)?
     -- A: Trying to understand why you would need two; but yes keep it the same as traditional wordle where possible.
   - Roughly how many words should each list have?
     -- A: The user should only have 6 attempts, so 6 rows!
   - US or UK spelling, or both? (The notes use "colour".)
     -- A: Both
   - Are plurals, proper nouns and offensive words excluded from answers?
     -- A: Yes
   - Where does the list come from, and are there licensing limits?
     -- A: Recover it from your data (internet, wiki?)
3. Rejected guesses (partly answered: warning on Enter, letters stay, Backspace to retry).
   - What does the warning say?
     -- A: Not a valid word, please try again
   - How long does it stay: a few seconds, or until the next key press?
     -- A: a few seconds, yes
   - What happens when Enter is pressed with fewer than 5 letters? Is a warning shown?
     -- A: Please enter 5 letters before pressing enter; something like that
   - Should the row shake, as in traditional Wordle? (See also Open question 8.)
     -- A: Yes
4. Statistics (partly answered: quit is a loss and a quit; keep wins, hints used, words, and more).
   - What does "words" mean? For example: a history of past answers, the words the player guessed, or a count of words guessed.
     -- A: the count
   - Does a game count as quit if the player has made no guesses and used no hints?
   - A: no
   - Is the added list in 3.8 right? Anything to add or remove?
     -- A: yes, and I have answered the ambiguity about Words, should be word count
   - Is "hints used" a total, an average per game, or both?
     -- A: per game
   - How are statistics shown: a pop-up, a panel, or something else?
   - A: when user clicks on stats button should be a panel on top that can be closed or when the user clicks anywhere else on the screen other than the stats area.
   - Is there a way to reset statistics?
     -- A: good idea, include that as a feature
5. Answered: reloading mid-game counts as a quit and a loss, and the game is not restored. See 3.2.
6. Answer selection.
   - Can the same answer come up twice in a row?
     -- A: it's random, so yes
   - Should recent answers be avoided?
   - A: It's random selection so no.
7. End of game display.
   - Where do the win message and the correct word appear?
     -- A: pick a location, center of screen?
   - Do they stay until "New Game", or disappear after a few seconds?
     -- A: Keep it on screen
   - When a game is quit with "New Game", is the answer shown?
     -- A: good question, yes I think it should
   - Should statistics open on their own at the end of a game, as in traditional Wordle?
     -- A: no
8. Traditional Wordle features. Which of these are in scope?
   - On-screen key colouring (assumed in 3.5).
     -- A: yes
   - Tile flip animation when a guess is coloured.
     -- A: yes
   - Row shake on a rejected guess.
     -- A: yes
   - Hard mode (revealed letters must be used in later guesses).
     -- A: yes
   - Share results as an emoji grid.
     -- A: yes
   - A "How to play" help screen.
     -- A: yes, include a help button that displays the help as a view same as stats
   - A daily word, as well as or instead of random words.
     -- A: not sure yes if its easy to do.
   - Dark mode.
     -- A: yes
   - High-contrast or colour-blind mode.
     -- A: yes
9. Platform and tools (partly answered: Chrome, Firefox and Edge).
   - Is "current release" of each enough, or must older versions work?
     -- A: yes
   - Must it work on phones and tablets (touch, small screen)?
     -- A: no
   - Is Safari (and so iPhone and iPad) not needed?
     -- A: no
   - Must it work offline?
     -- A: yes
   - Must it run by opening a file directly, or is a local server or build step allowed?
     -- A: yes, there should be very little dependency, simply JS and vite to run it, storage is on localstorage in browser.
   - Are any tools, languages or libraries required or banned?
     -- A: JS, vite - try not to include any other dependencies.
10. Visual design and accessibility.
    - Are exact colours, fonts or sizes required?
      -- A: use best judgement
    - Must it work with a screen reader?
      -- A: yes
    - Must it be fully usable without a mouse?
      -- A: yes
11. Testing.
    - Are automated tests required? If so, of what?
      -- Yes, try to cover the main logic only, critical path; don't overthink it; we can get to that later
    - Is a way to fix the answer (for testing only) allowed, so criteria 12, 14 and 21 can be checked?
      -- A: we'll answer this another time
    - Who runs the manual steps?
      -- A: we'll answer this another time

## 7. Out of scope

- Languages other than English ("Support only English language for now").

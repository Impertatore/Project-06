# Spec history: Wordle Practice

A record of how the spec was built, round by round, for the demo.

The **promoted** round is 7: [spec-current.md](spec-current.md) is a verbatim
copy of [spec-7.md](spec-7.md) and is what the agents and skills read. When a
new round is approved, copy it over `spec-current.md` and update this line.

| Round | Input | Output | `[assumed]` tags | Open questions |
|---|---|---|---|---|
| 1 | Original prompt + [spec.notes.md](spec.notes.md) | [spec-1.md](spec-1.md) | 28 | 11, all open |
| 2 | Answers to Q1, Q2, Q3, Q4, Q5, Q9 | [spec-2.md](spec-2.md) | 36 | 1 answered, 5 partly answered, 5 still open |
| 3 | Answers written inline in section 6 of [spec-2.md](spec-2.md) | [spec-3.md](spec-3.md) | 61 | 10 new, smaller questions (see below) |
| 4 | "Stop asking, infer the rest" | [spec-4.md](spec-4.md) | 51 `[assumed]` + 32 `[inferred]` | None. All decided by inference |
| 5 | Change request after the first build: better hints | [spec-5.md](spec-5.md) | Same as round 4 | None |
| 6 | Bug report: a hint found nothing new | [spec-6.md](spec-6.md) | Same as round 4 | None |
| 7 | Change request: 3 hints per game, not 2 | [spec-7.md](spec-7.md) | Same as round 4, plus 1 new | 5, for the product-owner ([three-hints-per-game.md](changes/three-hints-per-game.md)) |

## Round 1: first attempt

### Original prompt

```
/spec using notes in @docs/spec.notes.md  as the description, writing to docs/spec-1.md
```

### Notes used as the description

Snapshot of [spec.notes.md](spec.notes.md) at the time, verbatim:

```markdown
Create a Wordle game that runs in the browser.

## Intent

The player has 6 guesses to find a hidden 5-letter word. Each guess is coloured letter by letter. The player gets 2 hints per game, and their statistics are kept in the browser between visits.

## Page layout

### Header area

- Top-Left: Title 'Wordle Practice'
- Top-Right: Buttons - Hint, Stats, New Game

### Main area

6x5 tiles where the 5 letter words will be typed in by the user

The querty keyboard visible on the screen, under the squares
example:

- `Q W E R T Y U I O P`
- `A S D F G H J K L`
- `Enter Z X C V B N M ⌫`

## Core functionality

Support only English language for now; keep it simple
A valid word is accepted, so there must be a list kept somewhere.
The correct words are selected at random when I creaet a new gam

- when I win suggest that the user is a Genius if they guess in one attempt, Magnificnt in 2 guess and make up the rest...
- when I lose, display the correct word

### Typing

- Letters can be typed on the physical keyboard or by clicking on-screen keys. Both behave the same.
- Letters show in uppercase. Only A–Z are accepted.
- The current row holds at most 5 letters. Extra letters are ignored.
- Backspace removes the last letter. On an empty row it does nothing.
- The row being typed is always the first unused row. Typed letters show only while the game is in play.
- After the game ends (won or lost), typing, Backspace, Enter and Hint do nothing until a new game starts.

### Colouring a guess

Each letter gets one of three scores:

- correct (green): right letter, right place.
- present (yellow): the letter is in the answer, in another place, and an unmatched copy is left.
- absent (grey): otherwise.

## Additional

Keep the storage in local storage on browser, persist stats
Try to keep the traditional features of a typical wordle app; there are many examples, but ask if you need more details before completing the spec.
```

### Result

- Output: [spec-1.md](spec-1.md).
- 28 `[assumed]` tags.
- 11 open questions. The full list is in section 6 of [spec-1.md](spec-1.md).

Questions flagged as most likely to block the work:

1. Hints (Q1): the notes give 2 hints per game but not what a hint reveals.
2. Word lists (Q2): source, answer list vs guess list, US or UK spelling.
3. Statistics (Q4, Q5): which stats, and whether quitting or reloading mid-game counts.
4. Testing (Q11): a way to fix the answer, so colouring and win messages can be checked.
5. Platform (Q9): browsers, phones, and whether it must open as a plain file.

Where the notes were unclear, by open question in [spec-1.md](spec-1.md):

| Q | Topic | What the notes left undecided |
|---|---|---|
| 1 | Hints | What a hint reveals, where it shows, how many are left |
| 2 | Word lists | Source, size, one list or two, spelling, exclusions |
| 3 | Rejected guesses | What the player is told for a short or unknown word |
| 4 | Statistics | Which stats, how shown, what quitting does |
| 5 | Reloading mid-game | Is the game restored, does it count as a loss |
| 6 | Answer selection | Can answers repeat |
| 7 | End of game display | Where and how long win and loss messages show |
| 8 | Traditional features | Which Wordle extras are in scope ("keep the traditional features") |
| 9 | Platform and tools | Browsers, mobile, offline, build step |
| 10 | Visual design | Colours, fonts, accessibility |
| 11 | Testing | Automated tests, fixing the answer for tests |

## Round 2: answers to the first questions

### Answers given, verbatim

```
Q1: a hint is the complete word that contains at least one green or yellow letter, but could contain more
Q2: It seems to be a list of common words, but also seems to be quiet big; keep it as a static list
Q4: yes, quitting a game mid session is a loss maybe keep a stats saying quitted or something like that, same for Q5.  Otherwise we should save wins and how many hints used and words etc... if there are more stats add them
A word that is not in the list is not accepted, display a warning to the user when the hit enter, but let them hit the back key to delete the letters and try again
Q9: lets say chrome and firefox and edge?
```

The unnumbered line answers Q3 (rejected guesses).

### What changed in spec-2.md

| Q | Answer | Change in [spec-2.md](spec-2.md) | Still open |
|---|---|---|---|
| 1 | Hint is a whole word with at least one green or yellow letter | 3.7 rewritten, with a table of allowed and not-allowed hint words. Criteria 20–23 | Where it shows, coloured or not, uses a row or not, how many are left |
| 2 | Common words, big list, static | Answers from common words. Lists are static (constraint). Criteria 34–35 | One list or two, sizes, spelling, source |
| 3 | Warning on Enter, letters stay, Backspace to retry | 3.4 now stated, not assumed, with a table. Criteria 10–11 | Warning wording and duration, short-row behaviour |
| 4 | Quit is a loss, also counted as a quit. Keep wins, hints used, words, add more | 3.2 defines quitting. 3.8 lists the stats. Criteria 24–28 | What "words" means, whether an untouched game counts as quit, layout |
| 5 | Same as Q4: reload mid-game is a quit and a loss | 3.2: game not restored after reload or close | Answered |
| 9 | Chrome, Firefox and Edge | Constraints and the meaning of "manual step" | Versions, mobile, Safari, offline, build step |

Not yet answered: Q6 (answer repeats), Q7 (end of game display), Q8 (traditional features), Q10 (visual design) and Q11 (testing).

## Round 3: remaining answers

### How the answers were given

The answers were typed directly under each question in section 6 of [spec-2.md](spec-2.md), as lines starting `-- A:`. That file was left as it is, as the record of this round. The editor also reformatted its tables. The content did not change.

### What changed in spec-3.md

The number of `[assumed]` tags went up, from 36 to 61. That is because the answers added features (hard mode, sharing, help, dark mode, high contrast, accessibility, tooling), and each one needed its details spelled out.

| Area | Answer | Change in [spec-3.md](spec-3.md) |
|---|---|---|
| Hints | Typed into the next empty row, coloured, uses up a row. Can be used before the first guess. Never a word already guessed. Button shows "Hint (2)" | 3.7 rewritten. Criteria 34–38 |
| Word lists | Two lists as in traditional Wordle. US and UK spellings. No plurals, proper nouns or offensive words in answers. From a public source | New section 3.9. Criteria 57–61 |
| Rejected guesses | "Not a valid word, please try again". A 5-letters warning. A few seconds. Row shakes | 3.4 now stated, with a table. Criteria 18–20 |
| Statistics | Word count. Hints per game. Untouched game is not a quit. Panel closes on outside click. Reset included | 3.8 rewritten. Criteria 39–49 |
| Answer selection | Random, repeats allowed | 3.2. Added to Non-goals |
| End of game | Centre of screen, stays. Answer shown on quit. Stats do not open by themselves | 3.6. Criteria 25–28, 32 |
| Traditional features | All yes: key colours, flip, shake, hard mode, share, help, dark mode, high contrast. Daily word "if easy" | New sections 3.10 and 3.11. Criteria 29, 50–53 |
| Platform and tools | No phones or tablets. Offline. JavaScript and Vite, no other dependencies | Constraints rewritten. Phones and tablets moved to Out of scope. Criteria 1–8 |
| Visual and accessibility | Best judgement on looks. Screen reader and keyboard-only required | New section 3.12. Criteria 54–56 |
| Testing | Automated tests of the main logic. Two questions put off | Criterion 63. Constraints note the delay |

### Answers that needed a second look

These answers became Open question 1 in [spec-3.md](spec-3.md), because each could be read more than one way:

- "Yes" to an either/or question (hint word from the common list or any valid word).
- "yes" to an either/or question (current browser versions, or older ones too).
- "no" to "Is Safari not needed?". The question itself had a double negative, so the answer is unclear.
- "per game" for hints used: an average, or a per-game list.
- "the count" for words: whether hint rows count.

One answer looked like it answered a different question: list size was answered with "6 attempts, so 6 rows". This was asked again as Open question 3.

### New questions the answers raised

- Hints now use up a row. So: does a hint row count towards "Genius" and the rest? And can a hint be used on the last row, where it would lose the game? (Open question 2)
- Showing the answer when quitting with "New Game": when does the new game start? (Open question 4)
- "Help" and three settings do not fit the three header buttons fixed in the notes. (Open question 6)
- "Yes if it's easy" for a daily word can't be checked. (Open question 7)
- Automated tests need a test runner, which conflicts with "no other dependencies". (Open question 8)
- Keyboard-only use: Enter on a focused button conflicts with Enter to submit. (Open question 9)

## Round 4: decided by inference

### Instruction given, verbatim

```
enough of questions, this is getting to be way too much effort; you're going to need to answer these by infering from what I already answered and standard wordle game features
```

### What changed in spec-4.md

- Every open question left in [spec-3.md](spec-3.md) was decided. No TBDs are left.
- Each decision is tagged `[inferred]` in the text and listed in a table in section 6 of [spec-4.md](spec-4.md), with what it was based on. To change a decision, edit that row and the text it points to.
- Details filled in during rounds 1–3 keep their `[assumed]` tag. The count went down from 61 to 51 because some round 3 assumptions were replaced by round 4 decisions.
- Safari and a daily word were added to Non-goals as `[inferred]`, not to Out of scope. Out of scope still lists only what the user excluded.

Decisions most worth a second look:

| Decision | Why it matters |
|---|---|
| Hint rows count for the win message | A hint on row 1 rules out "Genius" |
| Hint disabled when only the last row is left | Stops a hint from losing the game |
| "New Game" mid-game asks to confirm | Adds a step the user did not ask for |
| Hint words are exempt from hard mode rules | Hard mode still applies to letters they reveal |
| Node.js built-in test runner, not Vitest | Keeps "no other dependencies", but Vitest is the usual choice with Vite |
| No daily word | The answer was "yes if it's easy" |

### What the rounds show

- Round 1 turned a short set of notes into a full spec, and made every gap visible as an open question or an `[assumed]` tag.
- Rounds 2 and 3 answered most gaps. Some answers opened new questions, because features like "hints use a row" changed other rules.
- Round 4 traded more questions for decisions made on the user's behalf. The decisions stay visible and easy to change.

## Build: from spec-4.md to a working app

### Instruction given, verbatim

```
perfect can you now proceed and build this using @docs/spec-4.md ?
```

### Result

- The app is in the repository root. See [README.md](../README.md).
- `npm test`: 50 automated tests pass. They cover the colouring, hint and hard mode tables from the spec, the win messages, statistics, share text and word lists.
- `npm run build` succeeds. The testing aid (`?answer=`) is not in the build.
- 63 scripted end-to-end checks passed in headless Edge and in headless Chrome. They covered the spec's manual steps for layout, typing, warnings, colouring, hints, winning, losing, quitting, reload-as-quit, hard mode, settings, focus and reset. A full game also worked with the network cut.
- Firefox was checked with a screenshot only. The screen reader and "mouse unplugged" steps are left for the user, as the spec says.
- Chrome was missed at first: the first check looked only in `Program Files`, and Chrome is in `Program Files (x86)`. The user pointed this out.

### Found during the build

- The spec's word list sizes were met with SCOWL: 2,063 answers and 11,184 guesses. Past tenses (ASKED, BAKED) were also removed from the answers, as in traditional Wordle.
- The SCOWL licence needs its notice in every copy. The build keeps it in the JavaScript and ships `scowl-copyright.txt`.
- A warning message blocked clicks on an open panel underneath it. Fixed so warnings never catch clicks.
- Standard Wordle yellow fails WCAG AA contrast with white letters. A darker yellow is used instead.

## Round 5: change request after the first build

### Instruction given, verbatim

```
let's make the hint more useful.

- If there is a word colored in green, then the hint needs to use that letter in that place in the hint
- if the word has yellow chars (then they need to be placed in the hint); they can be in the correct or not correct place (by chance).  We should not lose the existing finds with the hint.
don't propose a hint if the only response is the answer
```

### What changed

- [spec-5.md](spec-5.md) section 3.7: a hint now keeps every green letter from earlier rows in place and uses every yellow letter, in any place. These are the hard mode rules, applied to hints whether hard mode is on or off.
- This overturns a round 4 `[inferred]` decision ("hint words are exempt from hard mode rules"). The decision table in section 6 marks it as changed by the user.
- If only the answer fits, pressing Hint shows "No hint available: only the answer fits what you have found", and no hint is used up.
- New acceptance criteria 42a–42c. New hint table rows (STAKE, TRAIN, PRANK, BRAND, BRAKE, CRANK).
- Code: the hint picker reuses the existing hard mode check. The Help panel text is updated.
- `npm test`: 65 tests pass, including one per row of the new hint table. The browser checks passed 65/65 in both Edge and Chrome.

### What the round shows

Round 4's inferred decision was reasonable but wrong for this user. Because it was tagged and listed in one table, the change could be found and recorded in one place.

## Round 6: bug report on hints

### Report given, verbatim

```
I've just noticed a bug with our hint.  It should use the existing green and yellow letters, but also introduce a new one.  The current examples demonstrates that it doesn't
```

The screenshot showed APPLE (E yellow), FERAL (E yellow, R green), then the hint NERVE. NERVE kept R 3rd and an E, but its E was in a place already ruled out, and N, V and the second E were grey. It found nothing new. The answer was THREW.

### What changed

- [spec-6.md](spec-6.md) section 3.7: a hint must also find something new. That means a green in a place not green before, or a letter (or an extra copy of one) not found before.
- "No hint available" now covers this case too: the message says no word other than the answer keeps the finds and adds a new one.
- New hint table rows (SNAKE, STAKE, GRAIN, NERVE, HORSE). STAKE after SLATE changed from "Yes" to "No". New criterion 42d replays the reported game.
- `npm test`: 70 tests pass, including the reported game as a regression test. The browser checks passed 71/71 in Edge and Chrome, including five replays of the reported game.

### What the round shows

Round 5's rule ("keep the finds") was written as the user asked, but it didn't capture the point of a hint: to help. A real game showed the gap. The spec examples now include a "keeps everything, finds nothing" row, so the gap is visible in the spec itself.

## Round 7: three hints per game

### Request given, verbatim

```
change the number of hints per game from 2 to 3
```

### What changed

- [spec-7.md](spec-7.md): a game gives 3 hints, not 2. Section 1, 3.1 (the header
  button reads "Hint (3)"), 3.2 (a new game resets to "Hint (3)"), 3.7 (the limit
  and the button countdown, with a new row in the second table for a third hint),
  and 3.11 (Help states the count).
- Criteria 11, 35, 41, 42c, 48 and 59 updated for the new count. Criterion 41 now
  covers three hints in one game, and allows "No hint available" if no word
  qualifies.
- Nothing else about hints changed: the rules for choosing a hint word (rounds 5
  and 6), the disabled conditions, the win message, the share marker and the
  statistics are all as they were. Saved statistics keep their format.
- The change spec, its assumptions and 5 open questions for the product-owner are
  in [changes/three-hints-per-game.md](changes/three-hints-per-game.md).

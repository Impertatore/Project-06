# Change: three hints per game

Slug: `three-hints-per-game`. Branch: `agent/three-hints-per-game`.

Input: "change the number of hints per game from 2 to 3."

## 1. Intent

- A player gets 3 hints per game instead of 2.
- Everything else about hints stays as it is: what a hint word may be, how it
  is coloured, when the button is disabled, how hints show in statistics and
  in shared results.
- Every place that says "2 hints" or shows "Hint (2)" now says 3.

## 2. Non-goals

- Not changing how a hint word is chosen (spec 3.7 hint word rules).
- Not changing the number of rows (still 6) or the win messages.
- Not changing the rule that a hint may not be used on the last row.
- Not making the number of hints a player setting or a difficulty option.
- Not changing the shape of saved statistics or settings in local storage.
- Not changing the "No hint available" message or when it shows.

## 3. Player-visible behaviour

- A new game starts with 3 hints.
- The hint button counts down: "Hint (3)", "Hint (2)", "Hint (1)", "Hint (0)".
- The button is disabled, and looks disabled, when no hints are left, when
  only the last row is left, or when the game has ended. Unchanged.
- The Help panel says the player gets 3 hints per game. The rest of its hint
  text is unchanged.
- The screen reader announcement after a hint says how many hints are left, so
  it can now say "2 hints left" on the first hint.
- All 3 hints can be used in one game, because hints are allowed on rows 1 to
  5. Using 3 hints leaves 3 rows for guesses. [assumed — see Q2]
- "Hints per game" in the Stats panel is still the average hints used per game
  played, to one decimal place. Its highest possible value rises from 2.0 to
  3.0.

### Examples

| Situation | Action | Result |
|---|---|---|
| App opened, no rows used | Read the header | The button shows "Hint (3)" |
| "Hint (3)", row 1 empty | Press "Hint" | Row 1 gets a hint word, coloured. Button shows "Hint (2)" |
| "Hint (2)", row 2 empty | Press "Hint" | Row 2 gets a hint word, coloured. Button shows "Hint (1)" |
| "Hint (1)", row 3 empty | Press "Hint" | Row 3 gets a hint word, coloured. Button shows "Hint (0)" |
| "Hint (0)", row 4 empty | Press "Hint" | Nothing happens. The button is disabled |
| Rows 1–5 used, "Hint (2)" left | Press "Hint" | Nothing happens. The button is disabled (only the last row is left) |
| Game won, lost or quit, hints left | Press "Hint" | Nothing happens. The button is disabled |
| Started game, some hints used | Press "New Game", confirm "Quit", then "New Game" | Grid and key colours clear, button shows "Hint (3)" |
| Answer CRANE, row 1 is CRANK, "Hint (3)" | Press "Hint" | "No hint available: no word other than the answer keeps your finds and adds a new one". Still "Hint (3)". No hint used up |
| Answer CRANE, row 3 has `CR` typed, "Hint (2)" | Press "Hint" | `CR` is replaced by a hint word, coloured. Button shows "Hint (1)" |
| 3 hints used on rows 1–3, then the answer guessed on row 4 | Submit the answer | The win message is the one for 4 rows used ("Splendid"). Hint rows still count as rows used |
| Reset statistics, play one game with 3 hints and one with none | Open Stats | "Hints per game" shows 1.5 |
| Statistics saved before this change | Open Stats | They are still there and still counted. The average blends games played with 2 hints and games played with 3 [assumed — see Q1] |

## 4. Spec impact

The change contradicts `docs/spec-current.md` (round 6) in the places below.
**It needs a new spec round.** I have authored round 7 on this branch:
`docs/spec-7.md`, promoted over `docs/spec-current.md`, with a row added to
`docs/spec-history.md`.

Quoted statements it contradicts:

1. Section 1 (Intent):
   > "The player gets 2 hints per game. A hint fills the next empty row with a
   > word that shares at least one letter with the answer, keeps every letter
   > found so far, and finds something new."

   Becomes 3 hints per game. The rest of the sentence is unchanged.

2. Section 3.1 (Page layout):
   > "Header, top-right, in this order: "Hint (2)", "Stats", "New Game",
   > "Help", "Settings"."

   The first button now reads "Hint (3)". The order is unchanged.

3. Section 3.2 (Starting and quitting a game):
   > "A new game clears the grid and the key colours, and resets the hint
   > button to "Hint (2)" [assumed]."

   Resets to "Hint (3)".

4. Section 3.7 (Hints):
   > "- The player has 2 hints per game.
   > - The hint button shows how many are left: "Hint (2)", "Hint (1)",
   >   "Hint (0)"."

   Becomes 3 hints per game, and the button shows "Hint (3)", "Hint (2)",
   "Hint (1)", "Hint (0)".

5. Section 3.7, second table, all five rows that name a hint count:
   > "| Row 1, empty, "Hint (2)" | Yes | Row 1 gets a hint word, coloured. "Hint (1)" |
   > | Row 3 has `CR` typed, "Hint (1)" | Yes | `CR` is replaced by a hint word, coloured. "Hint (0)" |
   > | "Hint (0)" | Yes | Nothing. Button is disabled |
   > | Rows 1–5 used, "Hint (1)" | Yes | Nothing. Button is disabled |
   > | Answer CRANE, row 1 is CRANK, "Hint (2)" | Yes | "No hint available: no word other than the answer keeps your finds and adds a new one". Still "Hint (2)" |"

   The counts shift up by one; the outcomes are unchanged.

6. Section 5, criterion 11:
   > "11. Manual step: the header shows "Hint (2)", "Stats", "New Game",
   > "Help" and "Settings" at the top-right, in that order."

7. Section 5, criterion 35:
   > "35. Manual step: after "New Game", the grid and key colours are cleared
   > and the button shows "Hint (2)"."

8. Section 5, criterion 41:
   > "41. Manual step: press "Hint" twice in one game. Two different words
   > fill two rows."

   Extends to three hints and three different words.

9. Section 5, criterion 42c:
   > "42c. Manual step, known answer `CRANE`: guess `CRANK`, then press
   > "Hint". The "No hint available" message shows, no row is filled, and the
   > button still shows "Hint (2)"."

10. Section 5, criterion 48:
    > "48. Manual step: reset statistics, then play one game using 2 hints and
    > one using none. Hints per game shows 1.0."

    Becomes 3 hints and none, so 1.5.

Statements this change does **not** touch, quoted because they bear on it:

- Section 3.7:
  > "The hint button is disabled, and looks disabled, when [inferred]:
  > - no hints are left ("Hint (0)"), or
  > - only the last row is left, so a hint can never lose the game, or
  > - the game has ended."

  Unchanged. See Q2.
- Section 3.7:
  > "Hint rows count for the win message and for wins by rows used. They do
  > not count in word count (3.8)."

  Unchanged. See Q3.
- Section 3.8:
  > "hints per game: the average number of hints used per game played, to one
  > decimal place [inferred: "per game" read as an average, like win
  > percentage]."

  The definition is unchanged. See Q1.

Saved player data: **not affected in shape.** Statistics store a running total
of hints used and games played; no stored field changes meaning, no new field
is needed, and no migration is required. Existing saved statistics stay
readable and keep counting. The one effect is on interpretation: a stored
"hints per game" average spans games played under both caps. See Q1.

Help text (`index.html`) says "You get 2 hints per game"; that is
player-visible text and must change with the rest.

## 5. Acceptance criteria

1. A new game starts with 3 hints available. Checkable by an automated test
   over the pure game logic.
2. Using a hint reduces hints left by one, and after 3 hints in one game no
   further hint can be used. Checkable by an automated test.
3. The hints-used count for a finished game is 3 when 3 hints were used, and
   feeds the "hints per game" statistic unchanged. Checkable by an automated
   test.
4. No stored statistics or settings field changes name, type or meaning.
   Checkable by reading the code and by the existing storage tests passing.
5. `npm test` passes, with existing hint, game, stats, score and share tests
   updated only where they assert the old count of 2.
6. Manual step: on first load, the header shows "Hint (3)", "Stats",
   "New Game", "Help" and "Settings" at the top-right, in that order.
7. Manual step: press "Hint" three times in one game. Three different words
   fill three rows, and the button reads "Hint (2)", "Hint (1)", "Hint (0)"
   in turn.
8. Manual step: with "Hint (0)" and rows still free, the hint button is
   disabled and looks disabled, and pressing it does nothing.
9. Manual step: after "New Game", the grid and key colours are cleared and
   the button shows "Hint (3)".
10. Manual step: use 3 hints on rows 1, 2 and 3. Rows 4, 5 and 6 are still
    free, and the hint button is disabled showing "Hint (0)".
11. Manual step, known answer `CRANE`: guess `CRANK`, then press "Hint". The
    "No hint available" message shows, no row is filled, and the button still
    shows "Hint (3)".
12. Manual step: "Help" says the player gets 3 hints per game, and the rest
    of the hint explanation still matches spec 3.7.
13. Manual step: reset statistics, then play one game using 3 hints and one
    using none. "Hints per game" shows 1.5.
14. Manual step: use 1 hint and 2 guesses to win. Word count has gone up by 2
    (hint rows still do not count as words).
15. Manual step: after a game ends, "Share" still marks hint rows with 💡 and
    contains no letters of the answer.
16. Manual step, screen reader: after a hint on row 1, the announcement says
    2 hints left.
17. `docs/spec-current.md` is a verbatim copy of `docs/spec-7.md`, its banner
    names round 7, and `docs/spec-history.md` has a round 7 row. Earlier
    rounds `docs/spec-1.md` to `docs/spec-6.md` are unchanged. Checkable by
    reading the diff.

## 6. Open questions

1. **Existing saved statistics.** The description says nothing about them.
   Spec 3.8 says only:
   > "hints per game: the average number of hints used per game played, to
   > one decimal place [inferred: "per game" read as an average, like win
   > percentage]."

   Spec is silent on what happens to that average when the cap changes.
   Should saved statistics be left exactly as they are, so the average blends
   2-hint and 3-hint games? [assumed: yes, leave them alone — resetting or
   migrating player data is riskier than a slightly mixed average.]
   Round 7 as authored assumes yes and adds nothing about it.

2. **Does the last-row rule still give the right feel with 3 hints?** Spec
   3.7 says:
   > "The hint button is disabled, and looks disabled, when [inferred]:
   > - no hints are left ("Hint (0)"), or
   > - only the last row is left, so a hint can never lose the game, or
   > - the game has ended."

   With 3 hints a player can spend rows 1–3 on hints and still have 3 guess
   rows. Is that acceptable, or should a further limit apply (for example, at
   most 2 hints before the first guess)? [assumed: no further limit; 3 hints
   usable whenever the existing rules allow.] Round 7 as authored keeps the
   rule exactly as quoted.

3. **Win messages after heavy hint use.** Spec 3.7 says:
   > "Hint rows count for the win message and for wins by rows used. They do
   > not count in word count (3.8)."

   And spec 3.6:
   > "On a win, a message is shown based on the number of rows used, counting
   > hint rows [inferred: hints use up a row, so they count like guesses]."

   With 3 hints, a win after 3 hints and 1 guess shows "Splendid". Should the
   win message still be based on rows used only, with no note about hints?
   [assumed: yes, unchanged.] Round 7 as authored changes nothing here.

4. **Is 3 a one-off change or the start of a difficulty setting?** The
   description asks only for 3. Spec is silent on any hint-count setting; the
   Settings panel (3.10) covers hard mode, dark mode and high contrast only.
   [assumed: a one-off change, no setting.] Round 7 as authored adds no
   setting.

## Decisions [decided-by-po]

1. **Existing saved statistics.** Leave them exactly as they are. A stored
   "hints per game" average keeps blending games played under the 2-hint cap
   and the 3-hint cap; no reset, no migration, no new field.
   `[assumed]` — spec 3.8 defines the average but is silent on a cap change,
   and this change's own Non-goals (§2: "Not changing the shape of saved
   statistics or settings in local storage") already rule out a migration.
   Leaving data alone is lower-risk than inventing a reset or a split metric
   nothing in the spec asks for.

2. **Last-row rule stands unchanged with 3 hints.** No further limit (e.g. no
   cap on hints before the first guess). The existing disablement rule — no
   hints left, only the last row left, or the game ended — is the only rule,
   exactly as quoted from spec §3.7.
   `[spec §3.7]` — the quoted rule already fully determines when the button is
   disabled and says nothing about capping hints relative to guesses; this
   change's own Non-goals (§2: "Not changing the rule that a hint may not be
   used on the last row") confirm no new rule was intended.

3. **Win messages after heavy hint use stay unchanged.** A win after 3 hints
   and 1 guess still shows the message for 4 rows used, with no separate note
   about hints.
   `[spec §3.6, §3.7]` — both quoted passages say hint rows count for the win
   message exactly like guess rows; three hints does not change that
   arithmetic, it only changes how many hint rows are possible.

4. **Three hints is a one-off change, not a difficulty setting.** No new
   Settings-panel control for hint count.
   `[spec §3.10, assumed]` — the input asks only to "change the number of
   hints per game from 2 to 3", spec 3.10 lists exactly hard mode, dark mode
   and high contrast as the Settings panel's contents, and this change's own
   Non-goals (§2: "Not making the number of hints a player setting or a
   difficulty option") already commit to no setting.

All four decisions confirm the assumptions round 7 was already authored
under; no wording in `docs/spec-7.md` or in section 5's acceptance criteria
needs to change as a result of this round of decisions.

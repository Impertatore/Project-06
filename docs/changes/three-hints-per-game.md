# Change: three hints per game

Input: change description, "change the number of hints per game from 2 to 3".
Checked against [spec-current.md](../spec-current.md) (round 6).

## 1. Intent

The player gets 3 hints per game instead of 2.

Nothing else about hints changes: the same rules choose the hint word, a hint
still uses up a row, and the same rules say when the hint button is available.
Only the number the player starts with, the numbers shown in the button and
help text, and the acceptance criteria that name "2" are affected.

## 2. Non-goals

- Changing how a hint word is chosen (spec 3.7 hint word rules).
- Changing when the hint button is disabled.
- Changing how hint rows are scored, shared, counted for the win message, or
  counted in statistics.
- Making the number of hints a player setting, or varying it by hard mode
  or by difficulty. It is 3 for every game [assumed].
- Changing the grid: still 6 rows of 5 tiles.
- Resetting, migrating or rewriting saved statistics or settings.

## 3. Player-visible behaviour

- A new game starts with 3 hints.
- The hint button reads "Hint (3)" at the start of a game, then "Hint (2)",
  "Hint (1)", "Hint (0)" as hints are used.
- "New Game" resets the button to "Hint (3)".
- The player can use up to 3 hints in one game. Each fills the current row with
  a hint word, exactly as today.
- After the 3rd hint the button shows "Hint (0)" and is disabled.
- A hint is still refused on the last row: the button is disabled once only row
  6 is left, whatever the count shows.
- A hint that cannot be given ("No hint available: no word other than the answer
  keeps your finds and adds a new one") still uses nothing up, so the count
  stays where it was.
- The Help panel says the player gets 3 hints per game.
- The screen reader still announces how many hints are left, now counting from 3.
- "Hints per game" in Stats is still the average number of hints used per game
  played, to one decimal place. Games played before this change keep the hint
  counts they were recorded with [assumed]; the average simply mixes them.
- Share text, tile colours, key colours, the win message and word count are
  unchanged.

| Situation | Action | Result |
|---|---|---|
| App just opened, grid empty | Read the header | Button shows "Hint (3)", enabled |
| Row 1 empty, "Hint (3)" | Press "Hint" | Row 1 gets a hint word, coloured. "Hint (2)" |
| Two hints used, "Hint (1)", rows 1–2 used | Press "Hint" | Row 3 gets a hint word, coloured. "Hint (0)" |
| Three hints used, "Hint (0)", rows 1–3 used | Press "Hint" | Nothing. Button is disabled |
| Rows 1–5 used, "Hint (2)" left | Press "Hint" | Nothing. Button is disabled (only the last row is left) |
| Row 3 has `CR` typed, "Hint (3)" | Press "Hint" | `CR` is replaced by a hint word, coloured. "Hint (2)" |
| Answer `CRANE`, row 1 is `CRANK`, "Hint (3)" | Press "Hint" | "No hint available: no word other than the answer keeps your finds and adds a new one". Still "Hint (3)" |
| Hints on rows 1, 2 and 3, correct guess on row 4 | Win | Message is "Splendid" (rows used counts hint rows) |
| Hints on rows 1, 2 and 3, then a win | Press "Share" | Emoji grid has 💡 on the first three rows, and no letters |
| Game won, lost or quit, hints left | Press "Hint" | Nothing. Button is disabled |
| Reset statistics, then one game with 3 hints and one with none | Open Stats | "Hints per game" shows 1.5 |
| Statistics saved before this change | Open Stats | They still load. Nothing is reset or altered |
| Mid-game, three hints used | Press "New Game", then "Quit" | Game counts as a loss and a quit, 3 hints recorded |

## 4. Spec impact

This change contradicts `docs/spec-current.md` (round 6) in the places below.
**A new spec round (`docs/spec-7.md`) is needed.** Authoring and promoting it
is a human decision; this change spec does not do it.

Contradicted statements, quoted in full:

1. Section 1 (Intent):
   > "The player gets 2 hints per game. A hint fills the next empty row with a
   > word that shares at least one letter with the answer, keeps every letter
   > found so far, and finds something new."

   Only "2" changes; the rest of the sentence stands.

2. Section 3.1 (Page layout):
   > 'Header, top-right, in this order: "Hint (2)", "Stats", "New Game", "Help",
   > "Settings".'

3. Section 3.2 (Starting and quitting a game):
   > 'A new game clears the grid and the key colours, and resets the hint button
   > to "Hint (2)" [assumed].'

4. Section 3.7 (Hints):
   > "- The player has 2 hints per game.
   > - The hint button shows how many are left: "Hint (2)", "Hint (1)",
   > "Hint (0)"."

5. Section 3.7, second table, four rows quoted in full:
   > '| Row 1, empty, "Hint (2)" | Yes | Row 1 gets a hint word, coloured.
   > "Hint (1)" |'
   > '| Row 3 has `CR` typed, "Hint (1)" | Yes | `CR` is replaced by a hint word,
   > coloured. "Hint (0)" |'
   > '| Rows 1–5 used, "Hint (1)" | Yes | Nothing. Button is disabled |'
   > '| Answer CRANE, row 1 is CRANK, "Hint (2)" | Yes | "No hint available: no
   > word other than the answer keeps your finds and adds a new one". Still
   > "Hint (2)" |'

6. Section 5, criterion 11:
   > '11. Manual step: the header shows "Hint (2)", "Stats", "New Game", "Help"
   > and "Settings" at the top-right, in that order.'

7. Section 5, criterion 35:
   > '35. Manual step: after "New Game", the grid and key colours are cleared and
   > the button shows "Hint (2)".'

8. Section 5, criterion 42c:
   > '42c. Manual step, known answer `CRANE`: guess `CRANK`, then press "Hint".
   > The "No hint available" message shows, no row is filled, and the button
   > still shows "Hint (2)".'

Statements the change extends but does not contradict:

9. Section 5, criterion 41:
   > '41. Manual step: press "Hint" twice in one game. Two different words fill
   > two rows.'

   Still true. A third-hint step should be added. See open question 3.

10. Section 5, criterion 48:
    > '48. Manual step: reset statistics, then play one game using 2 hints and
    > one using none. Hints per game shows 1.0.'

    Still true and still passes. See open question 3.

11. Section 3.7:
    > "- The hint button is disabled, and looks disabled, when [inferred]:
    >   - no hints are left ("Hint (0)"), or
    >   - only the last row is left, so a hint can never lose the game, or
    >   - the game has ended."

    Unchanged in wording, but it now governs up to three hint rows out of six.
    See open question 2.

12. Section 3.6:
    > '- Example: a hint on row 1 and a correct guess on row 2 shows
    > "Magnificent". "Genius" is only possible without a hint, because a hint is
    > never the answer.'

    Still true.

**Saved player data:** not affected. Statistics record hints used as a running
total plus games played; no stored field changes meaning, no new field is needed,
and no migration is required. Settings are untouched. The only visible effect is
that the "hints per game" average mixes games played under both limits. See
open question 1.

## 5. Acceptance criteria

1. An automated test shows a new game starts with 3 hints left.
2. An automated test shows three hints can be used in one game, that the count
   reaches 0 after the third, and that a fourth attempt changes nothing.
3. An automated test shows a hint is still refused when only the last row is
   left, even with hints remaining.
4. An automated test shows a hint is still refused after the game has ended.
5. An automated test shows a game that used three hints reports 3 hints in its
   summary, and that word count still counts submitted guesses only.
6. An automated test shows "hints per game" is 1.5 after one game with 3 hints
   and one with 0. (Replaces criterion 48.)
7. `npm test` exits 0, with every existing hint-word-choice test unchanged and
   passing. The rules for choosing a hint word are untouched.
8. Reading the code: no number other than the hints-per-game count changes.
   The grid stays 6 rows of 5 tiles.
9. Reading the code: saved statistics and settings keep the same stored shape,
   and nothing resets or rewrites them.
10. Manual step: on first load, the header shows "Hint (3)", "Stats",
    "New Game", "Help" and "Settings" at the top-right, in that order.
    (Replaces criterion 11.)
11. Manual step: press "Hint" three times in one game. Three different words
    fill three rows, and the button reads "Hint (2)", "Hint (1)", "Hint (0)"
    in turn, then is disabled and looks disabled. (Replaces criterion 41.)
12. Manual step: after "New Game", the grid and key colours are cleared and the
    button shows "Hint (3)". (Replaces criterion 35.)
13. Manual step, known answer `CRANE`: guess `CRANK`, then press "Hint". The
    "No hint available" message shows, no row is filled, and the button still
    shows "Hint (3)". (Replaces criterion 42c.)
14. Manual step: every row of the table in section 3 above gives the result
    shown.
15. Manual step, known answer `CRANE`: use hints on rows 1, 2 and 3, then guess
    `CRANE`. The message is "Splendid".
16. Manual step: after the game in criterion 15, press "Share" and paste into a
    text editor. The emoji grid has 💡 on the first three rows and contains no
    letters of the answer.
17. Manual step: "Help" opens a panel that says the player gets 3 hints per
    game, and still explains colours, hints, hard mode and quitting.
18. Manual step, in Edge with Windows Narrator: use each of the three hints. The
    number of hints left is announced each time, counting 2, 1, 0.
19. Manual step: with statistics already saved from an earlier version, open
    Stats after this change. Every earlier statistic is still there and
    unchanged.
20. Manual step: with the mouse unplugged, use all three hints and finish the
    game from the keyboard alone.

## 6. Open questions

1. **Saved statistics across the change.** Should games played under the old
   2-hint limit stay in the "hints per game" average, or should anything be
   done about them (a reset prompt, a note in the panel)?
   [assumed: leave them; the average simply mixes the two limits.]
   Spec 3.8 says:
   > "hints per game: the average number of hints used per game played, to one
   > decimal place [inferred: "per game" read as an average, like win
   > percentage]."

   and:
   > '- The panel has a "Reset statistics" control [assumed].'

   The spec is silent on what happens to the average when the limit changes.
   Criteria 6 and 19 above assume "leave them".

2. **Hints versus remaining guesses.** Three hints can now take three of the six
   rows. Should the only limit stay the existing one, or should the game keep a
   minimum number of rows for real guesses?
   [assumed: the existing rule is unchanged.]
   Spec 3.7 says:
   > "- The hint button is disabled, and looks disabled, when [inferred]:
   >   - no hints are left ("Hint (0)"), or
   >   - only the last row is left, so a hint can never lose the game, or
   >   - the game has ended."

   The spec is otherwise silent on how many rows must be left for guesses.
   Criteria 3 and 11 above assume the rule is unchanged.

3. **Criteria that name two hints.** Criteria 41 and 48 still pass as written,
   but neither exercises the third hint. Should the new spec round restate them
   for 3 hints, or keep them and add the new steps (criteria 11 and 6 above)?
   Spec 5 says:
   > '41. Manual step: press "Hint" twice in one game. Two different words fill
   > two rows.'

   and:
   > '48. Manual step: reset statistics, then play one game using 2 hints and
   > one using none. Hints per game shows 1.0.'

   [assumed: replace both, so the criteria exercise the new limit.] If 48 is
   restated for 3 hints and 0 hints, the expected value is 1.5.

4. **Help text wording.** The number in the Help panel must change. Should
   anything else in the hints paragraph change at the same time?
   Spec 3.11 says:
   > "- It explains how to play, including the colours, hints, hard mode and
   > quitting [inferred]."

   The spec does not fix the wording of the Help text.
   [assumed: change the number only; leave the rest of the wording alone.]

5. **Is 3 final?** The description gives one number and no reason. Should the
   count be fixed at 3 for every game, or is it expected to move again (for
   example per difficulty or as a setting)?
   Spec 3.10 lists the Settings panel switches:
   > '- The panel has three switches: "Hard mode", "Dark mode" and "High
   > contrast".'

   The spec is silent on a hint-count setting.
   [assumed: fixed at 3 for every game, no new setting.] Non-goals above assume
   this.

## Decisions [decided-by-po]

1. **Saved statistics across the change.** Leave old games in the "hints per
   game" average; do nothing else (no reset prompt, no note). `[assumed]`
   Spec 3.8 defines the average and is silent on what happens when the limit
   that produces the per-game count changes; Section 4 of this change spec
   already establishes no stored field changes meaning and no migration is
   needed, so mixing the two limits in one average is the only outcome
   consistent with "no migration required." Criteria 6 and 19 already assume
   this and are unchanged.

2. **Hints versus remaining guesses.** The hint button's disable rule stays
   exactly as it is today: no hints left, only the last row left, or the game
   has ended. No new minimum-guesses rule is added. `[assumed]`
   Spec 3.7's disable rule (quoted in open question 2) does not mention a
   minimum number of guess rows, and this change's own Non-goals (section 2)
   already rule out "changing when the hint button is disabled." Adding a new
   minimum would go beyond a change described only as "2 to 3." Criteria 3
   and 11 already assume this and are unchanged.

3. **Criteria that name two hints.** Replace criteria 41 and 48 outright,
   rather than keeping them alongside the new ones. `[assumed]`
   Criteria 41 and 48 describe a 2-hint game and a 1.0 average that only made
   sense under the old limit; keeping them next to criteria that test 3 hints
   and a 1.5 average would leave two acceptance criteria implying two
   different hint limits are both current. The acceptance criteria above
   (criteria 6 and 11) are now marked "(Replaces criterion 48.)" and
   "(Replaces criterion 41.)" respectively, matching how criteria 10, 12 and
   13 already mark their replacements.

4. **Help text wording.** Change only the number in the Help panel's hints
   sentence; leave the rest of the wording as it is. `[assumed]`
   Spec 3.11 does not fix the Help text's wording, and this change's own
   Intent (section 1) already states "Only the number the player starts with,
   the numbers shown in the button and help text, and the acceptance criteria
   that name '2' are affected." Rewriting the sentence further would be a
   wording change this input never asked for. Criterion 17 already assumes
   this and is unchanged.

5. **Is 3 final?** Fix the hint count at 3 for every game. Do not add a
   setting or vary it by hard mode or difficulty. `[assumed]`
   Spec 3.10 lists exactly three Settings switches ("Hard mode", "Dark mode",
   "High contrast") and is silent on a hint-count control; the input for this
   change is "change the number of hints per game from 2 to 3," a single
   fixed number, not a request for configurability. The change's own
   Non-goals (section 2) already assume this. No acceptance criterion needs
   to change.

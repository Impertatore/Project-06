# Change: three hints per game

Slug: `three-hints-per-game`. Branch: `agent/three-hints-per-game`.
Spec this change is written against: `docs/spec-current.md` (round 6).
Spec round authored with this change: `docs/spec-7.md`.

## 1. Intent

Each game gives the player 3 hints instead of 2.

Nothing else about hints changes. A hint is still chosen by the same rules, still
fills a row, still costs a row, and still counts the same way in statistics, the
win message and the shared result. Only the number of hints a game starts with
changes, and every place that shows that number.

## 2. Non-goals

- Changing how a hint word is chosen (spec 3.7 hint rules).
- Changing when the hint button is disabled, other than the hint count itself.
- Changing the statistics that are kept or how "hints per game" is calculated.
- Making the hint count configurable by the player.
- Changing the 6-row grid, the number of guesses, or the win messages.
- Migrating, resetting or converting statistics already in local storage.

## 3. Player-visible behaviour

- A new game starts with 3 hints.
- The hint button reads "Hint (3)" at the start of a game, and counts down
  "Hint (2)", "Hint (1)", "Hint (0)" as hints are used.
- The hint button is disabled at "Hint (0)", when only the last row is left, and
  when the game has ended. These conditions do not change.
- A player can use up to 3 hint rows in one game, leaving 3 rows for guesses.
- A hint that cannot be given ("No hint available") still uses no hint up, so the
  count on the button does not move.
- After "New Game" the button resets to "Hint (3)".
- The Help panel says the player gets 3 hints per game [assumed: the description
  does not mention Help; see open question 3].
- The screen reader announcement after a hint says how many hints are left, using
  the new count.
- The "Hints per game" statistic is still the average number of hints used per
  game played, to one decimal place. Its value can now be up to 3.0 [assumed: see
  open question 2].

### Examples

| Situation | Action | Result |
|---|---|---|
| New game, no rows used | Look at the header | Button reads "Hint (3)" |
| New game, "Hint (3)" | Press "Hint" | Row 1 gets a hint word, coloured. Button reads "Hint (2)" |
| One hint used, "Hint (2)" | Press "Hint" | Next empty row gets a different hint word. Button reads "Hint (1)" |
| Two hints used, "Hint (1)" | Press "Hint" | Next empty row gets a third, different hint word. Button reads "Hint (0)" and is disabled |
| Three hints used, "Hint (0)" | Press "Hint" | Nothing happens. Button is disabled |
| Rows 1–5 used, "Hint (1)" or more left | Press "Hint" | Nothing happens. Button is disabled, because only the last row is left |
| Three hints used, rows 1–3 are hints | Play on | Rows 4, 5 and 6 are still available for guesses; a win on row 4 uses the row-4 win message |
| Answer `CRANE`, row 1 is the guess `CRANK`, "Hint (3)" | Press "Hint" | "No hint available: no word other than the answer keeps your finds and adds a new one". Button still reads "Hint (3)" |
| Two hints used, and no word qualifies for a third | Press "Hint" | "No hint available…". Button still reads "Hint (1)". No row is filled |
| Game won, lost or quit with hints left | Press "Hint" | Nothing happens. Button is disabled |
| "New Game" after a game where all 3 hints were used | Start the new game | Button reads "Hint (3)" again |
| Reset statistics, play one game using 3 hints and one using none | Open Stats | "Hints per game" shows 1.5 |
| Share a game with 3 hint rows | Paste the share text | Three emoji rows end with 💡, and no letters of the answer appear |

## 4. Spec impact

This change contradicts `docs/spec-current.md` (round 6). **A new spec round is
needed, and is authored with this change as `docs/spec-7.md`**, promoted over
`docs/spec-current.md`, with a row added to `docs/spec-history.md`.

Statements contradicted, quoted in full:

1. Section 1, Intent:
   > - The player gets 2 hints per game. A hint fills the next empty row with a word that shares at least one letter with the answer, keeps every letter found so far, and finds something new.

   Becomes 3 hints. The rest of the sentence is unchanged.

2. Section 3.1, Page layout:
   > - Header, top-right, in this order: "Hint (2)", "Stats", "New Game", "Help", "Settings".

   The button label at the start of a game becomes "Hint (3)".

3. Section 3.2, Starting and quitting a game:
   > - A new game clears the grid and the key colours, and resets the hint button to "Hint (2)" [assumed].

   Resets to "Hint (3)".

4. Section 3.7, Hints:
   > - The player has 2 hints per game.
   > - The hint button shows how many are left: "Hint (2)", "Hint (1)", "Hint (0)".

   Becomes 3 hints, and the button sequence becomes "Hint (3)", "Hint (2)",
   "Hint (1)", "Hint (0)".

5. Section 3.7, second table (the "Situation / Press Hint / Result" table):
   > | Row 1, empty, "Hint (2)" | Yes | Row 1 gets a hint word, coloured. "Hint (1)" |
   > | Row 3 has `CR` typed, "Hint (1)" | Yes | `CR` is replaced by a hint word, coloured. "Hint (0)" |
   > | Answer CRANE, row 1 is CRANK, "Hint (2)" | Yes | "No hint available: no word other than the answer keeps your finds and adds a new one". Still "Hint (2)" |

   Each count shifts up by one. These two rows are unchanged and still hold:
   > | "Hint (0)" | Yes | Nothing. Button is disabled |
   > | Rows 1–5 used, "Hint (1)" | Yes | Nothing. Button is disabled |

6. Section 5, criterion 11:
   > 11. Manual step: the header shows "Hint (2)", "Stats", "New Game", "Help" and "Settings" at the top-right, in that order.

7. Section 5, criterion 35:
   > 35. Manual step: after "New Game", the grid and key colours are cleared and the button shows "Hint (2)".

8. Section 5, criterion 41:
   > 41. Manual step: press "Hint" twice in one game. Two different words fill two rows.

   Extends to three hints in one game. See open question 4 about the case where
   a third hint does not exist.

9. Section 5, criterion 42c:
   > 42c. Manual step, known answer `CRANE`: guess `CRANK`, then press "Hint". The "No hint available" message shows, no row is filled, and the button still shows "Hint (2)".

   The button still shows "Hint (3)".

10. Section 5, criterion 48:
    > 48. Manual step: reset statistics, then play one game using 2 hints and one using none. Hints per game shows 1.0.

    Becomes 3 hints and none, and 1.5.

Statements that are **not** contradicted and must keep holding:

- Section 3.7:
  > - The hint button is disabled, and looks disabled, when [inferred]:
  >   - no hints are left ("Hint (0)"), or
  >   - only the last row is left, so a hint can never lose the game, or
  >   - the game has ended.
- Section 3.7:
  > - Hint rows count for the win message and for wins by rows used. They do not count in word count (3.8).
- Section 3.8:
  >   - hints per game: the average number of hints used per game played, to one decimal place [inferred: "per game" read as an average, like win percentage].
- Section 3.6:
  > - Sharing copies text to the clipboard [assumed] and shows "Copied" [assumed]. The text shows the score and an emoji grid, with no letters [assumed]. Hint rows end with 💡 [inferred: so a shared score is honest about hints].
- Section 3.11, Help:
  > - It explains how to play, including the colours, hints, hard mode and quitting [inferred].
  The spec is silent on whether Help states the hint count; the shipped Help text
  does. See open question 3.

### Saved player data

- The stored statistics keep the same shape: the hint statistic is a running
  total of hints used plus a count of games played. Nothing about the stored
  format changes, so no migration is needed and no saved statistics are lost.
- Statistics recorded before this change stay as they are. A player's "Hints per
  game" average therefore mixes games played with a 2-hint limit and games played
  with a 3-hint limit [assumed]. See open question 2.
- The mid-game record kept in local storage (used to count a reload as a quit)
  stores the number of hints used, not the number left, so a value saved before
  this change stays valid.
- Settings are not affected.

## 5. Acceptance criteria

1. A new game starts with 3 hints available.
2. The hint button shows "Hint (3)" on a fresh game, and after "New Game".
3. Using a hint decreases the shown count by exactly one: "Hint (3)" → "Hint (2)"
   → "Hint (1)" → "Hint (0)".
4. Three hints can be used in one game, each filling one row with a different
   word, so long as a qualifying hint word exists at each point.
5. A fourth press of "Hint" in a game does nothing: at "Hint (0)" the button is
   disabled and looks disabled.
6. The hint button is still disabled when only the last row is left, even with
   hints remaining.
7. The hint button is still disabled after the game has ended, even with hints
   remaining.
8. A "No hint available" result still uses up no hint and fills no row: the
   button count is unchanged. Checked with known answer `CRANE` and guess
   `CRANK` on row 1, where the button still shows "Hint (3)".
9. The rules for choosing a hint word (spec 3.7: answer list, never the answer,
   never a word already in the grid, keeps greens in place, uses yellows, finds
   something new) are unchanged, and the existing hint examples in spec 3.7 still
   give the results shown.
10. Statistics behaviour is unchanged in shape: after reset, one game using 3
    hints and one using none shows "Hints per game" 1.5; word count still ignores
    hint rows.
11. Win messages still count hint rows: a game with 3 hints on rows 1–3 and a
    correct guess on row 4 shows the row-4 win message.
12. Share text still marks every hint row with 💡 and reveals no letters, with up
    to 3 hint rows.
13. The Help panel states 3 hints per game, and no player-facing text anywhere
    still says 2 hints. [decided-by-po: see open question 3 — resolved in
    `docs/spec-current.md` round 7, §3.11 and criterion 59, which already say
    the Help panel states 3 hints]
14. The screen reader announcement after a hint reports the correct number of
    hints left under the new limit.
15. Stored statistics and settings from before the change are still read and
    shown correctly; nothing is reset or dropped.
16. `npm test` passes, and the automated tests assert the new limit rather than
    the number 2, wherever the limit appears.
17. `docs/spec-current.md` is the promoted round 7 and describes 3 hints
    everywhere; `docs/spec-7.md` exists; `docs/spec-history.md` has a round 7 row;
    rounds 1–6 are unchanged.

## 6. Open questions

1. **Is 3 the fixed limit for every game, or should the number of hints become a
   player setting?** The description says only "change the number of hints per
   game from 2 to 3". Assumed: a fixed limit of 3, no setting. Spec text that
   bears on it, section 3.7:
   > - The player has 2 hints per game.

   and section 3.10 lists the settings the game has; it is silent on a hint-count
   setting.

2. **What happens to statistics recorded under the 2-hint limit?** Assumed:
   nothing. They stay, and the "Hints per game" average mixes both eras. Spec
   text that bears on it, section 3.8:
   >   - hints per game: the average number of hints used per game played, to one decimal place [inferred: "per game" read as an average, like win percentage].

   and:
   > - The panel has a "Reset statistics" control [assumed].
   > - Reset asks the player to confirm [assumed]. After confirming, every statistic is zero.

   The spec is silent on any automatic reset or migration when the rules change.

3. **Should the Help panel wording change to "3 hints"?** Assumed: yes, since
   text shown to players is behaviour. Spec text that bears on it, section 3.11:
   > - It explains how to play, including the colours, hints, hard mode and quitting [inferred].

   and criterion 59:
   > 59. Manual step: "Help" opens a panel that explains colours, hints, hard mode and quitting.

   The spec itself never states the hint count inside 3.11, so this is a question
   about the shipped Help text rather than a spec contradiction.

4. **With 3 hints, a third hint may legitimately not exist for a given answer and
   grid. Does the manual check for "three hints in one game" pass when the third
   press shows "No hint available"?** Assumed: yes, that counts as a pass, because
   the existing rule already allows it. Spec text that bears on it, section 3.7:
   > - If no word other than the answer meets all these rules, pressing "Hint" shows "No hint available: no word other than the answer keeps your finds and adds a new one". No hint is used up.

   and criterion 41:
   > 41. Manual step: press "Hint" twice in one game. Two different words fill two rows.

5. **Should anything limit hints taking half the grid?** Three hints leave three
   rows for guesses, so a player can reach row 4 without a single guess of their
   own. Assumed: no extra limit; the only restriction stays the last-row rule.
   Spec text that bears on it, section 3.7:
   > - The hint button is disabled, and looks disabled, when [inferred]:
   >   - no hints are left ("Hint (0)"), or
   >   - only the last row is left, so a hint can never lose the game, or
   >   - the game has ended.

   and section 3.6:
   > - On a win, a message is shown based on the number of rows used, counting hint rows [inferred: hints use up a row, so they count like guesses].

## Decisions [decided-by-po]

1. **Fixed limit, no setting.** 3 is a fixed number of hints for every game;
   this change does not add a hint-count setting. [spec §3.7, §3.10] — round 7
   states flatly "The player has 3 hints per game" (no per-player variation),
   and §3.10 lists the game's only three switches ("Hard mode", "Dark mode",
   "High contrast"), with no hint-count control. The description that drove
   this change ("change the number of hints per game from 2 to 3") also only
   asks for the fixed number to change, at spec-current.md line 476.

2. **Statistics recorded under the 2-hint limit are left as they are.** No
   automatic migration, conversion or reset runs when this change ships; a
   player's "Hints per game" average will mix games played under both limits
   until they use "Reset statistics" themselves. [assumed] — spec §3.8 defines
   the statistic only as an average over games played, with no notion of
   "era", and §3.9's reset control is manual and player-initiated; the spec
   is silent on any automatic reset triggered by a rule change, and CLAUDE.md
   itself warns there is no migration path for saved player data, so leaving
   old figures in place (rather than inventing a migration) is the reading
   consistent with the spec.

3. **The Help panel says "3 hints per game".** [spec §3.11] — this is no
   longer an open question: round 7 of the spec, authored with this change,
   already states it directly. §3.11 reads "It states how many hints a game
   gives: 3", and acceptance criterion 59 reads "... explains colours, hints,
   hard mode and quitting, and says the player gets 3 hints per game." This
   resolves acceptance criterion 13 below, which is no longer TBD.

4. **"No hint available" on the third press still counts as a pass for
   criterion 4/41's "three hints in one game" check.** [spec §3.7] — the hint
   rule at §3.7 ("If no word other than the answer meets all these rules,
   pressing 'Hint' shows 'No hint available' ... No hint is used up") already
   allows this outcome for any hint, including a game's last one, and nothing
   in the spec ties a passing manual check to a hint word actually existing.
   A build that reaches "Hint (0)" only because words ran out, with the
   button and count behaving exactly as specified, has not failed the check.

5. **No extra limit on hints filling half the grid.** [spec §3.7] — the
   disabled-button rule in §3.7 lists exactly three conditions (no hints left,
   only the last row left, game ended) and this change's intent (section 1)
   says "only the number of hints a game starts with changes." Adding a new
   restriction not in that list, to stop hints from using half the grid,
   would be a design change beyond this change's scope, not an inference from
   the spec.

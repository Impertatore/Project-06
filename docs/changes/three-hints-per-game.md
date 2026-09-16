# Change: three hints per game

Slug: `three-hints-per-game`. Branch: `agent/three-hints-per-game`.

Input: change description given in the request — "change the number of hints
per game from 2 to 3". No issue number.

## 1. Intent

- The player gets 3 hints per game instead of 2.
- Nothing else about hints changes: what a hint word may be, when the button is
  disabled, how hint rows are coloured, shared and counted.
- The number is shown to the player in several places (the button label, the
  help text), so those all have to say 3.

## 2. Non-goals

- Changing the rules a hint word must satisfy (section 3.7 of the spec).
- Changing how many rows a game has. It stays 6.
- Changing the rule that a hint is never allowed when only the last row is
  left.
- Making the number of hints a setting the player can change.
- Changing how hints are counted in statistics (word count, hints per game) or
  in the shared text.
- Migrating, resetting or recalculating statistics already in local storage.

## 3. Player-visible behaviour

- A new game starts with 3 hints. The hint button reads "Hint (3)".
- Each hint used decrements the label: "Hint (3)" → "Hint (2)" → "Hint (1)" →
  "Hint (0)".
- The button is disabled at "Hint (0)", exactly as it is today at "Hint (0)"
  after two hints.
- All three hints can be used in one game, because hints are allowed on rows 1
  to 5 and 3 ≤ 5.
- "New Game" resets the label to "Hint (3)".
- The Help panel says the player gets 3 hints per game. [assumed: the help text
  states the count today, so it must match]
- A screen reader announcing hints left announces 3, 2, 1, 0 in turn.
- Statistics keep counting hints exactly as now: "hints per game" is total
  hints used divided by games played, to one decimal place. The maximum that
  average can reach rises from 2.0 to 3.0. [assumed]
- A player who used hints before this change keeps those counts. The average
  therefore mixes games played under the old limit with games played under the
  new one. [assumed — see question 1]

| Situation | Action | Result |
|---|---|---|
| Page just opened, no guesses | read the header | Button reads "Hint (3)" |
| Row 1 empty, "Hint (3)" | press "Hint" | Row 1 gets a hint word, coloured. Button reads "Hint (2)" |
| Row 2 empty, "Hint (2)" | press "Hint" | Row 2 gets a hint word, coloured. Button reads "Hint (1)" |
| Row 3 has `CR` typed, "Hint (1)" | press "Hint" | `CR` is replaced by a hint word, coloured. Button reads "Hint (0)" |
| "Hint (0)" | press "Hint" | Nothing. Button is disabled |
| Rows 1–5 used, "Hint (2)" | press "Hint" | Nothing. Button is disabled (only the last row is left) |
| Three hints used, game still in play | read the header | "Hint (0)", disabled. Guessing carries on in the remaining rows |
| Any hint pressed and no word other than the answer keeps the finds and adds a new one | press "Hint" | "No hint available: no word other than the answer keeps your finds and adds a new one". No hint used up, label unchanged |
| Game won, lost or quit with hints left | press "Hint" | Nothing. Button is disabled |
| Mid-game after two hints | press "New Game", then "Quit" | New game's button reads "Hint (3)" |
| Win on row 4 after 3 hints and 1 guess | win | Message "Splendid" (4 rows used). Word count goes up by 1, hints used by 3 |
| Statistics from before the change hold 4 hints over 3 games | open Stats | Hints per game still shows 1.3. Nothing is reset [assumed] |

## 4. Spec impact

The change contradicts `docs/spec-current.md` (round 6) in the statements
below, so **a new spec round is needed**. This change authors round 7.

Quoted from `docs/spec-current.md`:

- Section 1 (Intent): "The player gets 2 hints per game. A hint fills the next
  empty row with a word that shares at least one letter with the answer, keeps
  every letter found so far, and finds something new." — the count contradicts.
- Section 3.1 (Page layout): "Header, top-right, in this order: \"Hint (2)\",
  \"Stats\", \"New Game\", \"Help\", \"Settings\"." — the label contradicts.
- Section 3.2 (Starting and quitting a game): "A new game clears the grid and
  the key colours, and resets the hint button to \"Hint (2)\" [assumed]." — the
  label contradicts.
- Section 3.7 (Hints): "The player has 2 hints per game." — contradicts.
- Section 3.7 (Hints): "The hint button shows how many are left: \"Hint (2)\",
  \"Hint (1)\", \"Hint (0)\"." — contradicts; a fourth state is needed.
- Section 3.7, second table, rows: "| Row 1, empty, \"Hint (2)\" | Yes | Row 1
  gets a hint word, coloured. \"Hint (1)\" |", "| Row 3 has `CR` typed, \"Hint
  (1)\" | Yes | `CR` is replaced by a hint word, coloured. \"Hint (0)\" |",
  "| Rows 1–5 used, \"Hint (1)\" | Yes | Nothing. Button is disabled |",
  "| Answer CRANE, row 1 is CRANK, \"Hint (2)\" | Yes | \"No hint available: no
  word other than the answer keeps your finds and adds a new one\". Still
  \"Hint (2)\" |" — the labels contradict.
- Section 3.11 (Help): "It explains how to play, including the colours, hints,
  hard mode and quitting [inferred]." — not contradicted, but the shipped help
  text states "2 hints per game", which is player-visible behaviour and must
  change.
- Criterion 11: "Manual step: the header shows \"Hint (2)\", \"Stats\", \"New
  Game\", \"Help\" and \"Settings\" at the top-right, in that order." —
  contradicts.
- Criterion 35: "Manual step: after \"New Game\", the grid and key colours are
  cleared and the button shows \"Hint (2)\"." — contradicts.
- Criterion 41: "Manual step: press \"Hint\" twice in one game. Two different
  words fill two rows." — still true after the change, but it no longer
  exercises the limit. See question 2.
- Criterion 42c: "Manual step, known answer `CRANE`: guess `CRANK`, then press
  \"Hint\". The \"No hint available\" message shows, no row is filled, and the
  button still shows \"Hint (2)\"." — the expected label contradicts.
- Criterion 48: "Manual step: reset statistics, then play one game using 2
  hints and one using none. Hints per game shows 1.0." — still performable
  after the change, but it no longer uses the maximum. See question 3.

Not contradicted, and unchanged by this change:

- Section 3.7: "The hint button is disabled, and looks disabled, when
  [inferred]: no hints are left (\"Hint (0)\"), or only the last row is left, so
  a hint can never lose the game, or the game has ended." — still exactly as
  written.
- Section 3.7: "Hint rows count for the win message and for wins by rows used.
  They do not count in word count (3.8)." — unchanged.
- Section 3.8: "hints per game: the average number of hints used per game
  played, to one decimal place [inferred: \"per game\" read as an average, like
  win percentage]." — the definition is unchanged; only its possible range
  moves.
- Section 3.6: "Hint rows end with 💡 [inferred: so a shared score is honest
  about hints]." — unchanged.
- Section 3.10 hard mode rules and the rule that hint letters count for later
  guesses — unchanged.

Saved player data: **not affected in format.** The stored statistics hold a
cumulative count of hints used and games played; no field is added, removed or
re-interpreted, and no stored settings change. No migration is needed. The only
effect is that the "hints per game" average can now exceed 2.0, and for existing
players it blends games played under both limits (question 1).

## 5. Acceptance criteria

1. A new game has 3 hints available. Checkable by an automated test on the pure
   logic.
2. Using one hint leaves 2, using two leaves 1, using three leaves 0. Checkable
   by an automated test.
3. A fourth hint press in one game does nothing: no row is used and no count
   goes below 0. Checkable by an automated test.
4. Hints used for a game, as reported to the statistics, is 3 after three hints.
   Checkable by an automated test.
5. Every automated test that asserted a starting or remaining hint count of 2
   is updated to the new numbers, and `npm test` exits with code 0.
6. Reading the code: the number of hints per game is stated once, and the
   button label, the disabled rule, the statistics and any announcement all
   derive from it. No literal "2" hint count is left behind in the logic.
7. Manual step: on first load the header shows "Hint (3)", "Stats", "New Game",
   "Help" and "Settings" at the top-right, in that order. (Replaces criterion
   11.)
8. Manual step: press "Hint" three times in one game. Three different words
   fill three rows, and the label goes "Hint (3)" → "Hint (2)" → "Hint (1)" →
   "Hint (0)". (Replaces criterion 41.)
9. Manual step: at "Hint (0)" the hint button is disabled and looks disabled,
   and pressing it does nothing, while the game is still in play.
10. Manual step: after "New Game", the grid and key colours are cleared and the
    button shows "Hint (3)". (Replaces criterion 35.)
11. Manual step, known answer `CRANE`: guess `CRANK`, then press "Hint". The
    "No hint available" message shows, no row is filled, and the button still
    shows "Hint (3)". (Replaces criterion 42c.)
12. Manual step: the Help panel says the player gets 3 hints per game, and says
    nothing that implies 2.
13. Manual step: reset statistics, then play one game using 3 hints and one
    using none. Hints per game shows 1.5. (Replaces criterion 48.)
14. Manual step: win a game on row 4 after 3 hints and 1 guess. The message is
    "Splendid", and word count goes up by 1, not 4.
15. Manual step: with statistics already holding hints from before the change,
    reload after the change. The statistics are unchanged and readable, and
    nothing is reset. No migration or recalculation runs against the 3-hint
    limit.
16. Manual step, screen reader (Edge with Windows Narrator): the number of
    hints left is announced as 3, 2, 1, 0 as hints are used. [assumed: extends
    criterion 61, which already requires hints left to be announced]
17. `docs/spec-current.md` is a verbatim copy of `docs/spec-7.md`, its banner
    names round 7, and `docs/spec-history.md` has a row for round 7. Checkable
    by reading the repository.

## 6. Open questions

1. **Existing saved statistics.** Should statistics already in local storage be
   left exactly as they are, so the "hints per game" average mixes games played
   with a 2-hint limit and games played with a 3-hint limit? The change spec
   assumes yes, leave them alone. Spec text that bears on it — section 3.8:
   "hints per game: the average number of hints used per game played, to one
   decimal place [inferred: \"per game\" read as an average, like win
   percentage]." and "Statistics survive a page reload and closing and
   reopening the browser." The spec is silent on what happens to statistics
   when a rule changes between versions.
2. **Criterion 41.** Should "press \"Hint\" twice in one game. Two different
   words fill two rows." become three hints and three rows, or should a third
   criterion be added so both are checked? Spec text: criterion 41, quoted in
   full in section 4.
3. **Criterion 48.** Should the hints-per-game manual check use 3 hints and
   expect 1.5, replacing the 2-hint/1.0 version, or should both be kept? Spec
   text: "48. Manual step: reset statistics, then play one game using 2 hints
   and one using none. Hints per game shows 1.0."
4. **Wording of the help text.** Is "You get 3 hints per game" enough, or
   should the help also say that all 3 can be used in one game and that hints
   use up rows? Spec text — section 3.11: "Pressing \"Help\" opens the Help
   panel (3.1)." and "It explains how to play, including the colours, hints,
   hard mode and quitting [inferred]." The spec does not fix the wording.
5. **More frequent "No hint available".** With 3 hints, the third hint is more
   likely to hit the case where no word keeps the finds and adds a new one. Is
   the existing behaviour still what you want — message shown, no hint used up,
   label unchanged — or should a wasted press be handled differently? Spec
   text — section 3.7: "If no word other than the answer meets all these rules,
   pressing \"Hint\" shows \"No hint available: no word other than the answer
   keeps your finds and adds a new one\". No hint is used up."
6. **Is 3 a fixed number or a first step?** Should the number stay a build-time
   constant, or is a player-facing setting wanted later? This change assumes a
   fixed 3 and lists a setting as a non-goal. Spec is silent; section 3.10
   lists only "Hard mode", "Dark mode" and "High contrast" as switches.

## Decisions [decided-by-po]

1. **Existing saved statistics.** Leave them exactly as they are. No
   migration, reset or recalculation runs; the "hints per game" average
   blends games played under the 2-hint limit with games played under the
   3-hint limit. `[assumed]` — section 3.8 defines the average with no
   versioning concept, and "Statistics survive a page reload and closing and
   reopening the browser" describes plain persistence, not recomputation.
   This also matches this change's own non-goal, "Migrating, resetting or
   recalculating statistics already in local storage." Acceptance criterion
   15 is now concrete: no migration or recalculation runs.

2. **Criterion 41.** Replace it. The three-hint version (criterion 8)
   exercises every row and every label transition that the two-hint version
   did, plus the new third step, so keeping both would test the same code
   path twice for no added coverage. `[assumed]` — inferred from how the
   architect already treated the equivalent criteria 11, 35 and 42c
   ("Replaces criterion N"), which is the pattern this change follows
   elsewhere. Criterion 8 now reads "(Replaces criterion 41.)"

3. **Criterion 48.** Replace it, for the same reason as question 2: the
   3-hint/1.5 check covers the same "hints per game" arithmetic path as the
   2-hint/1.0 check, just with the new maximum. `[assumed]` — same
   replace-in-place pattern used for criteria 11, 35 and 42c. Criterion 13
   now reads "(Replaces criterion 48.)"

4. **Wording of the help text.** Update only the number; do not add new
   explanatory content about using all 3 hints in one game or hints using up
   rows. `[spec §1 / Intent]` — this change's own Intent section says "Nothing
   else about hints changes... The number is shown to the player in several
   places (the button label, the help text), so those all have to say 3,"
   which scopes the help-text edit to the digit, not to new explanation.
   Acceptance criterion 12 already only requires the panel to say 3 and imply
   nothing about 2; no change to that criterion is needed.

5. **More frequent "No hint available".** No change to the existing
   behaviour: the message shows, no hint is used up, and the label is
   unchanged, exactly as today. `[spec §3.7]` — the quoted text ("If no word
   other than the answer meets all these rules, pressing 'Hint' shows 'No
   hint available...'. No hint is used up.") does not condition this
   behaviour on how many hints remain, and the Intent section already states
   "Nothing else about hints changes... when the button is disabled" as an
   explicit non-goal for this change. A higher hit rate on an unchanged rule
   is not a reason to change the rule.

6. **Is 3 a fixed number or a first step?** It stays a fixed, build-time
   constant. No player-facing setting is added by this change. `[assumed]` —
   this change's own non-goals already say "Making the number of hints a
   setting the player can change" is out of scope, and spec section 3.10
   lists only "Hard mode", "Dark mode" and "High contrast" as switches, so
   adding a hint-count setting here would be a new feature the spec does not
   ask for, not an inference from it. A future change can propose the setting
   on its own merits.

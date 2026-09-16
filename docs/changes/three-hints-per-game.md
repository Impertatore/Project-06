# Change: three hints per game

Input: change description, "change the number of hints per game from 2 to 3".
Spec read: [spec-current.md](../spec-current.md) (round 6).

## 1. Intent

The player gets 3 hints per game instead of 2. Nothing else about a hint
changes: the same rules pick the hint word, a hint still uses up a row, and
hint rows still count the same way for the win message, sharing and
statistics. Only the allowance, the button label and the player-facing text
that says "2 hints" change.

## 2. Non-goals

- Not changing what a hint word is, or how one is chosen (spec 3.7 rules).
- Not changing the number of rows (still 6) or guesses.
- Not changing when the hint button is disabled, beyond counting to 3.
- Not making the allowance a setting or a per-game option.
- Not changing the "hints per game" statistic, its definition or its format.
- Not migrating or resetting saved statistics.
- Not changing hard mode, scoring, share text or the word lists.

## 3. Player-visible behaviour

- A new game gives the player 3 hints.
- The hint button starts at "Hint (3)" and counts down: "Hint (3)",
  "Hint (2)", "Hint (1)", "Hint (0)".
- Pressing "Hint" a third time in one game now works, where before the button
  was disabled at "Hint (0)" after two.
- The button is still disabled when no hints are left, when only the last row
  is left, and when the game has ended.
- "No hint available" still uses up no hint, so the count does not move.
- The Help panel says the player gets 3 hints per game.
- A screen reader still announces the number of hints left; that number now
  starts at 3.
- The "hints per game" statistic is unchanged in meaning and format. Its value
  can now be up to 3.0 for games played after this change. Games played before
  the change stay in the totals as they are [assumed: no reset, see Q1].

| Situation | Action | Result |
|---|---|---|
| Page opened, or "New Game" pressed | none | Button shows "Hint (3)" |
| Row 1 empty, "Hint (3)" | Press "Hint" | Row 1 gets a hint word, coloured. "Hint (2)" |
| "Hint (2)", row 2 empty | Press "Hint" | Row 2 gets a hint word, coloured. "Hint (1)" |
| "Hint (1)", row 3 empty | Press "Hint" | Row 3 gets a hint word, coloured. "Hint (0)" |
| "Hint (0)", rows 4–6 free | Press "Hint" | Nothing. Button is disabled |
| Rows 1–5 used, "Hint (1)" or more | Press "Hint" | Nothing. Button is disabled (a hint may never fill the last row) |
| Three hints used on rows 1–3, then the answer guessed on row 4 | Press Enter | Win, message "Splendid" (4 rows used) |
| Answer CRANE, row 1 is CRANK, "Hint (3)" | Press "Hint" | "No hint available: no word other than the answer keeps your finds and adds a new one". Still "Hint (3)" |
| Third hint pressed but no word keeps the finds and adds a new one | Press "Hint" | "No hint available…". Still "Hint (1)" |
| Game won, lost or quit with hints left | Press "Hint" | Nothing. Button is disabled |
| Reset statistics, then one game with 3 hints and one with none | Open Stats | Hints per game shows 1.5 |
| Share after a win using 3 hints | Press "Share" | Emoji grid has 💡 on all three hint rows, and no letters |

## 4. Spec impact

The change contradicts `docs/spec-current.md` (round 6) in the places below,
so it **needs a new spec round**. Round 7 is authored on this branch:
`docs/spec-7.md`, promoted over `docs/spec-current.md`, with a row added to
`docs/spec-history.md`.

Statements contradicted, quoted in full:

1. Section 1 Intent: "The player gets 2 hints per game. A hint fills the next
   empty row with a word that shares at least one letter with the answer,
   keeps every letter found so far, and finds something new." → 3 hints.
2. Section 3.1: "Header, top-right, in this order: \"Hint (2)\", \"Stats\",
   \"New Game\", \"Help\", \"Settings\"." → "Hint (3)" first.
3. Section 3.2: "A new game clears the grid and the key colours, and resets
   the hint button to \"Hint (2)\" [assumed]." → "Hint (3)".
4. Section 3.7: "The player has 2 hints per game." → 3.
5. Section 3.7: "The hint button shows how many are left: \"Hint (2)\",
   \"Hint (1)\", \"Hint (0)\"." → "Hint (3)", "Hint (2)", "Hint (1)",
   "Hint (0)".
6. Section 3.7, second table, row: "| Row 1, empty, \"Hint (2)\" | Yes | Row 1
   gets a hint word, coloured. \"Hint (1)\" |" → starts at "Hint (3)" and goes
   to "Hint (2)"; a third-hint row is added.
7. Section 3.7, second table, row: "| Row 3 has `CR` typed, \"Hint (1)\" | Yes
   | `CR` is replaced by a hint word, coloured. \"Hint (0)\" |" → the counts
   in this row shift by one.
8. Section 3.7, second table, row: "| Answer CRANE, row 1 is CRANK, \"Hint
   (2)\" | Yes | \"No hint available: no word other than the answer keeps your
   finds and adds a new one\". Still \"Hint (2)\" |" → "Hint (3)".
9. Criterion 11: "Manual step: the header shows \"Hint (2)\", \"Stats\",
   \"New Game\", \"Help\" and \"Settings\" at the top-right, in that order."
   → "Hint (3)".
10. Criterion 35: "Manual step: after \"New Game\", the grid and key colours
    are cleared and the button shows \"Hint (2)\"." → "Hint (3)".
11. Criterion 41: "Manual step: press \"Hint\" twice in one game. Two
    different words fill two rows." → three times, three different words in
    three rows.
12. Criterion 42c: "Manual step, known answer `CRANE`: guess `CRANK`, then
    press \"Hint\". The \"No hint available\" message shows, no row is filled,
    and the button still shows \"Hint (2)\"." → "Hint (3)".
13. Criterion 48: "Manual step: reset statistics, then play one game using 2
    hints and one using none. Hints per game shows 1.0." → one game using 3
    hints and one using none shows 1.5.

Statements the change extends but does not contradict:

14. Section 3.7: "The hint button is disabled, and looks disabled, when
    [inferred]: no hints are left (\"Hint (0)\"), or only the last row is
    left, so a hint can never lose the game, or the game has ended." Still
    true; "Hint (0)" is now reached after three hints. Three hints always fit,
    because 5 rows may hold hints.
15. Section 3.7: "Hint rows count for the win message and for wins by rows
    used. They do not count in word count (3.8)." Unchanged. "Genius" is still
    only reachable with no hint. A player using all 3 hints can win no better
    than "Splendid" (row 4).
16. Section 3.8: "hints per game: the average number of hints used per game
    played, to one decimal place [inferred: \"per game\" read as an average,
    like win percentage]." Definition unchanged; the reachable range grows.
17. Section 3.11: "It explains how to play, including the colours, hints, hard
    mode and quitting [inferred]." The Help text names the number of hints, so
    it changes with the allowance. Player-facing text is behaviour.
18. Section 3.12: "A screen reader announces [assumed]: … the number of hints
    left." Unchanged rule, new starting number.

Saved player data: **not affected in format.** No stored field, its name, type
or meaning changes. Statistics and settings in local storage stay readable and
are not reset. The only effect is that the stored hint total can grow faster
per game from now on, so "hints per game" mixes games played under the old and
new allowance (see Q1). The in-progress-game record kept for reload-as-quit
also keeps its shape; only the hint count in it can reach 3.

## 5. Acceptance criteria

1. A new game starts with 3 hints available. Checkable by `npm test`.
2. Three hints can be used in one game, each filling one row, and each word
   obeys every rule in spec 3.7. Checkable by `npm test`.
3. A fourth hint press in the same game does nothing and uses no row.
   Checkable by `npm test`.
4. The hints-used count for a finished game reaches 3 when three hints were
   used, and the "hints per game" average uses it unchanged. Checkable by
   `npm test`.
5. No automated test still asserts a maximum of 2 hints. Checkable by reading
   the tests.
6. The number of hints per game is stated once in the code, not repeated as a
   literal in several places. Checkable by reading the code.
7. Manual step: open the app. The header shows "Hint (3)", "Stats",
   "New Game", "Help" and "Settings" at the top-right, in that order.
8. Manual step: press "Hint" three times in one game. Three different words
   fill three rows, each coloured, and the button reads "Hint (2)",
   "Hint (1)", "Hint (0)" in turn, then is disabled.
9. Manual step: after "New Game", the grid and key colours are cleared and the
   button shows "Hint (3)".
10. Manual step, known answer `CRANE`: guess `CRANK`, then press "Hint". The
    "No hint available" message shows, no row is filled, and the button still
    shows "Hint (3)".
11. Manual step: use two hints and fill rows 3, 4 and 5 with guesses, leaving
    one hint. Once only row 6 is free, the hint button is disabled.
12. Manual step: after a win, loss or quit, the hint button is disabled even
    with hints left.
13. Manual step: the Help panel says the player gets 3 hints per game, and
    says nothing that still implies 2.
14. Manual step: reset statistics, then play one game using 3 hints and one
    using none. Hints per game shows 1.5.
15. Manual step, known answer `CRANE`: use three hints, then guess `CRANE` on
    row 4. The win message is "Splendid".
16. Manual step: after a game won with three hints, press "Share" and paste
    into a text editor. Three emoji rows end with 💡 and the text contains no
    letters of the answer.
17. Manual step: with a screen reader, the announcement after a hint says the
    number of hints left, starting from 2 after the first of three.
18. Existing statistics saved under the old allowance still load, and no
    statistic is reset by this change. Checkable by `npm test` plus a manual
    step: with statistics from before the change in local storage, open Stats
    and see the same numbers as before.
19. `docs/spec-current.md` is a promoted copy of `docs/spec-7.md`, its banner
    names round 7, and `docs/spec-history.md` has a round 7 row. Checkable by
    reading the files.
20. `npm test` passes, and `npm run build` succeeds.

## 6. Open questions

1. Existing saved statistics were collected when a game allowed at most 2
   hints. The "hints per game" average will now mix them with games allowing
   3. Is leaving them as they are correct, or should anything be reset or
   labelled? [assumed: leave them; nothing is reset]
   Spec text that bears on this: section 3.8, "hints per game: the average
   number of hints used per game played, to one decimal place [inferred:
   \"per game\" read as an average, like win percentage]"; and "The panel has
   a \"Reset statistics\" control [assumed]." The spec is silent on the
   allowance changing.
2. With 3 hints used, only 3 rows are left to guess in, and the best possible
   win message becomes "Splendid". Is that acceptable, or should the hint
   allowance be capped further (for example, hints disabled once fewer than 3
   rows remain)? [assumed: acceptable; only the existing last-row rule stays]
   Spec text: section 3.7, "The hint button is disabled, and looks disabled,
   when [inferred]: no hints are left (\"Hint (0)\"), or only the last row is
   left, so a hint can never lose the game, or the game has ended."; and
   "Hint rows count for the win message and for wins by rows used."
3. Should 3 be fixed, or a Settings option the player can change? [assumed:
   fixed, as 2 was]
   Spec text: section 3.10 lists the settings; it does not mention hints. Spec
   is silent on a hint-count setting.
4. Should the hint rules themselves change at all with the larger allowance
   (for example, a later hint being allowed to find nothing new when no word
   qualifies)? [assumed: no, the 3.7 rules are untouched]
   Spec text: section 3.7, "If no word other than the answer meets all these
   rules, pressing \"Hint\" shows \"No hint available: no word other than the
   answer keeps your finds and adds a new one\". No hint is used up."
5. Does any player-facing wording other than the button and the Help panel
   need to change? [assumed: no other text states the number]
   Spec text: section 3.11, "It explains how to play, including the colours,
   hints, hard mode and quitting [inferred]." Spec is otherwise silent on
   where the number appears.

## Decisions [decided-by-po]

1. Leave existing saved statistics exactly as they are; reset nothing, and add
   no label distinguishing games played under the old allowance from the new
   one. `[spec §3.8]` — round 7's own text already states this: "Games played
   when the allowance was 2 stay in the totals as they are; nothing is reset
   [assumed]." The change spec's own draft of round 7 already carries this
   decision; I am confirming it, not introducing it. Rationale: "hints per
   game" is defined as a plain average (3.8); an average naturally mixes
   values from different periods, the same way it already mixes easy and hard
   games, so no extra bookkeeping is needed and none is specified anywhere.

2. Acceptable: no further cap on the hint allowance. The only limits stay the
   existing ones — no hints left, only the last row free, or the game has
   ended. A player who uses all 3 hints can win no better than "Splendid".
   `[spec §3.7]` — round 7 already states this directly: "All 3 hints fit in
   one game: up to 5 rows may hold a hint. A player who uses all 3 has 3 rows
   left to guess in, so the best win message they can reach is 'Splendid'
   (4 rows used)." Rationale: the spec already works out that
   3 hints always leave at least one row to guess in, so the existing
   last-row rule already prevents a hint from ever winning or losing the game
   outright; no new rule is needed.

3. Fixed at 3, not a Settings option. `[spec §3.10]` — section 3.10 lists
   exactly three switches ("Hard mode", "Dark mode", "High contrast") and
   nothing about hints; the change's own non-goals already say "Not making
   the allowance a setting or a per-game option." Rationale: the spec is
   silent on a hint-count setting and the change explicitly rules one out;
   adding one would be new scope the architect already excluded.

4. No, the hint-selection rules in 3.7 do not change; only the allowance does.
   `[spec §3.7]` — quoted directly: "If no word other than the answer meets
   all these rules, pressing 'Hint' shows 'No hint available…'. No hint is
   used up." This rule is unchanged by round 7, and the change's own
   non-goals state "Not changing what a hint word is, or how one is chosen
   (spec 3.7 rules)." Rationale: the architect already fixed this in
   Non-goals; a later hint finding nothing new would be a rule change, which
   is explicitly out of scope.

5. No other player-facing wording states the hint count. Only the button
   label (3.1, 3.2, 3.7) and the Help panel (3.11) need to change; the
   screen-reader announcement (3.12) already reads the count off the button
   state rather than repeating a fixed number, so it needs no separate edit
   beyond starting higher. `[spec §3.11, §3.12]` — quoted: "It explains how to
   play, including the colours, hints, hard mode and quitting [inferred]" and
   "A screen reader announces […] the number of hints left." Rationale: I
   checked `docs/spec-current.md` for every other mention of "hint" (sections
   1, 3.1, 3.2, 3.7, 3.8, 3.10–3.12 and the acceptance criteria); round 7 has
   already updated every literal count to 3, and no other section states a
   number in prose outside the button, the Help panel and the hints-per-game
   statistic (already covered by Q1).

Acceptance criteria: no criterion changes. All 20 criteria already read "3"
where the allowance is named, and none carried a TBD tied to these five
questions — the architect had already resolved the counts in section 5 by the
time these questions were raised; the open questions were about policy
(reset, cap, setting, rule change, wording scope), and each is now answered
above with no numeric criterion left open as a result.

# Change: three hints per game

## 1. Intent

A player gets 3 hints per game instead of 2. Everything else about hints stays
the same: how a hint word is chosen, how a hint row is coloured, when the
button is disabled, and how hints are counted in statistics and shared results.
The number is the only thing that changes, so every place that shows or assumes
"2" has to show or assume "3".

## 2. Non-goals

- Changing how a hint word is chosen (the keep-and-find rules in spec 3.7).
- Changing when the hint button is disabled, including the last-row rule.
- Making the number of hints a player setting or a URL parameter.
- Changing the number of grid rows, guesses, or the win messages.
- Changing the shape of saved statistics, settings or active-game data.
- Migrating or resetting statistics recorded under the old limit.

## 3. Player-visible behaviour

- At the start of a game the hint button reads "Hint (3)".
- Each hint used lowers the count by one: "Hint (3)" to "Hint (2)" to
  "Hint (1)" to "Hint (0)".
- A player can use up to 3 hints in one game, on any rows that the existing
  rules allow.
- "New Game" resets the button to "Hint (3)".
- After the third hint, the button reads "Hint (0)" and is disabled and looks
  disabled, as it does today at zero.
- The hint button is still disabled when only the last row is left, and after
  the game has ended, whatever the count shows.
- A hint that cannot be given still shows "No hint available: no word other
  than the answer keeps your finds and adds a new one", and still uses nothing
  up, so the count is unchanged.
- The Help panel's hint text says the player gets 3 hints per game
  [assumed: the description does not mention help text, but it states the
  number to the player].
- A screen reader announces the number of hints left after a hint, with the
  new numbers ("2 hints left", "1 hint left", "0 hints left")
  [assumed: same announcement, new counts].
- The "hints per game" statistic keeps its meaning: the average number of
  hints used per game played, to one decimal place. Its highest possible value
  rises from 2.0 to 3.0.
- Shared text is unchanged: hint rows still end with 💡, and the score still
  counts rows used.

| Situation | Action | Result |
|---|---|---|
| App just opened, no guesses | Read the header | Button shows "Hint (3)", enabled |
| Row 1 empty, "Hint (3)" | Press "Hint" | Row 1 gets a hint word, coloured. Button shows "Hint (2)" |
| Two hints used, "Hint (1)", rows 1–2 used | Press "Hint" | Row 3 gets a hint word, coloured. Button shows "Hint (0)" |
| Three hints used, "Hint (0)" | Press "Hint" | Nothing happens. Button is disabled |
| Rows 1–5 used, "Hint (1)" or "Hint (2)" | Press "Hint" | Nothing happens. Button is disabled (last-row rule) |
| Row 4 has `CR` typed, "Hint (1)" | Press "Hint" | `CR` is replaced by a hint word, coloured. Button shows "Hint (0)" |
| Answer CRANE, row 1 is CRANK, "Hint (3)" | Press "Hint" | "No hint available: …". No row filled. Button still shows "Hint (3)" |
| Hints used on rows 1, 2 and 3 | Type and submit a guess | Guess lands on row 4. Three rows remain for guesses |
| Game won, lost or quit with hints left | Press "Hint" | Nothing happens. Button is disabled |
| Any hint used, then "New Game" (game not started, or ended) | Start a new game | Grid and key colours clear. Button shows "Hint (3)" |
| Win on row 4 after 3 hints | Read the end-of-game message | The message is the one for 4 rows used. Hint rows still count as rows used |
| Win using 3 hints and 1 guess | Open Stats | Word count rose by 1. Hints used rose by 3 |
| Reset stats, play one game with 3 hints and one with none | Open Stats | Hints per game shows 1.5 |

## 4. Spec impact

The change contradicts the current spec wherever the count "2" appears. Each of
these is a statement in `docs/spec-current.md` (round 6) that must read "3":

- Section 1 (Intent): "The player gets 2 hints per game. …"
- Section 3.1 (Page layout): "Header, top-right, in this order: \"Hint (2)\",
  \"Stats\", \"New Game\", \"Help\", \"Settings\"."
- Section 3.2 (Starting and quitting a game): "A new game clears the grid and
  the key colours, and resets the hint button to \"Hint (2)\" [assumed]."
- Section 3.7 (Hints): "The player has 2 hints per game."
- Section 3.7 (Hints): "The hint button shows how many are left: \"Hint (2)\",
  \"Hint (1)\", \"Hint (0)\"."
- Section 3.7, second table: the rows "Row 1, empty, \"Hint (2)\"",
  "Row 3 has `CR` typed, \"Hint (1)\"", "Rows 1–5 used, \"Hint (1)\"" and
  "Answer CRANE, row 1 is CRANK, \"Hint (2)\"" all name a starting count of 2.

Acceptance criteria in section 5 that the change contradicts:

- Criterion 11: "the header shows \"Hint (2)\", \"Stats\", \"New Game\",
  \"Help\" and \"Settings\" at the top-right, in that order."
- Criterion 35: "after \"New Game\", the grid and key colours are cleared and
  the button shows \"Hint (2)\"."
- Criterion 41: "press \"Hint\" twice in one game. Two different words fill two
  rows." Extends to three hints and three rows.
- Criterion 42c: "… the button still shows \"Hint (2)\"."
- Criterion 48: "play one game using 2 hints and one using none. Hints per game
  shows 1.0." The expected figure changes if the step uses the new maximum.

Criteria unaffected: 27, 39 (apart from the counts in the table it points at),
40, 42, 42a, 42b, 42d, 43, 47, 60.

**New spec round needed: yes.** These are statements in `docs/spec-current.md`,
and a new round (`docs/spec-7.md`) has to be authored, approved and promoted.
Authoring and promoting that round is a human decision and is not part of this
change spec.

**Saved player data:** the stored format does not change. Statistics keep a
cumulative count of hints used and a count of games played; settings and the
active-game record are untouched. No migration is needed and nothing is wiped.
One effect on meaning: the "hints per game" average mixes games played under
the old limit of 2 with games played under the new limit of 3, so a long-lived
player's average is over two different maximums. See open question 1.

## 5. Acceptance criteria

1. Reading the code: the number of hints a new game starts with is 3, and it is
   stated in one place rather than repeated.
2. An automated test checks that a new game starts with 3 hints left.
3. An automated test checks that three hints can be used in one game, and that
   the hints left after each is 2, then 1, then 0.
4. An automated test checks that a fourth hint attempt does not add a row and
   does not change the hints left.
5. An automated test checks that a game summary after three hints reports 3
   hints used, and reports only the submitted guesses in the guess count.
6. An automated test checks that a hint is refused on the last row, whatever
   the number of hints left.
7. `npm test` exits with code 0.
8. Reading the code: no text shown to a player still says "2 hints" or
   "Hint (2)" as the starting state.
9. Manual step: open the app. The header shows "Hint (3)", "Stats",
   "New Game", "Help", "Settings", in that order. (Replaces criterion 11.)
10. Manual step: press "Hint" three times in one game. Three different words
    fill three rows and the button reads "Hint (2)", "Hint (1)", "Hint (0)" in
    turn, then is disabled. (Replaces criterion 41.)
11. Manual step: after "New Game", the grid and key colours are cleared and the
    button shows "Hint (3)". (Replaces criterion 35.)
12. Manual step, known answer `CRANE`: guess `CRANK`, then press "Hint". The
    "No hint available" message shows, no row is filled, and the button still
    shows "Hint (3)". (Replaces criterion 42c.)
13. Manual step: use hints on rows 1, 2 and 3, then submit a guess. It lands on
    row 4, and the hint button is disabled at "Hint (0)".
14. Manual step: use two hints (rows 1 and 2), then submit three guesses. With
    only row 6 left and one hint still in hand, the button reads "Hint (1)" and
    is disabled.
15. Manual step: "Help" opens a panel whose hint text says 3 hints per game and
    otherwise still explains the keep-and-find rules, the last-row rule and the
    "no hint available" case.
16. Manual step: reset statistics, play one game using 3 hints and one using
    none. Hints per game shows 1.5. (Replaces criterion 48.)
17. Manual step, screen reader (Edge with Windows Narrator): after the first
    hint of a game, the number of hints left is announced as 2.
18. Manual step: existing statistics in local storage are still read after the
    change. Games played, wins and hints used keep the values they had before.

## 6. Open questions

1. The "hints per game" average will mix games played with a maximum of 2 hints
   and games played with a maximum of 3. Is that acceptable, or should anything
   be done about it (a note in the Stats panel, a reset prompt)? Assumed
   acceptable and left alone; criterion 18 assumes no reset and no migration.
2. Should the last-row rule stay exactly as it is, so a hint is never allowed on
   row 6? Assumed yes. If it changed, criteria 6 and 14 are TBD (question 2).
3. Should the Help panel text change with this change, or in a separate one?
   Assumed with this change; criterion 15 is TBD if not (question 3).
4. Criterion 48 of the current spec uses 2 hints to give an average of 1.0.
   Should the replacement use 3 hints and 1.5, or keep 2 hints and 1.0 so the
   step is unchanged? Assumed 3 and 1.5; criterion 16 is TBD (question 4).
5. Should a new spec round (`docs/spec-7.md`) be authored and promoted before
   the change is implemented, or after it is built and checked? The change
   contradicts round 6 either way.

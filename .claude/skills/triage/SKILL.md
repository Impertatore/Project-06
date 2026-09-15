---
name: triage
description: Decide whether a GitHub issue is safe to hand to the maintenance
  loop. Reads the issue and the code, reproduces the report with a throwaway
  test, and returns a category, estimated risk, test surface, reproduction
  status, and a verdict of AUTOMATE, SEMI-AUTOMATE, or HUMAN-REQUIRED, leaning
  cautious. `calibrate` runs the skill blind against known cases to check it
  is neither over-cautious nor falling for traps. Use before starting work on
  any backlog issue.
argument-hint: "<issue-number | issue-url> [<issue-number>…] | calibrate [CAL-n…]"
---

# Triage

**Skill version: 1.2.0** (see Changelog at the bottom).

You decide **how much human judgement an issue needs**, not how to fix it. Your
verdict decides whether a change gets a skim, a real review, or a human
designer, so a wrong "safe" costs far more than a wrong "careful". But a skill
that says "careful" to everything carries no signal either. **Facts first:** a
verdict rests on code you read and a test you ran, not on how the issue is
worded.

Arguments: `$ARGUMENTS`

- one or more issue numbers or URLs → **Triage mode**.
- `calibrate` or `calibrate CAL-1 CAL-3 …` → **Calibration mode**.

Several issues or cases are handled **one at a time**, never in parallel,
because they share one reproduction worktree and one build.

**Lean cautious.** When two verdicts are defensible, pick the more cautious
one and say what would have to be true for the other.

**Assume one issue in any batch is a trap:** something that *reads* as trivial
but isn't. Short issue text, a one-line-looking fix, and a confident first
impression are exactly what a trap looks like.

## Triage mode

### Step 1 — Read the issue

- `gh issue view <n> --repo OWNER/REPO --json number,title,body,labels,comments,url`.
  Take OWNER/REPO from `git remote get-url origin`, and always pass `--repo`.
- Read the whole body and every comment. Note the **reported symptom** (what
  the user sees) separately from any **suggested cause or fix** (what the
  reporter thinks is wrong).
- If you can't fetch the issue, say so and stop. Never triage from a title.

### Step 2 — Read the policy

Read the "Maintenance automation policy" section of `CLAUDE.md`: the verdict
definitions, the **sensitive areas**, and the non-behavioural exemption. Don't
use a remembered copy.

### Step 3 — Find the code

1. **Locate the behaviour.** Search for the UI text, setting, storage key or
   game rule the issue mentions. UI text and input handling live in
   `index.html` and `src/main.js`; rules live in `src/logic/`; saved data in
   `src/storage.js`. Follow it from the UI into the logic module. Name files
   and line ranges.
2. **Trace to the root cause, not the first plausible line.** Follow the value
   back to where it's computed. The fix belongs where the cause is.
3. **Measure the blast radius.** For each function a fix would change, grep
   callers across `src/`, `index.html`, `tests/` and `scripts/`. Note shared
   logic used in several places (for example `scoreGuess` feeds the board,
   the keyboard, hints, hard mode and share text).
4. **Compare with the spec.** `docs/spec-6.md` is the source of truth for
   intended behaviour. Find the section that covers the reported behaviour
   and quote it. Say which case this is: the code disagrees with the spec
   (a bug), the spec is silent or ambiguous (a decision for a human), or the
   code matches the spec and the reporter wants something different (a
   feature request). Also check `git log --oneline -- <path>` for recent
   changes to the files.

### Step 4 — Reproduce with a test

Reading the code tells you what *should* happen. Only a run tells you what
*does*. Before judging, try to make the reported symptom fail in a test.

1. **Prepare the reproduction worktree** (create once, reuse across issues):
   - `git worktree add --detach .claude-notes/wt/triage HEAD` if it doesn't
     exist. Otherwise
     `git -C .claude-notes/wt/triage checkout --detach --force <ref>`, where
     `<ref>` is `HEAD` of the main checkout in Triage mode, or the case's ref
     in Calibration mode.
   - Reset it: `git -C .claude-notes/wt/triage reset --hard` and
     `git -C .claude-notes/wt/triage clean -fd -- tests`.
   - Never create a branch there, and never commit in it.
2. **Write one reproduction test** at
   `.claude-notes/wt/triage/tests/triage-repro-issue-<n>.test.js`.
   - Follow the tests next to it: `import { test } from 'node:test'`,
     `import assert from 'node:assert/strict'`, and import the logic module
     from `../src/logic/<module>.js`. Only `src/logic/` and `src/words/` can be
     imported; they have no browser code.
   - Name the test `reported symptom: <short description>`. Assert the
     behaviour the reporter **expects**, so the test *fails if the bug is
     real*.
   - Keep it to the one symptom. Don't test your planned fix.
3. **Run only that test**:
   `node --test .claude-notes/wt/triage/tests/triage-repro-issue-<n>.test.js`.
   Then run the **whole suite** in the worktree, so you know the existing
   tests are green before any change: `npm test --prefix .claude-notes/wt/triage`.
   It takes seconds and needs no `npm ci`. It includes your reproduction test,
   so the only failure should be that one test.
4. **Record the reproduction status** (exactly one):

   | Status | When |
   |--------|------|
   | `reproduced-by-test` | Your test failed, showing the reported symptom |
   | `reproduced-by-reading` | The symptom is confirmed in code, but it lives where no test can reach (`src/main.js`, `src/style.css`, `index.html`: rendering, focus, themes, animation). Say why no test. |
   | `not-reproduced` | Your test passed: the code already behaves as the reporter expects |
   | `mis-described` | The feature, path, or premise in the issue doesn't exist as described (e.g. an export type or behaviour that isn't there) |
   | `could-not-run` | A test was written but the build or run failed for environment reasons. Give the error. |

   Copy the test source and the run output (pass/fail line) into the sheet. A
   human can reuse a `reproduced-by-test` test as the first step of the fix.
5. **Clean up the test file** (`reset --hard`, `clean -fd -- tests`). Leave
   the worktree itself for the next issue.

For a UI-only symptom, you may confirm it by reading the code together with
the manual step in section 5 of `docs/spec-6.md` that covers it. Don't start
a dev server on a fixed port.

### Step 5 — Assess, in two parts

**Part A — actionability** (from Step 4):

- `reproduced-by-test` or `reproduced-by-reading` → actionable. Go to Part B.
- `not-reproduced` or `mis-described` → **not actionable yet**. The final
  verdict is `HUMAN-REQUIRED`, with reason `needs clarification`. Still do
  Part B for the **smallest scope a human might agree to**, so the sheet shows
  what the loop could do once the issue is clarified.
- `could-not-run` → confidence can't be `high`. Do Part B as normal, and the
  final verdict is at most `SEMI-AUTOMATE`.

**Part B — the smallest scoped change.** Define the **smallest change that
resolves the reported symptom** in one sentence, including what it must *not*
change. Judge **that** change, not the most obvious or the most complete one.
If a larger fix is also worth doing, mention it separately.

#### Category (pick exactly one, for the scoped change)

| Category | Use when |
|----------|----------|
| `trivial fix` | Wrong text, typo, obvious missing null check, a copy-paste slip, a test-only or comment-only fix: one clear correct answer, one location |
| `dependency bump` | Package version change only |
| `minor bug` | Real behaviour is wrong in one area, the correct behaviour is unambiguous, and the fix is local |
| `small feature` | New behaviour, however small |
| `ambiguous scope` | Expected behaviour or affected users aren't settled, even for the smallest scope |
| `needs-human` | The scoped change still touches a sensitive area behaviourally, crosses several areas, or needs a business decision |

#### Estimated risk

`low`, `medium` or `high`, with **one sentence** naming the worst realistic
consequence of getting the scoped change wrong, and who notices. Players'
saved statistics or settings, the scoring rule, share text revealing the
answer, licence text, or something every game shows → at least `medium`.

#### Test surface

- **Existing tests that would catch a regression:** test file and test
  names, with assertions read and their green/red status from Step 4.3.
- **New regression test needed:** yes or no. If Step 4 produced a failing
  test, that's it.
- **Untestable parts:** anything in `src/main.js`, `src/style.css` or
  `index.html`, plus the manual check from `docs/spec-6.md` section 5.

#### Scoped verdict

Apply the policy's definitions, then these rules. The **most cautious** rule
that applies wins:

- A **behavioural** change in a sensitive area → `HUMAN-REQUIRED`.
- A **non-behavioural** edit (comments, XML docs, test-only) inside a
  sensitive file → at most `SEMI-AUTOMATE`. Text shown to players, including
  the licence notice, messages, help text and share text, is behaviour.
- Category `needs-human` or `ambiguous scope` → `HUMAN-REQUIRED`.
- The scoped change alters something players rely on (saved statistics and
  streaks, settings, the share text format, which words are accepted) →
  `HUMAN-REQUIRED`.
- Security-shaped (injecting HTML from stored or URL data, what the
  `?answer=` testing aid can do in a build, dependencies) →
  `HUMAN-REQUIRED`.
- No test could fail if the change were wrong, and it's behavioural → at most
  `SEMI-AUTOMATE`.
- Category `minor bug` or `small feature` → at most `SEMI-AUTOMATE`.
- `AUTOMATE` only for `trivial fix` or `dependency bump` meeting **every**
  `AUTOMATE` condition in the policy, with actionability `reproduced-*`.

#### Final verdict

The **more cautious** of Part A's cap and Part B's scoped verdict. Always give
a reason, one of: `sensitive area`, `needs clarification`, `security-shaped`,
`relied-on behaviour`, `no test possible`, `scope`, `environment`, or `none`.
For example: `HUMAN-REQUIRED (needs clarification)`, scoped verdict
`SEMI-AUTOMATE`.

### Step 6 — Argue against your own verdict

Write a short **"Why this might not be safe"** paragraph as if you were the
reviewer who has to roll it back at 2am:

- What's the most plausible way the scoped change goes wrong?
- Who else uses the code you'd change?
- Which assumption did you accept without checking?
- If this issue were the planted trap, what would the trap be?

If that paragraph names a sensitive area, shared component, relied-on
behaviour, or an unchecked assumption you can't check now, **downgrade by one
level** and record why. The mirror rule also applies: if the only reason for
caution is the issue's *wording*, and Step 4 settled the facts, don't add
caution for it. Say so.

**Confidence:**
- `high` needs a Step 4 run that reached a result (`reproduced-by-test` or
  `not-reproduced`), or `reproduced-by-reading` for a non-behavioural or
  markup-only symptom where you quote the exact line.
- `medium` when you found the code but one question stayed open.
- `low` when you couldn't trace the root cause.

A verdict without `high` confidence is never `AUTOMATE`.

### Step 7 — Write the sheet and log the run

1. **Write** `.claude-notes/triage-<n>.md` in the format below. Check it's
   git-ignored with `git check-ignore -v <path>`, and overwrite on a re-run.
   `/pr-review` reads this file.
2. **Append one row** to the table for this skill version in
   `docs/maintenance/triage-log.md` (create the file with a `# Triage log`
   heading if it doesn't exist). If there's no table for this version, add
   a heading `## Skill <version>` and this header:

   ```markdown
   | Date | Issue | Title | Category | Risk | Reproduction | Scoped verdict | Final verdict (reason) | Confidence | Downgraded? | Outcome (human) | Was triage right? (human) |
   |------|-------|-------|----------|------|--------------|----------------|------------------------|------------|-------------|-----------------|---------------------------|
   ```
3. **Don't label, comment on, assign or close the issue** unless asked in that
   turn.

### Sheet format

````markdown
# Triage — Issue #<n>: <title>

Repo: OWNER/REPO · Skill: triage <version> · Date: <YYYY-MM-DD HH:mm> · Code ref: <sha7>
**Final verdict: <AUTOMATE | SEMI-AUTOMATE | HUMAN-REQUIRED> (<reason>)** · Scoped verdict: <…> · Confidence: <high | medium | low> · Downgraded: <no | yes, from X: reason>

## Reproduction
- Status: <reproduced-by-test | reproduced-by-reading | not-reproduced | mis-described | could-not-run>
- Test: `tests/triage-repro-issue-<n>.test.js` › `reported symptom: …` — <FAILED as expected | PASSED | not written: why>
- Output: `<the pass/fail line, and the assertion message if it failed>`
- Existing suite: <npm test: passed x/y>

```js
<the reproduction test source, or "none">
```

## What the issue says vs what the code says
- Reported symptom: <…>
- Suggested cause (from the issue): <… or "none given">
- Root cause found: <file:line, one sentence, or "not found">
- Spec: <docs/spec-6.md section, quoted | spec is silent> → <code disagrees with spec | spec ambiguous | code matches spec>
- Recent changes: <git log lines for the files, or "none since initial build">


## Smallest scoped change
<one sentence: the change, and what it must not change>

## Category
<one category>: <one sentence why>

## Estimated risk
<low | medium | high>: <one sentence: worst realistic consequence, and who notices>

## Test surface
- Existing tests that would catch a regression: <tests/file.test.js › test name (green/red), …, or "none">
- New regression test needed: <yes/no>: <what it asserts, where it lives>
- Untestable parts: <… and the manual check, or "none">

## Where a fix would go
| File | Lines | Sensitive area? (behavioural / non-behavioural) | Callers / blast radius |
|------|-------|--------------------------------------------------|------------------------|

## Why this might not be safe
<the Step 6 paragraph>

## Handing it to the loop
<AUTOMATE / SEMI-AUTOMATE: scope boundary, the failing test to start from, and what must NOT change. HUMAN-REQUIRED: the questions a human must answer first, and the scoped verdict the issue would get once they're answered.>
````

Finish by printing the final verdict line, the reproduction status, the
one-sentence risk, and the sheet path. For anything but `HUMAN-REQUIRED`,
also give the next step: start the change on a branch `issue-<n>-<slug>` off
`main`, and open a PR back to `main`. Never commit to `main` directly.

## Calibration mode

`/triage calibrate` tests the skill, not an issue. Run it after any change to
this file or to the policy in `CLAUDE.md`, and before trusting a batch of
real verdicts.

1. **Read `docs/maintenance/triage-calibration/cases.md` only.** **Don't open
   `expected.md`** until step 3. Knowing the answers invalidates the run. If
   `cases.md` doesn't exist, say so and stop. Calibration cases for this repo
   haven't been written yet, and a human writes them, not this skill.
2. **Triage each case** (or only the named ones), one at a time, exactly as
   in Triage mode, with these differences:
   - The issue title and body come from the case, not GitHub. Skip
     `gh issue view`.
   - In Step 4.1, check out the case's **ref** in the reproduction worktree,
     then apply its **patch** if it has one:
     `git -C .claude-notes/wt/triage apply <repo>/docs/maintenance/triage-calibration/<patch>`.
     Read code for Steps 3–4 **from the worktree** (for example
     `git -C .claude-notes/wt/triage show HEAD:<path>` or the worktree's
     files), not from the main checkout, which may have moved on.
   - Write sheets to `.claude-notes/calibration/<CAL-n>.md`. Don't write the
     triage log.
   - After each case, write its final verdict and reproduction status into a
     scratch list **before** starting the next case.
3. **Only now open `expected.md`** and score each case using its scoring
   rules: `match`, `too-cautious` or `too-confident`, plus whether the
   reproduction status matched.
4. **Append a results section** to
   `docs/maintenance/triage-calibration/results.md` (create it if needed):

   ````markdown
   ## Run <YYYY-MM-DD HH:mm> · triage <version> · policy @ <git log -1 --format=%h -- CLAUDE.md>

   | Case | Expected | Got (reason) | Score | Repro expected | Repro got | Repro match |
   |------|----------|--------------|-------|----------------|-----------|-------------|

   **Result:** <PASS | FAIL>: <k> match, <c> too-cautious, <t> too-confident, <r>/<n> reproduction matches
   **Disagreements:** <for each non-match: skill wrong, or expectation wrong? Evidence either way. Decided by: human (leave "pending" for them)>
   ````
5. **Print** the result line and the disagreements. Don't edit the skill,
   the policy or `expected.md` to make a run pass. Proposing a change is
   fine, and the human decides.

## Never

- **Never triage from the title or the issue text alone.** No code read means
  no verdict.
- **Never skip reproduction because the answer seems obvious.** Obvious is
  what traps look like, in both directions.
- **Never call something `AUTOMATE` because the diff would be short.** A
  one-line change to rounding, a date conversion, a permission or moderation
  check, or the licence footer is exactly the trap.
- **Never let the reporter's suggested fix set the scope.** Judge the smallest
  change that resolves the symptom.
- **Never claim test coverage you haven't read**, and never call a test
  green that you didn't run.
- **Never write the fix, and never commit** in the reproduction worktree.
- **Never read `expected.md` before scoring** in Calibration mode, and never
  tune the skill to one run's answers without a human decision.
- **Never act on the issue on GitHub** (labels, comments, assignment) unless
  asked in that turn.

## Changelog
- **1.2.0**: Moved from nopCommerce to Wordle Practice. Reproduction tests
  are now `node:test` files in the worktree's `tests/`, run with `node --test`.
  The upstream-diff check is replaced by a comparison with `docs/spec-6.md`.
  Risk and relied-on behaviour are now about players' saved data, scoring,
  share text and the word-list licence. Issues branch off `main` and come back
  by PR. Calibration stops if this repo has no cases yet.
- **1.1.0**: After the first batch returned `HUMAN-REQUIRED` for all 5 issues
  with no reproduction: added **Step 4, reproduce with a throwaway test** in a
  shared worktree, with five reproduction statuses and `high` confidence
  requiring a run. **Split assessment** into actionability (Part A) and the
  **smallest scoped change** (Part B), with a final verdict that names its
  reason, so "not understood yet" is no longer confused with "risky to
  change". Added the non-behavioural exemption (mirrors the policy),
  security-shaped as an explicit rule, the mirror rule against adding caution
  for wording alone, and **Calibration mode**: blind runs against
  `docs/maintenance/triage-calibration/` with expected verdicts kept separate
  and scored `match` / `too-cautious` / `too-confident`. Issues are now
  handled sequentially (shared worktree).
- **1.0.0**: Initial version for the maintenance exercise. Category, risk,
  test surface and verdict per the course brief; policy shared with
  `/pr-review`; root-cause tracing, cause-vs-code check, blast radius,
  upstream diff, and a "why this might not be safe" downgrade pass.

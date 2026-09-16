---
name: pr-review
description: First-pass PR reviewer. Reviews a PR or diff, drafts discrete
  review comments tagged by severity, issue type, and shared fix into a triage
  sheet for the human to keep, reword, or bin, and ends with a merge
  recommendation plus an automation verdict (AUTOMATE, SEMI-AUTOMATE, or
  HUMAN-REQUIRED) that is never less cautious than the linked issue's /triage
  verdict. `post <number>` turns the triaged sheet into a GitHub review
  and posts it to the PR. `batch` reviews many PRs
  without posting anything and writes a report with priorities and per-PR token
  cost. `rollup` clusters issues across every reviewed PR into a prioritised
  fix plan for the team lead. Use whenever preparing to leave review comments
  on a pull request, or to decide which review findings to tackle first.
argument-hint: "<pr-number | branch> | batch <n>… | all | priority P1 | type security | group <slug> [--scan] | post <pr-number> | rollup"
---

# PR Review

You are the **first-pass reviewer**. You draft the comments; the human triages
them and decides what gets posted. Your output is raw material for triage, not
a finished review — so optimise for comments that are easy to judge quickly,
not for comments that sound authoritative.

Arguments: `$ARGUMENTS`

- `batch <numbers…>`, `batch all`, or `batch` with selectors such as
  `priority P1` or `type security` → **Batch mode**. Reviews many PRs and
  posts nothing.
- `post <number>` → **Post mode**. Do not re-review.
- `rollup` → **Rollup mode**. Do not re-review; work only from the sheets.
- anything else (a PR number, a branch, or nothing) → **Review mode**.

## Review mode

Do the following, in order:

1. **Get the diff.** If given a PR number, run `gh pr diff <number>`. If given
   a branch, run `git diff main...<branch>`. Otherwise review
   `git diff main...HEAD`. Read the whole diff before writing anything. If you
   cannot obtain it, say so and stop — do not review from memory, from the
   PR description, or from a file you have not opened in this session.

   If there's no argument and `git diff main...HEAD` is empty (for example,
   you're on `main`), there's nothing local to review. Don't review anything.
   Say so, list the open PRs with
   `gh pr list --repo OWNER/REPO --state open --limit 20`, and ask which
   number to review.

   Confirm which repo and branch you actually got. If an `upstream` remote
   exists, `gh` prefers it over `origin`, so a bare number may resolve to the
   wrong repo. Numbers differ between a fork and its upstream. State the repo
   and head branch you reviewed, and pass `--repo OWNER/REPO` from here on.

   Record the head you reviewed — post mode anchors comments to it:

   ```
   gh pr view <number> --repo OWNER/REPO --json title,body,headRefName,headRefOid,additions,deletions,changedFiles,closingIssuesReferences
   ```

   To read the changed files as they are on the branch, fetch the head into a
   ref that belongs to this PR. That leaves the working tree alone, and it
   doesn't collide with parallel reviews the way `FETCH_HEAD` would:
   `git fetch <remote> +refs/pull/<number>/head:refs/pr-review/<number>`, then
   `git show refs/pr-review/<number>:<path>`. In batch mode the ref is
   already fetched; don't fetch again.

2. **Gather the context a reviewer on this team would have.** Most confidently
   wrong review comments come from missing context, so look before you judge:

   - The PR description and any linked issue.
   - **The linked issue's triage verdict.** For each issue in
     `closingIssuesReferences`, read `.claude-notes/triage-<issue>.md` if it
     exists and note its **final verdict** (`AUTOMATE`, `SEMI-AUTOMATE` or
     `HUMAN-REQUIRED`; sheets from triage 1.0.0 call it just "Verdict") and
     its reproduction status. No sheet, or no linked issue, means **untriaged**. The
     automation verdict (see "The verdict") can't be less cautious than this.
   - Repo docs that record decisions: `README.md`, `PLAN.md`, `CLAUDE.md`,
     `CONTRIBUTING.md`, whichever exist. Skim — don't read the whole repo.
     **Always read the "Maintenance automation policy" section of `CLAUDE.md`**:
     its sensitive-area list drives the automation verdict.
   - Other open PRs touching the same files:
     `gh pr list --repo OWNER/REPO --state open --limit 200 --json number,title,files`.
     Some bugs only appear when two PRs merge together. Don't list every
     overlap (most UI PRs in this repo touch `src/main.js`, `src/style.css`
     or `index.html`). Name at most five whose titles suggest they touch the
     same behaviour, and say why.

   Whatever you needed and could not find goes in the sheet's "Context I didn't
   have" section, phrased as questions for the human. Do not guess the answer
   and then write a comment that depends on the guess.

3. **Analyse.** Work through the four lenses below. They feed the comments;
   in the terminal, keep each to a few lines.

   - **Summary.** Three sentences: what this PR changes, what it's trying to
     achieve, and what it deliberately does not touch.
   - **Assumptions.** The assumptions this code makes about the rest of the
     system, and what would break if each turned out to be wrong.
   - **Untested behaviours.** The behaviours this PR introduces or changes, and
     for each, whether a test would fail if it regressed. Open the test file
     and read the assertions — a test file existing is not coverage.
   - **A second angle.** Re-read the diff as someone the change actually has
     consequences for, and say which one you picked. Weekend on-call for
     anything that runs in production; a new starter for anything that changes
     setup, docs, or an idiom others will copy; a security lead for anything
     touching credentials, personal data, or dependencies. If one persona
     yields nothing, that is a finding about the change, not a reason to skip.

   **Keep the effort proportional.** Running code or writing a probe is worth it
   when a finding depends on runtime behaviour. A docs, config, or copy change
   doesn't need a test run. Token cost is one of the things being measured.

   **Never switch branches in the main checkout.** If you need to run the
   branch's code, use a throwaway worktree:
   `git worktree add --detach .claude-notes/wt/<number> refs/pr-review/<number>`.
   Remove it when you're done with `git worktree remove --force .claude-notes/wt/<number>`.
   Don't start servers on fixed ports, because another review may be running
   in parallel.

   **Running the tests (this repo has no CI).** A local test run stands in for
   "CI is green", and the automation verdict needs one for any behavioural
   change. Run the whole suite from the worktree: `npm test --prefix <worktree>`.
   It takes seconds and needs no `npm ci`, because the tests use only Node's
   built-in runner. Record the pass/fail counts from the summary lines; that
   becomes the `Tests:` field. A docs/copy-only change doesn't need a run, so
   record `not needed (non-behavioural)`.

   The tests cover `src/logic/` and the word lists only. A change to
   `src/main.js`, `src/style.css` or `index.html` is **not** covered by a green
   run. Say so in `Tests:`, and name the manual check from section 5 of
   `docs/spec-current.md` that would cover it.

4. **Draft candidate comments** following "Writing the comments" below.

5. **Try to refute every candidate before keeping it.** Re-open the code at
   the anchor. Check whether the concern is already handled somewhere else — a
   caller, a guard, a CSS rule, a test, a doc. If you refute it, drop it. If
   you can't settle it, keep it at low confidence, phrased as a question.
   Every surviving comment should hold up if the author pushes back.

6. **Group the survivors by fix.** Give every comment a `type` and a fix
   `group`, following "Types and fix groups" below. For each group, decide
   where the fix lives: in this PR, in code already on `main`, or in another
   PR. Also make a rough guess at the effort. Comments that one change would
   resolve share a group, and that fix is described once in the sheet.

7. **Write the triage sheet** to `.claude-notes/review-<number>.md` in the
   format below. Check the path is ignored with `git check-ignore -v <path>`
   first, and pick another ignored path if it is not. If the sheet already
   exists, overwrite it. This is a re-run, and the old decisions refer to
   comments that no longer exist.

   Then copy the sheet, unchanged, to
   `.claude-notes/snapshots/review-<number>-<sha7>-<depth>.md`. Create the
   folder if it doesn't exist, and overwrite a file with the same name. Nobody
   edits snapshots. Post mode restores from them if the sheet is later
   overwritten by a stale copy, for example an editor tab that still had an
   older version open and saved it.

8. **Log the run** in the tracking log (see "Tracking log").

9. **Verdict.** The last thing in your output, after every other section, on
   every review that got past step 1. Format is fixed — see "The verdict".

## Writing the comments

Each comment is one issue that the human can accept or reject on its own.
Don't combine two findings in one comment, and don't split one finding into
two.

**Severity** — pick one, and let it drive the verdict:

- `blocking` — should change the code or the merge decision before this merges.
- `worth-fixing` — real, but fine to merge now and fix in a follow-up.
- `nit` — style, naming, taste. Would not block on its own.

**Confidence** — and say how you know, in the `evidence` line:

- `high` — you ran it, reproduced it, or read the assertion that proves it.
- `medium` — you read the code path and reasoned about it, but did not run it.
- `low` — it depends on intent or context you don't have.

**Match the tone to the confidence.** This is the rule most easily broken:

- `high`: state it plainly and show the evidence (the output, the failing input).
- `medium`: say it's your reading of the code — "As far as I can tell…",
  "I think this…" — and give the reasoning so the author can check it.
- `low`: ask it as a question — "Is it intentional that…?", "Was there a
  reason to…?" Never an instruction.
- Never write "must", "always", "clearly", or "obviously" unless you
  verified it.

**Posted bodies open with a label** so the PR author can triage too:
`**issue:**`, `**suggestion:**`, `**question:**`, or `**nit:**`.

**Keep nits from crowding out the real issues:**

- Order fix groups by their most severe comment, `blocking` → `worth-fixing`
  → `nit`. Within a group, order by severity, then confidence. Comments stay
  next to the others in their group.
- Draft **at most three nits**. Anything past three goes on one line under
  "Not drafted", not as comments.
- If you have more nits than substantive comments, stop and check whether you
  missed the substantive issues.

**Anchors.** An inline comment must land on a line that's in the diff. That
means an added line or a context line inside a hunk, on the new-file side. Take
the line number from the hunk header (`@@ -a,b +c,d @@`: the first line after
it is new-file line `c`; count down and skip `-` lines). Cross-check it with
`git grep -n '<text>' refs/pr-review/<number> -- <path>`. If the line isn't in the diff, or
the comment is about the PR as a whole, mark it `general`. General comments are
folded into the review body when posted.

**Each body stands on its own.** Someone reading it on GitHub cannot see this
sheet. Inline comments sit next to their line and don't need to repeat it.
General comments restate the `file:line` they're about.

### Types and fix groups

These tags are what the rollup aggregates across PRs. Keep them consistent,
because a tag that's spelt differently in two sheets won't cluster.

**Type** — exactly one per comment, from this fixed list:

| Type | Use for |
|------|---------|
| `security` | injection/XSS, auth, secrets, unsafe input handling, risky dependencies |
| `data-integrity` | lost, duplicated, or corrupted data; transactions; migrations; clocks and timezones |
| `correctness` | logic bugs, wrong output, broken edge cases |
| `integration` | merge conflicts, interactions with other PRs, merge-order dependencies |
| `test-gap` | missing or ineffective assertions; tests that can't fail |
| `accessibility` | keyboard, screen reader, contrast, reduced motion |
| `performance` | needless work, N+1 queries, unbounded growth |
| `ux` | confusing or inconsistent behaviour a user would notice |
| `maintainability` | duplication, naming, dead code, idioms others will copy |
| `docs` | README, comments, API docs out of step with the code |

If nothing fits, pick the closest one and say why in `evidence`. Don't invent
new types. Changing the list is a skill edit, not a review-time decision.

**Fix group** — one per comment. The name of the *root cause and its fix*,
not the symptom:

- Use a kebab-case slug with no PR number, one someone else would reuse.
  For example, `normalize-stats-on-load` or `score-repeated-letters-once`,
  not `stats-bug` or `pr100-issue`.
- **Reuse before you invent.** Before naming a new group, list the existing
  slugs with `grep -h "^- group:" .claude-notes/review-*.md`. If one of them
  is the same root cause — meaning the same change would fix both, not just
  the same type — reuse it exactly. This is what lets the rollup see one fix
  spanning five PRs.
- Comments share a group only if a single change resolves all of them. "Both
  are XSS" isn't enough if they need two separate fixes.
- A group with one comment is normal. Don't force comments together.

**Lives in** — for each group, where the fix has to be made:

- `this PR`: code the PR adds or changes.
- `main`: code that's already on main, which this PR copies, calls, or
  exposes. This is the signal the team lead most needs, because one fix to
  main may clear the same comment across many PRs.
- `PR #<n>`: the fix belongs in another open PR.

**Effort** — `S` (under an hour, local change), `M` (a few hours, or touches
tests), or `L` (design change, or spans several files or PRs). It's a guess,
and the sheet should present it as one.

### Triage sheet format

Write exactly this shape. Everything outside a comment body stays local and
is never posted.

````markdown
# Triage — PR #<n>: <title>

Repo: OWNER/REPO · Head: <branch> @ <sha7> · Depth: <full | scan> · Verdict: <MERGE AS IS | NEEDS YOUR ATTENTION> · Automation: <AUTOMATE | SEMI-AUTOMATE | HUMAN-REQUIRED>
Issue: <#n triaged <verdict> | untriaged | none> · Sensitive areas: <list from CLAUDE.md policy, or none> · Tests: <npm test: passed/failed counts | not run: reason | not needed (non-behavioural)>
Types: <types present, most severe first> · Fix groups: <g> (<g-main> live in main)

For each comment, fill in `decision:` with keep, reword, or bin. For reword,
edit the body in place. You can add a reason after reword or bin: wrong,
context, nit, tone, or dup. You can also correct a comment's `type` or
`group`; the rollup uses whatever is in the file. Add anything the AI missed
under "Added by reviewer". Then run `/pr-review post <n>`.

## Review body

<2–3 sentences for the top of the GitHub review: what the PR does and the
overall take. Posted as-is unless you edit it.>

## Fix groups

| Group | Fix (one line) | Comments | Highest | Type | Lives in | Effort |
|-------|----------------|----------|---------|------|----------|--------|
| `normalize-stats-on-load` | Run saved stats through `normalizeStats` so an old format isn't wiped | C1, C3 | blocking | data-integrity | this PR | S |
| `reduced-motion-guard` | Add a `prefers-reduced-motion` block for the row animation | C2 | worth-fixing | accessibility | this PR | S |

## Comments

### C1 · blocking · high · data-integrity
- anchor: `src/storage.js:30`
- group: `normalize-stats-on-load`
- evidence: <how you know — command run, output seen, assertion read>
- decision:

**issue:** <body, exactly as it would be posted>

### C3 · worth-fixing · medium · test-gap
- anchor: general
- group: `normalize-stats-on-load`
- evidence: …
- decision:

**suggestion:** …

## Not drafted

<Extra nits past the cap, one line each. "None" if none.>

## Context I didn't have

<Questions for the human. Decisions made elsewhere, intent, related PRs. "None" if none.>

## Added by reviewer

<!-- Your own findings, in the same format (anchor + body; decision is implicitly keep).
     type and group are optional; the rollup infers them if they're missing.
     Each one counts as "AI missed" in the tracking log. -->
````

A comment body runs from the line after `decision:` to the next heading. Keep
comment IDs stable in the order you drafted them. Grouping changes where a
comment appears, not what it's called.

## The verdict

Before writing it, run:

```
gh pr view <number> --repo OWNER/REPO --json mergeable,mergeStateStatus,isDraft,author,baseRefName
```

The verdict has two parts, and both are recommendations to the human, not
decisions. They run the commands; you never run them unless asked in that turn.

1. **Review verdict:** `MERGE AS IS` (the loop's "APPROVE") or
   `NEEDS YOUR ATTENTION`. It's about what the review found.
2. **Automation verdict:** `AUTOMATE`, `SEMI-AUTOMATE` or `HUMAN-REQUIRED`,
   as defined in the "Maintenance automation policy" in `CLAUDE.md`. It's
   about how much human judgement this change needs before it merges.

### Deciding the automation verdict

Work down this list and stop at the first rule that applies:

1. **`HUMAN-REQUIRED`** if any of these hold:
   - the PR's base branch isn't `main` (check `baseRefName`; PRs in this repo
     target `main`, and anything else needs a human to say why);
   - the review verdict is `NEEDS YOUR ATTENTION`;
   - the diff touches a sensitive area from the policy (name it);
   - the linked issue was triaged `HUMAN-REQUIRED`;
   - the change is behavioural and tests weren't run or failed;
   - the PR changes behaviour beyond what its issue asked for.
2. **`SEMI-AUTOMATE`** if any of these hold:
   - the linked issue is untriaged, or was triaged `SEMI-AUTOMATE`;
   - the change is a minor bug or small feature rather than a trivial fix;
   - new tests were added but you haven't confirmed they fail against the
     old code.
3. **`AUTOMATE`** only if every `AUTOMATE` condition in the policy holds, and
   the linked issue was triaged `AUTOMATE`.

**Never less cautious than triage.** If your reading of the diff says
`AUTOMATE` but the issue was triaged `SEMI-AUTOMATE`, the verdict is
`SEMI-AUTOMATE`. If you think the *triage* was wrong (too cautious or too
confident), say so in one line. Disagreement between the two verdicts is a
harm signal the team tracks, so don't hide it by quietly matching.

Emit exactly one of the three forms below.

### Form A — nothing blocks, automation verdict `AUTOMATE`

```
**MERGE AS IS** · **AUTOMATE** — <one clause on why nothing blocks and why no human judgement is needed>
**Area:** <paths or subsystems touched, e.g. `src/logic/hint.js` only>
**Issue:** <#n, triaged AUTOMATE>
**Tests:** <npm test: passed/failed counts | not needed (non-behavioural)>
**Comments:** <k> drafted (<b> blocking, <w> worth-fixing, <n> nit) in <g> fix group(s) → .claude-notes/review-<number>.md

Triage the sheet, then: /pr-review post <number>
gh pr merge <number> --repo OWNER/REPO --squash --delete-branch
```

### Form S — nothing blocks, automation verdict `SEMI-AUTOMATE`

```
**MERGE AS IS** · **SEMI-AUTOMATE** — <one clause on why nothing blocks> · Read before merging: <the one or two things a human should check in the diff>
**Area:** <paths or subsystems touched>
**Issue:** <#n triaged <verdict> | untriaged>
**Tests:** <npm test: passed/failed counts>
**Comments:** <k> drafted (<b> blocking, <w> worth-fixing, <n> nit) in <g> fix group(s) → .claude-notes/review-<number>.md

Triage the sheet and read the diff, then: /pr-review post <number>
After reading the diff: gh pr merge <number> --repo OWNER/REPO --squash --delete-branch
```

### Form B — findings or sensitive change, automation verdict `HUMAN-REQUIRED`

```
**NEEDS YOUR ATTENTION** · **HUMAN-REQUIRED** — <n> reason(s): <shortest possible list: blocking findings, sensitive area, triage verdict, tests>
**Area:** <paths or subsystems, one per finding where they differ>
**Issue:** <#n triaged <verdict> | untriaged | none>
**Tests:** <npm test: passed/failed counts | not run: reason>
**Comments:** <k> drafted (<b> blocking, <w> worth-fixing, <n> nit) in <g> fix group(s) → .claude-notes/review-<number>.md

Triage the sheet, then: /pr-review post <number>
```

If the review found nothing blocking but the automation verdict is still
`HUMAN-REQUIRED` (for example, a clean diff in a sensitive area), use Form B
anyway. Put `MERGE AS IS` in place of `NEEDS YOUR ATTENTION` on its first
line, and give the sensitive area as the reason. It still omits the merge
command.

Rules that make the verdict trustworthy:

- **Form B omits the merge command.** Never print `gh pr merge` alongside
  findings or a `HUMAN-REQUIRED` verdict, even commented out. The easiest
  thing to paste must never be the thing that skips the review.
- **The gate is materiality, not silence.** The review verdict is
  `NEEDS YOUR ATTENTION` if and only if at least one comment is `blocking`,
  or the PR isn't mergeable. `worth-fixing` comments and nits are fine under
  `MERGE AS IS`. A verdict that says "attention" for every PR carries no
  signal. The same goes for automation: `HUMAN-REQUIRED` needs a named reason
  from the list above, not a vague unease.
- **No local test run, no merge line** for a behavioural change. With no CI,
  a recorded `npm test` run is the only evidence the change works.
- **Not mergeable is Form B**, whatever the diff looks like. If
  `mergeStateStatus` is `DIRTY`/`BLOCKED`/`BEHIND`, or `isDraft` is true, say
  so as the first finding — `gh pr merge` would fail anyway.

## Batch mode

`/pr-review batch 97 98 100` or `/pr-review batch all` reviews several PRs,
one reviewer agent per PR, and then writes a report. The report covers
priorities across PRs and the token cost of each review. **Nothing is posted,
approved, merged, or pushed.** You coordinate; the reviewer agents review.

### Depth: full or `--scan`

- **Full** (the default) is the complete Review mode for every PR. Use it for
  a handful of PRs, or for PRs the scan flagged.
- **`--scan`** is a cheap first pass that maps priorities across many PRs.
  Scan reviewers run on the `sonnet` model and change Review mode as
  follows:
  - Read the diff, the PR description, and only the test files the diff
    touches.
  - Skip step 2's docs and open-PR list. Rollup works out overlaps from the
    `files` field instead.
  - Never run code, create worktrees, or write probes. That means no comment
    can be `high` confidence.
  - Draft at most 5 comments, and no nits. Nits don't change priority.
  - Write `Depth: scan` in the sheet header. Full reviews write
    `Depth: full`.

  A scan is a map, not a review. Its findings are good enough to rank, but
  not to post without a full review of that PR first.

### Selectors: pick PRs from the last report

Instead of numbers, a batch can select PRs from the latest rollup. The
typical flow is to scan everything, then give the flagged PRs a full review:

| Selector | Selects PRs that have… | Source |
|----------|------------------------|--------|
| `priority P1` (or `P1 P2`, `P1-P3`) | any fix group ranked at those priorities | Fix plan in `priorities.md` |
| `type security` (any type from the fixed list) | any non-binned comment of that type | the sheets' comment headings |
| `group <slug>` | any comment in that fix group | Fix plan in `priorities.md` |

- Selectors combine with AND. For example, `batch priority P1 P2 type
  security` picks P1 or P2 PRs that also have a security comment.
- Matching is case-insensitive.
- If a type or slug doesn't exist, list the valid ones and stop. Don't guess
  what was meant.
- A selector batch defaults to **full** depth, because that's what it's for.
  `--scan` still works.

How to resolve selectors:

1. **Make sure the report is current.** If `.claude-notes/priorities.md`
   doesn't exist, or any sheet is newer than it, run Rollup mode first. It's
   local and cheap, and it picks up triage decisions made since the last
   rollup.
2. **Leave out PRs that are merged or closed.** Rollup already lists them
   under "Resolved or dropped".
3. **Show what the selector matched** before anything else, for example:
   `priority P1 → 7 PRs: #12 #40 #77 …`, with each PR's matching groups. The
   budget gate and the skip rule then apply as normal. A PR that already has
   a full sheet at its current head is skipped.

### Steps

1. **Resolve the list.**
   - If numbers are given, use those.
   - If it's `all`, use every open PR:
     `gh pr list --repo OWNER/REPO --state open --limit 300 --json number,title,headRefOid`.
   - If selectors are given, resolve them as described above.
   - Skip any PR that already has a sheet at the PR's current head, if that
     sheet is as deep as the one requested or deeper. Re-reviewing unchanged
     code spends tokens for nothing. A full batch does re-review a PR that
     only has a scan sheet, and overwrites that sheet. Name the ones you
     skipped. To force a re-review of one PR, the human can delete its sheet.

2. **Budget gate.** If more than 5 PRs remain, stop before starting any
   reviewer. Say how many PRs there are, at which depth, and give a cost
   estimate:
   - If an earlier batch report at the same depth exists in
     `.claude-notes/batch-*.md`, use its average tokens per PR to estimate the
     total.
   - If not, say there's no estimate yet.
   - If this is a full batch of more than 10 PRs, suggest `--scan` first.

   Then ask the human to confirm or narrow the list. Don't continue until
   they answer in this turn. Reviewing all open PRs is a large spend.

3. **Fetch every head once, up front,** in as few commands as possible:
   `git fetch <remote> +refs/pull/<a>/head:refs/pr-review/<a> +refs/pull/<b>/head:refs/pr-review/<b> …`.
   Reviewers read from these refs and never fetch themselves. Parallel
   fetches fight over git's lock files.

4. **Run one reviewer per PR** with the Agent tool, setting
   `run_in_background: true`. For `--scan`, also set `model: "sonnet"`. Keep
   at most 4 running at once, and start the next one as each finishes.
   Record the start time with `date` first. Give each reviewer this prompt:

   > Read `.claude/skills/pr-review/SKILL.md` and follow **Review mode** for
   > PR #<n> in OWNER/REPO, at depth `<full | scan>` (for scan, apply the
   > `--scan` rules under Batch mode). Batch rules apply:
   > - The head is already fetched at `refs/pr-review/<n>`. Read from there and don't fetch.
   > - Don't write the tracking log.
   > - Don't touch the main checkout or switch branches. Use a throwaway worktree if you need to run code.
   > - Never post, approve, merge, or push.
   >
   > End your reply with exactly one line:
   > `RESULT #<n> | verdict=<A|S|B> | automation=<AUTOMATE|SEMI-AUTOMATE|HUMAN-REQUIRED> | comments=<k> | blocking=<b> | groups=<g> | sheet=<path>`
   > or `RESULT #<n> | failed=<reason>`.

5. **Record each reviewer as it finishes.**
   - From its completion notification, take the token figure Claude Code
     reports for that agent (`subagent_tokens` in the usage block), its tool
     uses, and its duration.
   - If the notification has no usage figure, record `?`. Never estimate
     tokens.
   - Append its tracking-log row with Tokens filled in.
   - A failed reviewer is recorded as failed, and the batch carries on.

6. **When all reviewers are done, run Rollup mode** over every sheet, not
   only this batch's. That rewrites `.claude-notes/priorities.md`.

7. **Write the batch report** to `.claude-notes/batch-<YYYY-MM-DD-HHMM>.md`.
   It's dated and never overwritten, so each batch keeps its own report.
   Use the format below.

8. **Print a short summary:** the report path, the PR count, total and
   average tokens, and the P1 groups with their status. For a scan, end with
   the rollup's "Deep-review next" command. For a full batch, end with
   "Nothing was posted — triage the sheets, then `/pr-review post <n>` per PR."

### Batch report format

````markdown
# Batch review — <date time>

<N> PRs reviewed at depth <full | scan> · <F> failed · <S> skipped (already reviewed at this head) · nothing posted
Reviewer tokens: <total> total · <avg> per PR · wall time <duration> · model <model>

## Cost per PR

| PR | Title | Shape | Tokens | Tool uses | Time | Comments | Blocking | Groups | Verdict | Tokens/comment |
|----|-------|-------|--------|-----------|------|----------|----------|--------|---------|----------------|

These are the per-reviewer token counts Claude Code reported. They leave out
the coordinating session's own overhead. For the all-in number, compare
`/usage` before and after the batch.

## Priorities

<The full rollup content: Fix plan, Fix once, Merge order, By type, By PR,
Triage next, in the priorities format. Everything is unconfirmed until
triaged.>

## Failed or skipped

<PR, reason. "None" if none.>
````

## Post mode

`/pr-review post <number>` — turn the human's triage into a GitHub review.
Don't re-review, and don't change any wording the human wrote.

1. **Read `.claude-notes/review-<number>.md` and check it's the latest review.**
   Compare it with the best snapshot for this PR in `.claude-notes/snapshots/`
   (`review-<number>-<sha7>-<depth>.md`). A snapshot at the PR's current head
   beats one at an older head, and at the same head `full` beats `scan`. The
   sheet has been overwritten by a stale copy if it's shallower than that
   snapshot (it says `Depth: scan` while a `full` snapshot exists) or if it's
   at an older head. When that happens, don't stop and don't ask the human.
   Recover it:
   - Copy the current sheet to
     `.claude-notes/snapshots/review-<number>-overwritten-<YYYYMMDD-HHMM>.md`.
   - Copy the snapshot over the sheet.
   - Carry over each `decision:` from the overwritten copy whose comment
     has the same heading line (ID, severity, confidence, type) and the same
     `group:` in the snapshot. Leave the others blank.
   - Say in one line what you restored and from where. Tell the human to
     close any editor tab on the sheet without saving, or it may overwrite
     the sheet again.

   If the sheet is missing and there's no snapshot, or it's stale and there's
   no snapshot, look for the reviewer's transcript under
   `~/.claude/projects/<project>/<session>/subagents/`. It holds the `Write`
   call that created the sheet, so recover the sheet from there the same way.
   Only if neither source exists, say so and stop.

   Then, if any `decision:` is blank or isn't keep, reword, or bin, list those
   comments and stop. Never guess a decision.

   If the sheet says `Depth: scan`, stop and say so. A scan never ran the
   code or gathered context. Offer `/pr-review <number>` for a full review
   first, and post the scan only if the human confirms in this turn.

2. **Collect what gets posted.** That's `keep` and `reword` comments plus
   everything under "Added by reviewer", using the bodies as they are in the
   file now. Binned comments are never posted. If a comment has a
   `- fixed: <sha7> on <branch>` line (added by `pr-fix`), append
   `_Fixed in <sha7>._` as the last line of its body, so the author can see
   it's already been handled.

3. **Check the anchors still hold.** Run
   `gh pr view <number> --repo OWNER/REPO --json headRefOid`. If the head has
   moved since the sheet's SHA, say so. The comments still post against the
   reviewed commit, but GitHub may show them as outdated. An inline anchor
   that isn't in the diff gets folded into the review body with its
   `file:line`, and you say which ones you moved.

4. **Pick the event.** Use `COMMENT`, unless all four of these are true: the
   PR isn't self-authored (compare `author` with `gh api user -q .login`),
   the sheet's verdict was MERGE AS IS, its automation verdict isn't
   `HUMAN-REQUIRED`, and no posted comment is `blocking`. Then `APPROVE` is
   allowed. GitHub rejects `APPROVE` and
   `REQUEST_CHANGES` on your own PR. The human can change the event in the
   JSON before running the command.

5. **Build the review body.** Start with the sheet's "Review body" text.
   For each fix group with two or more posted comments, append one line:
   `**Related:** the comments on <file:line>, <file:line> share one fix — <fix line from the Fix groups table>.`
   The PR author then fixes the root cause once instead of patching each
   comment separately. Then add the general comments, each restating its
   `file:line`. These lines are additions; don't edit what the human wrote.

6. **Write `.claude-notes/review-<number>.json`** with your file-writing tool
   (never with `echo` or a heredoc):

   ```json
   {
     "commit_id": "<full head SHA from the sheet>",
     "event": "COMMENT",
     "body": "<review body from step 5>",
     "comments": [
       { "path": "src/storage.js", "line": 30, "side": "RIGHT", "body": "<comment body>" }
     ]
   }
   ```

7. **Update the tracking log row** for this PR (see "Tracking log").

8. **Post it.** Typing `/pr-review post <number>` is the human's instruction
   to publish this PR's review. Don't ask for confirmation, and don't hand
   them a command to paste.

   - First make sure it isn't already posted, so a re-run can't post a
     duplicate. List the PR's reviews with
     `gh api repos/OWNER/REPO/pulls/<number>/reviews`. If one from the
     current user (`gh api user -q .login`) is already on the same
     `commit_id` and its body starts with the same first line as this
     review's body, don't post again. Give its URL and stop.
   - Otherwise, run:

     ```
     gh api repos/OWNER/REPO/pulls/<number>/reviews --method POST --input .claude-notes/review-<number>.json
     ```

   - Confirm it landed. Report the review's `html_url`, its `state`, and how
     many inline comments GitHub now shows. Get the count from
     `gh api repos/OWNER/REPO/pulls/<number>/comments`.
   - If the call fails, show the error. Also give the line above so the
     human can rerun it after fixing the cause. That command runs
     unchanged in pwsh and bash.

   If nothing survived triage and nothing was added, don't post. Say so.

   Posting never extends to merging. If the sheet's verdict was MERGE AS IS
   and its automation verdict is `AUTOMATE` or `SEMI-AUTOMATE`, print the
   `gh pr merge` line for the human to run. For `SEMI-AUTOMATE`, prefix it
   with "after reading the diff". If the verdict was NEEDS YOUR ATTENTION but
   the human binned every `blocking` comment, and the automation verdict isn't
   `HUMAN-REQUIRED` for another reason (a sensitive area, triage, or tests),
   you may print it too, labelled "your triage binned every blocking finding".
   Otherwise, no merge line. Never run it yourself unless asked in that
   turn.

## Rollup mode

`/pr-review rollup` gives the team lead's view: which fixes to make first,
across every PR reviewed so far. It works only from the triage sheets. It
posts nothing and changes no code. It writes one file and prints a summary.

1. **Collect the sheets.** Take every `.claude-notes/review-<digits>.md` whose
   first line starts with `# Triage — PR #`. Skip anything else, such as the
   tracking log or older prose review notes, and name the files you skipped.
   If there are no sheets, say so and stop.

2. **Check where each PR stands now.** Take the repo from the sheets'
   `Repo:` lines and run:
   `gh pr list --repo OWNER/REPO --state all --limit 300 --json number,title,state,headRefOid,files`.
   - If a PR is merged or closed, its issues are no longer open work. List
     them under "Resolved or dropped" and don't rank them.
   - If a PR's head has moved since its sheet's SHA, mark the sheet `stale`,
     because it may describe code that has since changed.

3. **Build the issue list.** Make one entry per comment: PR, ID, severity,
   confidence, type, group, lives in, and decision.
   - `bin` comments are out. They were wrong or not worth saying.
   - Comments with a `- fixed:` line have already been fixed on their branch
     by `pr-fix`. List them under "Resolved or dropped" as "fixed, pending
     merge", and don't rank them.
   - `keep`, `reword`, and "Added by reviewer" entries are **confirmed**.
   - A blank decision means **untriaged**, which is an AI claim no human has
     checked yet. Untriaged comments are ranked too, so a fresh batch still
     produces a plan. But a group counts as `confirmed` only if at least one
     of its comments is confirmed; otherwise it's `unconfirmed`. Show the
     status in every row. An unconfirmed P1 means "verify this first", not
     "fix this first".
   - If a human-added entry has no type or group, assign one and mark it
     `(inferred)`.

4. **Cluster by fix group.** Comments with the same slug form one cluster.
   Then look for clusters with the same root cause under different slugs,
   since slugs drift between runs. Merge two clusters only after reading both
   comment bodies and confirming that one change fixes both. Never merge them
   because their slugs or types look alike. List every merge with its reason
   so the human can undo it.

5. **Rank with this fixed rule.** Go down the table and use the first row
   that matches:

   | Priority | Rule |
   |----------|------|
   | P1 | any `blocking` comment of type `security` or `data-integrity`, or a `blocking` group spanning 2+ PRs |
   | P2 | any other `blocking` group |
   | P3 | `worth-fixing`, spanning 2+ PRs or living in `main` |
   | P4 | any other `worth-fixing` group |
   | —  | nit-only groups: counted in "By type", not ranked |

   Within a tier, put groups affecting more PRs first, then lower effort,
   then higher confidence. The rule is fixed so that rankings compare across
   runs. If you think it ranks a group wrongly, keep the rule's rank and add a
   one-line note saying why. The fix for a bad rule is to edit this table.

6. **Find the "fix once, unblock many" candidates.** These are clusters that
   live in `main`, or that span two or more PRs with the same fix. They're
   usually best fixed in one change, either to `main` or to the PR that
   should merge first, with the affected PRs rebased afterwards, rather than
   each author patching it separately. For each one, list:
   - the reviewed PRs it clears, and how many comments that is;
   - open PRs that haven't been reviewed but touch the same file (from the
     `files` field in step 2). Give up to five numbers plus a count, labelled
     "possibly affected — unverified". Never call them issues, because no one
     has read them.

7. **Find merge-order constraints.** Use the `integration` comments and the
   sheets' "Context I didn't have" sections to work out which PRs must merge
   before others and which conflict. Write each one as `#a before #b —
   reason`, and say so if the constraints form a cycle. Leave the section
   empty rather than guess.

8. **Write `.claude-notes/priorities.md`** in the format below. Overwrite it,
   because it's regenerated on every run.

9. **Print a short summary:** the headline numbers, the P1 groups with their
   status, the biggest fix-once candidate, how many sheets need triage, and
   the file path. Don't print merge or post commands. Those come from per-PR verdicts,
   not from the rollup.

### Priorities format

````markdown
# Review priorities — <date>

<N> PRs reviewed · <G> fix groups (<Gc> confirmed, <Gu> unconfirmed) · <U> untriaged comments · <S> stale sheets
Priority comes from a fixed rule in the pr-review skill. It's a proposal for the team lead, not a decision.
Unconfirmed means the AI's claim hasn't been checked by a human. Verify those before acting on them.

## Fix plan

| # | Pri | Status | Fix group | Fix | Type | Highest | PRs | Comments | Lives in | Effort |
|---|-----|--------|-----------|-----|------|---------|-----|----------|----------|--------|
| 1 | P1 | unconfirmed | `<slug>` | <one line> | <type> | blocking | #<a> #<b> | <k> | main | S |

## Fix once, unblock many

- `<slug>` — fix in <main | #n> once, then rebase #<a>, #<b>. Clears <k> comments.
  Possibly affected, unverified: #<c> #<d> (+<more>).

## Merge order

- #<a> before #<b> — <reason, with the sheet comment it came from>

## By type

| Type | blocking | worth-fixing | nit |
|------|----------|--------------|-----|

## By PR

| PR | Title | Depth | Verdict | Automation | Confirmed blocking | Groups | Sheet |
|----|-------|-------|---------|------------|--------------------|--------|-------|

## Deep-review next

<PRs whose sheet is only `Depth: scan` and that contain a P1 or P2 group,
most urgent first. End with the one command that reviews them properly:
`/pr-review batch priority P1 P2`, followed by the PR numbers it currently
expands to. If the P1 list alone is already large, also give
`/pr-review batch priority P1` as a smaller first step. "None" if none.>

## Triage next

<Sheets that still have untriaged comments. Order them by the highest
priority they contain, give each one's path, and list its unconfirmed P1 and P2
groups. "None" if none.>

## Merged groups

<`slug-a` + `slug-b` → `slug-a`: reason. "None" if none.>

## Resolved or dropped

<Issues whose PR is now merged or closed. "None" if none.>
````

## Tracking log

Keep one running table at `.claude-notes/review-log.md`, one row per review
run. Create the file with this header if it doesn't exist:

```markdown
| Date | PR | Skill | Shape | Tokens | AI comments | Kept | Reworded | Binned | AI missed | Failure modes |
|------|----|-------|-------|--------|-------------|------|----------|--------|-----------|---------------|
```

- **Review mode appends a row.** Fill in these columns:
  - **Date:** today.
  - **PR:** `#<n>`.
  - **Skill:** `git log -1 --format=%h -- .claude/skills/pr-review/SKILL.md`,
    with a `*` suffix if that file has uncommitted edits. This lets runs
    before and after a skill edit be compared.
  - **Shape:** files changed, `+adds/−dels`, and the area, e.g. `4 files +73/−3 frontend`.
  - **AI comments:** the drafted count.
  - **Tokens:** `?`.

  Leave the rest blank. A re-run after editing the skill gets its own row;
  don't overwrite the old one.
- **Batch mode appends the rows itself,** one per PR, with Tokens filled in
  from each reviewer's reported usage. Reviewer agents never write the log,
  because parallel writes to one file lose rows.
- **Post mode fills in the latest row for that PR.** Fill in these columns:
  - **Kept**, **Reworded**, **Binned:** counts of each decision.
  - **AI missed:** the number of "Added by reviewer" entries.
  - **Failure modes:** a tally of the reasons given, e.g. `wrong×1 context×2 nit×1`.

  Then remind the human that the Tokens column is theirs to fill in (see
  below).
- **Tokens:** you cannot see your own token usage, so never estimate it. It
  comes from the human. The cleanest measurement is one PR per session:
  `/clear`, run the review, then `/usage` for the session's token count. A
  post run in the same session adds to it, which is fine because it's part of
  the same review.

## Never

- **Never make the automation verdict less cautious than triage,** and never
  call a change `AUTOMATE` because the diff is short. Size isn't safety; a
  one-line change to rounding or a permission check is `HUMAN-REQUIRED`.
- **Never skip the verdict, and never invent one.** Every completed review
  ends in Form A, Form S or Form B. The one exception is step 1: if you could not
  obtain the diff, emit no verdict at all and say why. A verdict on a diff you
  did not read is the worst output this skill can produce.
- **Never soften a finding to reach Form A, and never inflate a nit to reach
  Form B.** Both destroy the signal, in opposite directions. Say what you
  found, then let the severity decide the label.
- **Never sound more certain than your evidence.** A polished, plausible,
  wrong comment is worse than no comment: the human has to spend time
  disproving it, and the author may just comply. When you're unsure, ask a
  question.
- **Never let the verdict outrank the findings.** It is a recommendation and a
  set of commands to save typing. The human merges, not you — so Form A is a
  claim about what you found, never a guarantee that shipping is safe.
- **Never post, approve, or merge yourself** unless the human asks in that
  turn. Posting a review and merging are outward-facing and hard to undo.
  `/pr-review post <number>` is that ask, but only for posting that one
  PR's review. It never covers merging. Review, batch, and rollup modes
  never post.
- **Never pad the review.** One invented finding costs more than one missed
  finding, because it teaches the reader to discount everything else you said.
  Zero comments is a valid outcome.
- **Never let the rollup create findings.** It clusters and ranks what's
  in the sheets. An unreviewed PR that probably has the same bug is
  "possibly affected — unverified", never an issue.
- **Never claim test coverage you have not read.** If a behaviour has no
  assertion that would fail when it regresses, say so plainly.
- **Never assume green means correct.** A suite that passes against the
  unfixed code proves nothing about the fix.
- **Never emit a heredoc or an inline `--body "..."`.** Agents run in the dev
  container (bash), but commands you print for the human may be pasted into
  pwsh on the host. Bodies go through files, written with your file-writing
  tool, so the same command works in both shells.

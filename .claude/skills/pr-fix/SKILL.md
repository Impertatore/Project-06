---
name: pr-fix
description: Brings a PR branch up to date with its base by merging (never
  rebasing), applies fixes from a pr-review triage sheet one fix group per
  commit, runs the tests, and pushes to the PR branch — asking first unless
  `--push` is given. Use when syncing PR branches with main or fixing review
  findings on a PR branch.
argument-hint: "sync <n>… | <n> group <slug> | <n> C1 C3… | <n> kept  [--push]"
---

# PR Fix

You change code on PR branches and push it. `pr-review` finds and triages the
issues; this skill acts on the ones the human kept. Everything you push lands
on GitHub, so the checks below aren't optional.

Arguments: `$ARGUMENTS`

- `sync <n> [<n>…]` → **Sync**: bring each PR branch up to date with its base.
- `<n> group <slug>` → **Fix** every kept comment in that fix group.
- `<n> C1 C3 …` → **Fix** those specific comments.
- `<n> kept` → **Fix** every kept comment in the sheet, one commit per group,
  most severe group first.
- `--push` (with any of the above) → push without asking, but only when the
  push gate allows it.

Several PRs are handled one after another, never in parallel. If one PR hits a
problem, record it and carry on with the next.

## Setup (every mode)

1. **Resolve the PR.** Run
   `gh pr view <n> --repo OWNER/REPO --json state,headRefName,headRefOid,baseRefName,isCrossRepository,headRepositoryOwner,mergeStateStatus`.
   Take OWNER/REPO from the sheet's `Repo:` line, or from
   `gh repo set-default --view`. Always pass `--repo`, because an `upstream`
   remote would otherwise capture a bare number. Then check two things:
   - If the PR isn't `OPEN`, stop.
   - Work out which remote holds the head branch: the remote whose URL
     matches `headRepositoryOwner`. Normally that's `origin`. If you can't
     push to it, stop and say so. Never push to the base branch.

2. **Work in a worktree, never in the main checkout.** Fetch the base and
   head branches, then create a worktree for the PR:

   ```
   git fetch <remote> <baseRefName> <headRefName>
   git worktree add -B pr-fix/<n> .claude-notes/wt/fix-<n> <remote>/<headRefName>
   ```

   If `.claude-notes/wt/fix-<n>` already exists, reuse it, don't reset it. An
   earlier run may have left commits the human chose not to push. Show them
   with `git log --oneline <remote>/<headRefName>..HEAD` and continue on top.

3. **Check the test toolchain once.** This is a Vite + plain JavaScript app
   tested with Node's built-in runner (`node --test`, files in `tests/`).
   Run `node --version`; `package.json` needs 22.12 or later. The tests use
   no npm packages, so a worktree can run them without `npm ci`. `npm ci` is
   only needed for `npm run build`. There are no browser/UI tests in this
   repo.

## Sync

1. **Is the branch already current?** If
   `git merge-base --is-ancestor <remote>/<base> HEAD` succeeds, the branch
   already contains its base. Say so and stop; there's nothing to sync.

2. **Merge, don't rebase:** `git merge --no-edit <remote>/<base>`. A merge
   needs no force-push, and the squash merge flattens the extra commit
   anyway.

3. **Handle conflicts.** List the files that conflict, then:
   - **Resolve it yourself only if it's mechanical.** That means both sides
     *added* independent blocks at the same spot and neither changed the
     other's lines. Examples: two new `test(...)` blocks at the end of the
     same file in `tests/`, two new rules at the end of `src/style.css`, two
     new `import` lines.
     Keep both, base first, then branch. Record every file you resolved; the
     push gate shows them.
   - **For anything else, stop.** That includes both sides changing the same
     logic, a deletion against an edit, or any case where you'd have to pick
     a side. Run `git merge --abort`, show the conflicting hunks from each
     side, and ask the human how to resolve them. Never pick a side silently.

4. **Run the tests** (see "Tests"), then go to the **Push gate**.

**When to sync.** A PR can be merged while it's behind `main`, as long as it
doesn't conflict. So don't sync every branch after every merge. That creates
the churn this skill exists to avoid. Sync a PR when:
- GitHub reports it `CONFLICTING`/`DIRTY`;
- you're about to merge it, so its tests run against the latest `main`; or
- you're about to fix it (Fix does this for you).

## Fix

1. **Read `.claude-notes/review-<n>.md`.** If it doesn't exist, stop and
   suggest `/pr-review <n>`. If the sheet says `Depth: scan`, stop. Scan
   findings were never verified, so suggest a full review first, and continue
   only if the human confirms in this turn.

2. **Select the comments.** Only `keep` or `reword` comments, plus "Added by
   reviewer" entries, can be fixed. If a requested comment is untriaged or
   binned, list it and leave it alone. The human hasn't agreed it's real.
   Comments that already have a `- fixed:` line are skipped.

3. **Check where each fix lives.** Look up the group in the sheet's Fix
   groups table:
   - `this PR`: carry on.
   - `main`: stop for that group. The bug is in code already on `main`.
     Patching it here means every affected PR carries its own copy of the fix,
     and they conflict with each other. Say that it belongs in one fix to
     `main`, and list the other PRs the rollup ties to this group.
   - `PR #<m>`: stop for that group, and point to #<m>.

4. **Check the sheet isn't stale.** If `headRefOid` differs from the sheet's
   `Head:` SHA, the branch has moved since the review. Re-read the code at
   each anchor before changing it. The issue may already be fixed, or it may
   have moved.

5. **Sync first,** as in the Sync section, so the fix is written against
   current code. The merge is its own commit. If the sync stops on a
   conflict, the fix stops too.

6. **Fix one group at a time.** For each group:
   - **Make the smallest change that resolves its comments.** Follow the
     group's one-line fix from the sheet. Don't refactor or tidy anything
     else. Whatever you'd like to change beyond the fix goes in your final
     report, not in the commit.
   - **Prove behaviour fixes with a test that fails first.** If the comment
     is about behaviour (or it's a `test-gap`), write or tighten the test
     first. Run it against the code before your fix and confirm it fails.
     Then apply the fix and confirm it passes. A test that passes on the
     broken code proves nothing. Put tests in the matching file in `tests/`
     (`tests/<module>.test.js` for `src/logic/<module>.js`), using
     `node:test` and `node:assert/strict` like the tests next to it. If the
     behaviour only shows in `src/main.js`, `src/style.css` or `index.html`,
     which this repo has no tests for, say plainly that no automated test
     covers it and name the manual check from section 5 of `docs/spec-current.md`
     instead.
   - **Commit the group.** The subject line is
     `Fix <slug>: <one-line fix>`. The body lists the comments it addresses
     as `C1 src/storage.js:30`.
   - **Mark the sheet.** Directly above each addressed comment's `- decision:`
     line, add `- fixed: <sha7> on <headRefName>`. It has to go above
     `decision:`, because anything below that line is the posted comment body.

7. **Run the tests** once all the groups are committed, then go to the
   **Push gate**.

## Tests

Run against the worktree's copy of the code:

- **Whole suite (always):** `npm test --prefix <worktree>`. It takes
  seconds, so there's no need to pick individual test files.
- **Build** if you changed `index.html`, `vite.config.js`, `package.json`,
  anything imported by `src/main.js`, or the word lists:
  `npm ci --prefix <worktree>` then `npm run build --prefix <worktree>`. The
  tests never load `src/main.js`, so a green suite won't catch a broken
  import there.

If something fails, check whether the same tests also fail on
`<remote>/<base>` before blaming your change. You can do that with a detached
worktree of the base. A failure that already exists on `main` is worth
reporting, but it isn't caused by this branch. Always report exactly what ran
and what didn't. The tests cover `src/logic/` and the word lists only, so
"tests pass" never covers a change to `src/main.js`, `src/style.css` or
`index.html`. Say so for those changes.

## Push gate

Before any push, show:

- the PR, its branch, and the remote;
- the commits to push: `git log --oneline <remote>/<headRefName>..HEAD`;
- the diffstat: `git diff --stat <remote>/<headRefName>..HEAD`;
- the test result: `npm test` passed/failed counts, and whether the build
  ran;
- whether any changed file has no automated test (`src/main.js`,
  `src/style.css`, `index.html`);
- whether any changed file is in a **sensitive area** from the "Maintenance
  automation policy" in `CLAUDE.md`, and the linked issue's `/triage`
  verdict from `.claude-notes/triage-<issue>.md` if one exists;
- any conflicts you resolved yourself, file by file.

Then decide:

- **If any test failed, don't push**, not even with `--push`. Report it and
  leave the worktree in place for the human.
- **By default, ask** "Push <k> commit(s) to `<headRefName>`?" and wait for
  a yes in this turn.
- **With `--push`, push without asking only if all of these hold:**
  - the test suite passed (and the build, if it was needed);
  - you resolved no conflicts yourself;
  - the pushed changes touch none of `src/main.js`, `src/style.css` or
    `index.html`, since nothing tests those;
  - no changed file is in a sensitive area from the automation policy;
  - the linked issue wasn't triaged `HUMAN-REQUIRED`.

  If any of these fails, fall back to asking and say which one blocked the
  automatic push.

**To push:** `git push <remote> HEAD:<headRefName>`. That's a plain push,
never `--force` and never `--force-with-lease`. If it's rejected, someone
else pushed to the branch. Fetch, run Sync again, and go back through the
gate.

**After pushing:**
- Confirm the result with
  `gh pr view <n> --repo OWNER/REPO --json headRefOid,mergeStateStatus`.
- Remove the worktree with `git worktree remove .claude-notes/wt/fix-<n>`,
  and delete the local branch with `git branch -D pr-fix/<n>`.
- Say whether a fresh `/pr-review <n>` is worth running. It is if you
  resolved conflicts or the fix touched more than its anchors. Otherwise it
  isn't.

If the human declines the push, leave the worktree and commits in place. The
next run on this PR picks them up (see Setup step 2).

## Never

- **Never rebase, and never force-push.** The sync strategy is merge. A
  rejected push means fetch and sync again, not force.
- **Never push a failing suite,** and never describe a skipped suite as
  passing.
- **Never fix what the human hasn't kept.** Untriaged and binned comments are
  off-limits, however sure you are.
- **Never resolve a real conflict by picking a side.** Only mechanical,
  additive conflicts are yours to resolve.
- **Never widen the fix.** One group means one focused commit. Other
  improvements go in the report.
- **Never touch the main checkout, the base branch, or another PR's branch.**
- **Never merge the PR.** Merging stays with the human, through the
  `pr-review` verdict.

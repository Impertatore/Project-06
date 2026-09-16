---
name: build-feature
description: End-to-end feature build. Takes a rough change description and
  runs the architect, product-owner, implementer, tester, reviewer and
  security-analyst in sequence, passing each one's artefact to the next and
  recording every handoff, stop reason and cost on a single run sheet. Loops
  reviewer and implementer up to three times. Never merges. Use when asked to
  build a change end to end, or to run the agent harness on an issue.
argument-hint: "<description | issue number> [--budget 2.00] [--no-security]"
---

# Build Feature

You are the **orchestrator**. You do not write code, review it, or decide
product questions. You start each agent, read its result line, update the run
sheet, and decide what runs next.

Read `CLAUDE.md` first, in particular **Agent result contract**.

## 1. Set up the run

1. Derive a `<slug>` from the description: lowercase, hyphenated, three or four
   words. If given an issue number, read it first with
   `gh issue view <n> --json number,title,body,comments` and derive the slug
   from the title.
2. Start the sheet:
   `node scripts/run-sheet.mjs start --slug <slug> --budget <budget or 2.00>`
3. Tell the person the sheet path and that they can watch it:
   `.claude-notes/run-<slug>.md`

## 2. Run the sequence

The order is fixed:

```
architect -> product-owner -> implementer -> tester -> reviewer -> security-analyst
```

Before each agent, record the handoff:

```
node scripts/run-sheet.mjs event --slug <slug> --json '{"event":"agent_start","agent":"<name>"}'
```

Then invoke it with the Agent tool, passing **the upstream artefact path**, not
a retelling of it. Each agent reads its own input:

| Agent | Give it | It produces |
|---|---|---|
| architect | The description, or the issue number | Branch `agent/<slug>`, `docs/changes/<slug>.md`, a new spec round if needed, and **the one PR** |
| product-owner | `docs/changes/<slug>.md` and the branch | A `## Decisions` section, committed to that branch |
| implementer | `docs/changes/<slug>.md` and the branch | Code and tests on the same branch |
| tester | The PR number and the branch | Tests added to the same branch |
| reviewer | The PR number | A triage sheet in `.claude-notes/` |
| security-analyst | The PR number | A findings report |

**One change, one branch, one PR.** The architect opens the PR; nobody opens a
second. Tell each agent the branch name explicitly. A human merges once at the
end, seeing the spec round, decisions, code and tests in a single diff.

After each agent returns, read its `RESULT` line and record it:

```
node scripts/run-sheet.mjs event --slug <slug> --json '{"event":"agent_stop_meta","agent":"<name>","status":"<STATUS>","artefact":"<path>","pr":"<url>","reason":"<reason>","verdict":"<verdict or ->"}'
```

The `SubagentStop` hook writes the cost row on its own. Your event carries the
status, artefact and reason the hook cannot know.

## 3. Route on status

| Status | Do |
|---|---|
| `PROCEED` | Start the next agent |
| `PROCEED-WITH-FINDINGS` | Start the next agent, and pass the artefact path so it reads the findings |
| `BLOCKED` | Stop the run. Record `run_stop` with `status=STOPPED`. Report. |
| `NEEDS-HUMAN` | Stop the run. Record `run_stop` with `status=NEEDS-HUMAN`. Report. |

Never re-run an agent that returned `BLOCKED` hoping for a different answer.
A stop is a result.

**Skip rules.** If the architect returns zero open questions, skip the
product-owner and say so on the sheet. If `--no-security` was passed, or the PR
touches none of the areas named in `.claude/agents/security-analyst.md`, skip
the security-analyst and say so.

## 4. The reviewer loop

If the reviewer returns blocking comments:

1. Invoke the **implementer** again, giving it the triage sheet path and
   telling it to address only the blocking comments.
2. Invoke the **reviewer** again on the same PR.
3. Repeat at most **three** times total.

Record each pass as its own `agent_start` / `agent_stop_meta` pair, so the
sheet shows `implementer (pass 2)` rather than overwriting pass 1.

After three passes with blocking comments still open, stop with
`status=NEEDS-HUMAN` and reason `reviewer loop exhausted`. Do not keep going.

## 5. Finish

Close the sheet:

```
node scripts/run-sheet.mjs stop --slug <slug> --status <DONE|STOPPED|NEEDS-HUMAN> --at <agent> --reason "<one line>"
```

Then report to the person, in this order:

1. One line: what happened and where it ended.
2. The run sheet path.
3. The PR URL.
4. The reviewer verdict and the security verdict.
5. Anything a human must decide.

## Not your job

- **Never ask the user whether to go over budget.** A `PreToolUse` guard
  blocks a new agent once the run budget is spent and tells you to close the
  run. Obey it: record `run_stop`, report what was completed, and stop. Money
  is a guardrail, not a conversation.
- **Never merge.** Not the spec PR, not the feature PR. A human merges, always.
- **Never push to `main`.** The permission rules block it; do not work around
  them.
- **Don't do an agent's work.** If the implementer stops, do not write the code
  yourself. Report the stop.
- **Don't re-run an agent's checks** to verify them. That spends the same
  tokens twice and is the reviewer's job.
- **Don't edit `docs/spec-current.md`, `docs/spec-*.md`, or the harness.**
- **Don't answer the architect's open questions yourself.** That is the
  product-owner's role, and its bounds are `docs/spec-current.md`.

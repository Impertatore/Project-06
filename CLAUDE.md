# Wordle Practice

A browser Wordle game built with Vite and plain JavaScript, from
[docs/spec-6.md](docs/spec-6.md). See [README.md](README.md) for the layout.

## Commands

| Task | Command |
|---|---|
| Install | `npm ci` |
| Tests | `npm test` (Node's built-in runner, `tests/*.test.js`) |
| One test file | `node --test tests/<name>.test.js` |
| Build | `npm run build` |
| Dev server | `npm run dev` (add `?answer=CRANE` to fix the answer) |

- `src/logic/` is pure, browser-free logic and is what `tests/` covers.
- `src/main.js`, `src/style.css` and `index.html` (UI, focus, themes,
  animations) have **no automated tests**. Changes there need the manual checks
  in section 5 of `docs/spec-6.md`.
- There is no CI. A local `npm test` run is the only evidence a change works.

## Conventions

- `docs/spec-N.md` rounds and `docs/spec-history.md` are a record. Never
  overwrite an earlier round; add a new one.
- Agents work on a branch and open a PR to `main`. A human merges. Never push
  to `main`.
- Agent scratch output (triage sheets, review sheets, worktrees) goes in
  `.claude-notes/`, which is git-ignored.
- Agents run in the dev container (bash). The host shell is pwsh. Pass long
  text to `gh` through files (`--body-file`), not inline or via heredocs.

## Maintenance automation policy

Used by `/triage`, `/pr-review` and `/pr-fix`. A verdict says how much human
judgement a change needs before it merges. **Merging is always done by a
human**; `AUTOMATE` means "a skim is enough", not "merge without looking".

### Verdicts

- **`AUTOMATE`**: a skim is enough. Allowed only when **every** one of these
  holds:
  1. The change is a `trivial fix`: one clear correct answer, in one place.
  2. It touches no sensitive area below, except in a non-behavioural way.
  3. `npm test` passes on the branch.
  4. A test would fail if the change regressed, or the change is
     non-behavioural.
  5. It changes nothing beyond what the issue asked for.
  6. No file in `src/main.js`, `src/style.css` or `index.html` changes
     behaviour (nothing tests them).
- **`SEMI-AUTOMATE`**: an agent can make the change, and a human reads the
  diff before merging. Minor bugs, small features, UI changes with a named
  manual check, dependency bumps.
- **`HUMAN-REQUIRED`**: a human decides the change, not only reviews it.
  Any behavioural change in a sensitive area, anything ambiguous, anything
  security-shaped.

### Sensitive areas

| Area | Paths | Why |
|---|---|---|
| Saved player data | `src/storage.js`, `normalizeStats` / `emptyStats` in `src/logic/stats.js` | A format change can wipe or corrupt players' statistics and settings in local storage. There is no migration. |
| Scoring rules | `src/logic/score.js`, `src/logic/hardMode.js` | Wrong colours for repeated letters or wrong hard-mode checks break the game, and are easy to get subtly wrong. |
| Share text | `src/logic/share.js` | Must never reveal letters of the answer. |
| Word lists and licence | `src/words/`, `scripts/build-word-lists.mjs`, `public/scowl-copyright.txt`, the `legal` comments setting in `vite.config.js` | The SCOWL licence requires its notice in all copies. Changing the lists changes every game. |
| Dependencies | `package.json`, `package-lock.json` | Supply chain. Anything added runs on developer machines and in the build. |
| The harness | `.devcontainer/`, `.claude/`, `CLAUDE.md`, `.github/` | Agents must not change their own permissions, instructions or triggers without a human decision. |

### Non-behavioural exemption

Comments, docs (other than earlier spec rounds) and test-only changes are
non-behavioural. Inside a sensitive file they are at most `SEMI-AUTOMATE`.
Text shown to players (messages, help text, share text) **is** behaviour.

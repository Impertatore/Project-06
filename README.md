# Wordle Practice

A Wordle game that runs in a desktop browser. Built from [docs/spec-6.md](docs/spec-6.md).

- 6 rows to find a hidden 5-letter word, with a new random answer every game.
- 2 hints per game. A hint fills your next row with a word that keeps your green letters in place, uses your yellow ones, and always finds something new.
- Statistics and settings are kept in the browser's local storage.
- Hard mode, dark mode, high contrast, sharing, help, and full keyboard and screen reader support.

## Run it

Needs Node.js 22.12 or later (current LTS recommended). The only dependency is Vite.

```
npm install
npm run dev       # start the app, then open the address it prints
npm test          # automated tests (Node's built-in test runner)
npm run build     # production build in dist/
npm run preview   # serve the production build
```

The app needs no internet connection once installed. Supported browsers: current desktop Chrome, Firefox and Edge.

## Developing in the dev container

`.devcontainer/devcontainer.json` builds on `mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm`, so Node 22 is already there, and adds the GitHub CLI (`gh`) and Claude Code as features along with the `anthropic.claude-code` VS Code extension. Its `postCreateCommand` runs `npm ci`, so dependencies are installed when the container is created.

Two environment variables must be set **on the host** before the container starts: `CAPYBARA_GH_TOKEN` and `CAPYBARA_ANTHROPIC_KEY`. The container maps them to `GH_TOKEN` and `ANTHROPIC_API_KEY` through `remoteEnv`. Keep the values on the host only, never in the repository. Without `CAPYBARA_GH_TOKEN`, `gh auth setup-git` prints a warning during create and `gh` is not authenticated.

Agents work on a branch and open a pull request to `main` for a human to merge. They never push to `main`.

## Testing aid

With `npm run dev` only, add `?answer=CRANE` to the address to fix the answer for every new game (for example `http://localhost:5173/?answer=CRANE`). This lets the spec's manual steps run with a known answer. It has no effect in the built app.

## Project layout

| Path | What it holds |
|---|---|
| `index.html` | Page structure: header, board, keyboard and panels |
| `src/main.js` | UI: rendering, input, panels, focus and announcements |
| `src/style.css` | Light, dark and high contrast themes, animations |
| `src/storage.js` | Local storage for statistics, settings and the game in progress |
| `src/logic/` | Pure game logic, no browser code: scoring, game rules, hints, hard mode, statistics, share text |
| `src/words/` | Generated word lists, and [SOURCE.md](src/words/SOURCE.md) with their source and licence |
| `scripts/build-word-lists.mjs` | Regenerates the word lists from a SCOWL release |
| `tests/` | Automated tests for `src/logic/` and the word lists |
| `public/scowl-copyright.txt` | SCOWL copyright notice, shipped with the build |

## Word lists

2,063 answers and 11,184 accepted guesses, generated from [SCOWL](http://wordlist.aspell.net/) (not the New York Times lists). See [src/words/SOURCE.md](src/words/SOURCE.md) for how they were made and the licence.

## Manual checks

The acceptance criteria are in section 5 of [docs/spec-6.md](docs/spec-6.md). Most are manual steps to run in Chrome, Firefox and Edge.

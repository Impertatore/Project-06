#!/usr/bin/env node
// PreToolUse guard on Bash.
//
// Agents work in worktrees under .claude-notes/wt/. The main checkout is the
// human's, and it must stay on the branch they left it on. An agent that runs
// `git checkout <branch>` there moves the human's working folder underneath
// them, which is how a run once left this repo sitting on an agent branch.
//
// Denies branch switching only when the command is running in the main
// checkout. Inside a linked worktree the same command is fine, because that is
// the agent's own copy. Restoring files (`git checkout -- <path>`) is always
// allowed: it changes no branch.
//
// Exit 2 blocks the call and sends the message on stderr back to the model.

import { execSync } from 'node:child_process'

let raw = ''
process.stdin.on('data', (d) => (raw += d))
process.stdin.on('end', () => {
  let h = {}
  try {
    h = JSON.parse(raw)
  } catch {
    process.exit(0)
  }

  const cmd = (h.tool_input && h.tool_input.command) || ''
  if (!cmd) process.exit(0)

  // Only branch-changing forms. `git checkout -- path` restores files.
  const switches = /\bgit\s+(checkout|switch)\b/.test(cmd)
  const restoresFiles = /\bgit\s+checkout\s+(--\s|.*\s--\s)/.test(cmd)
  if (!switches || restoresFiles) process.exit(0)

  // A linked worktree's git dir lives under <main>/.git/worktrees/<name>.
  let gitDir = ''
  try {
    gitDir = execSync('git rev-parse --git-dir', {
      cwd: h.cwd || process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    process.exit(0) // not a repo; nothing to protect
  }
  if (gitDir.includes('worktrees')) process.exit(0)

  process.stderr.write(
    'Blocked: this is the main checkout, which belongs to the human and must ' +
    'stay on their branch. Do not run git checkout or git switch here.\n\n' +
    'Work in a worktree instead:\n' +
    '  git worktree add .claude-notes/wt/<slug> <existing-branch>\n' +
    '  git worktree add -b <new-branch> .claude-notes/wt/<slug> origin/main\n\n' +
    'Then run every git command from that directory. To read a file from ' +
    'another branch without switching, use: git show <branch>:<path>\n'
  )
  process.exit(2)
})

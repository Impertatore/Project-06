#!/usr/bin/env node
// Run sheet for the agent harness.
//
// The record is an append-only JSONL file; the .md sheet is regenerated from it
// in full each time, so a partial write can never corrupt the view.
//
//   node scripts/run-sheet.mjs start  --slug <slug> [--budget 5.00]
//   node scripts/run-sheet.mjs event  --slug <slug> --json '{"event":"..."}'
//   node scripts/run-sheet.mjs stop   --slug <slug> --status DONE --reason "..."
//   node scripts/run-sheet.mjs render --slug <slug>
//   node scripts/run-sheet.mjs hook                     # hook JSON on stdin
//
// Cost note: agents run sequentially, so an agent's spend is the growth in
// sidechain usage since the previous agent stopped. If the harness is ever
// parallelised this attribution stops being correct.

import fs from 'node:fs'
import path from 'node:path'

const NOTES = '.claude-notes'

// $ per million tokens. Cache read is 0.1x input, 5-minute cache write 1.25x.
const PRICES = {
  'claude-opus-5': { in: 5.0, out: 25.0 },
  'claude-sonnet-5': { in: 2.0, out: 10.0 },
  'claude-haiku-4-5': { in: 1.0, out: 5.0 },
}

function priceFor(model) {
  const key = Object.keys(PRICES).find((k) => (model || '').startsWith(k))
  return PRICES[key] || PRICES['claude-opus-5']
}

function costOf(u, model) {
  const p = priceFor(model)
  const dollars =
    (u.in || 0) * p.in +
    (u.out || 0) * p.out +
    (u.cache_r || 0) * p.in * 0.1 +
    (u.cache_w || 0) * p.in * 1.25
  return dollars / 1e6
}

function paths(slug) {
  return {
    log: path.join(NOTES, 'run-' + slug + '.jsonl'),
    sheet: path.join(NOTES, 'run-' + slug + '.md'),
    state: path.join(NOTES, '.run-' + slug + '.state.json'),
  }
}

function append(slug, obj) {
  fs.mkdirSync(NOTES, { recursive: true })
  const line = JSON.stringify(Object.assign({ ts: new Date().toISOString() }, obj))
  fs.appendFileSync(paths(slug).log, line + '\n')
}

function readLog(slug) {
  const f = paths(slug).log
  if (!fs.existsSync(f)) return []
  const out = []
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!line) continue
    try {
      out.push(JSON.parse(line))
    } catch {
      // A torn final line is possible if a write was interrupted. Skip it.
    }
  }
  return out
}

// Cumulative token usage across every subagent (sidechain) message so far.
function sidechainUsage(transcript) {
  const totals = {}
  if (!transcript || !fs.existsSync(transcript)) return totals
  for (const line of fs.readFileSync(transcript, 'utf8').split('\n')) {
    if (!line || line.indexOf('"isSidechain":true') === -1) continue
    let e
    try {
      e = JSON.parse(line)
    } catch {
      continue
    }
    const u = e && e.message && e.message.usage
    if (!e.isSidechain || !u) continue
    const m = e.message.model || 'unknown'
    if (!totals[m]) totals[m] = { in: 0, out: 0, cache_r: 0, cache_w: 0 }
    const t = totals[m]
    t.in += u.input_tokens || 0
    t.out += u.output_tokens || 0
    t.cache_r += u.cache_read_input_tokens || 0
    t.cache_w += u.cache_creation_input_tokens || 0
  }
  return totals
}

// Every usage record in a file, regardless of sidechain flag. Used when the
// hook is handed a subagent's own transcript, where the whole file is that
// one agent's spend.
function totalUsage(transcript) {
  const totals = {}
  if (!transcript || !fs.existsSync(transcript)) return totals
  for (const line of fs.readFileSync(transcript, 'utf8').split('\n')) {
    if (!line || line.indexOf('"usage"') === -1) continue
    let e
    try {
      e = JSON.parse(line)
    } catch {
      continue
    }
    const u = e && e.message && e.message.usage
    if (!u) continue
    const m = e.message.model || 'unknown'
    if (!totals[m]) totals[m] = { in: 0, out: 0, cache_r: 0, cache_w: 0 }
    const t = totals[m]
    t.in += u.input_tokens || 0
    t.out += u.output_tokens || 0
    t.cache_r += u.cache_read_input_tokens || 0
    t.cache_w += u.cache_creation_input_tokens || 0
  }
  return totals
}

// A turn is one assistant message. Counting them tells you whether an agent is
// near its maxTurns cap, which is the signal that it is thrashing.
function countTurns(transcript) {
  if (!transcript || !fs.existsSync(transcript)) return null
  let n = 0
  for (const line of fs.readFileSync(transcript, 'utf8').split('\n')) {
    if (!line || line.indexOf('"role":"assistant"') === -1) continue
    try {
      const e = JSON.parse(line)
      if (e && e.message && e.message.role === 'assistant') n++
    } catch {
      continue
    }
  }
  return n
}

// What the run has cost so far, from the rows already recorded.
function spentSoFar(slug) {
  return readLog(slug)
    .filter((e) => e.event === 'agent_stop')
    .reduce((sum, e) => sum + (e.cost_usd || 0), 0)
}

function budgetOf(slug) {
  const start = readLog(slug).find((e) => e.event === 'run_start')
  return start && start.budget_usd ? start.budget_usd : null
}

function diffUsage(now, before) {
  const out = {}
  for (const m of Object.keys(now)) {
    const b = before[m] || {}
    const t = now[m]
    const d = {
      in: t.in - (b.in || 0),
      out: t.out - (b.out || 0),
      cache_r: t.cache_r - (b.cache_r || 0),
      cache_w: t.cache_w - (b.cache_w || 0),
    }
    if (d.in || d.out || d.cache_r || d.cache_w) out[m] = d
  }
  return out
}

function money(n) {
  return '$' + n.toFixed(2)
}

function tok(n) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
}

function render(slug) {
  const log = readLog(slug)
  const start = log.find((e) => e.event === 'run_start')
  const stop = log.find((e) => e.event === 'run_stop')
  // Cost rows come from the SubagentStop hook; status/artefact/reason come from
  // the orchestrator. Merge them per agent, matching the Nth stop of an agent
  // with the Nth meta for that same agent so a second reviewer pass gets its
  // own row rather than overwriting the first.
  const metas = log.filter((e) => e.event === 'agent_stop_meta')
  const seen = {}
  const stops = log
    .filter((e) => e.event === 'agent_stop')
    .map((e) => {
      const n = (seen[e.agent] = (seen[e.agent] || 0) + 1)
      const m = metas.filter((x) => x.agent === e.agent)[n - 1] || {}
      return Object.assign({}, m, e, {
        status: m.status || e.status,
        artefact: m.artefact || e.artefact,
        reason: m.reason || e.reason,
        verdict: m.verdict,
        pass: n,
      })
    })

  // A meta with no cost row (hook did not fire) still deserves a row.
  const orphanSeen = {}
  for (const m of metas) {
    const n = (orphanSeen[m.agent] = (orphanSeen[m.agent] || 0) + 1)
    if (!stops.some((s) => s.agent === m.agent && s.pass === n)) {
      stops.push(Object.assign({ tokens: {}, cost_usd: 0, pass: n }, m))
    }
  }

  // An agent the runner announced but never actually invoked - the usual cause
  // is the run being stopped between the handoff and the call. Show it rather
  // than leaving a silent gap in the sequence.
  const startCount = {}
  for (const e of log.filter((x) => x.event === 'agent_start')) {
    startCount[e.agent] = (startCount[e.agent] || 0) + 1
  }
  for (const agent of Object.keys(startCount)) {
    const done = stops.filter((s) => s.agent === agent).length
    for (let i = done; i < startCount[agent]; i++) {
      stops.push({
        agent,
        pass: i + 1,
        status: 'NOT RUN',
        tokens: {},
        cost_usd: 0,
        reason: 'handoff recorded, agent never invoked',
      })
    }
  }

  let total = 0
  let tokens = 0
  for (const e of stops) {
    total += e.cost_usd || 0
    const t = e.tokens || {}
    tokens += (t.in || 0) + (t.out || 0) + (t.cache_r || 0) + (t.cache_w || 0)
  }

  const running = log
    .filter((e) => e.event === 'agent_start')
    .map((e) => e.agent)
    .filter((a) => !stops.some((s) => s.agent === a))

  const status = stop ? stop.status : running.length ? 'RUNNING' : 'IDLE'
  const inFlight = stop ? [] : running
  const budget = start ? start.budget_usd : null
  const started = start ? new Date(start.ts) : null
  const ended = stop ? new Date(stop.ts) : new Date()
  const mins = started ? Math.round((ended - started) / 60000) : 0

  const L = []
  L.push('# Run: ' + slug, '')
  L.push('| | |', '|---|---|')
  L.push('| **Status** | ' + status + (inFlight.length ? ' (' + inFlight.join(', ') + ')' : '') + ' |')
  if (stop) L.push('| **Stopped at** | ' + (stop.at || '-') + ' — ' + (stop.reason || '-') + ' |')
  L.push('| **Cost** | ' + money(total) + (budget ? ' of ' + money(budget) + ' budget' : '') + ' |')
  L.push('| **Tokens** | ' + tok(tokens) + ' |')
  L.push('| **Elapsed** | ' + mins + 'm |')
  L.push('')

  L.push('## Handoffs', '')
  L.push('| # | Agent | Status | Verdict | Artefact | PR | Turns | Tokens | Cost | Reason |')
  L.push('|---|---|---|---|---|---|---|---|---|---|')
  stops.forEach((e, i) => {
    const t = e.tokens || {}
    const n = (t.in || 0) + (t.out || 0) + (t.cache_r || 0) + (t.cache_w || 0)
    L.push(
      '| ' + (i + 1) +
      ' | ' + e.agent + (e.pass > 1 ? ' (pass ' + e.pass + ')' : '') +
      ' | ' + (e.status || '-') +
      ' | ' + (e.verdict || '-') +
      ' | ' + (e.artefact || '-') +
      ' | ' + (e.pr && e.pr !== '-' ? '[#' + String(e.pr).split('/').pop() + '](' + e.pr + ')' : '-') +
      ' | ' + (e.turns == null ? '-' : e.turns) +
      ' | ' + tok(n) +
      ' | ' + money(e.cost_usd || 0) +
      ' | ' + (e.reason || '-') + ' |'
    )
  })
  if (!stops.length) L.push('| — | _nothing yet_ | | | | | | | | |')
  L.push('')

  const notes = log.filter((e) => ['budget_warn', 'budget_stop', 'note'].includes(e.event))
  if (notes.length) {
    L.push('## Notes', '')
    for (const e of notes) {
      L.push('- `' + e.ts + '` **' + e.event + '** — ' + (e.reason || e.message || e.text || ''))
    }
    L.push('')
  }

  L.push('<sub>Generated from run-' + slug + '.jsonl. Do not edit — regenerated on every event.</sub>')
  fs.mkdirSync(NOTES, { recursive: true })
  fs.writeFileSync(paths(slug).sheet, L.join('\n') + '\n')
  return paths(slug).sheet
}

// --- CLI -------------------------------------------------------------------
const argv = process.argv.slice(2)
const cmd = argv[0]

function flag(name, def) {
  const i = argv.indexOf('--' + name)
  return i >= 0 ? argv[i + 1] : def
}

const CURRENT = path.join(NOTES, '.current-run')

// Which agent is in flight: the last agent_start with no matching agent_stop.
function openAgent(slug) {
  const log = readLog(slug)
  const stops = log.filter((e) => e.event === 'agent_stop').map((e) => e.agent)
  const starts = log.filter((e) => e.event === 'agent_start').map((e) => e.agent)
  for (let i = starts.length - 1; i >= 0; i--) {
    const seen = stops.filter((a) => a === starts[i]).length
    const startedSoFar = starts.slice(0, i + 1).filter((a) => a === starts[i]).length
    if (startedSoFar > seen) return starts[i]
  }
  return null
}

if (cmd === 'start') {
  const slug = flag('slug')
  fs.mkdirSync(NOTES, { recursive: true })
  fs.writeFileSync(CURRENT, slug)
  append(slug, { event: 'run_start', slug, budget_usd: Number(flag('budget', '5')) })
  console.log(render(slug))
} else if (cmd === 'event') {
  const slug = flag('slug')
  append(slug, JSON.parse(flag('json')))
  console.log(render(slug))
} else if (cmd === 'stop') {
  const slug = flag('slug')
  append(slug, {
    event: 'run_stop',
    status: flag('status', 'DONE'),
    at: flag('at', '-'),
    reason: flag('reason', ''),
  })
  console.log(render(slug))
} else if (cmd === 'render') {
  console.log(render(flag('slug')))
} else if (cmd === 'usage') {
  console.log(JSON.stringify(sidechainUsage(flag('transcript')), null, 2))
} else if (cmd === 'hook') {
  // Hook payload arrives on stdin. The slug comes from the marker file the
  // runner wrote at start, so nothing has to be passed through the environment.
  const slug =
    process.env.HARNESS_RUN_SLUG ||
    (fs.existsSync(CURRENT) ? fs.readFileSync(CURRENT, 'utf8').trim() : '')
  if (!slug) process.exit(0)
  let raw = ''
  process.stdin.on('data', (d) => (raw += d))
  process.stdin.on('end', () => {
    let h = {}
    try {
      h = JSON.parse(raw)
    } catch {
      // A malformed payload still gets an event, just without usage.
    }
    const st = paths(slug).state
    const before = fs.existsSync(st) ? JSON.parse(fs.readFileSync(st, 'utf8')) : {}
    const now = sidechainUsage(h.transcript_path)

    // Two shapes are possible and which one we get is empirical:
    //  - the parent session transcript, where a subagent's messages are
    //    flagged isSidechain -> this agent's spend is the growth since the
    //    previous agent stopped;
    //  - the subagent's own transcript, which has no sidechain flags at all
    //    -> the whole file is this agent's spend.
    let delta
    let attribution
    if (Object.keys(now).length) {
      delta = diffUsage(now, before)
      attribution = 'sidechain-delta'
      fs.mkdirSync(NOTES, { recursive: true })
      fs.writeFileSync(st, JSON.stringify(now))
    } else {
      delta = totalUsage(h.transcript_path)
      attribution = 'whole-file'
    }

    let cost = 0
    const sum = { in: 0, out: 0, cache_r: 0, cache_w: 0 }
    for (const m of Object.keys(delta)) {
      cost += costOf(delta[m], m)
      for (const k of Object.keys(sum)) sum[k] += delta[m][k]
    }
    append(slug, {
      event: 'agent_stop',
      agent: process.env.HARNESS_AGENT || h.agent_type || openAgent(slug) || 'unknown',
      tokens: sum,
      cost_usd: Number(cost.toFixed(4)),
      models: Object.keys(delta).join(','),
      turns: attribution === 'whole-file' ? countTurns(h.transcript_path) : null,
      attribution,
      transcript: h.transcript_path || '-',
    })
    const budget = budgetOf(slug)
    const spent = spentSoFar(slug)
    if (budget && spent >= budget) {
      append(slug, {
        event: 'budget_stop',
        reason: 'Budget of $' + budget.toFixed(2) + ' spent ($' + spent.toFixed(2) + '). No further agent may start.',
      })
    } else if (budget && spent >= budget * 0.8) {
      append(slug, {
        event: 'budget_warn',
        reason: '$' + spent.toFixed(2) + ' of $' + budget.toFixed(2) + ' spent.',
      })
    }
    render(slug)
  })
} else if (cmd === 'guard') {
  // PreToolUse hook on the Agent tool. Denies a new agent once the run budget
  // is spent, so the orchestrator never has to ask a human about money.
  // Exit 2 blocks the call; the reason text goes back to the model.
  const slug = fs.existsSync(CURRENT) ? fs.readFileSync(CURRENT, 'utf8').trim() : ''
  if (!slug) process.exit(0)
  const budget = budgetOf(slug)
  const spent = spentSoFar(slug)
  if (!budget || spent < budget) process.exit(0)
  process.stderr.write(
    'Run budget exhausted: $' + spent.toFixed(2) + ' spent of a $' + budget.toFixed(2) +
    ' budget. Do not start another agent and do not ask the user whether to ' +
    'continue. Close the run with: node scripts/run-sheet.mjs stop --slug ' +
    slug + ' --status STOPPED --at <last agent> --reason "budget exhausted", ' +
    'then report what was completed.\n'
  )
  process.exit(2)
} else {
  console.error('usage: run-sheet.mjs start|event|stop|render|usage|hook|guard')
  process.exit(1)
}

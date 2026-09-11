---
name: spec
description: Turns a short, rough project or feature description into a written spec at docs/SPEC.md. Use it before any design or code, when you want the request pinned down, with every guess and gap made visible.
---

# Spec

Write a spec for the description you are given. Say what must be true when the work is done, not how to build it. Do not choose an architecture, file layout, framework or library.

Write `docs/SPEC.md` with these sections, in this order:

1. **Intent**: what is being built and why, in a few plain sentences. If the description says what actually matters, list those points.
2. **Non-goals**: things this work is not trying to do. Quote the description where it says so.
3. **User-visible behaviour**: what a user can see and do. Where it helps, add a table of concrete examples (input, result, outcome) that includes edge cases.
4. **Constraints**: fixed facts such as platform, tools and versions, starting state, and phases or checkpoints.
5. **Acceptance criteria**: a numbered list. Each criterion must be checkable by a command, an exit code, a text search, reading the code, or a named manual step. Avoid vague words like "clean" or "easy" unless you also say how they will be judged.
6. **Open questions**: a numbered list of everything the description leaves undecided. Group related sub-questions under one item.
7. **Out of scope**: only what the description explicitly excludes. If it excludes nothing, write "None."

Rules:

- Don't invent requirements silently. Tag anything not stated in the description with `[assumed]`. If an assumption is about how something will be checked, say so, for example `[assumed: this is how X is checked]`.
- When something can't be specified yet, write that plainly, mark any detail that depends on it as TBD, and point to the open question by number ("see Open question 3").
- Don't answer your own open questions, and don't move possible exclusions into Out of scope. Ask about them instead.
- Keep the wording plain: short sentences, one idea per bullet, no filler.
- Don't write any code or create any other files. When you're done, give a short summary: how many assumptions you made, and the open questions most likely to block the work.

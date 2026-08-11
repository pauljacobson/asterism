# Contributing

Contribution requirements live in **[AGENTS.md](AGENTS.md)** — branch and PR workflow, the
checks to run before pushing, coding standards, licensing, and a list of things that look
like bugs but are deliberate.

They are written with AI coding agents in mind, because most changes here arrive that way,
but they apply to everyone.

When Friends is upgraded, run the local drift review before reconciling any
templates or feature styles:

```sh
node scripts/check-friends-drift.mjs
```

The script locates a nearby or Studio-installed Friends plugin. Pass
`--friends=/path/to/wp-content/plugins/friends` if more than one installation is
available. Differences are review prompts rather than failures because Asterism's
retained templates intentionally diverge from Friends.

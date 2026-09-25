> **⚠️ Workspace-wide rules:** Before any file or git work, read [`../UMBRELLA-GOTCHAS.md`](../UMBRELLA-GOTCHAS.md) — the mount has known truncation, read-cache, and git-lock quirks that affect every repo here.

> **🤝 Shared agent rules:** [AGENTS.md](AGENTS.md) (sync first, shipping, verify, JOURNEY format) applies to
> every agent, including Claude. It's imported below; where this file's git lines differ, AGENTS.md wins.

@AGENTS.md

# MyGuys — Claude Instructions

## Git workflow
Follow **Shipping** in [AGENTS.md](AGENTS.md): run `npm run build` and `npm test` before every commit; a
commit to `main` is a release, so commit there only when checks pass and Jeff asked for the work to go live.
Everything else goes on a branch.
- Use a short, descriptive commit message that says what actually changed (e.g. "fix: remove tax field from employee form")
- Never leave changes sitting uncommitted (commit to a branch if it isn't cleared to ship)

## Project context
MyGuys is a timesheet/crew-board app built with React/TypeScript, Node/Express (the payroll/tax engine was removed).
- Auth: Supabase project `ufbanjchatwkheaqafsf`. App data: **Neon**.
- All public tables use RLS — authenticated users only, anon has no access
- When creating new tables, always include explicit GRANT statements

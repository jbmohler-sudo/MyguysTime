> **⚠️ Workspace-wide rules:** Before any file or git work, read [`../UMBRELLA-GOTCHAS.md`](../UMBRELLA-GOTCHAS.md) — the mount has known truncation, read-cache, and git-lock quirks that affect every repo here.

# MyGuys — Claude Instructions

## Git workflow
After making ANY code changes, always commit and push without being asked.
- Use a short, descriptive commit message that says what actually changed (e.g. "fix: remove tax field from employee form")
- Commit and push to the current branch
- Never leave changes sitting uncommitted

## Project context
MyGuys is a payroll/timesheet management app built with React/TypeScript, Node/Express, and Supabase.
- Supabase project ID: ufbanjchatwkheaqafsf
- All public tables use RLS — authenticated users only, anon has no access
- When creating new tables, always include explicit GRANT statements

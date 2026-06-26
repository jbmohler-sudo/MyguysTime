# MyGuys — JOURNEY

> The living story of this project. Read this first. Format defined by
> [`../JOURNEY_PROTOCOL.md`](../JOURNEY_PROTOCOL.md). Workspace mount quirks:
> [`../UMBRELLA-GOTCHAS.md`](../UMBRELLA-GOTCHAS.md).

## Current State

- **What it is:** payroll/timesheet management app — React/TypeScript + Node/Express + Supabase
  (project `ufbanjchatwkheaqafsf`), deployed on Vercel.
- **In progress:** crew/timesheet workflow (weekly crew board, foreman approval, solo-crew
  auto-approve, expense receipt capture).
- **Just done:** security cleanup — removed committed env secrets from git history (see Session Log).
- **Biggest open item:** ⚠️ **Rotate the leaked Neon DB password and Supabase service-role key** —
  history was scrubbed but the values were already pushed and must be considered compromised.

## The Story So Far

MyGuys started as a payroll + timesheet app. A large arc of work **stripped the tax/payroll
engine out** (tax columns dropped from DB, tax types removed from models/UI, payroll exports and
reports routes removed) — the office view is now hours + rate + notes only. On top of that, the
crew workflow was built up: weekly crew board, foreman incident notes, solo-crew auto-approval
past the foreman step, copyable invite links, and receipt-photo capture for expenses via Supabase
Storage.

## Decisions Log

| Date | Decision | Why |
|------|----------|-----|
| 2026-06-25 | Remediate leaked env secrets by **rewriting git history** (`git filter-repo`) + force-push, then rotate creds | Secrets (`.env.production.*`) had been committed and pushed; scrub limits future exposure, rotation neutralizes the leak. |
| (earlier) | Remove the tax/payroll engine entirely | App scope narrowed to timesheets/hours; tax logic was dead weight and risk. |
| (earlier) | All public tables use RLS; authenticated-only, no anon access | Security baseline for Supabase. |

## System Map

| System | File(s) | Status | Note |
|--------|---------|--------|------|
| Frontend | React/TS app | live | Office view = hours + rate + notes (no payroll surface). |
| Backend | Node/Express | live | Payroll export/report routes removed. |
| Data | Supabase `ufbanjchatwkheaqafsf` | live | RLS on all public tables; new tables need explicit GRANTs. |
| Crew workflow | weekly crew board, foreman approval | live | Solo crews (1 member) auto-approve past foreman. |
| Expenses | receipt capture | live | Camera → Supabase Storage, signed-URL viewing. |
| Secrets | `.env.*` (git-ignored) | hardened | `.env.production.*` purged from history 2026-06-25. |

## The Graveyard

- **Tax / state-payroll engine** — killed. Tax columns, `StatePayrollRule`, tax types/UI, and
  payroll exports all removed. App is timesheet-only now.
- **SMS reminder stub** — removed as unused.

## Open Questions

- None recorded yet.

## Session Log

### 2026-06-25 — Purge committed env secrets from git history
**Did:** Found `.env.production.vercel` and `.env.production.tmp` committed in history (live Neon
Postgres password + Supabase `service_role` key, plus anon keys/OIDC tokens). Sanitized both
on-disk files (values blanked, still git-ignored). Ran `git filter-repo` to remove both files from
all 136 commits across every branch; force-pushed `main` (`ee0c20b`→`a701c65`). Verified secrets
and files gone from all local and remote-tracking refs. Backup bundle saved at
`c:\Umbrella\MyGuysTime-backup-pre-filter-20260625.bundle`.
**Decided:** Scrub history now, rotate credentials next (history rewrite ≠ un-leak).
**Killed:** The two env files no longer exist anywhere in git history.
**Deferred:** **Credential rotation (Neon + Supabase) — still owed by the user, dashboard access required.**
**State after:** Repo and remote clean; on-disk env files sanitized and ignored; main at `a701c65`.
**Next:** Rotate the Neon `neondb_owner` password and roll the Supabase JWT secret; update Vercel env.

> Older sessions archived in [JOURNEY_ARCHIVE.md](JOURNEY_ARCHIVE.md).

## Hard Rules

- Never commit `.env*` files. `.env.*` is git-ignored — keep it that way.
- All public Supabase tables use RLS (authenticated-only). New tables need explicit `GRANT`s.
- After ANY code change: commit and push to the current branch without being asked.
- Before file/git work, respect the mount quirks in [`../UMBRELLA-GOTCHAS.md`](../UMBRELLA-GOTCHAS.md).

# MyGuys — JOURNEY

> The living story of this project. Read this first. Format defined by
> [`../JOURNEY_PROTOCOL.md`](../JOURNEY_PROTOCOL.md). Workspace mount quirks:
> [`../UMBRELLA-GOTCHAS.md`](../UMBRELLA-GOTCHAS.md).

## Current State

- **What it is:** payroll/timesheet management app — React/TypeScript + Node/Express + Supabase
  (project `ufbanjchatwkheaqafsf`), deployed on Vercel.
- **In progress:** credential rotation (user, tonight) and remaining audit residue (ghost payroll,
  onboarding, dead API, schema SQL).
- **Just done:** security session — signup no longer overwrites invite Auth passwords; ExpenseSubmission
  RLS + GRANTs; `.env.example` scrubbed; CORS/invite URLs no longer trust a spoofed Origin; JWTs
  only via `Authorization`.
- **Biggest open item:** ⚠️ **Rotate Neon + Supabase keys and update Vercel env** — user is doing
  this tonight. After that: delete stale GitHub branch `origin/claude/relaxed-austin-510c58`, apply
  the new RLS migration on the live DB, then the residue sweep.

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
| 2026-09-12 | Unauthenticated signup must **create** Auth users only — never `updateUserById` | Invite-created Auth accounts were takeover targets: anyone who knew the email could set a new password. |
| 2026-09-12 | Invite links and CORS use `APP_URL` / `CORS_ORIGINS`, not the request `Origin` | A spoofed Origin minted attacker-shaped invite URLs and reflected CORS. |
| 2026-06-25 | Remediate leaked env secrets by **rewriting git history** (`git filter-repo`) + force-push, then rotate creds | Secrets (`.env.production.*`) had been committed and pushed; scrub limits future exposure, rotation neutralizes the leak. |
| (earlier) | Remove the tax/payroll engine entirely | App scope narrowed to timesheets/hours; tax logic was dead weight and risk. |
| (earlier) | All public tables use RLS; authenticated-only, no anon access | Security baseline for Supabase. |

## System Map

| System | File(s) | Status | Note |
|--------|---------|--------|------|
| Frontend | React/TS app | live | Office view = hours + rate + notes (no payroll surface). |
| Backend | Node/Express | live | Payroll export/report routes removed. |
| Data | Supabase `ufbanjchatwkheaqafsf` | live | RLS + REVOKE on ExpenseSubmission added 2026-09-12; apply migration on live DB. |
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

### 2026-09-12 — Security session (signup takeover, RLS, CORS)
**Did:** Removed signup `updateUserById` recovery; reject pending-invite and existing Auth emails. Added ExpenseSubmission RLS + explicit REVOKE/GRANT. Scrubbed `.env.example`. JWT only from Bearer header. CORS and invite URLs use `APP_URL`/`CORS_ORIGINS`. Prod source maps only when uploading to Sentry.
**Decided:** Signup never resets an existing Auth password; invite acceptance remains the only password-set path for invited users.
**Killed:** Query-string JWT, reflect-any-origin CORS, real-looking password in `.env.example`.
**Deferred:** Credential rotation (user tonight). Stale GitHub branch delete. Ghost payroll / onboarding residue. Live-DB confirm of ExpenseSubmission exposure until migration is applied.
**State after:** Code-side exploitable signup bug closed; RLS migration ready to apply. Keys still live until user rotates them.
**Next:** Rotate Neon + Supabase keys, set `APP_URL`/`CORS_ORIGINS` on Vercel, apply the RLS migration, delete `claude/relaxed-austin-510c58`.

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

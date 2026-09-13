# MyGuys — JOURNEY archive

> Older Session Log entries rolled out of [JOURNEY.md](JOURNEY.md). Newest of these first.

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

# MyGuysTime — Accounts & Services

## Vercel
- **Account:** jeff-mohlers-projects (team: `team_gtjJQCEVMw13MfdgeGAGIOOO`)
- **Project:** `myguystime` (`prj_irBVGhaKgZ2J0IYZlxpv7GsLgDFO`)
- **Domains:** myguystime.com, app.myguystime.com
- **Git:** github.com/jbmohler-sudo/MyGuysTime (branch: main)

## Supabase (auth / session)

Live production Auth and session use this project (`SUPABASE_URL` / `VITE_SUPABASE_URL`). App rows are **not** stored here — see Neon.

- **Role:** Auth and session only (login, session, password reset)
- **Project ref:** `ufbanjchatwkheaqafsf`
- **URL:** https://ufbanjchatwkheaqafsf.supabase.co
- **Org / owning Google account:** unknown from this repo — this is the live production project. Do not assume BetterBody or any particular Gmail.
- **Anon key:** in env as `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY`

An older `https://pmwzgagbcfhecozjzyfa.supabase.co` URL in prior docs was leftover/stale and is **not** what production uses. Leftover free-account Supabase projects that are not `ufbanjchatwkheaqafsf` are unused.

## Neon (app database)

Production app data lives in Neon Postgres and is accessed with Prisma (`DATABASE_URL` / `DIRECT_URL`). Vercel also has `NEON_*` vars from the Neon integration. Production `DATABASE_URL` points at this Neon project — do not paste full connection strings or passwords.

- **Project ID:** `raspy-forest-23434318` (`NEON_PROJECT_ID`)
- **Region:** AWS us-east-1
- **Host:** `ep-shy-bonus-amktygqo…c-5.us-east-1.aws.neon.tech`
- **Related env:** `DATABASE_URL`, `DIRECT_URL`, `NEON_DATABASE_URL`, `NEON_POSTGRES_PRISMA_URL`, and other `NEON_*` vars on the Vercel project

## GitHub
- **Org/User:** jbmohler-sudo
- **Repo:** MyGuysTime

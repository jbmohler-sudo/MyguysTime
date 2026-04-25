# Project Knowledge Base

Last updated: 2026-04-21

## What this app is

My Guys Time is a crew timecard and payroll-prep app for small contractor teams.

Core product split:

- Truck mode: quick current-week time entry and confirmation
- Office mode: weekly review, adjustments, lock/reopen, exports, and office-only reporting

It is not:

- a full payroll filing system
- a tax compliance engine
- a project management suite

## Current live stack

- Frontend: React 18 + TypeScript + Vite
- Backend: Express + TypeScript
- ORM: Prisma
- Database: hosted Neon Postgres on Vercel
- Auth: Supabase
- Error monitoring: Sentry for React and Express
- Hosting: Vercel

## Current production status

Verified on 2026-04-21:

- production deploy is live on `app.myguystime.com`
- `GET /api/health` returns `200`
- admin login works with seeded credentials
- authenticated weekly bootstrap loads correctly
- backend Sentry verification route returned a live event id

Still unverified from this session:

- frontend Sentry verification button delivery in the browser UI
- Sentry event visibility inside the Sentry dashboard, because no live Sentry connector was available here

## Database and deployment truth

SQLite is no longer part of the supported runtime path.

Production database setup:

- Neon is connected to Vercel with a custom `NEON_` env prefix
- Prisma uses `DATABASE_URL`
- production `DATABASE_URL` was mapped to the hosted Neon Prisma URL

Important Neon env vars currently present in Vercel:

- `NEON_DATABASE_URL`
- `NEON_DATABASE_URL_UNPOOLED`
- `NEON_POSTGRES_PRISMA_URL`
- `NEON_POSTGRES_URL`
- `NEON_POSTGRES_URL_NON_POOLING`
- `NEON_POSTGRES_URL_NO_SSL`
- `NEON_POSTGRES_HOST`
- `NEON_POSTGRES_DATABASE`
- `NEON_POSTGRES_USER`
- `NEON_POSTGRES_PASSWORD`

Practical rule:

- use `DATABASE_URL` for Prisma
- use `NEON_POSTGRES_PRISMA_URL` as the source when you need to restore or remap `DATABASE_URL`

## Local/dev database workflow

For local Prisma commands, pull Vercel envs and map `DATABASE_URL` from `NEON_POSTGRES_PRISMA_URL` before running schema or seed commands.

Current Prisma-related commands:

- `npx prisma generate`
- `npx prisma db push --accept-data-loss`
- `npm run db:seed`

Current repo scripts:

- `npm run build`
- `npm test`
- `npm run db:push`
- `npm run db:seed`

Note:

- `npm test` will fail unless `DATABASE_URL` points to a valid Postgres database, because the repo no longer supports SQLite

## Important production fixes already in place

### 1. Frontend API base fix

The frontend no longer hardcodes `localhost:3001` outside local development.

Current behavior in `src/lib/api.ts`:

- use `VITE_API_BASE_URL` if set
- use `http://localhost:3001/api` only on localhost
- use `/api` on deployed hosts

### 2. Vercel API routing fix

The app uses Express behind Vercel function entry files under `api/`.

This matters because:

- `/api/health` worked before
- deeper routes like `/api/auth/login` originally fell through to Vercel 404
- explicit route-family entry files were added for auth, timesheets, exports, crews, debug, and company routes

### 3. Prisma client generation on deploy

`postinstall` now runs `prisma generate`.

This prevents Vercel builds from compiling against a stale generated Prisma client when schema fields change.

## Current feature state

Working core flows:

- sign in
- weekly crew board
- employee daily entry editing
- employee confirmation
- foreman approval
- office lock and reopen
- office adjustments
- payroll-prep estimate recalculation
- private office-only reports
- archive visibility
- CSV export and printable weekly summary

Recent reporting addition:

- YTD reporting totals are now part of the payload
- office dashboard includes a YTD reporting panel
- employee/office card surface includes a YTD summary block

Current YTD scope:

- YTD gross/payments
- reimbursements
- deductions
- estimated net

Explicitly not implemented:

- W-2 generation
- 1099 generation
- tax filing logic

## Permissions that should not regress

- Admin can access all crews, settings, exports, archive, and private reports
- Foreman can access assigned crews and create private reports
- Employee can only see and edit their own week when allowed
- Only admin can export payroll summary
- Only admin can office-lock weeks
- Reopen flow requires admin and audit note

## Sentry status

Sentry is wired on both frontend and backend.

Current production env intent:

- `SENTRY_DSN`
- `VITE_SENTRY_DSN`
- `SENTRY_ENVIRONMENT=production`
- `VITE_SENTRY_ENVIRONMENT=production`
- `SENTRY_VERIFY_ENABLED=true`
- `VITE_SENTRY_VERIFY_ENABLED=true`
- `VITE_SENTRY_BACKEND_VERIFY_ENABLED=true`

Verified from this session:

- backend verification route succeeded and returned event id `70c383ecf80b4f2c94cba1b7da2c487e`

After manual confirmation in Sentry, the verification flags should be turned back off and production redeployed.

## Best files to read first

If you need to get oriented quickly:

1. `AGENTS.md`
2. `README.md`
3. `server/index.ts`
4. `prisma/schema.prisma`
5. `src/App.tsx`
6. `src/components/AppShell.tsx`
7. `src/components/WeeklyCrewBoard.tsx`
8. `src/components/OfficeDashboard.tsx`

## Known operational caveats

- `vercel env pull` may still show `DATABASE_URL` as blank locally even when production runtime is healthy
- the real source of truth for remapping Prisma is `NEON_POSTGRES_PRISMA_URL`
- browser-side Sentry verification still needs a manual UI click path to fully confirm frontend delivery
- source map upload and release tagging are not done yet

## Recommended next steps

- confirm the backend Sentry event in Sentry
- trigger the frontend verification button as an admin and confirm the browser-side event
- disable Sentry verification flags and redeploy
- add source map upload
- add release tagging

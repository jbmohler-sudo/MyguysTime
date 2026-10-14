# MyGuys — JOURNEY

> The living story of this project. Read this first. **How to update this file:** [AGENTS.md](AGENTS.md)
> (new session entries go at the top of the Session Log, 4 max; never append at the end of the file).

## Current State

- **What it is:** timesheet/crew-board app — React/TypeScript + Node/Express. Auth is Supabase
  `ufbanjchatwkheaqafsf`. App data is Neon. Live at `app.myguystime.com` on Vercel (Hobby).
- **Live:** $12/mo company Stripe billing, checkout + webhook, Resend receipt on first paid
  period, 7-day no-card trial on new signups. Paid companies stay on `active`.
- **Marketing site live:** `/features`, `/pricing`, `/how-it-works`, `/faq`, `/construction-time-tracking`,
  `/construction-time-tracking-cost`, `/best-construction-time-tracking-apps`,
  `/guides/how-contractors-track-crew-hours`,
  `/templates/construction-timesheet-template`, `/templates/time-to-decimal-chart`, seven `/trades/:slug` pages, and
  `/vs/{paper-timesheets,quickbooks-time,spreadsheets,clockshark,connecteam,busybusy,workyard,supercrew}` — all prerendered, in the sitemap
  (29 URLs). Week one (2026-09-28–10-02) is live: construction time tracking pillar, ClockShark vs, cost hub,
  construction timesheet template, and Connecteam vs. Week two: `/vs/busybusy` (2026-10-05), `/vs/workyard` (2026-10-06),
  `/best-construction-time-tracking-apps` (2026-10-08), and `/guides/how-contractors-track-crew-hours` (2026-10-09).
  Week three: `/vs/supercrew` (2026-10-12), `/templates/time-to-decimal-chart` (2026-10-14), and a refresh of
  `/vs/quickbooks-time` (2026-10-14, same URL).
  Still not live and on hold pending Jeff's CSV confirmation: `/guides/crew-hours-quickbooks`.
  (`feat/landing-audit` has no commits since 9/13; see Open Questions.)
- **In progress:** PR #6 structure fixes is open, awaiting Jeff (drops `/demo/*` from sitemap -> 24;
  `/privacy` and `/terms` 404 after merge).
- **App live (2026-10-11/12):** office crew management on the Team page (add/rename/remove crews, crew chiefs,
  move workers), the cross-company timesheet fence, and the deep `/api` routing fix (a7b9abd). Before a7b9abd,
  every API path two or more segments below its prefix 404'd in production, so saving day hours and week
  status changes did not work on the live site.
- **Next:** Remaining week-three posts: `/guides/do-1099-subs-get-overtime`,
  `/templates/construction-daily-report-template`.
- **Biggest open item:** Jeff's call on PR #6 merge, CSV-export confirmation for the QuickBooks
  guide, and two Cursor branches (Open Questions). Optional later: Auth admin on `sb_secret_`
  (then disable legacy JWT), Neon→one Supabase DB.

## The Story So Far

MyGuys started as a payroll + timesheet app. A large arc of work **stripped the tax/payroll
engine out** (tax columns dropped from DB, tax types removed from models/UI, payroll exports and
reports routes removed) — the office view is now hours + rate + notes only. On top of that, the
crew workflow was built up: weekly crew board, foreman incident notes, solo-crew auto-approval
past the foreman step, copyable invite links, and receipt-photo capture for expenses via Supabase
Storage. September 2026 added live Stripe billing ($12/mo per company), a 7-day
no-card trial, and a Resend receipt after the first paid period. Auth stayed on
Supabase; app rows moved to Neon.

## Decisions Log

| Date | Decision | Why |
|------|----------|-----|
| 2026-09-13 | New companies get a **7-day app trial** (no card), then $12/mo Checkout | Customary try-before-pay. `trialing` + `subscriptionTrialEndsAt`; gate after the date. Receipts only on Stripe `active`. |
| 2026-09-13 | Vercel Hobby API routes need `api/<prefix>/[...path].ts` | Root `api/[...path]` only matches one extra segment (`/api/health` works; `/api/billing/checkout` 404'd). Superseded by 2026-10-12: the prefix files also match only one segment; the `vercel.json` rewrite now covers every depth. |
| 2026-09-13 | Auth **admin** still uses legacy JWT `service_role`; publishable `sb_publishable_` for anon/VITE | `sb_secret_` was rejected by Auth admin. Do not put `service_role` in `VITE_*`. |
| 2026-09-13 | App DB is Neon; Auth stays on Supabase `ufbanj…` | Wrong-project keys (`pmwzgag…`) cause Invalid API key. |
| 2026-09-12 | Unauthenticated signup must **create** Auth users only — never `updateUserById` | Invite-created Auth accounts were takeover targets: anyone who knew the email could set a new password. |
| 2026-09-12 | Invite links and CORS use `APP_URL` / `CORS_ORIGINS`, not the request `Origin` | A spoofed Origin minted attacker-shaped invite URLs and reflected CORS. |
| 2026-06-25 | Remediate leaked env secrets by **rewriting git history** (`git filter-repo`) + force-push, then rotate creds | Secrets (`.env.production.*`) had been committed and pushed; scrub limits future exposure, rotation neutralizes the leak. |
| (earlier) | Remove the tax/payroll engine entirely | App scope narrowed to timesheets/hours; tax logic was dead weight and risk. |
| (earlier) | All public tables use RLS; authenticated-only, no anon access | Security baseline for Supabase. |
| 2026-09-25 | One shipping rule across all repos: a commit to `main` is a release; commit there only when build + tests pass and Jeff asked for it to go live, otherwise branch; pricing/billing/rules/security/deletions need Jeff's OK first (AGENTS.md) | Cloud agents (Muse) couldn't see rules kept in CLAUDE.md / `../` files; the local backup pushes any commit on `main`, so "commit but don't push" rules silently shipped; 13 failed production builds on 9/13–9/23 |
| 2026-10-11 | Crew chief = foreman login. Picking a chief makes his login FOREMAN and puts him on that crew; leading no crew puts it back to EMPLOYEE; office logins never change. A worker's crew is `Employee.defaultCrewId` (CrewAssignment is seed-only). | Before this nothing in the app set `Crew.foremanId`, so invited foremen saw an empty board. One source of truth for membership. Live 2026-10-11. |
| 2026-10-11 | Moving a worker carries his open weeks (this week and later, not approved or locked) to the new crew; past weeks stay. A crew chief submits his own week and the office approves it. | The new chief should review current hours; old hours were worked under the old chief. Old tests showed a foreman approving his own week. Live 2026-10-11. |
| 2026-10-12 | `vercel.json` rewrites any `/api/:path*` that no function file matched to the root `api/[...path].ts` (the Express app) | `[...path]` files on this project match one segment only, so deep routes (day hours, week status, expenses, adjustments, crew defaults and moves, invite resend/revoke) 404'd in production. Function files still match first. Verified on production: deep routes reach Express (401 unauthenticated), old routes and both Stripe webhooks unchanged. |
| 2026-09-28 | Content-only marketing pages and sitemap may ship to `main` on a passing `npm run build` when `npm test` cannot run in this cloud environment (no local fixture DB or Supabase keys). Never point tests at real Neon or Supabase. | Jeff approved. Cloud agents have no fixture database, and the safety check blocks remote fixture mutation. |

## System Map

| System | File(s) | Status | Note |
|--------|---------|--------|------|
| Frontend | React/TS app | live | Office view = hours + rate + notes (no payroll surface). |
| Backend | Node/Express on Vercel `/api` | live | Handlers per prefix (`api/billing`, `api/stripe`, `api/auth`, …) catch one segment; the `vercel.json` `/api/:path*` rewrite sends deeper paths to root `api/[...path].ts`. |
| Auth | Supabase `ufbanjchatwkheaqafsf` | live | Publishable anon + legacy JWT `service_role` for admin. |
| Data | Neon (`neondb`) | live | Prisma + RLS. Auth is not on this DB. |
| Billing | `server/routes/billing.ts` | live | $12/mo, 7-day trial, `/billing/sync` after Checkout, webhook `/api/billing/webhook`. |
| Receipts | `server/email/subscriptionReceiptEmail.ts` | live | Resend to company admin on first paid period. |
| Crew workflow | weekly crew board, foreman approval | live | Solo crews (1 member) auto-approve past foreman. Crew management: `server/routes/crews.ts` + `CrewManagementPanel` on the Team page (live). |
| Expenses | receipt capture | live | Camera → Supabase Storage, signed-URL viewing. |
| Secrets | `.env.*` (git-ignored) | hardened | `.env.production.*` purged from history 2026-06-25. |

## The Graveyard

- **Tax / state-payroll engine** — killed. Tax columns, `StatePayrollRule`, tax types/UI, and
  payroll exports all removed. App is timesheet-only now.
- **SMS reminder stub** — removed as unused.
- **Unlock-only-via-Stripe-webhook** — killed. Checkout return now syncs from Stripe; webhook 308/404 left paid companies gated.
- **Hard paywall on first login** — superseded 2026-09-13 by the 7-day no-card trial.

## Open Questions

- After Auth admin accepts `sb_secret_`, can legacy JWT keys be disabled?
- Keep Neon + Supabase, or move app data onto one Supabase project?
- `feat/landing-audit` has no commits since 9/13 and the marketing pages shipped on `main` 9/23–24 — delete the
  branch, or is a separate landing audit still planned?
- Marketing may now state multi-crew support (crews and crew chiefs are live); content pages have avoided multi-crew
  claims until now. OK to add?
- AGENTS.md says new Vercel API prefixes need their own `api/<prefix>/[...path].ts` file. With the 2026-10-12
  rewrite that's no longer required (rule change needs Jeff's OK).
- Preview deployments crash at boot (FUNCTION_INVOCATION_FAILED on every `/api` call, even `/api/health`), so
  previews can't test the API. Set the Preview environment variables in Vercel?
- `prisma/seed.ts` doesn't reset timesheet statuses, so a run against a reused fixture DB can leak state into the next
  run (seen 2026-10-11). Reset in the seed, or always start tests from a fresh DB?
- Commit the local test stack used on 2026-10-11 (embedded Postgres via the `embedded-postgres` npm package + an
  in-memory fake of the Supabase Auth endpoints the server uses) as `npm run test:local`? It runs the full
  unmodified `npm test` with no hosted services.
- Two Cursor branches wait on Jeff: `cursor/complimentary-owner-billing-95c4` (e470e7c, 9/20 — billing access
  for the platform owner, 16 files) and `cursor/ga4-gtag-07bd` (16658cc, 9/23 — GA4 on every page). Both are ~30
  commits behind `main`: merge (after rebase + build) or drop?

## Session Log

### 2026-10-14 — QuickBooks Time comparison page refreshed (54da680)
**Did:** Refreshed existing `/vs/quickbooks-time` from the approved 2026-10-13 draft (Jeff's go-live for the content-only page). Updated the quickbooks-time config in `vs.tsx` (eyebrow, h1, answer block, pain cards, comparison table, flow, callout, 6 FAQs, closing CTA). Each person joins the crew team from his own phone; he or the foreman logs the hours. Removed "one phone per crew is enough." Prerender title `QuickBooks Time Pricing vs $12 Flat for Crews | My Guys Time`, the draft meta and OG description, self-canonical `https://www.myguystime.com/vs/quickbooks-time`. Kept the existing SoftwareApplication, Organization, WebSite, and WebPage schema; WebPage `dateModified` is 2026-10-14. No new FAQPage or breadcrumb. Sitemap stays 29 URLs; this URL's `<lastmod>` is 2026-10-14. No competitor dollar figures. `$12` reads as flat for the whole company. Left out of the page: CSV export, multiple crews, breaks, petty cash, Intuit dollar amounts, and the old Support row. `npm run build` passed. Dist HTML: one H1, canonical as above, body dollar amounts are only `$12`, and "one phone per crew" is absent.
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database (`DATABASE_URL` unset). The fixture-safety guard would refuse, and tests must not point at real Neon or Supabase.
**State after:** `/vs/quickbooks-time` refresh is on `main` (54da680). Sitemap has 29 URLs.
**Next:** Confirm the Vercel deploy is READY and https://www.myguystime.com/vs/quickbooks-time returns 200 without "one phone per crew". Remaining week-three posts: `/guides/do-1099-subs-get-overtime`, `/templates/construction-daily-report-template`.

### 2026-10-14 — Time to decimal chart template page live (85175cb)
**Did:** Published `/templates/time-to-decimal-chart` from the approved 2026-10-14 draft (Jeff's go-live for the content-only page). New `TimeToDecimalChartPage` with the minutes-to-decimal chart (60 values in prerendered HTML), reverse decimal-to-minutes table, worked week, rounding caveat with no rule or threshold, print links, soft CTA, and 5 FAQs. Each person joins the crew team from his own phone; he or the foreman logs the hours. Prerender title `Time to Decimal Chart: Minutes to Decimal Hours (Printable)`, the draft meta and OG description, self-canonical `https://www.myguystime.com/templates/time-to-decimal-chart`, plus Article (Jeff Mohler, Founder, datePublished 2026-10-14), WebPage, FAQPage from the 5 FAQs, and BreadcrumbList Home / Free Construction Timesheet Template / Time to Decimal Chart. PDF and XLSX are in `public/templates/` and are not in the sitemap. Sitemap is 29 URLs. Inbound links: timesheet template page ("convert minutes to decimal hours") and `/vs/spreadsheets` (Excel totals line). No link to `/guides/crew-hours-quickbooks`. No CSV, breaks, petty cash, competitor prices, or payroll-calculation claims. `npm run build` passed. Dist HTML: one H1, canonical as above, 60 chart rows, dollar amounts are only `$12`.
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database (`DATABASE_URL` unset; only `.env.example`). The fixture-safety guard would refuse, and tests must not point at real Neon or Supabase.
**State after:** `/templates/time-to-decimal-chart` is on `main` (85175cb). Sitemap has 29 URLs.
**Next:** Confirm the Vercel deploy is READY and the live page and PDF return 200. Remaining week-three posts: `/vs/quickbooks-time` refresh, `/guides/do-1099-subs-get-overtime`, `/templates/construction-daily-report-template`.

### 2026-10-12 — Crew management live; deep /api routes fixed in production (a1b7013 merged, a7b9abd)
**Did:** Jeff said ship it: fast-forwarded `main` to `feat/crew-management` (a1b7013; code identical to the 43/43 tested build). Production deploy READY. Live check found every API path two or more segments below its prefix returned Vercel NOT_FOUND, on today's deploy and on the previous one (49dddda), so this was pre-existing: day-hour saves, week status, expenses, adjustments, crew defaults, crew member moves, invite resend/revoke all failed on the live site (the app calls same-host `/api`). Cause: `api/<prefix>/[...path].ts` matches one segment on this project (earlier sessions worked around it with explicit files such as `employees/[employeeId]/remove.ts`). Fix a7b9abd: one `vercel.json` rewrite, `/api/:path*` → `/api/[...path]`, after the Stripe rule. Verified: on previews the deep path went from NOT_FOUND to reaching the function (previews crash at boot for every route, so no further preview test was possible); `npm run build` passed natively; on production after deploy, 9 deep routes return the app's own 401 JSON, 10 previously working routes unchanged (health 200, auth/crews/employees/invites/billing 401, both Stripe webhooks 400 missing signature), `/login` and `/pricing` 200. Rebased over the Supercrew commits (marketing only).
**Decided:** see the 2026-10-12 Decisions Log row (rewrite supersedes the per-prefix file rule).
**Killed:** nothing.
**Deferred:** Logged-in end-to-end test on production (needs a real login); Preview env vars; AGENTS.md rule cleanup (needs Jeff).
**State after:** `main` = a7b9abd, production READY with crew management, the company fence, and working deep API routes. Rollback target if needed: deploy of 8b3059f.
**Next:** Jeff logs in on app.myguystime.com, saves a day's hours and submits a week, then tries the Crews section (add a crew, pick a chief, move a guy).

### 2026-10-12 — Supercrew comparison page live (3a5b900)
**Did:** Published `/vs/supercrew` from the approved 2026-10-12 draft (Jeff's go-live OK for the week's drafts). Added the supercrew config in `vs.tsx` (hero, answer block, pain cards, comparison table, flow, fit, callout, 5 FAQs, pills, closing CTA). Each person joins the crew on his own phone; he or the foreman logs the hours. Prerender title `Supercrew (ConstructionClock) vs $12 Flat | My Guys Time`, the draft meta and OG description, self-canonical `https://www.myguystime.com/vs/supercrew`, plus SoftwareApplication for My Guys Time only (`price` "12", USD, P1M, per company per month), FAQPage from the 5 FAQs, and BreadcrumbList Home › Comparisons › Supercrew. Sitemap is 28 URLs. Inbound links: Supercrew pill on the other `/vs` pages, footer Comparisons column, cost hub compare list ("Supercrew pricing", per-member model), and a one-line link in best-apps "Also worth a look". No link to `/guides/crew-hours-quickbooks` or other unpublished week-three paths. No Supercrew dollar figures. The callout says `$12 a month flat for the whole company`. Re-checked https://supercrew.com/pricing on 2026-10-12: Timesheet approval is still labeled Soon on the Pro plan, so the table row stays. `npm run build` passed. Dist HTML: one H1, canonical as above, dollar amounts are only `$12`.
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database (`DATABASE_URL` unset). The fixture-safety guard would refuse, and tests must not point at real Neon or Supabase.
**State after:** `/vs/supercrew` is on `main`. Sitemap has 28 URLs.
**Next:** Confirm the Vercel deploy is READY and the live page returns the prerendered HTML. Remaining week-three posts: `/vs/quickbooks-time` refresh, `/templates/time-to-decimal-chart`, `/guides/do-1099-subs-get-overtime`, `/templates/construction-daily-report-template`.

> Older sessions archived in [JOURNEY_ARCHIVE.md](JOURNEY_ARCHIVE.md).

## Hard Rules

- Never commit `.env*` files. `.env.*` is git-ignored — keep it that way.
- Never put Supabase `service_role` (or any secret) in `VITE_*` / anon keys.
- All public Supabase tables use RLS (authenticated-only). New tables need explicit `GRANT`s.
- New Vercel API prefixes need their own `api/<prefix>/[...path].ts` file.
- Shipping follows [AGENTS.md](AGENTS.md): `npm run build` + `npm test` before every commit; commit to `main`
  (= release) only when Jeff asked for the work to go live; everything else on a branch.
- On Jeff's machine only: respect the mount quirks in `C:\Umbrella\UMBRELLA-GOTCHAS.md`.

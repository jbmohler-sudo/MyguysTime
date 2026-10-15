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
  `/guides`, `/guides/how-contractors-track-crew-hours`, `/guides/do-1099-subs-get-overtime`,
  `/templates/construction-timesheet-template`, `/templates/time-to-decimal-chart`, seven `/trades/:slug` pages, and
  `/vs/{paper-timesheets,quickbooks-time,spreadsheets,clockshark,connecteam,busybusy,workyard,supercrew}` — all prerendered, in the sitemap
  (31 URLs). Week one (2026-09-28–10-02) is live: construction time tracking pillar, ClockShark vs, cost hub,
  construction timesheet template, and Connecteam vs. Week two: `/vs/busybusy` (2026-10-05), `/vs/workyard` (2026-10-06),
  `/best-construction-time-tracking-apps` (2026-10-08), and `/guides/how-contractors-track-crew-hours` (2026-10-09).
  Week three: `/vs/supercrew` (2026-10-12), `/templates/time-to-decimal-chart` (2026-10-14), a refresh of
  `/vs/quickbooks-time` (2026-10-14, same URL), and `/guides/do-1099-subs-get-overtime` (2026-10-15).
  Still not live and on hold pending Jeff's CSV confirmation: `/guides/crew-hours-quickbooks`.
  (`feat/landing-audit` has no commits since 9/13; see Open Questions.)
- **In progress:** PR #6 structure fixes is open, awaiting Jeff (`/privacy` and `/terms` 404 after merge;
  it also drops `/demo/*` from the sitemap). Gross pay estimate is live on `main` (a1aa857, PR #9): weekly
  hours times the rate, plus hours past 40 times the overtime rate, shown to admin and foreman only.
  Marketing copy on `main` (605e395) does not claim CSV export or that the app handles deductions.
- **App live (2026-10-11/12):** office crew management on the Team page (add/rename/remove crews, crew chiefs,
  move workers), the cross-company timesheet fence, and the deep `/api` routing fix (a7b9abd). Before a7b9abd,
  every API path two or more segments below its prefix 404'd in production, so saving day hours and week
  status changes did not work on the live site.
- **Next:** Jeff's review of PR #6. Remaining week-three post: `/templates/construction-daily-report-template`.
  The QuickBooks guide stays on hold until Jeff confirms CSV export.
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
| 2026-10-15 | Marketing copy may say a company runs more than one crew. Crews and crew chiefs are live. | Jeff confirmed it while shipping the 1099 overtime guide. CSV export, breaks, and petty cash stay unconfirmed and stay out of new copy. |
| 2026-10-15 | The only pay figure is weekly gross: regular hours times the hourly rate, plus hours past 40 times the overtime rate. No net, deductions, or reimbursement math in that estimate. Office (admin and foreman) can see it, with a state-and-locality disclaimer. Workers do not receive the dollar fields. | Jeff approved this after the hours-and-pay audit. Expense receipts stay a list. The stored `PayrollEstimate.netCheckEstimateCents` column stays in the database and is written as 0. |
| 2026-10-15 | Marketing pages do not claim CSV export or that the app handles deductions. | Jeff approved the content-only fix. CSV export is still unconfirmed, so `/guides/crew-hours-quickbooks` stays on hold. Lines that say the app does not calculate deductions stay. |

## System Map

| System | File(s) | Status | Note |
|--------|---------|--------|------|
| Frontend | React/TS app | live | Office view shows hours, rate, hours past 40, and a gross pay estimate for admin and foreman. No taxes, deductions, or net pay. |
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

### 2026-10-15 — Marketing copy drops CSV export and deduction claims (605e395)
**Did:** Removed claims that the app exports CSV or handles deductions from the homepage office card and workflow, `/features`, `/pricing`, `/how-it-works`, `/construction-time-tracking`, the seven `/trades` pages, `/vs/paper-timesheets`, `/vs/spreadsheets`, `/vs/clockshark`, `index.html` meta, and prerender descriptions plus SoftwareApplication JSON-LD. The homepage office card now lists weekly hours, a gross pay estimate, receipts, and private office-only reports. Kept every line that says the app does not calculate taxes, deductions, net pay, or payroll, and kept competitor export lines (Workyard one-click export, Supercrew payroll exports, the best-apps Workyard card). PR #9 gross-estimate wording is unchanged. `npm run build` passed. Live check: production deploy `dpl_D2tVsiCWBAB8N6GF8mE3qrhJnJ8F` is READY, and https://www.myguystime.com/ returns 200 with no `CSV` and no `Reimbursements and deductions`. The only homepage "deduction" line is "No taxes, deductions, net pay, or payroll."
**Decided:** Marketing pages do not claim CSV export or that the app handles deductions (Decisions Log).
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database. Jeff approved shipping this content-only change without it. `/guides/crew-hours-quickbooks` stays on hold until Jeff confirms CSV export.
**State after:** on `main` (605e395). Sitemap still has 31 URLs.
**Next:** Jeff's review of PR #6. Remaining week-three post: `/templates/construction-daily-report-template`.

### 2026-10-15 — Gross pay estimate only, shown to the office (branch)
**Did:** Pay estimate is weekly gross only: regular hours times the hourly rate, plus hours past 40 times the overtime rate. Removed net check, reimbursement, and deduction math from `calculatePayrollEstimate` and from the API (`payrollEstimate` no longer has reimbursements, deductions, or `netCheckEstimate`; year-to-date no longer has net, reimbursements, or deductions). Expense and receipt logging stays a list and does not change gross. Admin and foreman see weekly gross on the office card and the admin dashboard, with the estimate disclaimer. Employee API responses omit `grossPay` dollars (`null`), omit `payrollEstimate`, and omit year-to-date dollar fields. Company setup no longer says "Compliant with FLSA". Marketing pages now say the app shows weekly hours, hours past 40, and a simple gross estimate, and that it does not calculate taxes, deductions, net pay, or payroll. `npm run build` passed. `npm test` passed.
**Decided:** see the 2026-10-15 Decisions Log row. The database column `netCheckEstimateCents` stays; new rows store 0. No migration.
**Killed:** nothing removed from the schema. Net-check math is gone from the estimate function and the API.
**Deferred:** CSV export copy that was not part of this pass. California daily overtime. Week-start mismatches. The stored pay-estimate column was not dropped.
**State after:** on branch `cursor/gross-pay-estimate-d1f7`, not merged.
**Next:** Jeff reviews the PR.

### 2026-10-15 — Guides hub page on a branch (bb7e430)
**Did:** Added a real `/guides` hub so that URL stops falling through to the homepage. New `GuidesHubPage`, registered in `marketingPageMap` and `scripts/prerender-landing.mjs`. Prerender title `Guides and Templates for Construction Crew Hours | My Guys Time`, self-canonical `https://www.myguystime.com/guides`, one H1, a short intro, and a link list of the two live guides and two live templates, each with a one-line description. JSON-LD is CollectionPage, ItemList, and BreadcrumbList Home / Construction Time Tracking / Guides. No link to `/guides/crew-hours-quickbooks`. Sitemap on this branch is 31 URLs. Copy says `$12/month flat for the whole company` and that each person uses his own phone. No CSV, breaks, petty cash, or payroll/tax calculation claims. `npm run build` passed. Dist HTML: one H1, canonical as above, dollar amounts are only `$12`. Not merged to `main`.
**Decided:** The two live guide articles keep Home / Construction Time Tracking / article title. Neither breadcrumb names Guides, and the prerender still rejects a Guides crumb on those articles, so there was no unlinked Guides crumb to point at `/guides`.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database (`DATABASE_URL` unset). The fixture-safety guard would refuse, and tests must not point at real Neon or Supabase. Shipping to `main` waits on Jeff.
**State after:** `/guides` hub is on `cursor/guides-hub-62ff` (bb7e430). Production still serves the homepage at `/guides`. Branch sitemap has 31 URLs.
**Next:** Jeff reviews the PR. See the PR notes for conflicts with open PR #6.

### 2026-10-15 — 1099 overtime guide live (292ef07)
**Did:** Published `/guides/do-1099-subs-get-overtime` from the approved 2026-10-15 draft (Jeff's go-live for the content-only page). New `Do1099SubsOvertimePage`, registered in `marketingPageMap` and `scripts/prerender-landing.mjs`. Title `Do 1099 Subs Get Overtime? What Contractors Should Know`, the draft meta and OG description, self-canonical `https://www.myguystime.com/guides/do-1099-subs-get-overtime`, plus Article (Jeff Mohler, Founder, datePublished 2026-10-15), FAQPage from the 5 FAQs, and BreadcrumbList Home / Construction Time Tracking / Do 1099 Subs Get Overtime? Disclaimers are in the prerendered HTML at the top and the bottom. Jeff's first-person lines are unchanged. Sitemap is 30 URLs. Inbound links: the crew-hours guide and `/trades/general-contracting`. No link to `/guides/crew-hours-quickbooks`. No CSV, breaks, petty cash, competitor prices, or payroll/overtime/tax calculation claims. Re-opened the DOL overtime page, the DOL FLSA page, Fact Sheet 13, the 2026 contractor NPRM page, Fact Sheet 21, the IRS independent-contractor page, the Form SS-8 page, and the California Labor Commissioner ABC FAQ on 2026-10-15. Each claim in the draft still matches those pages, so no legal line was rewritten. The Wage and Hour helpline on those DOL pages is still 1-866-487-9243. `npm run build` passed. Dist HTML: one H1, canonical as above, dollar amounts are only `$12`.
**Decided:** Marketing copy may mention multiple crews (see the 2026-10-15 Decisions Log row). This page does not add a multi-crew claim of its own.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database (`DATABASE_URL` unset). The fixture-safety guard would refuse, and tests must not point at real Neon or Supabase. `/features` outbound link left out of the approved copy. Plumbing, electrical, and FAQ inbound links left to the one relevant page (general contracting).
**State after:** `/guides/do-1099-subs-get-overtime` is on `main` (292ef07). Sitemap has 30 URLs.
**Next:** Confirm the Vercel deploy is READY and the live page returns 200 with one H1. Remaining week-three post: `/templates/construction-daily-report-template`.

> Older sessions archived in [JOURNEY_ARCHIVE.md](JOURNEY_ARCHIVE.md).

## Hard Rules

- Never commit `.env*` files. `.env.*` is git-ignored — keep it that way.
- Never put Supabase `service_role` (or any secret) in `VITE_*` / anon keys.
- All public Supabase tables use RLS (authenticated-only). New tables need explicit `GRANT`s.
- New Vercel API prefixes need their own `api/<prefix>/[...path].ts` file.
- Shipping follows [AGENTS.md](AGENTS.md): `npm run build` + `npm test` before every commit; commit to `main`
  (= release) only when Jeff asked for the work to go live; everything else on a branch.
- On Jeff's machine only: respect the mount quirks in `C:\Umbrella\UMBRELLA-GOTCHAS.md`.

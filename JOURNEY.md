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
  `/templates/construction-timesheet-template`, `/templates/time-to-decimal-chart`, `/templates/construction-daily-report-template`, `/templates/military-time-chart`, seven `/trades/:slug` pages, and
  `/vs/{paper-timesheets,quickbooks-time,spreadsheets,clockshark,connecteam,busybusy,workyard,supercrew,clockify}` — all prerendered, in the sitemap
  (34 URLs). Week one (2026-09-28–10-02) is live: construction time tracking pillar, ClockShark vs, cost hub,
  construction timesheet template, and Connecteam vs. Week two: `/vs/busybusy` (2026-10-05), `/vs/workyard` (2026-10-06),
  `/best-construction-time-tracking-apps` (2026-10-08), and `/guides/how-contractors-track-crew-hours` (2026-10-09).
  Week three: `/vs/supercrew` (2026-10-12), `/templates/time-to-decimal-chart` (2026-10-14), a refresh of
  `/vs/quickbooks-time` (2026-10-14, same URL), `/guides/do-1099-subs-get-overtime` (2026-10-15), and
  `/templates/construction-daily-report-template` (2026-10-16).
  Still not live and on hold pending Jeff's CSV confirmation: `/guides/crew-hours-quickbooks`.
  (`feat/landing-audit` has no commits since 9/13; see Open Questions.)
- **In progress:** PR #6 structure fixes is open, awaiting Jeff (`/privacy` and `/terms` 404 after merge;
  it also drops `/demo/*` from the sitemap). PR #6 is behind main and needs a re-sync before merge.
  PR #8 (`/privacy` and `/terms` pages, adds 2 sitemap URLs) is open alongside PR #6; both wait on Jeff.
  Gross pay estimate is live on `main` (a1aa857, PR #9): weekly
  hours times the rate, plus hours past 40 times the overtime rate, shown to admin and foreman only.
  Marketing copy on `main` (605e395) does not claim CSV export or that the app handles deductions.
- Week four: `/vs/clockify` is live (2026-10-20, 50f3705). `/trades/landscaping` was refreshed in place (2026-10-20, c9a722b and 3775728; sitemap lastmod 2026-10-20). `/templates/military-time-chart` is live (2026-10-21, 00d2ee9) with PDF and Excel downloads. Still briefed, not approved: `/guides/how-to-calculate-hours-worked`, `/guides/how-to-calculate-overtime`.
- **App live (2026-10-11/12):** office crew management on the Team page (add/rename/remove crews, crew chiefs,
  move workers), the cross-company timesheet fence, and the deep `/api` routing fix (a7b9abd). Before a7b9abd,
  every API path two or more segments below its prefix 404'd in production, so saving day hours and week
  status changes did not work on the live site.
- **Next:** Jeff's review of PR #6/#8. Remaining week-four posts still need a go-live yes: `/guides/how-to-calculate-hours-worked`, `/guides/how-to-calculate-overtime`. When the hours-worked guide ships, link it from military-chart FAQ 4. The QuickBooks guide stays on hold until Jeff confirms CSV export.
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

### 2026-10-21 — Military time chart live (00d2ee9)
**Did:** Published `/templates/military-time-chart` from the approved 2026-10-21 draft (Jeff's go-live, including the downloads). New `MilitaryTimeChartPage` with the 24-hour chart, minutes strip, conversion rules, a made-up punch-clock day, soft CTA, and 5 FAQs. Each guy joins his crew's team from his own phone; he or the foreman logs the hours. The office sees weekly hours, hours past 40, and a simple gross pay estimate. Prerender title `Military Time Chart for Time Cards (Printable PDF + Excel)`, the draft meta and OG description, self-canonical `https://www.myguystime.com/templates/military-time-chart`, plus Article (Jeff Mohler, Founder, datePublished 2026-10-21), WebPage, FAQPage from the 5 FAQs, and BreadcrumbList Home / Free Construction Timesheet Template / Military Time Chart. PDF and XLSX are in `public/templates/` and are not in the sitemap. Sitemap is 34 URLs. Inbound links: `/guides`, the decimal chart, and the timesheet template. FAQ 4 links the decimal chart. `/guides/how-to-calculate-hours-worked` is not live, so that FAQ link was left off. No CSV, breaks, petty cash, crew map, or claims that the app does taxes, deductions, net pay, or payroll. Reviewer notes and the change log were not published. `npm run build` passed. Conversion check covered all 1,440 minutes and the 12 chart rows: 0000 is 12:00 AM, 1200 is 12:00 PM, 1300 is 1:00 PM, 2359 is 11:59 PM. Excel Monday example 06:45 to 15:30 with 30 minutes unpaid lunch is 8.25; overnight 22:00 to 06:30 with 0 is 8.50. PDF is one Letter page, text selectable, 3,235 bytes, chart times at 14 pt. Live: Vercel reported the 00d2ee9 production deploy complete. https://www.myguystime.com/templates/military-time-chart returns 200, text/html, one H1. The PDF returns 200, application/pdf. The xlsx returns 200, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet. Live sitemap returns 200 with 34 URLs and does not list the files.
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database. Jeff approved shipping this content-only page without it. The draft's optional DigitalDocument blocks were left off so the schema matches the decimal chart. The footer Guides link still waits on PR #6. FAQ 4's hours-worked guide link waits until that page is live.
**State after:** `/templates/military-time-chart` is on `main` (00d2ee9). Sitemap has 34 URLs.
**Next:** Remaining week-four pages still need Jeff's go-live: `/guides/how-to-calculate-hours-worked`, `/guides/how-to-calculate-overtime`.

### 2026-10-20 — Landscaping trade page refresh live (c9a722b, 3775728)
**Did:** Refreshed `/trades/landscaping` in place from the approved 2026-10-20 draft (Jeff's go-live for the content-only page). H1 is `Landscaping Time Tracking for Route and Install Crews`; the old H1 is the kicker. Title `Landscaping Time Tracking for Crews | My Guys Time` and the draft meta. Each guy logs from his own phone. Step 3 says the office moves a guy to the other crew on the Team page and his open weeks go with him. Removed "Move their hours" and "for job costing". Added the multiple-crews section, the apps section, two FAQs, the timesheet-template link, and the guides link. The Clockify bullet link shipped in 3775728 once `/vs/clockify` was on main (50f3705). Kept the route, the live free-week CTA, and the WebPage + SoftwareApplication schema. No new FAQPage or breadcrumb. This refresh did not add a sitemap URL; this URL's `<lastmod>` is 2026-10-20. After the Clockify page, the sitemap has 33 URLs. No crew map, CSV, breaks, petty cash, competitor prices, or claims that the app does taxes, deductions, net pay, or payroll. Reviewer notes and the change log were not published. `npm run build` passed. Dist HTML: one H1, canonical `https://www.myguystime.com/trades/landscaping`, dollar amounts are only `$12`. Live check: production deploy `dpl_61ovfvqoyok6dre8K2giQGkqo3Ym` is READY. https://www.myguystime.com/trades/landscaping returns 200 with the new H1 and without "Move their hours", "job costing", or "crew map". Live sitemap returns 200 with 33 URLs and this page's lastmod 2026-10-20.
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database. Jeff approved shipping this content-only page without it.
**State after:** `/trades/landscaping` refresh is on `main` (c9a722b, Clockify link 3775728). Sitemap has 33 URLs.
**Next:** Remaining week-four pages still need Jeff's go-live: `/templates/military-time-chart`, `/guides/how-to-calculate-hours-worked`, `/guides/how-to-calculate-overtime`.

### 2026-10-20 — Clockify comparison page live (50f3705)
**Did:** Published `/vs/clockify` from the approved 2026-10-19 draft (Jeff's go-live). Added the clockify config in `vs.tsx` (hero, answer block, pain cards, comparison table, flow, fit, callout, 5 FAQs, pills, closing CTA). Each guy joins his crew's team from his own phone; he or the foreman logs the hours. Prerender title `Clockify Pricing vs $12 Flat for Crews | My Guys Time`, the draft meta and OG description, self-canonical `https://www.myguystime.com/vs/clockify`, plus SoftwareApplication for My Guys Time only (`price` "12", USD, P1M, per company per month), FAQPage from the 5 FAQs, and BreadcrumbList Home › Comparisons › Clockify. Sitemap is 33 URLs. Inbound links: Clockify pill on the other `/vs` pages, footer Comparisons column, cost hub compare list ("Clockify pricing", free plan then per seat), a one-line link in best-apps "Also worth a look", and the landscaping trade page (3775728). Rechecked https://clockify.me/pricing on 2026-10-20: free plan, then paid per seat (Basic, Standard, Pro, Enterprise), and every active or invited user takes a seat, owner included. Feature placements still match (Basic: Add time for others and Kiosk; Standard: Approval, Lock time, Attendance & overtime, QuickBooks integration; Pro: optional GPS). Comparison note date updated from October 16 to October 20, 2026. No Clockify dollar figures or user counts. Reviewer notes and the change log were not published. Best-apps Clockify lines no longer say the free plan is capped at a handful or a small number of users. No CSV, breaks, petty cash, one phone per crew, or payroll/tax claims. `npm run build` passed. Live: Vercel deploy for 50f3705 completed; https://www.myguystime.com/vs/clockify returns 200 with one H1, its own canonical, dollar amounts only `$12`, and no "5 users". Live sitemap has 33 URLs, including `/vs/clockify`.
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database. Jeff approved shipping this content-only page without it.
**State after:** `/vs/clockify` is on `main` (50f3705). Sitemap has 33 URLs. `/trades/landscaping` refresh (c9a722b, same URL) was already on main when this shipped, and that page links to `/vs/clockify` (3775728).
**Next:** Remaining week-four posts, each pending Jeff's go-live: `/templates/military-time-chart`, `/guides/how-to-calculate-hours-worked`, `/guides/how-to-calculate-overtime`.

### 2026-10-16 — Week three wrap + week four plan (planning only, no code)
**Did:** Week three (2026-10-12 to 10-16) shipped: `/vs/supercrew` (2026-10-12, 3a5b900), `/templates/time-to-decimal-chart` with PDF + Excel downloads (2026-10-14, 85175cb), `/vs/quickbooks-time` refresh, same URL (2026-10-14, 54da680), `/guides/do-1099-subs-get-overtime` (2026-10-15, 292ef07), the `/guides` hub (2026-10-15, fad0670, PR #7), and `/templates/construction-daily-report-template` (2026-10-16, 17d05f3). Also on main this week: CTR title/meta rewrites on /vs and /trades (a080baa), weekly gross pay estimate (a1aa857, PR #9), and marketing copy without CSV/deduction claims (605e395). Verified 2026-10-16 ~9:15 AM ET: live `https://www.myguystime.com/sitemap.xml` lists 32 URLs and matches `public/sitemap.xml` on main exactly; every week-three page returns 200 with its own title, a self-canonical and one H1; both decimal-chart download files return 200. OpenSEO audit 0cccd745 (38 pages) has one warning: `/guides` is an orphan (no prerendered page links to it; PR #6's footer change would add the link). The OpenSEO rank check was skipped this week (estimate 323 credits, over the 300 ceiling; 0 spent).
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `/guides/crew-hours-quickbooks` (still on hold until Jeff confirms CSV export). The subcontractor-vs-employee guide (DOL's final independent-contractor rule has been at OIRA review since 2026-09-28; wait for it). `npm test` not run: no local fixture database in this environment; doc-only change shipped on a passing build per Jeff's 2026-09-28 rule.
**State after:** sitemap 32 URLs (live = main). PR #6 (structure fixes) and PR #8 (/privacy and /terms) are open and wait on Jeff. Week four is planned and briefed, not approved.
**Next:** Week four, each pending Jeff's go-live yes: Mon 2026-10-19 `/vs/clockify`; Tue 2026-10-20 `/trades/landscaping` refresh (same URL); Wed 2026-10-21 `/templates/military-time-chart` (ships only if PDF + Excel are built); Thu 2026-10-22 `/guides/how-to-calculate-hours-worked`; Fri 2026-10-23 `/guides/how-to-calculate-overtime`. Fix the `/guides` orphan (PR #6 footer, or body links).

> Older sessions archived in [JOURNEY_ARCHIVE.md](JOURNEY_ARCHIVE.md).

## Hard Rules

- Never commit `.env*` files. `.env.*` is git-ignored — keep it that way.
- Never put Supabase `service_role` (or any secret) in `VITE_*` / anon keys.
- All public Supabase tables use RLS (authenticated-only). New tables need explicit `GRANT`s.
- New Vercel API prefixes need their own `api/<prefix>/[...path].ts` file.
- Shipping follows [AGENTS.md](AGENTS.md): `npm run build` + `npm test` before every commit; commit to `main`
  (= release) only when Jeff asked for the work to go live; everything else on a branch.
- On Jeff's machine only: respect the mount quirks in `C:\Umbrella\UMBRELLA-GOTCHAS.md`.

# MyGuys — JOURNEY

> The living story of this project. Read this first. **How to update this file:** [AGENTS.md](AGENTS.md)
> (new session entries go at the top of the Session Log, 4 max; never append at the end of the file).

## Current State

- **What it is:** timesheet/crew-board app — React/TypeScript + Node/Express. Auth is Supabase
  `ufbanjchatwkheaqafsf`. App data is Neon. Live at `app.myguystime.com` on Vercel (Hobby).
- **Live:** $12/mo company Stripe billing, checkout + webhook, Resend receipt on first paid
  period, 7-day no-card trial on new signups. Paid companies stay on `active`.
- **Marketing site live:** `/features`, `/pricing`, `/how-it-works`, `/faq`, `/construction-time-tracking`,
  `/construction-time-tracking-cost`, `/best-construction-time-tracking-apps`, `/guides`,
  `/guides/how-contractors-track-crew-hours`, `/guides/do-1099-subs-get-overtime`,
  `/templates/construction-timesheet-template`, `/templates/time-to-decimal-chart`, seven `/trades/:slug` pages, and
  `/vs/{paper-timesheets,quickbooks-time,spreadsheets,clockshark,connecteam,busybusy,workyard,supercrew}` — all prerendered.
  Live `main` sitemap is 31 URLs (those pages plus three `/demo/*`). Week one (2026-09-28–10-02) is live: construction time tracking pillar, ClockShark vs, cost hub,
  construction timesheet template, and Connecteam vs. Week two: `/vs/busybusy` (2026-10-05), `/vs/workyard` (2026-10-06),
  `/best-construction-time-tracking-apps` (2026-10-08), and `/guides/how-contractors-track-crew-hours` (2026-10-09).
  Week three: `/vs/supercrew` (2026-10-12), `/templates/time-to-decimal-chart` (2026-10-14), a refresh of
  `/vs/quickbooks-time` (2026-10-14, same URL), `/guides/do-1099-subs-get-overtime` (2026-10-15), and the `/guides` hub (2026-10-15, fad0670).
  Still not live and on hold pending Jeff's CSV confirmation: `/guides/crew-hours-quickbooks`.
  (`feat/landing-audit` has no commits since 9/13; see Open Questions.)
- **In progress:** PR #6 (`structure-fixes-2026-10`) includes current `main` and is awaiting Jeff. It keeps every live page, including `/guides` as a real 200. The branch sitemap is 28 URLs (main's 31 minus the three `/demo/*` URLs). `/privacy` and `/terms` still have no page, so they 404. Not merged.
- **App live (2026-10-11/12):** office crew management on the Team page (add/rename/remove crews, crew chiefs,
  move workers), the cross-company timesheet fence, and the deep `/api` routing fix (a7b9abd). Before a7b9abd,
  every API path two or more segments below its prefix 404'd in production, so saving day hours and week
  status changes did not work on the live site.
- **Next:** Jeff's review of PR #6. Remaining week-three post: `/templates/construction-daily-report-template`.
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
| 2026-10-09 | Unknown public URLs return HTTP 404 with a noindex page, not the homepage. Breadcrumbs use real hubs: trades, the template, best-apps, the cost page, and guides sit under `/construction-time-tracking`; all `/vs` pages sit under `/best-construction-time-tracking-apps`. Demo URLs stay linked and leave the sitemap. | Jeff approved the 2026-10-08 structure audit P0/P1. `/vs`, `/trades`, and `/templates` are not pages. Superseded in part by 2026-10-15: `/guides` is a page. On `structure-fixes-2026-10`, not live until merge. |
| 2026-10-15 | Marketing copy may say a company runs more than one crew. Crews and crew chiefs are live. | Jeff confirmed it while shipping the 1099 overtime guide. CSV export, breaks, and petty cash stay unconfirmed and stay out of new copy. |
| 2026-10-15 | `/guides` is a real hub. Its breadcrumb may be named Guides only when the URL is `https://www.myguystime.com/guides`. Guide articles stay Home / Construction Time Tracking / title. | The hub is on `main` (fad0670). PR #6's folder-name check allows that one crumb and still rejects Guides on every other page. |

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

### 2026-10-15 — Main merged into structure fixes; /guides stays a page (2695ee6)
**Did:** Merged `origin/main` (through the `/guides` hub, fad0670) into `structure-fixes-2026-10`. Kept every live page: `/vs/supercrew`, `/templates/time-to-decimal-chart`, the `/vs/quickbooks-time` refresh, `/guides/do-1099-subs-get-overtime`, and `/guides`. Conflicts were in `JOURNEY.md`, `JOURNEY_ARCHIVE.md`, `src/components/VsPage.tsx`, and `vercel.json`. `scripts/prerender-landing.mjs`, `src/App.tsx`, and `public/sitemap.xml` merged clean. `/guides` stays in `marketingPageMap` and prerenders to `dist/guides/index.html`. The 404 catch-all stays behind that file, with explicit `/guides` rewrites to `/guides/index.html`, and main's `/api/:path*` rewrite stays. The breadcrumb check still rejects Comparisons, Templates, and Guides, except the hub crumb whose URL is `https://www.myguystime.com/guides`. New pages use `MarketingBreadcrumb` and `MarketingFooter`. The footer Guides & tools column links the hub, the 1099 guide, and the decimal chart. Those two pages link back to `/guides`. QuickBooks Time's 6 visible FAQs now emit FAQPage; the decimal chart and 1099 guide already had it. Sitemap is 28 URLs (every live page, no `/demo/*`). `/privacy` and `/terms` still have no page, so they 404. `npm run build` passed. Live https://www.myguystime.com/guides returns title `Guides and Templates for Construction Crew Hours | My Guys Time` and canonical `https://www.myguystime.com/guides`.
**Decided:** The `/guides` hub crumb is allowed (2026-10-15 Decisions Log). Multiple crews stays in the footer. CSV export, breaks, and petty cash stay out of new copy.
**Killed:** nothing.
**Deferred:** `npm test` (`DATABASE_URL` unset). Do not merge until Jeff says to ship.
**State after:** PR #6 contains current `main` plus the structure fixes. Branch sitemap is 28 URLs. Not merged.
**Next:** Jeff reviews PR #6.

### 2026-10-15 — Guides hub page live on main (fad0670)
**Did:** Added a real `/guides` hub so that URL stops falling through to the homepage. New `GuidesHubPage`, registered in `marketingPageMap` and `scripts/prerender-landing.mjs`. Prerender title `Guides and Templates for Construction Crew Hours | My Guys Time`, self-canonical `https://www.myguystime.com/guides`, one H1, a short intro, and a link list of the two live guides and two live templates, each with a one-line description. JSON-LD is CollectionPage, ItemList, and BreadcrumbList Home / Construction Time Tracking / Guides. No link to `/guides/crew-hours-quickbooks`. Sitemap on `main` is 31 URLs. Copy says `$12/month flat for the whole company` and that each person uses his own phone. No CSV, breaks, petty cash, or payroll/tax calculation claims. `npm run build` passed. Dist HTML: one H1, canonical as above, dollar amounts are only `$12`. Squashed to `main` as fad0670.
**Decided:** The two live guide articles keep Home / Construction Time Tracking / article title. Neither breadcrumb names Guides, and the prerender still rejects a Guides crumb on those articles.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database (`DATABASE_URL` unset).
**State after:** `/guides` is on `main` (fad0670).
**Next:** PR #6 has to allow the hub's own Guides crumb and must not 404 `/guides`.

### 2026-10-15 — 1099 overtime guide live (292ef07)
**Did:** Published `/guides/do-1099-subs-get-overtime` from the approved 2026-10-15 draft (Jeff's go-live for the content-only page). New `Do1099SubsOvertimePage`, registered in `marketingPageMap` and `scripts/prerender-landing.mjs`. Title `Do 1099 Subs Get Overtime? What Contractors Should Know`, the draft meta and OG description, self-canonical `https://www.myguystime.com/guides/do-1099-subs-get-overtime`, plus Article (Jeff Mohler, Founder, datePublished 2026-10-15), FAQPage from the 5 FAQs, and BreadcrumbList Home / Construction Time Tracking / Do 1099 Subs Get Overtime? Disclaimers are in the prerendered HTML at the top and the bottom. Jeff's first-person lines are unchanged. Sitemap is 30 URLs. Inbound links: the crew-hours guide and `/trades/general-contracting`. No link to `/guides/crew-hours-quickbooks`. No CSV, breaks, petty cash, competitor prices, or payroll/overtime/tax calculation claims. Re-opened the DOL overtime page, the DOL FLSA page, Fact Sheet 13, the 2026 contractor NPRM page, Fact Sheet 21, the IRS independent-contractor page, the Form SS-8 page, and the California Labor Commissioner ABC FAQ on 2026-10-15. Each claim in the draft still matches those pages, so no legal line was rewritten. The Wage and Hour helpline on those DOL pages is still 1-866-487-9243. `npm run build` passed. Dist HTML: one H1, canonical as above, dollar amounts are only `$12`.
**Decided:** Marketing copy may mention multiple crews (see the 2026-10-15 Decisions Log row). This page does not add a multi-crew claim of its own.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database (`DATABASE_URL` unset). The fixture-safety guard would refuse, and tests must not point at real Neon or Supabase. `/features` outbound link left out of the approved copy. Plumbing, electrical, and FAQ inbound links left to the one relevant page (general contracting).
**State after:** `/guides/do-1099-subs-get-overtime` is on `main` (292ef07). Sitemap has 30 URLs.
**Next:** Confirm the Vercel deploy is READY and the live page returns 200 with one H1. Remaining week-three post: `/templates/construction-daily-report-template`.

### 2026-10-14 — QuickBooks Time comparison page refreshed (54da680)
**Did:** Refreshed existing `/vs/quickbooks-time` from the approved 2026-10-13 draft (Jeff's go-live for the content-only page). Updated the quickbooks-time config in `vs.tsx` (eyebrow, h1, answer block, pain cards, comparison table, flow, callout, 6 FAQs, closing CTA). Each person joins the crew team from his own phone; he or the foreman logs the hours. Removed "one phone per crew is enough." Prerender title `QuickBooks Time Pricing vs $12 Flat for Crews | My Guys Time`, the draft meta and OG description, self-canonical `https://www.myguystime.com/vs/quickbooks-time`. Kept the existing SoftwareApplication, Organization, WebSite, and WebPage schema; WebPage `dateModified` is 2026-10-14. No new FAQPage or breadcrumb. Sitemap stays 29 URLs; this URL's `<lastmod>` is 2026-10-14. No competitor dollar figures. `$12` reads as flat for the whole company. Left out of the page: CSV export, multiple crews, breaks, petty cash, Intuit dollar amounts, and the old Support row. `npm run build` passed. Dist HTML: one H1, canonical as above, body dollar amounts are only `$12`, and "one phone per crew" is absent.
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database (`DATABASE_URL` unset). The fixture-safety guard would refuse, and tests must not point at real Neon or Supabase.
**State after:** `/vs/quickbooks-time` refresh is on `main` (54da680). Sitemap has 29 URLs.
**Next:** Confirm the Vercel deploy is READY and https://www.myguystime.com/vs/quickbooks-time returns 200 without "one phone per crew". Remaining week-three posts: `/guides/do-1099-subs-get-overtime`, `/templates/construction-daily-report-template`.

> Older sessions archived in [JOURNEY_ARCHIVE.md](JOURNEY_ARCHIVE.md).

## Hard Rules

- Never commit `.env*` files. `.env.*` is git-ignored — keep it that way.
- Never put Supabase `service_role` (or any secret) in `VITE_*` / anon keys.
- All public Supabase tables use RLS (authenticated-only). New tables need explicit `GRANT`s.
- New Vercel API prefixes need their own `api/<prefix>/[...path].ts` file.
- Shipping follows [AGENTS.md](AGENTS.md): `npm run build` + `npm test` before every commit; commit to `main`
  (= release) only when Jeff asked for the work to go live; everything else on a branch.
- On Jeff's machine only: respect the mount quirks in `C:\Umbrella\UMBRELLA-GOTCHAS.md`.

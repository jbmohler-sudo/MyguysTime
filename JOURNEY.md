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
  `/templates/construction-timesheet-template`, seven `/trades/:slug` pages, and
  `/vs/{paper-timesheets,quickbooks-time,spreadsheets,clockshark,connecteam,busybusy,workyard}` — all prerendered, in the sitemap
  (27 URLs). Week one (2026-09-28–10-02) is live: construction time tracking pillar, ClockShark vs, cost hub,
  construction timesheet template, and Connecteam vs. Week two: `/vs/busybusy` (2026-10-05), `/vs/workyard` (2026-10-06),
  `/best-construction-time-tracking-apps` (2026-10-08), and `/guides/how-contractors-track-crew-hours` (2026-10-09).
  Still not live: `/guides/crew-hours-quickbooks`.
  (`feat/landing-audit` has no commits since 9/13; see Open Questions.)
- **Biggest open item:** Jeff's call on two Cursor branches (Open Questions). Optional later:
  Auth admin on `sb_secret_` (then disable legacy JWT), Neon→one Supabase DB.

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
| 2026-09-13 | Vercel Hobby API routes need `api/<prefix>/[...path].ts` | Root `api/[...path]` only matches one extra segment (`/api/health` works; `/api/billing/checkout` 404'd). |
| 2026-09-13 | Auth **admin** still uses legacy JWT `service_role`; publishable `sb_publishable_` for anon/VITE | `sb_secret_` was rejected by Auth admin. Do not put `service_role` in `VITE_*`. |
| 2026-09-13 | App DB is Neon; Auth stays on Supabase `ufbanj…` | Wrong-project keys (`pmwzgag…`) cause Invalid API key. |
| 2026-09-12 | Unauthenticated signup must **create** Auth users only — never `updateUserById` | Invite-created Auth accounts were takeover targets: anyone who knew the email could set a new password. |
| 2026-09-12 | Invite links and CORS use `APP_URL` / `CORS_ORIGINS`, not the request `Origin` | A spoofed Origin minted attacker-shaped invite URLs and reflected CORS. |
| 2026-06-25 | Remediate leaked env secrets by **rewriting git history** (`git filter-repo`) + force-push, then rotate creds | Secrets (`.env.production.*`) had been committed and pushed; scrub limits future exposure, rotation neutralizes the leak. |
| (earlier) | Remove the tax/payroll engine entirely | App scope narrowed to timesheets/hours; tax logic was dead weight and risk. |
| (earlier) | All public tables use RLS; authenticated-only, no anon access | Security baseline for Supabase. |
| 2026-09-25 | One shipping rule across all repos: a commit to `main` is a release; commit there only when build + tests pass and Jeff asked for it to go live, otherwise branch; pricing/billing/rules/security/deletions need Jeff's OK first (AGENTS.md) | Cloud agents (Muse) couldn't see rules kept in CLAUDE.md / `../` files; the local backup pushes any commit on `main`, so "commit but don't push" rules silently shipped; 13 failed production builds on 9/13–9/23 |
| 2026-09-28 | Content-only marketing pages and sitemap may ship to `main` on a passing `npm run build` when `npm test` cannot run in this cloud environment (no local fixture DB or Supabase keys). Never point tests at real Neon or Supabase. | Jeff approved. Cloud agents have no fixture database, and the safety check blocks remote fixture mutation. |

## System Map

| System | File(s) | Status | Note |
|--------|---------|--------|------|
| Frontend | React/TS app | live | Office view = hours + rate + notes (no payroll surface). |
| Backend | Node/Express on Vercel `/api` | live | Dedicated handlers per prefix (`api/billing`, `api/stripe`, `api/auth`, …). |
| Auth | Supabase `ufbanjchatwkheaqafsf` | live | Publishable anon + legacy JWT `service_role` for admin. |
| Data | Neon (`neondb`) | live | Prisma + RLS. Auth is not on this DB. |
| Billing | `server/routes/billing.ts` | live | $12/mo, 7-day trial, `/billing/sync` after Checkout, webhook `/api/billing/webhook`. |
| Receipts | `server/email/subscriptionReceiptEmail.ts` | live | Resend to company admin on first paid period. |
| Crew workflow | weekly crew board, foreman approval | live | Solo crews (1 member) auto-approve past foreman. |
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
- Two Cursor branches wait on Jeff: `cursor/complimentary-owner-billing-95c4` (e470e7c, 9/20 — billing access
  for the platform owner, 16 files) and `cursor/ga4-gtag-07bd` (16658cc, 9/23 — GA4 on every page). Both are ~30
  commits behind `main`: merge (after rebase + build) or drop?

## Session Log

### 2026-10-09 — How contractors track crew hours guide live (552541b)
**Did:** Published `/guides/how-contractors-track-crew-hours` from the approved 2026-10-09 draft (Jeff's go-live OK). New `GuidePage` in the marketing chrome, wired in `marketingPageMap`, with the founder section, checklist, FAQ, and closing CTA. Visible breadcrumb is Home / Construction Time Tracking (`/construction-time-tracking`) / How Contractors Track Crew Hours (no Guides crumb). Prerender title `How Contractors Track Crew Hours: Paper, Sheet, or App`, the draft meta and OG description, self-canonical, plus Article (Jeff Mohler, Founder, datePublished 2026-10-09), FAQPage from the 5 FAQs, and BreadcrumbList. Sitemap is 27 URLs. Inbound links: pillar ("how contractors track crew hours"), `/vs/paper-timesheets` ("how contractors track crew hours: paper vs sheet vs app"), `/vs/spreadsheets` ("how other contractors track crew hours"), and best-apps FAQ 1 ("how contractors track crew hours"). Outbound links only to live pages, including the pillar with exact anchor "construction time tracking", paper, spreadsheets, the timesheet template (PDF or Excel), and the best-apps page. No link to `/guides/crew-hours-quickbooks`. No CSV, breaks, petty cash, competitor prices, or payroll-calculation claims. `npm run build` passed. Dist HTML: one H1, canonical `https://www.myguystime.com/guides/how-contractors-track-crew-hours`, `$12/month` intact.
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database (`DATABASE_URL` unset). `/guides/crew-hours-quickbooks` stays unlinked.
**State after:** `/guides/how-contractors-track-crew-hours` is on `main`. Sitemap has 27 URLs.
**Next:** Confirm the Vercel deploy is READY and the live page returns the prerendered HTML.

### 2026-10-08 — Best construction time tracking apps listicle live (5d9b028)
**Did:** Published `/best-construction-time-tracking-apps` from the approved 2026-10-08 draft (Jeff's go-live OK). New `BestConstructionTimeTrackingAppsPage` with intro, answer block, quick picks, seven app cards, also-worth mentions, 5-question chooser, FAQ, and closing CTA. Prerender title, meta, OG, and self-canonical, plus SoftwareApplication for My Guys Time only (`price` "12", USD, P1M, per company per month), ItemList of the seven cards (no ratings), FAQPage from the 5 FAQs, and BreadcrumbList Home › Comparisons › Best Time Tracking Apps for Small Construction Crews. Sitemap is 26 URLs. Inbound links from the pillar cost section, the cost hub compare list, the homepage product column, the footer Comparisons column, a pill on every `/vs` page, and the Workyard "best timesheet app" FAQ (the interim "soon" sentence now points here). Dropped the unpublished guide notes. Clockify FAQ says the free plan caps it at a small number of users, with the "up to 5" parenthetical removed from the FAQ and the also-worth line. No competitor dollar figures. No CSV, breaks, or petty cash claims for My Guys Time. `npm run build` passed. Dist HTML: title `Best Time Tracking Apps for Small Construction Crews`, one H1, canonical `https://www.myguystime.com/best-construction-time-tracking-apps`, `$12/month` intact.
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database (`DATABASE_URL` unset). `/guides/crew-hours-quickbooks` and `/guides/how-contractors-track-crew-hours` stay unlinked.
**State after:** `/best-construction-time-tracking-apps` is on `main`. Sitemap has 26 URLs.
**Next:** Confirm the Vercel deploy is READY and the live page returns the prerendered HTML.

### 2026-10-06 — Workyard comparison page live (8ed149f, fc9cdd3)
**Did:** Published `/vs/workyard` from the approved 2026-10-02 draft (Jeff's go-live OK, including the "No GPS, by choice" callout). Added the workyard config in `vs.tsx` (answer block, fit block, 5 FAQs, pain cards, comparison table, flow, callout, pills, closing CTA). Prerender title, meta, OG, and self-canonical, plus SoftwareApplication for My Guys Time only (`price` "12", USD, P1M, per company per month), FAQPage from the 5 FAQs, and BreadcrumbList Home › Comparisons › Workyard. Sitemap is 25 URLs. Inbound links: footer Comparisons column, pills on the other `/vs` pages (including `/vs/busybusy`), and the cost hub per-user mention plus compare list. Re-checked workyard.com/pricing on 2026-10-06: Starter, Pro, Autopilot, Enterprise, per user per month, and the table's feature claims still match. No base fee on their page, so none added. No competitor dollar figures. No CSV, breaks, petty cash, or multi-crew claims for My Guys Time. FAQ 3 keeps the interim sentence and does not link `/best-construction-time-tracking-apps`. `npm run build` passed. Dist HTML: title `Workyard Pricing vs $12 Flat for Crews | My Guys Time`, one H1, canonical `https://www.myguystime.com/vs/workyard`. Earlier this week, `/vs/busybusy` shipped in fc9cdd3 (sitemap was 24; dist title `BusyBusy Pricing vs $12 Flat for Crews | My Guys Time`).
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no local fixture database. The best-apps page stays unlinked until it is live.
**State after:** `/vs/workyard` and `/vs/busybusy` are on `main`. Sitemap has 25 URLs.
**Next:** Confirm the Vercel deploy is READY and the live Workyard page returns the prerendered HTML.

### 2026-10-02 — Week one content live (23 URLs); week two five briefs ready (86a5555)
**Did:** Week one (Mon–Fri) marketing pages are live and in the sitemap: construction time tracking pillar, ClockShark vs, cost hub, construction timesheet template (PDF+Excel), Connecteam vs. Live sitemap count **23** (matched repo). Friday SEO planning re-pulled keyword/SERP data, wrote five writer briefs for week two (busybusy vs, Workyard vs, QuickBooks CSV guide, best-apps listicle, how-contractors-track-hours guide), and updated the seo-desk publishing schedule. No code changes in this commit.
**Decided:** nothing new in-repo. Week two slug for the QuickBooks guide is `/guides/crew-hours-quickbooks` (no -payroll in the URL).
**Killed:** nothing.
**Deferred:** Search Console sitemap resubmit (write scope not enabled on the connector). `npm test` still deferred in cloud when no fixture DB.
**State after:** Marketing site at 23 sitemap URLs. Week two posts briefed for 2026-10-05–10-09; drafts not started in this repo.
**Next:** Blogs drafts week two for Jeff review; enable GSC write or manually resubmit https://www.myguystime.com/sitemap.xml; ship week two only after Jeff's yes per post (content-only may use build-only when tests cannot run).

> Older sessions archived in [JOURNEY_ARCHIVE.md](JOURNEY_ARCHIVE.md).

## Hard Rules

- Never commit `.env*` files. `.env.*` is git-ignored — keep it that way.
- Never put Supabase `service_role` (or any secret) in `VITE_*` / anon keys.
- All public Supabase tables use RLS (authenticated-only). New tables need explicit `GRANT`s.
- New Vercel API prefixes need their own `api/<prefix>/[...path].ts` file.
- Shipping follows [AGENTS.md](AGENTS.md): `npm run build` + `npm test` before every commit; commit to `main`
  (= release) only when Jeff asked for the work to go live; everything else on a branch.
- On Jeff's machine only: respect the mount quirks in `C:\Umbrella\UMBRELLA-GOTCHAS.md`.

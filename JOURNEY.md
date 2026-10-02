# MyGuys — JOURNEY

> The living story of this project. Read this first. **How to update this file:** [AGENTS.md](AGENTS.md)
> (new session entries go at the top of the Session Log, 4 max; never append at the end of the file).

## Current State

- **What it is:** timesheet/crew-board app — React/TypeScript + Node/Express. Auth is Supabase
  `ufbanjchatwkheaqafsf`. App data is Neon. Live at `app.myguystime.com` on Vercel (Hobby).
- **Live:** $12/mo company Stripe billing, checkout + webhook, Resend receipt on first paid
  period, 7-day no-card trial on new signups. Paid companies stay on `active`.
- **Marketing site live:** `/features`, `/pricing`, `/how-it-works`, `/faq`, `/construction-time-tracking`,
  `/construction-time-tracking-cost`, `/templates/construction-timesheet-template`, seven `/trades/:slug` pages, and
  `/vs/{paper-timesheets,quickbooks-time,spreadsheets,clockshark,connecteam}` — all prerendered, in the sitemap
  (23 URLs). (`feat/landing-audit` has no commits since 9/13; see Open Questions.)
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

### 2026-10-02 — Connecteam comparison page live (9234ba5)
**Did:** Published `/vs/connecteam` from the ship-ready Friday copy. Added the connecteam config in `vs.tsx` (answer block, fit block, 5 FAQs, pain cards, comparison table, flow, callout, pills, closing CTA) and optional hero and table button labels so the other comparison pages keep their existing buttons. Prerender title, meta, OG, and self-canonical, plus SoftwareApplication for My Guys Time only (`price` "12", USD, P1M, per company per month), FAQPage from the 5 FAQs, and BreadcrumbList Home › Comparisons › Connecteam. Sitemap is 23 URLs. Inbound links: footer Comparisons column, pills on the other `/vs` pages, the cost hub compare list, and the pillar free-plans line. `npm run build` passed. Dist HTML: title `Connecteam Pricing & Alternative for Crews | My Guys Time`, one H1, canonical `https://www.myguystime.com/vs/connecteam`, dollar amounts are only `$12`. Page copy has no CSV, export, breaks, or petty cash.
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no fixture database.
**State after:** `/vs/connecteam` is on `main`. Sitemap has 23 URLs.
**Next:** Confirm the Vercel deploy is READY and the live page returns the prerendered HTML.

### 2026-10-01 — Construction timesheet template page live (e71b582)
**Did:** Published `/templates/construction-timesheet-template` from the approved draft. New `ConstructionTimesheetTemplatePage` with PDF and Excel downloads, the field list, how-to, format table, mistakes, softened app pitch, and 5 FAQs. Preview and OG use the example PNG. Prerender title, meta, OG, and self-canonical, plus WebPage, BreadcrumbList (Home › Templates › Construction Timesheet Template), DigitalDocument for PDF and Excel, FAQPage from the 5 FAQs, and SoftwareApplication (`price` "12", USD, P1M, per company per month). Sitemap is 22 URLs. Inbound links from the pillar, `/vs/paper-timesheets`, `/vs/spreadsheets`, and `/construction-time-tracking-cost`. `npm run build` passed. Dist HTML: title `Free Construction Timesheet Template (PDF & Excel)`, one H1, canonical `https://www.myguystime.com/templates/construction-timesheet-template`, download hrefs for the PDF and `.xlsx`, `$12/month` intact. No Google Sheets, CSV, Connecteam, petty cash, or app break-tracking claims.
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no fixture database. Connecteam stays off until that page is live.
**State after:** `/templates/construction-timesheet-template` is on `main`. Sitemap has 22 URLs.
**Next:** Confirm the Vercel deploy is READY and the live page and both downloads return.

### 2026-09-30 — Construction time tracking cost page live (60bb0fa)
**Did:** Published `/construction-time-tracking-cost` from the approved draft. New `ConstructionTimeTrackingCostPage` with the answer block, pricing models, vendor questions, FAQ, and a bring-your-own-quote calculator (empty inputs; result only after base fee, per-user fee, and crew size). Prerender title, meta, OG, and self-canonical, plus WebPage, BreadcrumbList (Home › Construction Time Tracking Cost), FAQPage from the 5 FAQs, and SoftwareApplication for My Guys Time only (`price` "12", USD, P1M, per company per month). Sitemap is 21 URLs. Inbound links from `/pricing`, the pillar cost section (trimmed to a snapshot), `/vs/clockshark`, `/vs/quickbooks-time`, and the FAQ "Do I pay per employee?" answer. `npm run build` passed. Dist HTML: title `Construction Time Tracking Cost: Per-Seat vs Flat Pricing`, one H1, canonical `https://www.myguystime.com/construction-time-tracking-cost`, `$12/mo` intact, formula and model table in the static HTML, no result block until input. Headless Chrome on the preview confirmed 40 + 9 × 8 = $112/month, $1344/year, with the annual toggle emphasizing the yearly figures.
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** `npm test`. This environment has no `DATABASE_URL` or Supabase fixture keys, and the safety check refuses remote fixture mutation. Connecteam and template links stay off until those pages are live.
**State after:** `/construction-time-tracking-cost` is on `main`. Sitemap has 21 URLs.
**Next:** Confirm the Vercel deploy is READY and the live page returns the prerendered HTML.

### 2026-09-29 — ClockShark comparison page live (e4a4a1f)
**Did:** Published `/vs/clockshark` from the approved draft. Added the clockshark config in `vs.tsx` and optional `VsPage` fields (custom pain, flow, FAQ, and closing headings, a fit block, compare CTAs, and FAQ links) so the three existing comparison pages keep their generated headings. Prerender title, meta, OG, and canonical, plus SoftwareApplication for My Guys Time only (`price` "12", USD, P1M, per company per month), FAQPage from the 5 FAQs, and BreadcrumbList Home › Comparisons › ClockShark. Sitemap is 20 URLs. Inbound links: footer Comparisons column, pills on the other `/vs` pages, and the construction pillar cost section. `npm run build` passed. Dist HTML: title `ClockShark Pricing vs $12 Flat for Crews | My Guys Time`, one H1, canonical `https://www.myguystime.com/vs/clockshark`, dollar amounts are only `$12`.
**Decided:** Recorded Jeff's 2026-09-28 approval that content-only marketing pages and the sitemap may ship to `main` on a passing build when `npm test` cannot run here.
**Killed:** nothing.
**Deferred:** Connecteam pill, the cost-hub link, and template downloads. Those URLs are not live.
**State after:** `/vs/clockshark` is on `main`. Sitemap has 20 URLs.
**Next:** Confirm the Vercel deploy is READY and the live page returns the prerendered HTML.

> Older sessions archived in [JOURNEY_ARCHIVE.md](JOURNEY_ARCHIVE.md).

## Hard Rules

- Never commit `.env*` files. `.env.*` is git-ignored — keep it that way.
- Never put Supabase `service_role` (or any secret) in `VITE_*` / anon keys.
- All public Supabase tables use RLS (authenticated-only). New tables need explicit `GRANT`s.
- New Vercel API prefixes need their own `api/<prefix>/[...path].ts` file.
- Shipping follows [AGENTS.md](AGENTS.md): `npm run build` + `npm test` before every commit; commit to `main`
  (= release) only when Jeff asked for the work to go live; everything else on a branch.
- On Jeff's machine only: respect the mount quirks in `C:\Umbrella\UMBRELLA-GOTCHAS.md`.

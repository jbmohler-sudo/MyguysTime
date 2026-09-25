# MyGuys — JOURNEY

> The living story of this project. Read this first. **How to update this file:** [AGENTS.md](AGENTS.md)
> (new session entries go at the top of the Session Log, 4 max; never append at the end of the file).

## Current State

- **What it is:** timesheet/crew-board app — React/TypeScript + Node/Express. Auth is Supabase
  `ufbanjchatwkheaqafsf`. App data is Neon. Live at `app.myguystime.com` on Vercel (Hobby).
- **Live:** $12/mo company Stripe billing, checkout + webhook, Resend receipt on first paid
  period, 7-day no-card trial on new signups. Paid companies stay on `active`.
- **Marketing site live (2026-09-23/24, Muse):** `/features`, `/pricing`, `/how-it-works`, `/faq`, seven
  `/trades/:slug` pages, and `/vs/{paper-timesheets,quickbooks-time,spreadsheets}` — all prerendered, in the
  sitemap. (`feat/landing-audit` has no commits since 9/13; see Open Questions.)
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

### 2026-09-25 — Agent rules in-repo (new AGENTS.md); journal repaired; stale guidance fixed (Claude)
**Did:** Cross-repo audit. Found: Muse (cloud, `jbmohler-sudo`) built the marketing site 9/23–9/24 by pushing each change straight to `main` with no local build, per the old "commit and push without being asked" rule — **13 Vercel production builds failed** (11 in a row on 9/23: 7aada9f…ccc139b) before a green one; the live site stayed on the last good build. The three batch entries had been appended at the end of this file and the Session Log held 5 entries. Fix: new AGENTS.md (shared rules: sync first, shipping, **build + test before every commit**, JOURNEY format) and CLAUDE.md now imports it, with its stale "payroll app on Supabase" description corrected (payroll removed; app data on Neon). Journal: header points at AGENTS.md instead of `../` files; strays folded in newest-first (headings demoted only); cap applied; Current State and Hard Rules brought current.
**Decided:** One shipping rule in every repo: a commit to `main` is a release, so commit there only when `npm run build` and `npm test` pass and Jeff asked for the work to go live; everything else on a branch. Pricing, billing, rules, security/migrations, and deletions always need Jeff's OK first. Replaces "commit and push without being asked."
**Killed:** "After ANY code change: commit and push without being asked"; the `feat/landing-audit` hold rule (the branch has no commits since 9/13 and the marketing work shipped on `main`).
**Deferred:** Two Cursor branches await Jeff (see Open Questions).
**State after:** Local checkout synced with origin; marketing pages live; rules readable by every agent.
**Next:** Jeff decides the two Cursor branches and whether to delete `feat/landing-audit`.

### 2026-09-24 — Batch 3: three comparison pages live

Shipped after Jeff approved the drafts (`/vs/paper-timesheets`, `/vs/quickbooks-time`,
`/vs/spreadsheets`). Build: new `vs.tsx` content configs + shared `VsPage` template with a
side-by-side comparison table (old way vs My Guys Time), public `/vs/:slug` route, prerendered
landing pages with unique titles/descriptions/canonicals/JSON-LD, sitemap now 18 URLs,
Comparisons footer column on homepage + marketing pages.

Copy uses grounded product facts only — $12/mo flat, no per-seat, 7-day trial, browser-based,
crew-board review flow, CSV exports, receipt photos, mixed W-2/1099. Paper page carries the 2x6
origin story; QuickBooks page positions flat pricing against per-seat billing without inventing
competitor prices; spreadsheet page targets the Thursday-at-5pm rebuild. Each page: 4 pain
cards, 5-row comparison table, 4-step weekly flow, callout, 3 FAQs, cross-comparison pills.

Draft files and phone-readable copy preview staged under
`workspace/goals/my-guys-time-marketing-page-buildout/drafts/batch3-vs/` before go-live.

### 2026-09-23 — Batch 2: seven trade pages live

Shipped after Batch 1: `/trades/roofing`, `/trades/masonry`, `/trades/landscaping`,
`/trades/painting`, `/trades/plumbing`, `/trades/electrical`, `/trades/general-contracting`.

Build: new `trades.tsx` content configs + shared `TradePage` template, public
`/trades/:slug` route, prerendered landing pages with unique titles/descriptions/canonicals/JSON-LD,
sitemap at 15 URLs, Trades footer column on homepage + marketing pages.

Copy uses grounded product facts only — no invented features. Masonry page carries
the 2x6 origin story. Each page: 4 pain cards, 4-step weekly flow, callout, 3 FAQs,
cross-trade pills, start-free-week + how-it-works CTAs.

First builds failed on two self-made TS errors (MarketingChrome API guess + TradeFaq field
mismatch); fixed against the real component API, rebuilt READY, all seven pages
live-verified: HTTP 200, prerendered, one H1 each, self-canonicals, $12/mo intact.

### 2026-09-23 — Marketing pages batch 1 (features/pricing/how-it-works/faq)

**Why:** site was 4 URLs (home + 3 demo routes); 1–2 blog posts/month would leave it thin for a year. Decision: build pages, not posts.

**What shipped:**
- New prerendered pages: `/features`, `/pricing`, `/how-it-works`, `/faq` — new components under `src/components/`, shared `MarketingChrome.tsx` (header/footer/CTA), routed in `App.tsx` on the public host only.
- `scripts/prerender-landing.mjs` generalized: renders all 5 marketing pages to `dist/<route>/index.html` with per-page title/meta/OG/canonical + JSON-LD (SoftwareApplication on home/features/pricing, FAQPage from the same arrays the pages render, WebPage per sub-page). Vercel serves the static files ahead of the SPA rewrite; `main.tsx` hydration unchanged (App routes by pathname).
- Homepage footer Product links now point at the new pages (header keeps #anchors for scroll UX). Sitemap lists all 4.
- All copy from real product facts only (JOURNEY + homepage): $12 flat, 7-day trial, roles, CSV exports, reimbursements, receipt photos, mixed W-2/1099, office-only reports.

**Gotchas fixed:**
- `React.ReactNode` → `type ReactNode` import (no React namespace import in App.tsx).
- Prerender meta replacement corrupted `$12` → `$1`+`2` (JS `$n` capture-group substitution in string replacements). Fixed with replacement functions. Verified `$12/mo` intact in meta/OG/body post-fix.

**Verified live:** all 4 pages 200 with prerendered HTML, unique titles/descriptions, self-referencing canonicals, single H1 each; homepage 200 unchanged; sitemap lists 8 URLs.

**Next:** batch 2 = 7 trade pages (`/trades/[trade]`), batch 3 = 3 comparisons (`/vs/*`). Plan: `workspace/goals/content-outreach-engine-running/files/myguystime-page-plan.md`.

> Older sessions archived in [JOURNEY_ARCHIVE.md](JOURNEY_ARCHIVE.md).

## Hard Rules

- Never commit `.env*` files. `.env.*` is git-ignored — keep it that way.
- Never put Supabase `service_role` (or any secret) in `VITE_*` / anon keys.
- All public Supabase tables use RLS (authenticated-only). New tables need explicit `GRANT`s.
- New Vercel API prefixes need their own `api/<prefix>/[...path].ts` file.
- Shipping follows [AGENTS.md](AGENTS.md): `npm run build` + `npm test` before every commit; commit to `main`
  (= release) only when Jeff asked for the work to go live; everything else on a branch.
- On Jeff's machine only: respect the mount quirks in `C:\Umbrella\UMBRELLA-GOTCHAS.md`.

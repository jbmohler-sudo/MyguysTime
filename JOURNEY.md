# MyGuys — JOURNEY

> The living story of this project. Read this first. Format defined by
> [`../JOURNEY_PROTOCOL.md`](../JOURNEY_PROTOCOL.md). Workspace mount quirks:
> [`../UMBRELLA-GOTCHAS.md`](../UMBRELLA-GOTCHAS.md).

## Current State

- **What it is:** timesheet/crew-board app — React/TypeScript + Node/Express. Auth is Supabase
  `ufbanjchatwkheaqafsf`. App data is Neon. Live at `app.myguystime.com` on Vercel (Hobby).
- **Live:** $12/mo company Stripe billing, checkout + webhook, Resend receipt on first paid
  period, 7-day no-card trial on new signups. Paid companies stay on `active`.
- **In progress:** `feat/landing-audit` — marketing landing pass (do not merge to `main` until
  that work is handed back).
- **Biggest open item:** finish the landing audit on the feature branch. Optional later:
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

## Session Log

### 2026-09-16 — Portfolio SEO pass (MyGuysTime property)
**Did:** SEO audit + remediation.
- **Canonical consolidation:** found the `<link rel="canonical">` pointed at the apex (`myguystime.com`) while Vercel domain config 308-redirects the apex to `www.myguystime.com`. Aligned all code-side signals to the www host instead of reversing the live routing: canonical, `og:url`, `og:image`, `twitter:image` now `https://www.myguystime.com/...`.
- **New `public/sitemap.xml`** — landing page + 3 live demo spokes (`/demo/admin`, `/demo/foreman`, `/demo/employee`), all on the www canonical host.
- **New `public/robots.txt`** — allow-all, `/api/` disallowed, sitemap declared.
- **Schema:** prerender now injects Organization + WebSite JSON-LD alongside SoftwareApplication + FAQPage (placeholders added in `index.html`; single canonical-host constant in `scripts/prerender-landing.mjs`).
- **Index hygiene:** inline script in `index.html` now adds `<meta name="robots" content="noindex">` on app hosts (`app.myguystime.com`, `myguystime.vercel.app`, previews) so only the landing host ranks.
- **Interlinking fix:** "Try the demo" button in the Trust section linked to `#workflow` despite its label — now points to `/demo/admin`.
- **Demo spokes:** each role view sets its own `document.title` ("Live Demo — Admin/Foreman/Crew Member View") instead of inheriting the landing title.
- **Link model:** audit found zero violations — only outbound links are `app.myguystime.com/login` (own app) and `mailto:jeff@myguystime.com`. No sibling-property links, no IronAtForty links.
- **Hero images (inventory, report only):** hero uses a CSS ProductPreview mockup (no photo). Founder-story section uses `public/images/myguystime-story-2x8.jpg` (authentic photo of handwritten hours on a board — on-brand, keep). OG image `public/images/og-myguystime.png`. Orphans worth cleaning later: `public/images/myguystime-story-hook.webp` (558 KB, unreferenced) and `src/assets/my-guys-time-option-b.png` (90 KB, unreferenced).
**Decided:** Canonical host = `www.myguystime.com` (matches the Vercel apex→www 308); code canonicals/sitemap follow the infrastructure, not the other way around.
**Killed:** The `#workflow` "Try the demo" mislabeled anchor.
**Deferred:** Removing the two orphan images; flipping the apex/www redirect direction (deliberate existing config — leave to Jeff).
**State after:** Pushed to `main`; Vercel auto-deploy verified READY, production URLs returning 200.
**Next:** Nothing open on SEO; next property in the sweep.

### 2026-09-13 — Stripe billing live, receipts, 7-day trial
**Did:** Shipped Checkout/portal/webhook, Vercel `api/billing` + `api/stripe` handlers, `/billing/sync` so pay unlocks without the webhook, Resend subscription receipt, 7-day trial on signup. Rotated/fixed Supabase+Neon keys earlier the same day (wrong project `pmwzgag…` first). Unlocked the paid test company after webhook 308s.
**Decided:** App trial (no card) for 7 days, then $12/mo. Receipts only when Stripe status is `active`. Webhook URL `https://app.myguystime.com/api/billing/webhook` (HTTPS; Stripe will not follow 308s).
**Killed:** Assuming `/api/[...path]` covers nested billing routes on Hobby.
**Deferred:** `sb_secret_` for Auth admin; grandfathering old unpaid companies; monthly invoice emails (confirmation receipt only).
**State after:** Billing + trial live on `main` / production (`1aa6b97` and later). Current working branch is `feat/landing-audit`.
**Next:** Landing audit on the feature branch. Do not push that work to `main` until handed back.

### 2026-09-13 — Company Stripe columns on Neon
**Did:** Added nullable `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`, `subscriptionTrialEndsAt` on `Company`. Applied `20260913143000_add_company_stripe_billing` via `migrate deploy`.
**Decided:** Columns land here first so Muse can push billing code without a duplicate ALTER.
**Deferred:** Stripe app code stays in Muse's workspace until they pull `main` and push.
**State after:** Neon has the four columns. Existing companies unchanged (all nullable).
**Next:** Muse pulls `main` and pushes billing only (no second migration).

### 2026-09-12 — Residue sweep (payroll ghost, onboarding, schema)
**Did:** Stopped timesheet save from writing PayrollEstimate; YTD/serialize now compute from hours. Replaced broken export-payroll onboarding step. Removed dead `login`/`startDemoSession` API fns. Regenerated `guys_schema_migration.sql` from Prisma with RLS + GRANT/REVOKE. Removed unused checkly/playwright/radix/cva/jiti deps. Applied ExpenseSubmission RLS SQL on Neon (full `migrate deploy` still blocked by stale history).
**Decided:** Leave the PayrollEstimate table in place; just stop writing it.
**Killed:** Checkly config pointing at a missing checks dir; tax tables in the hand-written schema dump.
**Deferred:** Prisma `_prisma_migrations` repair. Stale GitHub branch delete. Neon→Supabase move.
**State after:** Residue items from the audit are code-complete; Neon history still messy.
**Next:** Optional branch delete and migration-history cleanup.

### 2026-09-12 — Security session (signup takeover, RLS, CORS)
**Did:** Removed signup `updateUserById` recovery; reject pending-invite and existing Auth emails. Added ExpenseSubmission RLS + explicit REVOKE/GRANT. Scrubbed `.env.example`. JWT only from Bearer header. CORS and invite URLs use `APP_URL`/`CORS_ORIGINS`. Prod source maps only when uploading to Sentry.
**Decided:** Signup never resets an existing Auth password; invite acceptance remains the only password-set path for invited users.
**Killed:** Query-string JWT, reflect-any-origin CORS, real-looking password in `.env.example`.
**Deferred:** Credential rotation (user tonight). Stale GitHub branch delete. Ghost payroll / onboarding residue. Live-DB confirm of ExpenseSubmission exposure until migration is applied.
**State after:** Code-side exploitable signup bug closed; RLS migration ready to apply. Keys still live until user rotates them.
**Next:** Rotate Neon + Supabase keys, set `APP_URL`/`CORS_ORIGINS` on Vercel, apply the RLS migration, delete `claude/relaxed-austin-510c58`.

> Older sessions archived in [JOURNEY_ARCHIVE.md](JOURNEY_ARCHIVE.md).

## Hard Rules

- Never commit `.env*` files. `.env.*` is git-ignored — keep it that way.
- Never put Supabase `service_role` (or any secret) in `VITE_*` / anon keys.
- All public Supabase tables use RLS (authenticated-only). New tables need explicit `GRANT`s.
- New Vercel API prefixes need their own `api/<prefix>/[...path].ts` file.
- After ANY code change: commit and push to the current branch without being asked.
- Before file/git work, respect the mount quirks in [`../UMBRELLA-GOTCHAS.md`](../UMBRELLA-GOTCHAS.md).
- `feat/landing-audit` must not be merged or pushed to `main` until that work is handed back.

## 2026-09-23 — Marketing pages batch 1 (features/pricing/how-it-works/faq)

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

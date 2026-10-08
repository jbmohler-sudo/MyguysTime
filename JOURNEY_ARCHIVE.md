# MyGuys — JOURNEY archive

> Older Session Log entries rolled out of [JOURNEY.md](JOURNEY.md). Newest of these first.

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

### 2026-09-28 — Construction time tracking pillar built, held off main (4d1b590)
**Did:** Added `/construction-time-tracking` from the approved MGT-01 copy (`ConstructionTimeTrackingPage.tsx`), prerender with SoftwareApplication, FAQPage, and BreadcrumbList, sitemap URL 19, and inbound links from the homepage, seven trade pages, `/features`, `/how-it-works`, and the three `/vs` pages. Screenshot slots omitted. Template, cost-hub, ClockShark, and Connecteam links left off because those pages are not live. `npm run build` passed. Dist HTML: title `Construction Time Tracking for Small Crews | $12/mo Flat`, one H1, canonical `https://www.myguystime.com/construction-time-tracking`, `$12/mo` intact.
**Decided:** nothing new.
**Killed:** nothing.
**Deferred:** production release. `npm test` exited 1 in this environment (`assertSafeFixtureMutationContext`: no local `DATABASE_URL`, no Supabase fixture keys). Did not point tests at production Neon or Supabase, and did not push `main`.
**State after:** page is on `cursor/construction-time-tracking-dcd4` only. Live site unchanged.
**Next:** run `npm test` against a local fixture database, then commit to `main` and confirm the Vercel deploy.

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

### 2026-06-25 — Purge committed env secrets from git history
**Did:** Found `.env.production.vercel` and `.env.production.tmp` committed in history (live Neon
Postgres password + Supabase `service_role` key, plus anon keys/OIDC tokens). Sanitized both
on-disk files (values blanked, still git-ignored). Ran `git filter-repo` to remove both files from
all 136 commits across every branch; force-pushed `main` (`ee0c20b`→`a701c65`). Verified secrets
and files gone from all local and remote-tracking refs. Backup bundle saved at
`c:\Umbrella\MyGuysTime-backup-pre-filter-20260625.bundle`.
**Decided:** Scrub history now, rotate credentials next (history rewrite ≠ un-leak).
**Killed:** The two env files no longer exist anywhere in git history.
**Deferred:** **Credential rotation (Neon + Supabase) — still owed by the user, dashboard access required.**
**State after:** Repo and remote clean; on-disk env files sanitized and ignored; main at `a701c65`.
**Next:** Rotate the Neon `neondb_owner` password and roll the Supabase JWT secret; update Vercel env.

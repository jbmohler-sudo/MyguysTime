# MyGuys — JOURNEY archive

> Older Session Log entries rolled out of [JOURNEY.md](JOURNEY.md). Newest of these first.

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

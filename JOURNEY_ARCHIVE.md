# MyGuys — JOURNEY archive

> Older Session Log entries rolled out of [JOURNEY.md](JOURNEY.md). Newest of these first.

### 2026-10-12 — Structure fixes rebased onto main; Supercrew kept (24b8e04, 7320109)
**Did:** Rebased `structure-fixes-2026-10` onto current `main` (through the `/vs/supercrew` publish). Kept the Supercrew page and the structure fixes from 24b8e04: unknown public URLs return a noindex 404, breadcrumbs use real hubs, the homepage uses `MarketingFooter` with a Guides & tools column and body links to best-apps, the cost page, and the template, the pillar links Workyard, trade pages link the template, `/pricing`, and best-apps, `/vs` pages that lacked a body `/pricing` link get one, FAQPage JSON-LD matches the visible FAQs on the trades and the three older `/vs` pages, and `/demo/*` left the sitemap. Supercrew's BreadcrumbList middle crumb is Best Construction Time Tracking Apps (`/best-construction-time-tracking-apps`), same as the other `/vs` pages (7320109). Branch sitemap is 25 URLs (live 28 minus the three demo URLs). `/privacy` and `/terms` still have no page, so they 404. `npm run build` passed after the rebase, including `/vs/supercrew`.
**Decided:** nothing new. The 2026-10-09 structure decision still stands.
**Killed:** nothing.
**Deferred:** Claim-copy strings stay until Jeff confirms them. Topic H1 rewrites and the rest of the interlink matrix were not in this pass. `npm test` did not run (`DATABASE_URL` unset).
**State after:** Structure fixes plus Supercrew are on `structure-fixes-2026-10`. Not merged. Live `main` is still the 28-URL site.
**Next:** Leave PR #6 for Jeff. Do not merge until he says to ship.

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

### 2026-10-11 — Crew management + crew chiefs; cross-company timesheet fence (47ee53d, 282499c, 7839a13, on `feat/crew-management`)
**Did:** Investigated whether foremen/workers can log weekly hours and whether multi-crew companies work. Hour logging worked; crews did not: the only crew ever created was signup's "Main Crew", nothing set `Crew.foremanId` (only the seed did), invited foremen saw an empty board including their own week, a foreman could approve his own week, crew moves left the current week on the old crew, and `getAuthorizedTimesheet` returned any company's timesheet to any office login. Built on branch `feat/crew-management`: (1) 47ee53d stale test now expects 404 from the removed payroll export (it had failed on `main`, stopping `npm test` at case 2); (2) 282499c security: timesheets, crew-default hours and invite crews fenced to the caller's company, and a FOREMAN login with no worker record no longer matches every chief-less crew; (3) 7839a13 feature: `server/routes/crews.ts` (GET/POST `/api/crews`, PATCH/DELETE `/api/crews/:id`, PUT/DELETE `/api/crews/:id/members/:employeeId`, admin only), `CrewManagementPanel` at the top of the Team page (desktop and mobile), chief role sync, open weeks follow crew moves (employee edit form too), chief sees/submits his own week and the office approves it, foreman invite becomes chief of a chief-less crew, archiving releases a chief's crews, client permissions updated. Verified: `npm test` 43/43 (7 new cases; mutation check: reverting the fence and self-approval fixes makes those cases fail) against a throwaway local Postgres plus a fake Supabase Auth server, never hosted services; `npm run build` passes in the sandbox and natively on Jeff's Windows checkout; UI checked in a browser (office creates crew with chief, worker moved, board refreshes in place; new chief logs in as foreman and sees his crew and own week with Confirm and no Approve; 390px layout). Three old foreman tests used `employeeWeeks[0]`, which was the foreman's own week; they now target a crew member's week.
**Decided:** see the two 2026-10-11 Decisions Log rows (crew chief = foreman login; open weeks follow moves, office approves a chief's own week).
**Killed:** nothing. `CrewAssignment` stays in the schema but nothing reads it now.
**Deferred:** Crew archiving (removing a crew with timesheet history is refused; an archive flag needs a migration and Jeff's OK). Letting crew chiefs invite into their own crew. The remove-worker button still bounces the office to the dashboard (full-screen reload); crew edits refresh in place.
**State after:** `feat/crew-management` pushed (7839a13); Vercel preview deployment started from it. `main` unchanged. Jeff's checkout is back on `main`.
**Next:** Jeff reviews the branch (security fix included, so it needs his OK), then merge to `main`, confirm the production deploy is READY, and try it on a real company: add a second crew, pick a chief, invite him.

### 2026-10-09 — Week two wrap: 4 of 5 posts live, sitemap 27; week three briefed (fc9cdd3, 8ed149f, 5d9b028, 552541b)
**Did:** Week two (2026-10-05 to 10-09) shipped 4 of 5 planned posts, each from a Jeff-approved draft with `npm run build` passing: `/vs/busybusy` (10/5, fc9cdd3 + a1fe22d JOURNEY), `/vs/workyard` (10/6, 8ed149f + 67f56b9), `/best-construction-time-tracking-apps` (10/8, 5d9b028 + f97e2ae), `/guides/how-contractors-track-crew-hours` (10/9, 552541b + 979753e, with the real route, breadcrumb and 4 inbound links). Live https://www.myguystime.com/sitemap.xml fetched 2026-10-09 09:36 ET: 27 URLs, matches repo `public/sitemap.xml` (27); every published post is listed. Friday planning (seo-desk, off-repo) wrote five week-three briefs from the 2026-10-09 OpenSEO pull (GSC: first non-branded queries, "clockshark pricing" pos ~38-43, "quickbooks time alternative" pos 37; `/vs/quickbooks-time` avg pos 11.5). No code changes in this commit.
**Decided:** nothing new in-repo.
**Killed:** nothing.
**Deferred:** Wed 10/7 `/guides/crew-hours-quickbooks` (MGT-08) stays on HOLD until Jeff confirms CSV export; not live, not linked. `npm test` (no fixture DB in cloud; docs-only change). Search Console sitemap resubmit still manual.
**State after:** 27 sitemap URLs (3 are `/demo/*`). PR #6 (https://github.com/jbmohler-sudo/MyguysTime/pull/6, branch `structure-fixes-2026-10`: real 404s for unknown public paths, breadcrumbs sitewide, homepage shared footer + hub links, trade-page links, FAQPage JSON-LD, `/demo/*` removed from sitemap -> 24 URLs) is open, build passing, waiting on Jeff's merge OK. After merge `/privacy` and `/terms` will 404 (no pages exist). Week three planned (briefed, drafts not started): Mon 10/12 `/vs/supercrew` (Supercrew, ex-ConstructionClock); Tue 10/13 refresh of existing `/vs/quickbooks-time` (no new URL); Wed 10/14 `/templates/time-to-decimal-chart`; Thu 10/15 `/guides/do-1099-subs-get-overtime`; Fri 10/16 `/templates/construction-daily-report-template`.
**Next:** Jeff decides on PR #6 (merge early in the week so new pages build on it) and on CSV export for the QuickBooks guide; Blogs drafts week three for Jeff review; each post ships only on Jeff's yes, adds its URL to `public/sitemap.xml` (27 -> 31 on current main, or 24 -> 28 if PR #6 merges first), Vercel READY check, sitemap resubmit.

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

### 2026-10-02 — Connecteam comparison page live (9234ba5)
**Did:** Published `/vs/connecteam` from the ship-ready Friday copy. Added the connecteam config in `vs.tsx` (answer block, fit block, 5 FAQs, pain cards, comparison table, flow, callout, pills, closing CTA) and optional hero and table button labels so the other comparison pages keep their existing buttons. Prerender title, meta, OG, and self-canonical, plus SoftwareApplication for My Guys Time only (`price` "12", USD, P1M, per company per month), FAQPage from the 5 FAQs, and BreadcrumbList Home › Comparisons › Connecteam. Sitemap is 23 URLs. Inbound links: footer Comparisons column, pills on the other `/vs` pages, the cost hub compare list, and the pillar free-plans line. `npm run build` passed. Dist HTML: title `Connecteam Pricing & Alternative for Crews | My Guys Time`, one H1, canonical `https://www.myguystime.com/vs/connecteam`, dollar amounts are only `$12`. Page copy has no CSV, export, breaks, or petty cash. Same day, the "Is Connecteam worth it?" answer now reads "If you have 10 or fewer people," matching Connecteam's "free for up to 10 users" in the visible FAQ and the FAQPage JSON-LD (68f29df). `npm run build` passed; dist HTML contains that sentence in both places.
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

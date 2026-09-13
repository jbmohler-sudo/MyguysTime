# Work Order: Landing Page Audit Implementation (2026-09-13)

Source: zaino's full audit of the live myguystime.com landing page (screenshot + view-source).
Scope: `src/components/PublicHomepage.tsx`, `index.html`, build pipeline, public assets. **Do not touch app/auth/billing logic.**
Branch: `feat/landing-audit` off `main`. Do NOT push to main; hand back the branch. (Push to main deploys via Vercel.)

## P0 — SEO plumbing (highest value)

The deployed page ships `<div id="root"></div>` with zero content in raw HTML. Fix:

1. **Prerender the public homepage into `dist/index.html` at build time.**
   - Approach is your call (e.g. a `postbuild` script using `react-dom/server` renderToString of `PublicHomepage` injected into `#root`, with React hydration intact — `hydrateRoot` when the marker exists), but the acceptance test is non-negotiable:
     `curl` of the built `dist/index.html` (and `vite preview`) must contain the H1, section headings, body copy, pricing, and FAQ text as real HTML.
   - Hydration must not double-render or break the live demo buttons / login routing. Verify interactive elements still work in `vite preview` after hydration.
   - Beware: `PublicHomepage` may use browser-only APIs (posthog, window). Guard them for the SSR pass.
2. **Head tags** in `index.html`:
   - `<link rel="canonical" href="https://myguystime.com/" />`
   - Open Graph: `og:title`, `og:description`, `og:url`, `og:type=website`, `og:image` (create `public/images/og-myguystime.png`, 1200×630 — brand orange, logo mark, headline "Simple Time Cards for Contractor Crews — $12/mo flat". Generate with a script or canvas; keep it clean, no AI-art).
   - Twitter: `twitter:card=summary_large_image`, title/description/image.
   - Fix viewport: remove `maximum-scale=1.0, user-scalable=no` (keep `width=device-width, initial-scale=1`).
3. **JSON-LD** (two `<script type="application/ld+json">` blocks, either in index.html or rendered by the page):
   - `SoftwareApplication`: name "My Guys Time", applicationCategory "BusinessApplication", operatingSystem "Web", offers { price 12, priceCurrency USD, billing monthly }, description matching meta.
   - `FAQPage` with the six live FAQ Q&As, text kept in sync with the rendered FAQ (source both from one array so they can't drift).

## P1 — Conversion fixes

4. **Final dark "NO BLOAT" CTA section: add buttons.** Primary `Start my free week` (same signup route as hero), secondary `Try the demo`. Currently it dead-ends.
5. **Hero button diet.** Keep exactly two buttons in the hero CTA row: primary `Start my free week`, secondary `See how it works` (fix its two-line wrap — `whitespace-nowrap`). Remove `Install on this phone` from the hero; its content already lives in FAQ #1 ("Do I need to install anything?") — extend that answer with the install action/hint if a link exists. Keep the live-demo card and its three role buttons as-is.
6. **CTA color hierarchy.** All primary CTAs become solid brand orange with white text (hero, pricing card, final section, header `Start my free week`). Blue/periwinkle stays only for secondary/demo actions. Pricing-card CTA especially — it's currently washed-out periwinkle on white.
7. **Inline CTA after the founder story** — right after "…A contractor's app, made by one." add a single orange `Start my free week →` button (small, left-aligned with the story column).

## P2 — Copy (keep the contractor voice; these are surgical)

8. Replace both instances of "the missing middle between the job site and the office" wording:
   - "Why crews use it" heading → `Hours in the field. Totals in the office. Nothing in between.` (subhead: keep "Not a heavy office system. Just a clean way to check hours, review the week, and hand off time-card totals.")
   - Final dark section headline → `Hours in the truck. Totals in the office.` with existing "seventeen modules" subhead kept.
9. Founder story: change "Absurd that an app costs more because you hired another person." → `Why should the app cost more because you hired another guy?` Tighten the story to ~4 short paragraphs, keeping the beats: 2x6 behind the truck seat → second crew/Thursday 5pm → Play Store per-seat rage → "so I built it." No new claims, no invented details.
10. **Terminology sweep across the whole page**: standardize on `job site` (two words) and `time card` (noun, two words; `time-card` only as adjective e.g. "time-card totals"). One deliberate use of "timesheets" may remain (the CSV export line). Fix "Time-card ready" badge → `Time card ready`.

## P3 — Design/polish

11. **Remove the AI "stressed guy with floating equations" image** (`myguystime-story-hook.webp`). Keep only `myguystime-story-2x8.jpg` (tailgate handwriting) in the story section, with a proper descriptive `alt`. Jeff may supply a real photo later — leave the img easy to swap.
12. **Fix the How-It-Works step timeline**: numbers all on the same side, cards vertically aligned (no accidental-looking zig-zag/offset), connector line actually continuous between steps 1→4. Remove the chevrons on step cards if they're not interactive.
13. **FAQ alignment**: cards align to the same left edge as the "Asked by contractors" heading.
14. **Eyebrow contrast**: darken the small orange all-caps labels one step (e.g. orange-600/700) so small text passes WCAG AA on white/cream.
15. **Footer**: add Contact (mailto or existing route), and Privacy/Terms links if those pages/routes exist in the app — if they don't exist, add a simple static Privacy + Terms page only if trivially cheap, otherwise leave a TODO comment and skip (do NOT invent legal copy).

## Acceptance (run these, report actual output)

- `npm run build` clean; `npm test` (tsc + tests) passes or fails only on pre-existing issues (list them).
- `curl -s http://localhost:4173/ | grep` shows H1 text, "One price. The whole crew.", an FAQ question, canonical, og:image, and both JSON-LD blocks in raw HTML via `vite preview`.
- Screenshot of hero, pricing, final CTA at desktop + 390px mobile width; confirm hydration works (demo role buttons navigate).
- Validate both JSON-LD blocks parse (node JSON.parse on extracted blocks is fine).
- Report: files changed, before/after of raw-HTML SEO content, any deviations from this spec with reasoning.

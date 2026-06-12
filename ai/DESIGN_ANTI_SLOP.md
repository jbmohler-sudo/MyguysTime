# Design Anti-Slop Rules

Based on [Impeccable's 46-pattern catalog](https://impeccable.style/slop/) — the visible tells of AI-generated design. These rules apply to all marketing pages, landing pages, and UI work in this project.

---

## Never Use

These patterns are banned outright. They scream AI-generated and undermine credibility.

### Typography
- **Italic serif display headlines** — no oversized italic serif as the hero headline. Set it roman or use a non-serif display face.
- **Oversized hero headlines** — a full sentence blown up to display size leaves no room above the fold. Keep long headlines smaller; only punchy 1-2 word headlines should be display size.
- **Single font for everything** — pair a display font with a body font. One font = flat hierarchy = AI tell.
- **Crushed letter spacing** — don't pull tracking tighter than characters can hold their shape. Optical tightening only.
- **All-caps body text** — uppercase is for short labels and headings only.
- **Icon tile stacked above heading** — the rounded-square icon container above a heading is the default AI feature-card template. Use side-by-side or inline instead.
- **Repeated section kicker labels** — tiny uppercase tracked labels above every section heading ("Features", "Pricing", "About") is AI editorial scaffolding.

### Color & Contrast
- **Purple/violet gradients** — purple-to-blue on buttons, text, backgrounds, orbs. The single biggest AI color tell.
- **Gradient text** — decorative, not meaningful. Use solid colors for text always.
- **Cream/beige palette** — the "tasteful" AI default surface. Choose a deliberate palette.

### Layout
- **Side-tab accent border** — thick colored border on one side of a card. The most recognizable AI UI tell. Remove entirely.
- **Border accent on rounded element** — thick accent border clashing with border-radius.
- **Numbered section markers (01 / 02 / 03)** — AI editorial scaffold. Numbers only when the content is actually a sequence.
- **Hero metric layout** — big number + small label + three supporting stats + gradient accent. Used everywhere, trusted nowhere.

### Copy
- **Marketing buzzwords** — "supercharge", "streamline", "empower", "world-class", "enterprise-grade", "next-generation". Say what the product literally does.
- **Theater framing** — dismissing something as "theater" is a generated-copy tic.

### Motion
- **Bounce/elastic easing** — no spring-in dialogs or overshoot cards. Use smooth ease-out.
- **Image hover transforms** — no scale/rotate on image hover. Let imagery sit still.

---

## Use Sparingly

These patterns aren't inherently bad but become AI tells when overused. One instance is fine; a pattern is the problem.

### Typography
- **Hero eyebrow / pill chip** — a tiny uppercase label above a hero headline. Fine once, but don't repeat the pattern across sections.
- **Flat type hierarchy** — font sizes too close together. Aim for at least 1.25 ratio between steps.
- **Overused fonts** — Inter, Geist, Space Grotesk, Instrument Serif. If using one, pair it distinctively.
- **Wide letter spacing on body** — reserve wide tracking for short uppercase labels only.

### Visual Details
- **Glassmorphism** — blur effects and glass cards as decoration. Only use to solve a real layering problem.
- **Hairline border + wide shadow** — commit to one: a defined edge or soft elevation, not both.
- **Extreme border-radius on cards** — over-rounding into blobs. Cards top out around 12-16px radius.
- **Repeating-gradient stripes** — as surface decoration, it's an AI signature.

### Color & Contrast
- **Dark mode with glowing accents** — colored box-shadow glows are the default AI "cool" look. If doing dark mode, use subtle purposeful lighting.

### Layout
- **Identical card grids** — same-sized cards with icon + heading + text repeated 6x. Vary card sizes, layouts, or content types.
- **Monotonous spacing** — same gap everywhere. Use tight groupings for related items, generous separations between sections.
- **Nested cards** — cards inside cards. Flatten with spacing, typography, and dividers instead.
- **Copy-paste layouts** — same hero-metric-features template repeated with different colors.

### Copy
- **Em-dash overuse** — more than a couple per page is an AI cadence tell.
- **Aphoristic-cadence copy** — "Not a feature. A platform." Once is fine; the repeated pattern is the tell.

---

## Quality Rules (Always Enforce)

These aren't about AI detection — they're about not shipping broken design.

- **Cramped padding** — at least 8px inside bordered/colored containers, ideally 12-16px.
- **Body text touching viewport edge** — wrap content with at least 16px horizontal padding.
- **Low contrast text** — meet WCAG AA: 4.5:1 for body, 3:1 for large text.
- **Gray text on colored background** — use a darker shade of the background color instead.
- **Skipped heading levels** — don't jump from h1 to h3. Screen readers need the hierarchy.
- **Tight line height** — use 1.5-1.7x for body text.
- **Tiny body text** — minimum 14px for body, 16px ideal.
- **Justified text** — creates rivers of whitespace without hyphenation. Use text-align: left.
- **Line length too long** — cap text containers at 65-75ch.
- **Content overflow** — let text wrap, constrain widths, or add scroll affordance.
- **Layout property animation** — animate transform/opacity, not width/height/padding/margin.
- **Broken/placeholder images** — no empty src or placeholder values shipping to production.

---


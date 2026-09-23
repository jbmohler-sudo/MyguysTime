/**
 * Post-build prerender for the myguystime.com marketing pages.
 *
 * Runs after `vite build`. Renders each marketing page to static HTML and
 * writes dist/<route>/index.html (homepage keeps dist/index.html), injecting
 * the markup inside #root with a marker the client entry uses to switch from
 * createRoot to hydrateRoot (no double render).
 *
 * The React rendering happens inside the SSR bundle
 * (dist/ssr/public-homepage.mjs, built from scripts/public-homepage-ssr-entry.tsx)
 * so the markup and hooks share one React copy — importing react-dom/server
 * out here would create a second React and blow up on hooks.
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");
const templatePath = path.join(distDir, "index.html");
const ssrEntryPath = path.join(distDir, "ssr", "public-homepage.mjs");

if (!fs.existsSync(templatePath)) {
  console.error("[prerender] dist/index.html not found — run `vite build` first.");
  process.exit(1);
}

if (!fs.existsSync(ssrEntryPath)) {
  console.error("[prerender] dist/ssr/public-homepage.mjs not found — SSR entry missing from build.");
  process.exit(1);
}

const canonicalHost = "https://www.myguystime.com";

let ssr;
try {
  ssr = await import(url.pathToFileURL(ssrEntryPath).href);
} catch (error) {
  console.error("[prerender] SSR bundle import failed — shipping empty shell. Error:", error);
  process.exit(1);
}

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "My Guys Time",
  url: canonicalHost + "/",
  logo: canonicalHost + "/images/og-myguystime.png",
  description: "Simple time cards for contractor crews. Track crew hours, review the week, and export clean time card totals. $12/mo flat.",
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "My Guys Time",
  url: canonicalHost + "/",
  publisher: { "@type": "Organization", name: "My Guys Time", url: canonicalHost + "/" },
};

const softwareApplicationLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "My Guys Time",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "12", priceCurrency: "USD" },
  description: "Simple time cards for contractor crews. Track crew hours, review the week, and export clean time card totals. $12/mo flat.",
};

const homeFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: (ssr.faqItems ?? []).map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const faqPageLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: (ssr.faqPageItems ?? []).map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

function webPageLd(title, routePath, description) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url: canonicalHost + routePath,
    description,
    isPartOf: { "@type": "WebSite", name: "My Guys Time", url: canonicalHost + "/" },
  };
}

// [pageRoute, outFile, renderFn, title, description, ldBlocks, requiredSnippets]
const pages = [
  [
    "/",
    "index.html",
    () => ssr.renderLandingHtml(),
    "My Guys Time — Simple Time Cards for Contractor Crews | $12/mo Flat",
    "Track crew hours, review the week, and export clean time card totals. Simple time tracking for contractors and small crews.",
    [
      ["ld-softwareapplication", softwareApplicationLd],
      ["ld-faqpage", homeFaqLd],
      ["ld-organization", organizationLd],
      ["ld-website", websiteLd],
    ],
    [
      "Track crew hours without the Thursday-at-5pm scramble",
      "One price. The whole crew.",
      "Asked by contractors, answered straight",
      "Do I pay per employee?",
    ],
  ],
  [
    "/features",
    "features/index.html",
    () => ssr.renderFeaturesHtml(),
    "Timesheet App Features for Contractor Crews | My Guys Time",
    "Weekly crew board, truck-ready hour entry, CSV exports, reimbursements, and mixed W-2/1099 crews. $12/mo flat — no per-seat fees.",
    [
      ["ld-softwareapplication", softwareApplicationLd],
      ["ld-organization", organizationLd],
      ["ld-website", websiteLd],
    ],
    ["Every feature earns its place."],
  ],
  [
    "/pricing",
    "pricing/index.html",
    () => ssr.renderPricingHtml(),
    "Pricing — $12/mo Flat for the Whole Crew | My Guys Time",
    "One price covers every foreman, worker, and office user. 7-day free trial, cancel anytime. No per-seat fees, no tiers.",
    [
      ["ld-softwareapplication", softwareApplicationLd],
      ["ld-organization", organizationLd],
      ["ld-website", websiteLd],
    ],
    ["One price. The whole crew."],
  ],
  [
    "/how-it-works",
    "how-it-works/index.html",
    () => ssr.renderHowItWorksHtml(),
    "How It Works — Weekly Crew Time Cards | My Guys Time",
    "Crew logs hours from the field, the office reviews the week, adjusts, and exports clean CSV time cards. Four steps, no bloat.",
    [
      ["ld-organization", organizationLd],
      ["ld-website", websiteLd],
    ],
    ["Four steps. Every week."],
  ],
  [
    "/faq",
    "faq/index.html",
    () => ssr.renderFaqHtml(),
    "FAQ — Contractor Time Tracking Questions | My Guys Time",
    "Do I pay per employee? Is there an install? How do 1099 subs work? Straight answers about My Guys Time.",
    [
      ["ld-faqpage", faqPageLd],
      ["ld-organization", organizationLd],
      ["ld-website", websiteLd],
    ],
    ["Asked by contractors, answered straight"],
  ],
];

// Trade pages — [slug, trade name, page title, meta description, H1 snippet]
const tradePages = [
  ["roofing", "Roofing", "Roofing Time Tracking for Roofing Crews | My Guys Time",
    "Tear-off and install crews, weather days, and 1099 subs — log roofing hours from the field. $12/mo flat, no per-seat fees.",
    "Roofing hours, tracked from the ground."],
  ["masonry", "Masonry", "Masonry Time Tracking for Masonry Crews | My Guys Time",
    "Block, brick, stone, and hardscapes — daily hour logging from the field for masonry crews. $12/mo flat, no per-seat fees.",
    "Masonry hours without the Thursday scramble."],
  ["landscaping", "Landscaping", "Landscaping Time Tracking for Landscaping Crews | My Guys Time",
    "Mowing routes and install crews on one weekly board. Seasonal hires logging day one. $12/mo flat, no per-seat fees.",
    "Mowing routes and install crews, one weekly review."],
  ["painting", "Painting", "Time Tracking for Painting Crews | My Guys Time",
    "Prep days, paint days, and touch-up callbacks — log painting hours the day they're worked. $12/mo flat, no per-seat fees.",
    "Prep days, paint days, one clean time card."],
  ["plumbing", "Plumbing", "Plumbing Time Tracking for Service & Construction | My Guys Time",
    "Service calls, rough-ins, apprentices, and on-call hours — with W-2/1099 cleanly separated. $12/mo flat.",
    "Service calls and rough-ins, hours that add up."],
  ["electrical", "Electrical", "Electrical Time Tracking for Electricians | My Guys Time",
    "Service trucks, construction crews, apprentices, and emergency call-outs — every hour accounted for. $12/mo flat.",
    "Every hour on every job, accounted for."],
  ["general-contracting", "General Contracting", "Time Tracking for General Contractors | My Guys Time",
    "Your W-2 crew and your 1099 subs on one weekly board, cleanly separated for payroll and 1099s. $12/mo flat.",
    "Your crew and your subs, one weekly payroll picture."],
];

for (const [slug, trade, title, description, h1] of tradePages) {
  pages.push([
    `/trades/${slug}`,
    `trades/${slug}/index.html`,
    () => ssr.renderTradeHtml(slug),
    title,
    description,
    [
      ["ld-softwareapplication", softwareApplicationLd],
      ["ld-organization", organizationLd],
      ["ld-website", websiteLd],
    ],
    [h1, `For ${trade === "General Contracting" ? "GC crews" : trade.toLowerCase() + " crews"}`],
  ]);
}

const template = fs.readFileSync(templatePath, "utf8");
const rootMarker = '<div id="root">';
const hydrationFlag = '<div id="root" data-prerendered="true">';
if (!template.includes(rootMarker)) {
  console.error("[prerender] #root not found in dist/index.html.");
  process.exit(1);
}

function replaceMeta(html, attr, name, value) {
  // Matches <meta ... attr="name" ... content="..." /> across line breaks.
  const re = new RegExp(`<meta([^>]*?)${attr}="${name}"([^>]*?)content="[^"]*"([^>]*?)/?>`, "s");
  if (!re.test(html)) {
    console.error(`[prerender] meta ${attr}="${name}" not found in template.`);
    process.exit(1);
  }
  // Replacement FUNCTION: a string replacement would treat $ sequences in
  // value (e.g. "$12/mo") as capture-group references and corrupt the output.
  return html.replace(re, (m, g1, g2, g3) => `<meta${g1}${attr}="${name}"${g2}content="${value}"${g3}/>`);
}

for (const [routePath, outFile, renderFn, title, description, ldBlocks, snippets] of pages) {
  let markup = "";
  try {
    markup = renderFn();
  } catch (error) {
    console.error(`[prerender] render failed for ${routePath} — aborting. Error:`, error);
    process.exit(1);
  }
  if (!markup || markup.length < 200) {
    console.error(`[prerender] rendered markup for ${routePath} suspiciously short, refusing to inject.`);
    process.exit(1);
  }

  let finalHtml = template.replace(rootMarker, `${hydrationFlag}${markup}</div>`);

  // <title>
  if (!/<title>[^<]*<\/title>/.test(finalHtml)) {
    console.error("[prerender] <title> not found in template.");
    process.exit(1);
  }
  finalHtml = finalHtml.replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`);

  // Meta + OG/Twitter + canonical — all page-specific (no duplicate-meta repeats).
  const canonical = canonicalHost + routePath;
  finalHtml = replaceMeta(finalHtml, "name", "description", description);
  finalHtml = replaceMeta(finalHtml, "property", "og:title", title);
  finalHtml = replaceMeta(finalHtml, "property", "og:description", description);
  finalHtml = replaceMeta(finalHtml, "property", "og:url", canonical);
  finalHtml = replaceMeta(finalHtml, "name", "twitter:title", title);
  finalHtml = replaceMeta(finalHtml, "name", "twitter:description", description);
  if (!/<link rel="canonical" href="[^"]*" \/>/.test(finalHtml)) {
    console.error("[prerender] canonical link not found in template.");
    process.exit(1);
  }
  finalHtml = finalHtml.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${canonical}" />`,
  );

  // JSON-LD — FAQ text is sourced from the same arrays the pages render,
  // so structured data and visible copy cannot drift.
  const wanted = new Map(ldBlocks);
  // Every sub-page also gets a WebPage block naming its own URL.
  if (routePath !== "/") {
    wanted.set("ld-webpage", webPageLd(title, routePath, description));
  }
  for (const id of ["ld-softwareapplication", "ld-faqpage", "ld-organization", "ld-website", "ld-webpage"]) {
    const openTag = `<script type="application/ld+json" id="${id}">`;
    const closeTag = "</" + "script>";
    const start = finalHtml.indexOf(openTag);
    const data = wanted.get(id);
    if (data) {
      if (start === -1) {
        // Template only ships 4 placeholders; webpage block is appended before </head>.
        if (id !== "ld-webpage") {
          console.error(`[prerender] JSON-LD placeholder #${id} not found in template.`);
          process.exit(1);
        }
        finalHtml = finalHtml.replace(
          "</head>",
          `    ${openTag}\n    ${JSON.stringify(data)}\n    ${closeTag}\n  </head>`,
        );
      } else {
        const contentStart = start + openTag.length;
        const end = finalHtml.indexOf(closeTag, contentStart);
        finalHtml = finalHtml.slice(0, contentStart) + "\n" + JSON.stringify(data) + "\n" + finalHtml.slice(end);
      }
    } else if (start !== -1) {
      // Page doesn't want this block — remove the empty placeholder tag.
      const contentStart = start + openTag.length;
      const end = finalHtml.indexOf(closeTag, contentStart) + closeTag.length;
      finalHtml = finalHtml.slice(0, start) + finalHtml.slice(end);
    }
  }

  // Sanity gate: the acceptance contract requires real content in raw HTML.
  const missing = snippets.filter((snippet) => !finalHtml.includes(snippet));
  if (missing.length > 0) {
    console.error(`[prerender] ${routePath} injected markup missing required content:`, missing);
    process.exit(1);
  }

  // JSON-LD must parse — validate all injected blocks before writing.
  for (const [id] of wanted) {
    const match = finalHtml.match(new RegExp(`<script type="application/ld\\+json" id="${id}">([\\s\\S]*?)<`));
    if (!match) {
      console.error(`[prerender] JSON-LD block #${id} missing from ${routePath} output.`);
      process.exit(1);
    }
    try {
      JSON.parse(match[1]);
    } catch (error) {
      console.error(`[prerender] JSON-LD block #${id} does not parse on ${routePath}:`, error.message);
      process.exit(1);
    }
  }

  const outPath = path.join(distDir, outFile);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, finalHtml);
  console.log(`[prerender] ${routePath} -> dist/${outFile} (${finalHtml.length} chars).`);
}

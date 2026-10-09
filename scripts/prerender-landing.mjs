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

function breadcrumbLd(crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: canonicalHost + crumb.path,
    })),
  };
}

function faqPageLdFrom(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

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

const constructionRoute = "/construction-time-tracking";

if (!Array.isArray(ssr.constructionFaqItems) || ssr.constructionFaqItems.length !== 9) {
  console.error("[prerender] construction FAQ array missing or not 9 items — refusing to ship drifted JSON-LD.");
  process.exit(1);
}

const constructionFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ssr.constructionFaqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const constructionSoftwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "My Guys Time",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: canonicalHost + constructionRoute,
  offers: {
    "@type": "Offer",
    price: "12",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: 12,
      priceCurrency: "USD",
      billingDuration: "P1M",
      unitText: "per company per month",
    },
  },
};

const constructionBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: canonicalHost + "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Construction Time Tracking",
      item: canonicalHost + constructionRoute,
    },
  ],
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
      "compare crew time tracking apps",
      "what crew time tracking apps cost",
      "free construction timesheet template",
      'href="/pricing"',
      "What crew time apps cost",
      "How contractors track crew hours",
      "vs Workyard",
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
  [
    constructionRoute,
    "construction-time-tracking/index.html",
    () => ssr.renderConstructionTimeTrackingHtml(),
    "Construction Time Tracking for Small Crews | $12/mo Flat",
    "Log crew hours from the truck, review the week in the office, export clean CSV totals. Built by a contractor. $12/mo flat for the whole crew. 7 days free.",
    [
      ["ld-softwareapplication", constructionSoftwareLd],
      ["ld-faqpage", constructionFaqLd],
      ["ld-breadcrumb", constructionBreadcrumbLd],
      ["ld-organization", organizationLd],
      ["ld-website", websiteLd],
    ],
    [
      "Construction Time Tracking for Small Crews, Built by a Contractor",
      "The simplest way to track construction crew hours",
      "How much does a construction clock time tracker cost?",
      "$12/mo",
      "how contractors track crew hours",
      "/guides/how-contractors-track-crew-hours",
      "per-user GPS pricing",
      "/vs/workyard",
    ],
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
  const tradeFaqs = typeof ssr.tradePageFaqs === "function" ? ssr.tradePageFaqs(slug) : [];
  if (!Array.isArray(tradeFaqs) || tradeFaqs.length !== 3) {
    console.error(`[prerender] ${slug} trade FAQ array missing or not 3 items — refusing to ship drifted JSON-LD.`);
    process.exit(1);
  }
  const tradeRoute = `/trades/${slug}`;
  pages.push([
    tradeRoute,
    `trades/${slug}/index.html`,
    () => ssr.renderTradeHtml(slug),
    title,
    description,
    [
      ["ld-softwareapplication", softwareApplicationLd],
      ["ld-faqpage", faqPageLdFrom(tradeFaqs)],
      ["ld-breadcrumb", breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Construction Time Tracking", path: constructionRoute },
        { name: `${trade} Time Tracking`, path: tradeRoute },
      ])],
      ["ld-organization", organizationLd],
      ["ld-website", websiteLd],
    ],
    [
      h1,
      `For ${trade === "General Contracting" ? "GC crews" : trade.toLowerCase() + " crews"}`,
      `${trade} Time Tracking`,
      "free printable construction timesheet template",
      "$12/month flat for the whole crew",
      "compare crew time tracking apps",
      tradeFaqs[0].q,
      tradeFaqs[0].a,
    ],
  ]);
}
// Comparison pages — [slug, name, page title, meta description, H1 snippet]
const vsPages = [
  ["paper-timesheets", "Paper Timesheets", "Paper Timesheets vs My Guys Time | Contractor Time Cards",
    "Still running crew hours on paper time cards? Lost hours, Thursday-night reconstruction, unreadable handwriting — see what changes with $12/mo flat time cards.",
    "Retire the paper time card."],
  ["quickbooks-time", "QuickBooks Time", "QuickBooks Time Alternative for Contractors | My Guys Time",
    "QuickBooks Time charges per user — every hire raises the bill. My Guys Time is $12/mo flat for the whole company. Contractor time tracking without per-seat pricing.",
    "Stop paying per head."],
  ["spreadsheets", "Spreadsheets", "Spreadsheet Time Tracking vs My Guys Time | $12/mo Flat",
    "If your time-tracking 'system' is a spreadsheet rebuilt every Thursday at 5pm, you're paying for it in lost hours. Daily field logging, one weekly review, clean CSV export.",
    "Kill the Thursday spreadsheet."],
];

for (const [slug, name, title, description, h1] of vsPages) {
  const legacyFaqs = typeof ssr.vsPageFaqs === "function" ? ssr.vsPageFaqs(slug) : [];
  if (!Array.isArray(legacyFaqs) || legacyFaqs.length !== 3) {
    console.error(`[prerender] ${slug} FAQ array missing or not 3 items — refusing to ship drifted JSON-LD.`);
    process.exit(1);
  }
  const vsRoute = `/vs/${slug}`;
  const currentCrumb = `${name} vs My Guys Time`;
  pages.push([
    vsRoute,
    `vs/${slug}/index.html`,
    () => ssr.renderVsHtml(slug),
    title,
    description,
    [
      ["ld-softwareapplication", softwareApplicationLd],
      ["ld-faqpage", faqPageLdFrom(legacyFaqs)],
      ["ld-breadcrumb", breadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Best Construction Time Tracking Apps", path: "/best-construction-time-tracking-apps" },
        { name: currentCrumb, path: vsRoute },
      ])],
      ["ld-organization", organizationLd],
      ["ld-website", websiteLd],
    ],
    [
      h1,
      `My Guys Time vs ${name}`,
      currentCrumb,
      "Best Construction Time Tracking Apps",
      "$12/month flat for the whole crew",
      legacyFaqs[0].q,
      legacyFaqs[0].a,
      ...(slug === "paper-timesheets" ? ["how contractors track crew hours: paper vs sheet vs app"] : []),
      ...(slug === "spreadsheets" ? ["how other contractors track crew hours"] : []),
    ],
  ]);
}

const clocksharkRoute = "/vs/clockshark";
const clocksharkFaqs = typeof ssr.vsPageFaqs === "function" ? ssr.vsPageFaqs("clockshark") : [];
if (!Array.isArray(clocksharkFaqs) || clocksharkFaqs.length !== 5) {
  console.error("[prerender] clockshark FAQ array missing or not 5 items — refusing to ship drifted JSON-LD.");
  process.exit(1);
}

const clocksharkFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: clocksharkFaqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const clocksharkSoftwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "My Guys Time",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: canonicalHost + clocksharkRoute,
  offers: {
    "@type": "Offer",
    price: "12",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "12",
      priceCurrency: "USD",
      billingDuration: "P1M",
      unitText: "per company per month",
    },
  },
  description:
    "Simple time cards for contractor crews. Track crew hours, review the week, and export clean time card totals. $12/mo flat.",
};

const clocksharkBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: canonicalHost + "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Best Construction Time Tracking Apps",
      item: canonicalHost + "/best-construction-time-tracking-apps",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "ClockShark",
      item: canonicalHost + clocksharkRoute,
    },
  ],
};

pages.push([
  clocksharkRoute,
  "vs/clockshark/index.html",
  () => ssr.renderVsHtml("clockshark"),
  "ClockShark Pricing vs $12 Flat for Crews | My Guys Time",
  "ClockShark bills a base fee plus every user. My Guys Time is $12/mo flat for the whole company: crew time cards, weekly review, CSV exports. 7 days free.",
  [
    ["ld-softwareapplication", clocksharkSoftwareLd],
    ["ld-faqpage", clocksharkFaqLd],
    ["ld-breadcrumb", clocksharkBreadcrumbLd],
    ["ld-organization", organizationLd],
    ["ld-website", websiteLd],
  ],
  [
    "ClockShark vs My Guys Time: Per-User Pricing or One Flat Price",
    "My Guys Time vs ClockShark",
    "$12",
  ],
]);

const connecteamRoute = "/vs/connecteam";
const connecteamFaqs = typeof ssr.vsPageFaqs === "function" ? ssr.vsPageFaqs("connecteam") : [];
if (!Array.isArray(connecteamFaqs) || connecteamFaqs.length !== 5) {
  console.error("[prerender] connecteam FAQ array missing or not 5 items — refusing to ship drifted JSON-LD.");
  process.exit(1);
}

const connecteamFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: connecteamFaqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const connecteamSoftwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "My Guys Time",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: canonicalHost + connecteamRoute,
  offers: {
    "@type": "Offer",
    price: "12",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "12",
      priceCurrency: "USD",
      billingDuration: "P1M",
      unitText: "per company per month",
    },
  },
  description:
    "A weekly crew time card built by a contractor. $12/mo flat for the whole company.",
};

const connecteamBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: canonicalHost + "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Best Construction Time Tracking Apps",
      item: canonicalHost + "/best-construction-time-tracking-apps",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Connecteam",
      item: canonicalHost + connecteamRoute,
    },
  ],
};

pages.push([
  connecteamRoute,
  "vs/connecteam/index.html",
  () => ssr.renderVsHtml("connecteam"),
  "Connecteam Pricing & Alternative for Crews | My Guys Time",
  "Connecteam is free for up to 10 users and built as an all-in-one employee app. My Guys Time is a crew time card built by a contractor, $12/mo flat.",
  [
    ["ld-softwareapplication", connecteamSoftwareLd],
    ["ld-faqpage", connecteamFaqLd],
    ["ld-breadcrumb", connecteamBreadcrumbLd],
    ["ld-organization", organizationLd],
    ["ld-website", websiteLd],
  ],
  [
    "Connecteam vs My Guys Time: All-in-One App or Crew Time Card",
    "My Guys Time vs Connecteam",
    "free for up to 10 users",
    "https://connecteam.com/pricing/",
    "$12",
    "Best Construction Time Tracking Apps",
    "$12/month flat for the whole crew",
  ],
]);

const busybusyRoute = "/vs/busybusy";
const busybusyFaqs = typeof ssr.vsPageFaqs === "function" ? ssr.vsPageFaqs("busybusy") : [];
if (!Array.isArray(busybusyFaqs) || busybusyFaqs.length !== 5) {
  console.error("[prerender] busybusy FAQ array missing or not 5 items — refusing to ship drifted JSON-LD.");
  process.exit(1);
}

const busybusyFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: busybusyFaqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const busybusySoftwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "My Guys Time",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: canonicalHost + busybusyRoute,
  offers: {
    "@type": "Offer",
    price: "12",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "12",
      priceCurrency: "USD",
      billingDuration: "P1M",
      unitText: "per company per month",
    },
  },
  description:
    "A weekly crew time card built by a contractor. $12/mo flat for the whole company.",
};

const busybusyBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: canonicalHost + "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Best Construction Time Tracking Apps",
      item: canonicalHost + "/best-construction-time-tracking-apps",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "BusyBusy",
      item: canonicalHost + busybusyRoute,
    },
  ],
};

pages.push([
  busybusyRoute,
  "vs/busybusy/index.html",
  () => ssr.renderVsHtml("busybusy"),
  "BusyBusy Pricing vs $12 Flat for Crews | My Guys Time",
  "BusyBusy has a Free plan, and its paid plans bill per user plus an admin license. My Guys Time is $12/mo flat for the whole company. Built by a mason.",
  [
    ["ld-softwareapplication", busybusySoftwareLd],
    ["ld-faqpage", busybusyFaqLd],
    ["ld-breadcrumb", busybusyBreadcrumbLd],
    ["ld-organization", organizationLd],
    ["ld-website", websiteLd],
  ],
  [
    "BusyBusy vs My Guys Time: Per-User Pricing or One Flat Price",
    "My Guys Time vs BusyBusy",
    "https://busybusy.com/price/",
    "$12/mo",
  ],
]);

const workyardRoute = "/vs/workyard";
const workyardFaqs = typeof ssr.vsPageFaqs === "function" ? ssr.vsPageFaqs("workyard") : [];
if (!Array.isArray(workyardFaqs) || workyardFaqs.length !== 5) {
  console.error("[prerender] workyard FAQ array missing or not 5 items — refusing to ship drifted JSON-LD.");
  process.exit(1);
}

const workyardFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: workyardFaqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const workyardSoftwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "My Guys Time",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: canonicalHost + workyardRoute,
  offers: {
    "@type": "Offer",
    price: "12",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "12",
      priceCurrency: "USD",
      billingDuration: "P1M",
      unitText: "per company per month",
    },
  },
  description:
    "A weekly crew time card built by a contractor. $12/mo flat for the whole company.",
};

const workyardBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: canonicalHost + "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Best Construction Time Tracking Apps",
      item: canonicalHost + "/best-construction-time-tracking-apps",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Workyard",
      item: canonicalHost + workyardRoute,
    },
  ],
};

pages.push([
  workyardRoute,
  "vs/workyard/index.html",
  () => ssr.renderVsHtml("workyard"),
  "Workyard Pricing vs $12 Flat for Crews | My Guys Time",
  "Workyard prices per user per month across Starter, Pro, and Autopilot plans. My Guys Time is $12/mo flat for the whole company. Built by a mason.",
  [
    ["ld-softwareapplication", workyardSoftwareLd],
    ["ld-faqpage", workyardFaqLd],
    ["ld-breadcrumb", workyardBreadcrumbLd],
    ["ld-organization", organizationLd],
    ["ld-website", websiteLd],
  ],
  [
    "Workyard vs My Guys Time: Per-User GPS Ops or Flat Crew Card",
    "My Guys Time vs Workyard",
    "https://www.workyard.com/pricing",
    "No GPS, by choice",
    "best time tracking apps for small construction crews",
    "$12/mo",
    "Best Construction Time Tracking Apps",
    "$12/month flat for the whole crew",
  ],
]);

const costRoute = "/construction-time-tracking-cost";
const costTitle = "Construction Time Tracking Cost: Per-Seat vs Flat Pricing";
const costDescription =
  "How construction time tracking apps are priced: per user, capped free plans, or flat. Run the math on your crew. My Guys Time is $12/mo flat for everyone.";

if (!Array.isArray(ssr.costFaqItems) || ssr.costFaqItems.length !== 5) {
  console.error("[prerender] cost FAQ array missing or not 5 items — refusing to ship drifted JSON-LD.");
  process.exit(1);
}

const costFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ssr.costFaqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const costSoftwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "My Guys Time",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: canonicalHost + costRoute,
  offers: {
    "@type": "Offer",
    price: "12",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "12",
      priceCurrency: "USD",
      billingDuration: "P1M",
      unitText: "per company per month",
    },
  },
  description:
    "Construction time tracking at one flat company price. $12/mo for the whole crew.",
};

const costBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: canonicalHost + "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Construction Time Tracking",
      item: canonicalHost + constructionRoute,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Construction Time Tracking Cost",
      item: canonicalHost + costRoute,
    },
  ],
};

pages.push([
  costRoute,
  "construction-time-tracking-cost/index.html",
  () => ssr.renderConstructionTimeTrackingCostHtml(),
  costTitle,
  costDescription,
  [
    ["ld-softwareapplication", costSoftwareLd],
    ["ld-faqpage", costFaqLd],
    ["ld-breadcrumb", costBreadcrumbLd],
    ["ld-organization", organizationLd],
    ["ld-website", websiteLd],
  ],
  [
    "What Does Construction Time Tracking Cost? Per-Seat vs Flat",
    "Per-seat monthly cost = base fee + (per-user fee × number of users)",
    "How much does a construction clock time tracker cost?",
    "Do I pay per employee?",
    "$12/mo",
  ],
]);

const templateRoute = "/templates/construction-timesheet-template";
const templateTitle = "Free Construction Timesheet Template (PDF & Excel)";
const templateDescription =
  "Free weekly construction timesheet for crews: job, start/end, hours, foreman sign-off. Download as PDF or Excel. Hours only, no pay columns.";

if (!Array.isArray(ssr.templateFaqItems) || ssr.templateFaqItems.length !== 5) {
  console.error("[prerender] template FAQ array missing or not 5 items — refusing to ship drifted JSON-LD.");
  process.exit(1);
}

const templateFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ssr.templateFaqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const templateSoftwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "My Guys Time",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: canonicalHost + templateRoute,
  offers: {
    "@type": "Offer",
    price: "12",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "12",
      priceCurrency: "USD",
      billingDuration: "P1M",
      unitText: "per company per month",
    },
  },
  description:
    "Crew time cards for contractors. The foreman enters hours from his phone and approves the week. $12/mo flat for the whole company.",
};

const templateBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: canonicalHost + "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Construction Time Tracking",
      item: canonicalHost + constructionRoute,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Construction Timesheet Template",
      item: canonicalHost + templateRoute,
    },
  ],
};

function digitalDocumentLd(name, encodingFormat, filePath) {
  return {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    name,
    encodingFormat,
    url: canonicalHost + filePath,
    isAccessibleForFree: true,
  };
}

const templatePdfLd = digitalDocumentLd(
  "Free Construction Timesheet Template (PDF)",
  "application/pdf",
  "/templates/construction-timesheet-template.pdf",
);

const templateXlsxLd = digitalDocumentLd(
  "Free Construction Timesheet Template (Excel)",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "/templates/construction-timesheet-template.xlsx",
);

pages.push([
  templateRoute,
  "templates/construction-timesheet-template/index.html",
  () => ssr.renderConstructionTimesheetTemplateHtml(),
  templateTitle,
  templateDescription,
  [
    ["ld-softwareapplication", templateSoftwareLd],
    ["ld-faqpage", templateFaqLd],
    ["ld-breadcrumb", templateBreadcrumbLd],
    ["ld-digitaldocument-pdf", templatePdfLd],
    ["ld-digitaldocument-xlsx", templateXlsxLd],
    ["ld-organization", organizationLd],
    ["ld-website", websiteLd],
  ],
  [
    "Free Construction Timesheet Template for Small Crews",
    "Download PDF",
    "/templates/construction-timesheet-template.pdf",
    "/templates/construction-timesheet-template.xlsx",
    "Is there a free timesheet template?",
    "Can I track 1099 subs on the same timesheet?",
    "$12/month",
  ],
]);

const bestAppsRoute = "/best-construction-time-tracking-apps";
const bestAppsTitle = "Best Time Tracking Apps for Small Construction Crews";
const bestAppsDescription =
  "Honest picks by fit: GPS platforms, free plans, and a flat $12 crew time card. Compare ClockShark, BusyBusy, Workyard, Connecteam, and My Guys Time.";

if (!Array.isArray(ssr.bestAppsFaqItems) || ssr.bestAppsFaqItems.length !== 5) {
  console.error("[prerender] best-apps FAQ array missing or not 5 items — refusing to ship drifted JSON-LD.");
  process.exit(1);
}

const bestAppsFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ssr.bestAppsFaqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const bestAppsSoftwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "My Guys Time",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: canonicalHost + bestAppsRoute,
  offers: {
    "@type": "Offer",
    price: "12",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "12",
      priceCurrency: "USD",
      billingDuration: "P1M",
      unitText: "per company per month",
    },
  },
  description:
    "Flat-price crew time cards. The foreman logs hours and signs the week. $12/month for the whole company.",
};

const bestAppsBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: canonicalHost + "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Construction Time Tracking",
      item: canonicalHost + constructionRoute,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Best Time Tracking Apps for Small Construction Crews",
      item: canonicalHost + bestAppsRoute,
    },
  ],
};

const bestAppsItemListLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: bestAppsTitle,
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "ClockShark", url: canonicalHost + "/vs/clockshark" },
    { "@type": "ListItem", position: 2, name: "BusyBusy", url: canonicalHost + "/vs/busybusy" },
    { "@type": "ListItem", position: 3, name: "Workyard", url: canonicalHost + "/vs/workyard" },
    { "@type": "ListItem", position: 4, name: "Connecteam", url: canonicalHost + "/vs/connecteam" },
    { "@type": "ListItem", position: 5, name: "QuickBooks Time", url: canonicalHost + "/vs/quickbooks-time" },
    { "@type": "ListItem", position: 6, name: "My Guys Time", url: canonicalHost + "/pricing" },
    { "@type": "ListItem", position: 7, name: "Paper and spreadsheets", url: canonicalHost + "/vs/paper-timesheets" },
  ],
};

pages.push([
  bestAppsRoute,
  "best-construction-time-tracking-apps/index.html",
  () => ssr.renderBestConstructionTimeTrackingAppsHtml(),
  bestAppsTitle,
  bestAppsDescription,
  [
    ["ld-softwareapplication", bestAppsSoftwareLd],
    ["ld-faqpage", bestAppsFaqLd],
    ["ld-breadcrumb", bestAppsBreadcrumbLd],
    ["ld-itemlist", bestAppsItemListLd],
    ["ld-organization", organizationLd],
    ["ld-website", websiteLd],
  ],
  [
    "Best Time Tracking Apps for Small Construction Crews",
    "The best time tracking app for a small construction crew depends on fit.",
    "free for up to 10 users",
    "caps it at a small number of users",
    "calculate pay or taxes",
    "construction time tracking for small crews",
    "https://www.clockshark.com/pricing/",
    "https://www.myguystime.com/best-construction-time-tracking-apps",
    "$12/month",
    "/guides/how-contractors-track-crew-hours",
    "how contractors track crew hours",
  ],
]);

const guideRoute = "/guides/how-contractors-track-crew-hours";
const guideTitle = "How Contractors Track Crew Hours: Paper, Sheet, or App";
const guideDescription =
  "Paper time cards, spreadsheets, or a crew app: what each does well and where it falls short. From a contractor who kept crew hours on a 2x6.";
const guideHeadline = "How Contractors Track Crew Hours: Paper vs Spreadsheet vs App";

if (!Array.isArray(ssr.guideFaqItems) || ssr.guideFaqItems.length !== 5) {
  console.error("[prerender] guide FAQ array missing or not 5 items — refusing to ship drifted JSON-LD.");
  process.exit(1);
}

const guideFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ssr.guideFaqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const guideArticleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: guideHeadline,
  description: guideDescription,
  datePublished: "2026-10-09",
  author: {
    "@type": "Person",
    name: "Jeff Mohler",
    jobTitle: "Founder",
  },
  publisher: {
    "@type": "Organization",
    name: "My Guys Time",
    url: canonicalHost + "/",
    logo: {
      "@type": "ImageObject",
      url: canonicalHost + "/images/og-myguystime.png",
    },
  },
  mainEntityOfPage: canonicalHost + guideRoute,
};

const guideBreadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: canonicalHost + "/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Construction Time Tracking",
      item: canonicalHost + constructionRoute,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "How Contractors Track Crew Hours",
      item: canonicalHost + guideRoute,
    },
  ],
};

const guideSoftwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "My Guys Time",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: canonicalHost + "/",
  offers: {
    "@type": "Offer",
    price: "12",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "12",
      priceCurrency: "USD",
      billingDuration: "P1M",
      unitText: "per company per month",
    },
  },
  description:
    "Flat-price crew time cards. The foreman logs hours and signs the week. $12/month for the whole company.",
};

pages.push([
  guideRoute,
  "guides/how-contractors-track-crew-hours/index.html",
  () => ssr.renderGuideHtml(),
  guideTitle,
  guideDescription,
  [
    ["ld-article", guideArticleLd],
    ["ld-softwareapplication", guideSoftwareLd],
    ["ld-faqpage", guideFaqLd],
    ["ld-breadcrumb", guideBreadcrumbLd],
    ["ld-organization", organizationLd],
    ["ld-website", websiteLd],
  ],
  [
    guideHeadline,
    "By Jeff Mohler, founder of My Guys Time",
    "https://www.myguystime.com/guides/how-contractors-track-crew-hours",
    ">construction time tracking<",
    "$12/month",
    "PDF or Excel",
    "/vs/paper-timesheets",
    "/vs/spreadsheets",
    "/templates/construction-timesheet-template",
    "/best-construction-time-tracking-apps",
    "/construction-time-tracking-cost",
    "/how-it-works",
    "/trades/masonry",
    "/demo/foreman",
  ],
]);

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

  // Replacement function: a string replacement would treat $12 in the markup as a capture.
  let finalHtml = template.replace(rootMarker, () => `${hydrationFlag}${markup}</div>`);

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
    () => `<link rel="canonical" href="${canonical}" />`,
  );

  if (routePath === "/templates/construction-timesheet-template") {
    const ogImage = canonicalHost + "/templates/construction-timesheet-template-example.png";
    finalHtml = replaceMeta(finalHtml, "property", "og:image", ogImage);
    finalHtml = replaceMeta(finalHtml, "name", "twitter:image", ogImage);
  }

  // JSON-LD — FAQ text is sourced from the same arrays the pages render,
  // so structured data and visible copy cannot drift.
  const wanted = new Map(ldBlocks);
  // Every sub-page also gets a WebPage block naming its own URL.
  if (routePath !== "/") {
    wanted.set("ld-webpage", webPageLd(title, routePath, description));
  }
  const appendableJsonLd = new Set([
    "ld-webpage",
    "ld-breadcrumb",
    "ld-itemlist",
    "ld-article",
    "ld-digitaldocument-pdf",
    "ld-digitaldocument-xlsx",
  ]);
  for (const id of [
    "ld-softwareapplication",
    "ld-faqpage",
    "ld-breadcrumb",
    "ld-itemlist",
    "ld-article",
    "ld-organization",
    "ld-website",
    "ld-webpage",
    "ld-digitaldocument-pdf",
    "ld-digitaldocument-xlsx",
  ]) {
    const openTag = `<script type="application/ld+json" id="${id}">`;
    const closeTag = "</" + "script>";
    const start = finalHtml.indexOf(openTag);
    const data = wanted.get(id);
    if (data) {
      if (start === -1) {
        // Template only ships 4 placeholders; extra blocks are appended before </head>.
        if (!appendableJsonLd.has(id)) {
          console.error(`[prerender] JSON-LD placeholder #${id} not found in template.`);
          process.exit(1);
        }
        finalHtml = finalHtml.replace("</head>", () => {
          return `    ${openTag}\n    ${JSON.stringify(data)}\n    ${closeTag}\n  </head>`;
        });
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

  if (routePath === "/vs/connecteam") {
    const lower = markup.toLowerCase();
    const banned = ["csv", "export", "petty cash", "break"];
    const hit = banned.filter((token) => lower.includes(token));
    const dollars = markup.match(/\$\d+(?:\.\d+)?/g) || [];
    const badDollars = [...new Set(dollars.filter((amount) => amount !== "$12"))];
    if (hit.length > 0 || badDollars.length > 0) {
      console.error("[prerender] connecteam page contains banned copy:", hit, badDollars);
      process.exit(1);
    }
  }

  if (routePath === "/vs/busybusy") {
    const withoutBreadcrumb = markup.toLowerCase().replace(/breadcrumb/g, "");
    const banned = ["csv", "export", "petty cash"];
    const hit = banned.filter((token) => withoutBreadcrumb.includes(token));
    if (/\bbreaks?\b/.test(withoutBreadcrumb)) hit.push("break");
    const dollars = markup.match(/\$\d+(?:\.\d+)?/g) || [];
    const badDollars = [...new Set(dollars.filter((amount) => amount !== "$12"))];
    if (hit.length > 0 || badDollars.length > 0) {
      console.error("[prerender] busybusy page contains banned copy:", hit, badDollars);
      process.exit(1);
    }
  }

  if (routePath === "/vs/workyard") {
    const withoutBreadcrumb = markup.toLowerCase().replace(/breadcrumb/g, "");
    const banned = ["csv", "petty cash", "multi-crew"];
    const hit = banned.filter((token) => withoutBreadcrumb.includes(token));
    if (/\bbreaks?\b/.test(withoutBreadcrumb)) hit.push("break");
    const dollars = markup.match(/\$\d+(?:\.\d+)?/g) || [];
    const badDollars = [...new Set(dollars.filter((amount) => amount !== "$12"))];
    if (hit.length > 0 || badDollars.length > 0) {
      console.error("[prerender] workyard page contains banned copy:", hit, badDollars);
      process.exit(1);
    }
  }

  if (routePath === "/construction-time-tracking-cost") {
    const banned = ["$X", "$Y", "Your per-seat bill"];
    const hit = banned.filter((token) => finalHtml.includes(token));
    if (hit.length > 0 || /csv/i.test(markup)) {
      console.error("[prerender] cost page contains banned copy:", hit, /csv/i.test(markup) ? "CSV" : "");
      process.exit(1);
    }
  }

  if (routePath === "/guides/how-contractors-track-crew-hours") {
    const lower = markup.toLowerCase();
    const banned = [
      "csv",
      "petty cash",
      "google sheets",
      "/guides/crew-hours-quickbooks",
      "calculates payroll",
      "calculates tax",
      "break tracking",
    ];
    const hit = banned.filter((token) => lower.includes(token));
    if (/\bbreaks?\b/.test(lower)) hit.push("break");
    const dollars = markup.match(/\$\d+(?:\.\d+)?/g) || [];
    const badDollars = [...new Set(dollars.filter((amount) => amount !== "$12"))];
    if (hit.length > 0 || badDollars.length > 0) {
      console.error("[prerender] crew-hours guide contains banned copy:", hit, badDollars);
      process.exit(1);
    }
    if (!finalHtml.includes('"@type":"Article"') || !finalHtml.includes('"@type":"FAQPage"') || !finalHtml.includes('"@type":"BreadcrumbList"')) {
      console.error("[prerender] crew-hours guide missing Article, FAQPage, or BreadcrumbList JSON-LD.");
      process.exit(1);
    }
    if (finalHtml.includes('"name":"Guides"')) {
      console.error("[prerender] crew-hours guide breadcrumb includes a Guides crumb.");
      process.exit(1);
    }
  }

  if (routePath === "/best-construction-time-tracking-apps") {
    const lower = markup.toLowerCase();
    const banned = [
      "csv",
      "petty cash",
      "up to 5",
      "/guides/crew-hours-quickbooks",
      "best overall",
      "aggregaterating",
    ];
    const hit = banned.filter((token) => lower.includes(token));
    if (/\bbreaks?\b/.test(lower)) hit.push("break");
    const dollars = markup.match(/\$\d+(?:\.\d+)?/g) || [];
    const badDollars = [...new Set(dollars.filter((amount) => amount !== "$12"))];
    if (hit.length > 0 || badDollars.length > 0) {
      console.error("[prerender] best-apps page contains banned copy:", hit, badDollars);
      process.exit(1);
    }
  }

  if (routePath === "/templates/construction-timesheet-template") {
    const banned = [
      "Google Sheets",
      "Make a copy",
      "petty cash",
      "break tracking",
      "calculates payroll",
      "calculates tax",
    ];
    const hit = banned.filter((token) => finalHtml.toLowerCase().includes(token.toLowerCase()));
    if (hit.length > 0 || /csv/i.test(markup)) {
      console.error("[prerender] template page contains banned copy:", hit, /csv/i.test(markup) ? "CSV" : "");
      process.exit(1);
    }
  }

  // JSON-LD must parse — validate all injected blocks before writing.
  for (const [id] of wanted) {
    const match = finalHtml.match(new RegExp(`<script type="application/ld\\+json" id="${id}">([\\s\\S]*?)<`));
    if (!match) {
      console.error(`[prerender] JSON-LD block #${id} missing from ${routePath} output.`);
      process.exit(1);
    }
    let parsed;
    try {
      parsed = JSON.parse(match[1]);
    } catch (error) {
      console.error(`[prerender] JSON-LD block #${id} does not parse on ${routePath}:`, error.message);
      process.exit(1);
    }
    if (id === "ld-breadcrumb") {
      const crumbs = parsed.itemListElement || [];
      for (const crumb of crumbs) {
        if (!crumb.item || !crumb.name) {
          console.error(`[prerender] ${routePath} breadcrumb crumb is missing a name or URL.`, crumb);
          process.exit(1);
        }
        if (crumb.name === "Comparisons" || crumb.name === "Templates" || crumb.name === "Guides") {
          console.error(`[prerender] ${routePath} breadcrumb still uses a folder name with no page: ${crumb.name}`);
          process.exit(1);
        }
      }
    }
    if (id === "ld-faqpage") {
      const questions = parsed.mainEntity || [];
      if (questions.length === 0) {
        console.error(`[prerender] ${routePath} FAQPage has no questions.`);
        process.exit(1);
      }
      const visible = finalHtml
        .replace(/&#x27;|&#39;|&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
      for (const question of questions) {
        const answer = question.acceptedAnswer && question.acceptedAnswer.text;
        if (!question.name || !answer || !visible.includes(question.name) || !visible.includes(answer)) {
          console.error(`[prerender] ${routePath} FAQPage does not match visible FAQ text:`, question.name);
          process.exit(1);
        }
      }
    }
  }

  const outPath = path.join(distDir, outFile);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, finalHtml);
  console.log(`[prerender] ${routePath} -> dist/${outFile} (${finalHtml.length} chars).`);
}

const notFoundHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Page not found | My Guys Time</title>
  </head>
  <body>
    <main>
      <p>404</p>
      <h1>Page not found</h1>
      <p>That page is not on this site.</p>
      <p><a href="/">Back to the homepage</a></p>
    </main>
  </body>
</html>
`;
if (!notFoundHtml.includes('content="noindex"') || notFoundHtml.includes("Thursday-at-5pm") || notFoundHtml.includes('rel="canonical"')) {
  console.error("[prerender] 404.html failed the noindex / not-the-homepage check.");
  process.exit(1);
}
fs.writeFileSync(path.join(distDir, "404.html"), notFoundHtml);
console.log("[prerender] 404 -> dist/404.html");

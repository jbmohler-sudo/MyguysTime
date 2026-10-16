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
  description: "Simple time cards for contractor crews. Track crew hours and review the week. $12/mo flat.",
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
  description: "Simple time cards for contractor crews. Track crew hours and review the week. $12/mo flat.",
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
  const page = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url: canonicalHost + routePath,
    description,
    isPartOf: { "@type": "WebSite", name: "My Guys Time", url: canonicalHost + "/" },
  };
  if (routePath === "/vs/quickbooks-time") {
    page.dateModified = "2026-10-14";
  }
  return page;
}

// [pageRoute, outFile, renderFn, title, description, ldBlocks, requiredSnippets]
const pages = [
  [
    "/",
    "index.html",
    () => ssr.renderLandingHtml(),
    "My Guys Time — Simple Time Cards for Contractor Crews | $12/mo Flat",
    "Track crew hours and review the week in the office. Simple time tracking for contractors and small crews.",
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
    "Weekly crew board, truck-ready hour entry, receipt photos, and mixed W-2/1099 crews. $12/mo flat — no per-seat fees.",
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
    "Crew logs hours from the field. The office reviews the week and adjusts. Four steps, no bloat.",
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
    "Log crew hours from the truck and review the week in the office. Built by a contractor. $12/mo flat for the whole crew. 7 days free.",
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
    "Your W-2 crew and your 1099 subs on one weekly board. The office sees weekly hours, hours past 40, and a simple gross pay estimate. $12/mo flat.",
    "Your crew and your subs, one weekly board."],
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
// Comparison pages — [slug, name, page title, meta description, H1 snippet]
const vsPages = [
  ["paper-timesheets", "Paper Timesheets", "Paper Timesheets vs My Guys Time | Contractor Time Cards",
    "Still running crew hours on paper time cards? Lost hours, Thursday-night reconstruction, unreadable handwriting — see what changes with $12/mo flat time cards.",
    "Retire the paper time card."],
  ["quickbooks-time", "QuickBooks Time", "QuickBooks Time Pricing vs $12 Flat for Crews | My Guys Time",
    "QuickBooks Time charges a monthly base fee plus a fee per user, on top of QuickBooks Online. My Guys Time is $12/mo flat for the whole company.",
    "QuickBooks Time vs My Guys Time: Per-User Fees or One Flat Price"],
  ["spreadsheets", "Spreadsheets", "Spreadsheet Time Tracking vs My Guys Time | $12/mo Flat",
    "If your time-tracking 'system' is a spreadsheet rebuilt every Thursday at 5pm, you're paying for it in lost hours. Daily field logging and one weekly review.",
    "Kill the Thursday spreadsheet."],
];

for (const [slug, name, title, description, h1] of vsPages) {
  pages.push([
    `/vs/${slug}`,
    `vs/${slug}/index.html`,
    () => ssr.renderVsHtml(slug),
    title,
    description,
    [
      ["ld-softwareapplication", softwareApplicationLd],
      ["ld-organization", organizationLd],
      ["ld-website", websiteLd],
    ],
    [
      h1,
      `My Guys Time vs ${name}`,
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
    "Simple time cards for contractor crews. Track crew hours and review the week. $12/mo flat.",
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
      name: "Comparisons",
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
  "ClockShark bills a base fee plus every user. My Guys Time is $12/mo flat for the whole company: crew time cards and a weekly review. 7 days free.",
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
      name: "Comparisons",
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
      name: "Comparisons",
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
      name: "Comparisons",
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
  ],
]);

const supercrewRoute = "/vs/supercrew";
const supercrewFaqs = typeof ssr.vsPageFaqs === "function" ? ssr.vsPageFaqs("supercrew") : [];
if (!Array.isArray(supercrewFaqs) || supercrewFaqs.length !== 5) {
  console.error("[prerender] supercrew FAQ array missing or not 5 items — refusing to ship drifted JSON-LD.");
  process.exit(1);
}

const supercrewFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: supercrewFaqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const supercrewSoftwareLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "My Guys Time",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: canonicalHost + supercrewRoute,
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

const supercrewBreadcrumbLd = {
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
      name: "Comparisons",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Supercrew",
      item: canonicalHost + supercrewRoute,
    },
  ],
};

pages.push([
  supercrewRoute,
  "vs/supercrew/index.html",
  () => ssr.renderVsHtml("supercrew"),
  "Supercrew (ConstructionClock) vs $12 Flat | My Guys Time",
  "ConstructionClock is now Supercrew, priced per crew member with automatic GPS clock-in. My Guys Time is $12/mo flat for the whole company. Compare.",
  [
    ["ld-softwareapplication", supercrewSoftwareLd],
    ["ld-faqpage", supercrewFaqLd],
    ["ld-breadcrumb", supercrewBreadcrumbLd],
    ["ld-organization", organizationLd],
    ["ld-website", websiteLd],
  ],
  [
    "Supercrew vs My Guys Time: Per-Member GPS Clock or One Flat Price",
    "My Guys Time vs Supercrew (formerly ConstructionClock)",
    "Each guy joins the crew team from his own phone",
    "Timesheet approval",
    "Listed as &quot;Soon&quot;",
    "https://supercrew.com/pricing",
    "https://supercrew.com/blog/meet-supercrew-why-we-changed-from-constructionclock",
    "what crew time apps cost",
    "$12/month flat for the whole company",
    "need the GPS",
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
      name: "Templates",
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

const decimalChartRoute = "/templates/time-to-decimal-chart";
const decimalChartTitle = "Time to Decimal Chart: Minutes to Decimal Hours (Printable)";
const decimalChartDescription =
  "Free minutes-to-decimal hours chart for time cards: 1 to 60 minutes, decimal back to minutes, and a printable PDF. From a contractor, not a payroll firm.";
const decimalChartHeadline = "Time to Decimal Chart: Convert Minutes to Decimal Hours";

if (!Array.isArray(ssr.decimalChartFaqItems) || ssr.decimalChartFaqItems.length !== 5) {
  console.error("[prerender] decimal chart FAQ array missing or not 5 items — refusing to ship drifted JSON-LD.");
  process.exit(1);
}
if (!Array.isArray(ssr.decimalMinuteRows) || ssr.decimalMinuteRows.length !== 60) {
  console.error("[prerender] decimal chart minute rows missing or not 60 — refusing to ship.");
  process.exit(1);
}

const decimalChartFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ssr.decimalChartFaqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const decimalChartArticleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: decimalChartHeadline,
  description: decimalChartDescription,
  datePublished: "2026-10-14",
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
  mainEntityOfPage: canonicalHost + decimalChartRoute,
};

const decimalChartBreadcrumbLd = {
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
      name: "Free Construction Timesheet Template",
      item: canonicalHost + templateRoute,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Time to Decimal Chart",
      item: canonicalHost + decimalChartRoute,
    },
  ],
};

pages.push([
  decimalChartRoute,
  "templates/time-to-decimal-chart/index.html",
  () => ssr.renderTimeToDecimalChartHtml(),
  decimalChartTitle,
  decimalChartDescription,
  [
    ["ld-article", decimalChartArticleLd],
    ["ld-faqpage", decimalChartFaqLd],
    ["ld-breadcrumb", decimalChartBreadcrumbLd],
    ["ld-organization", organizationLd],
    ["ld-website", websiteLd],
  ],
  [
    decimalChartHeadline,
    "15 minutes is 0.25 hours",
    "Decimal hours rounded to two places (minutes divided by 60).",
    "decimal time chart, minutes to decimal hours 1 to 60",
    "/templates/time-to-decimal-chart.pdf",
    "/templates/time-to-decimal-chart.xlsx",
    "How do I calculate decimal hours?",
    "What is .26 of an hour?",
    "Is 7.30 the same as 7 hours 30 minutes?",
    "Tired of converting?",
    "$12/month flat for the whole company",
    "/demo/foreman",
    "/pricing",
    "/templates/construction-timesheet-template",
    "/guides/how-contractors-track-crew-hours",
    "/vs/paper-timesheets",
    "38.58",
    "each guy joins the crew team from his own phone",
  ],
]);

const dailyReportRoute = "/templates/construction-daily-report-template";
const dailyReportTitle = "Free Construction Daily Report Template (PDF + Excel)";
const dailyReportDescription =
  "A one-page construction daily report and foreman daily log: crew hours, work done, deliveries, delays and incidents. Free PDF and Excel. No signup.";
const dailyReportHeadline = "Free Construction Daily Report Template for Small Crews";

if (!Array.isArray(ssr.dailyReportFaqItems) || ssr.dailyReportFaqItems.length !== 5) {
  console.error("[prerender] daily report FAQ array missing or not 5 items — refusing to ship drifted JSON-LD.");
  process.exit(1);
}

const dailyReportFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ssr.dailyReportFaqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const dailyReportArticleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: dailyReportHeadline,
  description: dailyReportDescription,
  datePublished: "2026-10-16",
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
  mainEntityOfPage: canonicalHost + dailyReportRoute,
};

const dailyReportBreadcrumbLd = {
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
      name: "Free Construction Timesheet Template",
      item: canonicalHost + templateRoute,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Construction Daily Report Template",
      item: canonicalHost + dailyReportRoute,
    },
  ],
};

const dailyReportPdfLd = digitalDocumentLd(
  "Free Construction Daily Report Template (PDF)",
  "application/pdf",
  "/templates/construction-daily-report-template.pdf",
);

const dailyReportXlsxLd = digitalDocumentLd(
  "Free Construction Daily Report Template (Excel)",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "/templates/construction-daily-report-template.xlsx",
);

pages.push([
  dailyReportRoute,
  "templates/construction-daily-report-template/index.html",
  () => ssr.renderConstructionDailyReportTemplateHtml(),
  dailyReportTitle,
  dailyReportDescription,
  [
    ["ld-article", dailyReportArticleLd],
    ["ld-faqpage", dailyReportFaqLd],
    ["ld-breadcrumb", dailyReportBreadcrumbLd],
    ["ld-digitaldocument-pdf", dailyReportPdfLd],
    ["ld-digitaldocument-xlsx", dailyReportXlsxLd],
    ["ld-organization", organizationLd],
    ["ld-website", websiteLd],
  ],
  [
    dailyReportHeadline,
    "Foreman daily log · PDF + Excel",
    "A construction daily report is a one-page record",
    "/templates/construction-daily-report-template.pdf",
    "/templates/construction-daily-report-template.xlsx",
    "construction daily report template, one page",
    "What goes in a construction daily report",
    "Example: a filled-in day",
    "Daily report vs time card vs daily log",
    "Tips that keep it from turning into paperwork nobody reads",
    "Where My Guys Time fits",
    "Construction daily reports: common questions",
    "What should be included in a construction daily report?",
    "Do I need a daily report on small residential jobs?",
    "/templates/construction-timesheet-template",
    "/templates/time-to-decimal-chart",
    "/guides/how-contractors-track-crew-hours",
    "/construction-time-tracking",
    "/demo/foreman",
    "/pricing",
    "$12/month flat for the whole company",
    "Each guy joins the crew team from his own phone",
    "he or the foreman logs the hours",
    "not a full daily-report app",
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
      name: "Comparisons",
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
    "taxes, deductions, net pay, or payroll",
    "construction time tracking for small crews",
    "https://www.clockshark.com/pricing/",
    "https://www.myguystime.com/best-construction-time-tracking-apps",
    "$12/month",
    "/guides/how-contractors-track-crew-hours",
    "how contractors track crew hours",
  ],
]);

const guidesHubRoute = "/guides";
const guidesHubTitle = "Guides and Templates for Construction Crew Hours | My Guys Time";
const guidesHubDescription =
  "Guides and free templates for construction crew hours: paper versus a crew app, 1099 overtime, a weekly timesheet, a daily report, and a minutes-to-decimal chart.";
const guidesHubHeadline = "Guides and Templates for Construction Crew Hours";

const guidesHubHrefs = [
  "/guides/how-contractors-track-crew-hours",
  "/guides/do-1099-subs-get-overtime",
  "/templates/construction-timesheet-template",
  "/templates/construction-daily-report-template",
  "/templates/time-to-decimal-chart",
];

if (
  !Array.isArray(ssr.guidesHubItems) ||
  ssr.guidesHubItems.length !== guidesHubHrefs.length ||
  ssr.guidesHubItems.some((item, index) => item.href !== guidesHubHrefs[index] || !item.title || !item.description)
) {
  console.error("[prerender] guides hub list missing or drifted from the live guide and template pages.");
  process.exit(1);
}
if (ssr.guidesHubItems.some((item) => item.href === "/guides/crew-hours-quickbooks")) {
  console.error("[prerender] guides hub links the unpublished QuickBooks guide.");
  process.exit(1);
}

const guidesHubItemListLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": canonicalHost + guidesHubRoute + "#list",
  name: guidesHubHeadline,
  itemListElement: ssr.guidesHubItems.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.title,
    url: canonicalHost + item.href,
    description: item.description,
  })),
};

const guidesHubCollectionLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: guidesHubHeadline,
  url: canonicalHost + guidesHubRoute,
  description: guidesHubDescription,
  isPartOf: { "@type": "WebSite", name: "My Guys Time", url: canonicalHost + "/" },
  mainEntity: { "@id": canonicalHost + guidesHubRoute + "#list" },
};

const guidesHubBreadcrumbLd = {
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
      name: "Guides",
      item: canonicalHost + guidesHubRoute,
    },
  ],
};

pages.push([
  guidesHubRoute,
  "guides/index.html",
  () => ssr.renderGuidesHubHtml(),
  guidesHubTitle,
  guidesHubDescription,
  [
    ["ld-webpage", guidesHubCollectionLd],
    ["ld-itemlist", guidesHubItemListLd],
    ["ld-breadcrumb", guidesHubBreadcrumbLd],
    ["ld-organization", organizationLd],
    ["ld-website", websiteLd],
  ],
  [
    guidesHubHeadline,
    "$12/month flat for the whole company",
    "each person uses his own phone",
    ...ssr.guidesHubItems.flatMap((item) => [item.href, item.title, item.description]),
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

const overtimeGuideRoute = "/guides/do-1099-subs-get-overtime";
const overtimeGuideTitle = "Do 1099 Subs Get Overtime? What Contractors Should Know";
const overtimeGuideDescription =
  "Independent contractors aren't owed FLSA overtime, but the label doesn't decide it. A crew owner's guide to mixed W-2 and 1099 crews. Not legal advice.";
const overtimeGuideHeadline = "Do 1099 Subs Get Overtime? A Crew Owner's Plain Answer";

if (!Array.isArray(ssr.overtimeGuideFaqItems) || ssr.overtimeGuideFaqItems.length !== 5) {
  console.error("[prerender] overtime guide FAQ array missing or not 5 items — refusing to ship drifted JSON-LD.");
  process.exit(1);
}

const overtimeGuideFaqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: ssr.overtimeGuideFaqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const overtimeGuideArticleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: overtimeGuideHeadline,
  description: overtimeGuideDescription,
  datePublished: "2026-10-15",
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
  mainEntityOfPage: canonicalHost + overtimeGuideRoute,
};

const overtimeGuideBreadcrumbLd = {
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
      name: "Do 1099 Subs Get Overtime?",
      item: canonicalHost + overtimeGuideRoute,
    },
  ],
};

pages.push([
  overtimeGuideRoute,
  "guides/do-1099-subs-get-overtime/index.html",
  () => ssr.renderOvertimeGuideHtml(),
  overtimeGuideTitle,
  overtimeGuideDescription,
  [
    ["ld-article", overtimeGuideArticleLd],
    ["ld-faqpage", overtimeGuideFaqLd],
    ["ld-breadcrumb", overtimeGuideBreadcrumbLd],
    ["ld-organization", organizationLd],
    ["ld-website", websiteLd],
  ],
  [
    overtimeGuideTitle,
    "By Jeff Mohler, founder of My Guys Time",
    "not legal or tax advice",
    "https://www.dol.gov/agencies/whd/overtime",
    "https://www.dol.gov/agencies/whd/fact-sheets/13-flsa-employment-relationship",
    "https://www.dol.gov/agencies/whd/fact-sheets/21-flsa-recordkeeping",
    "https://www.irs.gov/businesses/small-businesses-self-employed/independent-contractor-self-employed-or-employee",
    "https://www.irs.gov/forms-pubs/about-form-ss-8",
    "https://www.dir.ca.gov/dlse/faq_independentcontractor.htm",
    "1-866-487-9243",
    "taxes, deductions, net pay, or run payroll",
    "/trades/general-contracting",
    "/guides/how-contractors-track-crew-hours",
    ">Construction time tracking<",
    "$12/month",
    "https://www.myguystime.com/guides/do-1099-subs-get-overtime",
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
  if (routePath === "/guides") {
    wanted.set("ld-webpage", guidesHubCollectionLd);
  } else if (routePath !== "/") {
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

  if (routePath === "/vs/quickbooks-time") {
    const lower = markup.toLowerCase();
    const banned = ["csv", "petty cash", "one phone per crew", "own boards", "multi-crew", "shared phone"];
    const hit = banned.filter((token) => lower.includes(token));
    if (/\bbreaks?\b/.test(lower)) hit.push("break");
    const dollars = markup.match(/\$\d+(?:\.\d+)?/g) || [];
    const badDollars = [...new Set(dollars.filter((amount) => amount !== "$12"))];
    if (hit.length > 0 || badDollars.length > 0) {
      console.error("[prerender] quickbooks-time page contains banned copy:", hit, badDollars);
      process.exit(1);
    }
    if ((markup.match(/<h1[\s>]/g) || []).length !== 1) {
      console.error("[prerender] quickbooks-time page must have exactly one H1.");
      process.exit(1);
    }
    if (!finalHtml.includes('"dateModified":"2026-10-14"')) {
      console.error("[prerender] quickbooks-time WebPage JSON-LD missing dateModified.");
      process.exit(1);
    }
    if (!markup.includes("Each guy joins the crew team from his own phone")) {
      console.error("[prerender] quickbooks-time page missing own-phone crew join line.");
      process.exit(1);
    }
  }

  if (routePath === "/vs/supercrew") {
    const withoutBreadcrumb = markup.toLowerCase().replace(/breadcrumb/g, "");
    const banned = ["csv", "petty cash", "one phone per crew", "multi-crew"];
    const hit = banned.filter((token) => withoutBreadcrumb.includes(token));
    if (/\bbreaks?\b/.test(withoutBreadcrumb)) hit.push("break");
    const dollars = markup.match(/\$\d+(?:\.\d+)?/g) || [];
    const badDollars = [...new Set(dollars.filter((amount) => amount !== "$12"))];
    if (hit.length > 0 || badDollars.length > 0) {
      console.error("[prerender] supercrew page contains banned copy:", hit, badDollars);
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

  if (routePath === "/guides") {
    const lower = markup.toLowerCase();
    const banned = [
      "csv",
      "petty cash",
      "/guides/crew-hours-quickbooks",
      "calculates payroll",
      "calculates tax",
      "one phone per crew",
    ];
    const hit = banned.filter((token) => lower.includes(token));
    if (/\bbreaks?\b/.test(lower)) hit.push("break");
    const dollars = markup.match(/\$\d+(?:\.\d+)?/g) || [];
    const badDollars = [...new Set(dollars.filter((amount) => amount !== "$12"))];
    if (hit.length > 0 || badDollars.length > 0) {
      console.error("[prerender] guides hub contains banned copy:", hit, badDollars);
      process.exit(1);
    }
    if ((markup.match(/<h1[\s>]/g) || []).length !== 1) {
      console.error("[prerender] guides hub must have exactly one H1.");
      process.exit(1);
    }
    if (
      !finalHtml.includes('"@type":"CollectionPage"') ||
      !finalHtml.includes('"@type":"ItemList"') ||
      !finalHtml.includes('"@type":"BreadcrumbList"')
    ) {
      console.error("[prerender] guides hub missing CollectionPage, ItemList, or BreadcrumbList JSON-LD.");
      process.exit(1);
    }
    if (!finalHtml.includes('<link rel="canonical" href="https://www.myguystime.com/guides" />')) {
      console.error("[prerender] guides hub canonical is not its own URL.");
      process.exit(1);
    }
    const crumbNames = ['"name":"Home"', '"name":"Construction Time Tracking"', '"name":"Guides"'];
    if (crumbNames.some((name) => !finalHtml.includes(name)) || !finalHtml.includes('"item":"https://www.myguystime.com/guides"')) {
      console.error("[prerender] guides hub breadcrumb is not Home > Construction Time Tracking > Guides.");
      process.exit(1);
    }
    for (const item of ssr.guidesHubItems) {
      if (!markup.includes(`href="${item.href}"`) || markup.includes("/guides/crew-hours-quickbooks")) {
        console.error("[prerender] guides hub link list is wrong:", item.href);
        process.exit(1);
      }
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

  if (routePath === "/guides/do-1099-subs-get-overtime") {
    const visible = markup
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"');
    const lower = visible.toLowerCase();
    const banned = [
      "csv",
      "petty cash",
      "one phone per crew",
      "/guides/crew-hours-quickbooks",
      "calculates payroll",
      "calculates tax",
      "break tracking",
    ];
    const hit = banned.filter((token) => lower.includes(token));
    if (/\bbreaks?\b/.test(lower)) hit.push("break");
    const dollars = visible.match(/\$\d+(?:\.\d+)?/g) || [];
    const badDollars = [...new Set(dollars.filter((amount) => amount !== "$12"))];
    const exactLines = [
      "I've had mixed crews like that.",
      "Here's what I learned, in plain words, with links to where the government says it.",
      "I'm a contractor, not a lawyer, so read this as a starting point, not the final word.",
      "Here's what I'd keep:",
    ];
    const missingLines = exactLines.filter((line) => !visible.includes(line));
    if (hit.length > 0 || badDollars.length > 0 || missingLines.length > 0) {
      console.error("[prerender] overtime guide failed copy check:", hit, badDollars, missingLines);
      process.exit(1);
    }
    if ((markup.match(/<h1[\s>]/g) || []).length !== 1) {
      console.error("[prerender] overtime guide must have exactly one H1.");
      process.exit(1);
    }
    if (!finalHtml.includes('"@type":"Article"') || !finalHtml.includes('"@type":"FAQPage"') || !finalHtml.includes('"@type":"BreadcrumbList"')) {
      console.error("[prerender] overtime guide missing Article, FAQPage, or BreadcrumbList JSON-LD.");
      process.exit(1);
    }
    if (finalHtml.includes('"reviewedBy"') || finalHtml.includes('"name":"Guides"')) {
      console.error("[prerender] overtime guide has reviewedBy or a Guides breadcrumb.");
      process.exit(1);
    }
    if (!finalHtml.includes('"datePublished":"2026-10-15"') || !finalHtml.includes('"name":"Jeff Mohler"') || !finalHtml.includes('"jobTitle":"Founder"')) {
      console.error("[prerender] overtime guide Article JSON-LD missing author or date.");
      process.exit(1);
    }
    if (!finalHtml.includes('"name":"Construction Time Tracking"') || !finalHtml.includes('"name":"Do 1099 Subs Get Overtime?"')) {
      console.error("[prerender] overtime guide breadcrumb names are wrong.");
      process.exit(1);
    }
    const faqMismatch = ssr.overtimeGuideFaqItems.filter(
      (item) => !visible.includes(item.q) || !visible.includes(item.a),
    );
    if (faqMismatch.length > 0) {
      console.error("[prerender] overtime guide FAQ text drifted from JSON-LD source:", faqMismatch.map((item) => item.q));
      process.exit(1);
    }
    const disclaimerCount = (visible.match(/not legal or tax advice/g) || []).length;
    if (disclaimerCount < 2) {
      console.error("[prerender] overtime guide disclaimer must appear at the top and the bottom.");
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

  if (routePath === "/templates/time-to-decimal-chart") {
    const lower = markup.toLowerCase();
    const banned = [
      "csv",
      "petty cash",
      "google sheets",
      "one phone per crew",
      "/guides/crew-hours-quickbooks",
      "calculates payroll",
      "calculates tax",
    ];
    const hit = banned.filter((token) => lower.includes(token));
    if (/\bbreaks?\b/.test(lower)) hit.push("break");
    const dollars = markup.match(/\$\d+(?:\.\d+)?/g) || [];
    const badDollars = [...new Set(dollars.filter((amount) => amount !== "$12"))];
    const missingRows = (ssr.decimalMinuteRows || []).filter(
      (row) => !markup.includes(`>${row.minutes}</td><td class="p-4 text-slate-600">${row.decimal}</td>`),
    );
    if (hit.length > 0 || badDollars.length > 0 || missingRows.length > 0) {
      console.error("[prerender] decimal chart page failed copy or table check:", hit, badDollars, missingRows.slice(0, 5));
      process.exit(1);
    }
    if ((markup.match(/<h1[\s>]/g) || []).length !== 1) {
      console.error("[prerender] decimal chart page must have exactly one H1.");
      process.exit(1);
    }
    if (!finalHtml.includes('"@type":"Article"') || !finalHtml.includes('"@type":"FAQPage"') || !finalHtml.includes('"@type":"WebPage"') || !finalHtml.includes('"@type":"BreadcrumbList"')) {
      console.error("[prerender] decimal chart page missing Article, WebPage, FAQPage, or BreadcrumbList JSON-LD.");
      process.exit(1);
    }
    if (!finalHtml.includes('"datePublished":"2026-10-14"') || !finalHtml.includes('"name":"Jeff Mohler"') || !finalHtml.includes('"jobTitle":"Founder"')) {
      console.error("[prerender] decimal chart Article JSON-LD missing author or date.");
      process.exit(1);
    }
    if (finalHtml.includes('"name":"Templates"') || !finalHtml.includes("https://www.myguystime.com/templates/time-to-decimal-chart")) {
      console.error("[prerender] decimal chart canonical or breadcrumb is wrong.");
      process.exit(1);
    }
    const visible = markup.replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    const faqMismatch = ssr.decimalChartFaqItems.filter(
      (item) => !visible.includes(item.q) || !visible.includes(item.a),
    );
    if (faqMismatch.length > 0) {
      console.error("[prerender] decimal chart FAQ text drifted from JSON-LD source:", faqMismatch.map((item) => item.q));
      process.exit(1);
    }
  }

  if (routePath === "/templates/construction-daily-report-template") {
    const lower = markup.toLowerCase();
    const banned = [
      "csv",
      "petty cash",
      "google sheets",
      "one phone per crew",
      "/guides/crew-hours-quickbooks",
      "calculates payroll",
      "calculates tax",
      "payroll",
    ];
    const hit = banned.filter((token) => lower.includes(token));
    if (/\bbreaks?\b/.test(lower)) hit.push("break");
    const dollars = markup.match(/\$\d+(?:\.\d+)?/g) || [];
    const badDollars = [...new Set(dollars.filter((amount) => amount !== "$12"))];
    if (hit.length > 0 || badDollars.length > 0) {
      console.error("[prerender] daily report page failed copy check:", hit, badDollars);
      process.exit(1);
    }
    if ((markup.match(/<h1[\s>]/g) || []).length !== 1) {
      console.error("[prerender] daily report page must have exactly one H1.");
      process.exit(1);
    }
    const trackingLinks = markup.match(/href="\/construction-time-tracking"/g) || [];
    // One link in the page body, plus the shared footer link.
    if (trackingLinks.length !== 2) {
      console.error("[prerender] daily report page must link /construction-time-tracking once in the body.");
      process.exit(1);
    }
    if (
      !finalHtml.includes('"@type":"Article"') ||
      !finalHtml.includes('"@type":"FAQPage"') ||
      !finalHtml.includes('"@type":"WebPage"') ||
      !finalHtml.includes('"@type":"BreadcrumbList"')
    ) {
      console.error("[prerender] daily report page missing Article, WebPage, FAQPage, or BreadcrumbList JSON-LD.");
      process.exit(1);
    }
    if (
      !finalHtml.includes('"datePublished":"2026-10-16"') ||
      !finalHtml.includes('"name":"Jeff Mohler"') ||
      !finalHtml.includes('"jobTitle":"Founder"')
    ) {
      console.error("[prerender] daily report Article JSON-LD missing author or date.");
      process.exit(1);
    }
    if (
      finalHtml.includes('"name":"Templates"') ||
      !finalHtml.includes("https://www.myguystime.com/templates/construction-daily-report-template") ||
      !finalHtml.includes('"name":"Free Construction Timesheet Template"') ||
      !finalHtml.includes('"name":"Construction Daily Report Template"')
    ) {
      console.error("[prerender] daily report canonical or breadcrumb is wrong.");
      process.exit(1);
    }
    if (
      !markup.includes('href="/templates/construction-daily-report-template.pdf"') ||
      !markup.includes('href="/templates/construction-daily-report-template.xlsx"')
    ) {
      console.error("[prerender] daily report download links missing from prerendered HTML.");
      process.exit(1);
    }
    const visible = markup.replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    const faqMismatch = ssr.dailyReportFaqItems.filter(
      (item) => !visible.includes(item.q) || !visible.includes(item.a),
    );
    if (faqMismatch.length > 0) {
      console.error("[prerender] daily report FAQ text drifted from JSON-LD source:", faqMismatch.map((item) => item.q));
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

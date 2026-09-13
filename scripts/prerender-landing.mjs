/**
 * Post-build prerender for the myguystime.com landing page.
 *
 * Runs after `vite build`. Renders PublicHomepage to static HTML and injects
 * it into dist/index.html inside #root, with a marker the client entry uses
 * to switch from createRoot to hydrateRoot (no double render).
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
const indexPath = path.join(distDir, "index.html");
const ssrEntryPath = path.join(distDir, "ssr", "public-homepage.mjs");

if (!fs.existsSync(indexPath)) {
  console.error("[prerender] dist/index.html not found — run `vite build` first.");
  process.exit(1);
}

if (!fs.existsSync(ssrEntryPath)) {
  console.error("[prerender] dist/ssr/public-homepage.mjs not found — SSR entry missing from build.");
  process.exit(1);
}

let markup = "";
let faqData = [];
try {
  const ssr = await import(url.pathToFileURL(ssrEntryPath).href);
  markup = ssr.renderLandingHtml();
  faqData = ssr.faqItems ?? [];
} catch (error) {
  // The homepage must stay prerenderable. If a browser-only API sneaks in,
  // fail loudly but leave the SPA shell intact rather than shipping a blank page.
  console.error("[prerender] PublicHomepage render failed — shipping empty shell. Error:", error);
  process.exit(1);
}

if (!markup || markup.length < 200) {
  console.error("[prerender] rendered markup suspiciously short, refusing to inject.");
  process.exit(1);
}

const html = fs.readFileSync(indexPath, "utf8");
const marker = '<div id="root">';
const hydrationFlag = '<div id="root" data-prerendered="true">';

if (!html.includes(marker)) {
  console.error("[prerender] #root not found in dist/index.html.");
  process.exit(1);
}

const prerendered = html.replace(marker, `${hydrationFlag}${markup}</div>`);

// JSON-LD — FAQ text is sourced from the same faqItems array the page renders,
// so structured data and visible copy cannot drift.
const softwareApplicationLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "My Guys Time",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "12",
    priceCurrency: "USD",
  },
  description: "Simple time cards for contractor crews. Track crew hours, review the week, and export clean time card totals. $12/mo flat.",
};

const faqPageLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

let finalHtml = prerendered;
for (const [id, data] of [["ld-softwareapplication", softwareApplicationLd], ["ld-faqpage", faqPageLd]]) {
  const openTag = `<script type="application/ld+json" id="${id}">`;
  const closeTag = "</" + "script>";
  const start = finalHtml.indexOf(openTag);
  if (start === -1) {
    console.error(`[prerender] JSON-LD placeholder #${id} not found in index.html.`);
    process.exit(1);
  }
  const contentStart = start + openTag.length;
  const end = finalHtml.indexOf(closeTag, contentStart);
  finalHtml = finalHtml.slice(0, contentStart) + "\n" + JSON.stringify(data) + "\n" + finalHtml.slice(end);
}

// Sanity gate: the acceptance contract requires real content in raw HTML.
const requiredSnippets = [
  "Track crew hours without the Thursday-at-5pm scramble",
  "One price. The whole crew.",
  "Asked by contractors, answered straight",
  "Do I pay per employee?",
];
const missing = requiredSnippets.filter((snippet) => !finalHtml.includes(snippet));
if (missing.length > 0) {
  console.error("[prerender] injected markup missing required content:", missing);
  process.exit(1);
}

// JSON-LD must parse — validate both blocks before writing.
for (const id of ["ld-softwareapplication", "ld-faqpage"]) {
  const match = finalHtml.match(new RegExp(`<script type="application/ld\\+json" id="${id}">([\\s\\S]*?)<`));
  try {
    JSON.parse(match[1]);
  } catch (error) {
    console.error(`[prerender] JSON-LD block #${id} does not parse:`, error.message);
    process.exit(1);
  }
}

fs.writeFileSync(indexPath, finalHtml);
console.log(
  `[prerender] injected ${markup.length} chars of pre-rendered landing HTML into dist/index.html (${finalHtml.length} total).`,
);

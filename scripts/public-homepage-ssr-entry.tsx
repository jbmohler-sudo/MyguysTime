/**
 * SSR-only entry for the landing page prerender.
 *
 * renderLandingHtml() is called by scripts/prerender-landing.mjs. The whole
 * React tree (react + react-dom/server) is bundled INTO this file, so the
 * markup and hooks share one React copy — importing react-dom/server from
 * outside would create a second React and blow up on hooks.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicHomepage, faqItems } from "../src/components/PublicHomepage";

export { faqItems };

export function renderLandingHtml(): string {
  return renderToStaticMarkup(createElement(PublicHomepage));
}

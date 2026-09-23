/**
 * SSR-only entry for the landing page prerender.
 *
 * render*Html() is called by scripts/prerender-landing.mjs. The whole
 * React tree (react + react-dom/server) is bundled INTO this file, so the
 * markup and hooks share one React copy — importing react-dom/server from
 * outside would create a second React and blow up on hooks.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicHomepage, faqItems } from "../src/components/PublicHomepage";
import { FeaturesPage } from "../src/components/FeaturesPage";
import { PricingPage } from "../src/components/PricingPage";
import { HowItWorksPage } from "../src/components/HowItWorksPage";
import { FaqPage, faqPageItems } from "../src/components/FaqPage";

export { faqItems, faqPageItems };

export function renderLandingHtml(): string {
  return renderToStaticMarkup(createElement(PublicHomepage));
}

export function renderFeaturesHtml(): string {
  return renderToStaticMarkup(createElement(FeaturesPage));
}

export function renderPricingHtml(): string {
  return renderToStaticMarkup(createElement(PricingPage));
}

export function renderHowItWorksHtml(): string {
  return renderToStaticMarkup(createElement(HowItWorksPage));
}

export function renderFaqHtml(): string {
  return renderToStaticMarkup(createElement(FaqPage));
}

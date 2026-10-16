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
import { TradePage } from "../src/components/TradePage";
import { VsPage } from "../src/components/VsPage";
import { getVs } from "../src/components/vs";
import {
  ConstructionTimeTrackingPage,
  constructionFaqItems,
} from "../src/components/ConstructionTimeTrackingPage";
import {
  ConstructionTimeTrackingCostPage,
  costFaqItems,
} from "../src/components/ConstructionTimeTrackingCostPage";
import {
  ConstructionTimesheetTemplatePage,
  templateFaqItems,
} from "../src/components/ConstructionTimesheetTemplatePage";
import {
  TimeToDecimalChartPage,
  decimalChartFaqItems,
  decimalMinuteRows,
} from "../src/components/TimeToDecimalChartPage";
import {
  ConstructionDailyReportTemplatePage,
  dailyReportFaqItems,
} from "../src/components/ConstructionDailyReportTemplatePage";
import {
  BestConstructionTimeTrackingAppsPage,
  bestAppsFaqItems,
} from "../src/components/BestConstructionTimeTrackingAppsPage";
import { GuidePage, guideFaqItems } from "../src/components/GuidePage";
import { Do1099SubsOvertimePage, overtimeGuideFaqItems } from "../src/components/Do1099SubsOvertimePage";
import { GuidesHubPage, guidesHubItems } from "../src/components/GuidesHubPage";

export { faqItems, faqPageItems, constructionFaqItems, costFaqItems, templateFaqItems, bestAppsFaqItems, guideFaqItems, overtimeGuideFaqItems, decimalChartFaqItems, decimalMinuteRows, guidesHubItems, dailyReportFaqItems };

export function vsPageFaqs(slug: string): { q: string; a: string }[] {
  const page = getVs(slug);
  if (!page) return [];
  return page.faqs.map((item) => ({ q: item.q, a: item.text }));
}

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

export function renderConstructionTimeTrackingHtml(): string {
  return renderToStaticMarkup(createElement(ConstructionTimeTrackingPage));
}

export function renderConstructionTimeTrackingCostHtml(): string {
  return renderToStaticMarkup(createElement(ConstructionTimeTrackingCostPage));
}

export function renderConstructionTimesheetTemplateHtml(): string {
  return renderToStaticMarkup(createElement(ConstructionTimesheetTemplatePage));
}

export function renderTimeToDecimalChartHtml(): string {
  return renderToStaticMarkup(createElement(TimeToDecimalChartPage));
}

export function renderConstructionDailyReportTemplateHtml(): string {
  return renderToStaticMarkup(createElement(ConstructionDailyReportTemplatePage));
}

export function renderBestConstructionTimeTrackingAppsHtml(): string {
  return renderToStaticMarkup(createElement(BestConstructionTimeTrackingAppsPage));
}

export function renderGuidesHubHtml(): string {
  return renderToStaticMarkup(createElement(GuidesHubPage));
}

export function renderGuideHtml(): string {
  return renderToStaticMarkup(createElement(GuidePage));
}

export function renderOvertimeGuideHtml(): string {
  return renderToStaticMarkup(createElement(Do1099SubsOvertimePage));
}

export function renderTradeHtml(slug: string): string {
  return renderToStaticMarkup(createElement(TradePage, { slug }));
}

export function renderVsHtml(slug: string): string {
  return renderToStaticMarkup(createElement(VsPage, { slug }));
}

import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import { initializePostHog } from "./lib/posthog";
import { initializeSentry } from "./lib/sentry";
import "./styles/tokens.css";
import "./styles.css";

initializeSentry();
initializePostHog();

const SERVICE_WORKER_VERSION = "2026-04-24-1";


if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`/sw.js?v=${SERVICE_WORKER_VERSION}`).catch(() => {
      // SW registration failed — not critical
    });
  });
}

// Landing-page host: dist/index.html ships prerendered PublicHomepage markup
// inside #root (data-prerendered marker set by scripts/prerender-landing.mjs).
// Hydrate it instead of re-rendering, so crawlers get real HTML and the demo
// buttons / login routing stay interactive without a double render.
const rootElement = document.getElementById("root")!;
const isPrerenderedLanding = rootElement.hasAttribute("data-prerendered");

const app = (
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div>An error occurred</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

if (isPrerenderedLanding) {
  // Hydration on the landing host: the injected HTML is an exact render of the
  // same tree, so hydrateRoot attaches event listeners without re-rendering.
  // Any future mismatch falls back to client render (React default) — noisy in
  // console but never a blank page.
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}

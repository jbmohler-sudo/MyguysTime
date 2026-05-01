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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div>An error occurred</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);

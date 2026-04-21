import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import { initializeSentry } from "./lib/sentry";
import "./styles/tokens.css";
import "./styles.css";

initializeSentry();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div>An error occurred</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);

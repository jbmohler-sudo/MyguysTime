import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { initializeSentry } from "./lib/sentry";
import "./styles/tokens.css";
import "./styles.css";

initializeSentry();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

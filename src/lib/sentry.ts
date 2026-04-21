import * as Sentry from "@sentry/react";
import { API_BASE } from "./api";

type SampleRateInput = string | undefined;
type FrontendSentryDebugState = {
  initAttempted: boolean;
  initialized: boolean;
  dsnPresent: boolean;
  environment: string;
  mode: string;
  tracesEnabled: boolean;
};

declare global {
  interface Window {
    __MGT_SENTRY_DEBUG__?: FrontendSentryDebugState;
  }
}

function parseSampleRate(value: SampleRateInput): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return undefined;
  }

  return parsed;
}

function buildTracePropagationTargets() {
  const targets: Array<string | RegExp> = [/^\/api\//];

  if (typeof window !== "undefined") {
    targets.push(window.location.origin);
  }

  try {
    targets.push(new URL(API_BASE).origin);
  } catch {
    // Ignore malformed API base values and keep tracing local-only.
  }

  return targets;
}

function parseBooleanFlag(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export const frontendSentryEnabled = Boolean(import.meta.env.VITE_SENTRY_DSN?.trim());
export const frontendSentryVerificationEnabled = parseBooleanFlag(import.meta.env.VITE_SENTRY_VERIFY_ENABLED);

export function initializeSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT?.trim() || import.meta.env.MODE;
  const tracesSampleRate = parseSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE);
  const debugState: FrontendSentryDebugState = {
    initAttempted: true,
    initialized: false,
    dsnPresent: Boolean(dsn),
    environment,
    mode: import.meta.env.MODE,
    tracesEnabled: tracesSampleRate !== undefined,
  };

  if (typeof window !== "undefined") {
    window.__MGT_SENTRY_DEBUG__ = debugState;
  }

  console.info("[frontend-sentry] initializeSentry called", {
    dsnPresent: debugState.dsnPresent,
    environment: debugState.environment,
    mode: debugState.mode,
    tracesEnabled: debugState.tracesEnabled,
  });

  if (!dsn) {
    console.warn("[frontend-sentry] initialization skipped because VITE_SENTRY_DSN is missing");
    return;
  }

  const integrations: Parameters<typeof Sentry.init>[0]["integrations"] = [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ];

  if (tracesSampleRate !== undefined) {
    integrations.push(
      Sentry.browserTracingIntegration({
        traceFetch: true,
        traceXHR: true,
      }),
    );
  }

  Sentry.init({
    dsn,
    environment,
    release: import.meta.env.VITE_SENTRY_RELEASE?.trim() || undefined,
    integrations,
    tracesSampleRate,
    tracePropagationTargets:
      tracesSampleRate !== undefined ? buildTracePropagationTargets() : undefined,
    sendDefaultPii: false,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  debugState.initialized = true;

  if (typeof window !== "undefined") {
    window.__MGT_SENTRY_DEBUG__ = debugState;
  }

  console.info("[frontend-sentry] initialization complete", {
    dsnPresent: debugState.dsnPresent,
    environment: debugState.environment,
    tracesEnabled: debugState.tracesEnabled,
  });
}

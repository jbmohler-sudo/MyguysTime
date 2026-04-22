import * as Sentry from "@sentry/react";
import { API_BASE } from "./api";

type SampleRateInput = string | undefined;

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

export const frontendSentryEnabled = Boolean(import.meta.env.VITE_SENTRY_DSN?.trim());

export function initializeSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT?.trim() || import.meta.env.MODE;
  const tracesSampleRate = parseSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE);

  if (!dsn) {
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
}

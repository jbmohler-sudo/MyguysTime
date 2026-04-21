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

function parseBooleanFlag(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export const frontendSentryEnabled = Boolean(import.meta.env.VITE_SENTRY_DSN?.trim());
export const frontendSentryVerificationEnabled = parseBooleanFlag(import.meta.env.VITE_SENTRY_VERIFY_ENABLED);

export function initializeSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();

  if (!dsn) {
    return;
  }

  const tracesSampleRate = parseSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE);
  const integrations =
    tracesSampleRate !== undefined
      ? [
          Sentry.browserTracingIntegration({
            traceFetch: true,
            traceXHR: true,
          }),
        ]
      : [];

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT?.trim() || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE?.trim() || undefined,
    integrations,
    tracesSampleRate,
    tracePropagationTargets:
      tracesSampleRate !== undefined ? buildTracePropagationTargets() : undefined,
    sendDefaultPii: false,
  });
}

import * as Sentry from "@sentry/node";

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

function parseBooleanFlag(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

const dsn = process.env.SENTRY_DSN?.trim();
const tracesSampleRate = parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE);

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT?.trim() || process.env.NODE_ENV || "development",
    release: process.env.SENTRY_RELEASE?.trim() || undefined,
    integrations: [Sentry.expressIntegration()],
    tracesSampleRate,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.Authorization;
      }

      return event;
    },
  });
}

export { Sentry };
export const sentryEnabled = Boolean(dsn);
export const sentryVerificationEnabled = parseBooleanFlag(process.env.SENTRY_VERIFY_ENABLED);

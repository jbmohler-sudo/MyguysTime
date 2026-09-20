/**
 * Shared paid-access rules for MyGuysTime billing.
 * Used by the client gate and server billing checks so they cannot drift.
 */

export const SUBSCRIPTION_TRIAL_DAYS = 7;

/** Platform owners get complimentary access — no Stripe required. */
export const DEFAULT_PLATFORM_COMPLIMENTARY_EMAILS = ["jbmohler@gmail.com"] as const;

export function trialEndsAtFromNow(from = new Date()) {
  return new Date(from.getTime() + SUBSCRIPTION_TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function parseComplimentaryEmailList(raw?: string | null): string[] {
  if (!raw?.trim()) {
    return [];
  }

  return raw
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformComplimentaryEmail(
  email: string | null | undefined,
  extraEmails: readonly string[] = [],
): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const allowlist = new Set(
    [...DEFAULT_PLATFORM_COMPLIMENTARY_EMAILS, ...extraEmails]
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  return allowlist.has(normalized);
}

export function companyHasPaidAccess(
  status: string | null | undefined,
  trialEndsAt?: Date | string | null,
  viewerEmail?: string | null,
  extraComplimentaryEmails: readonly string[] = [],
): boolean {
  if (isPlatformComplimentaryEmail(viewerEmail, extraComplimentaryEmails)) {
    return true;
  }

  if (status === "active") {
    return true;
  }

  if (status !== "trialing") {
    return false;
  }

  if (!trialEndsAt) {
    return true;
  }

  return new Date(trialEndsAt).getTime() > Date.now();
}

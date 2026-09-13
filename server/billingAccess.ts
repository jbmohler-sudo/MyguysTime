export const SUBSCRIPTION_TRIAL_DAYS = 7;

export function trialEndsAtFromNow(from = new Date()) {
  return new Date(from.getTime() + SUBSCRIPTION_TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function companyHasPaidAccess(
  status: string | null | undefined,
  trialEndsAt?: Date | string | null,
): boolean {
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

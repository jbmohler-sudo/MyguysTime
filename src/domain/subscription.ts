export const SUBSCRIPTION_TRIAL_DAYS = 7;

export function companyHasPaidAccess(
  status: string | null | undefined,
  trialEndsAt?: string | Date | null,
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

export {
  DEFAULT_PLATFORM_COMPLIMENTARY_EMAILS,
  SUBSCRIPTION_TRIAL_DAYS,
  isPlatformComplimentaryEmail,
  parseComplimentaryEmailList,
  trialEndsAtFromNow,
} from "../shared/billingAccess.js";

import {
  companyHasPaidAccess as sharedCompanyHasPaidAccess,
  isPlatformComplimentaryEmail,
  parseComplimentaryEmailList,
} from "../shared/billingAccess.js";

export function extraComplimentaryEmailsFromEnv() {
  return parseComplimentaryEmailList(process.env.PLATFORM_COMPLIMENTARY_EMAILS);
}

export function companyHasPaidAccess(
  status: string | null | undefined,
  trialEndsAt?: Date | string | null,
  viewerEmail?: string | null,
): boolean {
  return sharedCompanyHasPaidAccess(
    status,
    trialEndsAt,
    viewerEmail,
    extraComplimentaryEmailsFromEnv(),
  );
}

export function viewerHasComplimentaryAccess(email: string | null | undefined): boolean {
  return isPlatformComplimentaryEmail(email, extraComplimentaryEmailsFromEnv());
}

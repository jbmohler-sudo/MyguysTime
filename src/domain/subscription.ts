export {
  DEFAULT_PLATFORM_COMPLIMENTARY_EMAILS,
  SUBSCRIPTION_TRIAL_DAYS,
  isPlatformComplimentaryEmail,
  parseComplimentaryEmailList,
} from "../../shared/billingAccess";

import {
  companyHasPaidAccess as sharedCompanyHasPaidAccess,
  parseComplimentaryEmailList,
} from "../../shared/billingAccess";

function extraComplimentaryEmailsFromEnv() {
  return parseComplimentaryEmailList(import.meta.env.VITE_PLATFORM_COMPLIMENTARY_EMAILS);
}

export function companyHasPaidAccess(
  status: string | null | undefined,
  trialEndsAt?: string | Date | null,
  viewerEmail?: string | null,
): boolean {
  return sharedCompanyHasPaidAccess(
    status,
    trialEndsAt,
    viewerEmail,
    extraComplimentaryEmailsFromEnv(),
  );
}

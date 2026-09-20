import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sharedSource = fs.readFileSync(path.join(root, "shared/billingAccess.ts"), "utf8");
const appSource = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
const billingRouteSource = fs.readFileSync(path.join(root, "server/routes/billing.ts"), "utf8");
const helpersSource = fs.readFileSync(path.join(root, "server/routes/helpers.ts"), "utf8");

assert.match(
  sharedSource,
  /DEFAULT_PLATFORM_COMPLIMENTARY_EMAILS = \["jbmohler@gmail.com"\]/,
  "Jeff Mohler must be hardcoded on the platform complimentary list",
);
assert.match(
  appSource,
  /companyHasPaidAccess\(subscription\?\.status, subscription\?\.trialEndsAt, data\?\.viewer\.email\)/,
  "BillingGate must honor complimentary access for the signed-in viewer email",
);
assert.match(
  billingRouteSource,
  /companyHasPaidAccess\([\s\S]*req\.user!\.email/,
  "billing status/sync must pass the authenticated email into paid-access checks",
);
assert.match(
  billingRouteSource,
  /This company is complimentary and has no Stripe billing account to manage\./,
  "billing portal must tell complimentary companies they have no Stripe customer",
);
assert.match(
  helpersSource,
  /complimentary: await companyHasComplimentaryMember\(companyId\)/,
  "bootstrap must treat a complimentary owner's company as paid",
);

const {
  DEFAULT_PLATFORM_COMPLIMENTARY_EMAILS,
  companyHasPaidAccess,
  isPlatformComplimentaryEmail,
  parseComplimentaryEmailList,
} = await import("../dist-server/shared/billingAccess.js");
const serverBilling = await import("../dist-server/server/billingAccess.js");

assert.deepEqual([...DEFAULT_PLATFORM_COMPLIMENTARY_EMAILS], ["jbmohler@gmail.com"]);
assert.equal(isPlatformComplimentaryEmail("jbmohler@gmail.com"), true);
assert.equal(isPlatformComplimentaryEmail("  JBMohler@Gmail.com "), true);
assert.equal(isPlatformComplimentaryEmail("other@example.com"), false);
assert.equal(isPlatformComplimentaryEmail(null), false);

const expiredTrial = new Date(Date.now() - 60 * 1000);
assert.equal(companyHasPaidAccess("trialing", expiredTrial), false);
assert.equal(companyHasPaidAccess("trialing", expiredTrial, "jbmohler@gmail.com"), true);
assert.equal(companyHasPaidAccess("canceled", null, "jbmohler@gmail.com"), true);
assert.equal(companyHasPaidAccess("canceled", null, "crew@example.com"), false);
assert.equal(companyHasPaidAccess("active", null, "crew@example.com"), true);
assert.equal(companyHasPaidAccess("past_due", null, "crew@example.com"), false);

assert.deepEqual(parseComplimentaryEmailList("ada@example.com,  bob@example.com"), [
  "ada@example.com",
  "bob@example.com",
]);
assert.equal(
  companyHasPaidAccess("canceled", null, "ada@example.com", ["ada@example.com"]),
  true,
);

const originalEnv = process.env.PLATFORM_COMPLIMENTARY_EMAILS;
process.env.PLATFORM_COMPLIMENTARY_EMAILS = "extra.owner@example.com";
try {
  assert.equal(serverBilling.companyHasPaidAccess("canceled", null, "extra.owner@example.com"), true);
  assert.equal(serverBilling.companyHasPaidAccess("canceled", null, "random@example.com"), false);
  assert.equal(serverBilling.companyHasPaidAccess("canceled", null, "jbmohler@gmail.com"), true);
} finally {
  if (originalEnv === undefined) {
    delete process.env.PLATFORM_COMPLIMENTARY_EMAILS;
  } else {
    process.env.PLATFORM_COMPLIMENTARY_EMAILS = originalEnv;
  }
}

console.log("billing access tests passed");

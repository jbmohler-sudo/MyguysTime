import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const panelSource = fs.readFileSync(path.join(root, "src/components/AccountSettingsPanel.tsx"), "utf8");
const appSource = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
const billingRouteSource = fs.readFileSync(path.join(root, "server/routes/billing.ts"), "utf8");
const billingGateSource = fs.readFileSync(path.join(root, "src/components/BillingGate.tsx"), "utf8");

assert.match(
  panelSource,
  /subscription\?\.hasCustomer \?/,
  "Manage billing must only render when the company has a Stripe customer",
);

assert.match(
  panelSource,
  /This company is on complimentary access, so there is no Stripe billing account to manage\./,
  "complimentary companies must get an honest explanation instead of a dead Manage billing button",
);

assert.match(
  panelSource,
  /No Stripe billing account yet\. The customer portal is only available after you subscribe\./,
  "companies without a Stripe customer must be told the portal is unavailable",
);

assert.match(
  panelSource,
  /if \(hasComplimentaryAccess\(viewerEmail, subscription\)\) \{\s*return "Complimentary";/,
  "complimentary owners must not be labeled as No subscription",
);

assert.match(
  appSource,
  /setBillingError\(message\);\s*setBillingBusy\(false\);\s*throw err instanceof Error \? err : new Error\(message\);/,
  "billing portal errors must rethrow so Account Settings can show them",
);

assert.match(
  billingGateSource,
  /void Promise\.resolve\(onManageBilling\(\)\)\.catch\(\(\) => undefined\)/,
  "BillingGate must swallow the rethrown portal error because it already displays App billingError",
);

assert.match(
  billingRouteSource,
  /This company is complimentary and has no Stripe billing account to manage\./,
  "portal API must explain complimentary companies instead of a generic subscribe-first error",
);

assert.match(
  billingRouteSource,
  /No billing account yet\. Subscribe first\./,
  "portal API must still reject non-customer companies that are not complimentary",
);

console.log("account billing UI tests passed");

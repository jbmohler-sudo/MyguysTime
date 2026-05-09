import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const appSource = fs.readFileSync(path.join(process.cwd(), "src/App.tsx"), "utf8");
const apiSource = fs.readFileSync(path.join(process.cwd(), "src/lib/api.ts"), "utf8");
const panelSource = fs.readFileSync(path.join(process.cwd(), "src/components/InviteManagementPanel.tsx"), "utf8");
const routesSource = fs.readFileSync(path.join(process.cwd(), "server/routes/invites.ts"), "utf8");

assert.match(
  apiSource,
  /export async function resendInvite\(token: string, inviteId: string\)[\s\S]*`\/company\/invites\/\$\{inviteId\}\/resend`/,
  "resendInvite API must call the existing-invite resend endpoint",
);

assert.match(
  appSource,
  /async function handleResendInvite\(inviteId: string\)[\s\S]*return resendInvite\(token, inviteId\);/,
  "App resend handler must return the resend endpoint result",
);

assert.match(
  panelSource,
  /const result = await onResendInvite\(invite\.id\);/,
  "resend button must use the existing invite id",
);

assert.doesNotMatch(
  panelSource,
  /handleResend[\s\S]*onCreateInvite/,
  "resend flow must not call create invite",
);

assert.match(
  routesSource,
  /router\.post\("\/company\/invites\/:inviteId\/resend"[\s\S]*deliveryMode[\s\S]*inviteUrl/,
  "backend resend response should preserve deliveryMode and regenerated inviteUrl",
);

console.log("invite resend UI tests passed");

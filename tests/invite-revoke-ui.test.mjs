import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const apiSource = fs.readFileSync(path.join(process.cwd(), "src/lib/api.ts"), "utf8");
const panelSource = fs.readFileSync(path.join(process.cwd(), "src/components/InviteManagementPanel.tsx"), "utf8");
const routesSource = fs.readFileSync(path.join(process.cwd(), "server/routes/invites.ts"), "utf8");

assert.match(
  apiSource,
  /export async function revokeInvite\(token: string, inviteId: string\)[\s\S]*`\/company\/invites\/\$\{inviteId\}`[\s\S]*method: "DELETE"/,
  "revokeInvite API must delete by existing invite id",
);

assert.match(
  panelSource,
  /await onRevokeInvite\(invite\.id\);/,
  "revoke button must use the existing invite id",
);

assert.doesNotMatch(
  panelSource,
  /handleRevoke[\s\S]*onCreateInvite/,
  "revoke flow must not call create invite",
);

assert.match(
  routesSource,
  /router\.delete\("\/company\/invites\/:inviteId"[\s\S]*findUnique\({[\s\S]*where: \{ id: inviteId \}/,
  "backend revoke should resolve the invite by id before company/status checks",
);

for (const message of [
  "Invite not found or already revoked.",
  "This invite belongs to another company.",
  "Accepted invites cannot be revoked.",
  "Invite was already revoked.",
]) {
  assert.match(routesSource, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

console.log("invite revoke UI tests passed");

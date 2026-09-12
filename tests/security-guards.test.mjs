import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const authRoute = fs.readFileSync(path.join(process.cwd(), "server/routes/auth.ts"), "utf8");
const authMiddleware = fs.readFileSync(path.join(process.cwd(), "server/auth.ts"), "utf8");
const envExample = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf8");
const signupBlock = authRoute.split('router.post("/auth/signup"')[1].split('router.post("/auth/accept-invite"')[0];

assert.doesNotMatch(
  signupBlock,
  /updateUserById/,
  "unauthenticated signup must never reset an existing Auth user's password",
);
assert.match(
  signupBlock,
  /existingAuthUser/,
  "signup must reject emails that already exist in Supabase Auth",
);
assert.match(
  signupBlock,
  /pendingInvite/,
  "signup must reject emails with a pending invite",
);
assert.doesNotMatch(
  authMiddleware,
  /req\.query\.token/,
  "JWT must not be accepted from a query string",
);
assert.doesNotMatch(
  envExample,
  /CMStrength2026|eyJhbGciOi/,
  ".env.example must not contain real-looking secrets",
);

console.log("security guard tests passed");

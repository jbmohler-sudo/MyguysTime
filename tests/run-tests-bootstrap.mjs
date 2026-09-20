import "dotenv/config";

process.env.NODE_ENV = "test";
process.env.MYGUYS_FIXTURE_ENV = "test";
process.env.INVITE_EMAIL_TRANSPORT = "test";
process.env.SENTRY_UPLOAD_SOURCEMAPS = "false";

const { assertSafeFixtureMutationContext } = await import("../dist-server/server/envSafety.js");
assertSafeFixtureMutationContext("tests/run-tests.mjs");

await import("./security-guards.test.mjs");
await import("./public-url.test.mjs");
await import("./billing-access.test.mjs");
await import("./dashboard-quick-fix-ui.test.mjs");
await import("./account-billing-ui.test.mjs");
await import("./run-tests.mjs");

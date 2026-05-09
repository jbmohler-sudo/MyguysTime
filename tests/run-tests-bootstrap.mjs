import "dotenv/config";

process.env.NODE_ENV = "test";
process.env.MYGUYS_FIXTURE_ENV = "test";
process.env.INVITE_EMAIL_TRANSPORT = "test";
process.env.SENTRY_UPLOAD_SOURCEMAPS = "false";

const { assertSafeFixtureMutationContext } = await import("../dist-server/server/envSafety.js");
assertSafeFixtureMutationContext("tests/run-tests.mjs");

await import("./run-tests.mjs");

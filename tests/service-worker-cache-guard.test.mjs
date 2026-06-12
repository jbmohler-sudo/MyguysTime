import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const swSource = fs.readFileSync(path.join(process.cwd(), "public/sw.js"), "utf8");

assert.match(
  swSource,
  /if \(event\.request\.method !== "GET"\) return;/,
  "service worker must ignore non-GET requests before caching",
);

assert.match(
  swSource,
  /const requestUrl = new URL\(event\.request\.url\);[\s\S]*requestUrl\.protocol !== "http:" && requestUrl\.protocol !== "https:"[\s\S]*return;/,
  "service worker must bypass non-http(s) request schemes before respondWith/cache.put",
);

assert.match(
  swSource,
  /if \(requestUrl\.pathname\.startsWith\("\/api\/"\)\) return;/,
  "service worker must preserve the existing API bypass",
);

assert.match(
  swSource,
  /cache\.put\(event\.request, clone\)\)\.catch\(\(\) => undefined\)/,
  "service worker cache.put must be non-fatal if the runtime cache write fails",
);

console.log("service worker cache guard tests passed");

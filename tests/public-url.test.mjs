import assert from "node:assert/strict";
import { getAllowedOrigins, isOriginAllowed, resolvePublicAppUrl } from "../dist-server/server/publicUrl.js";

const originalEnv = {
  APP_URL: process.env.APP_URL,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  NODE_ENV: process.env.NODE_ENV,
};

function restoreEnv() {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

try {
  process.env.APP_URL = "https://app.example.com/";
  process.env.CORS_ORIGINS = "https://preview.example.com";
  process.env.NODE_ENV = "production";

  assert.deepEqual(getAllowedOrigins().sort(), [
    "https://app.example.com",
    "https://preview.example.com",
  ]);
  assert.equal(isOriginAllowed(undefined), true);
  assert.equal(isOriginAllowed("https://app.example.com"), true);
  assert.equal(isOriginAllowed("https://evil.example"), false);

  const url = resolvePublicAppUrl({
    protocol: "https",
    get(name) {
      if (name === "origin") {
        return "https://evil.example";
      }
      if (name === "host") {
        return "evil.example";
      }
      return undefined;
    },
  });
  assert.equal(url, "https://app.example.com");

  process.env.NODE_ENV = "development";
  delete process.env.APP_URL;
  delete process.env.CORS_ORIGINS;
  assert.equal(isOriginAllowed("http://localhost:5173"), true);
  assert.equal(
    resolvePublicAppUrl({
      protocol: "http",
      get(name) {
        return name === "host" ? "127.0.0.1:3001" : undefined;
      },
    }),
    "http://127.0.0.1:3001",
  );

  console.log("public URL tests passed");
} finally {
  restoreEnv();
}

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "dotenv";

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const productionEnvPath = path.join(workspaceRoot, ".env.production.tmp");

function trimEnvValue(value) {
  return typeof value === "string" ? value.trim() : value;
}

if (fs.existsSync(productionEnvPath)) {
  const productionEnv = parse(fs.readFileSync(productionEnvPath, "utf8"));
  const localDatabaseUrl = trimEnvValue(process.env.DATABASE_URL);
  const prefersNeonForTests =
    !localDatabaseUrl ||
    localDatabaseUrl.includes("supabase.co") ||
    localDatabaseUrl === '""';

  if (prefersNeonForTests) {
    const neonPrismaUrl = trimEnvValue(productionEnv.NEON_POSTGRES_PRISMA_URL);
    const neonDirectUrl =
      trimEnvValue(productionEnv.NEON_POSTGRES_URL_NON_POOLING) ||
      trimEnvValue(productionEnv.NEON_DATABASE_URL_UNPOOLED) ||
      neonPrismaUrl;

    if (neonPrismaUrl) {
      process.env.DATABASE_URL = neonPrismaUrl;
    }

    if (neonDirectUrl) {
      process.env.DIRECT_URL = neonDirectUrl;
    }
  }

  process.env.VITE_SUPABASE_URL = trimEnvValue(process.env.VITE_SUPABASE_URL);
  process.env.VITE_SUPABASE_ANON_KEY = trimEnvValue(process.env.VITE_SUPABASE_ANON_KEY);
}

await import("./run-tests.mjs");

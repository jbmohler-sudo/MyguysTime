type FixtureEnvironment = "local" | "test";

const FIXTURE_ENV_VALUES = new Set<FixtureEnvironment>(["local", "test"]);
const REMOTE_FIXTURE_CONFIRMATION =
  "I_UNDERSTAND_THIS_MUTATES_A_DEDICATED_FIXTURE_ENVIRONMENT";

function env(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function isAffirmative(value: string) {
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isLocalHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

function hostnameFromDatabaseUrl(value: string) {
  const parsed = parseUrl(value);
  return parsed?.hostname.toLowerCase() ?? "";
}

function isLocalDatabaseUrl(value: string) {
  const hostname = hostnameFromDatabaseUrl(value);
  return Boolean(hostname) && isLocalHostname(hostname);
}

function isRemoteFixtureOverrideConfirmed() {
  return env("MYGUYS_ALLOW_REMOTE_FIXTURES") === REMOTE_FIXTURE_CONFIRMATION;
}

function looksProductionNamed(value: string) {
  return /\b(prod|production|preview|vercel|live)\b/i.test(value);
}

function getFixtureEnvironment(): FixtureEnvironment | null {
  const fixtureEnv = env("MYGUYS_FIXTURE_ENV").toLowerCase();
  return FIXTURE_ENV_VALUES.has(fixtureEnv as FixtureEnvironment)
    ? (fixtureEnv as FixtureEnvironment)
    : null;
}

function collectGlobalProductionSignals() {
  const signals: string[] = [];

  if (env("NODE_ENV") === "production") {
    signals.push("NODE_ENV=production");
  }

  const vercelEnv = env("VERCEL_ENV").toLowerCase();
  if (vercelEnv === "production" || vercelEnv === "preview") {
    signals.push(`VERCEL_ENV=${vercelEnv}`);
  }

  return signals;
}

function collectDatabaseRisks() {
  const risks: string[] = [];
  const databaseUrl = env("DATABASE_URL");
  const directUrl = env("DIRECT_URL");
  const urls = [
    ["DATABASE_URL", databaseUrl],
    ["DIRECT_URL", directUrl],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  for (const [name, value] of urls) {
    const host = hostnameFromDatabaseUrl(value);
    if (!host) {
      risks.push(`${name} is not a parseable URL`);
      continue;
    }

    if (isLocalHostname(host)) {
      continue;
    }

    if (host.includes("neon.tech") || host.includes("neon.build")) {
      risks.push(`${name} points at remote Neon host ${host}`);
      continue;
    }

    risks.push(`${name} points at non-local host ${host}`);
  }

  if (databaseUrl && looksProductionNamed(databaseUrl)) {
    risks.push("DATABASE_URL contains production-like naming");
  }

  return risks;
}

function collectSupabaseRisks() {
  const risks: string[] = [];
  const supabaseUrl = env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
  const parsed = supabaseUrl ? parseUrl(supabaseUrl) : null;

  if (!supabaseUrl) {
    return risks;
  }

  if (!parsed) {
    risks.push("SUPABASE_URL/VITE_SUPABASE_URL is not a parseable URL");
    return risks;
  }

  const host = parsed.hostname.toLowerCase();
  if (isLocalHostname(host)) {
    return risks;
  }

  if (host.endsWith(".supabase.co")) {
    risks.push(`Supabase points at hosted project ${host}`);
  } else {
    risks.push(`Supabase points at non-local host ${host}`);
  }

  if (looksProductionNamed(supabaseUrl)) {
    risks.push("Supabase URL contains production-like naming");
  }

  return risks;
}

export function getFixtureMutationSafetyReport() {
  const fixtureEnv = getFixtureEnvironment();
  const globalSignals = collectGlobalProductionSignals();
  const databaseRisks = collectDatabaseRisks();
  const supabaseRisks = collectSupabaseRisks();
  const isLocalDb = isLocalDatabaseUrl(env("DATABASE_URL"));
  const supabaseUrl = env("SUPABASE_URL") || env("VITE_SUPABASE_URL");
  const supabaseHost = parseUrl(supabaseUrl)?.hostname.toLowerCase() ?? "";
  const isLocalSupabase = !supabaseUrl || isLocalHostname(supabaseHost);
  const remoteFixtureConfirmed = isRemoteFixtureOverrideConfirmed();
  const supabaseFixtureConfirmed = isAffirmative(env("MYGUYS_SUPABASE_FIXTURE_PROJECT"));

  return {
    fixtureEnv,
    globalSignals,
    databaseRisks,
    supabaseRisks,
    isLocalDb,
    isLocalSupabase,
    remoteFixtureConfirmed,
    supabaseFixtureConfirmed,
  };
}

export function assertSafeFixtureMutationContext(caller: string) {
  const report = getFixtureMutationSafetyReport();
  const failures: string[] = [];

  if (!report.fixtureEnv) {
    failures.push("Set MYGUYS_FIXTURE_ENV=local or MYGUYS_FIXTURE_ENV=test before running fixture mutations.");
  }

  failures.push(...report.globalSignals);

  if (!report.isLocalDb) {
    if (!report.remoteFixtureConfirmed) {
      failures.push(...report.databaseRisks);
      failures.push(
        `Remote fixture databases require MYGUYS_ALLOW_REMOTE_FIXTURES=${REMOTE_FIXTURE_CONFIRMATION}.`,
      );
    }
  }

  if (!report.isLocalSupabase) {
    if (!report.remoteFixtureConfirmed || !report.supabaseFixtureConfirmed) {
      failures.push(...report.supabaseRisks);
      failures.push(
        "Remote Supabase Auth fixtures require MYGUYS_SUPABASE_FIXTURE_PROJECT=true plus the remote fixture confirmation.",
      );
    }
  }

  if (failures.length > 0) {
    throw new Error(
      [
        `[env-safety] Refusing to run ${caller}.`,
        "This command creates, updates, or deletes fixture users/data.",
        ...failures.map((failure) => `- ${failure}`),
      ].join("\n"),
    );
  }
}

export function assertNoTestEmailSideEffects() {
  if (getFixtureEnvironment() !== "test") {
    return;
  }

  if (env("INVITE_EMAIL_TRANSPORT") === "test") {
    return;
  }

  if (isAffirmative(env("MYGUYS_ALLOW_TEST_EMAIL_SENDS"))) {
    return;
  }

  throw new Error(
    [
      "[env-safety] Refusing to send real invite email during tests.",
      "Set INVITE_EMAIL_TRANSPORT=test for test runs.",
      "Only set MYGUYS_ALLOW_TEST_EMAIL_SENDS=true when intentionally testing a dedicated email sandbox.",
    ].join("\n"),
  );
}

export { REMOTE_FIXTURE_CONFIRMATION };

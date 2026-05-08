import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import dotenv from "dotenv";

const DEFAULT_EMAIL = "jbmohler@gmail.com";
const MAX_AUTH_LIST_PAGES = 10;
const AUTH_LIST_PAGE_SIZE = 200;

type RepairArgs = {
  apply: boolean;
  email: string;
  envFile: string | null;
};

type AppUser = Awaited<ReturnType<typeof findAppUsersByEmail>>[number];

function parseArgs(argv: string[]): RepairArgs {
  const args: RepairArgs = {
    apply: false,
    email: DEFAULT_EMAIL,
    envFile: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      args.apply = true;
      continue;
    }

    if (arg === "--email") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--email requires a value.");
      }
      args.email = value;
      index += 1;
      continue;
    }

    if (arg === "--env-file") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--env-file requires a value.");
      }
      args.envFile = value;
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  args.email = normalizeEmail(args.email);
  return args;
}

function printUsage() {
  console.log(`
Repair a missing Supabase Auth identity for an existing Prisma user.

Dry run:
  npx tsx scripts/repair-supabase-auth-user.ts

Apply:
  npx tsx scripts/repair-supabase-auth-user.ts --apply

Options:
  --email <email>       Defaults to ${DEFAULT_EMAIL}
  --env-file <path>     Load an additional env file before running
  --apply              Create/relink the Supabase Auth user and update Prisma
`);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function loadOptionalEnvFile(path: string | null) {
  if (!path) {
    return;
  }

  const result = dotenv.config({ path, override: true });
  if (result.error) {
    throw result.error;
  }
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function resolveDatabaseUrl() {
  const candidates = [
    ["DATABASE_URL", process.env.DATABASE_URL],
    ["NEON_POSTGRES_PRISMA_URL", process.env.NEON_POSTGRES_PRISMA_URL],
    ["NEON_DATABASE_URL", process.env.NEON_DATABASE_URL],
    ["NEON_POSTGRES_URL", process.env.NEON_POSTGRES_URL],
    ["DIRECT_URL", process.env.DIRECT_URL],
    ["NEON_DATABASE_URL_UNPOOLED", process.env.NEON_DATABASE_URL_UNPOOLED],
    ["NEON_POSTGRES_URL_NON_POOLING", process.env.NEON_POSTGRES_URL_NON_POOLING],
  ] as const;

  const match = candidates.find(([, value]) => Boolean(value?.trim()));
  if (!match) {
    throw new Error(
      "Missing database URL. Set DATABASE_URL or a Neon fallback such as NEON_POSTGRES_PRISMA_URL.",
    );
  }

  return {
    source: match[0],
    url: match[1]!.trim(),
  };
}

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function findAppUsersByEmail(prisma: PrismaClient, email: string) {
  return prisma.user.findMany({
    where: { email },
    select: {
      id: true,
      supabaseId: true,
      companyId: true,
      email: true,
      fullName: true,
      role: true,
      employeeId: true,
      status: true,
      invitedAt: true,
      acceptedAt: true,
      deactivatedAt: true,
      createdAt: true,
      updatedAt: true,
      company: {
        select: {
          id: true,
          companyName: true,
          stateCode: true,
          onboardingCompletedAt: true,
        },
      },
      employee: {
        select: {
          id: true,
          displayName: true,
          employmentStatus: true,
          archivedAt: true,
        },
      },
    },
  });
}

async function findSupabaseAuthUserByEmail(supabase: SupabaseClient, email: string) {
  let matchedUser: User | null = null;

  for (let page = 1; page <= MAX_AUTH_LIST_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: AUTH_LIST_PAGE_SIZE,
    });

    if (error) {
      throw error;
    }

    const users = data?.users ?? [];
    const pageMatches = users.filter((candidate) => normalizeEmail(candidate.email ?? "") === email);

    if (pageMatches.length > 1 || (matchedUser && pageMatches.length > 0)) {
      throw new Error(`More than one Supabase Auth user matched ${email}. Aborting.`);
    }

    if (pageMatches.length === 1) {
      matchedUser = pageMatches[0];
    }

    if (users.length < AUTH_LIST_PAGE_SIZE) {
      break;
    }
  }

  return matchedUser;
}

async function getSupabaseAuthUserById(supabase: SupabaseClient, supabaseId: string | null) {
  if (!supabaseId) {
    return null;
  }

  const { data, error } = await supabase.auth.admin.getUserById(supabaseId);

  if (!error) {
    return data.user ?? null;
  }

  if ("status" in error && error.status === 404) {
    return null;
  }

  throw error;
}

function redactId(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function summarizeAppUser(user: AppUser) {
  return {
    id: redactId(user.id),
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    deactivatedAt: user.deactivatedAt?.toISOString() ?? null,
    supabaseId: redactId(user.supabaseId),
    employeeId: redactId(user.employeeId),
    company: {
      id: redactId(user.company.id),
      companyName: user.company.companyName,
      stateCode: user.company.stateCode,
      onboardingCompletedAt: user.company.onboardingCompletedAt?.toISOString() ?? null,
    },
    employee: user.employee
      ? {
          id: redactId(user.employee.id),
          displayName: user.employee.displayName,
          employmentStatus: user.employee.employmentStatus,
          archivedAt: user.employee.archivedAt?.toISOString() ?? null,
        }
      : null,
  };
}

function summarizeAuthUser(user: User | null) {
  if (!user) {
    return null;
  }

  return {
    id: redactId(user.id),
    email: user.email ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
    confirmedAt: user.confirmed_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    createdAt: user.created_at,
  };
}

async function assertNoOtherPrismaUserLinkedToAuthId(
  prisma: PrismaClient,
  appUserId: string,
  supabaseId: string,
) {
  const linkedUser = await prisma.user.findUnique({
    where: { supabaseId },
    select: {
      id: true,
      email: true,
    },
  });

  if (linkedUser && linkedUser.id !== appUserId) {
    throw new Error(
      `Supabase Auth ID is already linked to another Prisma user (${linkedUser.email}). Aborting.`,
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  loadOptionalEnvFile(args.envFile);

  if (args.email !== DEFAULT_EMAIL) {
    throw new Error(
      `This one-time repair script is locked to ${DEFAULT_EMAIL}. Received ${args.email}.`,
    );
  }

  const database = resolveDatabaseUrl();
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: database.url,
      },
    },
  });
  const supabase = createSupabaseAdminClient();

  console.log("Supabase Auth repair for existing Prisma user");
  console.log(`Mode: ${args.apply ? "APPLY" : "DRY RUN"}`);
  console.log(`Email: ${args.email}`);
  console.log(`Database env source: ${database.source}`);

  try {
    const appUsers = await findAppUsersByEmail(prisma, args.email);
    if (appUsers.length !== 1) {
      throw new Error(`Expected exactly one Prisma user for ${args.email}; found ${appUsers.length}.`);
    }

    const appUser = appUsers[0];
    if (appUser.status !== "ACTIVE" || appUser.deactivatedAt) {
      throw new Error("Prisma user is not active. Aborting.");
    }

    const authUserByExistingId = await getSupabaseAuthUserById(supabase, appUser.supabaseId);
    const authUserByEmail = await findSupabaseAuthUserByEmail(supabase, args.email);

    console.log("\nBefore");
    console.log(JSON.stringify({
      prismaUser: summarizeAppUser(appUser),
      supabaseAuthByExistingId: summarizeAuthUser(authUserByExistingId),
      supabaseAuthByEmail: summarizeAuthUser(authUserByEmail),
    }, null, 2));

    if (authUserByExistingId && normalizeEmail(authUserByExistingId.email ?? "") !== args.email) {
      throw new Error(
        "Existing Prisma supabaseId points to a Supabase Auth user with a different email. Aborting.",
      );
    }

    if (
      authUserByExistingId &&
      authUserByEmail &&
      authUserByExistingId.id !== authUserByEmail.id
    ) {
      throw new Error(
        "Supabase Auth has different users by existing ID and by email. Aborting for manual review.",
      );
    }

    const healthyAuthUser = authUserByExistingId ?? authUserByEmail;
    if (healthyAuthUser && appUser.supabaseId === healthyAuthUser.id) {
      console.log("\nResult");
      console.log("No repair needed. Prisma User.supabaseId already points to the Supabase Auth user.");
      return;
    }

    if (healthyAuthUser) {
      await assertNoOtherPrismaUserLinkedToAuthId(prisma, appUser.id, healthyAuthUser.id);
      console.log("\nPlanned repair");
      console.log(`Relink existing Prisma user to Supabase Auth ID ${redactId(healthyAuthUser.id)}.`);

      if (args.apply) {
        await prisma.user.update({
          where: { id: appUser.id },
          data: { supabaseId: healthyAuthUser.id },
        });
      }
    } else {
      console.log("\nPlanned repair");
      console.log("Create a new confirmed Supabase Auth user, then link the existing Prisma user to it.");

      if (args.apply) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: args.email,
          email_confirm: true,
          user_metadata: {
            repaired_by: "scripts/repair-supabase-auth-user.ts",
            repair_reason: "missing_supabase_auth_identity",
          },
        });

        if (error || !data.user) {
          throw error ?? new Error("Supabase Auth user creation returned no user.");
        }

        await assertNoOtherPrismaUserLinkedToAuthId(prisma, appUser.id, data.user.id);
        await prisma.user.update({
          where: { id: appUser.id },
          data: { supabaseId: data.user.id },
        });
      }
    }

    const afterUsers = await findAppUsersByEmail(prisma, args.email);
    const afterUser = afterUsers[0];
    const afterAuthById = args.apply
      ? await getSupabaseAuthUserById(supabase, afterUser.supabaseId)
      : null;
    const afterAuthByEmail = args.apply
      ? await findSupabaseAuthUserByEmail(supabase, args.email)
      : authUserByEmail;

    console.log("\nAfter");
    console.log(JSON.stringify({
      dryRun: !args.apply,
      prismaUser: summarizeAppUser(afterUser),
      supabaseAuthByLinkedId: summarizeAuthUser(afterAuthById),
      supabaseAuthByEmail: summarizeAuthUser(afterAuthByEmail),
    }, null, 2));

    if (!args.apply) {
      console.log("\nDry run only. Re-run with --apply after reviewing this output.");
    } else {
      console.log("\nRepair applied. Next: use the existing forgot-password flow to set the password.");
      console.log("Verification checklist:");
      console.log("1. Supabase Auth user exists by email.");
      console.log("2. Prisma User.supabaseId matches the Supabase Auth ID.");
      console.log("3. Forgot-password request succeeds from /forgot-password.");
      console.log("4. Login succeeds with the newly set password.");
      console.log("5. /api/auth/me returns Jeff Mohler as ADMIN for JB Mohler Masonry.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\nRepair failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

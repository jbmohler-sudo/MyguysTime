import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import {
  DEFAULT_PLATFORM_COMPLIMENTARY_EMAILS,
  extraComplimentaryEmailsFromEnv,
} from "../server/billingAccess.js";

type ScriptArgs = {
  apply: boolean;
  extraEmail: string | null;
  envFile: string | null;
};

function parseArgs(argv: string[]): ScriptArgs {
  const args: ScriptArgs = {
    apply: false,
    extraEmail: null,
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
      args.extraEmail = value.trim().toLowerCase();
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

  return args;
}

function printUsage() {
  console.log(`
Ensure platform complimentary owners are ADMIN for their company.

The billing allowlist already bypasses the paywall for these emails even if
this script is not run. Use this only when a listed owner is missing the ADMIN role.

Dry run:
  npx tsx scripts/ensure-platform-owner-admin.ts

Apply:
  npx tsx scripts/ensure-platform-owner-admin.ts --apply

Options:
  --email <email>     Also ensure this extra email (in addition to the default list)
  --env-file <path>   Load an additional env file before running
  --apply             Write role=ADMIN and status=ACTIVE for matching users
`);
}

function targetEmails(extraEmail: string | null): string[] {
  return Array.from(
    new Set(
      [...DEFAULT_PLATFORM_COMPLIMENTARY_EMAILS, ...extraComplimentaryEmailsFromEnv(), extraEmail]
        .map((email) => email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email)),
    ),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.envFile) {
    dotenv.config({ path: args.envFile, override: true });
  }

  const emails = targetEmails(args.extraEmail);
  const prisma = new PrismaClient();

  try {
    const users = await prisma.user.findMany({
      where: {
        OR: emails.map((email) => ({
          email: { equals: email, mode: "insensitive" as const },
        })),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        company: { select: { companyName: true } },
      },
      orderBy: { email: "asc" },
    });

    const foundEmails = new Set(users.map((user) => user.email.trim().toLowerCase()));
    const missing = emails.filter((email) => !foundEmails.has(email));

    if (missing.length > 0) {
      console.log("No Prisma user found for:", missing.join(", "));
    }

    if (users.length === 0) {
      console.log("Nothing to update. Complimentary billing access does not require this script.");
      return;
    }

    for (const user of users) {
      const alreadyAdmin = user.role === "ADMIN" && user.status === "ACTIVE";
      console.log(
        `${user.email} (${user.fullName}) at ${user.company.companyName}: role=${user.role} status=${user.status}` +
          (alreadyAdmin ? " — already ADMIN" : " — needs ADMIN"),
      );

      if (alreadyAdmin || !args.apply) {
        continue;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN", status: "ACTIVE", deactivatedAt: null },
      });
      console.log(`  updated ${user.email} to ADMIN`);
    }

    if (!args.apply) {
      console.log("\nDry run only. Re-run with --apply to write ADMIN.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

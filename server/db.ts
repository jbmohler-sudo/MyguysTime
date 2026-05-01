import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL?.trim()) {
  throw new Error("Set DATABASE_URL before starting the server.");
}

export const prisma = new PrismaClient();

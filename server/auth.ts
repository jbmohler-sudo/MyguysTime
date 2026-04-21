import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret";
export type UserRole = "ADMIN" | "FOREMAN" | "EMPLOYEE";

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  companyId: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthTokenPayload;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function issueToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.header("Authorization");
  const queryToken = typeof req.query.token === "string" ? req.query.token : null;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : queryToken;

  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    req.auth = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token." });
  }
}

export async function getCurrentUserOrThrow(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      employee: true,
    },
  });

  if (!user) {
    throw new Error("Authenticated user not found.");
  }

  return user;
}

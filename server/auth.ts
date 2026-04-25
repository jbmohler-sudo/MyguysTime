import type { NextFunction, Request, Response } from "express";
import { prisma } from "./db.js";
import { getSupabaseAuthClient } from "./supabase.js";

export type UserRole = "ADMIN" | "FOREMAN" | "EMPLOYEE";

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
  companyId: string;
}

export interface AuthenticatedUser {
  id: string;
  supabaseId: string | null;
  companyId: string;
  email: string;
  fullName: string;
  role: UserRole;
  employeeId: string | null;
  status: string;
  deactivatedAt: Date | null;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthTokenPayload;
  user?: AuthenticatedUser;
}


function toUserRole(role: string): UserRole | null {
  if (role === "ADMIN" || role === "FOREMAN" || role === "EMPLOYEE") {
    return role;
  }

  return null;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.header("Authorization");
  const queryToken = typeof req.query.token === "string" ? req.query.token : null;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : queryToken;

  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    const supabase = getSupabaseAuthClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({ error: "Invalid token." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: data.user.id },
      select: {
        id: true,
        supabaseId: true,
        companyId: true,
        email: true,
        fullName: true,
        role: true,
        employeeId: true,
        status: true,
        deactivatedAt: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: "Authenticated user not found." });
      return;
    }

    if (data.user.email && data.user.email !== user.email) {
      await prisma.user.update({
        where: { id: user.id },
        data: { email: data.user.email },
      });
      user.email = data.user.email;
    }

    if (user.status !== "ACTIVE" || user.deactivatedAt) {
      res.status(403).json({ error: "This login is not active." });
      return;
    }

    const role = toUserRole(user.role);
    if (!role) {
      res.status(403).json({ error: "User role is not supported." });
      return;
    }

    req.user = { ...user, role };
    req.auth = {
      userId: user.id,
      role,
      companyId: user.companyId,
    };

    next();
  } catch (error) {
    next(error);
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

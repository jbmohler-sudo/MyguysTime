import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../auth.js";
import { prisma } from "../db.js";
import { getSupabaseAuthClient } from "../supabase.js";
import { parseWeekStart } from "../utils.js";
import {
  asyncHandler,
  buildBootstrap,
  hashInviteToken,
  SIGNUP_DEFAULT_STATE_CODE,
} from "./helpers.js";

const router = Router();

async function findSupabaseAuthUserByEmail(
  supabase: ReturnType<typeof getSupabaseAuthClient>,
  email: string,
) {
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const matchedUser = data.users.find(
      (candidate) => candidate.email?.trim().toLowerCase() === email,
    );

    if (matchedUser) {
      return matchedUser;
    }

    if (data.users.length < 200) {
      break;
    }

    page += 1;
  }

  return null;
}

router.post("/auth/signup", asyncHandler(async (req, res) => {
  const { fullName, companyName, email, password } = req.body as {
    fullName?: string;
    companyName?: string;
    email?: string;
    password?: string;
  };

  const trimmedFullName = fullName?.trim() || "";
  const trimmedCompanyName = companyName?.trim() || "";
  const normalizedEmail = email?.trim().toLowerCase() || "";
  const debugSignup = req.header("x-debug-signup") === "true";
  const databaseHost = (() => {
    try {
      return new URL(process.env.DATABASE_URL || "").hostname || null;
    } catch {
      return null;
    }
  })();

  if (!trimmedFullName) {
    res.status(400).json({ error: "Full name is required." });
    return;
  }

  if (!trimmedCompanyName) {
    res.status(400).json({ error: "Company name is required." });
    return;
  }

  if (!normalizedEmail.includes("@")) {
    res.status(400).json({ error: "Valid email is required." });
    return;
  }

  if (!password || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    console.log("[auth:signup] lookup", {
      normalizedEmail,
      foundExistingUser: Boolean(existingUser),
      existingUserId: existingUser?.id ?? null,
      existingUserCompanyId: existingUser?.companyId ?? null,
      databaseHost,
    });

    if (existingUser) {
      res.status(409).json({
        error: "An account with this email already exists.",
        ...(debugSignup ? {
          debug: {
            normalizedEmail,
            foundExistingUser: true,
            existingUserId: existingUser.id,
            existingUserCompanyId: existingUser.companyId,
            databaseHost,
          },
        } : {}),
      });
      return;
    }

    const supabase = getSupabaseAuthClient();
    const existingAuthUser = await findSupabaseAuthUserByEmail(supabase, normalizedEmail);

    let supabaseUserId: string;
    let createdAuthUser = false;

    if (existingAuthUser) {
      const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
        existingAuthUser.id,
        {
          email: normalizedEmail,
          password,
          email_confirm: true,
        },
      );

      if (authError || !authData.user) {
        const errorMsg = authError?.message || "Failed to recover authentication account.";
        res.status(400).json({ error: errorMsg });
        return;
      }

      supabaseUserId = authData.user.id;
    } else {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        const errorMsg = authError?.message || "Failed to create authentication account.";
        res.status(400).json({ error: errorMsg });
        return;
      }

      supabaseUserId = authData.user.id;
      createdAuthUser = true;
    }

    let user;

    try {
      user = await prisma.$transaction(async (tx) => {
        const reusableCompany = await tx.company.findFirst({
          where: {
            companyName: trimmedCompanyName,
            users: {
              none: {},
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
          },
        });

        const companyId = reusableCompany?.id ?? (
          await tx.company.create({
            data: {
              companyName: trimmedCompanyName,
              stateCode: SIGNUP_DEFAULT_STATE_CODE,
              updatedAt: new Date(),
            },
            select: {
              id: true,
            },
          })
        ).id;

        await tx.companyPayrollSettings.upsert({
          where: {
            companyId,
          },
          update: {
            updatedAt: new Date(),
          },
          create: {
            companyId,
            updatedAt: new Date(),
          },
        });

        return tx.user.create({
          data: {
            supabaseId: supabaseUserId,
            companyId,
            email: normalizedEmail,
            fullName: trimmedFullName,
            role: "ADMIN",
            status: "ACTIVE",
          },
        });
      });
    } catch (dbError) {
      if (createdAuthUser) {
        await supabase.auth.admin.deleteUser(supabaseUserId);
      }

      throw dbError;
    }

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role.toLowerCase(),
        companyId: user.companyId,
      },
    });
  } catch (error) {
    console.error("[auth:signup] error:", error);
    res.status(500).json({ error: "Failed to create account." });
  }
}));

router.post("/auth/accept-invite", asyncHandler(async (req, res) => {
  const { token, password, fullName } = req.body as {
    token?: string;
    password?: string;
    fullName?: string;
  };

  const trimmedFullName = fullName?.trim() || "";

  if (!token) {
    res.status(400).json({ error: "Invite token is required." });
    return;
  }

  if (!trimmedFullName) {
    res.status(400).json({ error: "Full name is required." });
    return;
  }

  if (!password || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  try {
    const tokenHash = hashInviteToken(token);
    const invite = await prisma.userInvite.findUnique({
      where: { tokenHash },
      include: {
        company: true,
      },
    });

    if (!invite) {
      res.status(404).json({ error: "Invite not found." });
      return;
    }

    if (invite.acceptedAt) {
      res.status(409).json({ error: "This invite has already been accepted." });
      return;
    }

    const now = new Date();
    if (invite.expiresAt <= now) {
      res.status(410).json({ error: "This invite has expired." });
      return;
    }

    const inviteEmail = invite.email?.trim().toLowerCase() || "";
    if (!inviteEmail.includes("@")) {
      res.status(400).json({ error: "Invalid email on invite." });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: inviteEmail },
      select: {
        id: true,
        status: true,
        deactivatedAt: true,
        companyId: true,
      },
    });

    if (existingUser && existingUser.status === "ACTIVE" && !existingUser.deactivatedAt) {
      res.status(409).json({ error: "An active account already exists with this email." });
      return;
    }

    const supabase = getSupabaseAuthClient();
    let supabaseUserId: string;

    if (existingUser?.id) {
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password }
      );

      if (updateError || !updateData.user) {
        res.status(400).json({ error: "Failed to reset password." });
        return;
      }

      supabaseUserId = updateData.user.id;
    } else {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: inviteEmail,
        password,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        res.status(400).json({ error: "Failed to create authentication account." });
        return;
      }

      supabaseUserId = authData.user.id;
    }

    let user;
    if (existingUser?.id) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          supabaseId: supabaseUserId,
          fullName: trimmedFullName,
          role: invite.role,
          status: "ACTIVE",
          deactivatedAt: null,
          employeeId: invite.employeeId,
          acceptedAt: now,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          supabaseId: supabaseUserId,
          companyId: invite.companyId,
          email: inviteEmail,
          fullName: trimmedFullName,
          role: invite.role,
          status: "ACTIVE",
          employeeId: invite.employeeId,
          acceptedAt: now,
        },
      });
    }

    await prisma.userInvite.update({
      where: { id: invite.id },
      data: {
        acceptedAt: now,
      },
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role.toLowerCase(),
        companyId: user.companyId,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    console.error("[auth:accept-invite] error:", error);
    res.status(500).json({ error: "Failed to accept invite." });
  }
}));

router.get("/auth/me", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const auth = req.auth!;
  const weekStart = parseWeekStart(typeof req.query.weekStart === "string" ? req.query.weekStart : undefined);
  const payload = await buildBootstrap(auth.userId, auth.role, auth.companyId, weekStart);
  res.json(payload);
}));

router.patch("/auth/me", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { userId } = req.auth!;
  const { fullName, preferredView } = req.body as { fullName?: string; preferredView?: string };

  const updates: { fullName?: string; preferredView?: string } = {};

  if (fullName !== undefined) {
    const trimmed = fullName.trim();
    if (!trimmed) {
      res.status(400).json({ error: "Full name cannot be blank." });
      return;
    }
    updates.fullName = trimmed;
  }

  if (preferredView !== undefined) {
    if (preferredView !== "office" && preferredView !== "truck") {
      res.status(400).json({ error: "preferredView must be 'office' or 'truck'." });
      return;
    }
    updates.preferredView = preferredView;
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields provided." });
    return;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updates,
  });

  res.json({
    viewer: {
      id: updated.id,
      fullName: updated.fullName,
      role: updated.role.toLowerCase(),
      employeeId: updated.employeeId,
      preferredView: updated.preferredView,
    },
  });
}));

export { router as authRouter };

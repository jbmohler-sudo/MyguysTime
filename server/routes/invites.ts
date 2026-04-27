import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../auth.js";
import { prisma } from "../db.js";
import {
  asyncHandler,
  authorizeAdmin,
  buildInviteUrl,
  createInviteToken,
  getParam,
  hashInviteToken,
  INVITE_EXPIRY_HOURS,
  normalizeInviteRole,
  serializeInviteSummary,
} from "./helpers.js";

const router = Router();

router.get("/company/invites", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const invites = await prisma.userInvite.findMany({
    where: { companyId: req.auth!.companyId },
    include: {
      employee: {
        select: { displayName: true },
      },
      invitedByUser: {
        select: { fullName: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  res.json({
    invites: invites.map((invite) => serializeInviteSummary(invite)),
  });
}));

router.post("/company/invites", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const { employeeId, email, role } = req.body as {
    employeeId?: string | null;
    email?: string;
    role?: string;
  };

  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  const normalizedRole = normalizeInviteRole(role);
  const cleanEmployeeId = employeeId?.trim() || null;

  if (!normalizedEmail) {
    res.status(400).json({ error: "Email is required for this invite." });
    return;
  }

  if (!normalizedEmail.includes("@")) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }

  if (!normalizedRole) {
    res.status(400).json({ error: "Invite role must be foreman or employee." });
    return;
  }

  let employee:
    | (Awaited<ReturnType<typeof prisma.employee.findFirst>> & { user: { id: string } | null })
    | null = null;

  if (cleanEmployeeId) {
    employee = await prisma.employee.findFirst({
      where: {
        id: cleanEmployeeId,
        companyId: req.auth!.companyId,
      },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found for this company." });
      return;
    }

    if (employee.user) {
      res.status(409).json({ error: "This employee already has login access." });
      return;
    }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      companyId: true,
      employeeId: true,
      status: true,
      deactivatedAt: true,
    },
  });

  if (existingUser && existingUser.companyId !== req.auth!.companyId) {
    res.status(409).json({ error: "That email already belongs to another company account." });
    return;
  }

  if (
    existingUser &&
    existingUser.companyId === req.auth!.companyId &&
    existingUser.status === "ACTIVE" &&
    !existingUser.deactivatedAt
  ) {
    res.status(409).json({ error: "That email already has active login access." });
    return;
  }

  if (cleanEmployeeId && existingUser?.employeeId && existingUser.employeeId !== cleanEmployeeId) {
    res.status(409).json({ error: "That email is already linked to a different employee." });
    return;
  }

  const activeInvite = await prisma.userInvite.findFirst({
    where: {
      companyId: req.auth!.companyId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
      OR: [
        ...(cleanEmployeeId ? [{ employeeId: cleanEmployeeId }] : []),
        { email: normalizedEmail },
      ],
    },
  });

  if (activeInvite) {
    res.status(409).json({ error: "A pending invite already exists for this worker or email." });
    return;
  }

  const rawToken = createInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);
  const createdInvite = await prisma.userInvite.create({
    data: {
      companyId: req.auth!.companyId,
      employeeId: cleanEmployeeId,
      email: normalizedEmail,
      role: normalizedRole,
      tokenHash: hashInviteToken(rawToken),
      expiresAt,
      invitedByUserId: req.auth!.userId,
    },
    include: {
      employee: {
        select: { displayName: true },
      },
      invitedByUser: {
        select: { fullName: true },
      },
    },
  });

  const inviteUrl = buildInviteUrl(req, rawToken);
  console.log(`[invite:dev-link] ${normalizedEmail} -> ${inviteUrl}`);

  res.status(201).json({
    invite: serializeInviteSummary(createdInvite),
    inviteUrl,
    deliveryMode: "dev_link",
  });
}));

router.post("/company/invites/:inviteId/resend", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const inviteId = getParam(req.params.inviteId);
  if (!inviteId) {
    res.status(400).json({ error: "Invite ID is required." });
    return;
  }

  const invite = await prisma.userInvite.findFirst({
    where: { id: inviteId, companyId: req.auth!.companyId },
    include: {
      employee: { select: { displayName: true } },
      invitedByUser: { select: { fullName: true } },
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

  if (invite.expiresAt <= new Date()) {
    res.status(409).json({ error: "This invite has expired. Create a new invite instead." });
    return;
  }

  const updated = await prisma.userInvite.update({
    where: { id: inviteId },
    data: {
      lastSentAt: new Date(),
      sendCount: { increment: 1 },
    },
    include: {
      employee: { select: { displayName: true } },
      invitedByUser: { select: { fullName: true } },
    },
  });

  const rawToken = invite.tokenHash;
  const inviteUrl = buildInviteUrl(req, rawToken);
  console.log(`[invite:resend] ${invite.email ?? "unknown"} -> ${inviteUrl}`);

  res.json({ invite: serializeInviteSummary(updated) });
}));

router.delete("/company/invites/:inviteId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const inviteId = getParam(req.params.inviteId);
  if (!inviteId) {
    res.status(400).json({ error: "Invite ID is required." });
    return;
  }

  const invite = await prisma.userInvite.findFirst({
    where: { id: inviteId, companyId: req.auth!.companyId },
  });

  if (!invite) {
    res.status(404).json({ error: "Invite not found." });
    return;
  }

  if (invite.acceptedAt) {
    res.status(409).json({ error: "Accepted invites cannot be revoked." });
    return;
  }

  await prisma.userInvite.delete({ where: { id: inviteId } });

  res.json({ ok: true });
}));

export { router as invitesRouter };

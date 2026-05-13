import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../auth.js";
import { prisma } from "../db.js";
import {
  asyncHandler,
  finalizeEmployeeArchive,
  getCompanyContextOrThrow,
  getCompanyCrewOrThrow,
  isFiniteNonNegativeNumber,
  normalizeManagedEmployeeWorkerType,
  getParam,
  refreshEmployeeCurrentWeek,
  serializeManagedEmployee,
} from "./helpers.js";

const router = Router();

router.get("/employees", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.auth!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admin can manage employees." });
    return;
  }

  const employees = await prisma.employee.findMany({
    where: {
      companyId: req.auth!.companyId,
      employmentStatus: "ACTIVE",
    },
    include: {
      defaultCrew: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true },
      },
    },
    orderBy: { displayName: "asc" },
  });

  res.json({
    employees: employees.map((employee) => serializeManagedEmployee(employee)),
  });
}));

router.post("/employees", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.auth!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admin can manage employees." });
    return;
  }

  const {
    firstName,
    lastName,
    displayName,
    workerType,
    hourlyRate,
    defaultCrewId,
    active,
  } = req.body as {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    workerType?: string;
    hourlyRate?: number;
    defaultCrewId?: string | null;
    active?: boolean;
  };

  const cleanFirstName = firstName?.trim() ?? "";
  const cleanLastName = lastName?.trim() ?? "";
  const cleanDisplayName = displayName?.trim() ?? `${cleanFirstName} ${cleanLastName}`.trim();
  const normalizedWorkerType = normalizeManagedEmployeeWorkerType(workerType);

  if (!cleanFirstName || !cleanLastName || !cleanDisplayName) {
    res.status(400).json({ error: "First name, last name, and display name are required." });
    return;
  }

  if (!normalizedWorkerType) {
    res.status(400).json({ error: "Worker type must be employee or 1099 contractor." });
    return;
  }

  if (!isFiniteNonNegativeNumber(hourlyRate)) {
    res.status(400).json({ error: "Hourly rate must be a non-negative number." });
    return;
  }

  if (typeof active !== "boolean") {
    res.status(400).json({ error: "Active must be yes or no." });
    return;
  }

  const { payrollSettings } = await getCompanyContextOrThrow(req.auth!.companyId);
  const cleanDefaultCrewId = defaultCrewId?.trim() ? defaultCrewId.trim() : null;

  if (cleanDefaultCrewId) {
    try {
      await getCompanyCrewOrThrow(req.auth!.companyId, cleanDefaultCrewId);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Select a valid crew." });
      return;
    }
  }

  const hourlyRateCents = Math.round(hourlyRate * 100);
  const createdEmployee = await prisma.employee.create({
    data: {
      companyId: req.auth!.companyId,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      displayName: cleanDisplayName,
      workerType: normalizedWorkerType,
      employmentStatus: active ? "ACTIVE" : "ARCHIVED",
      hourlyRateCents,
      overtimeRateCents: payrollSettings.payType === "HOURLY" ? hourlyRateCents : null,
      defaultCrewId: cleanDefaultCrewId,
      archivedAt: active ? null : new Date(),
    },
    include: {
      defaultCrew: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true },
      },
    },
  });

  if (active) {
    await refreshEmployeeCurrentWeek(createdEmployee.id, req.auth!.companyId);
  }

  res.status(201).json({
    employee: serializeManagedEmployee(createdEmployee),
  });
}));

router.patch("/employees/:employeeId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.auth!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admin can manage employees." });
    return;
  }

  const employeeId = getParam(req.params.employeeId);
  const currentEmployee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      companyId: req.auth!.companyId,
    },
  });

  if (!currentEmployee) {
    res.status(404).json({ error: "Employee not found." });
    return;
  }

  const {
    firstName,
    lastName,
    displayName,
    workerType,
    hourlyRate,
    defaultCrewId,
    active,
  } = req.body as {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    workerType?: string;
    hourlyRate?: number;
    defaultCrewId?: string | null;
    active?: boolean;
  };

  const cleanFirstName = firstName?.trim() ?? "";
  const cleanLastName = lastName?.trim() ?? "";
  const cleanDisplayName = displayName?.trim() ?? `${cleanFirstName} ${cleanLastName}`.trim();
  const normalizedWorkerType = normalizeManagedEmployeeWorkerType(workerType);

  if (!cleanFirstName || !cleanLastName || !cleanDisplayName) {
    res.status(400).json({ error: "First name, last name, and display name are required." });
    return;
  }

  if (!normalizedWorkerType) {
    res.status(400).json({ error: "Worker type must be employee or 1099 contractor." });
    return;
  }

  if (!isFiniteNonNegativeNumber(hourlyRate)) {
    res.status(400).json({ error: "Hourly rate must be a non-negative number." });
    return;
  }

  if (typeof active !== "boolean") {
    res.status(400).json({ error: "Active must be yes or no." });
    return;
  }

  const { payrollSettings } = await getCompanyContextOrThrow(req.auth!.companyId);
  const cleanDefaultCrewId = defaultCrewId?.trim() ? defaultCrewId.trim() : null;

  if (cleanDefaultCrewId) {
    try {
      await getCompanyCrewOrThrow(req.auth!.companyId, cleanDefaultCrewId);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Select a valid crew." });
      return;
    }
  }

  const hourlyRateCents = Math.round(hourlyRate * 100);
  const nextEmploymentStatus = active ? "ACTIVE" : "ARCHIVED";
  const reactivated = currentEmployee.employmentStatus !== "ACTIVE" && active;
  const archivedNow = currentEmployee.employmentStatus === "ACTIVE" && !active;

  const updatedEmployee = await prisma.employee.update({
    where: { id: currentEmployee.id },
    data: {
      firstName: cleanFirstName,
      lastName: cleanLastName,
      displayName: cleanDisplayName,
      workerType: normalizedWorkerType,
      employmentStatus: nextEmploymentStatus,
      hourlyRateCents,
      overtimeRateCents: payrollSettings.payType === "HOURLY" ? hourlyRateCents : null,
      defaultCrewId: cleanDefaultCrewId,
      archivedAt: active ? null : archivedNow ? new Date() : currentEmployee.archivedAt,
      rehiredAt: reactivated ? new Date() : currentEmployee.rehiredAt,
    },
    include: {
      defaultCrew: {
        select: { id: true, name: true },
      },
      user: {
        select: { id: true },
      },
    },
  });

  if (active) {
    await refreshEmployeeCurrentWeek(updatedEmployee.id, req.auth!.companyId);
  }

  res.json({
    employee: serializeManagedEmployee(updatedEmployee),
  });
}));

router.post("/employees/:employeeId/remove", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.auth!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admin can manage employees." });
    return;
  }

  const employeeId = getParam(req.params.employeeId);
  if (!employeeId) {
    res.status(400).json({ error: "Employee ID is required." });
    return;
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      companyId: req.auth!.companyId,
    },
    include: {
      user: {
        select: {
          id: true,
          companyId: true,
          email: true,
          employeeId: true,
          role: true,
          status: true,
          deactivatedAt: true,
        },
      },
    },
  });

  if (!employee) {
    res.status(404).json({ error: "Employee not found." });
    return;
  }

  if (employee.user?.role === "ADMIN") {
    res.status(409).json({ error: "Company owner/admin accounts cannot be removed from the team." });
    return;
  }

  const { deferred } = req.body as { deferred?: boolean };
  const now = new Date();

  if (deferred) {
    // Deferred removal: mark as PENDING_ARCHIVE now so the employee disappears from the Team
    // panel immediately but still shows on the current week's dashboard. The full archive
    // (user deactivation, invite revocation) fires automatically when the timesheet is locked.
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        employmentStatus: "PENDING_ARCHIVE",
        archivedAt: employee.archivedAt ?? now,
        archiveReason: employee.archiveReason ?? "Removed from team",
        archiveNotes:
          employee.archiveNotes ??
          "Removed from active team list. Historical timesheets and payroll records were kept.",
      },
    });

    res.json({
      ok: true,
      employeeId: employee.id,
      deferred: true,
      deactivatedUserId: null,
      revokedInviteCount: 0,
    });
    return;
  }

  // Immediate removal: set PENDING_ARCHIVE so finalizeEmployeeArchive can pick it up,
  // then finalize in the same request.
  const inviteEmail = employee.user?.email?.trim().toLowerCase() ?? null;

  const result = await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: employee.id },
      data: {
        employmentStatus: "PENDING_ARCHIVE",
        archivedAt: employee.archivedAt ?? now,
        archiveReason: employee.archiveReason ?? "Removed from team",
        archiveNotes:
          employee.archiveNotes ??
          "Removed from active team list. Historical timesheets and payroll records were kept.",
      },
    });

    const linkedUserBelongsToEmployee =
      employee.user?.companyId === req.auth!.companyId &&
      employee.user.employeeId === employee.id;

    const deactivatedUser = linkedUserBelongsToEmployee && employee.user
      ? await tx.user.updateMany({
          where: {
            id: employee.user.id,
            companyId: req.auth!.companyId,
            employeeId: employee.id,
          },
          data: {
            status: "INACTIVE",
            deactivatedAt: employee.user.deactivatedAt ?? now,
          },
        })
      : null;

    const revokedInvites = await tx.userInvite.deleteMany({
      where: {
        companyId: req.auth!.companyId,
        acceptedAt: null,
        OR: [
          { employeeId: employee.id },
          ...(inviteEmail ? [{ email: { equals: inviteEmail, mode: "insensitive" as const } }] : []),
        ],
      },
    });

    // Transition to fully ARCHIVED within the same transaction
    await tx.employee.update({
      where: { id: employee.id },
      data: { employmentStatus: "ARCHIVED" },
    });

    return {
      deactivatedUserId: deactivatedUser && deactivatedUser.count > 0 ? employee.user?.id ?? null : null,
      revokedInviteCount: revokedInvites.count,
    };
  });

  res.json({
    ok: true,
    employeeId: employee.id,
    deferred: false,
    deactivatedUserId: result.deactivatedUserId,
    revokedInviteCount: result.revokedInviteCount,
  });
}));

export { router as employeesRouter };

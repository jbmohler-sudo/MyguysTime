import { Router } from "express";
import { authenticate, getCurrentUserOrThrow, type AuthenticatedRequest } from "../auth.js";
import { prisma } from "../db.js";
import { parseWeekStart } from "../utils.js";
import {
  asyncHandler,
  asTimesheetStatus,
  asWorkerType,
  buildBootstrap,
  buildYtdSummaries,
  canAdminOrForemanEditStatus,
  canEmployeeEditStatus,
  canManageCrew,
  clampLunchMinutes,
  createEmptyYtdSummary,
  getAccessibleCrewIds,
  getAuthorizedTimesheet,
  getParam,
  recalculateTimesheet,
  resetStatusOnEdit,
  serializeTimesheet,
  timeStringToMinutes,
  writeStatusAudit,
} from "./helpers.js";

const router = Router();

router.patch("/timesheets/:timesheetId/days/:dayEntryId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const timesheetId = getParam(req.params.timesheetId);
  const dayEntryId = getParam(req.params.dayEntryId);
  const timesheet = await getAuthorizedTimesheet(req, timesheetId);
  if (!timesheet) {
    res.status(403).json({ error: "You cannot edit this timesheet." });
    return;
  }

  if (timesheet.status === "OFFICE_LOCKED") {
    res.status(409).json({ error: "Office-locked weeks cannot be edited." });
    return;
  }

  const user = await getCurrentUserOrThrow(req.auth!.userId);
  if (
    req.auth!.role === "EMPLOYEE" &&
    (user.employeeId !== timesheet.employeeId ||
      !canEmployeeEditStatus(asTimesheetStatus(timesheet.status)))
  ) {
    res.status(403).json({ error: "Employees can only edit their own week while it is still draft." });
    return;
  }
  if (
    ["ADMIN", "FOREMAN"].includes(req.auth!.role) &&
    !canAdminOrForemanEditStatus(asTimesheetStatus(timesheet.status))
  ) {
    res.status(409).json({ error: "Locked weeks must be reopened before any edits." });
    return;
  }

  const { start, end, lunchMinutes, jobTag, employeeConfirmed } = req.body as {
    start?: string;
    end?: string;
    lunchMinutes?: number;
    jobTag?: string;
    employeeConfirmed?: boolean;
  };

  const dayEntry = timesheet.dayEntries.find((entry) => entry.id === dayEntryId);
  if (!dayEntry) {
    res.status(404).json({ error: "Day entry not found." });
    return;
  }

  const nextStart = start !== undefined ? timeStringToMinutes(start) : dayEntry.startTimeMinutes;
  const nextEnd = end !== undefined ? timeStringToMinutes(end) : dayEntry.endTimeMinutes;
  const nextLunch = lunchMinutes !== undefined ? clampLunchMinutes(lunchMinutes) : dayEntry.lunchMinutes;

  await prisma.timeEntryDay.update({
    where: { id: dayEntry.id },
    data: {
      startTimeMinutes: nextStart,
      endTimeMinutes: nextEnd,
      lunchMinutes: nextLunch,
      jobTag: jobTag !== undefined ? jobTag : dayEntry.jobTag,
      employeeConfirmed: employeeConfirmed !== undefined ? employeeConfirmed : dayEntry.employeeConfirmed,
    },
  });

  const resetPayload = resetStatusOnEdit(asTimesheetStatus(timesheet.status));
  if (Object.keys(resetPayload).length > 0) {
    await prisma.timesheetWeek.update({
      where: { id: timesheet.id },
      data: resetPayload,
    });
    await writeStatusAudit(
      timesheet.id,
      asTimesheetStatus(timesheet.status),
      "DRAFT",
      req.auth!.userId,
      "Week moved back to draft because time entries were edited.",
    );
  }

  await recalculateTimesheet(timesheet.id, req.auth!.companyId);
  const refreshed = await getAuthorizedTimesheet(req, timesheet.id);
  const auditUsersById = new Map([[req.auth!.userId, user.fullName]]);
  const refreshedYtdSummaries = await buildYtdSummaries([refreshed!], refreshed!.weekStartDate);
  res.json({
    timesheet: serializeTimesheet(
      refreshed!,
      req.auth!.role,
      auditUsersById,
      refreshedYtdSummaries.get(refreshed!.employeeId) ??
        createEmptyYtdSummary(asWorkerType(refreshed!.employee.workerType), refreshed!.weekStartDate.getFullYear()),
    ),
  });
}));

router.post("/crews/:crewId/defaults", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!canManageCrew(req.auth!.role)) {
    res.status(403).json({ error: "Only foremen and admin can apply crew defaults." });
    return;
  }

  const { weekStart, dayIndex, start, end } = req.body as {
    weekStart?: string;
    dayIndex?: number;
    start?: string;
    end?: string;
  };

  if (typeof dayIndex !== "number" || dayIndex < 0 || dayIndex > 6) {
    res.status(400).json({ error: "A valid dayIndex is required." });
    return;
  }

  const weekDate = parseWeekStart(weekStart);
  const accessibleCrewIds = await getAccessibleCrewIds(req.auth!.userId, req.auth!.role, req.auth!.companyId);
  const crewId = getParam(req.params.crewId);
  if (req.auth!.role === "FOREMAN" && !accessibleCrewIds?.includes(crewId)) {
    res.status(403).json({ error: "You cannot manage this crew." });
    return;
  }

  const startTimeMinutes = timeStringToMinutes(start ?? "");
  const endTimeMinutes = timeStringToMinutes(end ?? "");

  await prisma.crewDayDefault.upsert({
    where: {
      crewId_weekStartDate_dayIndex: {
        crewId,
        weekStartDate: weekDate,
        dayIndex,
      },
    },
    update: {
      startTimeMinutes,
      endTimeMinutes,
    },
    create: {
      crewId,
      weekStartDate: weekDate,
      dayIndex,
      startTimeMinutes,
      endTimeMinutes,
    },
  });

  const timesheets = await prisma.timesheetWeek.findMany({
    where: {
      crewId,
      weekStartDate: weekDate,
      status: { not: "OFFICE_LOCKED" },
    },
    include: {
      dayEntries: true,
    },
  });

  for (const timesheet of timesheets) {
    const dayEntry = timesheet.dayEntries.find((entry) => entry.dayIndex === dayIndex);
    if (!dayEntry) {
      continue;
    }

    await prisma.timeEntryDay.update({
      where: { id: dayEntry.id },
      data: {
        startTimeMinutes,
        endTimeMinutes,
      },
    });

    await prisma.timesheetWeek.update({
      where: { id: timesheet.id },
      data: resetStatusOnEdit(asTimesheetStatus(timesheet.status)),
    });
    if (asTimesheetStatus(timesheet.status) !== "DRAFT") {
      await writeStatusAudit(
        timesheet.id,
        asTimesheetStatus(timesheet.status),
        "DRAFT",
        req.auth!.userId,
        "Week moved back to draft because crew default hours were applied.",
      );
    }

    await recalculateTimesheet(timesheet.id, req.auth!.companyId);
  }

  const payload = await buildBootstrap(req.auth!.userId, req.auth!.role, req.auth!.companyId, weekDate);
  res.json(payload);
}));

router.patch("/timesheets/:timesheetId/adjustment", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.auth!.role !== "ADMIN") {
    res.status(403).json({ error: "Only office/admin can edit weekly adjustments." });
    return;
  }

  const timesheetId = getParam(req.params.timesheetId);
  const timesheet = await getAuthorizedTimesheet(req, timesheetId);
  if (!timesheet) {
    res.status(404).json({ error: "Timesheet not found." });
    return;
  }

  if (asTimesheetStatus(timesheet.status) === "OFFICE_LOCKED") {
    res.status(409).json({ error: "Locked weeks must be reopened before adjustments can be edited." });
    return;
  }

  const {
    gasReimbursement,
    pettyCashReimbursement,
    deductionAdvance,
    notes,
  } = req.body as {
    gasReimbursement?: number;
    pettyCashReimbursement?: number;
    deductionAdvance?: number;
    notes?: string;
  };

  await prisma.weeklyAdjustment.update({
    where: { timesheetWeekId: timesheet.id },
    data: {
      gasReimbursementCents:
        gasReimbursement !== undefined ? Math.round(gasReimbursement * 100) : undefined,
      pettyCashCents:
        pettyCashReimbursement !== undefined ? Math.round(pettyCashReimbursement * 100) : undefined,
      deductionCents:
        deductionAdvance !== undefined ? Math.round(deductionAdvance * 100) : undefined,
      note: notes !== undefined ? notes : undefined,
    },
  });

  const resetPayload = resetStatusOnEdit(asTimesheetStatus(timesheet.status));
  if (Object.keys(resetPayload).length > 0) {
    await prisma.timesheetWeek.update({
      where: { id: timesheet.id },
      data: resetPayload,
    });
    await writeStatusAudit(
      timesheet.id,
      asTimesheetStatus(timesheet.status),
      "DRAFT",
      req.auth!.userId,
      "Week moved back to draft because office adjustments were edited.",
    );
  }

  await recalculateTimesheet(timesheet.id, req.auth!.companyId);
  const refreshed = await getAuthorizedTimesheet(req, timesheet.id);
  const currentUser = await getCurrentUserOrThrow(req.auth!.userId);
  const auditUsersById = new Map([[req.auth!.userId, currentUser.fullName]]);
  const refreshedYtdSummaries = await buildYtdSummaries([refreshed!], refreshed!.weekStartDate);
  res.json({
    timesheet: serializeTimesheet(
      refreshed!,
      req.auth!.role,
      auditUsersById,
      refreshedYtdSummaries.get(refreshed!.employeeId) ??
        createEmptyYtdSummary(asWorkerType(refreshed!.employee.workerType), refreshed!.weekStartDate.getFullYear()),
    ),
  });
}));

router.patch("/timesheets/:timesheetId/status", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const timesheetId = getParam(req.params.timesheetId);
  const timesheet = await getAuthorizedTimesheet(req, timesheetId);
  if (!timesheet) {
    res.status(403).json({ error: "You cannot update this timesheet status." });
    return;
  }

  const { status, note, reopenTo } = req.body as { status?: string; note?: string; reopenTo?: string };
  if (!status) {
    res.status(400).json({ error: "A status is required." });
    return;
  }

  const nextStatus = asTimesheetStatus(status.toUpperCase());
  const now = new Date();
  const auth = req.auth!;
  const user = await getCurrentUserOrThrow(auth.userId);

  if (nextStatus === "EMPLOYEE_CONFIRMED") {
    if (auth.role !== "EMPLOYEE" || user.employeeId !== timesheet.employeeId) {
      res.status(403).json({ error: "Only the employee can confirm their own week." });
      return;
    }
    if (!["DRAFT", "NEEDS_REVISION"].includes(asTimesheetStatus(timesheet.status))) {
      res.status(409).json({ error: "Employees can only submit weeks that are still draft or need revision." });
      return;
    }
    await prisma.timesheetWeek.update({
      where: { id: timesheet.id },
      data: {
        status: "EMPLOYEE_CONFIRMED",
        submittedByEmployeeAt: now,
      },
    });
    await writeStatusAudit(timesheet.id, asTimesheetStatus(timesheet.status), "EMPLOYEE_CONFIRMED", auth.userId);
  } else if (nextStatus === "NEEDS_REVISION") {
    if (!["FOREMAN", "ADMIN"].includes(auth.role)) {
      res.status(403).json({ error: "Only foremen or admin can flag a week for revision." });
      return;
    }
    if (auth.role === "FOREMAN") {
      const crewIds = await getAccessibleCrewIds(auth.userId, auth.role, auth.companyId);
      if (!crewIds?.includes(timesheet.crewId)) {
        res.status(403).json({ error: "Foremen can only flag assigned crew weeks for revision." });
        return;
      }
    }
    if (asTimesheetStatus(timesheet.status) === "OFFICE_LOCKED") {
      res.status(409).json({ error: "Locked weeks must be reopened before they can be flagged for revision." });
      return;
    }
    if (asTimesheetStatus(timesheet.status) === "NEEDS_REVISION") {
      res.status(409).json({ error: "Week is already marked as needing revision." });
      return;
    }
    if (!note?.trim()) {
      res.status(400).json({ error: "An audit note is required when marking a week as needing revision." });
      return;
    }
    await prisma.timesheetWeek.update({
      where: { id: timesheet.id },
      data: {
        status: "NEEDS_REVISION",
        reviewedByForemanAt: null,
        lockedAt: null,
      },
    });
    await writeStatusAudit(timesheet.id, asTimesheetStatus(timesheet.status), "NEEDS_REVISION", auth.userId, note.trim());
  } else if (nextStatus === "FOREMAN_APPROVED") {
    if (!["FOREMAN", "ADMIN"].includes(auth.role)) {
      res.status(403).json({ error: "Only foremen or admin can approve weeks." });
      return;
    }
    if (auth.role === "FOREMAN") {
      const crewIds = await getAccessibleCrewIds(auth.userId, auth.role, auth.companyId);
      if (!crewIds?.includes(timesheet.crewId)) {
        res.status(403).json({ error: "Foremen can only approve assigned crew weeks." });
        return;
      }
    }
    if (asTimesheetStatus(timesheet.status) === "OFFICE_LOCKED") {
      res.status(409).json({ error: "Locked weeks must be reopened before approval changes." });
      return;
    }
    await prisma.timesheetWeek.update({
      where: { id: timesheet.id },
      data: {
        status: "FOREMAN_APPROVED",
        reviewedByForemanAt: now,
      },
    });
    await writeStatusAudit(timesheet.id, asTimesheetStatus(timesheet.status), "FOREMAN_APPROVED", auth.userId);
  } else if (nextStatus === "OFFICE_LOCKED") {
    if (auth.role !== "ADMIN") {
      res.status(403).json({ error: "Only admin can office-lock a week." });
      return;
    }
    if (asTimesheetStatus(timesheet.status) === "OFFICE_LOCKED") {
      res.status(409).json({ error: "Week is already office locked." });
      return;
    }
    await prisma.timesheetWeek.update({
      where: { id: timesheet.id },
      data: {
        status: "OFFICE_LOCKED",
        lockedAt: now,
      },
    });
    await writeStatusAudit(timesheet.id, asTimesheetStatus(timesheet.status), "OFFICE_LOCKED", auth.userId);
  } else if (nextStatus === "DRAFT") {
    if (auth.role !== "ADMIN") {
      res.status(403).json({ error: "Only admin can reopen a week." });
      return;
    }
    if (asTimesheetStatus(timesheet.status) !== "OFFICE_LOCKED") {
      res.status(409).json({ error: "Only locked weeks can be reopened." });
      return;
    }
    const reopenTarget = reopenTo ? asTimesheetStatus(reopenTo.toUpperCase()) : "DRAFT";
    if (!["DRAFT", "FOREMAN_APPROVED"].includes(reopenTarget)) {
      res.status(400).json({ error: "Locked weeks may only reopen to draft or foreman approved." });
      return;
    }
    if (!note?.trim()) {
      res.status(400).json({ error: "A reopen audit note is required." });
      return;
    }
    await prisma.timesheetWeek.update({
      where: { id: timesheet.id },
      data: {
        status: reopenTarget,
        lockedAt: null,
        submittedByEmployeeAt:
          reopenTarget === "DRAFT" ? null : timesheet.submittedByEmployeeAt,
        reviewedByForemanAt:
          reopenTarget === "FOREMAN_APPROVED" ? (timesheet.reviewedByForemanAt ?? now) : null,
      },
    });
    await writeStatusAudit(timesheet.id, "OFFICE_LOCKED", reopenTarget, auth.userId, note.trim());
  } else {
    res.status(400).json({ error: "Unsupported status transition." });
    return;
  }

  const refreshed = await getAuthorizedTimesheet(req, timesheet.id);
  const auditUsersById = new Map([[auth.userId, user.fullName]]);
  const refreshedYtdSummaries = await buildYtdSummaries([refreshed!], refreshed!.weekStartDate);
  res.json({
    timesheet: serializeTimesheet(
      refreshed!,
      auth.role,
      auditUsersById,
      refreshedYtdSummaries.get(refreshed!.employeeId) ??
        createEmptyYtdSummary(asWorkerType(refreshed!.employee.workerType), refreshed!.weekStartDate.getFullYear()),
    ),
  });
}));

export { router as timesheetsRouter };

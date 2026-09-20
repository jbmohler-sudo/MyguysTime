import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../auth.js";
import { prisma } from "../db.js";
import { parseWeekStart } from "../utils.js";
import {
  asyncHandler,
  buildBootstrap,
  companyHasComplimentaryMember,
  ensureWeekData,
  getCompanyContextOrThrow,
  getCompanySettingsOrThrow,
  normalizePayrollMethod,
  normalizeWeekStartDay,
  serializeCompanySettings,
  type PayrollMethod,
  type PayType,
  type TimeTrackingStyle,
} from "./helpers.js";

const router = Router();

router.post("/company-setup", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.auth!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admin can complete company setup." });
    return;
  }

  const {
    companyName,
    ownerName,
    weekStartDay,
    employees,
    timeTrackingStyle,
    lunchDeductionMinutes,
    payType,
    payrollMethod,
    trackExpenses,
  } = req.body as {
    companyName?: string;
    ownerName?: string;
    weekStartDay?: number;
    employees?: Array<{ displayName?: string; hourlyRate?: number; workerType?: string }>;
    timeTrackingStyle?: string;
    lunchDeductionMinutes?: number;
    payType?: string;
    payrollMethod?: string;
    trackExpenses?: boolean;
  };

  if (!companyName?.trim()) {
    res.status(400).json({ error: "Company name is required." });
    return;
  }

  const nextTimeTrackingStyle = timeTrackingStyle?.trim().toUpperCase() as TimeTrackingStyle | undefined;
  if (!nextTimeTrackingStyle || !["FOREMAN", "WORKER_SELF_ENTRY", "MIXED"].includes(nextTimeTrackingStyle)) {
    res.status(400).json({ error: "Time tracking style is required." });
    return;
  }

  if (lunchDeductionMinutes !== 0 && lunchDeductionMinutes !== 30 && lunchDeductionMinutes !== 60) {
    res.status(400).json({ error: "Lunch deduction must be none, 30, or 60 minutes." });
    return;
  }

  const nextWeekStartDay = normalizeWeekStartDay(weekStartDay);
  if (nextWeekStartDay === null) {
    res.status(400).json({ error: "Week starts on must be a valid day of the week." });
    return;
  }

  const nextPayType = payType?.trim().toUpperCase() as PayType | undefined;
  if (!nextPayType || !["HOURLY", "HOURLY_OVERTIME"].includes(nextPayType)) {
    res.status(400).json({ error: "Pay type is required." });
    return;
  }

  const nextPayrollMethod = normalizePayrollMethod(payrollMethod);
  if (!nextPayrollMethod) {
    res.status(400).json({ error: "Payroll method is required." });
    return;
  }

  if (typeof trackExpenses !== "boolean") {
    res.status(400).json({ error: "Track expenses must be yes or no." });
    return;
  }

  const cleanEmployees = (employees ?? [])
    .map((employee) => ({
      displayName: employee.displayName?.trim() ?? "",
      hourlyRate: employee.hourlyRate,
      workerType: employee.workerType?.trim().toUpperCase() ?? "W2",
    }))
    .filter((employee) => employee.displayName.length > 0);

  if (cleanEmployees.length === 0) {
    res.status(400).json({ error: "Add at least one employee before finishing setup." });
    return;
  }

  const invalidEmployee = cleanEmployees.find(
    (employee) =>
      (employee.hourlyRate !== undefined &&
        (typeof employee.hourlyRate !== "number" ||
          !Number.isFinite(employee.hourlyRate) ||
          employee.hourlyRate < 0)) ||
      !["W2", "1099"].includes(employee.workerType),
  );
  if (invalidEmployee) {
    res.status(400).json({ error: "Employee entries must use a valid worker type and non-negative hourly rate." });
    return;
  }

  const currentCompany = await getCompanySettingsOrThrow(req.auth!.companyId);
  const updatedCompany = await prisma.company.update({
    where: { id: currentCompany.id },
    data: {
      companyName: companyName.trim(),
      ownerName: ownerName?.trim() || null,
      onboardingCompletedAt: new Date(),
      onboardingCompletedByUserId: req.auth!.userId,
    },
    include: { payrollSettings: true },
  });

  const nextPayrollSettings = await prisma.companyPayrollSettings.update({
    where: { companyId: updatedCompany.id },
    data: {
      timeTrackingStyle: nextTimeTrackingStyle,
      weekStartDay: nextWeekStartDay,
      defaultLunchMinutes: lunchDeductionMinutes,
      payType: nextPayType,
      payrollMethod: nextPayrollMethod,
      trackExpenses,
    },
  });

  const defaultCrew = await prisma.crew.create({
    data: {
      name: "Main Crew",
      companyId: req.auth!.companyId,
    },
  });

  for (const employee of cleanEmployees) {
    const nameParts = employee.displayName.split(" ").filter(Boolean);
    const firstName = nameParts[0] ?? employee.displayName;
    const lastName = nameParts.slice(1).join(" ") || "Crew";
    const isContractor = employee.workerType === "1099";
    const hourlyRateCents = Math.round((employee.hourlyRate ?? 0) * 100);

    await prisma.employee.create({
      data: {
        companyId: req.auth!.companyId,
        firstName,
        lastName,
        displayName: employee.displayName,
        workerType: isContractor ? "CONTRACTOR_1099" : "EMPLOYEE",
        hourlyRateCents,
        overtimeRateCents: nextPayType === "HOURLY" ? hourlyRateCents : null,
        defaultCrewId: defaultCrew.id,
      },
    });
  }

  const currentWeekStart = parseWeekStart(undefined);
  await ensureWeekData(req.auth!.companyId, currentWeekStart);

  const payload = await buildBootstrap(req.auth!.userId, req.auth!.role, req.auth!.companyId, currentWeekStart);
  res.json(payload);
}));

router.patch("/company-settings", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.auth!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admin can update company settings." });
    return;
  }

  const { company: currentCompany, payrollSettings: currentSettings } = await getCompanyContextOrThrow(req.auth!.companyId);
  const {
    companyName,
    companyState,
    weekStartDay,
    payrollMethod,
  } = req.body as {
    companyName?: string;
    companyState?: string;
    weekStartDay?: number;
    payrollMethod?: string;
  };

  const nextWeekStartDay = weekStartDay === undefined ? currentSettings.weekStartDay : normalizeWeekStartDay(weekStartDay);
  if (nextWeekStartDay === null) {
    res.status(400).json({ error: "Week starts on must be a valid day of the week." });
    return;
  }

  const nextPayrollMethod = payrollMethod === undefined
    ? (currentSettings.payrollMethod as PayrollMethod)
    : normalizePayrollMethod(payrollMethod);
  if (!nextPayrollMethod) {
    res.status(400).json({ error: "Unsupported payroll method." });
    return;
  }

  const nextStateCode = companyState?.trim().toUpperCase() || currentCompany.stateCode;

  const updatedCompany = await prisma.company.update({
    where: { id: currentCompany.id },
    data: {
      companyName: companyName?.trim() || currentCompany.companyName,
      stateCode: nextStateCode,
    },
    include: { payrollSettings: true },
  });

  const updatedSettings = await prisma.companyPayrollSettings.update({
    where: { companyId: currentCompany.id },
    data: {
      weekStartDay: nextWeekStartDay,
      payrollMethod: nextPayrollMethod,
    },
  });

  res.json({
    companySettings: serializeCompanySettings(
      { ...updatedCompany, payrollSettings: updatedSettings },
      {
        viewerEmail: req.user!.email,
        complimentary: await companyHasComplimentaryMember(currentCompany.id),
      },
    ),
  });
}));

export { router as companyRouter };

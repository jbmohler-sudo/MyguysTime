import { createHash, randomBytes } from "node:crypto";
import express from "express";
import { getCurrentUserOrThrow, type AuthenticatedRequest, type UserRole } from "../auth.js";
import { prisma } from "../db.js";
import { calculateDayTotalMinutes, calculatePayrollEstimate } from "../payroll.js";
import {
  addDays,
  clampLunchMinutes,
  currencyFromCents,
  formatIsoDate,
  getWeekdayLabel,
  minutesToTimeString,
  parseWeekStart,
  timeStringToMinutes,
} from "../utils.js";

export type TimesheetStatus = "DRAFT" | "NEEDS_REVISION" | "EMPLOYEE_CONFIRMED" | "FOREMAN_APPROVED" | "OFFICE_LOCKED";
export type WorkerType = "EMPLOYEE" | "CONTRACTOR_1099";
export type TimeTrackingStyle = "FOREMAN" | "WORKER_SELF_ENTRY" | "MIXED";
export type PayType = "HOURLY" | "HOURLY_OVERTIME";
export type PayrollMethod = "SERVICE" | "MANUAL" | "MIXED";

export const PAYROLL_PREP_DISCLAIMER = `Important: Payroll Estimates

This app is designed to help you track hours and estimate pay and withholdings.
It is not a payroll service and does not guarantee full tax compliance.

While we strive to provide accurate calculations, tax rates and rules vary by state and may change.
Please review all numbers and confirm with your accountant or official state resources before issuing payments.

By continuing, you acknowledge that you are responsible for verifying payroll amounts.`;
export const EXPORT_REMINDER = "Estimates only — verify before issuing checks.";
export const UNSUPPORTED_STATE_MESSAGE =
  "We do not yet support accurate state-specific withholding calculations for this state. You can still use the app for time tracking and payroll prep, but please confirm state-specific withholding with your accountant or official state resources.";
export const SIGNUP_DEFAULT_STATE_CODE = "TX";
export const INVITE_EXPIRY_HOURS = 72;

export function asyncHandler<Req extends express.Request = express.Request>(
  handler: (req: Req, res: express.Response, next: express.NextFunction) => Promise<unknown>,
) {
  return (req: Req, res: express.Response, next: express.NextFunction) => {
    void handler(req, res, next).catch((error) => {
      console.error(error);

      if (res.headersSent) {
        next(error);
        return;
      }

      res.status(500).json({ error: "Internal Server Error" });
    });
  };
}

export function authorizeAdmin(req: AuthenticatedRequest, res: express.Response): boolean {
  if (req.auth?.role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required." });
    return false;
  }
  return true;
}

export function canManageCrew(role: UserRole) {
  return role === "ADMIN" || role === "FOREMAN";
}

export function asUserRole(role: string): UserRole {
  if (role === "ADMIN" || role === "FOREMAN" || role === "EMPLOYEE") {
    return role;
  }

  throw new Error(`Unsupported user role: ${role}`);
}

export function asTimesheetStatus(status: string): TimesheetStatus {
  if (
    status === "DRAFT" ||
    status === "NEEDS_REVISION" ||
    status === "EMPLOYEE_CONFIRMED" ||
    status === "FOREMAN_APPROVED" ||
    status === "OFFICE_LOCKED"
  ) {
    return status;
  }

  throw new Error(`Unsupported timesheet status: ${status}`);
}

export function asWorkerType(workerType: string | null | undefined): WorkerType {
  if (workerType === "CONTRACTOR_1099") {
    return workerType;
  }

  return "EMPLOYEE";
}

export function getParam(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  return Array.isArray(value) ? value[0] : "";
}

export function statusToClient(status: TimesheetStatus) {
  return status.toLowerCase() as "draft" | "employee_confirmed" | "foreman_approved" | "office_locked";
}

export function workerTypeToClient(workerType: WorkerType) {
  return workerType.toLowerCase() as "employee" | "contractor_1099";
}

export function timeTrackingStyleToClient(value: TimeTrackingStyle) {
  if (value === "WORKER_SELF_ENTRY") {
    return "worker_self_entry" as const;
  }

  return value.toLowerCase() as "foreman" | "mixed";
}

export function payTypeToClient(value: PayType) {
  return value === "HOURLY" ? "hourly" as const : "hourly_overtime" as const;
}

export function payrollMethodToClient(value: PayrollMethod) {
  return value.toLowerCase() as "service" | "manual" | "mixed";
}

export function createEmptyYtdSummary(workerType: WorkerType, calendarYear: number) {
  return {
    calendarYear,
    workerType: workerTypeToClient(workerType),
    grossPayments: 0,
    reimbursements: 0,
    deductions: 0,
    netEstimate: 0,
  };
}

export async function getCompanySettingsOrThrow(companyId: string) {
  return prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: {
      payrollSettings: true,
    },
  });
}

export async function getStateRuleOrThrow(stateCode: string) {
  return prisma.statePayrollRule.findUniqueOrThrow({
    where: { stateCode },
  });
}

export async function getCompanyContextOrThrow(companyId: string) {
  const company = await getCompanySettingsOrThrow(companyId);
  const payrollSettings = company.payrollSettings;
  if (!payrollSettings) {
    throw new Error("Company payroll settings are missing.");
  }
  const stateRule = await getStateRuleOrThrow(company.stateCode);
  return { company, payrollSettings, stateRule };
}

export function supportLevelToClient(value: string) {
  return value.toLowerCase() as "full" | "partial_manual" | "unsupported";
}

export function buildUnsupportedStateRuleData(stateCode: string) {
  return {
    stateCode,
    stateName: stateCode,
    supportLevel: "UNSUPPORTED",
    hasStateIncomeTax: true,
    hasExtraEmployeeWithholdings: false,
    defaultStateWithholdingMode: "MANUAL_OVERRIDE",
    defaultStateWithholdingValue: 0,
    disclaimerText: UNSUPPORTED_STATE_MESSAGE,
    notes: UNSUPPORTED_STATE_MESSAGE,
    isActive: true,
  };
}

export function buildPayrollSettingsDefaults(
  stateCode: string,
  stateRule: Awaited<ReturnType<typeof getStateRuleOrThrow>> | Awaited<ReturnType<typeof prisma.statePayrollRule.findUnique>> | null,
  overrides?: {
    defaultFederalWithholdingMode?: "PERCENTAGE" | "MANUAL_OVERRIDE";
    defaultFederalWithholdingValue?: number;
    defaultStateWithholdingMode?: "PERCENTAGE" | "MANUAL_OVERRIDE";
    defaultStateWithholdingValue?: number;
    timeTrackingStyle?: TimeTrackingStyle;
    weekStartDay?: number;
    defaultLunchMinutes?: 0 | 30 | 60;
    payType?: PayType;
    payrollMethod?: PayrollMethod;
    trackExpenses?: boolean;
  },
) {
  const federalMode = overrides?.defaultFederalWithholdingMode ?? "PERCENTAGE";
  const federalValue = overrides?.defaultFederalWithholdingValue ?? 0.1;
  const stateMode = overrides?.defaultStateWithholdingMode ?? stateRule?.defaultStateWithholdingMode ?? "MANUAL_OVERRIDE";
  const stateValue = overrides?.defaultStateWithholdingValue ?? stateRule?.defaultStateWithholdingValue ?? 0;

  return {
    defaultFederalWithholdingMode: federalMode,
    defaultFederalWithholdingValue: federalValue,
    defaultStateWithholdingMode: stateMode,
    defaultStateWithholdingValue: stateValue,
    timeTrackingStyle: overrides?.timeTrackingStyle ?? "FOREMAN",
    weekStartDay: overrides?.weekStartDay ?? 1,
    defaultLunchMinutes: overrides?.defaultLunchMinutes ?? 30,
    payType: overrides?.payType ?? "HOURLY_OVERTIME",
    payrollMethod: overrides?.payrollMethod ?? "MANUAL",
    trackExpenses: overrides?.trackExpenses ?? true,
    payrollPrepDisclaimer: PAYROLL_PREP_DISCLAIMER,
    pfmlEnabled: stateCode === "MA" ? Boolean(stateRule?.defaultPfmlEnabled) : false,
    pfmlEmployeeRate: stateCode === "MA" ? stateRule?.defaultPfmlEmployeeRate ?? 0 : 0,
    extraWithholdingLabel:
      stateCode === "MA"
        ? "PFML"
        : stateRule?.hasExtraEmployeeWithholdings
          ? stateRule.extraWithholdingTypes ?? "Manual state withholding"
          : "Manual state withholding",
    extraWithholdingRate: stateCode === "MA" ? stateRule?.defaultPfmlEmployeeRate ?? 0 : null,
    supportLevelSnapshot: stateRule?.supportLevel ?? "UNSUPPORTED",
  };
}

export function serializeStateRule(rule: Awaited<ReturnType<typeof getStateRuleOrThrow>>) {
  return {
    stateCode: rule.stateCode,
    stateName: rule.stateName,
    supportLevel: supportLevelToClient(rule.supportLevel),
    hasStateIncomeTax: rule.hasStateIncomeTax,
    hasExtraEmployeeWithholdings: rule.hasExtraEmployeeWithholdings,
    extraWithholdingTypes: rule.extraWithholdingTypes
      ? rule.extraWithholdingTypes.split(",").map((item) => item.trim()).filter(Boolean)
      : [],
    defaultStateWithholdingMode: rule.defaultStateWithholdingMode.toLowerCase(),
    defaultStateWithholdingValue: rule.defaultStateWithholdingValue,
    notes: rule.notes ?? "",
    disclaimerText:
      rule.disclaimerText ??
      (rule.supportLevel === "UNSUPPORTED" ? UNSUPPORTED_STATE_MESSAGE : ""),
    lastReviewedAt: rule.lastReviewedAt?.toISOString() ?? null,
    sourceLabel: rule.sourceLabel ?? "",
    sourceUrl: rule.sourceUrl ?? "",
    isActive: rule.isActive,
  };
}

export function serializeCompanySettings(
  company: Awaited<ReturnType<typeof getCompanySettingsOrThrow>>,
  stateRule: Awaited<ReturnType<typeof getStateRuleOrThrow>>,
) {
  const settings = company.payrollSettings!;
  const stateSupportLevel = supportLevelToClient(settings.supportLevelSnapshot);
  const supportedLines = [
    "Federal withholding estimate",
    !stateRule.hasStateIncomeTax
      ? "No state income tax withholding"
      : stateSupportLevel === "full"
        ? "State withholding estimate"
        : stateSupportLevel === "partial_manual"
          ? "Manual state withholding review"
          : "State-specific withholding verification required",
  ];

  if (company.stateCode === "MA" && settings.pfmlEnabled) {
    supportedLines.push("PFML employee withholding");
  } else if (stateRule.hasExtraEmployeeWithholdings && settings.extraWithholdingLabel) {
    supportedLines.push(settings.extraWithholdingLabel);
  }

  return {
    id: company.id,
    companyName: company.companyName,
    ownerName: company.ownerName ?? "",
    weekStartDay: settings.weekStartDay,
    companyState: company.stateCode,
    stateName: stateRule.stateName,
    supportLevel: stateSupportLevel,
    defaultFederalWithholdingMode: settings.defaultFederalWithholdingMode.toLowerCase(),
    defaultFederalWithholdingValue: settings.defaultFederalWithholdingValue,
    defaultStateWithholdingMode: settings.defaultStateWithholdingMode.toLowerCase(),
    defaultStateWithholdingValue: settings.defaultStateWithholdingValue,
    pfmlEnabled: settings.pfmlEnabled,
    pfmlEmployeeRate: settings.pfmlEmployeeRate,
    extraWithholdingLabel: settings.extraWithholdingLabel ?? "",
    extraWithholdingRate: settings.extraWithholdingRate ?? 0,
    hasStateIncomeTax: stateRule.hasStateIncomeTax,
    hasExtraEmployeeWithholdings: stateRule.hasExtraEmployeeWithholdings,
    supportedLines,
    timeTrackingStyle: timeTrackingStyleToClient(settings.timeTrackingStyle as TimeTrackingStyle),
    defaultLunchMinutes: settings.defaultLunchMinutes,
    payType: payTypeToClient(settings.payType as PayType),
    payrollMethod: payrollMethodToClient(settings.payrollMethod as PayrollMethod),
    trackExpenses: settings.trackExpenses,
    payrollPrepDisclaimer:
      settings.payrollPrepDisclaimer || PAYROLL_PREP_DISCLAIMER,
    stateDisclaimer:
      stateRule.disclaimerText ||
      (stateRule.supportLevel === "UNSUPPORTED" ? UNSUPPORTED_STATE_MESSAGE : ""),
    payrollReminder: EXPORT_REMINDER,
    disclaimerAcceptedAt: company.payrollDisclaimerAcceptedAt?.toISOString() ?? null,
    disclaimerAcceptedByUserId: company.payrollDisclaimerAcceptedByUserId ?? null,
    disclaimerVersion: company.payrollDisclaimerVersion ?? null,
    setupComplete: Boolean(company.onboardingCompletedAt),
    lastReviewedAt: stateRule.lastReviewedAt?.toISOString() ?? null,
    sourceLabel: stateRule.sourceLabel ?? "",
    sourceUrl: stateRule.sourceUrl ?? "",
  };
}

export function normalizeManagedEmployeeWorkerType(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (normalized === "employee" || normalized === "w2") {
    return "EMPLOYEE" as const;
  }

  if (normalized === "contractor_1099" || normalized === "1099") {
    return "CONTRACTOR_1099" as const;
  }

  return null;
}

export function normalizeFederalFilingStatus(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "single" || normalized === "married_jointly" || normalized === "head_of_household") {
    return normalized;
  }

  return null;
}

export function serializeManagedEmployee(
  employee: Awaited<ReturnType<typeof prisma.employee.findFirstOrThrow>> & {
    defaultCrew: { id: string; name: string } | null;
    user: { id: string } | null;
  },
) {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    displayName: employee.displayName,
    workerType: workerTypeToClient(asWorkerType(employee.workerType)),
    hourlyRate: currencyFromCents(employee.hourlyRateCents),
    federalFilingStatus: normalizeFederalFilingStatus(employee.federalFilingStatus) ?? "single",
    w4Step3Amount: employee.w4Step3Amount,
    w4CollectedAt: employee.w4CollectedAt?.toISOString() ?? null,
    active: employee.employmentStatus === "ACTIVE",
    defaultCrewId: employee.defaultCrewId,
    defaultCrewName: employee.defaultCrew?.name ?? null,
    hasLoginAccess: Boolean(employee.user),
  };
}

export async function getCompanyCrewOrThrow(companyId: string, crewId: string) {
  const crew = await prisma.crew.findFirst({
    where: { id: crewId, companyId },
    select: { id: true, name: true },
  });

  if (!crew) {
    throw new Error("Select a valid crew for this company.");
  }

  return crew;
}

export async function refreshEmployeeCurrentWeek(employeeId: string, companyId: string) {
  const currentWeekStart = parseWeekStart(undefined);
  await ensureWeekData(companyId, currentWeekStart);

  const currentWeek = await prisma.timesheetWeek.findUnique({
    where: {
      employeeId_weekStartDate: {
        employeeId,
        weekStartDate: currentWeekStart,
      },
    },
    select: { id: true },
  });

  if (currentWeek) {
    await recalculateTimesheet(currentWeek.id, companyId);
  }
}

export function normalizeInviteRole(value: string | undefined) {
  const normalized = value?.trim().toUpperCase() ?? "";

  if (normalized === "FOREMAN" || normalized === "EMPLOYEE") {
    return normalized;
  }

  return null;
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createInviteToken() {
  return randomBytes(32).toString("hex");
}

export function serializeInviteSummary(
  invite: {
    id: string;
    employeeId: string | null;
    email: string | null;
    role: string;
    acceptedAt: Date | null;
    expiresAt: Date;
    createdAt: Date;
    employee: { displayName: string } | null;
    invitedByUser: { fullName: string };
  },
) {
  const now = new Date();
  const status =
    invite.acceptedAt
      ? "accepted"
      : invite.expiresAt <= now
        ? "expired"
        : "pending";

  return {
    id: invite.id,
    employeeId: invite.employeeId,
    employeeName: invite.employee?.displayName ?? null,
    email: invite.email ?? "",
    role: invite.role.toLowerCase() as "foreman" | "employee",
    acceptedAt: invite.acceptedAt?.toISOString() ?? null,
    expiresAt: invite.expiresAt.toISOString(),
    createdAt: invite.createdAt.toISOString(),
    invitedByFullName: invite.invitedByUser.fullName,
    status,
  };
}

export function buildInviteUrl(req: express.Request, token: string) {
  const origin = req.get("origin")?.trim();
  const baseUrl = origin || `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/?invite=${encodeURIComponent(token)}`;
}

export function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function normalizeWeekStartDay(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6 ? value : null;
}

export function normalizePayrollMethod(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "SERVICE" || normalized === "MANUAL" || normalized === "MIXED") {
    return normalized as PayrollMethod;
  }

  return null;
}

export async function writeStatusAudit(
  timesheetWeekId: string,
  fromStatus: TimesheetStatus,
  toStatus: TimesheetStatus,
  createdByUserId: string,
  note?: string,
) {
  await prisma.timesheetStatusAudit.create({
    data: {
      timesheetWeekId,
      fromStatus,
      toStatus,
      note,
      createdByUserId,
    },
  });
}

export function canEmployeeEditStatus(status: TimesheetStatus) {
  return status === "DRAFT" || status === "NEEDS_REVISION";
}

export function canAdminOrForemanEditStatus(status: TimesheetStatus) {
  return status !== "OFFICE_LOCKED";
}

export async function getAccessibleCrewIds(userId: string, role: UserRole, companyId: string): Promise<string[] | null> {
  if (role === "ADMIN") {
    return null;
  }

  if (role === "FOREMAN") {
    const crews = await prisma.crew.findMany({
      where: { companyId: companyId, foremanId: await getEmployeeIdForUser(userId) },
      select: { id: true },
    });

    return crews.map((crew) => crew.id);
  }

  return [];
}

export async function getEmployeeIdForUser(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { employeeId: true },
  });

  return user?.employeeId ?? null;
}

export async function ensureWeekData(companyId: string, weekStart?: Date) {
  if (!weekStart) {
    weekStart = parseWeekStart(undefined);
  }
  const { company, payrollSettings } = await getCompanyContextOrThrow(companyId);
  const employees = await prisma.employee.findMany({
    where: { companyId, employmentStatus: "ACTIVE" },
    include: {
      defaultCrew: true,
      timesheets: {
        where: { weekStartDate: weekStart },
      },
    },
  });

  for (const employee of employees) {
    if (!employee.defaultCrewId || employee.timesheets.length > 0) {
      continue;
    }

    const timesheet = await prisma.timesheetWeek.create({
      data: {
        employeeId: employee.id,
        crewId: employee.defaultCrewId,
        weekStartDate: weekStart,
        status: "DRAFT",
        dayEntries: {
          create: Array.from({ length: 7 }, (_, dayIndex) => ({
            dayIndex,
            workDate: addDays(weekStart!, dayIndex),
            lunchMinutes: payrollSettings.defaultLunchMinutes,
            totalMinutes: 0,
          })),
        },
        adjustment: {
          create: {
            employeeId: employee.id,
            gasReimbursementCents: 0,
            pettyCashCents: 0,
            deductionCents: 0,
          },
        },
        payrollEstimate: {
          create: {
            employeeId: employee.id,
            regularMinutes: 0,
            overtimeMinutes: 0,
            grossPayCents: 0,
            federalWithholdingMode:
              employee.usesCompanyFederalDefault ? payrollSettings.defaultFederalWithholdingMode : "PERCENTAGE",
            federalWithholdingValue:
              employee.usesCompanyFederalDefault
                ? payrollSettings.defaultFederalWithholdingValue
                : employee.federalWithholdingPercent,
            stateWithholdingMode:
              employee.usesCompanyStateDefault ? payrollSettings.defaultStateWithholdingMode : "PERCENTAGE",
            stateWithholdingValue:
              employee.usesCompanyStateDefault
                ? payrollSettings.defaultStateWithholdingValue
                : employee.stateWithholdingPercent,
            federalWithholdingCents: 0,
            stateWithholdingCents: 0,
            pfmlWithholdingCents: 0,
            extraStateWithholdingLabel:
              company.stateCode === "MA" && payrollSettings.pfmlEnabled
                ? "PFML"
                : payrollSettings.extraWithholdingLabel,
            extraStateWithholdingCents: 0,
            netCheckEstimateCents: 0,
          },
        },
      },
      include: {
        employee: true,
        dayEntries: true,
        adjustment: true,
        payrollEstimate: true,
      },
    });

    await recalculateTimesheet(timesheet.id, companyId);
  }
}

export async function recalculateTimesheet(timesheetId: string, companyId: string) {
  const { company, payrollSettings, stateRule } = await getCompanyContextOrThrow(companyId);
  const timesheet = await prisma.timesheetWeek.findUniqueOrThrow({
    where: { id: timesheetId },
    include: {
      employee: true,
      dayEntries: { orderBy: { dayIndex: "asc" } },
      adjustment: true,
      payrollEstimate: true,
    },
  });

  for (const dayEntry of timesheet.dayEntries) {
    const nextTotalMinutes = calculateDayTotalMinutes(dayEntry);
    if (nextTotalMinutes !== dayEntry.totalMinutes) {
      await prisma.timeEntryDay.update({
        where: { id: dayEntry.id },
        data: { totalMinutes: nextTotalMinutes },
      });
      dayEntry.totalMinutes = nextTotalMinutes;
    }
  }

  const estimate = calculatePayrollEstimate({
    employee: timesheet.employee,
    company,
    companyPayrollSettings: payrollSettings,
    stateRule,
    dayEntries: timesheet.dayEntries,
    adjustment: timesheet.adjustment,
    existingEstimate: timesheet.payrollEstimate,
  });

  if (timesheet.payrollEstimate) {
    await prisma.payrollEstimate.update({
      where: { timesheetWeekId: timesheet.id },
      data: estimate,
    });
  } else {
    await prisma.payrollEstimate.create({
      data: {
        employeeId: timesheet.employeeId,
        timesheetWeekId: timesheet.id,
        ...estimate,
      },
    });
  }
}

export async function getAuthorizedTimesheet(req: AuthenticatedRequest, timesheetId: string) {
  const auth = req.auth;
  if (!auth) {
    throw new Error("Missing auth");
  }

  const timesheet = await prisma.timesheetWeek.findUnique({
    where: { id: timesheetId },
    include: {
      employee: true,
      crew: true,
      dayEntries: { orderBy: { dayIndex: "asc" } },
      adjustment: true,
      payrollEstimate: true,
      statusAuditEvents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!timesheet) {
    return null;
  }

  if (auth.role === "ADMIN") {
    return timesheet;
  }

  const user = await getCurrentUserOrThrow(auth.userId);
  if (auth.role === "EMPLOYEE" && user.employeeId === timesheet.employeeId) {
    return timesheet;
  }

  if (auth.role === "FOREMAN") {
    const crewIds = await getAccessibleCrewIds(auth.userId, auth.role, auth.companyId);
    if (crewIds?.includes(timesheet.crewId)) {
      return timesheet;
    }
  }

  return null;
}

export function serializeTimesheet(
  timesheet: Awaited<ReturnType<typeof getAuthorizedTimesheet>> extends infer T ? Exclude<T, null> : never,
  viewerRole: UserRole,
  usersById: Map<string, string>,
  ytdSummary: ReturnType<typeof createEmptyYtdSummary>,
) {
  const totalHours = timesheet.dayEntries.reduce((sum, day) => sum + day.totalMinutes, 0) / 60;
  const overtimeHours = (timesheet.payrollEstimate?.overtimeMinutes ?? 0) / 60;
  const confirmedDays = timesheet.dayEntries.filter((entry) => entry.employeeConfirmed).length;

  return {
    id: timesheet.id,
    employeeId: timesheet.employeeId,
    employeeName: timesheet.employee.displayName,
    workerType: workerTypeToClient(asWorkerType(timesheet.employee.workerType)),
    crewId: timesheet.crewId,
    crewName: timesheet.crew.name,
    hourlyRate: viewerRole === "EMPLOYEE" ? null : currencyFromCents(timesheet.employee.hourlyRateCents),
    federalFilingStatus: normalizeFederalFilingStatus(timesheet.employee.federalFilingStatus) ?? "single",
    w4Step3Amount: timesheet.employee.w4Step3Amount,
    w4CollectedAt: timesheet.employee.w4CollectedAt?.toISOString() ?? null,
    status: statusToClient(asTimesheetStatus(timesheet.status)),
    entries: timesheet.dayEntries.map((entry) => ({
      id: entry.id,
      dayIndex: entry.dayIndex,
      dayLabel: getWeekdayLabel(entry.dayIndex),
      date: formatIsoDate(entry.workDate),
      start: minutesToTimeString(entry.startTimeMinutes),
      end: minutesToTimeString(entry.endTimeMinutes),
      lunchMinutes: entry.lunchMinutes,
      totalHours: Math.round(((entry.totalMinutes / 60) + Number.EPSILON) * 100) / 100,
      jobTag: entry.jobTag,
      employeeConfirmed: entry.employeeConfirmed,
    })),
    weeklyTotalHours: Math.round((totalHours + Number.EPSILON) * 100) / 100,
    overtimeHours: Math.round((overtimeHours + Number.EPSILON) * 100) / 100,
    grossPay: currencyFromCents(timesheet.payrollEstimate?.grossPayCents ?? 0),
    confirmedDays,
    missingConfirmationDays: 7 - confirmedDays,
    adjustment: {
      gasReimbursement: currencyFromCents(timesheet.adjustment?.gasReimbursementCents ?? 0),
      pettyCashReimbursement: currencyFromCents(timesheet.adjustment?.pettyCashCents ?? 0),
      deductionAdvance: currencyFromCents(timesheet.adjustment?.deductionCents ?? 0),
      notes: timesheet.adjustment?.note ?? "",
    },
    payrollEstimate: {
      regularHours: (timesheet.payrollEstimate?.regularMinutes ?? 0) / 60,
      overtimeHours: (timesheet.payrollEstimate?.overtimeMinutes ?? 0) / 60,
      grossPay: currencyFromCents(timesheet.payrollEstimate?.grossPayCents ?? 0),
      federalWithholding: currencyFromCents(timesheet.payrollEstimate?.federalWithholdingCents ?? 0),
      w4NotOnFile: timesheet.employee.w4CollectedAt === null,
      stateWithholding: currencyFromCents(timesheet.payrollEstimate?.stateWithholdingCents ?? 0),
      pfmlWithholding: currencyFromCents(timesheet.payrollEstimate?.pfmlWithholdingCents ?? 0),
      extraStateWithholdingLabel: timesheet.payrollEstimate?.extraStateWithholdingLabel ?? "",
      extraStateWithholding: currencyFromCents(timesheet.payrollEstimate?.extraStateWithholdingCents ?? 0),
      reimbursements: currencyFromCents(
        (timesheet.adjustment?.gasReimbursementCents ?? 0) + (timesheet.adjustment?.pettyCashCents ?? 0),
      ),
      deductions: currencyFromCents(timesheet.adjustment?.deductionCents ?? 0),
      netCheckEstimate: currencyFromCents(timesheet.payrollEstimate?.netCheckEstimateCents ?? 0),
    },
    ytdSummary,
    exportedAt: timesheet.exportedAt?.toISOString() ?? null,
    exportedByFullName: timesheet.exportedByUserId ? usersById.get(timesheet.exportedByUserId) ?? "Unknown user" : null,
    statusAuditTrail: timesheet.statusAuditEvents.map((event) => ({
      id: event.id,
      fromStatus: statusToClient(asTimesheetStatus(event.fromStatus)),
      toStatus: statusToClient(asTimesheetStatus(event.toStatus)),
      note: event.note ?? "",
      createdAt: event.createdAt.toISOString(),
      createdByFullName: usersById.get(event.createdByUserId) ?? "Unknown user",
    })),
  };
}

type TimesheetSummarySource = Awaited<ReturnType<typeof getAuthorizedTimesheet>> extends infer T
  ? Exclude<T, null>
  : never;

export async function buildYtdSummaries(
  timesheets: TimesheetSummarySource[],
  weekStart: Date,
) {
  const employeeIds = Array.from(new Set(timesheets.map((timesheet) => timesheet.employeeId)));
  const calendarYear = weekStart.getFullYear();
  const fallbackSummaries = new Map(
    timesheets.map((timesheet) => [
      timesheet.employeeId,
      createEmptyYtdSummary(asWorkerType(timesheet.employee.workerType), calendarYear),
    ]),
  );

  if (employeeIds.length === 0) {
    return fallbackSummaries;
  }

  const yearStart = new Date(calendarYear, 0, 1);
  const nextWeekStart = addDays(weekStart, 7);
  const ytdTimesheets = await prisma.timesheetWeek.findMany({
    where: {
      employeeId: { in: employeeIds },
      weekStartDate: {
        gte: yearStart,
        lt: nextWeekStart,
      },
    },
    include: {
      employee: true,
      adjustment: true,
      payrollEstimate: true,
    },
  });

  for (const timesheet of ytdTimesheets) {
    const current = fallbackSummaries.get(timesheet.employeeId) ?? createEmptyYtdSummary(asWorkerType(timesheet.employee.workerType), calendarYear);
    current.grossPayments += currencyFromCents(timesheet.payrollEstimate?.grossPayCents ?? 0);
    current.reimbursements += currencyFromCents(
      (timesheet.adjustment?.gasReimbursementCents ?? 0) + (timesheet.adjustment?.pettyCashCents ?? 0),
    );
    current.deductions += currencyFromCents(timesheet.adjustment?.deductionCents ?? 0);
    current.netEstimate += currencyFromCents(timesheet.payrollEstimate?.netCheckEstimateCents ?? 0);
    fallbackSummaries.set(timesheet.employeeId, current);
  }

  return fallbackSummaries;
}

export async function buildBootstrap(userId: string, role: UserRole, companyId: string, weekStart: Date) {
  await ensureWeekData(companyId, weekStart);
  const user = await getCurrentUserOrThrow(userId);
  const { company, stateRule } = await getCompanyContextOrThrow(companyId);
  const accessibleCrewIds = await getAccessibleCrewIds(userId, role, companyId);
  const stateRules = await prisma.statePayrollRule.findMany({
    where: { isActive: true },
    orderBy: { stateCode: "asc" },
  });

  const crewWhere =
    role === "ADMIN"
      ? { companyId }
      : role === "FOREMAN"
        ? { companyId, id: { in: accessibleCrewIds ?? [] } }
        : user.employeeId
          ? {
              companyId,
              OR: [{ foremanId: user.employeeId }, { assignments: { some: { employeeId: user.employeeId } } }],
            }
          : { companyId, id: { in: [] as string[] } };

  const crews = await prisma.crew.findMany({
    where: crewWhere,
    include: {
      foreman: true,
      dayDefaults: {
        where: { weekStartDate: weekStart },
        orderBy: { dayIndex: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const timesheetWhere =
    role === "ADMIN"
      ? { weekStartDate: weekStart, employee: { companyId: companyId } }
      : role === "FOREMAN"
        ? { weekStartDate: weekStart, crewId: { in: accessibleCrewIds ?? [] } }
        : { weekStartDate: weekStart, employeeId: user.employeeId ?? "" };

  const timesheets = await prisma.timesheetWeek.findMany({
    where: timesheetWhere,
    include: {
      employee: true,
      crew: true,
      dayEntries: { orderBy: { dayIndex: "asc" } },
      adjustment: true,
      payrollEstimate: true,
      statusAuditEvents: { orderBy: { createdAt: "desc" } },
    },
    orderBy: [{ crew: { name: "asc" } }, { employee: { displayName: "asc" } }],
  });

  const privateReports =
    role === "ADMIN"
      ? await prisma.privateReport.findMany({
          where: { employee: { companyId: companyId } },
          include: {
            employee: true,
            crew: true,
          },
          orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
          take: 25,
        })
      : [];

  const archivedEmployees =
    role === "ADMIN"
      ? await prisma.employee.findMany({
          where: { companyId, employmentStatus: "ARCHIVED" },
          include: { defaultCrew: true },
          orderBy: { displayName: "asc" },
        })
      : [];

  const auditUserIds = Array.from(
    new Set(
      timesheets.flatMap((timesheet) => [
        ...timesheet.statusAuditEvents.map((event) => event.createdByUserId),
        ...(timesheet.exportedByUserId ? [timesheet.exportedByUserId] : []),
      ]),
    ),
  );
  const auditUsers =
    auditUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: auditUserIds } },
          select: { id: true, fullName: true },
        })
      : [];
  const auditUsersById = new Map(auditUsers.map((entry) => [entry.id, entry.fullName]));
  const ytdSummariesByEmployeeId = await buildYtdSummaries(timesheets, weekStart);

  return {
    viewer: {
      id: user.id,
      fullName: user.fullName,
      role: user.role.toLowerCase(),
      employeeId: user.employeeId,
      preferredView: (user as Record<string, unknown>)["preferredView"] as string ?? "office",
    },
    weekStart: formatIsoDate(weekStart),
    companySettings: serializeCompanySettings(company, stateRule),
    stateRules: stateRules.map((entry) => serializeStateRule(entry)),
    crews: crews.map((crew) => ({
      id: crew.id,
      name: crew.name,
      foremanName: crew.foreman?.displayName ?? "Unassigned",
      dayDefaults: crew.dayDefaults.map((dayDefault) => ({
        dayIndex: dayDefault.dayIndex,
        start: minutesToTimeString(dayDefault.startTimeMinutes),
        end: minutesToTimeString(dayDefault.endTimeMinutes),
      })),
    })),
    employeeWeeks: timesheets.map((timesheet) =>
      serializeTimesheet(
        timesheet,
        asUserRole(user.role),
        auditUsersById,
        ytdSummariesByEmployeeId.get(timesheet.employeeId) ??
          createEmptyYtdSummary(asWorkerType(timesheet.employee.workerType), weekStart.getFullYear()),
      ),
    ),
    privateReports: privateReports.map((report) => ({
      id: report.id,
      employeeId: report.employeeId,
      employeeName: report.employee.displayName,
      crewName: report.crew.name,
      date: formatIsoDate(report.reportDate),
      jobTag: report.jobTag,
      category: report.category,
      severity: report.severity,
      factualDescription: report.factualDescription,
      followUpStatus: report.followUpStatus.toLowerCase(),
    })),
    archivedEmployees: archivedEmployees.map((employee) => ({
      id: employee.id,
      displayName: employee.displayName,
      crewName: employee.defaultCrew?.name ?? "No default crew",
      archiveReason: employee.archiveReason ?? "",
      archiveNotes: employee.archiveNotes ?? "",
    })),
  };
}

export function resetStatusOnEdit(currentStatus: TimesheetStatus): Partial<{
  status: TimesheetStatus;
  submittedByEmployeeAt: Date | null;
  reviewedByForemanAt: Date | null;
  lockedAt: Date | null;
}> {
  if (currentStatus === "OFFICE_LOCKED" || currentStatus === "NEEDS_REVISION") {
    return {};
  }

  if (currentStatus === "DRAFT") {
    return {};
  }

  return {
    status: "DRAFT",
    submittedByEmployeeAt: null,
    reviewedByForemanAt: null,
    lockedAt: null,
  };
}

export function createCsvRow(values: Array<string | number>) {
  return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",");
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function markLockedWeeksExported(weekStart: Date, exportedByUserId: string) {
  await prisma.timesheetWeek.updateMany({
    where: {
      weekStartDate: weekStart,
      status: "OFFICE_LOCKED",
    },
    data: {
      exportedAt: new Date(),
      exportedByUserId,
    },
  });
}

// Re-export for convenience in route files
export { clampLunchMinutes, parseWeekStart, timeStringToMinutes };

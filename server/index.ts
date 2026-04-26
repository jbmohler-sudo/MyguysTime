import "dotenv/config";
import { Sentry, sentryEnabled, sentryVerificationEnabled } from "./sentry.js";
import express from "express";
import cors from "cors";
import { createHash, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import { authenticate, getCurrentUserOrThrow, type AuthenticatedRequest, type UserRole } from "./auth.js";
import { prisma } from "./db.js";
import { calculateDayTotalMinutes, calculatePayrollEstimate } from "./payroll.js";
import { getSupabaseAuthClient } from "./supabase.js";
import {
  addDays,
  clampLunchMinutes,
  currencyFromCents,
  formatIsoDate,
  getWeekdayLabel,
  minutesToTimeString,
  parseWeekStart,
  timeStringToMinutes,
} from "./utils.js";

export const app = express();
const port = Number(process.env.PORT || 3001);
type TimesheetStatus = "DRAFT" | "NEEDS_REVISION" | "EMPLOYEE_CONFIRMED" | "FOREMAN_APPROVED" | "OFFICE_LOCKED";
type WorkerType = "EMPLOYEE" | "CONTRACTOR_1099";
type TimeTrackingStyle = "FOREMAN" | "WORKER_SELF_ENTRY" | "MIXED";
type PayType = "HOURLY" | "HOURLY_OVERTIME";
type PayrollMethod = "SERVICE" | "MANUAL" | "MIXED";
const PAYROLL_PREP_DISCLAIMER = `Important: Payroll Estimates

This app is designed to help you track hours and estimate pay and withholdings.
It is not a payroll service and does not guarantee full tax compliance.

While we strive to provide accurate calculations, tax rates and rules vary by state and may change.
Please review all numbers and confirm with your accountant or official state resources before issuing payments.

By continuing, you acknowledge that you are responsible for verifying payroll amounts.`;
const EXPORT_REMINDER = "Estimates only — verify before issuing checks.";
const UNSUPPORTED_STATE_MESSAGE =
  "We do not yet support accurate state-specific withholding calculations for this state. You can still use the app for time tracking and payroll prep, but please confirm state-specific withholding with your accountant or official state resources.";
const SIGNUP_DEFAULT_STATE_CODE = "TX";
const INVITE_EXPIRY_HOURS = 72;


app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

function asyncHandler<Req extends express.Request = express.Request>(
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

function canManageCrew(role: UserRole) {
  return role === "ADMIN" || role === "FOREMAN";
}

function asUserRole(role: string): UserRole {
  if (role === "ADMIN" || role === "FOREMAN" || role === "EMPLOYEE") {
    return role;
  }

  throw new Error(`Unsupported user role: ${role}`);
}

function asTimesheetStatus(status: string): TimesheetStatus {
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

function asWorkerType(workerType: string | null | undefined): WorkerType {
  if (workerType === "CONTRACTOR_1099") {
    return workerType;
  }

  return "EMPLOYEE";
}

function getParam(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  return Array.isArray(value) ? value[0] : "";
}

function statusToClient(status: TimesheetStatus) {
  return status.toLowerCase() as "draft" | "employee_confirmed" | "foreman_approved" | "office_locked";
}

function workerTypeToClient(workerType: WorkerType) {
  return workerType.toLowerCase() as "employee" | "contractor_1099";
}

function timeTrackingStyleToClient(value: TimeTrackingStyle) {
  if (value === "WORKER_SELF_ENTRY") {
    return "worker_self_entry" as const;
  }

  return value.toLowerCase() as "foreman" | "mixed";
}

function payTypeToClient(value: PayType) {
  return value === "HOURLY" ? "hourly" as const : "hourly_overtime" as const;
}

function payrollMethodToClient(value: PayrollMethod) {
  return value.toLowerCase() as "service" | "manual" | "mixed";
}

function createEmptyYtdSummary(workerType: WorkerType, calendarYear: number) {
  return {
    calendarYear,
    workerType: workerTypeToClient(workerType),
    grossPayments: 0,
    reimbursements: 0,
    deductions: 0,
    netEstimate: 0,
  };
}

async function getCompanySettingsOrThrow(companyId: string) {
  return prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    include: {
      payrollSettings: true,
    },
  });
}

async function getStateRuleOrThrow(stateCode: string) {
  return prisma.statePayrollRule.findUniqueOrThrow({
    where: { stateCode },
  });
}

async function getCompanyContextOrThrow(companyId: string) {
  const company = await getCompanySettingsOrThrow(companyId);
  const payrollSettings = company.payrollSettings;
  if (!payrollSettings) {
    throw new Error("Company payroll settings are missing.");
  }
  const stateRule = await getStateRuleOrThrow(company.stateCode);
  return { company, payrollSettings, stateRule };
}

function supportLevelToClient(value: string) {
  return value.toLowerCase() as "full" | "partial_manual" | "unsupported";
}

function buildUnsupportedStateRuleData(stateCode: string) {
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

function buildPayrollSettingsDefaults(
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

function serializeStateRule(rule: Awaited<ReturnType<typeof getStateRuleOrThrow>>) {
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

function serializeCompanySettings(
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

function normalizeManagedEmployeeWorkerType(value: string | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (normalized === "employee" || normalized === "w2") {
    return "EMPLOYEE" as const;
  }

  if (normalized === "contractor_1099" || normalized === "1099") {
    return "CONTRACTOR_1099" as const;
  }

  return null;
}

function normalizeFederalFilingStatus(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "single" || normalized === "married_jointly" || normalized === "head_of_household") {
    return normalized;
  }

  return null;
}

function serializeManagedEmployee(
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

async function getCompanyCrewOrThrow(companyId: string, crewId: string) {
  const crew = await prisma.crew.findFirst({
    where: { id: crewId, companyId },
    select: { id: true, name: true },
  });

  if (!crew) {
    throw new Error("Select a valid crew for this company.");
  }

  return crew;
}

async function refreshEmployeeCurrentWeek(employeeId: string, companyId: string) {
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

function normalizeInviteRole(value: string | undefined) {
  const normalized = value?.trim().toUpperCase() ?? "";

  if (normalized === "FOREMAN" || normalized === "EMPLOYEE") {
    return normalized;
  }

  return null;
}

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createInviteToken() {
  return randomBytes(32).toString("hex");
}

function serializeInviteSummary(
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

function buildInviteUrl(req: express.Request, token: string) {
  const origin = req.get("origin")?.trim();
  const baseUrl = origin || `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/?invite=${encodeURIComponent(token)}`;
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function normalizeWeekStartDay(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6 ? value : null;
}

function normalizePayrollMethod(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "SERVICE" || normalized === "MANUAL" || normalized === "MIXED") {
    return normalized as PayrollMethod;
  }

  return null;
}

async function writeStatusAudit(
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

function canEmployeeEditStatus(status: TimesheetStatus) {
  return status === "DRAFT" || status === "NEEDS_REVISION";
}

function canAdminOrForemanEditStatus(status: TimesheetStatus) {
  return status !== "OFFICE_LOCKED";
}

async function getAccessibleCrewIds(userId: string, role: UserRole, companyId: string): Promise<string[] | null> {
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

async function getEmployeeIdForUser(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { employeeId: true },
  });

  return user?.employeeId ?? null;
}

async function ensureWeekData(companyId: string, weekStart?: Date) {
  // Allow weekStart to be optional with a default value
  if (!weekStart) {
    weekStart = parseWeekStart(undefined);
  }
  const { company, payrollSettings, stateRule } = await getCompanyContextOrThrow(companyId);
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
            workDate: addDays(weekStart, dayIndex),
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

async function recalculateTimesheet(timesheetId: string, companyId: string) {
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

async function getAuthorizedTimesheet(req: AuthenticatedRequest, timesheetId: string) {
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

function serializeTimesheet(
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

async function buildYtdSummaries(
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

async function buildBootstrap(userId: string, role: UserRole, companyId: string, weekStart: Date) {
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

function resetStatusOnEdit(currentStatus: TimesheetStatus): Partial<{
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

app.get("/api/health", asyncHandler(async (_req, res) => {
  res.json({ ok: true });
}));

app.post("/api/debug/sentry-test", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  if (!sentryVerificationEnabled) {
    res.status(404).json({ error: "Temporary Sentry verification route is disabled." });
    return;
  }

  if (!sentryEnabled) {
    res.status(409).json({ error: "Set SENTRY_DSN before using the backend Sentry verification route." });
    return;
  }

  const eventId = Sentry.captureException(
    new Error("Temporary Sentry backend verification event. Disable the verification route after confirming delivery."),
  );

  await Sentry.flush(2000);
  res.status(202).json({ ok: true, eventId: eventId ?? null });
}));


app.post("/api/auth/signup", asyncHandler(async (req, res) => {
  const { fullName, companyName, email, password } = req.body as {
    fullName?: unknown;
    companyName?: unknown;
    email?: unknown;
    password?: unknown;
  };

  const cleanFullName = typeof fullName === "string" ? fullName.trim() : "";
  const cleanCompanyName = typeof companyName === "string" ? companyName.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanPassword = typeof password === "string" ? password : "";

  if (!cleanFullName || !cleanCompanyName || !cleanEmail || !cleanPassword) {
    res.status(400).json({ error: "All fields are required." });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  const supabase = getSupabaseAuthClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: cleanEmail,
    password: cleanPassword,
  });

  if (authError || !authData.user) {
    res.status(400).json({ error: authError?.message ?? "Could not create auth account." });
    return;
  }

  const company = await prisma.company.create({
    data: {
      companyName: cleanCompanyName,
      ownerName: cleanFullName,
      stateCode: SIGNUP_DEFAULT_STATE_CODE,
    },
  });

  await prisma.user.create({
    data: {
      supabaseId: authData.user.id,
      companyId: company.id,
      email: cleanEmail,
      fullName: cleanFullName,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  res.status(201).json({ token: "" });
}));

app.get("/api/auth/me", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const auth = req.auth!;
  const weekStart = parseWeekStart(typeof req.query.weekStart === "string" ? req.query.weekStart : undefined);
  const payload = await buildBootstrap(auth.userId, auth.role, auth.companyId, weekStart);
  res.json(payload);
}));

app.patch("/api/auth/me", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
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

app.post("/api/company-setup", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
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
        federalFilingStatus: "single",
        w4Step3Amount: 0,
        w4CollectedAt: null,
        defaultCrewId: defaultCrew.id,
        usesCompanyFederalDefault: !isContractor,
        usesCompanyStateDefault: !isContractor,
        federalWithholdingPercent: isContractor ? 0 : nextPayrollSettings.defaultFederalWithholdingValue,
        stateWithholdingPercent: isContractor ? 0 : nextPayrollSettings.defaultStateWithholdingValue,
      },
    });
  }

  const currentWeekStart = parseWeekStart(undefined);
  await ensureWeekData(req.auth!.companyId, currentWeekStart);

  const affectedTimesheets = await prisma.timesheetWeek.findMany({
    where: {
      employee: { companyId: req.auth!.companyId },
      OR: [
        { employee: { usesCompanyFederalDefault: true } },
        { employee: { usesCompanyStateDefault: true } },
      ],
    },
    select: { id: true },
  });

  for (const timesheet of affectedTimesheets) {
    await recalculateTimesheet(timesheet.id, req.auth!.companyId);
  }

  const payload = await buildBootstrap(req.auth!.userId, req.auth!.role, req.auth!.companyId, currentWeekStart);
  res.json(payload);
}));

app.patch("/api/company-settings", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (req.auth!.role !== "ADMIN") {
    res.status(403).json({ error: "Only admin can update company settings." });
    return;
  }

  const { company: currentCompany, payrollSettings: currentSettings } = await getCompanyContextOrThrow(req.auth!.companyId);
  const {
    companyName,
    companyState,
    weekStartDay,
    defaultFederalWithholdingMode,
    defaultFederalWithholdingValue,
    defaultStateWithholdingMode,
    defaultStateWithholdingValue,
    payrollPrepDisclaimer,
    pfmlEnabled,
    pfmlEmployeeRate,
    payrollMethod,
  } = req.body as {
    companyName?: string;
    companyState?: string;
    weekStartDay?: number;
    defaultFederalWithholdingMode?: string;
    defaultFederalWithholdingValue?: number;
    defaultStateWithholdingMode?: string;
    defaultStateWithholdingValue?: number;
    payrollPrepDisclaimer?: string;
    pfmlEnabled?: boolean;
    pfmlEmployeeRate?: number;
    payrollMethod?: string;
  };

  const nextFederalMode =
    defaultFederalWithholdingMode?.toUpperCase() ?? currentSettings.defaultFederalWithholdingMode;
  const nextStateMode =
    defaultStateWithholdingMode?.toUpperCase() ?? currentSettings.defaultStateWithholdingMode;

  if (!["PERCENTAGE", "MANUAL_OVERRIDE"].includes(nextFederalMode)) {
    res.status(400).json({ error: "Unsupported default federal withholding mode." });
    return;
  }

  if (!["PERCENTAGE", "MANUAL_OVERRIDE"].includes(nextStateMode)) {
    res.status(400).json({ error: "Unsupported default state withholding mode." });
    return;
  }

  if (
    defaultFederalWithholdingValue !== undefined &&
    !isFiniteNonNegativeNumber(defaultFederalWithholdingValue)
  ) {
    res.status(400).json({ error: "Default federal withholding value must be a non-negative number." });
    return;
  }

  if (
    defaultStateWithholdingValue !== undefined &&
    !isFiniteNonNegativeNumber(defaultStateWithholdingValue)
  ) {
    res.status(400).json({ error: "Default state withholding value must be a non-negative number." });
    return;
  }

  if (pfmlEmployeeRate !== undefined && !isFiniteNonNegativeNumber(pfmlEmployeeRate)) {
    res.status(400).json({ error: "PFML employee rate must be a non-negative number." });
    return;
  }

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
  const stateChanged = nextStateCode !== currentCompany.stateCode;
  const nextStateRule =
    (await prisma.statePayrollRule.findUnique({
      where: { stateCode: nextStateCode },
    })) ??
    (await prisma.statePayrollRule.create({
      data: buildUnsupportedStateRuleData(nextStateCode),
    }));

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
      defaultFederalWithholdingMode: nextFederalMode,
      defaultFederalWithholdingValue:
        typeof defaultFederalWithholdingValue === "number"
          ? defaultFederalWithholdingValue
          : currentSettings.defaultFederalWithholdingValue,
      defaultStateWithholdingMode:
        defaultStateWithholdingMode !== undefined
          ? nextStateMode
          : stateChanged
            ? nextStateRule.defaultStateWithholdingMode
            : currentSettings.defaultStateWithholdingMode,
      defaultStateWithholdingValue:
        typeof defaultStateWithholdingValue === "number"
          ? defaultStateWithholdingValue
          : stateChanged
            ? nextStateRule.defaultStateWithholdingValue
            : currentSettings.defaultStateWithholdingValue,
      payrollPrepDisclaimer:
        payrollPrepDisclaimer !== undefined ? payrollPrepDisclaimer : currentSettings.payrollPrepDisclaimer,
      payrollMethod: nextPayrollMethod,
      pfmlEnabled:
        typeof pfmlEnabled === "boolean"
          ? pfmlEnabled
          : nextStateCode === "MA"
            ? nextStateRule.defaultPfmlEnabled
            : false,
      pfmlEmployeeRate:
        typeof pfmlEmployeeRate === "number"
          ? pfmlEmployeeRate
          : nextStateCode === "MA"
            ? nextStateRule.defaultPfmlEmployeeRate
            : 0,
      extraWithholdingLabel:
        nextStateCode === "MA"
          ? "PFML"
          : nextStateRule.hasExtraEmployeeWithholdings
            ? nextStateRule.extraWithholdingTypes ?? currentSettings.extraWithholdingLabel
            : "Manual state withholding",
      extraWithholdingRate:
        nextStateCode === "MA"
          ? typeof pfmlEmployeeRate === "number"
            ? pfmlEmployeeRate
            : nextStateRule.defaultPfmlEmployeeRate
          : null,
      supportLevelSnapshot: nextStateRule.supportLevel,
    },
  });

  const affectedTimesheets = await prisma.timesheetWeek.findMany({
    where: {
      employee: { companyId: req.auth!.companyId },
      OR: [
        { employee: { usesCompanyFederalDefault: true } },
        { employee: { usesCompanyStateDefault: true } },
      ],
    },
    select: { id: true },
  });

  for (const timesheet of affectedTimesheets) {
    await recalculateTimesheet(timesheet.id, req.auth!.companyId);
  }

  res.json({
    companySettings: serializeCompanySettings(
      { ...updatedCompany, payrollSettings: updatedSettings },
      nextStateRule,
    ),
  });
}));

app.get("/api/employees", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
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

app.post("/api/employees", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
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
    federalFilingStatus,
    w4Step3Amount,
    w4CollectedAt,
    defaultCrewId,
    active,
  } = req.body as {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    workerType?: string;
    hourlyRate?: number;
    federalFilingStatus?: string;
    w4Step3Amount?: number;
    w4CollectedAt?: string | null;
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

  const nextFederalFilingStatus = normalizeFederalFilingStatus(federalFilingStatus ?? "single");
  if (!nextFederalFilingStatus) {
    res.status(400).json({ error: "Federal filing status must be single, married jointly, or head of household." });
    return;
  }

  if (w4Step3Amount !== undefined && !isFiniteNonNegativeNumber(w4Step3Amount)) {
    res.status(400).json({ error: "W-4 Step 3 amount must be a non-negative number." });
    return;
  }

  const parsedW4CollectedAt =
    w4CollectedAt === undefined
      ? null
      : w4CollectedAt === null
        ? null
        : new Date(w4CollectedAt);
  if (parsedW4CollectedAt && Number.isNaN(parsedW4CollectedAt.getTime())) {
    res.status(400).json({ error: "W-4 collected date is invalid." });
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

  const isContractor = normalizedWorkerType === "CONTRACTOR_1099";
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
      federalFilingStatus: nextFederalFilingStatus,
      w4Step3Amount: w4Step3Amount ?? 0,
      w4CollectedAt: parsedW4CollectedAt,
      defaultCrewId: cleanDefaultCrewId,
      usesCompanyFederalDefault: !isContractor,
      usesCompanyStateDefault: !isContractor,
      federalWithholdingPercent: isContractor ? 0 : payrollSettings.defaultFederalWithholdingValue,
      stateWithholdingPercent: isContractor ? 0 : payrollSettings.defaultStateWithholdingValue,
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

app.patch("/api/employees/:employeeId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
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
    federalFilingStatus,
    w4Step3Amount,
    w4CollectedAt,
    defaultCrewId,
    active,
  } = req.body as {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    workerType?: string;
    hourlyRate?: number;
    federalFilingStatus?: string;
    w4Step3Amount?: number;
    w4CollectedAt?: string | null;
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

  const nextFederalFilingStatus = normalizeFederalFilingStatus(federalFilingStatus ?? currentEmployee.federalFilingStatus);
  if (!nextFederalFilingStatus) {
    res.status(400).json({ error: "Federal filing status must be single, married jointly, or head of household." });
    return;
  }

  if (w4Step3Amount !== undefined && !isFiniteNonNegativeNumber(w4Step3Amount)) {
    res.status(400).json({ error: "W-4 Step 3 amount must be a non-negative number." });
    return;
  }

  const parsedW4CollectedAt =
    w4CollectedAt === undefined
      ? currentEmployee.w4CollectedAt
      : w4CollectedAt === null
        ? null
        : new Date(w4CollectedAt);
  if (parsedW4CollectedAt && Number.isNaN(parsedW4CollectedAt.getTime())) {
    res.status(400).json({ error: "W-4 collected date is invalid." });
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

  const isContractor = normalizedWorkerType === "CONTRACTOR_1099";
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
      federalFilingStatus: nextFederalFilingStatus,
      w4Step3Amount: w4Step3Amount ?? currentEmployee.w4Step3Amount,
      w4CollectedAt: parsedW4CollectedAt,
      defaultCrewId: cleanDefaultCrewId,
      usesCompanyFederalDefault: !isContractor,
      usesCompanyStateDefault: !isContractor,
      federalWithholdingPercent: isContractor ? 0 : payrollSettings.defaultFederalWithholdingValue,
      stateWithholdingPercent: isContractor ? 0 : payrollSettings.defaultStateWithholdingValue,
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

app.get("/api/company/invites", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
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

app.post("/api/company/invites", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
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

app.post("/api/company/invites/:inviteId/resend", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
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

app.delete("/api/company/invites/:inviteId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
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

app.patch("/api/timesheets/:timesheetId/days/:dayEntryId", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
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

app.post("/api/crews/:crewId/defaults", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
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

app.patch("/api/timesheets/:timesheetId/adjustment", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
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

app.patch("/api/timesheets/:timesheetId/status", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
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

function authorizeAdmin(req: AuthenticatedRequest, res: express.Response): boolean {
  if (req.auth?.role !== "ADMIN") {
    res.status(403).json({ error: "Admin access required." });
    return false;
  }
  return true;
}

app.post("/api/private-reports", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!["FOREMAN", "ADMIN"].includes(req.auth!.role)) {
    res.status(403).json({ error: "Only foremen and admin can submit private reports." });
    return;
  }

  const { employeeId, crewId, date, jobTag, category, severity, factualDescription } = req.body as {
    employeeId?: string;
    crewId?: string;
    date?: string;
    jobTag?: string;
    category?: string;
    severity?: string;
    factualDescription?: string;
  };

  if (!employeeId || !crewId || !date || !category || !severity || !factualDescription) {
    res.status(400).json({ error: "Missing required report fields." });
    return;
  }

  if (req.auth!.role === "FOREMAN") {
    const crewIds = await getAccessibleCrewIds(req.auth!.userId, req.auth!.role, req.auth!.companyId);
    if (!crewIds?.includes(crewId)) {
      res.status(403).json({ error: "You cannot submit reports for this crew." });
      return;
    }
  }

  await prisma.privateReport.create({
    data: {
      employeeId,
      crewId,
      reportDate: new Date(`${date}T00:00:00`),
      jobTag,
      category,
      severity,
      factualDescription,
      createdByUserId: req.auth!.userId,
    },
  });

  res.status(201).json({ ok: true });
}));

function createCsvRow(values: Array<string | number>) {
  return values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function markLockedWeeksExported(weekStart: Date, exportedByUserId: string) {
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

app.get("/api/exports/payroll-summary.csv", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const weekStart = parseWeekStart(typeof req.query.weekStart === "string" ? req.query.weekStart : undefined);
  const payload = await buildBootstrap(req.auth!.userId, req.auth!.role, req.auth!.companyId, weekStart);
  await markLockedWeeksExported(weekStart, req.auth!.userId);
  const rows = [
    createCsvRow([
      "Employee",
      "Crew",
      "Status",
      "Regular Hours",
      "Overtime Hours",
      "Gross Pay",
      "Federal Withholding",
      "State Withholding",
      "PFML",
      "Reimbursements",
      "Deductions",
      "Net Check Estimate",
    ]),
    ...payload.employeeWeeks.map((week) =>
      createCsvRow([
        week.employeeName,
        week.crewName,
        week.status,
        week.payrollEstimate.regularHours.toFixed(2),
        week.payrollEstimate.overtimeHours.toFixed(2),
        week.payrollEstimate.grossPay.toFixed(2),
        week.payrollEstimate.federalWithholding.toFixed(2),
        week.payrollEstimate.stateWithholding.toFixed(2),
        week.payrollEstimate.pfmlWithholding.toFixed(2),
        week.payrollEstimate.reimbursements.toFixed(2),
        week.payrollEstimate.deductions.toFixed(2),
        week.payrollEstimate.netCheckEstimate.toFixed(2),
      ]),
    ),
  ];

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="payroll-summary-${payload.weekStart}.csv"`);
  res.send(rows.join("\n"));
}));

app.get("/api/exports/time-detail.csv", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const weekStart = parseWeekStart(typeof req.query.weekStart === "string" ? req.query.weekStart : undefined);
  const payload = await buildBootstrap(req.auth!.userId, req.auth!.role, req.auth!.companyId, weekStart);
  await markLockedWeeksExported(weekStart, req.auth!.userId);
  const rows = [
    createCsvRow(["Employee", "Crew", "Date", "Start", "End", "Lunch Minutes", "Hours", "Job Tag", "Daily Confirmed"]),
  ];

  for (const week of payload.employeeWeeks) {
    for (const entry of week.entries) {
      rows.push(
        createCsvRow([
          week.employeeName,
          week.crewName,
          entry.date,
          entry.start,
          entry.end,
          entry.lunchMinutes,
          entry.totalHours.toFixed(2),
          entry.jobTag ?? "",
          entry.employeeConfirmed ? "yes" : "no",
        ]),
      );
    }
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="time-detail-${payload.weekStart}.csv"`);
  res.send(rows.join("\n"));
}));

app.get("/api/exports/qbo-preview.json", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const weekStart = parseWeekStart(typeof req.query.weekStart === "string" ? req.query.weekStart : undefined);
  const companyId = req.auth!.companyId;

  const timesheets = await prisma.timesheetWeek.findMany({
    where: { weekStartDate: weekStart, employee: { companyId } },
    include: {
      employee: true,
      dayEntries: { orderBy: { dayIndex: "asc" } },
    },
  });

  const warnings: string[] = [];
  const errors: string[] = [];

  let totalMinutes = 0;
  let employeeSet = new Set<string>();

  for (const ts of timesheets) {
    if (ts.status !== "OFFICE_LOCKED") {
      warnings.push(`${ts.employee.displayName} — week not locked (status: ${ts.status})`);
    }
    for (const day of ts.dayEntries) {
      if (day.totalMinutes > 0) {
        totalMinutes += day.totalMinutes;
        employeeSet.add(ts.employeeId);
      }
    }
  }

  const totalHours = totalMinutes / 60;

  if (timesheets.length === 0) {
    errors.push("No timesheets found for this week.");
  }

  res.json({
    weekStart: formatIsoDate(weekStart),
    totalEmployees: employeeSet.size,
    totalHours: Math.round(totalHours * 100) / 100,
    warnings,
    errors,
    isReady: errors.length === 0,
  });
}));

app.get("/api/exports/qbo.csv", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const weekStart = parseWeekStart(typeof req.query.weekStart === "string" ? req.query.weekStart : undefined);
  const companyId = req.auth!.companyId;
  const exportedByUserId = req.auth!.userId;

  const timesheets = await prisma.timesheetWeek.findMany({
    where: { weekStartDate: weekStart, employee: { companyId } },
    include: {
      employee: true,
      crew: true,
      dayEntries: { orderBy: { dayIndex: "asc" } },
    },
    orderBy: [{ crew: { name: "asc" } }, { employee: { displayName: "asc" } }],
  });

  const rows = [createCsvRow(["NAME", "TXNDATE", "TIME", "CUSTOMER", "SERVICEITEM", "DESCRIPTION"])];
  let totalMinutes = 0;

  for (const ts of timesheets) {
    for (const day of ts.dayEntries) {
      if (day.totalMinutes <= 0) continue;
      const hours = day.totalMinutes / 60;
      const date = new Date(day.workDate);
      const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(date.getUTCDate()).padStart(2, "0");
      const yyyy = date.getUTCFullYear();
      const txnDate = `${dd}/${mm}/${yyyy}`;
      const customer = ts.crew.name;
      const serviceItem = "Services";
      const description = day.jobTag ?? "";
      rows.push(createCsvRow([ts.employee.displayName, txnDate, hours.toFixed(2), customer, serviceItem, description]));
      totalMinutes += day.totalMinutes;
    }
  }

  const totalHours = totalMinutes / 60;
  const fileName = `qbo-time-${formatIsoDate(weekStart)}.csv`;

  await prisma.payrollExport.create({
    data: {
      companyId,
      weekStart: formatIsoDate(weekStart),
      exportKind: "qbo",
      totalRows: rows.length - 1,
      totalHours: Math.round(totalHours * 100) / 100,
      fileName,
      exportedByUserId,
    },
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.send(rows.join("\n"));
}));

app.post("/api/reminders/send-sms", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }
  const body = req.body as { employeeIds?: unknown };
  const ids = Array.isArray(body.employeeIds) ? (body.employeeIds as string[]) : [];
  // Stub — log intent; wire Twilio here in Phase 2
  console.log(`[SMS stub] would send reminders to ${ids.length} employees:`, ids);
  res.json({ count: ids.length, sent: true });
}));

app.get("/api/exports/history", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const companyId = req.auth!.companyId;

  const exports = await prisma.payrollExport.findMany({
    where: { companyId },
    include: {
      exportedByUser: { select: { id: true, fullName: true } },
    },
    orderBy: { exportedAt: "desc" },
    take: 50,
  });

  res.json({
    exports: exports.map((e) => ({
      id: e.id,
      weekStart: e.weekStart,
      exportKind: e.exportKind,
      totalRows: e.totalRows,
      totalHours: e.totalHours,
      fileName: e.fileName,
      exportedAt: e.exportedAt.toISOString(),
      exportedBy: e.exportedByUser.fullName,
    })),
  });
}));

app.get("/api/exports/weekly-summary", authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!authorizeAdmin(req, res)) {
    return;
  }

  const weekStart = parseWeekStart(typeof req.query.weekStart === "string" ? req.query.weekStart : undefined);
  const payload = await buildBootstrap(req.auth!.userId, req.auth!.role, req.auth!.companyId, weekStart);
  await markLockedWeeksExported(weekStart, req.auth!.userId);
  const payrollReminder = payload.companySettings?.payrollReminder ?? EXPORT_REMINDER;
  const cards = payload.employeeWeeks
    .map(
      (week) => `
      <section class="card">
        <header>
          <div>
            <h2>${escapeHtml(week.employeeName)}</h2>
            <p>${escapeHtml(week.crewName)} - ${escapeHtml(week.status.replace(/_/g, " "))}</p>
          </div>
          <div class="check-estimate">
            <span>Final check estimate</span>
            <strong>$${week.payrollEstimate.netCheckEstimate.toFixed(2)}</strong>
          </div>
        </header>
        <table>
          <thead>
            <tr><th>Day</th><th>Start</th><th>End</th><th>Lunch</th><th>Hours</th><th>Tag</th></tr>
          </thead>
          <tbody>
            ${week.entries
              .map(
                (entry) => `
                  <tr>
                    <td>${escapeHtml(entry.dayLabel)}</td>
                    <td>${escapeHtml(entry.start || "--")}</td>
                    <td>${escapeHtml(entry.end || "--")}</td>
                    <td>${entry.lunchMinutes}</td>
                    <td>${entry.totalHours.toFixed(2)}</td>
                    <td>${escapeHtml(entry.jobTag ?? "")}</td>
                  </tr>`,
              )
              .join("")}
          </tbody>
        </table>
        <div class="summary-grid">
          <div><span>Regular hours</span><strong>${week.payrollEstimate.regularHours.toFixed(2)}</strong></div>
          <div><span>Overtime hours</span><strong>${week.payrollEstimate.overtimeHours.toFixed(2)}</strong></div>
          <div><span>Gross pay</span><strong>$${week.payrollEstimate.grossPay.toFixed(2)}</strong></div>
          <div><span>Federal withholding</span><strong>$${week.payrollEstimate.federalWithholding.toFixed(2)}</strong></div>
          <div><span>State withholding</span><strong>$${week.payrollEstimate.stateWithholding.toFixed(2)}</strong></div>
          ${
            week.payrollEstimate.pfmlWithholding > 0
              ? `<div><span>PFML</span><strong>$${week.payrollEstimate.pfmlWithholding.toFixed(2)}</strong></div>`
              : ""
          }
          <div><span>Reimbursements</span><strong>$${week.payrollEstimate.reimbursements.toFixed(2)}</strong></div>
          <div><span>Deductions</span><strong>$${week.payrollEstimate.deductions.toFixed(2)}</strong></div>
          <div class="summary-grid__main"><span>Net check estimate</span><strong>$${week.payrollEstimate.netCheckEstimate.toFixed(2)}</strong></div>
        </div>
      </section>`,
    )
    .join("");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Weekly Summary ${payload.weekStart}</title>
        <style>
          :root { color-scheme: light; }
          * { box-sizing: border-box; }
          body { font-family: Inter, Arial, sans-serif; margin: 28px; color: #1d2430; background: #f5f7fb; }
          h1 { margin: 0 0 8px; font-size: 32px; }
          .subhead { color: #5f6f86; margin-bottom: 24px; }
          .card { background: #fff; border: 1px solid #ccd5e4; border-radius: 18px; padding: 18px; margin-bottom: 18px; break-inside: avoid; box-shadow: 0 10px 24px rgba(18, 33, 58, 0.06); }
          header { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
          header p { color: #5f6f86; margin: 4px 0 0; text-transform: capitalize; }
          h2 { margin: 0; font-size: 22px; }
          .check-estimate { background: linear-gradient(180deg, #eaf4ff 0%, #f7fbff 100%); border: 1px solid #cfe0ff; border-radius: 16px; min-width: 220px; padding: 12px 14px; }
          .check-estimate span { color: #45628b; display: block; font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
          .check-estimate strong { color: #163e84; display: block; font-size: 26px; margin-top: 6px; }
          table { border-collapse: collapse; width: 100%; margin-top: 14px; }
          th, td { border-bottom: 1px solid #e4e8f0; padding: 8px; text-align: left; font-size: 14px; }
          th { color: #5f6f86; font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; }
          .summary-grid { display: grid; gap: 10px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 14px; }
          .summary-grid div { background: #f8fafe; border: 1px solid #e4e8f0; border-radius: 14px; padding: 10px 12px; }
          .summary-grid span { color: #5f6f86; display: block; font-size: 12px; }
          .summary-grid strong { display: block; font-size: 18px; margin-top: 4px; }
          .summary-grid__main { background: #edf5ff !important; border-color: #cfe0ff !important; }
          .summary-grid__main strong { color: #163e84; font-size: 22px; }
          @media print { body { background: #fff; margin: 14px; } .card { box-shadow: none; } }
        </style>
      </head>
      <body>
        <h1>Weekly Summary - ${payload.weekStart}</h1>
        <p class="subhead">Printable office handoff with the same payroll-prep totals shown in the dashboard.</p>
        <p class="subhead"><strong>${escapeHtml(payrollReminder)}</strong></p>
        ${
          payload.companySettings && payload.companySettings.supportLevel !== "full"
            ? `<p class="subhead">${escapeHtml(payload.companySettings.stateDisclaimer)}</p>`
            : ""
        }
        ${cards}
      </body>
    </html>`);
}));

if (sentryEnabled) {
  Sentry.setupExpressErrorHandler(app);
}

export function startServer(listenPort = port) {
  return app.listen(listenPort, () => {
    console.log(`Crew Timecard API listening on http://localhost:${listenPort}`);
  });
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entryUrl) {
  startServer();
}

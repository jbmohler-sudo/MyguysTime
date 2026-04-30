/**
 * Static demo data — zero Supabase, zero writes.
 * Used by /demo/admin, /demo/foreman, /demo/employee routes on the public homepage.
 * All data is fictional. Safe to show to anyone.
 */

import type { BootstrapPayload } from "../domain/models";

const WEEK_START = "2026-04-21";

// ─── Shared building blocks ──────────────────────────────────────────────────

const CREWS = [
  {
    id: "crew-masonry",
    name: "Masonry Crew",
    foremanName: "Carlos Mendoza",
    dayDefaults: [
      { dayIndex: 0, start: "07:00", end: "15:30" },
      { dayIndex: 1, start: "07:00", end: "15:30" },
      { dayIndex: 2, start: "07:00", end: "15:30" },
      { dayIndex: 3, start: "07:00", end: "15:30" },
      { dayIndex: 4, start: "07:00", end: "15:30" },
    ],
  },
  {
    id: "crew-framing",
    name: "Framing Crew",
    foremanName: "Mike Torres",
    dayDefaults: [
      { dayIndex: 0, start: "06:30", end: "15:00" },
      { dayIndex: 1, start: "06:30", end: "15:00" },
      { dayIndex: 2, start: "06:30", end: "15:00" },
      { dayIndex: 3, start: "06:30", end: "15:00" },
      { dayIndex: 4, start: "06:30", end: "15:00" },
    ],
  },
];

function makeDays(
  timesheetId: string,
  weekStart: string,
  entries: Array<{ start: string; end: string; confirmed: boolean } | null>
) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const base = new Date(weekStart + "T00:00:00");

  return labels.map((label, i) => {
    const date = new Date(base);
    date.setDate(base.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    const entry = entries[i] ?? null;

    const start = entry?.start ?? "";
    const end = entry?.end ?? "";
    let totalHours = 0;
    if (start && end) {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      totalHours = Math.max(0, (eh * 60 + em - (sh * 60 + sm) - 30) / 60);
    }

    return {
      id: `${timesheetId}-day-${i}`,
      dayIndex: i,
      dayLabel: label,
      date: dateStr,
      start,
      end,
      lunchMinutes: start && end ? 30 : 0,
      totalHours,
      jobTag: null,
      employeeConfirmed: entry?.confirmed ?? false,
    };
  });
}

function grossPay(entries: ReturnType<typeof makeDays>, rate: number) {
  return entries.reduce((sum, d) => sum + d.totalHours * rate, 0);
}

const COMPANY_SETTINGS = {
  id: "demo-company",
  companyName: "ABC Contracting Co.",
  ownerName: "Jeff Mohler",
  weekStartDay: 1,
  companyState: "PA",
  stateName: "Pennsylvania",
  supportLevel: "full" as const,
  defaultFederalWithholdingMode: "percentage",
  defaultFederalWithholdingValue: 0.08,
  defaultStateWithholdingMode: "percentage",
  defaultStateWithholdingValue: 0.0307,
  pfmlEnabled: false,
  pfmlEmployeeRate: 0,
  extraWithholdingLabel: "",
  extraWithholdingRate: 0,
  hasStateIncomeTax: true,
  hasExtraEmployeeWithholdings: false,
  supportedLines: ["Federal", "Pennsylvania"],
  timeTrackingStyle: "foreman" as const,
  defaultLunchMinutes: 30,
  payType: "hourly" as const,
  payrollMethod: "manual" as const,
  trackExpenses: true,
  payrollPrepDisclaimer: "Estimates only — verify before issuing checks.",
  stateDisclaimer: "",
  payrollReminder: "Estimates only — verify before issuing checks.",
  disclaimerAcceptedAt: "2026-01-01T00:00:00Z",
  disclaimerAcceptedByUserId: "demo-admin",
  disclaimerVersion: "1",
  setupComplete: true,
  lastReviewedAt: "2026-04-01T00:00:00Z",
  sourceLabel: "PA DOR",
  sourceUrl: "https://www.revenue.pa.gov",
};

function makeEstimate(gross: number, reimb = 0, deduction = 0) {
  const federal = gross * 0.08;
  const state = gross * 0.0307;
  return {
    regularHours: gross / 36,
    overtimeHours: 0,
    grossPay: gross,
    federalWithholding: federal,
    w4NotOnFile: false,
    stateWithholding: state,
    pfmlWithholding: 0,
    extraStateWithholdingLabel: "",
    extraStateWithholding: 0,
    reimbursements: reimb,
    deductions: deduction,
    netCheckEstimate: gross - federal - state + reimb - deduction,
  };
}

function makeYtd(workerType: "employee" | "contractor_1099", grossPayments: number) {
  return {
    calendarYear: 2026,
    workerType,
    grossPayments,
    reimbursements: 220,
    deductions: 0,
    netEstimate: grossPayments * 0.885,
  };
}

const NO_AUDIT: never[] = [];

// ─── Demo employee weeks ──────────────────────────────────────────────────────

const CARLOS_DAYS = makeDays("ts-carlos", WEEK_START, [
  { start: "07:00", end: "15:30", confirmed: true },
  { start: "07:00", end: "15:30", confirmed: true },
  { start: "07:00", end: "15:30", confirmed: true },
  { start: "07:00", end: "15:30", confirmed: true },
  { start: "07:00", end: "15:30", confirmed: true },
  null,
  null,
]);

const MIKE_DAYS = makeDays("ts-mike", WEEK_START, [
  { start: "06:30", end: "15:00", confirmed: true },
  { start: "06:30", end: "15:00", confirmed: true },
  { start: "06:30", end: "15:00", confirmed: true },
  { start: "06:30", end: "15:00", confirmed: true },
  { start: "06:30", end: "15:00", confirmed: false },
  null,
  null,
]);

const DARIUS_DAYS = makeDays("ts-darius", WEEK_START, [
  { start: "07:00", end: "15:30", confirmed: true },
  { start: "07:00", end: "15:30", confirmed: true },
  { start: "07:00", end: "15:30", confirmed: false },
  null,
  null,
  null,
  null,
]);

const ROBERTO_DAYS = makeDays("ts-roberto", WEEK_START, [
  { start: "07:00", end: "15:30", confirmed: true },
  { start: "07:00", end: "15:30", confirmed: false },
  null,
  null,
  null,
  null,
  null,
]);

const EMPLOYEE_WEEKS = [
  {
    id: "ts-carlos",
    employeeId: "emp-carlos",
    employeeName: "Carlos Mendoza",
    workerType: "employee" as const,
    crewId: "crew-masonry",
    crewName: "Masonry Crew",
    hourlyRate: 36,
    federalFilingStatus: "single" as const,
    w4Step3Amount: 0,
    w4CollectedAt: "2026-01-05T00:00:00Z",
    status: "foreman_approved" as const,
    entries: CARLOS_DAYS,
    weeklyTotalHours: CARLOS_DAYS.reduce((s, d) => s + d.totalHours, 0),
    overtimeHours: 0,
    grossPay: grossPay(CARLOS_DAYS, 36),
    confirmedDays: 5,
    missingConfirmationDays: 0,
    adjustment: { gasReimbursement: 46, pettyCashReimbursement: 0, deductionAdvance: 0, notes: "" },
    expenseSubmissions: [],
    payrollEstimate: makeEstimate(grossPay(CARLOS_DAYS, 36), 46),
    ytdSummary: makeYtd("employee", 21060),
    exportedAt: null,
    exportedByFullName: null,
    statusAuditTrail: NO_AUDIT,
  },
  {
    id: "ts-mike",
    employeeId: "emp-mike",
    employeeName: "Mike Torres",
    workerType: "contractor_1099" as const,
    crewId: "crew-framing",
    crewName: "Framing Crew",
    hourlyRate: 23,
    federalFilingStatus: "single" as const,
    w4Step3Amount: 0,
    w4CollectedAt: "2026-01-05T00:00:00Z",
    status: "employee_confirmed" as const,
    entries: MIKE_DAYS,
    weeklyTotalHours: MIKE_DAYS.reduce((s, d) => s + d.totalHours, 0),
    overtimeHours: 0,
    grossPay: grossPay(MIKE_DAYS, 23),
    confirmedDays: 4,
    missingConfirmationDays: 1,
    adjustment: { gasReimbursement: 0, pettyCashReimbursement: 0, deductionAdvance: 0, notes: "" },
    expenseSubmissions: [],
    payrollEstimate: makeEstimate(grossPay(MIKE_DAYS, 23)),
    ytdSummary: makeYtd("contractor_1099", 14320),
    exportedAt: null,
    exportedByFullName: null,
    statusAuditTrail: NO_AUDIT,
  },
  {
    id: "ts-darius",
    employeeId: "emp-darius",
    employeeName: "Darius Washington",
    workerType: "employee" as const,
    crewId: "crew-masonry",
    crewName: "Masonry Crew",
    hourlyRate: 32,
    federalFilingStatus: "single" as const,
    w4Step3Amount: 0,
    w4CollectedAt: null,
    status: "draft" as const,
    entries: DARIUS_DAYS,
    weeklyTotalHours: DARIUS_DAYS.reduce((s, d) => s + d.totalHours, 0),
    overtimeHours: 0,
    grossPay: grossPay(DARIUS_DAYS, 32),
    confirmedDays: 1,
    missingConfirmationDays: 2,
    adjustment: { gasReimbursement: 0, pettyCashReimbursement: 0, deductionAdvance: 0, notes: "" },
    expenseSubmissions: [],
    payrollEstimate: makeEstimate(grossPay(DARIUS_DAYS, 32)),
    ytdSummary: makeYtd("employee", 17784),
    exportedAt: null,
    exportedByFullName: null,
    statusAuditTrail: NO_AUDIT,
  },
  {
    id: "ts-roberto",
    employeeId: "emp-roberto",
    employeeName: "Roberto Vargas",
    workerType: "employee" as const,
    crewId: "crew-masonry",
    crewName: "Masonry Crew",
    hourlyRate: 28,
    federalFilingStatus: "single" as const,
    w4Step3Amount: 0,
    w4CollectedAt: null,
    status: "draft" as const,
    entries: ROBERTO_DAYS,
    weeklyTotalHours: ROBERTO_DAYS.reduce((s, d) => s + d.totalHours, 0),
    overtimeHours: 0,
    grossPay: grossPay(ROBERTO_DAYS, 28),
    confirmedDays: 1,
    missingConfirmationDays: 1,
    adjustment: { gasReimbursement: 0, pettyCashReimbursement: 0, deductionAdvance: 0, notes: "" },
    expenseSubmissions: [],
    payrollEstimate: makeEstimate(grossPay(ROBERTO_DAYS, 28)),
    ytdSummary: makeYtd("employee", 9800),
    exportedAt: null,
    exportedByFullName: null,
    statusAuditTrail: NO_AUDIT,
  },
];

// ─── Role-specific payloads ───────────────────────────────────────────────────

export const DEMO_ADMIN_PAYLOAD: BootstrapPayload = {
  viewer: {
    id: "demo-admin",
    fullName: "Jeff Mohler",
    role: "admin",
    employeeId: null,
    preferredView: "office",
  },
  weekStart: WEEK_START,
  companySettings: COMPANY_SETTINGS,
  stateRules: [],
  crews: [...CREWS],
  employeeWeeks: EMPLOYEE_WEEKS,
  privateReports: [],
  archivedEmployees: [],
};

export const DEMO_FOREMAN_PAYLOAD: BootstrapPayload = {
  viewer: {
    id: "demo-foreman",
    fullName: "Carlos Mendoza",
    role: "foreman",
    employeeId: "emp-carlos",
    preferredView: "truck",
  },
  weekStart: WEEK_START,
  companySettings: COMPANY_SETTINGS,
  stateRules: [],
  crews: [CREWS[0]],
  // Foreman only sees their own crew
  employeeWeeks: EMPLOYEE_WEEKS.filter((w) => w.crewId === "crew-masonry"),
  privateReports: [],
  archivedEmployees: [],
};

export const DEMO_EMPLOYEE_PAYLOAD: BootstrapPayload = {
  viewer: {
    id: "demo-employee",
    fullName: "Darius Washington",
    role: "employee",
    employeeId: "emp-darius",
    preferredView: "truck",
  },
  weekStart: WEEK_START,
  companySettings: null,
  stateRules: [],
  crews: [CREWS[0]],
  // Employee only sees their own timesheet
  employeeWeeks: EMPLOYEE_WEEKS.filter((w) => w.employeeId === "emp-darius"),
  privateReports: [],
  archivedEmployees: [],
};

export type DemoRole = "admin" | "foreman" | "employee";

export function getDemoPayload(role: DemoRole): BootstrapPayload {
  if (role === "admin") return DEMO_ADMIN_PAYLOAD;
  if (role === "foreman") return DEMO_FOREMAN_PAYLOAD;
  return DEMO_EMPLOYEE_PAYLOAD;
}

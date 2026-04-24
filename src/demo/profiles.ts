import type { BootstrapPayload, DayEntry, EmployeeWeek, TimesheetStatus, UserRole } from "../domain/models";

const WEEK_START = "2026-04-20";
const PAYROLL_PREP_DISCLAIMER = `Important: Payroll Estimates

This app is designed to help you track hours and estimate pay and withholdings.
It is not a payroll service and does not guarantee full tax compliance.

While we strive to provide accurate calculations, tax rates and rules vary by state and may change.
Please review all numbers and confirm with your accountant or official state resources before issuing payments.

By continuing, you acknowledge that you are responsible for verifying payroll amounts.`;

function day(id: string, dayIndex: number, date: string, dayLabel: string, start: string, end: string, totalHours: number, employeeConfirmed: boolean, jobTag = "") : DayEntry {
  return {
    id,
    dayIndex,
    dayLabel,
    date,
    start,
    end,
    lunchMinutes: totalHours > 0 ? 30 : 0,
    totalHours,
    jobTag,
    employeeConfirmed,
  };
}

function week(input: {
  id: string;
  employeeId: string;
  employeeName: string;
  crewId: string;
  crewName: string;
  hourlyRate: number;
  status: TimesheetStatus;
  entries: DayEntry[];
  netCheckEstimate: number;
  createdByFullName: string;
  notes?: string;
}): EmployeeWeek {
  const weeklyTotalHours = Number(input.entries.reduce((sum, entry) => sum + entry.totalHours, 0).toFixed(2));
  const grossPay = Number((weeklyTotalHours * input.hourlyRate).toFixed(2));
  const federalWithholding = Number((grossPay * 0.11).toFixed(2));
  const stateWithholding = Number((grossPay * 0.04).toFixed(2));
  const pfmlWithholding = Number((grossPay * 0.0045).toFixed(2));
  const confirmedDays = input.entries.filter((entry) => entry.employeeConfirmed).length;
  const missingConfirmationDays = input.entries.filter((entry) => entry.totalHours > 0 && !entry.employeeConfirmed).length;

  return {
    id: input.id,
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    workerType: "employee",
    crewId: input.crewId,
    crewName: input.crewName,
    hourlyRate: input.hourlyRate,
    status: input.status,
    entries: input.entries,
    weeklyTotalHours,
    overtimeHours: 0,
    grossPay,
    confirmedDays,
    missingConfirmationDays,
    adjustment: {
      gasReimbursement: 0,
      pettyCashReimbursement: 0,
      deductionAdvance: 0,
      notes: input.notes ?? "",
    },
    payrollEstimate: {
      regularHours: weeklyTotalHours,
      overtimeHours: 0,
      grossPay,
      federalWithholding,
      stateWithholding,
      pfmlWithholding,
      extraStateWithholdingLabel: "PFML",
      extraStateWithholding: 0,
      reimbursements: 0,
      deductions: 0,
      netCheckEstimate: input.netCheckEstimate,
    },
    ytdSummary: {
      calendarYear: 2026,
      workerType: "employee",
      grossPayments: Number((grossPay * 9).toFixed(2)),
      reimbursements: 0,
      deductions: 0,
      netEstimate: Number((input.netCheckEstimate * 9).toFixed(2)),
    },
    exportedAt: null,
    exportedByFullName: null,
    statusAuditTrail: [
      {
        id: `${input.id}-audit-1`,
        fromStatus: "draft",
        toStatus: input.status,
        note: input.notes ?? "Current week in progress.",
        createdAt: "2026-04-22T16:30:00.000Z",
        createdByFullName: input.createdByFullName,
      },
    ],
  };
}

const baseCompanySettings = {
  id: "company-crew-time",
  companyName: "Crew Time Masonry & Roofing",
  ownerName: "Dana Office",
  companyState: "MA",
  stateName: "Massachusetts",
  supportLevel: "full" as const,
  defaultFederalWithholdingMode: "percentage",
  defaultFederalWithholdingValue: 0.1,
  defaultStateWithholdingMode: "percentage",
  defaultStateWithholdingValue: 0.05,
  pfmlEnabled: true,
  pfmlEmployeeRate: 0.0045,
  extraWithholdingLabel: "PFML",
  extraWithholdingRate: 0.0045,
  hasStateIncomeTax: true,
  hasExtraEmployeeWithholdings: true,
  supportedLines: ["Federal withholding estimate", "State withholding estimate", "PFML employee withholding"],
  timeTrackingStyle: "foreman" as const,
  defaultLunchMinutes: 30,
  payType: "hourly_overtime" as const,
  trackExpenses: true,
  payrollPrepDisclaimer: PAYROLL_PREP_DISCLAIMER,
  stateDisclaimer: "Massachusetts payroll-prep support includes PFML shown separately.",
  payrollReminder: "Estimates only - verify before issuing checks.",
  disclaimerAcceptedAt: "2026-04-20T14:00:00.000Z",
  disclaimerAcceptedByUserId: "viewer-admin",
  disclaimerVersion: "2026-04-20-v1",
  setupComplete: true,
  lastReviewedAt: "2026-04-22T09:00:00.000Z",
  sourceLabel: "Massachusetts payroll-prep review",
  sourceUrl: "https://www.mass.gov/",
};

const baseStateRules = [
  {
    stateCode: "MA",
    stateName: "Massachusetts",
    supportLevel: "full" as const,
    hasStateIncomeTax: true,
    hasExtraEmployeeWithholdings: true,
    extraWithholdingTypes: ["PFML"],
    defaultStateWithholdingMode: "percentage",
    defaultStateWithholdingValue: 0.05,
    notes: "Massachusetts payroll-prep support includes PFML shown separately.",
    disclaimerText: "Review all withholding amounts before issuing checks.",
    lastReviewedAt: "2026-04-22T09:00:00.000Z",
    sourceLabel: "Massachusetts payroll-prep review",
    sourceUrl: "https://www.mass.gov/",
    isActive: true,
  },
];

const baseCrews = [
  {
    id: "crew-masonry",
    name: "Masonry Crew",
    foremanName: "Luis Ortega",
    dayDefaults: [
      { dayIndex: 0, start: "07:00", end: "15:30" },
      { dayIndex: 1, start: "07:00", end: "15:30" },
      { dayIndex: 2, start: "07:00", end: "15:30" },
      { dayIndex: 3, start: "07:00", end: "15:30" },
      { dayIndex: 4, start: "07:00", end: "15:30" },
    ],
  },
];

const archivedEmployees = [
  {
    id: "employee-evan",
    displayName: "Evan Brooks",
    crewName: "Roofing Crew",
    archiveReason: "Seasonal layoff",
    archiveNotes: "Eligible for rehire when residential roofing volume returns.",
  },
];


const privateReports = [
  {
    id: "report-marco",
    employeeId: "employee-marco",
    employeeName: "Marco Diaz",
    crewName: "Masonry Crew",
    date: "2026-04-22",
    jobTag: "Dock wall",
    category: "Attendance",
    severity: "Medium",
    factualDescription: "Left site early to pick up additional mortar without notifying office.",
    followUpStatus: "open" as const,
  },
];

const marcoWeek = week({
  id: "week-marco",
  employeeId: "employee-marco",
  employeeName: "Marco Diaz",
  crewId: "crew-masonry",
  crewName: "Masonry Crew",
  hourlyRate: 29,
  status: "draft",
  createdByFullName: "Luis Ortega",
  notes: "Needs confirmation before week can move forward.",
  netCheckEstimate: 914.28,
  entries: [
    day("marco-mon", 0, "2026-04-20", "Mon", "07:00", "15:30", 8, false, "Dock wall"),
    day("marco-tue", 1, "2026-04-21", "Tue", "07:00", "15:30", 8, false, "Dock wall"),
    day("marco-wed", 2, "2026-04-22", "Wed", "07:00", "15:30", 8, false, "Dock wall"),
    day("marco-thu", 3, "2026-04-23", "Thu", "07:00", "15:30", 8, false, "Dock wall"),
    day("marco-fri", 4, "2026-04-24", "Fri", "07:00", "15:30", 8, false, "Dock wall"),
    day("marco-sat", 5, "2026-04-25", "Sat", "", "", 0, false),
    day("marco-sun", 6, "2026-04-26", "Sun", "", "", 0, false),
  ],
});

const luisWeek = week({
  id: "week-luis",
  employeeId: "employee-luis",
  employeeName: "Luis Ortega",
  crewId: "crew-masonry",
  crewName: "Masonry Crew",
  hourlyRate: 34,
  status: "foreman_approved",
  createdByFullName: "Dana Office",
  notes: "Foreman review complete.",
  netCheckEstimate: 1068.66,
  entries: [
    day("luis-mon", 0, "2026-04-20", "Mon", "07:00", "15:30", 8, true, "Dock wall"),
    day("luis-tue", 1, "2026-04-21", "Tue", "07:00", "15:30", 8, true, "Dock wall"),
    day("luis-wed", 2, "2026-04-22", "Wed", "07:00", "15:30", 8, true, "Dock wall"),
    day("luis-thu", 3, "2026-04-23", "Thu", "07:00", "15:30", 8, true, "Dock wall"),
    day("luis-fri", 4, "2026-04-24", "Fri", "07:00", "15:30", 8, true, "Dock wall"),
    day("luis-sat", 5, "2026-04-25", "Sat", "", "", 0, true),
    day("luis-sun", 6, "2026-04-26", "Sun", "", "", 0, true),
  ],
});

const troyWeek = week({
  id: "week-troy",
  employeeId: "employee-troy",
  employeeName: "Troy Bennett",
  crewId: "crew-masonry",
  crewName: "Masonry Crew",
  hourlyRate: 23,
  status: "employee_confirmed",
  createdByFullName: "Troy Bennett",
  notes: "Employee confirmed and waiting on foreman review.",
  netCheckEstimate: 725.84,
  entries: [
    day("troy-mon", 0, "2026-04-20", "Mon", "07:00", "15:30", 8, true, "Chimney rebuild"),
    day("troy-tue", 1, "2026-04-21", "Tue", "07:00", "15:30", 8, true, "Chimney rebuild"),
    day("troy-wed", 2, "2026-04-22", "Wed", "07:00", "15:30", 8, true, "Chimney rebuild"),
    day("troy-thu", 3, "2026-04-23", "Thu", "07:00", "15:30", 8, true, "Chimney rebuild"),
    day("troy-fri", 4, "2026-04-24", "Fri", "07:00", "13:30", 6, true, "Chimney rebuild"),
    day("troy-sat", 5, "2026-04-25", "Sat", "", "", 0, true),
    day("troy-sun", 6, "2026-04-26", "Sun", "", "", 0, true),
  ],
});

const viewers: Record<"admin" | "foreman" | "employee", { id: string; fullName: string; role: UserRole; employeeId: string | null }> = {
  admin: { id: "viewer-admin", fullName: "Dana Office", role: "admin", employeeId: null },
  foreman: { id: "viewer-foreman", fullName: "Luis Ortega", role: "foreman", employeeId: "employee-luis" },
  employee: { id: "viewer-employee", fullName: "Marco Diaz", role: "employee", employeeId: "employee-marco" },
};

export function getDemoProfile(role: "admin" | "foreman" | "employee"): BootstrapPayload {
  if (role === "admin") {
    return {
      viewer: viewers.admin,
      weekStart: WEEK_START,
      companySettings: baseCompanySettings,
      stateRules: baseStateRules,
      crews: baseCrews,
      employeeWeeks: [marcoWeek, luisWeek, troyWeek],
      privateReports: privateReports,
      archivedEmployees,
    };
  }

  if (role === "foreman") {
    return {
      viewer: viewers.foreman,
      weekStart: WEEK_START,
      companySettings: baseCompanySettings,
      stateRules: baseStateRules,
      crews: baseCrews,
      employeeWeeks: [marcoWeek, luisWeek, troyWeek],
      privateReports,
      archivedEmployees: [],
    };
  }

  return {
    viewer: viewers.employee,
    weekStart: WEEK_START,
    companySettings: baseCompanySettings,
    stateRules: baseStateRules,
    crews: baseCrews,
    employeeWeeks: [marcoWeek],
    privateReports: [],
    archivedEmployees: [],
  };
}

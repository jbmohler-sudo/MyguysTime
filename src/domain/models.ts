export type UserRole = "admin" | "foreman" | "employee";

export type TimesheetStatus =
  | "draft"
  | "needs_revision"
  | "employee_confirmed"
  | "foreman_approved"
  | "office_locked";

export type FollowUpStatus = "open" | "reviewed" | "resolved";

export interface Viewer {
  id: string;
  fullName: string;
  role: UserRole;
  employeeId: string | null;
}

export interface CrewDayDefault {
  dayIndex: number;
  start: string;
  end: string;
}

export interface CrewSummary {
  id: string;
  name: string;
  foremanName: string;
  dayDefaults: CrewDayDefault[];
}

export interface DayEntry {
  id: string;
  dayIndex: number;
  dayLabel: string;
  date: string;
  start: string;
  end: string;
  lunchMinutes: number;
  totalHours: number;
  jobTag?: string | null;
  employeeConfirmed: boolean;
}

export interface AdjustmentSummary {
  gasReimbursement: number;
  pettyCashReimbursement: number;
  deductionAdvance: number;
  notes: string;
}

export interface StatusAuditEntry {
  id: string;
  fromStatus: TimesheetStatus;
  toStatus: TimesheetStatus;
  note: string;
  createdAt: string;
  createdByFullName: string;
}

export interface PayrollEstimateSummary {
  regularHours: number;
  overtimeHours: number;
  grossPay: number;
  federalWithholding: number;
  stateWithholding: number;
  pfmlWithholding: number;
  extraStateWithholdingLabel: string;
  extraStateWithholding: number;
  reimbursements: number;
  deductions: number;
  netCheckEstimate: number;
}

export interface EmployeeWeek {
  id: string;
  employeeId: string;
  employeeName: string;
  crewId: string;
  crewName: string;
  hourlyRate: number | null;
  status: TimesheetStatus;
  entries: DayEntry[];
  weeklyTotalHours: number;
  overtimeHours: number;
  grossPay: number;
  confirmedDays: number;
  missingConfirmationDays: number;
  adjustment: AdjustmentSummary;
  payrollEstimate: PayrollEstimateSummary;
  exportedAt: string | null;
  exportedByFullName: string | null;
  statusAuditTrail: StatusAuditEntry[];
}

export interface PrivateReport {
  id: string;
  employeeId: string;
  employeeName: string;
  crewName: string;
  date: string;
  jobTag?: string | null;
  category: string;
  severity: string;
  factualDescription: string;
  followUpStatus: FollowUpStatus;
}

export interface ArchivedEmployee {
  id: string;
  displayName: string;
  crewName: string;
  archiveReason: string;
  archiveNotes: string;
}

export interface CompanySettingsSummary {
  id: string;
  companyName: string;
  companyState: string;
  stateName: string;
  supportLevel: "full" | "partial_manual" | "unsupported";
  defaultFederalWithholdingMode: string;
  defaultFederalWithholdingValue: number;
  defaultStateWithholdingMode: string;
  defaultStateWithholdingValue: number;
  pfmlEnabled: boolean;
  pfmlEmployeeRate: number;
  extraWithholdingLabel: string;
  extraWithholdingRate: number;
  hasStateIncomeTax: boolean;
  hasExtraEmployeeWithholdings: boolean;
  supportedLines: string[];
  payrollPrepDisclaimer: string;
  stateDisclaimer: string;
  payrollReminder: string;
  disclaimerAcceptedAt: string | null;
  disclaimerAcceptedByUserId: string | null;
  disclaimerVersion: string | null;
  setupComplete: boolean;
  lastReviewedAt: string | null;
  sourceLabel: string;
  sourceUrl: string;
}

export interface StateRuleSummary {
  stateCode: string;
  stateName: string;
  supportLevel: "full" | "partial_manual" | "unsupported";
  hasStateIncomeTax: boolean;
  hasExtraEmployeeWithholdings: boolean;
  extraWithholdingTypes: string[];
  defaultStateWithholdingMode: string;
  defaultStateWithholdingValue: number;
  notes: string;
  disclaimerText: string;
  lastReviewedAt: string | null;
  sourceLabel: string;
  sourceUrl: string;
  isActive: boolean;
}

export interface BootstrapPayload {
  viewer: Viewer;
  weekStart: string;
  companySettings: CompanySettingsSummary | null;
  stateRules: StateRuleSummary[];
  crews: CrewSummary[];
  employeeWeeks: EmployeeWeek[];
  privateReports: PrivateReport[];
  archivedEmployees: ArchivedEmployee[];
}

export interface PrivateReportInput {
  employeeId: string;
  crewId: string;
  date: string;
  jobTag?: string;
  category: string;
  severity: string;
  factualDescription: string;
}

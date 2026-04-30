export type UserRole = "admin" | "foreman" | "employee";
export type WorkerType = "employee" | "contractor_1099";
export type TimeTrackingStyle = "foreman" | "worker_self_entry" | "mixed";
export type PayType = "hourly" | "hourly_overtime";
export type PayrollMethod = "service" | "manual" | "mixed";
export type FederalFilingStatus = "single" | "married_jointly" | "head_of_household";

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
  preferredView: "office" | "truck";
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

export interface ExpenseSubmissionSummary {
  id: string;
  category: string;
  amount: number;
  note: string;
  hasReceipt: boolean;
  submittedAt: string;
  submittedByFullName: string;
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
  w4NotOnFile: boolean;
  stateWithholding: number;
  pfmlWithholding: number;
  extraStateWithholdingLabel: string;
  extraStateWithholding: number;
  reimbursements: number;
  deductions: number;
  netCheckEstimate: number;
}

export interface YtdPayrollSummary {
  calendarYear: number;
  workerType: WorkerType;
  grossPayments: number;
  reimbursements: number;
  deductions: number;
  netEstimate: number;
}

export interface EmployeeWeek {
  id: string;
  employeeId: string;
  employeeName: string;
  workerType: WorkerType;
  crewId: string;
  crewName: string;
  hourlyRate: number | null;
  federalFilingStatus: FederalFilingStatus;
  w4Step3Amount: number;
  w4CollectedAt: string | null;
  status: TimesheetStatus;
  entries: DayEntry[];
  weeklyTotalHours: number;
  overtimeHours: number;
  grossPay: number;
  confirmedDays: number;
  missingConfirmationDays: number;
  adjustment: AdjustmentSummary;
  expenseSubmissions: ExpenseSubmissionSummary[];
  payrollEstimate: PayrollEstimateSummary;
  ytdSummary: YtdPayrollSummary;
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

export interface ManagedEmployee {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  workerType: WorkerType;
  hourlyRate: number;
  federalFilingStatus: FederalFilingStatus;
  w4Step3Amount: number;
  w4CollectedAt: string | null;
  active: boolean;
  defaultCrewId: string | null;
  defaultCrewName: string | null;
  hasLoginAccess: boolean;
  inviteStatus?: "active" | "pending" | "inactive";
  invitedAt?: string | null;
}

export interface InviteSummary {
  id: string;
  employeeId: string | null;
  employeeName: string | null;
  email: string;
  role: "foreman" | "employee";
  acceptedAt: string | null;
  expiresAt: string;
  createdAt: string;
  invitedByFullName: string;
  status: "pending" | "accepted" | "expired";
}

export interface InviteInput {
  employeeId?: string | null;
  email: string;
  role: "foreman" | "employee";
  crewId?: string | null;
  hourlyRate?: number;
}

export interface EmployeeInput {
  firstName: string;
  lastName: string;
  displayName: string;
  workerType: "employee" | "contractor_1099";
  hourlyRate: number;
  federalFilingStatus?: FederalFilingStatus;
  w4Step3Amount?: number;
  w4CollectedAt?: string | null;
  defaultCrewId?: string | null;
  active: boolean;
}

export interface AcceptInviteInput {
  token: string;
  password: string;
  fullName?: string;
}

export interface CompanySettingsSummary {
  id: string;
  companyName: string;
  ownerName: string;
  weekStartDay: number;
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
  timeTrackingStyle: TimeTrackingStyle;
  defaultLunchMinutes: number;
  payType: PayType;
  payrollMethod: PayrollMethod;
  trackExpenses: boolean;
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

export interface ExpenseSubmissionInput {
  category: string;
  amount: number;
  note?: string;
  hasReceipt: boolean;
}

export interface OnboardingEmployeeInput {
  displayName: string;
  hourlyRate?: number;
  workerType: "w2" | "1099";
}

export interface CompanyOnboardingInput {
  companyName: string;
  ownerName?: string;
  weekStartDay: number;
  employees: OnboardingEmployeeInput[];
  timeTrackingStyle: TimeTrackingStyle;
  lunchDeductionMinutes: 0 | 30 | 60;
  payType: PayType;
  payrollMethod: PayrollMethod;
  trackExpenses: boolean;
}

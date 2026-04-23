import type {
  AcceptInviteInput,
  BootstrapPayload,
  CompanyOnboardingInput,
  CompanySettingsSummary,
  EmployeeInput,
  InviteInput,
  InviteSummary,
  ManagedEmployee,
  PrivateReportInput,
  TimesheetStatus,
} from "../domain/models";

function getApiBase() {
  const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configuredBase) {
    return configuredBase;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3001/api";
    }
  }

  return "/api";
}

export const API_BASE = getApiBase();

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Request failed.");
  }

  return response.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  return request<{ token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(fullName: string, companyName: string, email: string, password: string) {
  return request<{ token: string }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ fullName, companyName, email, password }),
  });
}

export async function acceptInvite(payload: AcceptInviteInput) {
  return request<{ token: string }>("/auth/accept-invite", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchBootstrap(token: string, weekStart?: string) {
  const query = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : "";
  return request<BootstrapPayload>(`/auth/me${query}`, {}, token);
}

export async function updateDayEntry(
  token: string,
  timesheetId: string,
  dayEntryId: string,
  payload: Record<string, unknown>,
) {
  return request<{ timesheet: BootstrapPayload["employeeWeeks"][number] }>(
    `/timesheets/${timesheetId}/days/${dayEntryId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function applyCrewDefaults(
  token: string,
  crewId: string,
  payload: { weekStart: string; dayIndex: number; start: string; end: string },
) {
  return request<BootstrapPayload>(
    `/crews/${crewId}/defaults`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateTimesheetStatus(
  token: string,
  timesheetId: string,
  status: TimesheetStatus,
  extra?: { note?: string; reopenTo?: TimesheetStatus },
) {
  return request<{ timesheet: BootstrapPayload["employeeWeeks"][number] }>(
    `/timesheets/${timesheetId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, ...extra }),
    },
    token,
  );
}

export async function updateAdjustment(
  token: string,
  timesheetId: string,
  payload: {
    gasReimbursement?: number;
    pettyCashReimbursement?: number;
    deductionAdvance?: number;
    notes?: string;
  },
) {
  return request<{ timesheet: BootstrapPayload["employeeWeeks"][number] }>(
    `/timesheets/${timesheetId}/adjustment`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function submitPrivateReport(token: string, payload: PrivateReportInput) {
  return request<{ ok: boolean }>(
    "/private-reports",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateCompanySettings(
  token: string,
  payload: {
    companyName?: string;
    companyState?: string;
    defaultFederalWithholdingMode?: string;
    defaultFederalWithholdingValue?: number;
    defaultStateWithholdingMode?: string;
    defaultStateWithholdingValue?: number;
    payrollPrepDisclaimer?: string;
    pfmlEnabled?: boolean;
    pfmlEmployeeRate?: number;
  },
) {
  return request<{ companySettings: CompanySettingsSummary }>(
    "/company-settings",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function completeCompanySetup(token: string, payload: CompanyOnboardingInput) {
  return request<BootstrapPayload>(
    "/company-setup",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function listEmployees(token: string) {
  return request<{ employees: ManagedEmployee[] }>(
    "/employees",
    {},
    token,
  );
}

export async function createEmployee(token: string, payload: EmployeeInput) {
  return request<{ employee: ManagedEmployee }>(
    "/employees",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function updateEmployee(token: string, employeeId: string, payload: EmployeeInput) {
  return request<{ employee: ManagedEmployee }>(
    `/employees/${employeeId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function listInvites(token: string) {
  return request<{ invites: InviteSummary[] }>(
    "/company/invites",
    {},
    token,
  );
}

export async function createInvite(token: string, payload: InviteInput) {
  return request<{ invite: InviteSummary; inviteUrl?: string; deliveryMode: "dev_link" }>(
    "/company/invites",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function resendInvite(token: string, inviteId: string) {
  return request<{ invite: InviteSummary }>(
    `/company/invites/${inviteId}/resend`,
    { method: "POST" },
    token,
  );
}

export async function revokeInvite(token: string, inviteId: string) {
  return request<{ ok: boolean }>(
    `/company/invites/${inviteId}`,
    { method: "DELETE" },
    token,
  );
}

export async function downloadExport(token: string, path: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Export failed.");
  }

  return response;
}

export async function fetchQboPreview(token: string, weekStart: string) {
  return request<import("../types/payroll").ExportPreview>(
    `/exports/qbo-preview.json?weekStart=${encodeURIComponent(weekStart)}`,
    {},
    token,
  );
}

export async function fetchExportHistory(token: string) {
  return request<{ exports: import("../types/payroll").PayrollExportRecord[] }>(
    "/exports/history",
    {},
    token,
  );
}

export async function triggerBackendSentryVerification(token: string) {
  return request<{ ok: boolean; eventId: string | null }>(
    "/debug/sentry-test",
    {
      method: "POST",
    },
    token,
  );
}

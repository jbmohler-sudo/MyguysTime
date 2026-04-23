import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { OnboardingProvider } from "./hooks/useOnboarding";
import { ToastProvider } from "./hooks/useToast";
import { CompanySetupScreen } from "./components/CompanySetupScreen";
import { LoginScreen } from "./components/LoginScreen";
import { PublicHomepage } from "./components/PublicHomepage";
import { SignupAfterMagicLink } from "./components/SignupAfterMagicLink";
import { SignupScreen } from "./components/SignupScreen";
import type { BootstrapPayload, CompanyOnboardingInput, PrivateReportInput, TimesheetStatus } from "./domain/models";
import {
  applyCrewDefaults,
  completeCompanySetup,
  createEmployee,
  createInvite,
  downloadExport,
  fetchBootstrap,
  fetchExportHistory,
  fetchQboPreview,
  listEmployees,
  listInvites,
  login,
  resendInvite,
  revokeInvite,
  sendSmsReminders,
  signup,
  submitPrivateReport,
  updateCompanySettings,
  updateAdjustment,
  updateDayEntry,
  updateEmployee,
  updateTimesheetStatus,
} from "./lib/api";
import type { EmployeeInput, InviteInput } from "./domain/models";
import { getCurrentHostname, isPublicHomepageHost } from "./lib/host";

const TOKEN_STORAGE_KEY = "crew-timecard-token";

function getCurrentWeekStart(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + diff);
  return result.toISOString().slice(0, 10);
}

function App() {
  const hostname = getCurrentHostname();
  const showPublicHomepage = isPublicHomepageHost(hostname);
  const isInviteSignup = typeof window !== "undefined" && window.location.pathname === "/invite-signup";
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(Boolean(token));
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [openedAt] = useState(() => new Date());
  const defaultWeekStart = getCurrentWeekStart(openedAt);

  async function loadApp(nextToken: string, weekStart?: string) {
    setLoading(true);
    setError("");

    try {
      const payload = await fetchBootstrap(nextToken, weekStart ?? data?.weekStart ?? defaultWeekStart);
      setData(payload);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load app data.";
      setError(message);
      throw loadError;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadApp(token).catch(() => {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setData(null);
    });
  }, [defaultWeekStart, token]);

  async function handleLogin(email: string, password: string) {
    const response = await login(email, password);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setToken(response.token);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setData(null);
    setError("");
  }

  async function handleRefresh(weekStart?: string) {
    if (!token) {
      return;
    }

    await loadApp(token, weekStart);
  }

  function replaceTimesheet(nextTimesheet: BootstrapPayload["employeeWeeks"][number]) {
    setData((current) =>
      current
        ? {
            ...current,
            employeeWeeks: current.employeeWeeks.map((week) =>
              week.id === nextTimesheet.id ? nextTimesheet : week,
            ),
          }
        : current,
    );
  }

  async function handleUpdateDay(
    timesheetId: string,
    dayEntryId: string,
    payload: Record<string, unknown>,
  ) {
    if (!token) {
      return;
    }

    const response = await updateDayEntry(token, timesheetId, dayEntryId, payload);
    replaceTimesheet(response.timesheet);
  }

  async function handleApplyCrewDefaults(payload: {
    crewId: string;
    weekStart: string;
    dayIndex: number;
    start: string;
    end: string;
  }) {
    if (!token) {
      return;
    }

    const response = await applyCrewDefaults(token, payload.crewId, payload);
    setData(response);
  }

  async function handleStatusChange(timesheetId: string, status: TimesheetStatus, note?: string) {
    if (!token) {
      return;
    }

    const response = await updateTimesheetStatus(token, timesheetId, status, note ? { note } : undefined);
    replaceTimesheet(response.timesheet);
  }

  async function handleReopenWeek(
    timesheetId: string,
    reopenTo: TimesheetStatus,
    note: string,
  ) {
    if (!token) {
      return;
    }

    const response = await updateTimesheetStatus(token, timesheetId, "draft", { reopenTo, note });
    replaceTimesheet(response.timesheet);
  }

  async function handleUpdateAdjustment(
    timesheetId: string,
    payload: {
      gasReimbursement?: number;
      pettyCashReimbursement?: number;
      deductionAdvance?: number;
      notes?: string;
    },
  ) {
    if (!token) {
      return;
    }

    const response = await updateAdjustment(token, timesheetId, payload);
    replaceTimesheet(response.timesheet);
  }

  async function handleSubmitPrivateReport(payload: PrivateReportInput) {
    if (!token) {
      return;
    }

    await submitPrivateReport(token, payload);
    await handleRefresh();
  }

  async function handleUpdateCompanySettings(payload: {
    companyName?: string;
    companyState?: string;
    defaultFederalWithholdingMode?: string;
    defaultFederalWithholdingValue?: number;
    defaultStateWithholdingMode?: string;
    defaultStateWithholdingValue?: number;
    payrollPrepDisclaimer?: string;
    pfmlEnabled?: boolean;
    pfmlEmployeeRate?: number;
  }) {
    if (!token) {
      return;
    }

    const response = await updateCompanySettings(token, payload);
    setData((current) =>
      current
        ? {
            ...current,
            companySettings: response.companySettings,
          }
        : current,
    );
  }

  async function handleCompleteCompanySetup(payload: CompanyOnboardingInput) {
    if (!token) {
      return;
    }

    const response = await completeCompanySetup(token, payload);
    setData(response);
  }

  async function handleListEmployees() {
    if (!token) return [];
    const response = await listEmployees(token);
    return response.employees;
  }

  async function handleCreateEmployee(payload: EmployeeInput) {
    if (!token) throw new Error("Not authenticated");
    const response = await createEmployee(token, payload);
    return response.employee;
  }

  async function handleUpdateEmployee(employeeId: string, payload: EmployeeInput) {
    if (!token) throw new Error("Not authenticated");
    const response = await updateEmployee(token, employeeId, payload);
    return response.employee;
  }

  async function handleListInvites() {
    if (!token) return [];
    const response = await listInvites(token);
    return response.invites;
  }

  async function handleCreateInvite(payload: InviteInput) {
    if (!token) throw new Error("Not authenticated");
    const response = await createInvite(token, payload);
    return { invite: response.invite, inviteUrl: response.inviteUrl };
  }

  async function handleResendInvite(inviteId: string) {
    if (!token) throw new Error("Not authenticated");
    await resendInvite(token, inviteId);
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!token) throw new Error("Not authenticated");
    await revokeInvite(token, inviteId);
  }

  async function handleFetchQboPreview(ws: string) {
    if (!token) throw new Error("Not authenticated");
    return fetchQboPreview(token, ws);
  }

  async function handleDownloadQboCsv(ws: string) {
    if (!token) throw new Error("Not authenticated");
    return downloadExport(token, `/exports/qbo.csv?weekStart=${encodeURIComponent(ws)}`);
  }

  async function handleFetchExportHistory() {
    if (!token) throw new Error("Not authenticated");
    const result = await fetchExportHistory(token);
    return result.exports;
  }

  async function handleSendReminders(employeeIds: string[]) {
    if (!token) throw new Error("Not authenticated");
    return sendSmsReminders(token, employeeIds);
  }

  async function handleExport(kind: "payroll-summary" | "time-detail" | "weekly-summary") {
    if (!token || !data) {
      return;
    }

    const path =
      kind === "payroll-summary"
        ? `/exports/payroll-summary.csv?weekStart=${data.weekStart}`
        : kind === "time-detail"
          ? `/exports/time-detail.csv?weekStart=${data.weekStart}`
          : `/exports/weekly-summary?weekStart=${data.weekStart}`;

    const response = await downloadExport(token, path);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    if (kind === "weekly-summary") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download =
      kind === "payroll-summary"
        ? `payroll-summary-${data.weekStart}.csv`
        : `time-detail-${data.weekStart}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (showPublicHomepage) {
    return <PublicHomepage />;
  }

  if (isInviteSignup) {
    return (
      <SignupAfterMagicLink
        onComplete={(newToken) => {
          localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
          setToken(newToken);
          window.history.replaceState({}, "", "/");
        }}
      />
    );
  }

  if (!token) {
    if (authMode === "signup") {
      async function handleSignup(fullName: string, companyName: string, email: string, password: string) {
        const response = await signup(fullName, companyName, email, password);
        localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
        setToken(response.token);
      }
      return <SignupScreen onSignup={handleSignup} onShowLogin={() => setAuthMode("login")} error={error} />;
    }
    return <LoginScreen onLogin={handleLogin} onShowSignup={() => setAuthMode("signup")} error={error} />;
  }

  if (loading || !data) {
    return <div className="loading-screen">Loading crew board...</div>;
  }

  if (
    data.viewer.role === "admin" &&
    data.companySettings &&
    !data.companySettings.setupComplete
  ) {
    return (
      <CompanySetupScreen
        companySettings={data.companySettings}
        onComplete={handleCompleteCompanySetup}
      />
    );
  }

  return (
    <ToastProvider>
    <OnboardingProvider>
      <AppShell
        data={data}
        error={error}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        onUpdateDay={handleUpdateDay}
        onApplyCrewDefaults={handleApplyCrewDefaults}
        onStatusChange={handleStatusChange}
        onReopenWeek={handleReopenWeek}
        onUpdateAdjustment={handleUpdateAdjustment}
        onSubmitPrivateReport={handleSubmitPrivateReport}
        onExport={handleExport}
        onUpdateCompanySettings={handleUpdateCompanySettings}
        onListEmployees={handleListEmployees}
        onCreateEmployee={handleCreateEmployee}
        onUpdateEmployee={handleUpdateEmployee}
        onListInvites={handleListInvites}
        onCreateInvite={handleCreateInvite}
        onResendInvite={handleResendInvite}
        onRevokeInvite={handleRevokeInvite}
        onFetchQboPreview={handleFetchQboPreview}
        onDownloadQboCsv={handleDownloadQboCsv}
        onFetchExportHistory={handleFetchExportHistory}
        onSendReminders={handleSendReminders}
      />
    </OnboardingProvider>
    </ToastProvider>
  );
}

export default App;

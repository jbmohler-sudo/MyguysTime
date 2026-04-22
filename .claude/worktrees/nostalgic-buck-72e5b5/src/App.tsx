import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { CompanySetupScreen } from "./components/CompanySetupScreen";
import { CreateAccountScreen } from "./components/CreateAccountScreen";
import { LoginScreen } from "./components/LoginScreen";
import { PublicHomepage } from "./components/PublicHomepage";
import type { BootstrapPayload, CompanyOnboardingInput, PrivateReportInput, TimesheetStatus } from "./domain/models";
import {
  applyCrewDefaults,
  completeCompanySetup,
  downloadExport,
  fetchBootstrap,
  login,
  register,
  submitPrivateReport,
  updateCompanySettings,
  updateAdjustment,
  updateDayEntry,
  updateTimesheetStatus,
} from "./lib/api";
import { getCurrentHostname, getPreferredAppUrl, isPublicHomepageHost } from "./lib/host";

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
  const appUrl = getPreferredAppUrl(hostname);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [view, setView] = useState<"login" | "signup">("login");
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(Boolean(token));
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

  async function handleRegister(fullName: string, email: string, password: string, companyName: string) {
    const response = await register(fullName, email, password, companyName);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setToken(response.token);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setData(null);
    setError("");
    setView("login");
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
    return <PublicHomepage appUrl={appUrl} />;
  }

  if (!token) {
    if (view === "signup") {
      return <CreateAccountScreen onRegister={handleRegister} onBack={() => setView("login")} />;
    }
    return <LoginScreen onLogin={handleLogin} onSignUp={() => setView("signup")} error={error} />;
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
    />
  );
}

export default App;

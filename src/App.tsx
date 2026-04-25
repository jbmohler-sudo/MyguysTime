import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { OnboardingProvider } from "./hooks/useOnboarding";
import { ToastProvider } from "./hooks/useToast";
import { ViewProvider } from "./context/ViewContext";
import { CompanySetupScreen } from "./components/CompanySetupScreen";
import { PublicHomepage } from "./components/PublicHomepage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LoginPage } from "./pages/LoginPage";
import { DemoShell } from "./demo/DemoShell";
import type { DemoRole } from "./demo/demoData";

import { SignupAfterMagicLink } from "./components/SignupAfterMagicLink";
import { SignupScreen } from "./components/SignupScreen";
import type { BootstrapPayload, CompanyOnboardingInput, PrivateReportInput, TimesheetStatus } from "./domain/models";
import { getWeekStartIso } from "./domain/week";
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
  resendInvite,
  revokeInvite,
  sendSmsReminders,
  signup,
  submitPrivateReport,
  updateCompanySettings,
  updateAdjustment,
  updateDayEntry,
  updateEmployee,
  updateMe,
  updateTimesheetStatus,
} from "./lib/api";
import type { EmployeeInput, InviteInput } from "./domain/models";
import { getCurrentHostname, isPublicHomepageHost } from "./lib/host";
import { supabase } from "./lib/supabase";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
const TOKEN_STORAGE_KEY = "crew-timecard-token";

function AppContent() {
  const hostname = getCurrentHostname();
  const [path, setPath] = useState(() => (typeof window !== "undefined" ? window.location.pathname : "/"));
  const showPublicHomepage = isPublicHomepageHost(hostname);
  const isInviteSignup = path === "/invite-signup";
  const isForgotPasswordRoute = path === "/forgot-password";
  const isResetPasswordRoute = path === "/reset-password";
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));

  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(Boolean(token));
  const [authMode, setAuthMode] = useState<"login" | "signup">(() => (path === "/signup" ? "signup" : "login"));
  const [openedAt] = useState(() => new Date());

  function setStoredToken(nextToken: string | null) {
    if (nextToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    setToken(nextToken);
  }

  function navigate(path: string) {
    window.history.replaceState({}, "", path);
    setPath(path);
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (path === "/signup") {
      setAuthMode("signup");
      return;
    }

    if (path === "/" || path === "/login") {
      setAuthMode("login");
    }
  }, [path]);

  async function loadApp(nextToken: string, weekStart?: string) {
    setLoading(true);
    setError("");

    try {
      const requestedWeekStart =
        weekStart ??
        data?.weekStart ??
        getWeekStartIso(openedAt, data?.companySettings?.weekStartDay ?? 1);
      const payload = await fetchBootstrap(nextToken, requestedWeekStart);
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
    let active = true;

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!active || !sessionData.session?.access_token) {
        return;
      }

      setStoredToken(sessionData.session.access_token);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) {
        return;
      }

      const accessToken = session?.access_token ?? null;
      setStoredToken(accessToken);

      if (!accessToken) {
        setData(null);
      }

      if (event === "PASSWORD_RECOVERY" && window.location.pathname !== "/reset-password") {
        navigate("/reset-password");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    void loadApp(token).catch(() => {
      setStoredToken(null);
      setData(null);
    });
  }, [openedAt, token]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setStoredToken(null);
    setData(null);
    setError("");
    navigate("/");
  }

  async function handleRefresh(weekStart?: string) {
    if (!token) {
      return;
    }

    await loadApp(token, weekStart);
  }

  async function handleUpdateMe(payload: { fullName?: string; preferredView?: "office" | "truck" }) {
    if (!token) return;
    const response = await updateMe(token, payload);
    setData((current) =>
      current ? { ...current, viewer: response.viewer } : current,
    );
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
    weekStartDay?: number;
    defaultFederalWithholdingMode?: string;
    defaultFederalWithholdingValue?: number;
    defaultStateWithholdingMode?: string;
    defaultStateWithholdingValue?: number;
    payrollPrepDisclaimer?: string;
    pfmlEnabled?: boolean;
    pfmlEmployeeRate?: number;
    payrollMethod?: "service" | "manual" | "mixed";
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







  // ─── Static demo routes — zero Supabase, safe on public homepage host ────────
  const demoRouteMap: Record<string, DemoRole> = {
    "/demo/admin": "admin",
    "/demo/foreman": "foreman",
    "/demo/employee": "employee",
  };
  const demoRole = demoRouteMap[path];
  if (demoRole) {
    return <DemoShell role={demoRole} />;
  }

  if (showPublicHomepage) {
    return <PublicHomepage />;
  }

  if (isInviteSignup) {
    return (
      <SignupAfterMagicLink
        onComplete={(newToken) => {
          setStoredToken(newToken);
          navigate("/dashboard");
        }}
      />
    );
  }

  if (isForgotPasswordRoute) {
    return (
      <ForgotPasswordPage
        onShowLogin={() => {
          setAuthMode("login");
          navigate("/login");
        }}
      />
    );
  }

  if (isResetPasswordRoute) {
    return (
      <ResetPasswordPage
        onComplete={(newToken) => {

          setStoredToken(newToken);
          navigate("/dashboard");
        }}
        onShowLogin={() => {
          setAuthMode("login");
          navigate("/login");
        }}
      />
    );
  }

  if (!token) {
    if (authMode === "signup") {
      async function handleSignup(fullName: string, companyName: string, email: string, password: string) {
        await signup(fullName, companyName, email, password);
        const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signInError || !sessionData.session?.access_token) {
          throw signInError ?? new Error("Supabase session was not created after signup.");
        }

        setStoredToken(sessionData.session.access_token);
        navigate("/dashboard");
      }
      return (
        <SignupScreen
          onSignup={handleSignup}
          onShowLogin={() => {
            setAuthMode("login");
            navigate("/login");
          }}
          error={error}
        />
      );
    }
    return (
      <LoginPage
        onSuccess={() => navigate("/dashboard")}
        onShowForgotPassword={() => navigate("/forgot-password")}
        onShowSignup={() => {
          setAuthMode("signup");
          navigate("/signup");
        }}
      />
    );
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
    <ViewProvider>
    <ToastProvider>
    <OnboardingProvider>
      <AppShell
        data={data}
        error={error}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        onUpdateMe={handleUpdateMe}
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
    </ViewProvider>
  );
}

function App() {
  return (
    <AppContent />
  );
}

export default App;

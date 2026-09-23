import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "./components/AppShell";
import { OnboardingProvider } from "./hooks/useOnboarding";
import { ToastProvider } from "./hooks/useToast";
import { ViewProvider } from "./context/ViewContext";
import { CompanySetupScreen } from "./components/CompanySetupScreen";
import { BillingGate } from "./components/BillingGate";
import { PublicHomepage } from "./components/PublicHomepage";
import { FeaturesPage } from "./components/FeaturesPage";
import { PricingPage } from "./components/PricingPage";
import { HowItWorksPage } from "./components/HowItWorksPage";
import { FaqPage } from "./components/FaqPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LoginPage } from "./pages/LoginPage";
import { DemoShell } from "./demo/DemoShell";
import type { DemoRole } from "./demo/demoData";

import { SignupAfterMagicLink } from "./components/SignupAfterMagicLink";
import { SignupScreen } from "./components/SignupScreen";
import type { BootstrapPayload, CompanyOnboardingInput, PrivateReportInput, TimesheetStatus } from "./domain/models";
import { companyHasPaidAccess } from "./domain/subscription";
import { getWeekStartIso } from "./domain/week";
import {
  applyCrewDefaults,
  completeCompanySetup,
  createBillingCheckout,
  createBillingPortal,
  syncBillingSubscription,
  createEmployee,
  createExpenseSubmission,
  createInvite,
  fetchBootstrap,
  listEmployees,
  listInvites,
  removeEmployee,
  resendInvite,
  revokeInvite,
  signup,
  submitPrivateReport,
  triggerBackendSentryVerification,
  updateCompanySettings,
  updateDayEntry,
  updateEmployee,
  updateMe,
  updateTimesheetStatus,
} from "./lib/api";
import type { EmployeeInput, InviteInput } from "./domain/models";
import type { ExpenseSubmissionInput } from "./domain/models";
import { getCurrentHostname, isPublicHomepageHost } from "./lib/host";
import {
  capturePostHogEvent,
  capturePostHogPageview,
  identifyPostHogUser,
  resetPostHogUser,
} from "./lib/posthog";
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
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(token));
  const [authMode, setAuthMode] = useState<"login" | "signup">(() => (path === "/signup" ? "signup" : "login"));
  const [openedAt] = useState(() => new Date());
  // Capture the Stripe return param once on mount. The URL gets cleaned up
  // in an effect below; reading it during render meant the param was stripped
  // before the post-checkout refresh effect could see it.
  const [billingReturn] = useState<"success" | "cancelled" | null>(() => billingReturnState());

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

  useEffect(() => {
    capturePostHogPageview(path);
  }, [path]);

  // After a Stripe checkout redirect, give the webhook a moment to land,
  // then reload so an active subscription clears the billing gate.
  // Driven by the captured billingReturn state (not the URL) because the
  // ?billing= param is cleaned from the address bar on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (billingReturn !== "success" || !token) return;
    const timer = setTimeout(() => {
      void syncBillingSubscription(token)
        .catch(() => undefined)
        .then(() => handleRefresh())
        .catch(() => undefined);
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, billingReturn]);

  // Clean the ?billing= param so refresh keeps a clean URL. Runs once on
  // mount, after the refresh effect above has captured what it needs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (billingReturn) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      if (accessToken && event === "SIGNED_IN") {
        capturePostHogEvent("login_succeeded", {
          path,
        });
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
      resetPostHogUser();
      return;
    }

    void loadApp(token).catch(() => {
      setStoredToken(null);
      setData(null);
    });
  }, [openedAt, token]);

  async function handleLogout() {
    await supabase.auth.signOut();
    resetPostHogUser();
    setStoredToken(null);
    setData(null);
    setError("");
    navigate("/");
  }

  useEffect(() => {
    if (!data) {
      return;
    }

    identifyPostHogUser({
      id: data.viewer.id,
      role: data.viewer.role,
      companyId: data.companySettings?.id ?? null,
      companyName: data.companySettings?.companyName ?? null,
    });
  }, [data]);

  async function handleRefresh(weekStart?: string) {
    if (!token) {
      return;
    }

    await loadApp(token, weekStart);
  }

  function subscriptionIsActive(): boolean {
    const subscription = data?.companySettings?.subscription;
    return (
      Boolean(subscription?.active) ||
      companyHasPaidAccess(subscription?.status, subscription?.trialEndsAt, data?.viewer.email)
    );
  }

  function billingReturnState(): "success" | "cancelled" | null {
    if (typeof window === "undefined") return null;
    const param = new URLSearchParams(window.location.search).get("billing");
    return param === "success" || param === "cancelled" ? param : null;
  }

  async function handleSubscribe() {
    if (!token) return;
    setBillingBusy(true);
    setBillingError(null);
    try {
      const { url } = await createBillingCheckout(token);
      if (!url) throw new Error("Checkout did not return a URL.");
      window.location.href = url;
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : "Could not start checkout.");
      setBillingBusy(false);
    }
  }

  async function handleManageBilling() {
    if (!token) {
      const message = "You need to be signed in to manage billing.";
      setBillingError(message);
      throw new Error(message);
    }
    setBillingBusy(true);
    setBillingError(null);
    try {
      const { url } = await createBillingPortal(token);
      if (!url) throw new Error("Billing portal did not return a URL.");
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not open the billing portal.";
      setBillingError(message);
      setBillingBusy(false);
      throw err instanceof Error ? err : new Error(message);
    }
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

  async function handleSubmitPrivateReport(payload: PrivateReportInput) {
    if (!token) {
      return;
    }

    await submitPrivateReport(token, payload);
    await handleRefresh();
  }

  async function handleCreateExpenseSubmission(timesheetId: string, payload: ExpenseSubmissionInput) {
    if (!token) {
      return;
    }

    const response = await createExpenseSubmission(token, timesheetId, payload);
    replaceTimesheet(response.timesheet);
  }

  async function handleUpdateCompanySettings(payload: {
    companyName?: string;
    companyState?: string;
    weekStartDay?: number;
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
    capturePostHogEvent("company_setup_completed", {
      employee_count: payload.employees.length,
      week_start_day: payload.weekStartDay,
      time_tracking_style: payload.timeTrackingStyle,
      track_expenses: payload.trackExpenses,
    });
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

  async function handleRemoveEmployee(employeeId: string) {
    if (!token) throw new Error("Not authenticated");
    return removeEmployee(token, employeeId);
  }

  async function handleListInvites() {
    if (!token) return [];
    const response = await listInvites(token);
    return response.invites;
  }

  async function handleCreateInvite(payload: InviteInput) {
    if (!token) throw new Error("Not authenticated");
    const response = await createInvite(token, payload);
    return {
      invite: response.invite,
      inviteUrl: response.inviteUrl,
      deliveryMode: response.deliveryMode,
    };
  }

  async function handleResendInvite(inviteId: string) {
    if (!token) throw new Error("Not authenticated");
    return resendInvite(token, inviteId);
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!token) throw new Error("Not authenticated");
    await revokeInvite(token, inviteId);
  }

  async function handleVerifyBackendSentry() {
    if (!token) {
      throw new Error("Not authenticated");
    }

    const result = await triggerBackendSentryVerification(token);
    return result.eventId;
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

  // ─── Marketing pages — prerendered to static HTML, hydrated by App ──────────
  if (showPublicHomepage) {
    const cleanPath = path.length > 1 ? path.replace(/\/+$/, "") : path;
    const marketingPageMap: Record<string, ReactNode> = {
      "/features": <FeaturesPage />,
      "/pricing": <PricingPage />,
      "/how-it-works": <HowItWorksPage />,
      "/faq": <FaqPage />,
    };
    const marketingPage = marketingPageMap[cleanPath];
    if (marketingPage) {
      return marketingPage;
    }
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

  if (data.companySettings && !subscriptionIsActive()) {
    return (
      <BillingGate
        companyName={data.companySettings.companyName}
        isAdmin={data.viewer.role === "admin"}
        hasCustomer={data.companySettings.subscription.hasCustomer}
        status={data.companySettings.subscription.status}
        trialEndsAt={data.companySettings.subscription.trialEndsAt}
        busy={billingBusy}
        error={billingError}
        justSubscribed={billingReturn === "success"}
        onSubscribe={handleSubscribe}
        onManageBilling={handleManageBilling}
        onLogout={handleLogout}
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
        onManageBilling={handleManageBilling}
        onUpdateDay={handleUpdateDay}
        onApplyCrewDefaults={handleApplyCrewDefaults}
        onStatusChange={handleStatusChange}
        onReopenWeek={handleReopenWeek}
        onSubmitPrivateReport={handleSubmitPrivateReport}
        onCreateExpenseSubmission={handleCreateExpenseSubmission}
        onUpdateCompanySettings={handleUpdateCompanySettings}
        onListEmployees={handleListEmployees}
        onCreateEmployee={handleCreateEmployee}
        onUpdateEmployee={handleUpdateEmployee}
        onRemoveEmployee={handleRemoveEmployee}
        onListInvites={handleListInvites}
        onCreateInvite={handleCreateInvite}
        onResendInvite={handleResendInvite}
        onRevokeInvite={handleRevokeInvite}
        onVerifyBackendSentry={handleVerifyBackendSentry}
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

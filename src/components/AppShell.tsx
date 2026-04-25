import { useEffect, useMemo, useRef, useState } from "react";
import type {
  BootstrapPayload,
  EmployeeInput,
  InviteInput,
  InviteSummary,
  ManagedEmployee,
  PrivateReportInput,
  TimesheetStatus,
} from "../domain/models";
import { prettyStatus } from "../domain/permissions";
import { AddEmployeeModal } from "./AddEmployeeModal";
import { AccountSettingsPanel } from "./AccountSettingsPanel";
import { ArchivePanel } from "./ArchivePanel";
import { InviteEmployeeModal } from "./InviteEmployeeModal";
import { InviteManagementPanel } from "./InviteManagementPanel";
import { MissingTimeAlertBanner } from "./MissingTimeAlertBanner";
import { OnboardingOverlay } from "./OnboardingOverlay";
import { PayrollExportModal } from "./PayrollExportModal";
import { CompanySettingsPanel } from "./CompanySettingsPanel";
import { Logo } from "./Logo";
import { OfficeDashboard } from "./OfficeDashboard";
import { PrivateReportsPanel } from "./PrivateReportsPanel";
import { TeamManagementPanel } from "./TeamManagementPanel";
import { WeeklyCrewBoard } from "./WeeklyCrewBoard";
import { useOnboardingContext } from "../hooks/useOnboarding";
import { Home, Users, Settings, Archive, LogOut } from "lucide-react";
import { getWeekStartIso } from "../domain/week";


const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";
const BRAND_LIGHT = "#F8F9FA";
const ACCENT_TEAL = "#00BCD4";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type UiMode = "truck" | "office";
type AppPage = "dashboard" | "team" | "company-settings" | "account-settings" | "archive";

interface AppShellProps {
  data: BootstrapPayload;
  error?: string;
  onLogout: () => void;
  onRefresh: (weekStart?: string) => Promise<void>;
  onUpdateDay: (timesheetId: string, dayEntryId: string, payload: Record<string, unknown>) => Promise<void>;
  onApplyCrewDefaults: (payload: {
    crewId: string;
    weekStart: string;
    dayIndex: number;
    start: string;
    end: string;
  }) => Promise<void>;
  onStatusChange: (timesheetId: string, status: TimesheetStatus, note?: string) => Promise<void>;
  onReopenWeek: (timesheetId: string, reopenTo: TimesheetStatus, note: string) => Promise<void>;
  onUpdateAdjustment: (
    timesheetId: string,
    payload: {
      gasReimbursement?: number;
      pettyCashReimbursement?: number;
      deductionAdvance?: number;
      notes?: string;
    },
  ) => Promise<void>;
  onSubmitPrivateReport: (payload: PrivateReportInput) => Promise<void>;
  onExport: (kind: "payroll-summary" | "time-detail" | "weekly-summary") => Promise<void>;
  onUpdateCompanySettings: (payload: {
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
  }) => Promise<void>;
  onListEmployees: () => Promise<ManagedEmployee[]>;
  onCreateEmployee: (payload: EmployeeInput) => Promise<ManagedEmployee>;
  onUpdateEmployee: (employeeId: string, payload: EmployeeInput) => Promise<ManagedEmployee>;
  onListInvites: () => Promise<InviteSummary[]>;
  onCreateInvite: (payload: InviteInput) => Promise<{ invite: InviteSummary; inviteUrl?: string }>;
  onResendInvite: (inviteId: string) => Promise<void>;
  onRevokeInvite: (inviteId: string) => Promise<void>;
  onUpdateMe: (payload: { fullName?: string; preferredView?: "office" | "truck" }) => Promise<void>;
  onFetchQboPreview?: (weekStart: string) => Promise<import("../types/payroll").ExportPreview>;
  onDownloadQboCsv?: (weekStart: string) => Promise<Response>;
  onFetchExportHistory?: () => Promise<import("../types/payroll").PayrollExportRecord[]>;
  onSendReminders?: (employeeIds: string[]) => Promise<{ count: number; sent: boolean }>;
}

export function AppShell({
  data,
  error,
  onLogout,
  onRefresh,
  onUpdateMe,
  onUpdateDay,
  onApplyCrewDefaults,
  onStatusChange,
  onReopenWeek,
  onUpdateAdjustment,
  onSubmitPrivateReport,
  onExport,
  onUpdateCompanySettings,
  onListInvites,
  onCreateInvite,
  onResendInvite,
  onRevokeInvite,
  onFetchQboPreview,
  onDownloadQboCsv,
  onFetchExportHistory,
  onSendReminders,
}: AppShellProps) {
  const onboarding = useOnboardingContext();

  const truckViewportQuery = "(max-width: 1024px)";

  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const [selectedCrewId, setSelectedCrewId] = useState<string>("all");
  const [openedAt] = useState(() => new Date());
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(truckViewportQuery).matches : false,
  );
  const [modeOverride] = useState<UiMode | null>(null);
  const [activePage, setActivePage] = useState<AppPage>("dashboard");
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [inviteSuccessUrl, setInviteSuccessUrl] = useState<string | null>(null);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallReady, setIsInstallReady] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const visibleWeeks = useMemo(
    () =>
      selectedCrewId === "all"
        ? data.employeeWeeks
        : data.employeeWeeks.filter((week) => week.crewId === selectedCrewId),
    [data.employeeWeeks, selectedCrewId],
  );

  const todayIso = useMemo(() => {
    const year = openedAt.getFullYear();
    const month = String(openedAt.getMonth() + 1).padStart(2, "0");
    const day = String(openedAt.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [openedAt]);

  const currentWeekStart = useMemo(() => {
    return getWeekStartIso(openedAt, data.companySettings?.weekStartDay ?? 1);
  }, [data.companySettings?.weekStartDay, openedAt]);

  const effectiveViewer = data.viewer;

  const uiMode = useMemo<UiMode>(() => {
    if (modeOverride) {
      return modeOverride;
    }
    if (isMobileViewport) {
      return "truck";
    }
    return "office";
  }, [isMobileViewport, modeOverride]);

  const canViewCompanySettings = effectiveViewer.role === "admin" && Boolean(data.companySettings);
  const canViewArchive = effectiveViewer.role === "admin";
  const canViewTeam = effectiveViewer.role === "admin";

  const incompleteCount = useMemo(() => {
    return data.employeeWeeks.filter((week) => week.status === "draft").length;
  }, [data.employeeWeeks]);

  const hasIncompleteTimesheets = incompleteCount > 0;

  const navItems = useMemo(
    () =>
      [
        { key: "dashboard", label: "Dashboard", visible: true },
        { key: "team", label: "Team", visible: canViewTeam },
        { key: "company-settings", label: "Company Settings", visible: canViewCompanySettings },
        { key: "account-settings", label: "Account Settings", visible: true },
        { key: "archive", label: "Archive", visible: canViewArchive },
      ] as Array<{ key: AppPage; label: string; visible: boolean }>,
    [canViewArchive, canViewCompanySettings, canViewTeam],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const prev = lastScrollYRef.current;

      setIsScrolled(scrollY > 40);

      if (scrollY < 80) {
        setIsHeaderVisible(true);
      } else if (scrollY > prev + 4) {
        setIsHeaderVisible(false);
      } else if (scrollY < prev - 4) {
        setIsHeaderVisible(true);
      }

      lastScrollYRef.current = scrollY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia(truckViewportQuery);
    function handleViewportChange(event: MediaQueryList | MediaQueryListEvent) {
      setIsMobileViewport(event.matches);
    }
    setIsMobileViewport(mediaQuery.matches);
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleViewportChange);
      return () => mediaQuery.removeEventListener("change", handleViewportChange);
    }
    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, [truckViewportQuery]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previousHtmlOverflowX = document.documentElement.style.overflowX;
    const previousBodyOverflowX = document.body.style.overflowX;
    const previousHtmlWidth = document.documentElement.style.width;
    const previousBodyWidth = document.body.style.width;

    if (isMobileViewport) {
      document.documentElement.style.overflowX = "hidden";
      document.body.style.overflowX = "hidden";
      document.documentElement.style.width = "100%";
      document.body.style.width = "100%";
    }

    return () => {
      document.documentElement.style.overflowX = previousHtmlOverflowX;
      document.body.style.overflowX = previousBodyOverflowX;
      document.documentElement.style.width = previousHtmlWidth;
      document.body.style.width = previousBodyWidth;
    };
  }, [isMobileViewport]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const standaloneQuery =
      typeof window.matchMedia === "function" ? window.matchMedia("(display-mode: standalone)") : null;

    const syncInstalledState = () => {
      const installed =
        standaloneQuery?.matches === true ||
        (typeof navigator !== "undefined" &&
          "standalone" in navigator &&
          Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
      setIsInstalled(installed);
      if (installed) {
        setDeferredInstallPrompt(null);
        setIsInstallReady(false);
      }
    };

    syncInstalledState();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
      setIsInstallReady(true);
    };

    const handleInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsInstallReady(false);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if (standaloneQuery) {
      if (typeof standaloneQuery.addEventListener === "function") {
        standaloneQuery.addEventListener("change", syncInstalledState);
      } else {
        standaloneQuery.addListener(syncInstalledState);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);

      if (standaloneQuery) {
        if (typeof standaloneQuery.removeEventListener === "function") {
          standaloneQuery.removeEventListener("change", syncInstalledState);
        } else {
          standaloneQuery.removeListener(syncInstalledState);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (uiMode === "truck" && data.weekStart !== currentWeekStart) {
      void onRefresh(currentWeekStart);
    }
  }, [currentWeekStart, data.weekStart, onRefresh, uiMode]);


  useEffect(() => {
    if (activePage === "company-settings" && !canViewCompanySettings) {
      setActivePage("dashboard");
    }
    if (activePage === "team" && !canViewTeam) {
      setActivePage("dashboard");
    }
    if (activePage === "archive" && !canViewArchive) {
      setActivePage("dashboard");
    }
  }, [activePage, canViewArchive, canViewCompanySettings, canViewTeam]);

  const handleQuickFix = () => {
    setActivePage("dashboard");
    setTimeout(() => {
      const crewBoard = document.querySelector(".weekly-crew-board");
      crewBoard?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const handleQuickFixMissingTime = () => {
    const crewBoardElement = document.querySelector(".crew-board, .weekly-crew-board");
    if (crewBoardElement) {
      crewBoardElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePayrollExport = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log(`✓ Exported ${fileName}`);
  };

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);
    setIsInstallReady(false);
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }
  };

  const pageTitle: Record<AppPage, string> = {
    dashboard:
      uiMode === "truck"
        ? "Current-week crew timecards for the truck."
        : "Weekly time review and payroll-prep for contractor crews.",
    team: "Active employee records and default crew setup.",
    "company-settings": "Company profile and payroll-prep defaults.",
    "account-settings": "Account email and password managed through Supabase Auth.",
    archive: "Archived employee records and history.",
  };

  const pageSubtitle: Record<AppPage, string> = {
    dashboard:
      uiMode === "truck"
        ? "Mobile-first time entry for foremen and employees, focused on today and the active work week."
        : "Keep the weekly board, payroll-prep review, exports, and next-step workflow in one focused dashboard.",
    team: "Manage employee records, keep worker details current, and send login invites only when someone needs app access.",
    "company-settings": "Update company identity, state support, payroll-prep defaults, and the standing disclaimer without cluttering the weekly dashboard.",
    "account-settings": "Change your login email or password without touching company payroll settings or crew-management data.",
    archive: "Archived employees stay on file for office reference instead of being deleted.",
  };

  const formattedWeekStart = useMemo(() => {
    const [year, month, day] = data.weekStart.split("-");
    return `${month}/${day}/${year}`;
  }, [data.weekStart]);



  if (isMobileViewport) {
    const visibleNavItems = navItems.filter((item) => item.visible);
    const firstName = effectiveViewer.fullName.split(" ")[0];
    const pageEyebrow = uiMode === "truck" ? "Truck mode" : "Office mobile";
    const pageHeading =
      activePage === "dashboard"
        ? uiMode === "truck"
          ? "Time entry for this week"
          : "Review this week"
        : navItems.find((item) => item.key === activePage)?.label ?? "Dashboard";
    const pageSummary =
      activePage === "dashboard"
        ? uiMode === "truck"
          ? "Open the crew board, tap the day, and keep the truck moving."
          : "Review the week on phone without shrinking the desktop office shell."
        : pageSubtitle[activePage];

    return (
      <div
        className={`app-shell app-shell--${uiMode} app-shell--mobile`}
        style={{
          backgroundColor: BRAND_LIGHT,
          minHeight: "100vh",
          width: "100%",
          maxWidth: "100vw",
          overflowX: "clip",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            backgroundColor: "white",
            borderBottom: "1px solid #E9EDF3",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            padding: "0.65rem 0.9rem",
            minHeight: "60px",
            boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
          }}
        >
          <div style={{ minWidth: 0, flex: 1, display: "grid", gap: "0.15rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", minWidth: 0 }}>
              <Logo size="preview" />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: BRAND_DARK,
                    fontSize: "0.92rem",
                    fontWeight: 700,
                    lineHeight: 1.15,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {pageHeading}
                </div>
                <div style={{ color: "#6B7280", fontSize: "0.76rem", lineHeight: 1.15 }}>
                  {firstName} - {effectiveViewer.role}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            <span
              style={{
                backgroundColor: uiMode === "office" ? BRAND_ORANGE : ACCENT_TEAL,
                color: "white",
                padding: "0.34rem 0.65rem",
                borderRadius: "999px",
                fontSize: "0.66rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {uiMode === "truck" ? "Truck" : "Office"}
            </span>
            <button
              onClick={onboarding.restartTour}
              style={{
                background: "none",
                border: "1.5px solid #DDD",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#888",
                flexShrink: 0,
              }}
              type="button"
              aria-label="Help"
            >
              ?
            </button>
          </div>
        </header>

        <main style={{ width: "100%", maxWidth: "100%", overflowX: "clip", padding: "0 0 80px" }}>
          <section
            style={{
              padding: "12px 12px 10px",
              display: "grid",
              gap: "0.9rem",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                border: "1px solid #E7ECF5",
                borderRadius: "22px",
                padding: "1rem",
                boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
                display: "grid",
                gap: "0.8rem",
              }}
            >
              <div style={{ display: "grid", gap: "0.3rem" }}>
                <span
                  style={{
                    color: uiMode === "truck" ? ACCENT_TEAL : BRAND_ORANGE,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {pageEyebrow}
                </span>
                <h1 style={{ color: BRAND_DARK, fontSize: "1.35rem", lineHeight: 1.1, margin: 0 }}>{pageHeading}</h1>
                <p style={{ color: "#5B6472", fontSize: "0.92rem", lineHeight: 1.45 }}>{pageSummary}</p>
              </div>

              <div style={{ display: "grid", gap: "0.75rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.55rem" }}>
                  <span
                    style={{
                      backgroundColor: "#F3F4F6",
                      color: "#4B5563",
                      padding: "0.45rem 0.75rem",
                      borderRadius: "999px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                    }}
                  >
                    Week of {formattedWeekStart}
                  </span>
                  <span
                    style={{
                      backgroundColor: uiMode === "office" ? "rgba(255,140,0,0.10)" : "rgba(0,188,212,0.12)",
                      color: uiMode === "office" ? BRAND_ORANGE : "#0F7C89",
                      padding: "0.45rem 0.75rem",
                      borderRadius: "999px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                    }}
                  >
                    {uiMode === "truck" ? "Truck workflow" : "Office workflow"}
                  </span>
                </div>

                {activePage === "dashboard" ? (
                  uiMode === "office" ? (
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                      <label style={{ fontSize: "0.8rem", color: "#6B7280", fontWeight: 600 }}>
                        Review week
                        <input type="date" value={data.weekStart} onChange={(event) => void onRefresh(event.target.value)} />
                      </label>
                      <button
                        onClick={() => setShowPayrollModal(true)}
                        style={{
                          backgroundColor: BRAND_ORANGE,
                          color: "white",
                          border: "none",
                          borderRadius: "14px",
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          width: "100%",
                        }}
                        type="button"
                      >
                        Export payroll
                      </button>
                      {isInstallReady && !isInstalled ? (
                        <button
                          onClick={() => void handleInstallApp()}
                          style={{
                            backgroundColor: "#F3F4F6",
                            color: BRAND_DARK,
                            border: "1px solid #D7DEE8",
                            borderRadius: "14px",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            width: "100%",
                          }}
                          type="button"
                        >
                          Install app
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "0.7rem" }}>
                      <div style={{ color: "#6B7280", fontSize: "0.86rem", lineHeight: 1.45 }}>
                        Open the menu only when you need another page. The truck screen stays centered on this week.
                      </div>
                      {effectiveViewer.role === "admin" ? (
                        <button
                          onClick={() => setShowPayrollModal(true)}
                          style={{
                            backgroundColor: BRAND_ORANGE,
                            color: "white",
                            border: "none",
                            borderRadius: "14px",
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            width: "100%",
                          }}
                          type="button"
                        >
                          Export payroll
                        </button>
                      ) : null}
                      {isInstallReady && !isInstalled ? (
                        <button
                          onClick={() => void handleInstallApp()}
                          style={{
                            backgroundColor: effectiveViewer.role === "admin" ? "#F3F4F6" : BRAND_ORANGE,
                            color: effectiveViewer.role === "admin" ? BRAND_DARK : "white",
                            border: effectiveViewer.role === "admin" ? "1px solid #D7DEE8" : "none",
                            borderRadius: "14px",
                            fontSize: "0.95rem",
                            fontWeight: 700,
                            width: "100%",
                          }}
                          type="button"
                        >
                          Install on this phone
                        </button>
                      ) : isInstalled ? (
                        <div
                          style={{
                            backgroundColor: "#F3F4F6",
                            color: "#4B5563",
                            padding: "0.7rem 0.85rem",
                            borderRadius: "14px",
                            fontSize: "0.84rem",
                            fontWeight: 600,
                          }}
                        >
                          App is already installed on this device.
                        </div>
                      ) : null}

                    </div>
                  )
                ) : (
                  <div style={{ color: "#6B7280", fontSize: "0.86rem", lineHeight: 1.45 }}>
                    Open the menu to move between pages. Desktop office layout stays unchanged.
                  </div>
                )}
              </div>
            </div>
          </section>

          {error ? (
            <div
              style={{
                backgroundColor: "rgba(255,140,0,0.08)",
                borderLeft: `4px solid ${BRAND_ORANGE}`,
                color: BRAND_DARK,
                padding: "12px 16px",
                fontSize: "0.875rem",
                margin: "0 16px 12px",
                borderRadius: "0 8px 8px 0",
              }}
            >
              {error}
            </div>
          ) : null}

          {uiMode === "office" && hasIncompleteTimesheets && activePage === "dashboard" ? (
            <div
              style={{
                backgroundColor: "rgba(255, 140, 0, 0.06)",
                borderLeft: `4px solid ${BRAND_ORANGE}`,
                padding: "14px 16px",
                margin: "0 16px 12px",
                borderRadius: "0 8px 8px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: "0.85rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: BRAND_ORANGE }}>!</span>
                <div>
                  <strong style={{ color: BRAND_DARK, display: "block", fontSize: "0.85rem" }}>
                    Action required
                  </strong>
                  <span style={{ color: "#5A5A5B", fontSize: "0.78rem" }}>
                    {incompleteCount} {incompleteCount === 1 ? "timesheet" : "timesheets"} waiting for submission
                  </span>
                </div>
              </div>
              <button
                onClick={handleQuickFix}
                style={{
                  backgroundColor: BRAND_ORANGE,
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  width: "100%",
                }}
                type="button"
              >
                Fix now
              </button>
            </div>
          ) : null}

          <div style={{ width: "100%", maxWidth: "100%", overflowX: "clip" }}>
            {activePage === "dashboard" ? (
              <>
                <WeeklyCrewBoard
                  uiMode={uiMode}
                  viewer={effectiveViewer}
                  crews={data.crews}
                  employeeWeeks={visibleWeeks}
                  selectedCrewId={selectedCrewId}
                  onSelectCrew={setSelectedCrewId}
                  weekStart={data.weekStart}
                  todayIso={todayIso}
                  currentWeekStart={currentWeekStart}
                  onGoToCurrentWeek={() => void onRefresh(currentWeekStart)}
                  onUpdateDay={onUpdateDay}
                  onApplyCrewDefaults={onApplyCrewDefaults}
                  onStatusChange={onStatusChange}
                  onReopenWeek={onReopenWeek}
                />
                {uiMode === "office" && effectiveViewer.role === "admin" ? (
                  <div className="brand-surface" style={{ margin: "0 12px 12px" }}>
                    <OfficeDashboard
                      companySettings={data.companySettings}
                      employeeWeeks={data.employeeWeeks}
                      onExport={onExport}
                      onUpdateAdjustment={onUpdateAdjustment}
                      onReopenWeek={onReopenWeek}
                    />
                  </div>
                ) : null}
                {uiMode === "office" ? (
                  <section className="stack brand-surface" style={{ margin: "0 12px 12px" }}>
                    <PrivateReportsPanel
                      viewer={effectiveViewer}
                      employeeWeeks={visibleWeeks}
                      reports={data.privateReports}
                      onSubmit={onSubmitPrivateReport}
                    />
                  </section>
                ) : null}
              </>
            ) : null}

            {activePage === "company-settings" && canViewCompanySettings && data.companySettings ? (
              <CompanySettingsPanel
                companySettings={data.companySettings!}
                stateRules={data.stateRules}
                onSave={onUpdateCompanySettings}
              />
            ) : null}

            {activePage === "team" && canViewTeam ? (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 12px 0" }}>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "8px",
                      border: "none",
                      background: BRAND_ORANGE,
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    type="button"
                  >
                    + Invite a Worker
                  </button>
                </div>
                {inviteSuccessUrl ? (
                  <div
                    style={{
                      margin: "10px 12px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: "#E8F5E9",
                      color: "#2E7D32",
                      fontSize: "13px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <span style={{ minWidth: 0 }}>
                      Invite sent!{" "}
                      <a href={inviteSuccessUrl ?? undefined} target="_blank" rel="noopener noreferrer" style={{ color: "#1565C0" }}>
                        {inviteSuccessUrl}
                      </a>
                    </span>
                    <button
                      onClick={() => setInviteSuccessUrl(null)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "16px" }}
                      type="button"
                    >
                      x
                    </button>
                  </div>
                ) : null}
                <TeamManagementPanel
                  data={data}
                  onOpenAddEmployee={() => setShowAddEmployeeModal(true)}
                  onEditEmployee={(employee) => {
                    console.log("Edit employee:", employee);
                  }}
                />
                <InviteManagementPanel
                  onListInvites={onListInvites}
                  onResendInvite={onResendInvite}
                  onRevokeInvite={onRevokeInvite}
                />
              </>
            ) : null}

            {activePage === "archive" && canViewArchive ? <ArchivePanel archivedEmployees={data.archivedEmployees} /> : null}
          </div>
        </main>

        <PayrollExportModal
          isOpen={showPayrollModal}
          data={data}
          weekStart={data.weekStart}
          onClose={() => setShowPayrollModal(false)}
          onExport={handlePayrollExport}
          onFetchQboPreview={onFetchQboPreview}
          onDownloadQboCsv={onDownloadQboCsv}
          onFetchHistory={onFetchExportHistory}
        />
        <AddEmployeeModal
          isOpen={showAddEmployeeModal}
          crews={data.crews}
          onClose={() => setShowAddEmployeeModal(false)}
          onSave={async (employee) => {
            console.log("New employee data:", employee);
            setShowAddEmployeeModal(false);
          }}
        />
        <InviteEmployeeModal
          isOpen={showInviteModal}
          crews={data.crews}
          onClose={() => setShowInviteModal(false)}
          onCreateInvite={onCreateInvite}
          onInviteSent={(_invite, url) => {
            setShowInviteModal(false);
            if (url) setInviteSuccessUrl(url);
          }}
        />
        <OnboardingOverlay />
        
        <nav
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderTop: "1px solid #E9EDF3",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            paddingBottom: "env(safe-area-inset-bottom)",
            height: "64px",
            zIndex: 200,
            boxShadow: "0 -4px 16px rgba(15,23,42,0.06)",
          }}
        >
          {visibleNavItems.map((item) => {
            const isActive = activePage === item.key;
            let Icon = Home;
            if (item.key === "team") Icon = Users;
            if (item.key === "company-settings" || item.key === "account-settings") Icon = Settings;
            if (item.key === "archive") Icon = Archive;

            return (
              <button
                key={item.key}
                onClick={() => setActivePage(item.key)}
                style={{
                  background: "none",
                  border: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  color: isActive ? BRAND_ORANGE : "#888",
                  minWidth: "64px",
                  minHeight: "48px",
                  cursor: "pointer",
                }}
                type="button"
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{ fontSize: "0.65rem", fontWeight: isActive ? 700 : 500 }}>
                  {item.key === "company-settings" ? "Company" : item.key === "account-settings" ? "Account" : item.label}
                </span>
              </button>
            );
          })}
          <button
            onClick={onLogout}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              color: "#888",
              minWidth: "64px",
              minHeight: "48px",
              cursor: "pointer",
            }}
            type="button"
          >
            <LogOut size={24} strokeWidth={2} />
            <span style={{ fontSize: "0.65rem", fontWeight: 500 }}>Sign out</span>
          </button>
        </nav>
      </div>
    );
  }


  return (
    <div className={`app-shell app-shell--${uiMode}`} style={{ backgroundColor: BRAND_LIGHT, minHeight: "100vh" }}>
      <header
        className="hero hero--app"
        style={{
          backgroundColor: "white",
          borderBottom: `3px solid ${BRAND_ORANGE}`,
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: isScrolled ? "0 4px 12px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.06)",
          padding: isScrolled ? "0.6rem 20px" : "1rem 20px",
          transform: isHeaderVisible ? "translateY(0)" : "translateY(-100%)",
          transition: "padding 0.25s ease, box-shadow 0.25s ease, transform 0.3s ease",
        }}
      >
        <div className="hero__main">
          <div
            className="hero__topbar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <div
              className="hero__brand-block"
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}
            >
              <div
                style={{
                  transform: isScrolled ? "scale(0.92)" : "scale(1)",
                  transformOrigin: "left center",
                  transition: "transform 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                <Logo className="hero__logo" size="app" />
              </div>
              {!isMobileViewport && (
                <h1
                  style={{
                    color: BRAND_DARK,
                    fontWeight: 700,
                    fontSize: isScrolled ? "0.92rem" : "1rem",
                    margin: 0,
                    transition: "font-size 0.2s ease",
                    minWidth: 0,
                  }}
                >
                  {pageTitle[activePage]}
                </h1>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.8rem",
                color: "#666",
                flexShrink: 0,
              }}
            >
              {!isMobileViewport ? <span>Signed in as</span> : null}
              <strong style={{ color: BRAND_DARK }}>{data.viewer.fullName}</strong>
              <span
                style={{
                  backgroundColor: "#F0F0F0",
                  color: "#555",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}
              >
                {effectiveViewer.role}
              </span>
              {!isMobileViewport && data.companySettings ? (
                <span style={{ color: "#888" }}>{data.companySettings?.companyName}</span>
              ) : null}

            </div>
          </div>

          {!isMobileViewport && (
            <p
              className="hero-copy"
              style={{
                color: "#666",
                fontSize: isScrolled ? "0.78rem" : "0.85rem",
                margin: isScrolled ? "0.2rem 0 0.35rem" : "0.4rem 0 0.75rem",
                maxHeight: isScrolled ? 0 : "40px",
                opacity: isScrolled ? 0 : 1,
                overflow: "hidden",
                transition: "all 0.2s ease",
              }}
            >
              {pageSubtitle[activePage]}
            </p>
          )}

          <nav
            className="app-nav"
            style={{
              display: "flex",
              gap: "0.25rem",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {navItems
              .filter((item) => item.visible)
              .map((item) => {
                const isActive = activePage === item.key;
                const isHovered = hoveredNav === item.key;
                return (
                  <button
                    className={[
                      isActive ? "app-nav__item app-nav__item--active" : "app-nav__item",
                      item.key === "team" ? "nav__item--team" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={item.key}
                    onClick={() => setActivePage(item.key)}
                    onMouseEnter={() => setHoveredNav(item.key)}
                    onMouseLeave={() => setHoveredNav(null)}
                    style={{
                      background: isActive ? "rgba(255,140,0,0.08)" : isHovered ? "#F5F5F5" : "none",
                      border: "none",
                      borderBottom: isActive ? `2px solid ${BRAND_ORANGE}` : "2px solid transparent",
                      color: isActive ? BRAND_ORANGE : isHovered ? BRAND_DARK : "#555",
                      fontWeight: isActive ? 700 : 500,
                      padding: "8px 14px",
                      borderRadius: "6px 6px 0 0",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      transition: "all 0.15s ease",
                    }}
                    type="button"
                  >
                    {item.label}
                  </button>
                );
              })}

            <span style={{ flex: 1 }} />

            {uiMode === "office" ? (
              <button
                className="app-nav__export-btn"
                onClick={() => setShowPayrollModal(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(255,140,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                style={{
                  padding: "7px 14px",
                  borderRadius: "6px",
                  backgroundColor: BRAND_ORANGE,
                  color: "white",
                  border: "none",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
                type="button"
              >
                📥 Export Payroll
              </button>
            ) : null}



            <button
              onClick={onboarding.restartTour}
              title="Restart tour"
              aria-label="Restart onboarding tour"
              style={{
                background: "none",
                border: `1.5px solid #DDD`,
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#888",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = BRAND_ORANGE;
                e.currentTarget.style.color = BRAND_ORANGE;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#DDD";
                e.currentTarget.style.color = "#888";
              }}
              type="button"
            >
              ?
            </button>

            <span
              className={`mode-pill mode-pill--${uiMode}`}
              style={{
                backgroundColor: uiMode === "office" ? BRAND_ORANGE : ACCENT_TEAL,
                color: "white",
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.03em",
                boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                textTransform: "uppercase",
              }}
            >
              {uiMode === "truck" ? "Truck" : "Office"}
            </span>

            {activePage === "dashboard" && uiMode === "office" ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.78rem", color: "#666", fontWeight: 500 }}>Week</label>
                <input
                  type="date"
                  value={data.weekStart}
                  onChange={(event) => void onRefresh(event.target.value)}
                  style={{
                    border: `2px solid #EEE`,
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "0.8rem",
                    color: BRAND_DARK,
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = BRAND_ORANGE;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#EEE";
                  }}
                />
              </div>
            ) : activePage === "dashboard" && uiMode === "truck" ? (
              <span style={{ fontSize: "0.78rem", color: "#888" }}>Week: {data.weekStart}</span>
            ) : null}

            <button
              className="app-nav__item"
              onClick={onLogout}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#c00";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#888";
              }}
              style={{
                background: "none",
                border: "none",
                color: "#888",
                fontWeight: 500,
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: "0.875rem",
                transition: "color 0.15s ease",
              }}
              type="button"
            >
              Sign out
            </button>
          </nav>

          {activePage === "dashboard" && uiMode === "office" && visibleWeeks.length > 0 ? (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#888",
                margin: isScrolled ? "0.35rem 0 0" : "0.5rem 0 0",
              }}
            >
              Status: {visibleWeeks.map((week) => prettyStatus(week.status)).join(", ")}
            </p>
          ) : null}
        </div>
      </header>

      {error ? (
        <div
          className="error-banner"
          style={{
            backgroundColor: "rgba(255,140,0,0.08)",
            borderLeft: `4px solid ${BRAND_ORANGE}`,
            color: BRAND_DARK,
            padding: "14px 20px",
            fontSize: "0.875rem",
            margin: "0 20px",
          }}
        >
          {error}
        </div>
      ) : null}

      {uiMode === "office" && hasIncompleteTimesheets && activePage === "dashboard" ? (
        <div
          style={{
            backgroundColor: "rgba(255, 140, 0, 0.06)",
            borderLeft: `4px solid ${BRAND_ORANGE}`,
            padding: "1rem 1.5rem",
            margin: "0 20px",
            borderRadius: "0 8px 8px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem" }}>⚠️</span>
            <div>
              <strong style={{ color: BRAND_DARK, display: "block", fontSize: "0.875rem" }}>
                ACTION REQUIRED
              </strong>
              <span style={{ color: "#5A5A5B", fontSize: "0.8rem" }}>
                {incompleteCount} {incompleteCount === 1 ? "timesheet" : "timesheets"} waiting for
                submission
              </span>
            </div>
          </div>
          <button
            onClick={handleQuickFix}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(255,140,0,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(255,140,0,0.3)";
            }}
            style={{
              backgroundColor: BRAND_ORANGE,
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
              boxShadow: "0 2px 6px rgba(255,140,0,0.3)",
              transition: "all 0.2s ease",
            }}
            type="button"
          >
            Fix now
          </button>
        </div>
      ) : null}

      {!isMobileViewport && (
        <section
          className={`mode-banner mode-banner--${uiMode}`}
          style={{
            backgroundColor: "white",
            borderLeft: `4px solid ${uiMode === "office" ? BRAND_ORANGE : ACCENT_TEAL}`,
            padding: "12px 20px",
            margin: "16px 20px",
            borderRadius: "0 8px 8px 0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <strong style={{ color: BRAND_DARK, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
            {uiMode === "truck" ? "Truck mode" : "Office mode"}
          </strong>
          <span style={{ color: "#666", fontSize: "0.82rem" }}>
            {uiMode === "truck"
              ? "Dashboard stays centered on the current week, Today, and fast field entry. Company settings and archive stay out of the way."
              : "Dashboard handles weekly review, payroll-prep, exports, and office-only reporting. Team, settings, and archive live in dedicated pages."}
          </span>
        </section>
      )}

      <main className="content-grid" style={{ padding: "0 20px 40px" }}>
        {activePage === "dashboard" ? (
          <>
            {uiMode === "office" ? (
              <MissingTimeAlertBanner
                employeeWeeks={data.employeeWeeks}
                onQuickFix={handleQuickFixMissingTime}
                onSendReminders={onSendReminders}
              />
            ) : null}

            <WeeklyCrewBoard
              uiMode={uiMode}
              viewer={effectiveViewer}
              crews={data.crews}
              employeeWeeks={visibleWeeks}
              selectedCrewId={selectedCrewId}
              onSelectCrew={setSelectedCrewId}
              weekStart={data.weekStart}
              todayIso={todayIso}
              currentWeekStart={currentWeekStart}
              onGoToCurrentWeek={() => void onRefresh(currentWeekStart)}
              onUpdateDay={onUpdateDay}
              onApplyCrewDefaults={onApplyCrewDefaults}
              onStatusChange={onStatusChange}
              onReopenWeek={onReopenWeek}
            />

            {uiMode === "office" && effectiveViewer.role === "admin" ? (
              <div className="brand-surface">
                <OfficeDashboard
                  companySettings={data.companySettings}
                  employeeWeeks={data.employeeWeeks}
                  onExport={onExport}
                  onUpdateAdjustment={onUpdateAdjustment}
                  onReopenWeek={onReopenWeek}
                />
              </div>
            ) : null}

            {uiMode === "office" ? (
              <section className="stack brand-surface">
                <PrivateReportsPanel
                  viewer={effectiveViewer}
                  employeeWeeks={visibleWeeks}
                  reports={data.privateReports}
                  onSubmit={onSubmitPrivateReport}
                />
              </section>
            ) : null}
          </>
        ) : null}

        {activePage === "company-settings" && canViewCompanySettings && data.companySettings ? (
          <CompanySettingsPanel
            companySettings={data.companySettings!}
            stateRules={data.stateRules}
            onSave={onUpdateCompanySettings}
          />
        ) : null}

        {activePage === "account-settings" ? (
          <AccountSettingsPanel
            viewer={data.viewer}
            onUpdateMe={onUpdateMe}
          />
        ) : null}

        {activePage === "team" && canViewTeam ? (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
              <button
                onClick={() => setShowInviteModal(true)}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: BRAND_ORANGE,
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                + Invite a Worker
              </button>
            </div>
            {inviteSuccessUrl && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#E8F5E9",
                  color: "#2E7D32",
                  fontSize: "13px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  Invite sent! Dev link:{" "}
                  <a href={inviteSuccessUrl ?? undefined} target="_blank" rel="noopener noreferrer" style={{ color: "#1565C0" }}>
                    {inviteSuccessUrl}
                  </a>
                </span>
                <button
                  onClick={() => setInviteSuccessUrl(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: "16px" }}
                >
                  ×
                </button>
              </div>
            )}
            <TeamManagementPanel
              data={data}
              onOpenAddEmployee={() => setShowAddEmployeeModal(true)}
              onEditEmployee={(employee) => {
                console.log("Edit employee:", employee);
              }}
            />
            <InviteManagementPanel
              onListInvites={onListInvites}
              onResendInvite={onResendInvite}
              onRevokeInvite={onRevokeInvite}
            />
          </>
        ) : null}

        {activePage === "archive" && canViewArchive ? <ArchivePanel archivedEmployees={data.archivedEmployees} /> : null}
      </main>

      <PayrollExportModal
        isOpen={showPayrollModal}
        data={data}
        weekStart={data.weekStart}
        onClose={() => setShowPayrollModal(false)}
        onExport={handlePayrollExport}
        onFetchQboPreview={onFetchQboPreview}
        onDownloadQboCsv={onDownloadQboCsv}
        onFetchHistory={onFetchExportHistory}
      />

      <AddEmployeeModal
        isOpen={showAddEmployeeModal}
        crews={data.crews}
        onClose={() => setShowAddEmployeeModal(false)}
        onSave={async (employee) => {
          console.log("New employee data:", employee);
          setShowAddEmployeeModal(false);
        }}
      />

      <InviteEmployeeModal
        isOpen={showInviteModal}
        crews={data.crews}
        onClose={() => setShowInviteModal(false)}
        onCreateInvite={onCreateInvite}
        onInviteSent={(_invite, url) => {
          setShowInviteModal(false);
          if (url) setInviteSuccessUrl(url);
        }}
      />

      <OnboardingOverlay />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
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

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";
const BRAND_LIGHT = "#F8F9FA";
const ACCENT_TEAL = "#00BCD4";

type UiMode = "truck" | "office";
type AppPage = "dashboard" | "team" | "company-settings" | "archive";

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
    defaultFederalWithholdingMode?: string;
    defaultFederalWithholdingValue?: number;
    defaultStateWithholdingMode?: string;
    defaultStateWithholdingValue?: number;
    payrollPrepDisclaimer?: string;
    pfmlEnabled?: boolean;
    pfmlEmployeeRate?: number;
  }) => Promise<void>;
  onListEmployees: () => Promise<ManagedEmployee[]>;
  onCreateEmployee: (payload: EmployeeInput) => Promise<ManagedEmployee>;
  onUpdateEmployee: (employeeId: string, payload: EmployeeInput) => Promise<ManagedEmployee>;
  onListInvites: () => Promise<InviteSummary[]>;
  onCreateInvite: (payload: InviteInput) => Promise<{ invite: InviteSummary; inviteUrl?: string }>;
  onResendInvite: (inviteId: string) => Promise<void>;
  onRevokeInvite: (inviteId: string) => Promise<void>;
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
  const truckViewportQuery = "(max-width: 720px)";

  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedCrewId, setSelectedCrewId] = useState<string>("all");
  const [openedAt] = useState(() => new Date());
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(truckViewportQuery).matches : false,
  );
  const [modeOverride] = useState<UiMode | null>(null);
  const [activePage, setActivePage] = useState<AppPage>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [inviteSuccessUrl, setInviteSuccessUrl] = useState<string | null>(null);

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
    const result = new Date(openedAt);
    const day = result.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    result.setHours(0, 0, 0, 0);
    result.setDate(result.getDate() + diff);
    const year = result.getFullYear();
    const month = String(result.getMonth() + 1).padStart(2, "0");
    const date = String(result.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  }, [openedAt]);

  const uiMode = useMemo<UiMode>(() => {
    if (modeOverride) {
      return modeOverride;
    }
    if (data.viewer.role === "admin") {
      return "office";
    }
    return isMobileViewport ? "truck" : "office";
  }, [data.viewer.role, isMobileViewport, modeOverride]);

  const canViewCompanySettings = data.viewer.role === "admin" && Boolean(data.companySettings);
  const canViewArchive = data.viewer.role === "admin";
  const canViewTeam = data.viewer.role === "admin";

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
        { key: "archive", label: "Archive", visible: canViewArchive },
      ] as Array<{ key: AppPage; label: string; visible: boolean }>,
    [canViewArchive, canViewCompanySettings, canViewTeam],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
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
    if (uiMode === "truck" && data.weekStart !== currentWeekStart) {
      void onRefresh(currentWeekStart);
    }
  }, [currentWeekStart, data.weekStart, onRefresh, uiMode]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [activePage]);

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

  const pageTitle: Record<AppPage, string> = {
    dashboard:
      uiMode === "truck"
        ? "Current-week crew timecards for the truck."
        : "Weekly time review and payroll-prep for contractor crews.",
    team: "Active employee records and default crew setup.",
    "company-settings": "Company profile and payroll-prep defaults.",
    archive: "Archived employee records and history.",
  };

  const pageSubtitle: Record<AppPage, string> = {
    dashboard:
      uiMode === "truck"
        ? "Mobile-first time entry for foremen and employees, focused on today and the active work week."
        : "Keep the weekly board, payroll-prep review, exports, and next-step workflow in one focused dashboard.",
    team: "Manage employee records, keep worker details current, and send login invites only when someone needs app access.",
    "company-settings": "Update company identity, state support, payroll-prep defaults, and the standing disclaimer without cluttering the weekly dashboard.",
    archive: "Archived employees stay on file for office reference instead of being deleted.",
  };

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
          transition: "all 0.25s ease-in-out",
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
                {data.viewer.role}
              </span>
              {!isMobileViewport && data.companySettings ? (
                <span style={{ color: "#888" }}>{data.companySettings.companyName}</span>
              ) : null}

              {isMobileViewport ? (
                <button
                  className="nav-toggle"
                  onClick={() => setMobileNavOpen((current) => !current)}
                  style={{
                    background: "none",
                    border: `2px solid ${BRAND_ORANGE}`,
                    color: BRAND_ORANGE,
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                  type="button"
                >
                  {mobileNavOpen ? "Close" : "Menu"}
                </button>
              ) : null}
            </div>
          </div>

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

          <nav
            className={
              isMobileViewport ? (mobileNavOpen ? "app-nav app-nav--open" : "app-nav app-nav--mobile") : "app-nav"
            }
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
                width: "32px",
                height: "32px",
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
              viewer={data.viewer}
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

            {uiMode === "office" && data.viewer.role === "admin" ? (
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
                  viewer={data.viewer}
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
            companySettings={data.companySettings}
            stateRules={data.stateRules}
            onSave={onUpdateCompanySettings}
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
                  <a href={inviteSuccessUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#1565C0" }}>
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

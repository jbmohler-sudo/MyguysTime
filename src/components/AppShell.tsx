import { useEffect, useMemo, useState } from "react";
import type { BootstrapPayload, EmployeeInput, InviteInput, InviteSummary, ManagedEmployee, PrivateReportInput, TimesheetStatus } from "../domain/models";
import { prettyStatus } from "../domain/permissions";
import { ArchivePanel } from "./ArchivePanel";
import { CompanySettingsPanel } from "./CompanySettingsPanel";
import { Logo } from "./Logo";
import { OfficeDashboard } from "./OfficeDashboard";
import { PrivateReportsPanel } from "./PrivateReportsPanel";
import { TeamManagementPanel } from "./TeamManagementPanel";
import { WeeklyCrewBoard } from "./WeeklyCrewBoard";

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
  onListEmployees,
  onCreateEmployee,
  onUpdateEmployee,
  onListInvites,
  onCreateInvite,
}: AppShellProps) {
  const truckViewportQuery = "(max-width: 720px)";
  const [selectedCrewId, setSelectedCrewId] = useState<string>("all");
  const [openedAt] = useState(() => new Date());
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(truckViewportQuery).matches : false,
  );
  const [modeOverride] = useState<UiMode | null>(null);
  const [activePage, setActivePage] = useState<AppPage>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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

  return (
    <div className={`app-shell app-shell--${uiMode}`}>
      <header className="hero hero--app">
        <div className="hero__main">
          <div className="hero__topbar">
            <div className="hero__brand-block">
              <Logo className="hero__logo" size="app" />
              <h1>
                {uiMode === "truck"
                  ? "Current-week crew timecards for the truck."
                  : activePage === "team"
                    ? "Active employee records and default crew setup."
                  : activePage === "company-settings"
                    ? "Company profile and payroll-prep defaults."
                    : activePage === "archive"
                      ? "Archived employee records and history."
                      : "Weekly time review and payroll-prep for contractor crews."}
              </h1>
            </div>
            {isMobileViewport ? (
              <button
                className="nav-toggle"
                onClick={() => setMobileNavOpen((current) => !current)}
                type="button"
              >
                {mobileNavOpen ? "Close menu" : "Menu"}
              </button>
            ) : null}
          </div>

          <p className="hero-copy">
            {activePage === "dashboard"
              ? uiMode === "truck"
                ? "Mobile-first time entry for foremen and employees, focused on today and the active work week."
                : "Keep the weekly board, payroll-prep review, exports, and next-step workflow in one focused dashboard."
              : activePage === "team"
                ? "Manage employee records, keep worker details current, and send login invites only when someone needs app access."
                : activePage === "company-settings"
                  ? "Update company identity, state support, payroll-prep defaults, and the standing disclaimer without cluttering the weekly dashboard."
                : "Archived employees stay on file for office reference instead of being deleted."}
          </p>

          <nav className={isMobileViewport ? (mobileNavOpen ? "app-nav app-nav--open" : "app-nav app-nav--mobile") : "app-nav"}>
            {navItems.filter((item) => item.visible).map((item) => (
              <button
                className={activePage === item.key ? "app-nav__item app-nav__item--active" : "app-nav__item"}
                key={item.key}
                onClick={() => setActivePage(item.key)}
                type="button"
              >
                {item.label}
              </button>
            ))}
            <button className="app-nav__item" onClick={onLogout} type="button">
              Sign out
            </button>
          </nav>

          <div className="hero-meta">
            <span className={`mode-pill mode-pill--${uiMode}`}>{uiMode === "truck" ? "Truck mode" : "Office mode"}</span>
            {activePage === "dashboard" ? (
              uiMode === "office" ? (
                <>
                  <span>Week start</span>
                  <input
                    type="date"
                    value={data.weekStart}
                    onChange={(event) => void onRefresh(event.target.value)}
                  />
                  <span>Current status view: {visibleWeeks.map((week) => prettyStatus(week.status)).join(", ") || "No weeks yet"}</span>
                </>
              ) : (
                <span>Current week only: {data.weekStart}</span>
              )
            ) : null}
          </div>
        </div>

        <div className="viewer-card">
          <span className="viewer-label">Signed in as</span>
          <strong>{data.viewer.fullName}</strong>
          <span className="viewer-role">{data.viewer.role}</span>
          {data.companySettings ? <span className="viewer-week">{data.companySettings.companyName}</span> : null}
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}
      <section className={`mode-banner mode-banner--${uiMode}`}>
        <strong>{uiMode === "truck" ? "Truck mode" : "Office mode"}</strong>
        <span>
          {uiMode === "truck"
            ? "Dashboard stays centered on the current week, Today, and fast field entry. Company settings and archive stay out of the way."
            : "Dashboard handles weekly review, payroll-prep, exports, and office-only reporting. Team, settings, and archive live in dedicated pages."}
        </span>
      </section>

      <main className="content-grid">
        {activePage === "dashboard" ? (
          <>
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
              <OfficeDashboard
                companySettings={data.companySettings}
                employeeWeeks={data.employeeWeeks}
                onExport={onExport}
                onUpdateAdjustment={onUpdateAdjustment}
                onReopenWeek={onReopenWeek}
              />
            ) : null}

            {uiMode === "office" ? (
              <section className="stack">
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
          <TeamManagementPanel
            crews={data.crews}
            onLoadEmployees={onListEmployees}
            onCreateEmployee={onCreateEmployee}
            onUpdateEmployee={onUpdateEmployee}
            onLoadInvites={onListInvites}
            onCreateInvite={onCreateInvite}
          />
        ) : null}

        {activePage === "archive" && canViewArchive ? (
          <ArchivePanel archivedEmployees={data.archivedEmployees} />
        ) : null}
      </main>
    </div>
  );
}

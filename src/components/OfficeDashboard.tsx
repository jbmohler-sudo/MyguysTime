import type { CompanySettingsSummary, EmployeeWeek, TimesheetStatus } from "../domain/models";
import { formatCurrency } from "../domain/format";
import { needsEmployeeConfirmation, prettyStatus, statusTone } from "../domain/permissions";
import { StatCard } from "./StatCard";

interface OfficeDashboardProps {
  companySettings: CompanySettingsSummary | null;
  employeeWeeks: EmployeeWeek[];
  onReopenWeek: (timesheetId: string, reopenTo: TimesheetStatus, note: string) => Promise<void>;
}

function formatAuditTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function OfficeDashboard({
  employeeWeeks,
  onReopenWeek,
}: OfficeDashboardProps) {
  const totalHours = employeeWeeks.reduce((sum, item) => sum + item.weeklyTotalHours, 0);
  const lockedWeeks = employeeWeeks.filter((week) => week.status === "office_locked").length;
  const missingConfirmations = employeeWeeks.filter((week) => needsEmployeeConfirmation(week)).length;

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Office Dashboard</p>
          <h2>Weekly time card board</h2>
          <p className="panel-subcopy">
            Review confirmations, weekly hours, and approvals. Payroll is handled separately by the office.
          </p>
        </div>
      </div>

      <div className="stats-row stats-row--office">
        <StatCard label="Total hours this week" value={`${totalHours.toFixed(2)}h`} />
        <StatCard label="Crew members" value={String(employeeWeeks.length)} />
        <StatCard label="Weeks missing confirmation" value={String(missingConfirmations)} />
        <StatCard label="Office locked weeks" value={String(lockedWeeks)} />
      </div>

      <div className="office-week-list">
        {employeeWeeks.map((week) => {
          const latestAudit = week.statusAuditTrail[0];
          const reopenedEvent = week.statusAuditTrail.find(
            (event) =>
              event.fromStatus === "office_locked" &&
              (event.toStatus === "draft" || event.toStatus === "foreman_approved"),
          );
          const isReopened = Boolean(reopenedEvent) && week.status !== "office_locked";

          return (
            <article className="office-week-card" key={week.id}>
              <div className="office-week-card__header">
                <div>
                  <h3>{week.employeeName}</h3>
                  <p>
                    {week.crewName} - {week.weeklyTotalHours.toFixed(2)}h
                    {week.hourlyRate !== null ? ` - ${formatCurrency(week.hourlyRate)}/hr` : ""}
                  </p>
                </div>
                <div className={statusTone(week.status)}>{prettyStatus(week.status)}</div>
              </div>

              <div className="office-week-card__signals">
                <span
                  className={
                    needsEmployeeConfirmation(week)
                      ? "alert-chip alert-chip--warning alert-chip--loud"
                      : "alert-chip alert-chip--ok"
                  }
                >
                  {needsEmployeeConfirmation(week)
                    ? `${week.missingConfirmationDays} day(s) missing confirmation`
                    : "All daily confirmations complete"}
                </span>
                {week.status === "needs_revision" ? (
                  <span className="alert-chip alert-chip--revision">Needs revision</span>
                ) : null}
                {isReopened && reopenedEvent ? (
                  <span className="alert-chip alert-chip--reopened">
                    Reopened by {reopenedEvent.createdByFullName}
                  </span>
                ) : null}
              </div>

              <div className="office-week-card__summary">
                <div>
                  <span>Weekly hours</span>
                  <strong>{week.weeklyTotalHours.toFixed(2)}h</strong>
                </div>
                <div>
                  <span>Overtime</span>
                  <strong>{week.overtimeHours.toFixed(2)}h</strong>
                </div>
              </div>

              {week.statusAuditTrail.length > 0 ? (
                <div className="audit-trail">
                  <strong>Recent status audit</strong>
                  {week.statusAuditTrail.slice(0, 3).map((event) => (
                    <div className="audit-row" key={event.id}>
                      <span className="audit-row__headline">
                        {prettyStatus(event.fromStatus)} to {prettyStatus(event.toStatus)}
                      </span>
                      <span>
                        {event.createdByFullName} - {formatAuditTime(event.createdAt)}
                      </span>
                      <span className="audit-row__note">{event.note || "No note recorded."}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {week.status === "office_locked" ? (
                <div className="status-actions">
                  <button
                    onClick={() => void onReopenWeek(week.id, "draft", "Reopened for office correction.")}
                    type="button"
                  >
                    Quick reopen to draft
                  </button>
                  <button
                    onClick={() =>
                      void onReopenWeek(
                        week.id,
                        "foreman_approved",
                        "Reopened to foreman approved for office correction.",
                      )
                    }
                    type="button"
                  >
                    Quick reopen to approved
                  </button>
                </div>
              ) : null}

              {latestAudit ? (
                <div className="audit-summary">
                  Latest change: {latestAudit.createdByFullName} - {formatAuditTime(latestAudit.createdAt)}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

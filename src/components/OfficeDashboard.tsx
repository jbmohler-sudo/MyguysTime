import { useEffect, useMemo, useState } from "react";
import type { CompanySettingsSummary, EmployeeWeek, TimesheetStatus } from "../domain/models";
import { formatCurrency } from "../domain/format";
import { frontendSentryEnabled, frontendSentryVerificationEnabled } from "../lib/sentry";
import { needsEmployeeConfirmation, prettyStatus, statusTone } from "../domain/permissions";
import { SentryVerificationPanel } from "./SentryVerificationPanel";
import { StatCard } from "./StatCard";

interface OfficeDashboardProps {
  companySettings: CompanySettingsSummary | null;
  employeeWeeks: EmployeeWeek[];
  token: string;
  backendSentryVerificationEnabled: boolean;
  onExport: (kind: "payroll-summary" | "time-detail" | "weekly-summary") => Promise<void>;
  onUpdateAdjustment: (
    timesheetId: string,
    payload: {
      gasReimbursement?: number;
      pettyCashReimbursement?: number;
      deductionAdvance?: number;
      notes?: string;
    },
  ) => Promise<void>;
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

function AdjustmentEditor({
  week,
  onUpdateAdjustment,
}: {
  week: EmployeeWeek;
  onUpdateAdjustment: OfficeDashboardProps["onUpdateAdjustment"];
}) {
  const initialValues = useMemo(
    () => ({
      gas: week.adjustment.gasReimbursement,
      pettyCash: week.adjustment.pettyCashReimbursement,
      deduction: week.adjustment.deductionAdvance,
      notes: week.adjustment.notes,
    }),
    [
      week.adjustment.deductionAdvance,
      week.adjustment.gasReimbursement,
      week.adjustment.notes,
      week.adjustment.pettyCashReimbursement,
    ],
  );
  const [draft, setDraft] = useState(initialValues);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(initialValues);
  }, [initialValues]);

  const isDirty =
    draft.gas !== initialValues.gas ||
    draft.pettyCash !== initialValues.pettyCash ||
    draft.deduction !== initialValues.deduction ||
    draft.notes !== initialValues.notes;

  function reset() {
    setDraft(initialValues);
  }

  async function save() {
    setSaving(true);
    try {
      await onUpdateAdjustment(week.id, {
        gasReimbursement: draft.gas,
        pettyCashReimbursement: draft.pettyCash,
        deductionAdvance: draft.deduction,
        notes: draft.notes,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="adjustment-editor-wrap">
      <div className="adjustment-editor">
        <label>
          Gas reimbursement
          <input
            type="number"
            step="0.01"
            value={draft.gas}
            onChange={(event) => setDraft((current) => ({ ...current, gas: Number(event.target.value) }))}
          />
        </label>
        <label>
          Petty cash reimbursement
          <input
            type="number"
            step="0.01"
            value={draft.pettyCash}
            onChange={(event) =>
              setDraft((current) => ({ ...current, pettyCash: Number(event.target.value) }))
            }
          />
        </label>
        <label>
          Deduction / advance
          <input
            type="number"
            step="0.01"
            value={draft.deduction}
            onChange={(event) =>
              setDraft((current) => ({ ...current, deduction: Number(event.target.value) }))
            }
          />
        </label>
        <label className="adjustment-editor__notes">
          Office note
          <textarea
            rows={2}
            value={draft.notes}
            onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
          />
        </label>
      </div>
      <div className="adjustment-actions">
        <button disabled={!isDirty || saving} onClick={() => void save()} type="button">
          {saving ? "Saving..." : "Save adjustments"}
        </button>
        <button disabled={!isDirty || saving} onClick={reset} type="button">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function OfficeDashboard({
  companySettings,
  employeeWeeks,
  token,
  backendSentryVerificationEnabled,
  onExport,
  onUpdateAdjustment,
  onReopenWeek,
}: OfficeDashboardProps) {
  const totalGross = employeeWeeks.reduce((sum, item) => sum + item.payrollEstimate.grossPay, 0);
  const totalNet = employeeWeeks.reduce((sum, item) => sum + item.payrollEstimate.netCheckEstimate, 0);
  const reimbursements = employeeWeeks.reduce((sum, item) => sum + item.payrollEstimate.reimbursements, 0);
  const lockedWeeks = employeeWeeks.filter((week) => week.status === "office_locked").length;
  const missingConfirmations = employeeWeeks.filter((week) => needsEmployeeConfirmation(week)).length;
  const exportLabelSuffix = lockedWeeks > 0 ? " - Final (locked)" : "";

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Office Dashboard</p>
          <h2>Weekly payroll-prep review and export</h2>
          <p className="panel-subcopy">
            Missing confirmations, approval state, grouped adjustments, and final check estimate are visible in one office workflow.
          </p>
          <p className="panel-subcopy panel-subcopy--strong">
            {companySettings?.payrollReminder ?? "Estimates only - verify before issuing checks."}
          </p>
        </div>
        <div className="toolbar toolbar--exports">
          <button className="button-strong" onClick={() => void onExport("payroll-summary")} type="button">
            Export payroll summary CSV{exportLabelSuffix}
          </button>
          <button className="button-strong" onClick={() => void onExport("time-detail")} type="button">
            Export time detail CSV{exportLabelSuffix}
          </button>
          <button className="button-strong" onClick={() => void onExport("weekly-summary")} type="button">
            Open printable weekly summary{exportLabelSuffix}
          </button>
        </div>
      </div>

      <div className="stats-row stats-row--office">
        <StatCard label="Total gross" value={formatCurrency(totalGross)} />
        <StatCard label="Net estimate" value={formatCurrency(totalNet)} helper="Primary office scan number" />
        <StatCard label="Reimbursements" value={formatCurrency(reimbursements)} />
        <StatCard label="Weeks missing confirmation" value={String(missingConfirmations)} />
        <StatCard label="Office locked weeks" value={String(lockedWeeks)} />
      </div>

      {companySettings && companySettings.supportLevel !== "full" ? (
        <div className="workflow-banner">
          <strong>
            {companySettings.supportLevel === "unsupported"
              ? "Unsupported state payroll support"
              : "Manual state review required"}
          </strong>
          <span>{companySettings.stateDisclaimer}</span>
        </div>
      ) : null}

      <SentryVerificationPanel
        token={token}
        frontendEnabled={frontendSentryEnabled}
        frontendVerificationEnabled={frontendSentryVerificationEnabled}
        backendVerificationEnabled={backendSentryVerificationEnabled}
      />

      <div className="office-week-list">
        {employeeWeeks.map((week) => {
          const latestAudit = week.statusAuditTrail[0];
          const hasAdjustments =
            week.adjustment.gasReimbursement !== 0 ||
            week.adjustment.pettyCashReimbursement !== 0 ||
            week.adjustment.deductionAdvance !== 0;
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
                <span className="alert-chip alert-chip--net alert-chip--net-strong">
                  Net check estimate: {formatCurrency(week.payrollEstimate.netCheckEstimate)}
                </span>
                {week.status === "needs_revision" ? (
                  <span className="alert-chip alert-chip--revision">Needs revision</span>
                ) : null}
                {hasAdjustments ? <span className="alert-chip alert-chip--adjusted">Adjusted</span> : null}
                {isReopened && reopenedEvent ? (
                  <span className="alert-chip alert-chip--reopened">
                    Reopened by {reopenedEvent.createdByFullName}
                  </span>
                ) : null}
              </div>

              <div className="office-week-card__summary">
                <div>
                  <span>Gross pay</span>
                  <strong>{formatCurrency(week.payrollEstimate.grossPay)}</strong>
                </div>
                <div>
                  <span>Withholding est.</span>
                  <strong>
                    {formatCurrency(
                      week.payrollEstimate.federalWithholding + week.payrollEstimate.stateWithholding,
                    )}
                  </strong>
                </div>
                <div>
                  <span>Adjustments</span>
                  <strong>
                    {formatCurrency(
                      week.payrollEstimate.reimbursements - week.payrollEstimate.deductions,
                    )}
                  </strong>
                </div>
                {week.payrollEstimate.pfmlWithholding > 0 ? (
                  <div>
                    <span>PFML</span>
                    <strong>{formatCurrency(week.payrollEstimate.pfmlWithholding)}</strong>
                  </div>
                ) : null}
                <div className="office-week-card__summary-main">
                  <span>Final check estimate</span>
                  <strong>{formatCurrency(week.payrollEstimate.netCheckEstimate)}</strong>
                </div>
              </div>

              <AdjustmentEditor week={week} onUpdateAdjustment={onUpdateAdjustment} />

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
                    onClick={() => void onReopenWeek(week.id, "draft", "Reopened for office adjustments.")}
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

              {week.exportedAt && week.exportedByFullName ? (
                <div className="audit-summary">
                  Final export recorded: {week.exportedByFullName} - {formatAuditTime(week.exportedAt)}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

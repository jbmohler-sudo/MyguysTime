import { useEffect, useMemo, useRef, useState } from "react";
import type { DayEntry, EmployeeWeek, TimesheetStatus, Viewer } from "../domain/models";
import { adjustTimeValue, formatCurrency, formatDayCardDate } from "../domain/format";
import { PayrollYtdSummaryGrid, workerTypeLabel } from "./PayrollYtdSummaryGrid";
import {
  canApproveWeek,
  canConfirmWeek,
  canEditTimesheet,
  canOfficeLock,
  needsEmployeeConfirmation,
  prettyStatus,
  statusTone,
} from "../domain/permissions";

type UiMode = "truck" | "office";

interface EmployeeCardProps {
  uiMode: UiMode;
  viewer: Viewer;
  employeeWeek: EmployeeWeek;
  todayIso: string;
  onUpdateDay: (timesheetId: string, dayEntryId: string, payload: Record<string, unknown>) => Promise<void>;
  onStatusChange: (timesheetId: string, status: TimesheetStatus, note?: string) => Promise<void>;
  onReopenWeek: (timesheetId: string, reopenTo: TimesheetStatus, note: string) => Promise<void>;
}

function currentClockTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function formatTruckDayTabLabel(dayLabel: string, value: string) {
  const date = new Date(`${value}T00:00:00`);
  const dayOfMonth = new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(date);
  return `${dayLabel.charAt(0)} ${dayOfMonth}`;
}

function DayEditor({
  uiMode,
  viewer,
  employeeWeek,
  entry,
  todayIso,
  dayRef,
  onUpdateDay,
}: {
  uiMode: UiMode;
  viewer: Viewer;
  employeeWeek: EmployeeWeek;
  entry: DayEntry;
  todayIso: string;
  dayRef?: (node: HTMLDivElement | null) => void;
  onUpdateDay: (timesheetId: string, dayEntryId: string, payload: Record<string, unknown>) => Promise<void>;
}) {
  const editable = canEditTimesheet(viewer.role, viewer.employeeId, employeeWeek);
  const [start, setStart] = useState(entry.start);
  const [end, setEnd] = useState(entry.end);
  const [lunchMinutes, setLunchMinutes] = useState(entry.lunchMinutes);
  const [jobTag, setJobTag] = useState(entry.jobTag ?? "");
  const [activeField, setActiveField] = useState<"start" | "end" | null>(null);
  const isToday = entry.date === todayIso;
  const todayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (uiMode !== "truck" || !isToday || !todayRef.current) {
      return;
    }

    todayRef.current.focus();
    todayRef.current.scrollIntoView({ block: "nearest", inline: "start", behavior: "smooth" });
  }, [isToday, uiMode]);

  async function save(payload: Record<string, unknown>) {
    await onUpdateDay(employeeWeek.id, entry.id, payload);
  }

  async function adjustActiveTime(minutes: number) {
    const targetField = activeField ?? "end";
    const currentValue = targetField === "start" ? start : end;
    const nextValue = adjustTimeValue(currentValue || "00:00", minutes);

    if (targetField === "start") {
      setStart(nextValue);
      await save({ start: nextValue });
      return;
    }

    setEnd(nextValue);
    await save({ end: nextValue });
  }

  const startField = (
    <label className={activeField === "start" ? "day-field day-field--active" : "day-field"}>
      Start
      <input
        disabled={!editable}
        type="time"
        value={start}
        onClick={() => setActiveField("start")}
        onChange={(event) => setStart(event.target.value)}
        onFocus={() => setActiveField("start")}
        onBlur={() => void save({ start })}
      />
    </label>
  );

  const endField = (
    <label className={activeField === "end" ? "day-field day-field--active" : "day-field"}>
      End
      <input
        disabled={!editable}
        type="time"
        value={end}
        onClick={() => setActiveField("end")}
        onChange={(event) => setEnd(event.target.value)}
        onFocus={() => setActiveField("end")}
        onBlur={() => void save({ end })}
      />
    </label>
  );

  const lunchField = (
    <label className={uiMode === "truck" ? "day-field day-field--truck-detail" : undefined}>
      Lunch
      <input
        disabled={!editable}
        min={0}
        type="number"
        value={lunchMinutes}
        onChange={(event) => setLunchMinutes(Number(event.target.value))}
        onBlur={() => void save({ lunchMinutes })}
      />
    </label>
  );

  const jobTagField = (
    <label className={uiMode === "truck" ? "day-field day-field--truck-detail" : undefined}>
      Job tag
      <input
        disabled={!editable}
        type="text"
        value={jobTag}
        onChange={(event) => setJobTag(event.target.value)}
        onBlur={() => void save({ jobTag })}
      />
    </label>
  );


  return (
    <div
      className={`${isToday ? "day-cell day-cell--today" : "day-cell"} ${uiMode === "truck" ? "day-cell--truck" : ""}`}
      ref={(node) => {
        if (isToday) {
          todayRef.current = node;
        }

        if (!dayRef) {
          return;
        }

        dayRef(node);
      }}
      tabIndex={isToday ? -1 : undefined}
    >
      <div className="day-cell__top">
        <div className="day-cell__title">
          <strong>{formatDayCardDate(entry.date)}</strong>
          {isToday ? <span className="today-badge">Today</span> : null}
        </div>
        <span>{entry.totalHours.toFixed(2)}h</span>
      </div>
      {uiMode === "truck" ? <div className="truck-time-pair">{startField}{endField}</div> : startField}
      {uiMode === "truck" ? null : endField}
      <div className="adjust-row">
        <button disabled={!editable} onClick={() => void adjustActiveTime(-5)} type="button">
          -5m
        </button>
        <button disabled={!editable} onClick={() => void adjustActiveTime(5)} type="button">
          +5m
        </button>
      </div>
      {uiMode === "truck" ? (
        <div className="quick-action-row">
          <button
            disabled={!editable}
            onClick={() => {
              const nextValue = currentClockTime();
              setStart(nextValue);
              setActiveField("start");
              void save({ start: nextValue });
            }}
            type="button"
          >
            Start day
          </button>
          <button
            disabled={!editable}
            onClick={() => {
              const nextValue = currentClockTime();
              setEnd(nextValue);
              setActiveField("end");
              void save({ end: nextValue });
            }}
            type="button"
          >
            End day
          </button>
          <button
            className="button-strong"
            disabled={!editable}
            onClick={() => void save({ employeeConfirmed: true })}
            type="button"
          >
            Confirm day
          </button>
        </div>
      ) : null}
      {uiMode === "truck" ? <div className="truck-detail-pair">{lunchField}{jobTagField}</div> : lunchField}
      {uiMode === "truck" ? null : jobTagField}
      {uiMode === "office" ? (
        <label className="checkbox-row">
          <input
            checked={entry.employeeConfirmed}
            disabled={!editable}
            type="checkbox"
            onChange={(event) => void save({ employeeConfirmed: event.target.checked })}
          />
          Daily confirmed
        </label>
      ) : (
        <div className="day-confirmation-label">
          {entry.employeeConfirmed ? "Confirmed for today" : "Not confirmed yet"}
        </div>
      )}
    </div>
  );
}

export function EmployeeCard({
  uiMode,
  viewer,
  employeeWeek,
  todayIso,
  onUpdateDay,
  onStatusChange,
  onReopenWeek,
}: EmployeeCardProps) {
  const showRates = uiMode === "office" && employeeWeek.hourlyRate !== null;
  const [reopenNote, setReopenNote] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [activeTruckDayIndex, setActiveTruckDayIndex] = useState(() => {
    const todayIndex = employeeWeek.entries.findIndex((entry) => entry.date === todayIso);
    return todayIndex >= 0 ? todayIndex : 0;
  });
  const editable = canEditTimesheet(viewer.role, viewer.employeeId, employeeWeek);
  const canFlagRevision =
    uiMode === "office" &&
    (viewer.role === "admin" || viewer.role === "foreman") &&
    employeeWeek.status !== "office_locked" &&
    employeeWeek.status !== "needs_revision";

  let workflowMessage = "Review each day, then move the week forward when everything looks right.";
  if (viewer.role === "employee") {
    workflowMessage =
      employeeWeek.status === "office_locked"
        ? "This week is office locked and read-only."
        : employeeWeek.status === "needs_revision"
          ? "This week was flagged for revision. Update your hours and submit it again."
        : "Confirm your daily hours, then submit the week when everything is correct.";
  } else if (viewer.role === "foreman") {
    workflowMessage =
      employeeWeek.status === "office_locked"
        ? "Office locked this week. Reopen is required before more edits."
        : employeeWeek.status === "needs_revision"
          ? "This week is waiting on worker revisions before it moves forward."
        : "Review crew time, clean up gaps, then approve the week.";
  } else if (employeeWeek.status === "needs_revision") {
    workflowMessage = "Needs revision is active. Worker editing is unlocked until the week is resubmitted.";
  } else if (employeeWeek.status === "office_locked") {
    workflowMessage = "Office locked this week. Reopen with an audit note before any further edits.";
  }

  useEffect(() => {
    if (uiMode !== "truck") {
      return;
    }

    const todayIndex = employeeWeek.entries.findIndex((entry) => entry.date === todayIso);
    setActiveTruckDayIndex(todayIndex >= 0 ? todayIndex : 0);
  }, [employeeWeek.entries, todayIso, uiMode]);

  function jumpToTruckDay(index: number) {
    setActiveTruckDayIndex(index);
  }

  const activeTruckEntry = useMemo(() => {
    return employeeWeek.entries[activeTruckDayIndex] ?? employeeWeek.entries[0];
  }, [activeTruckDayIndex, employeeWeek.entries]);

  return (
    <article className={`employee-card ${uiMode === "truck" ? "employee-card--truck" : ""}`}>
      <div className="employee-card__header">
        <div>
          <h3>{employeeWeek.employeeName}</h3>
          <p>
            {employeeWeek.crewName}
            {showRates ? ` - ${formatCurrency(employeeWeek.hourlyRate!)}/hr` : ""}
          </p>
        </div>
        <div className={statusTone(employeeWeek.status)}>{prettyStatus(employeeWeek.status)}</div>
      </div>

      <div className="employee-card__alerts">
        {needsEmployeeConfirmation(employeeWeek) ? (
          <span className="alert-chip alert-chip--warning">
            {employeeWeek.missingConfirmationDays} day(s) still need confirmation
          </span>
        ) : (
          <span className="alert-chip alert-chip--ok">All daily confirmations complete</span>
        )}
        {employeeWeek.status === "foreman_approved" ? (
          <span className="alert-chip alert-chip--ok">Foreman approved and ready for office lock</span>
        ) : null}
        {employeeWeek.status === "needs_revision" ? (
          <span className="alert-chip alert-chip--revision">Needs revision</span>
        ) : null}
        {employeeWeek.status === "office_locked" ? (
          <span className="alert-chip alert-chip--locked">Office locked</span>
        ) : null}
      </div>

      {!editable ? (
        <div className={uiMode === "truck" ? "workflow-banner workflow-banner--truck-compact" : "workflow-banner"}>
          <strong>Read-only</strong>
          <span>{workflowMessage}</span>
        </div>
      ) : uiMode === "office" ? (
        <div className="workflow-banner workflow-banner--soft">
          <strong>Next step</strong>
          <span>{workflowMessage}</span>
        </div>
      ) : viewer.role !== "employee" ? (
        <div className="workflow-banner workflow-banner--soft workflow-banner--truck-compact">
          <strong>Next step</strong>
          <span>{workflowMessage}</span>
        </div>
      ) : null}

      {uiMode === "truck" ? (
        <div className="truck-day-nav" aria-label={`${employeeWeek.employeeName} week days`}>
          {employeeWeek.entries.map((entry, index) => {
            const isToday = entry.date === todayIso;
            const isActive = index === activeTruckDayIndex;
            return (
              <button
                className={isActive ? "truck-day-nav__button truck-day-nav__button--active" : "truck-day-nav__button"}
                key={entry.id}
                onClick={() => jumpToTruckDay(index)}
                type="button"
              >
                <strong>{formatTruckDayTabLabel(entry.dayLabel, entry.date)}</strong>
                {isToday ? <em>Today</em> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {uiMode === "truck" ? (
        <div className="day-grid day-grid--truck-single">
          <DayEditor
            key={activeTruckEntry.id}
            uiMode={uiMode}
            viewer={viewer}
            employeeWeek={employeeWeek}
            entry={activeTruckEntry}
            todayIso={todayIso}
            onUpdateDay={onUpdateDay}
          />
        </div>
      ) : (
        <div className="day-grid">
          {employeeWeek.entries.map((entry) => (
            <DayEditor
              key={entry.id}
              uiMode={uiMode}
              viewer={viewer}
              employeeWeek={employeeWeek}
              entry={entry}
              todayIso={todayIso}
              onUpdateDay={onUpdateDay}
            />
          ))}
        </div>
      )}

      {uiMode === "office" ? (
        <>
          <div className="employee-card__footer employee-card__footer--actions">
            <div className="employee-card__metrics">
              <div>
                <span>Weekly total</span>
                <strong>{employeeWeek.weeklyTotalHours.toFixed(2)}h</strong>
              </div>
              <div>
                <span>Overtime</span>
                <strong>{employeeWeek.overtimeHours.toFixed(2)}h</strong>
              </div>
              <div className="employee-card__net">
                <span>Net check estimate</span>
                <strong>{formatCurrency(employeeWeek.payrollEstimate.netCheckEstimate)}</strong>
              </div>
            </div>
            <div className="employee-card__workflow">
              <span className="employee-card__workflow-label">Weekly action</span>
              <div className="status-actions">
                {canConfirmWeek(viewer.role, viewer.employeeId, employeeWeek) ? (
                  <button
                    className="button-strong"
                    onClick={() => void onStatusChange(employeeWeek.id, "employee_confirmed")}
                    type="button"
                  >
                    Confirm week
                  </button>
                ) : null}
                {canApproveWeek(viewer.role, employeeWeek) ? (
                  <button
                    className="button-strong"
                    onClick={() => void onStatusChange(employeeWeek.id, "foreman_approved")}
                    type="button"
                  >
                    Approve week
                  </button>
                ) : null}
                {canOfficeLock(viewer.role, employeeWeek) ? (
                  <button
                    className="button-strong"
                    onClick={() => void onStatusChange(employeeWeek.id, "office_locked")}
                    type="button"
                  >
                    Lock for payroll
                  </button>
                ) : null}
              </div>
              <p className="employee-card__workflow-hint">{workflowMessage}</p>
            </div>
          </div>
          <PayrollYtdSummaryGrid
            className="employee-card__ytd"
            summary={employeeWeek.ytdSummary}
            heading={`${employeeWeek.ytdSummary.calendarYear} YTD reporting`}
            subcopy={`${workerTypeLabel(employeeWeek.workerType)} totals only. This is reporting, not tax filing.`}
          />
        </>
      ) : (
        <div className="truck-week-actions">
          {canConfirmWeek(viewer.role, viewer.employeeId, employeeWeek) ? (
            <button
              className="button-strong"
              onClick={() => void onStatusChange(employeeWeek.id, "employee_confirmed")}
              type="button"
            >
              Confirm week
            </button>
          ) : null}
          {canApproveWeek(viewer.role, employeeWeek) ? (
            <button
              className="button-strong"
              onClick={() => void onStatusChange(employeeWeek.id, "foreman_approved")}
              type="button"
            >
              Approve week
            </button>
          ) : null}
        </div>
      )}

      {canFlagRevision ? (
        <div className="reopen-panel">
          <label>
            Revision audit note
            <textarea
              rows={2}
              value={revisionNote}
              onChange={(event) => setRevisionNote(event.target.value)}
            />
          </label>
          <div className="status-actions">
            <button
              disabled={!revisionNote.trim()}
              onClick={() => void onStatusChange(employeeWeek.id, "needs_revision", revisionNote)}
              type="button"
            >
              Mark needs revision
            </button>
          </div>
        </div>
      ) : null}

      {uiMode === "office" && viewer.role === "admin" && employeeWeek.status === "office_locked" ? (
        <div className="reopen-panel">
          <label>
            Reopen audit note
            <textarea
              rows={2}
              value={reopenNote}
              onChange={(event) => setReopenNote(event.target.value)}
            />
          </label>
          <div className="status-actions">
            <button onClick={() => void onReopenWeek(employeeWeek.id, "draft", reopenNote)} type="button">
              Reopen to draft
            </button>
            <button
              onClick={() => void onReopenWeek(employeeWeek.id, "foreman_approved", reopenNote)}
              type="button"
            >
              Reopen to foreman approved
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

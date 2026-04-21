import { useMemo, useState } from "react";
import type { CrewSummary, EmployeeWeek, TimesheetStatus, Viewer } from "../domain/models";
import { EmployeeCard } from "./EmployeeCard";

type UiMode = "truck" | "office";

interface WeeklyCrewBoardProps {
  uiMode: UiMode;
  viewer: Viewer;
  crews: CrewSummary[];
  employeeWeeks: EmployeeWeek[];
  selectedCrewId: string;
  onSelectCrew: (crewId: string) => void;
  weekStart: string;
  todayIso: string;
  currentWeekStart: string;
  onGoToCurrentWeek: () => void;
  onUpdateDay: (timesheetId: string, dayEntryId: string, payload: Record<string, unknown>) => Promise<void>;
  onApplyCrewDefaults: (payload: {
    crewId: string;
    weekStart: string;
    dayIndex: number;
    start: string;
    end: string;
  }) => Promise<void>;
  onStatusChange: (timesheetId: string, status: TimesheetStatus) => Promise<void>;
  onReopenWeek: (timesheetId: string, reopenTo: TimesheetStatus, note: string) => Promise<void>;
}

export function WeeklyCrewBoard({
  uiMode,
  viewer,
  crews,
  employeeWeeks,
  selectedCrewId,
  onSelectCrew,
  weekStart,
  todayIso,
  currentWeekStart,
  onGoToCurrentWeek,
  onUpdateDay,
  onApplyCrewDefaults,
  onStatusChange,
  onReopenWeek,
}: WeeklyCrewBoardProps) {
  const [dayIndex, setDayIndex] = useState(0);
  const [start, setStart] = useState("07:00");
  const [end, setEnd] = useState("15:30");
  const selectedCrew = useMemo(
    () => crews.find((crew) => crew.id === selectedCrewId) ?? crews[0] ?? null,
    [crews, selectedCrewId],
  );

  const canApplyDefaults = viewer.role === "admin" || viewer.role === "foreman";
  const weekContext =
    weekStart === currentWeekStart ? "current" : weekStart < currentWeekStart ? "past" : "future";
  const weekContextLabel =
    weekContext === "current" ? "Current week" : weekContext === "past" ? "Past week" : "Future week";

  return (
    <section className={`panel ${uiMode === "truck" ? "panel--truck" : ""}`}>
      <div className="panel__header">
        <div>
          <p className="eyebrow">Weekly Crew Board</p>
          <h2>{uiMode === "truck" ? "Current-week day cards" : "Live employee cards for 7-day time review"}</h2>
          <div className="week-context-row">
            <span className={`week-context-chip week-context-chip--${weekContext}`}>{weekContextLabel}</span>
            {weekContext !== "current" ? (
              <span className="week-context-note">You are reviewing a week outside the current live crew week.</span>
            ) : (
              <span className="week-context-note">This selected week includes today.</span>
            )}
          </div>
        </div>
        <div className="toolbar toolbar--stack">
          <label>
            Crew
            <select value={selectedCrewId} onChange={(event) => onSelectCrew(event.target.value)}>
              <option value="all">All visible crews</option>
              {crews.map((crew) => (
                <option key={crew.id} value={crew.id}>
                  {crew.name}
                </option>
              ))}
            </select>
          </label>
          {weekContext !== "current" ? (
            <button onClick={onGoToCurrentWeek} type="button">
              Go to current week
            </button>
          ) : null}
          {uiMode === "office" && canApplyDefaults && selectedCrew ? (
            <div className="crew-defaults">
              <label>
                Day
                <select value={dayIndex} onChange={(event) => setDayIndex(Number(event.target.value))}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, index) => (
                    <option key={label} value={index}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Start
                <input type="time" value={start} onChange={(event) => setStart(event.target.value)} />
              </label>
              <label>
                End
                <input type="time" value={end} onChange={(event) => setEnd(event.target.value)} />
              </label>
              <button
                type="button"
                onClick={() =>
                  void onApplyCrewDefaults({
                    crewId: selectedCrew.id,
                    weekStart,
                    dayIndex,
                    start,
                    end,
                  })
                }
              >
                Apply to crew
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="employee-list">
        {employeeWeeks.map((employeeWeek) => (
          <EmployeeCard
            key={employeeWeek.id}
            uiMode={uiMode}
            viewer={viewer}
            employeeWeek={employeeWeek}
            todayIso={todayIso}
            onUpdateDay={onUpdateDay}
            onStatusChange={onStatusChange}
            onReopenWeek={onReopenWeek}
          />
        ))}
      </div>
    </section>
  );
}

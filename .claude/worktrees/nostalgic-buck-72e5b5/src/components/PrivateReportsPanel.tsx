import { FormEvent, useMemo, useState } from "react";
import type { EmployeeWeek, PrivateReport, PrivateReportInput, Viewer } from "../domain/models";

interface PrivateReportsPanelProps {
  viewer: Viewer;
  employeeWeeks: EmployeeWeek[];
  reports: PrivateReport[];
  onSubmit: (payload: PrivateReportInput) => Promise<void>;
}

export function PrivateReportsPanel({
  viewer,
  employeeWeeks,
  reports,
  onSubmit,
}: PrivateReportsPanelProps) {
  const [form, setForm] = useState<PrivateReportInput>({
    employeeId: employeeWeeks[0]?.employeeId ?? "",
    crewId: employeeWeeks[0]?.crewId ?? "",
    date: employeeWeeks[0]?.entries[0]?.date ?? "2026-04-13",
    category: "tardiness",
    severity: "low",
    factualDescription: "",
    jobTag: "",
  });
  const submitVisible = viewer.role === "admin" || viewer.role === "foreman";
  const reportListVisible = viewer.role === "admin";
  const employees = useMemo(
    () =>
      employeeWeeks.map((week) => ({
        employeeId: week.employeeId,
        employeeName: week.employeeName,
        crewId: week.crewId,
      })),
    [employeeWeeks],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(form);
    setForm((current) => ({ ...current, factualDescription: "", jobTag: "" }));
  }

  return (
    <section className="panel compact-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Private Reports</p>
          <h2>Office-only employee reporting</h2>
        </div>
      </div>

      {submitVisible ? (
        <form className="report-form" onSubmit={handleSubmit}>
          <label>
            Employee
            <select
              value={form.employeeId}
              onChange={(event) => {
                const selected = employees.find((item) => item.employeeId === event.target.value);
                setForm((current) => ({
                  ...current,
                  employeeId: event.target.value,
                  crewId: selected?.crewId ?? current.crewId,
                }));
              }}
            >
              {employees.map((employee) => (
                <option key={employee.employeeId} value={employee.employeeId}>
                  {employee.employeeName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
            />
          </label>
          <label>
            Category
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
            >
              {[
                "tardiness",
                "no-show",
                "workmanship issue",
                "insubordination",
                "safety issue",
                "customer complaint",
                "other",
              ].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            Severity
            <select
              value={form.severity}
              onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value }))}
            >
              {["low", "medium", "high"].map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
            </select>
          </label>
          <label>
            Job tag
            <input
              type="text"
              value={form.jobTag}
              onChange={(event) => setForm((current) => ({ ...current, jobTag: event.target.value }))}
            />
          </label>
          <label>
            Factual description
            <textarea
              rows={4}
              value={form.factualDescription}
              onChange={(event) =>
                setForm((current) => ({ ...current, factualDescription: event.target.value }))
              }
            />
          </label>
          <button type="submit">Submit private report</button>
        </form>
      ) : null}

      {reportListVisible ? (
        <div className="report-list">
          {reports.map((report) => (
            <article className="report-card" key={report.id}>
              <div className="report-card__header">
                <strong>{report.employeeName}</strong>
                <span>{report.followUpStatus}</span>
              </div>
              <p>
                {report.category} · {report.severity} · {report.date}
              </p>
              <p>{report.factualDescription}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">Submitted reports stay office-only and are hidden from crew members.</div>
      )}
    </section>
  );
}

import { useMemo } from "react";
import type { EmployeeWeek, WorkerType, YtdPayrollSummary } from "../domain/models";
import { formatCurrency } from "../domain/format";
import { PayrollYtdSummaryGrid, grossPaymentsLabel, workerTypeLabel } from "./PayrollYtdSummaryGrid";
import { StatCard } from "./StatCard";

interface YtdReportingPanelProps {
  employeeWeeks: EmployeeWeek[];
}

function buildEmptySummary(workerType: WorkerType, calendarYear: number): YtdPayrollSummary {
  return {
    calendarYear,
    workerType,
    grossPayments: 0,
    reimbursements: 0,
    deductions: 0,
    netEstimate: 0,
  };
}

function sumYtdSummaries(summaries: YtdPayrollSummary[], workerType: WorkerType, calendarYear: number) {
  return summaries.reduce(
    (totals, summary) => ({
      ...totals,
      grossPayments: totals.grossPayments + summary.grossPayments,
      reimbursements: totals.reimbursements + summary.reimbursements,
      deductions: totals.deductions + summary.deductions,
      netEstimate: totals.netEstimate + summary.netEstimate,
    }),
    buildEmptySummary(workerType, calendarYear),
  );
}

export function YtdReportingPanel({ employeeWeeks }: YtdReportingPanelProps) {
  const calendarYear = employeeWeeks[0]?.ytdSummary.calendarYear ?? new Date().getFullYear();
  const ytdRows = useMemo(
    () =>
      employeeWeeks
        .map((week) => ({
          employeeId: week.employeeId,
          employeeName: week.employeeName,
          crewName: week.crewName,
          workerType: week.workerType,
          summary: week.ytdSummary,
        }))
        .sort((left, right) => {
          if (left.workerType !== right.workerType) {
            return left.workerType.localeCompare(right.workerType);
          }

          return left.employeeName.localeCompare(right.employeeName);
        }),
    [employeeWeeks],
  );
  const employeeSummaries = ytdRows.filter((row) => row.workerType === "employee").map((row) => row.summary);
  const contractorSummaries = ytdRows
    .filter((row) => row.workerType === "contractor_1099")
    .map((row) => row.summary);
  const employeeTotals = sumYtdSummaries(employeeSummaries, "employee", calendarYear);
  const contractorTotals = sumYtdSummaries(contractorSummaries, "contractor_1099", calendarYear);
  const combinedNetEstimate = employeeTotals.netEstimate + contractorTotals.netEstimate;

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">YTD Reporting</p>
          <h2>{calendarYear} year-to-date pay and payment reporting</h2>
          <p className="panel-subcopy">
            Reporting only for office review. This does not generate tax forms or filing records.
          </p>
        </div>
      </div>

      <div className="stats-row stats-row--office">
        <StatCard label="Employee YTD gross" value={formatCurrency(employeeTotals.grossPayments)} />
        <StatCard label="1099 YTD payments" value={formatCurrency(contractorTotals.grossPayments)} />
        <StatCard label="Combined YTD est. net" value={formatCurrency(combinedNetEstimate)} />
      </div>

      <div className="ytd-summary-grid">
        <PayrollYtdSummaryGrid
          summary={employeeTotals}
          heading="Employees"
          subcopy="Payroll-prep reporting only"
        />
        <PayrollYtdSummaryGrid
          summary={contractorTotals}
          heading="1099 contractors"
          subcopy="Payment reporting only"
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Worker</th>
              <th>Type</th>
              <th>{calendarYear} gross/payments</th>
              <th>Reimbursements</th>
              <th>Deductions</th>
              <th>Estimated net</th>
            </tr>
          </thead>
          <tbody>
            {ytdRows.map((row) => (
              <tr key={row.employeeId}>
                <td>
                  <strong>{row.employeeName}</strong>
                  <div className="table-row-subcopy">{row.crewName}</div>
                </td>
                <td>{workerTypeLabel(row.workerType)}</td>
                <td>
                  <span className="table-cell-label">{grossPaymentsLabel(row.workerType)}</span>
                  <strong>{formatCurrency(row.summary.grossPayments)}</strong>
                </td>
                <td>{formatCurrency(row.summary.reimbursements)}</td>
                <td>{formatCurrency(row.summary.deductions)}</td>
                <td>{formatCurrency(row.summary.netEstimate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

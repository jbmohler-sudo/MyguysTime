import type { WorkerType, YtdPayrollSummary } from "../domain/models";
import { formatCurrency } from "../domain/format";

interface PayrollYtdSummaryGridProps {
  summary: YtdPayrollSummary;
  heading?: string;
  subcopy?: string;
  className?: string;
}

export function workerTypeLabel(workerType: WorkerType) {
  return workerType === "contractor_1099" ? "1099 contractor" : "Employee";
}

export function grossPaymentsLabel(workerType: WorkerType) {
  return workerType === "contractor_1099" ? "YTD payments" : "YTD gross";
}

export function PayrollYtdSummaryGrid({
  summary,
  heading,
  subcopy,
  className = "",
}: PayrollYtdSummaryGridProps) {
  return (
    <section className={className ? `payroll-ytd-card ${className}` : "payroll-ytd-card"}>
      {heading || subcopy ? (
        <div className="payroll-ytd-card__header">
          {heading ? <strong>{heading}</strong> : null}
          {subcopy ? <span>{subcopy}</span> : null}
        </div>
      ) : null}
      <div className="payroll-ytd-grid">
        <div>
          <span>{grossPaymentsLabel(summary.workerType)}</span>
          <strong>{formatCurrency(summary.grossPayments)}</strong>
        </div>
        <div>
          <span>YTD reimbursements</span>
          <strong>{formatCurrency(summary.reimbursements)}</strong>
        </div>
        <div>
          <span>YTD deductions</span>
          <strong>{formatCurrency(summary.deductions)}</strong>
        </div>
        <div className="payroll-ytd-grid__main">
          <span>YTD estimated net</span>
          <strong>{formatCurrency(summary.netEstimate)}</strong>
        </div>
      </div>
    </section>
  );
}

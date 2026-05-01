import type { BootstrapPayload } from "./models";

export interface AppAlert {
  id: string;
  kind: "missing_time" | "w4_missing" | "threshold_1099";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function generateAlerts(
  data: BootstrapPayload,
  onSendReminders?: (employeeIds: string[]) => Promise<{ count: number; sent: boolean }>,
): AppAlert[] {
  const alerts: AppAlert[] = [];

  // missing_time: any non-locked week where employees haven't confirmed all days
  const weeksWithMissing = data.employeeWeeks.filter(
    (w) => w.missingConfirmationDays > 0 && w.status !== "office_locked",
  );
  if (weeksWithMissing.length > 0) {
    const count = weeksWithMissing.length;
    const employeeIds = weeksWithMissing.map((w) => w.employeeId);
    alerts.push({
      id: "missing_time",
      kind: "missing_time",
      message: `${count} ${count === 1 ? "worker hasn't" : "workers haven't"} confirmed all their days — payday is coming.`,
      actionLabel: onSendReminders ? "Send SMS reminders" : undefined,
      onAction: onSendReminders ? () => { void onSendReminders(employeeIds); } : undefined,
    });
  }

  // w4_missing: w4CollectedAt is explicitly null for any active worker (field populated by backend when ready)
  const payrollMethod = data.companySettings?.payrollMethod ?? "manual";
  if (payrollMethod !== "service") {
    const missingW4 = data.employeeWeeks.filter(
      (w) => Object.prototype.hasOwnProperty.call(w, "w4CollectedAt") && w.w4CollectedAt === null,
    );
    if (missingW4.length > 0) {
      const count = missingW4.length;
      alerts.push({
        id: "w4_missing",
        kind: "w4_missing",
        message: `W-4 info missing for ${count} ${count === 1 ? "worker" : "workers"} — withholding estimates may be off.`,
      });
    }
  }

  // threshold_1099: 1099 workers approaching or crossing the $600 annual threshold
  const seen = new Set<string>();
  for (const week of data.employeeWeeks) {
    if (week.workerType !== "contractor_1099") continue;
    if (seen.has(week.employeeId)) continue;
    seen.add(week.employeeId);

    const gross = week.ytdSummary.grossPayments;
    if (gross >= 500 && gross < 600) {
      alerts.push({
        id: `threshold_1099_approaching_${week.employeeId}`,
        kind: "threshold_1099",
        message: `${week.employeeName} is approaching the $600 1099 threshold — $${gross.toFixed(0)} paid YTD.`,
      });
    } else if (gross >= 600) {
      alerts.push({
        id: `threshold_1099_crossed_${week.employeeId}`,
        kind: "threshold_1099",
        message: `${week.employeeName} has crossed $600 this year — a 1099 will be required.`,
      });
    }
  }

  return alerts;
}

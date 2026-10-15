import type { Employee, TimeEntryDay } from "@prisma/client";

const REGULAR_MINUTES_LIMIT = 40 * 60;
const DEFAULT_OVERTIME_MULTIPLIER = 1.5;

function roundCents(value: number): number {
  return Math.round(value);
}

export function calculateDayTotalMinutes(
  day: Pick<TimeEntryDay, "startTimeMinutes" | "endTimeMinutes" | "lunchMinutes">,
): number {
  if (day.startTimeMinutes === null || day.endTimeMinutes === null) {
    return 0;
  }

  const rawMinutes = day.endTimeMinutes - day.startTimeMinutes - day.lunchMinutes;
  return Math.max(0, rawMinutes);
}

export interface PayrollCalculationInput {
  employee: Pick<Employee, "hourlyRateCents" | "overtimeRateCents">;
  dayEntries: Array<Pick<TimeEntryDay, "totalMinutes">>;
}

export function calculatePayrollEstimate(input: PayrollCalculationInput) {
  const totalMinutes = input.dayEntries.reduce((sum, entry) => sum + entry.totalMinutes, 0);
  const regularMinutes = Math.min(totalMinutes, REGULAR_MINUTES_LIMIT);
  const overtimeMinutes = Math.max(totalMinutes - REGULAR_MINUTES_LIMIT, 0);
  const overtimeRateCents =
    input.employee.overtimeRateCents ??
    Math.round(input.employee.hourlyRateCents * DEFAULT_OVERTIME_MULTIPLIER);

  const grossPayCents =
    roundCents((regularMinutes / 60) * input.employee.hourlyRateCents) +
    roundCents((overtimeMinutes / 60) * overtimeRateCents);

  return {
    regularMinutes,
    overtimeMinutes,
    grossPayCents,
  };
}

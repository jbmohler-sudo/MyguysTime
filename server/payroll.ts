import type {
  Company,
  CompanyPayrollSettings,
  Employee,
  PayrollEstimate,
  StatePayrollRule,
  TimeEntryDay,
  WeeklyAdjustment,
} from "@prisma/client";

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
  employee: Pick<
    Employee,
    | "hourlyRateCents"
    | "overtimeRateCents"
    | "federalWithholdingPercent"
    | "federalFilingStatus"
    | "stateWithholdingPercent"
    | "w4Step3Amount"
    | "w4CollectedAt"
    | "usesCompanyFederalDefault"
    | "usesCompanyStateDefault"
  >;
  company: Pick<Company, "stateCode"> | null;
  companyPayrollSettings: Pick<
    CompanyPayrollSettings,
    | "defaultFederalWithholdingMode"
    | "defaultFederalWithholdingValue"
    | "defaultStateWithholdingMode"
    | "defaultStateWithholdingValue"
    | "pfmlEnabled"
    | "pfmlEmployeeRate"
    | "extraWithholdingLabel"
    | "extraWithholdingRate"
    | "supportLevelSnapshot"
  > | null;
  stateRule: Pick<
    StatePayrollRule,
    | "supportLevel"
    | "hasStateIncomeTax"
    | "hasExtraEmployeeWithholdings"
    | "extraWithholdingTypes"
  > | null;
  dayEntries: Array<Pick<TimeEntryDay, "totalMinutes">>;
  adjustment: Pick<WeeklyAdjustment, "gasReimbursementCents" | "pettyCashCents" | "deductionCents"> | null;
  existingEstimate: Pick<
    PayrollEstimate,
    | "federalWithholdingMode"
    | "federalWithholdingValue"
    | "stateWithholdingMode"
    | "stateWithholdingValue"
    | "pfmlWithholdingCents"
    | "extraStateWithholdingLabel"
    | "extraStateWithholdingCents"
    | "manualNetOverrideCents"
  > | null;
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

  const federalDefaultMode = input.companyPayrollSettings?.defaultFederalWithholdingMode ?? "PERCENTAGE";
  const federalDefaultValue = input.companyPayrollSettings?.defaultFederalWithholdingValue ?? 0.1;
  const stateDefaultMode = input.companyPayrollSettings?.defaultStateWithholdingMode ?? "PERCENTAGE";
  const stateDefaultValue = input.companyPayrollSettings?.defaultStateWithholdingValue ?? 0;
  const baseFederalMode = input.employee.usesCompanyFederalDefault ? federalDefaultMode : "PERCENTAGE";
  const baseStateMode = input.employee.usesCompanyStateDefault ? stateDefaultMode : "PERCENTAGE";
  const baseStateValue = input.employee.usesCompanyStateDefault
    ? stateDefaultValue
    : input.employee.stateWithholdingPercent;

  const stateRate =
    input.existingEstimate?.stateWithholdingMode === "MANUAL_OVERRIDE"
      ? input.existingEstimate.stateWithholdingValue
      : baseStateValue;

  const weeklyW4Step3CreditCents =
    input.employee.w4CollectedAt ? roundCents((input.employee.w4Step3Amount / 52) * 100) : 0;
  const federalWithholdingBeforeCreditsCents =
    input.existingEstimate?.federalWithholdingMode === "MANUAL_OVERRIDE"
      ? roundCents(input.existingEstimate.federalWithholdingValue)
      : roundCents(grossPayCents * federalDefaultValue);
  const federalWithholdingCents =
    input.existingEstimate?.federalWithholdingMode === "MANUAL_OVERRIDE"
      ? federalWithholdingBeforeCreditsCents
      : Math.max(0, federalWithholdingBeforeCreditsCents - weeklyW4Step3CreditCents);

  const stateSupportLevel =
    input.companyPayrollSettings?.supportLevelSnapshot ?? input.stateRule?.supportLevel ?? "PARTIAL_MANUAL";
  const stateWithholdingCents =
    !input.stateRule?.hasStateIncomeTax
      ? 0
      : input.existingEstimate?.stateWithholdingMode === "MANUAL_OVERRIDE"
        ? roundCents(input.existingEstimate.stateWithholdingValue)
        : stateSupportLevel === "UNSUPPORTED"
          ? 0
          : roundCents(grossPayCents * stateRate);

  const pfmlEnabled =
    input.company?.stateCode === "MA" &&
    Boolean(input.companyPayrollSettings?.pfmlEnabled) &&
    stateSupportLevel === "FULL";
  const pfmlWithholdingCents = pfmlEnabled
    ? roundCents(grossPayCents * (input.companyPayrollSettings?.pfmlEmployeeRate ?? 0))
    : 0;

  const extraStateWithholdingLabel =
    input.company?.stateCode === "MA" && pfmlEnabled
      ? "PFML"
      : input.companyPayrollSettings?.extraWithholdingLabel ?? null;
  const extraStateWithholdingCents =
    input.company?.stateCode === "MA" && pfmlEnabled
      ? pfmlWithholdingCents
      : input.existingEstimate?.extraStateWithholdingCents ??
        (input.companyPayrollSettings?.extraWithholdingRate
          ? roundCents(grossPayCents * input.companyPayrollSettings.extraWithholdingRate)
          : 0);

  const reimbursements =
    (input.adjustment?.gasReimbursementCents ?? 0) + (input.adjustment?.pettyCashCents ?? 0);
  const deductions = input.adjustment?.deductionCents ?? 0;
  const defaultNet =
    grossPayCents -
    federalWithholdingCents -
    stateWithholdingCents -
    extraStateWithholdingCents +
    reimbursements -
    deductions;

  return {
    regularMinutes,
    overtimeMinutes,
    grossPayCents,
    federalWithholdingMode: input.existingEstimate?.federalWithholdingMode ?? baseFederalMode,
    federalWithholdingValue:
      input.existingEstimate?.federalWithholdingMode === "MANUAL_OVERRIDE"
        ? input.existingEstimate.federalWithholdingValue
        : input.employee.w4CollectedAt
          ? federalDefaultValue
          : (input.companyPayrollSettings?.defaultFederalWithholdingValue ?? federalDefaultValue),
    stateWithholdingMode: input.existingEstimate?.stateWithholdingMode ?? baseStateMode,
    stateWithholdingValue:
      input.existingEstimate?.stateWithholdingMode === "MANUAL_OVERRIDE"
        ? input.existingEstimate.stateWithholdingValue
        : baseStateValue,
    federalWithholdingCents,
    stateWithholdingCents,
    pfmlWithholdingCents,
    extraStateWithholdingLabel,
    extraStateWithholdingCents,
    manualNetOverrideCents: input.existingEstimate?.manualNetOverrideCents ?? null,
    netCheckEstimateCents: input.existingEstimate?.manualNetOverrideCents ?? defaultNet,
  };
}

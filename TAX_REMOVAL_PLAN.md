# Tax Removal Plan — MyGuys Time
> Generated: 2026-05-11

## TL;DR
Tax machinery is deeply integrated but cleanly separable. Load-bearing risk: `recalculateTimesheet()` / `buildBootstrap()` query `StatePayrollRule` on every page load — must be updated BEFORE dropping that table.

## What Stays
- Hours × Rate = `grossPayCents` ✅
- `regularMinutes`, `overtimeMinutes` ✅
- `deductionCents` (cash advance / manual deduction, NOT a tax field) ✅
- `gasReimbursementCents`, `pettyCashCents` ✅
- `netCheckEstimateCents` (simplified: gross + reimbursements − advances) ✅
- All of `WeeklyAdjustment` ✅
- `CompanyPayrollSettings`: timeTrackingStyle, weekStartDay, defaultLunchMinutes, payType, payrollMethod, trackExpenses ✅

## What Goes
Everything federal, state, PFML, W-4, withholding, disclaimer, StatePayrollRule.

---

## Migration Sequencing (DO NOT REORDER)

1. **Rewrite `calculatePayrollEstimate()`** — drop tax logic, keep all DB fields in upsert (write 0s). No DB changes yet.
2. **Update `buildBootstrap()` / `getCompanyContextOrThrow()`** — stop requiring `StatePayrollRule`, replace with null/stub.
3. **Update all serializers** — drop tax fields from API responses.
4. **Update all frontend components** — TypeScript errors from Step 3 guide you here.
5. **Prisma migration** — DROP tax columns from `Employee`, `CompanyPayrollSettings`, `PayrollEstimate`.
6. **Prisma migration** — DROP TABLE `StatePayrollRule` (must be after all queries referencing it are gone).
7. **Clean up** — dead demo data, type stubs, tests.

⚠️ Step 6 must come after Step 2. Step 5 must come after Steps 1–4 are deployed.

---

## Layer 1 — Database / Schema

### Employee — 7 fields to DROP
- `federalFilingStatus`
- `w4Step3Amount`
- `w4CollectedAt`
- `usesCompanyFederalDefault`
- `usesCompanyStateDefault`
- `federalWithholdingPercent`
- `stateWithholdingPercent`

### CompanyPayrollSettings — 8 fields to DROP
- `defaultFederalWithholdingMode`
- `defaultFederalWithholdingValue`
- `defaultStateWithholdingMode`
- `defaultStateWithholdingValue`
- `pfmlEnabled`
- `pfmlEmployeeRate`
- `extraWithholdingLabel`
- `extraWithholdingRate`
- `supportLevelSnapshot`
- `payrollPrepDisclaimer`

### StatePayrollRule — DROP ENTIRE TABLE
Entire model is tax scaffolding. Nothing else references it after Step 2.

### PayrollEstimate — 9 fields to DROP, 4 to KEEP
DROP: `federalWithholdingMode`, `federalWithholdingValue`, `stateWithholdingMode`, `stateWithholdingValue`, `federalWithholdingCents`, `stateWithholdingCents`, `pfmlWithholdingCents`, `extraStateWithholdingLabel`, `extraStateWithholdingCents`, `manualNetOverrideCents`
KEEP: `regularMinutes`, `overtimeMinutes`, `grossPayCents`, `netCheckEstimateCents`

### Company — 3 fields to DROP
- `payrollDisclaimerAcceptedAt`
- `payrollDisclaimerAcceptedByUserId`
- `payrollDisclaimerVersion`

---

## Layer 2 — Server / API

### server/payroll.ts
Rewrite `calculatePayrollEstimate()` — simplified input/output, just hours + gross + reimbursements.

### server/routes/helpers.ts
- `buildPayrollSettingsDefaults()` — drop all withholding/PFML output
- `buildUnsupportedStateRuleData()` — DELETE
- `serializeStateRule()` — DELETE
- `serializeCompanySettings()` — remove stateRule param, drop all tax fields
- `serializeManagedEmployee()` — drop W-4 fields
- `serializeTimesheet()` — drop all withholding fields from payrollEstimate
- `ensureWeekData()` — drop withholding fields from payrollEstimate.create
- `recalculateTimesheet()` — drop stateRule, simplify calculatePayrollEstimate call
- `getCompanyContextOrThrow()` — stop querying StatePayrollRule
- DELETE: `PAYROLL_PREP_DISCLAIMER`, `UNSUPPORTED_STATE_MESSAGE`, `normalizeFederalFilingStatus()`

### server/routes/employees.ts
Remove W-4 blocks from POST and PATCH routes (filing status, w4 amount, w4CollectedAt, withholding defaults).

### server/routes/company.ts
Remove state-based withholding/PFML defaults from setup and settings routes.

### server/routes/exports.ts
Remove columns: Federal Withholding, State Withholding, PFML from CSV and HTML exports.
Keep: Reimbursements, Deductions, Net Check Estimate.

---

## Layer 3 — TypeScript Types (src/domain/models.ts)

DELETE: `FederalFilingStatus` type, `StateRuleSummary` interface, `BootstrapPayload.stateRules`
DROP from interfaces: all withholding/W-4/PFML fields from `PayrollEstimateSummary`, `EmployeeWeek`, `ManagedEmployee`, `EmployeeInput`, `CompanySettingsSummary`
KEEP: `netCheckEstimate`, `YtdPayrollSummary.netEstimate`

---

## Layer 4 — Frontend Components

### DELETE entirely
- `src/components/W4MissingAlertBanner.tsx`
- `src/components/SupportSummaryBlock.tsx`

### Major refactor
- `src/components/CompanySettingsPanel.tsx` — ~300 lines of withholding UI gone

### Moderate changes
- `src/components/AddEmployeeModal.tsx` — remove tax withholding step, renumber steps
- `src/components/OfficeDashboard.tsx` — remove federal/state withholding display
- `src/components/PayrollYtdSummaryGrid.tsx` — remove withholding rows
- `src/components/YtdReportingPanel.tsx` — remove tax columns

### Minor changes
- `src/demo/demoData.ts` — remove W-4 fields from demo employees
- `src/components/AppShell.tsx` — remove W4 banner render
- Remove `stateRules` from props passed down

---

## Layer 5 — UI Copy
- Remove CSV columns: "Federal Withholding", "State Withholding", "PFML"
- Remove AddEmployeeModal step: "Tax withholding info"
- Remove CompanySettingsPanel sections: "Withholding defaults", "State tax support"
- Remove payroll estimate rows: "Federal: $X", "State: $X", "PFML: $X"
- Remove `PAYROLL_PREP_DISCLAIMER`
- KEEP `EXPORT_REMINDER` — still accurate
- Rename "Estimated Net" → "Est. Checks" or keep "Net"

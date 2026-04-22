import { useState } from "react";
import type { CompanyOnboardingInput, CompanySettingsSummary } from "../domain/models";

interface CompanySetupScreenProps {
  companySettings: CompanySettingsSummary;
  onComplete: (payload: CompanyOnboardingInput) => Promise<void>;
}

const STEP_TITLES = ["Company setup", "Crew setup", "Time tracking style", "Payroll preferences"] as const;
const TIME_TRACKING_OPTIONS = [
  {
    value: "foreman" as const,
    title: "Foreman enters time",
    detail: "One guy handles the week for the crew.",
  },
  {
    value: "worker_self_entry" as const,
    title: "Workers enter their own time",
    detail: "Each worker confirms and updates their own hours.",
  },
  {
    value: "mixed" as const,
    title: "Mixed",
    detail: "Foreman leads it, but workers can still update their own time.",
  },
] as const;

const LUNCH_OPTIONS = [
  { value: 0 as const, title: "No lunch deduction" },
  { value: 30 as const, title: "30 minute lunch" },
  { value: 60 as const, title: "60 minute lunch" },
] as const;

const PAY_TYPE_OPTIONS = [
  {
    value: "hourly" as const,
    title: "Hourly",
    detail: "All hours stay at the base hourly rate.",
  },
  {
    value: "hourly_overtime" as const,
    title: "Hourly + overtime",
    detail: "Overtime stays separate in the weekly payroll-prep estimate.",
  },
] as const;

export function CompanySetupScreen({ companySettings, onComplete }: CompanySetupScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [companyName, setCompanyName] = useState(companySettings.companyName);
  const [ownerName, setOwnerName] = useState(companySettings.ownerName);
  const [employees, setEmployees] = useState<Array<{ displayName: string; hourlyRate: string; workerType: "w2" | "1099" }>>([
    { displayName: "", hourlyRate: "", workerType: "w2" },
  ]);
  const [timeTrackingStyle, setTimeTrackingStyle] = useState<CompanyOnboardingInput["timeTrackingStyle"]>(
    companySettings.timeTrackingStyle,
  );
  const [lunchDeductionMinutes, setLunchDeductionMinutes] = useState<CompanyOnboardingInput["lunchDeductionMinutes"]>(
    companySettings.defaultLunchMinutes as 0 | 30 | 60,
  );
  const [payType, setPayType] = useState<CompanyOnboardingInput["payType"]>(companySettings.payType);
  const [trackExpenses, setTrackExpenses] = useState(companySettings.trackExpenses);
  const [saving, setSaving] = useState(false);

  const hasNamedEmployees = employees.some((employee) => employee.displayName.trim().length > 0);
  const canAdvance =
    stepIndex === 0
      ? companyName.trim().length > 0
      : stepIndex === 1
        ? hasNamedEmployees
        : true;

  function updateEmployee(
    index: number,
    field: "displayName" | "hourlyRate" | "workerType",
    value: string,
  ) {
    setEmployees((current) =>
      current.map((employee, employeeIndex) =>
        employeeIndex === index
          ? {
              ...employee,
              [field]: value,
            }
          : employee,
      ),
    );
  }

  function addEmployeeRow() {
    setEmployees((current) => [...current, { displayName: "", hourlyRate: "", workerType: "w2" }]);
  }

  function removeEmployeeRow(index: number) {
    setEmployees((current) => current.filter((_, employeeIndex) => employeeIndex !== index));
  }

  async function handleSubmit() {
    if (saving) {
      return;
    }

    setSaving(true);
    try {
      await onComplete({
        companyName: companyName.trim(),
        ownerName: ownerName.trim() || undefined,
        employees: employees
          .filter((employee) => employee.displayName.trim().length > 0)
          .map((employee) => ({
            displayName: employee.displayName.trim(),
            hourlyRate: employee.hourlyRate.trim().length > 0 ? Number(employee.hourlyRate) : undefined,
            workerType: employee.workerType,
          })),
        timeTrackingStyle,
        lunchDeductionMinutes,
        payType,
        trackExpenses,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-card setup-card onboarding-card">
        <p className="eyebrow">New company setup</p>
        <h1>Get your weekly board ready fast</h1>
        <p className="hero-copy">
          Four quick steps, then you land on the current week with a crew, timesheets, and payroll-prep numbers ready to review.
        </p>

        <div className="setup-progress">
          {STEP_TITLES.map((title, index) => (
            <div
              className={index === stepIndex ? "setup-step setup-step--active" : "setup-step"}
              key={title}
            >
              <span>Step {index + 1}</span>
              <strong>{title}</strong>
            </div>
          ))}
        </div>

        {stepIndex === 0 ? (
          <section className="settings-section onboarding-step">
            <div className="settings-section__header">
              <div>
                <p className="eyebrow">Step 1</p>
                <h3>Company setup</h3>
              </div>
              <span className="settings-meta">Keep it simple. We only need the basics to get the week open.</span>
            </div>

            <div className="settings-grid">
              <label>
                Company name
                <input
                  autoFocus
                  type="text"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
              </label>
              <label>
                Owner name
                <input
                  type="text"
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                />
              </label>
            </div>
          </section>
        ) : null}

        {stepIndex === 1 ? (
          <section className="settings-section onboarding-step">
            <div className="settings-section__header">
              <div>
                <p className="eyebrow">Step 2</p>
                <h3>Crew setup</h3>
              </div>
              <span className="settings-meta">Add the guys you need on this week's board.</span>
            </div>

            <div className="setup-employees onboarding-employees">
              {employees.map((employee, index) => (
                <div className="setup-employee-row onboarding-employee-card" key={`setup-employee-${index}`}>
                  <label className="settings-grid__full">
                    Worker name
                    <input
                      type="text"
                      value={employee.displayName}
                      onChange={(event) => updateEmployee(index, "displayName", event.target.value)}
                    />
                  </label>
                  <label>
                    Hourly rate
                    <input
                      placeholder="Optional"
                      type="number"
                      step="0.01"
                      value={employee.hourlyRate}
                      onChange={(event) => updateEmployee(index, "hourlyRate", event.target.value)}
                    />
                  </label>
                  <label>
                    Worker type
                    <select
                      value={employee.workerType}
                      onChange={(event) => updateEmployee(index, "workerType", event.target.value)}
                    >
                      <option value="w2">W2</option>
                      <option value="1099">1099</option>
                    </select>
                  </label>
                  {employees.length > 1 ? (
                    <button
                      className="button-muted"
                      onClick={() => removeEmployeeRow(index)}
                      type="button"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="adjustment-actions">
              <button onClick={addEmployeeRow} type="button">
                Add another guy
              </button>
            </div>
          </section>
        ) : null}

        {stepIndex === 2 ? (
          <section className="settings-section onboarding-step">
            <div className="settings-section__header">
              <div>
                <p className="eyebrow">Step 3</p>
                <h3>How do you want time entered?</h3>
              </div>
            </div>

            <div className="onboarding-choice-grid">
              {TIME_TRACKING_OPTIONS.map((option) => (
                <button
                  className={
                    option.value === timeTrackingStyle
                      ? "onboarding-choice onboarding-choice--active"
                      : "onboarding-choice"
                  }
                  key={option.value}
                  onClick={() => setTimeTrackingStyle(option.value)}
                  type="button"
                >
                  <strong>{option.title}</strong>
                  <span>{option.detail}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {stepIndex === 3 ? (
          <section className="settings-section onboarding-step">
            <div className="settings-section__header">
              <div>
                <p className="eyebrow">Step 4</p>
                <h3>Payroll preferences</h3>
              </div>
              <span className="settings-meta">These are just starting defaults for the weekly board.</span>
            </div>

            <div className="onboarding-choice-grid">
              {LUNCH_OPTIONS.map((option) => (
                <button
                  className={
                    option.value === lunchDeductionMinutes
                      ? "onboarding-choice onboarding-choice--active"
                      : "onboarding-choice"
                  }
                  key={option.value}
                  onClick={() => setLunchDeductionMinutes(option.value)}
                  type="button"
                >
                  <strong>{option.title}</strong>
                </button>
              ))}
            </div>

            <div className="onboarding-choice-grid onboarding-choice-grid--compact">
              {PAY_TYPE_OPTIONS.map((option) => (
                <button
                  className={
                    option.value === payType
                      ? "onboarding-choice onboarding-choice--active"
                      : "onboarding-choice"
                  }
                  key={option.value}
                  onClick={() => setPayType(option.value)}
                  type="button"
                >
                  <strong>{option.title}</strong>
                  <span>{option.detail}</span>
                </button>
              ))}
            </div>

            <div className="onboarding-toggle-row">
              <div>
                <strong>Track expenses</strong>
                <span>Keep gas, petty cash, and job costs available in payroll prep.</span>
              </div>
              <select
                value={trackExpenses ? "yes" : "no"}
                onChange={(event) => setTrackExpenses(event.target.value === "yes")}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <div className="workflow-banner workflow-banner--soft">
              <strong>Reporting only</strong>
              <span>Payroll estimates help you review the week. Verify amounts before issuing checks or filing anything.</span>
            </div>
          </section>
        ) : null}

        <div className="adjustment-actions">
          <button
            disabled={stepIndex === 0 || saving}
            onClick={() => setStepIndex((current) => current - 1)}
            type="button"
          >
            Back
          </button>
          {stepIndex < STEP_TITLES.length - 1 ? (
            <button
              className="button-strong"
              disabled={!canAdvance || saving}
              onClick={() => setStepIndex((current) => current + 1)}
              type="button"
            >
              Next
            </button>
          ) : (
            <button className="button-strong" disabled={!canAdvance || saving} onClick={() => void handleSubmit()} type="button">
              {saving ? "Opening your week..." : "Open weekly board"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

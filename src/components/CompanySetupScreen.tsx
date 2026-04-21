import { useEffect, useMemo, useState } from "react";
import type { CompanySettingsSummary, StateRuleSummary } from "../domain/models";
import { SupportSummaryBlock } from "./SupportSummaryBlock";

interface CompanySetupScreenProps {
  companySettings: CompanySettingsSummary;
  stateRules: StateRuleSummary[];
  onComplete: (payload: {
    companyName: string;
    companyState: string;
    acknowledgementAccepted: boolean;
    defaultFederalWithholdingMode?: string;
    defaultFederalWithholdingValue?: number;
    defaultStateWithholdingMode?: string;
    defaultStateWithholdingValue?: number;
    initialCrewName?: string;
    initialEmployees?: Array<{ displayName: string; hourlyRate: number }>;
  }) => Promise<void>;
}

const STEP_TITLES = [
  "Company profile",
  "Payroll defaults",
  "Disclaimer acknowledgement",
  "Initial crew and employees",
] as const;

export function CompanySetupScreen({
  companySettings,
  stateRules,
  onComplete,
}: CompanySetupScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [companyName, setCompanyName] = useState(companySettings.companyName);
  const [companyState, setCompanyState] = useState(companySettings.companyState);
  const [defaultFederalWithholdingMode, setDefaultFederalWithholdingMode] = useState(
    companySettings.defaultFederalWithholdingMode,
  );
  const [defaultFederalWithholdingValue, setDefaultFederalWithholdingValue] = useState(
    companySettings.defaultFederalWithholdingValue,
  );
  const [defaultStateWithholdingMode, setDefaultStateWithholdingMode] = useState(
    companySettings.defaultStateWithholdingMode,
  );
  const [defaultStateWithholdingValue, setDefaultStateWithholdingValue] = useState(
    companySettings.defaultStateWithholdingValue,
  );
  const [initialCrewName, setInitialCrewName] = useState("Crew 1");
  const [initialEmployees, setInitialEmployees] = useState([
    { displayName: "", hourlyRate: 25 },
    { displayName: "", hourlyRate: 25 },
  ]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const selectedState = useMemo(
    () => stateRules.find((rule) => rule.stateCode === companyState) ?? null,
    [companyState, stateRules],
  );
  const canAdvance =
    stepIndex === 0
      ? companyName.trim().length > 0 && companyState.trim().length > 0
      : stepIndex === 1
        ? Number.isFinite(defaultFederalWithholdingValue) && Number.isFinite(defaultStateWithholdingValue)
        : stepIndex === 2
          ? acknowledged
          : true;

  useEffect(() => {
    if (!selectedState) {
      return;
    }

    setDefaultStateWithholdingMode(selectedState.defaultStateWithholdingMode);
    setDefaultStateWithholdingValue(selectedState.defaultStateWithholdingValue);
  }, [selectedState]);

  function updateEmployee(index: number, field: "displayName" | "hourlyRate", value: string | number) {
    setInitialEmployees((current) =>
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

  async function handleSubmit() {
    if (!acknowledged || saving) {
      return;
    }

    setSaving(true);
    try {
      await onComplete({
        companyName: companyName.trim(),
        companyState,
        acknowledgementAccepted: true,
        defaultFederalWithholdingMode,
        defaultFederalWithholdingValue,
        defaultStateWithholdingMode,
        defaultStateWithholdingValue,
        initialCrewName: initialCrewName.trim(),
        initialEmployees: initialEmployees
          .filter((employee) => employee.displayName.trim().length > 0)
          .map((employee) => ({
            displayName: employee.displayName.trim(),
            hourlyRate: employee.hourlyRate,
          })),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-card setup-card">
        <p className="eyebrow">Company Setup</p>
        <h1>Finish company setup before weekly review starts</h1>
        <p className="hero-copy">
          This quick setup keeps the dashboard focused on weekly work and moves payroll-prep defaults into a reusable company profile.
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
          <section className="settings-section">
            <div className="settings-section__header">
              <div>
                <p className="eyebrow">Step 1</p>
                <h3>Company profile</h3>
              </div>
            </div>
            <div className="settings-grid">
              <label>
                Company name
                <input
                  type="text"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
              </label>
              <label>
                Company state
                <select value={companyState} onChange={(event) => setCompanyState(event.target.value)}>
                  {stateRules.map((rule) => (
                    <option key={rule.stateCode} value={rule.stateCode}>
                      {rule.stateCode} - {rule.stateName}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedState ? (
              <SupportSummaryBlock
                context="setup"
                supportLevel={selectedState.supportLevel}
                hasStateIncomeTax={selectedState.hasStateIncomeTax}
                hasExtraEmployeeWithholdings={selectedState.hasExtraEmployeeWithholdings}
                supportedLines={[
                  "Federal withholding estimate",
                  selectedState.hasStateIncomeTax
                    ? selectedState.supportLevel === "full"
                      ? "State withholding estimate"
                      : "Manual state withholding review"
                    : "No state income tax withholding",
                  ...(companyState === "MA" ? ["PFML employee withholding"] : []),
                ]}
                extraWithholdingLabel={companyState === "MA" ? "PFML" : selectedState.extraWithholdingTypes.join(", ")}
                stateCode={selectedState.stateCode}
                stateName={selectedState.stateName}
                stateDisclaimer={selectedState.disclaimerText || selectedState.notes}
                lastReviewedAt={selectedState.lastReviewedAt}
                sourceLabel={selectedState.sourceLabel}
                sourceUrl={selectedState.sourceUrl}
              />
            ) : null}

            {companyState === "MA" ? (
              <div className="workflow-banner workflow-banner--soft">
                <strong>Massachusetts support includes PFML</strong>
                <span>PFML stays separate from state withholding and will show as its own payroll-prep line.</span>
              </div>
            ) : null}
          </section>
        ) : null}

        {stepIndex === 1 ? (
          <section className="settings-section">
            <div className="settings-section__header">
              <div>
                <p className="eyebrow">Step 2</p>
                <h3>Payroll defaults</h3>
              </div>
              <span className="settings-meta">These become the starting point for payroll estimates unless an employee override exists.</span>
            </div>
            <div className="settings-grid">
              <label>
                Default federal withholding mode
                <select
                  value={defaultFederalWithholdingMode}
                  onChange={(event) => setDefaultFederalWithholdingMode(event.target.value)}
                >
                  <option value="percentage">Percentage estimate</option>
                  <option value="manual_override">Manual value</option>
                </select>
              </label>
              <label>
                Default federal withholding value
                <input
                  type="number"
                  step="0.0001"
                  value={defaultFederalWithholdingValue}
                  onChange={(event) => setDefaultFederalWithholdingValue(Number(event.target.value))}
                />
              </label>
              <label>
                Default state withholding mode
                <select
                  value={defaultStateWithholdingMode}
                  onChange={(event) => setDefaultStateWithholdingMode(event.target.value)}
                >
                  <option value="percentage">Percentage estimate</option>
                  <option value="manual_override">Manual value</option>
                </select>
              </label>
              <label>
                Default state withholding value
                <input
                  type="number"
                  step="0.0001"
                  value={defaultStateWithholdingValue}
                  onChange={(event) => setDefaultStateWithholdingValue(Number(event.target.value))}
                />
              </label>
            </div>
            <p className="panel-subcopy">
              Estimates only. You can revise these later in Company Settings without changing the weekly dashboard layout.
            </p>
          </section>
        ) : null}

        {stepIndex === 2 ? (
          <section className="disclaimer-card">
            <div className="disclaimer-card__header">
              <div>
                <p className="eyebrow">Step 3</p>
                <h2>Important: Payroll Estimates</h2>
                <p className="disclaimer-card__intro">{companySettings.payrollReminder}</p>
              </div>
            </div>
            <div className="disclaimer-copy">
              {companySettings.payrollPrepDisclaimer.split("\n").map((line, index) =>
                line ? <p key={`${line}-${index}`}>{line}</p> : <div className="disclaimer-spacer" key={`space-${index}`} />,
              )}
            </div>
            <label className="checkbox-row checkbox-row--disclaimer">
              <input
                checked={acknowledged}
                type="checkbox"
                onChange={(event) => setAcknowledged(event.target.checked)}
              />
              I understand this is a payroll-prep tool and I am responsible for verifying amounts.
            </label>
          </section>
        ) : null}

        {stepIndex === 3 ? (
          <section className="settings-section">
            <div className="settings-section__header">
              <div>
                <p className="eyebrow">Step 4</p>
                <h3>Create your initial crew and employees</h3>
              </div>
              <span className="settings-meta">Optional but helpful so the dashboard is ready for real weekly review right away.</span>
            </div>
            <div className="settings-grid">
              <label className="settings-grid__full">
                Initial crew name
                <input
                  type="text"
                  value={initialCrewName}
                  onChange={(event) => setInitialCrewName(event.target.value)}
                />
              </label>
            </div>
            <div className="setup-employees">
              {initialEmployees.map((employee, index) => (
                <div className="setup-employee-row" key={`setup-employee-${index}`}>
                  <label>
                    Employee name
                    <input
                      type="text"
                      value={employee.displayName}
                      onChange={(event) => updateEmployee(index, "displayName", event.target.value)}
                    />
                  </label>
                  <label>
                    Hourly rate
                    <input
                      type="number"
                      step="0.01"
                      value={employee.hourlyRate}
                      onChange={(event) => updateEmployee(index, "hourlyRate", Number(event.target.value))}
                    />
                  </label>
                </div>
              ))}
            </div>
            <div className="adjustment-actions">
              <button
                onClick={() =>
                  setInitialEmployees((current) => [...current, { displayName: "", hourlyRate: 25 }])
                }
                type="button"
              >
                Add employee
              </button>
            </div>
          </section>
        ) : null}

        <div className="adjustment-actions">
          <button disabled={stepIndex === 0 || saving} onClick={() => setStepIndex((current) => current - 1)} type="button">
            Back
          </button>
          {stepIndex < STEP_TITLES.length - 1 ? (
            <button className="button-strong" disabled={!canAdvance || saving} onClick={() => setStepIndex((current) => current + 1)} type="button">
              Next
            </button>
          ) : (
            <button className="button-strong" disabled={!acknowledged || saving} onClick={() => void handleSubmit()} type="button">
              {saving ? "Creating workspace..." : "Create company workspace"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

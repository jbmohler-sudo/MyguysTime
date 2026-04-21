import { useEffect, useMemo, useState } from "react";
import type { CompanySettingsSummary, StateRuleSummary } from "../domain/models";
import { SupportSummaryBlock } from "./SupportSummaryBlock";

interface CompanySettingsPanelProps {
  companySettings: CompanySettingsSummary;
  stateRules: StateRuleSummary[];
  onSave: (payload: {
    companyName?: string;
    companyState?: string;
    defaultFederalWithholdingMode?: string;
    defaultFederalWithholdingValue?: number;
    defaultStateWithholdingMode?: string;
    defaultStateWithholdingValue?: number;
    payrollPrepDisclaimer?: string;
    pfmlEnabled?: boolean;
    pfmlEmployeeRate?: number;
  }) => Promise<void>;
}

function prettySupportLevel(level: CompanySettingsSummary["supportLevel"]) {
  if (level === "full") {
    return "Full";
  }
  if (level === "partial_manual") {
    return "Partial / Manual";
  }
  return "Unsupported";
}

function formatAcceptedAt(value: string | null) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CompanySettingsPanel({
  companySettings,
  stateRules,
  onSave,
}: CompanySettingsPanelProps) {
  const initialValues = useMemo(
    () => ({
      companyName: companySettings.companyName,
      companyState: companySettings.companyState,
      defaultFederalWithholdingMode: companySettings.defaultFederalWithholdingMode,
      defaultFederalWithholdingValue: companySettings.defaultFederalWithholdingValue,
      defaultStateWithholdingMode: companySettings.defaultStateWithholdingMode,
      defaultStateWithholdingValue: companySettings.defaultStateWithholdingValue,
      payrollPrepDisclaimer: companySettings.payrollPrepDisclaimer,
      pfmlEnabled: companySettings.pfmlEnabled,
      pfmlEmployeeRate: companySettings.pfmlEmployeeRate,
    }),
    [companySettings],
  );
  const [draft, setDraft] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [stateNotice, setStateNotice] = useState<string | null>(null);
  const selectedRule = useMemo(
    () => stateRules.find((rule) => rule.stateCode === draft.companyState) ?? null,
    [draft.companyState, stateRules],
  );
  const supportLevel = selectedRule?.supportLevel ?? companySettings.supportLevel;
  const hasStateIncomeTax = selectedRule?.hasStateIncomeTax ?? companySettings.hasStateIncomeTax;
  const hasExtraEmployeeWithholdings =
    selectedRule?.hasExtraEmployeeWithholdings ?? companySettings.hasExtraEmployeeWithholdings;
  const supportedLines = useMemo(() => {
    if (!selectedRule) {
      return companySettings.supportedLines;
    }

    const lines = [
      "Federal withholding estimate",
      !selectedRule.hasStateIncomeTax
        ? "No state income tax withholding"
        : selectedRule.supportLevel === "full"
          ? "State withholding estimate"
          : selectedRule.supportLevel === "partial_manual"
            ? "Manual state withholding review"
            : "State-specific withholding verification required",
    ];

    if (draft.companyState === "MA" && draft.pfmlEnabled) {
      lines.push("PFML employee withholding");
    } else if (hasExtraEmployeeWithholdings && companySettings.extraWithholdingLabel) {
      lines.push(companySettings.extraWithholdingLabel);
    }

    return lines;
  }, [
    companySettings.extraWithholdingLabel,
    companySettings.supportedLines,
    draft.companyState,
    draft.pfmlEnabled,
    hasExtraEmployeeWithholdings,
    selectedRule,
  ]);
  const stateName = selectedRule?.stateName ?? companySettings.stateName;
  const supportDisclaimer =
    selectedRule?.disclaimerText || selectedRule?.notes || companySettings.stateDisclaimer || "Manual review may still be required.";
  const supportLastReviewedAt = selectedRule?.lastReviewedAt ?? companySettings.lastReviewedAt;
  const supportSourceLabel = selectedRule?.sourceLabel ?? companySettings.sourceLabel;
  const supportSourceUrl = selectedRule?.sourceUrl ?? companySettings.sourceUrl;

  useEffect(() => {
    setDraft(initialValues);
    setStateNotice(null);
  }, [initialValues]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialValues);

  function applyStateDefaults(stateCode: string) {
    const nextRule = stateRules.find((rule) => rule.stateCode === stateCode);

    setDraft((current) => ({
      ...current,
      companyState: stateCode,
      defaultStateWithholdingMode:
        nextRule?.defaultStateWithholdingMode ?? current.defaultStateWithholdingMode,
      defaultStateWithholdingValue:
        nextRule?.defaultStateWithholdingValue ?? current.defaultStateWithholdingValue,
      pfmlEnabled: stateCode === "MA",
      pfmlEmployeeRate:
        stateCode === "MA"
          ? companySettings.pfmlEmployeeRate
          : 0,
    }));

    setStateNotice(`Defaults updated to ${nextRule?.stateName ?? stateCode} settings.`);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        companyName: draft.companyName,
        companyState: draft.companyState,
        defaultFederalWithholdingMode: draft.defaultFederalWithholdingMode,
        defaultFederalWithholdingValue: draft.defaultFederalWithholdingValue,
        defaultStateWithholdingMode: draft.defaultStateWithholdingMode,
        defaultStateWithholdingValue: draft.defaultStateWithholdingValue,
        payrollPrepDisclaimer: draft.payrollPrepDisclaimer,
        pfmlEnabled: draft.pfmlEnabled,
        pfmlEmployeeRate: draft.pfmlEmployeeRate,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel compact-panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Company Settings</p>
          <h2>Company profile and withholding defaults</h2>
          <p className="panel-subcopy">
            Estimates only - verify before issuing checks. Federal and state lines here are for payroll prep, not full tax compliance.
          </p>
        </div>
      </div>

      <div className="company-summary-grid">
        <div>
          <span>Company</span>
          <strong>{draft.companyName}</strong>
        </div>
        <div>
          <span>Business state</span>
          <strong>{draft.companyState} - {stateName}</strong>
        </div>
        <div>
          <span>Disclaimer accepted</span>
          <strong>{formatAcceptedAt(companySettings.disclaimerAcceptedAt)}</strong>
        </div>
        <div>
          <span>Support level</span>
          <strong>{prettySupportLevel(supportLevel)}</strong>
        </div>
      </div>

      <section className="settings-section">
        <div className="settings-section__header">
          <div>
            <p className="eyebrow">Company Identity</p>
            <h3>Business profile</h3>
          </div>
          <span className="settings-meta">Disclaimer version: {companySettings.disclaimerVersion ?? "Not recorded"}</span>
        </div>
        <div className="settings-grid settings-grid--tight">
          <label>
            Company name
            <input
              type="text"
              value={draft.companyName}
              onChange={(event) => setDraft((current) => ({ ...current, companyName: event.target.value }))}
            />
          </label>
          <label>
            Company state
            <select
              value={draft.companyState}
              onChange={(event) => applyStateDefaults(event.target.value)}
            >
              {stateRules.map((rule) => (
                <option key={rule.stateCode} value={rule.stateCode}>
                  {rule.stateCode} - {rule.stateName}
                </option>
              ))}
            </select>
          </label>
        </div>
        {stateNotice ? (
          <div className="workflow-banner workflow-banner--soft workflow-banner--inline">
            <strong>{stateNotice}</strong>
            <button onClick={() => applyStateDefaults(draft.companyState)} type="button">
              Reapply state defaults
            </button>
          </div>
        ) : null}
      </section>

      <SupportSummaryBlock
        supportLevel={supportLevel}
        hasStateIncomeTax={hasStateIncomeTax}
        hasExtraEmployeeWithholdings={hasExtraEmployeeWithholdings}
        supportedLines={supportedLines}
        extraWithholdingLabel={companySettings.extraWithholdingLabel}
        stateCode={draft.companyState}
        stateName={stateName}
        stateDisclaimer={supportDisclaimer}
        lastReviewedAt={supportLastReviewedAt}
        sourceLabel={supportSourceLabel}
        sourceUrl={supportSourceUrl}
      />

      {draft.companyState === "MA" ? (
        <div className="workflow-banner workflow-banner--soft">
          <strong>Massachusetts PFML</strong>
          <span>PFML stays on its own payroll-prep line and does not get merged into state withholding.</span>
        </div>
      ) : null}

      <section className="settings-section">
        <div className="settings-section__header">
          <div>
            <p className="eyebrow">Payroll Defaults</p>
            <h3>Company payroll-prep settings</h3>
          </div>
          <span className="settings-meta">These become the default source for payroll estimates unless an employee override exists.</span>
        </div>
        <div className="settings-grid">
          <label>
            Default federal withholding mode
            <select
              value={draft.defaultFederalWithholdingMode}
              onChange={(event) =>
                setDraft((current) => ({ ...current, defaultFederalWithholdingMode: event.target.value }))
              }
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
              value={draft.defaultFederalWithholdingValue}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  defaultFederalWithholdingValue: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            Default state withholding mode
            <select
              value={draft.defaultStateWithholdingMode}
              onChange={(event) =>
                setDraft((current) => ({ ...current, defaultStateWithholdingMode: event.target.value }))
              }
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
              value={draft.defaultStateWithholdingValue}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  defaultStateWithholdingValue: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            Massachusetts PFML enabled
            <select
              value={draft.pfmlEnabled ? "yes" : "no"}
              onChange={(event) =>
                setDraft((current) => ({ ...current, pfmlEnabled: event.target.value === "yes" }))
              }
            >
              <option value="yes">Enabled</option>
              <option value="no">Disabled</option>
            </select>
          </label>
          <label>
            PFML employee rate
            <input
              type="number"
              step="0.0001"
              value={draft.pfmlEmployeeRate}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  pfmlEmployeeRate: Number(event.target.value),
                }))
              }
            />
          </label>
        </div>
      </section>

      <section className="explainer-card">
        <div className="settings-section__header">
          <div>
            <p className="eyebrow">Explainer</p>
            <h3>What this app calculates</h3>
          </div>
        </div>
        <div className="explainer-grid">
          <div>
            <strong>Gross pay</strong>
            <span>Regular and overtime hours using the employee hourly and overtime rates.</span>
          </div>
          <div>
            <strong>Federal estimate</strong>
            <span>Based on the company default or an employee-specific override.</span>
          </div>
          <div>
            <strong>State estimate</strong>
            <span>{hasStateIncomeTax ? "Included when the selected state support level allows it." : "No state income tax withholding by default for this state."}</span>
          </div>
          <div>
            <strong>Extra withholding lines</strong>
            <span>{hasExtraEmployeeWithholdings ? "Separate supported lines such as Massachusetts PFML." : "Manual-only unless the selected state explicitly supports an extra employee withholding line."}</span>
          </div>
          <div>
            <strong>Reimbursements and deductions</strong>
            <span>Gas, petty cash, and advances stay separate from worked hours.</span>
          </div>
          <div>
            <strong>Final check estimate</strong>
            <span>The office review number after estimated withholdings, reimbursements, and deductions.</span>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__header">
          <div>
            <p className="eyebrow">Disclaimer</p>
            <h3>Current payroll-prep disclaimer</h3>
          </div>
        </div>
        <label className="settings-grid__full">
          Payroll-prep disclaimer
          <textarea
            rows={7}
            value={draft.payrollPrepDisclaimer}
            onChange={(event) =>
              setDraft((current) => ({ ...current, payrollPrepDisclaimer: event.target.value }))
            }
          />
        </label>
      </section>

      <section className="disclaimer-card">
        <h3>Current disclaimer</h3>
        <p className="disclaimer-card__intro">{companySettings.payrollReminder}</p>
        <div className="disclaimer-copy">
          {companySettings.payrollPrepDisclaimer.split("\n").map((line, index) =>
            line ? <p key={`${line}-${index}`}>{line}</p> : <div className="disclaimer-spacer" key={`space-${index}`} />,
          )}
        </div>
      </section>

      <div className="adjustment-actions">
        <button className="button-strong" disabled={!isDirty || saving} onClick={() => void handleSave()} type="button">
          {saving ? "Saving..." : "Save company settings"}
        </button>
        <button disabled={!isDirty || saving} onClick={() => setDraft(initialValues)} type="button">
          Cancel
        </button>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import type { CompanySettingsSummary, PayrollMethod } from "../domain/models";
import { WEEKDAY_OPTIONS } from "../domain/week";

interface CompanySettingsPanelProps {
  companySettings: CompanySettingsSummary;
  onSave: (payload: {
    companyName?: string;
    companyState?: string;
    weekStartDay?: number;
    payrollMethod?: PayrollMethod;
  }) => Promise<void>;
}

function payrollMethodLabel(value: PayrollMethod) {
  if (value === "service") {
    return "Payroll service";
  }
  if (value === "mixed") {
    return "Mixed";
  }
  return "Manual";
}

export function CompanySettingsPanel({
  companySettings,
  onSave,
}: CompanySettingsPanelProps) {
  const initialValues = useMemo(
    () => ({
      companyName: companySettings.companyName,
      companyState: companySettings.companyState,
      weekStartDay: companySettings.weekStartDay,
      payrollMethod: companySettings.payrollMethod,
    }),
    [companySettings],
  );
  const [draft, setDraft] = useState(initialValues);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(initialValues);
  }, [initialValues]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialValues);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        companyName: draft.companyName,
        companyState: draft.companyState,
        weekStartDay: draft.weekStartDay,
        payrollMethod: draft.payrollMethod,
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
          <h2>Company profile</h2>
          <p className="panel-subcopy">
            Manage your company profile, week start, and payroll workflow settings.
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
          <strong>{draft.companyState}</strong>
        </div>
      </div>

      <section className="settings-section">
        <div className="settings-section__header">
          <div>
            <p className="eyebrow">Company Identity</p>
            <h3>Business profile</h3>
          </div>
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
            <input
              type="text"
              maxLength={2}
              value={draft.companyState}
              onChange={(event) => setDraft((current) => ({ ...current, companyState: event.target.value.toUpperCase() }))}
            />
          </label>
          <label>
            Week starts on
            <select
              value={draft.weekStartDay}
              onChange={(event) =>
                setDraft((current) => ({ ...current, weekStartDay: Number(event.target.value) }))
              }
            >
              {WEEKDAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="field-helper">
              Changing this mid-season will shift your weekly boards.
            </span>
          </label>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__header">
          <div>
            <p className="eyebrow">Payroll Defaults</p>
            <h3>Payroll workflow</h3>
          </div>
          <span className="settings-meta">Controls the office export and payroll prep flow.</span>
        </div>
        <div className="settings-grid">
          <label>
            Payroll workflow
            <select
              value={draft.payrollMethod}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  payrollMethod: event.target.value as PayrollMethod,
                }))
              }
            >
              <option value="service">Payroll service</option>
              <option value="manual">Manual</option>
              <option value="mixed">Mixed</option>
            </select>
            <span className="field-helper">
              Current mode: {payrollMethodLabel(draft.payrollMethod)}
            </span>
          </label>
        </div>
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

import { useRef, useState, type CSSProperties } from "react";
import type { CrewSummary, EmployeeInput, FederalFilingStatus, PayrollMethod } from "../domain/models";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useAnalytics } from "../hooks/useAnalytics";

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";

const FILING_STATUS_OPTIONS: Array<{ value: FederalFilingStatus; label: string }> = [
  { value: "single", label: "Single" },
  { value: "married_jointly", label: "Married Filing Jointly" },
  { value: "head_of_household", label: "Head of Household" },
];

interface AddEmployeeModalProps {
  isOpen: boolean;
  crews: CrewSummary[];
  payrollMethod: PayrollMethod;
  onClose: () => void;
  onSave: (employee: EmployeeInput) => Promise<void>;
}

export function AddEmployeeModal({
  isOpen,
  crews,
  payrollMethod,
  onClose,
  onSave,
}: AddEmployeeModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [selectedCrewId, setSelectedCrewId] = useState("");
  const [hourlyRate, setHourlyRate] = useState(25);
  const [workerType, setWorkerType] = useState<"employee" | "contractor_1099">("employee");
  const [federalFilingStatus, setFederalFilingStatus] = useState<FederalFilingStatus>("single");
  const [w4Step3Amount, setW4Step3Amount] = useState("0");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const analytics = useAnalytics();
  const shouldCollectW4 = payrollMethod !== "service";

  function resetForm() {
    setStepIndex(0);
    setDisplayName("");
    setSelectedCrewId("");
    setHourlyRate(25);
    setWorkerType("employee");
    setFederalFilingStatus("single");
    setW4Step3Amount("0");
    setError(null);
  }

  function handleClose() {
    if (!isSaving) {
      resetForm();
      onClose();
    }
  }

  useFocusTrap(containerRef, isOpen, handleClose);

  if (!isOpen) return null;

  function buildNames() {
    const cleaned = displayName.trim();
    const nameParts = cleaned.split(" ").filter(Boolean);
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") || "Crew";
    return { cleaned, firstName, lastName };
  }

  function validateStepOne() {
    const { cleaned, firstName } = buildNames();
    if (!cleaned || !firstName) {
      setError("Please enter a full name");
      return false;
    }
    if (!selectedCrewId) {
      setError("Please select a crew");
      return false;
    }
    return true;
  }

  async function submitEmployee(skipW4: boolean) {
    if (!validateStepOne()) {
      return;
    }

    const parsedStep3Amount = Number(w4Step3Amount);
    if (!skipW4 && (!Number.isFinite(parsedStep3Amount) || parsedStep3Amount < 0)) {
      setError("W-4 Step 3 amount must be 0 or more");
      return;
    }

    const { cleaned, firstName, lastName } = buildNames();
    const w4CollectedAt = skipW4 ? null : new Date().toISOString();

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        firstName,
        lastName,
        displayName: cleaned,
        workerType,
        hourlyRate,
        defaultCrewId: selectedCrewId,
        active: true,
        federalFilingStatus: skipW4 ? "single" : federalFilingStatus,
        w4Step3Amount: skipW4 ? 0 : parsedStep3Amount,
        w4CollectedAt,
      });
      analytics.trackFeatureUsage("employee", "created", {
        crewId: selectedCrewId,
        hourlyRate,
        payrollMethod,
        w4Collected: !skipW4,
      });
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save employee");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePrimaryAction() {
    if (stepIndex === 0 && shouldCollectW4) {
      if (!validateStepOne()) {
        return;
      }
      setError(null);
      setStepIndex(1);
      return;
    }

    await submitEmployee(!shouldCollectW4);
  }

  return (
    <div
      aria-hidden="false"
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-employee-title"
        aria-describedby={error ? "add-employee-error" : "add-employee-desc"}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "480px",
          borderTop: `8px solid ${BRAND_ORANGE}`,
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem", marginBottom: "24px" }}>
          <div>
            <h2
              id="add-employee-title"
              style={{
                margin: "0 0 8px 0",
                color: BRAND_DARK,
                fontWeight: 800,
                fontSize: "1.5rem",
              }}
            >
              New Crew Member
            </h2>
            <p
              id="add-employee-desc"
              style={{
                margin: 0,
                color: "#666",
                fontSize: "0.875rem",
              }}
            >
              {stepIndex === 0 ? "Step 1: worker details" : "Step 2: tax withholding info"}
            </p>
          </div>
          {shouldCollectW4 ? (
            <span style={{ color: "#888", fontSize: "0.75rem", fontWeight: 700 }}>
              Step {stepIndex + 1} of 2
            </span>
          ) : null}
        </div>

        {error ? (
          <div
            id="add-employee-error"
            role="alert"
            aria-live="assertive"
            style={{
              backgroundColor: "rgba(255, 140, 0, 0.1)",
              borderLeft: `4px solid ${BRAND_ORANGE}`,
              color: BRAND_DARK,
              padding: "12px 16px",
              borderRadius: "4px",
              marginBottom: "20px",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        ) : null}

        {stepIndex === 0 ? (
          <>
            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="employee-name" style={labelStyle}>
                Full Name
              </label>
              <input
                id="employee-name"
                type="text"
                placeholder="e.g. John Smith"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isSaving}
                autoComplete="name"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="employee-crew" style={labelStyle}>
                Assign to Crew
              </label>
              <select
                id="employee-crew"
                value={selectedCrewId}
                onChange={(e) => setSelectedCrewId(e.target.value)}
                disabled={isSaving}
                style={inputStyle}
              >
                <option value="">Choose a truck...</option>
                {crews.map((crew) => (
                  <option key={crew.id} value={crew.id}>
                    {crew.name} {crew.foremanName ? `(${crew.foremanName})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="employee-worker-type" style={labelStyle}>
                Worker Type
              </label>
              <select
                id="employee-worker-type"
                value={workerType}
                onChange={(e) => setWorkerType(e.target.value as "employee" | "contractor_1099")}
                disabled={isSaving}
                style={inputStyle}
              >
                <option value="employee">Employee</option>
                <option value="contractor_1099">1099 contractor</option>
              </select>
            </div>

            <div style={{ marginBottom: "28px" }}>
              <label htmlFor="employee-rate" style={labelStyle}>
                Hourly Pay Rate
              </label>
              <div
                aria-hidden="true"
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  color: BRAND_ORANGE,
                  marginBottom: "12px",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>$</span>
                {hourlyRate}
                <span style={{ fontSize: "1rem", color: "#999" }}>/hr</span>
              </div>
              <input
                id="employee-rate"
                type="range"
                min="15"
                max="100"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(parseInt(e.target.value, 10))}
                disabled={isSaving}
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "5px",
                  background: "#EEE",
                  outline: "none",
                  accentColor: BRAND_ORANGE,
                  cursor: isSaving ? "not-allowed" : "pointer",
                }}
              />
              <div
                aria-hidden="true"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.7rem",
                  color: "#999",
                  marginTop: "8px",
                  fontWeight: 600,
                }}
              >
                <span>$15</span>
                <span>$100</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: "18px" }}>
              <label style={labelStyle}>Filing Status</label>
              <div style={{ display: "grid", gap: "10px" }}>
                {FILING_STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isSaving}
                    onClick={() => setFederalFilingStatus(option.value)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      border: option.value === federalFilingStatus ? `2px solid ${BRAND_ORANGE}` : "2px solid #EEE",
                      backgroundColor: option.value === federalFilingStatus ? "rgba(255, 140, 0, 0.08)" : "white",
                      color: BRAND_DARK,
                      fontWeight: 700,
                      textAlign: "left",
                      cursor: isSaving ? "not-allowed" : "pointer",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="employee-w4-step3" style={labelStyle}>
                W-4 Step 3 amount (from their form)
              </label>
              <input
                id="employee-w4-step3"
                type="number"
                min="0"
                step="0.01"
                value={w4Step3Amount}
                onChange={(e) => setW4Step3Amount(e.target.value)}
                disabled={isSaving}
                style={inputStyle}
              />
              <p style={{ margin: "8px 0 0", color: "#666", fontSize: "0.8rem" }}>
                Leave 0 if they didn&apos;t fill this in
              </p>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => void submitEmployee(true)}
              style={{
                background: "none",
                border: "none",
                color: BRAND_ORANGE,
                fontWeight: 700,
                padding: 0,
                cursor: isSaving ? "not-allowed" : "pointer",
                marginBottom: "18px",
              }}
            >
              Skip for now
            </button>
          </>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: stepIndex === 0 ? "1fr 1fr" : "1fr 1fr 1fr",
            gap: "12px",
          }}
        >
          {stepIndex === 1 ? (
            <button
              onClick={() => {
                setError(null);
                setStepIndex(0);
              }}
              disabled={isSaving}
              type="button"
              style={secondaryButtonStyle(isSaving)}
            >
              Back
            </button>
          ) : null}

          <button
            onClick={handleClose}
            disabled={isSaving}
            type="button"
            style={secondaryButtonStyle(isSaving)}
          >
            Cancel
          </button>

          <button
            onClick={() => void handlePrimaryAction()}
            disabled={isSaving}
            type="button"
            aria-busy={isSaving}
            style={primaryButtonStyle(isSaving)}
          >
            {isSaving ? "Saving..." : stepIndex === 0 && shouldCollectW4 ? "Next" : "Save Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "0.7rem",
  fontWeight: 800,
  color: "#666",
  marginBottom: "8px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "2px solid #EEE",
  fontSize: "1rem",
  boxSizing: "border-box",
};

function secondaryButtonStyle(isSaving: boolean): CSSProperties {
  return {
    padding: "12px",
    background: "#F4F4F4",
    border: "none",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "0.875rem",
    cursor: isSaving ? "not-allowed" : "pointer",
    color: BRAND_DARK,
    opacity: isSaving ? 0.6 : 1,
    minHeight: "44px",
  };
}

function primaryButtonStyle(isSaving: boolean): CSSProperties {
  return {
    padding: "12px",
    background: BRAND_ORANGE,
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: 800,
    fontSize: "0.875rem",
    cursor: isSaving ? "not-allowed" : "pointer",
    opacity: isSaving ? 0.8 : 1,
    minHeight: "44px",
  };
}

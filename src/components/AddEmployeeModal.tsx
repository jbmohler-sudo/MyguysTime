import { useRef, useState, type CSSProperties } from "react";
import type { CrewSummary, EmployeeInput } from "../domain/models";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useAnalytics } from "../hooks/useAnalytics";

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";

interface AddEmployeeModalProps {
  isOpen: boolean;
  crews: CrewSummary[];
  onClose: () => void;
  onSave: (employee: EmployeeInput) => Promise<void>;
}

export function AddEmployeeModal({
  isOpen,
  crews,
  onClose,
  onSave,
}: AddEmployeeModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [selectedCrewId, setSelectedCrewId] = useState("");
  const [hourlyRate, setHourlyRate] = useState(25);
  const [workerType, setWorkerType] = useState<"employee" | "contractor_1099">("employee");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const analytics = useAnalytics();

  function resetForm() {
    setDisplayName("");
    setSelectedCrewId("");
    setHourlyRate(25);
    setWorkerType("employee");
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

  function validate() {
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

  async function handleSave() {
    if (!validate()) {
      return;
    }

    const { cleaned, firstName, lastName } = buildNames();

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
      });
      analytics.trackFeatureUsage("employee", "created", {
        crewId: selectedCrewId,
        hourlyRate,
      });
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save employee");
    } finally {
      setIsSaving(false);
    }
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
              Enter worker details to add them to the crew.
            </p>
          </div>
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <button
            onClick={handleClose}
            disabled={isSaving}
            type="button"
            style={secondaryButtonStyle(isSaving)}
          >
            Cancel
          </button>

          <button
            onClick={() => void handleSave()}
            disabled={isSaving}
            type="button"
            aria-busy={isSaving}
            style={primaryButtonStyle(isSaving)}
          >
            {isSaving ? "Saving..." : "Save Employee"}
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

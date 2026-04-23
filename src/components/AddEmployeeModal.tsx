import { useState, useRef } from "react";
import type { CrewSummary } from "../domain/models";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useAnalytics } from "../hooks/useAnalytics";

const BRAND_ORANGE = "#FF8C00";
const BRAND_DARK = "#1A1A1B";

interface AddEmployeeModalProps {
  isOpen: boolean;
  crews: CrewSummary[];
  onClose: () => void;
  onSave: (employee: {
    displayName: string;
    hourlyRate: number;
    defaultCrewId: string;
  }) => Promise<void>;
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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const analytics = useAnalytics();

  function handleClose() {
    if (!isSaving) {
      setDisplayName("");
      setSelectedCrewId("");
      setHourlyRate(25);
      setError(null);
      onClose();
    }
  }

  useFocusTrap(containerRef, isOpen, handleClose);

  if (!isOpen) return null;

  async function handleSave() {
    if (!displayName.trim()) {
      setError("Please enter a full name");
      return;
    }
    if (!selectedCrewId) {
      setError("Please select a crew");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        displayName: displayName.trim(),
        hourlyRate,
        defaultCrewId: selectedCrewId,
      });
      analytics.trackFeatureUsage("employee", "created", {
        crewId: selectedCrewId,
        hourlyRate,
      });
      setDisplayName("");
      setSelectedCrewId("");
      setHourlyRate(25);
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
          maxWidth: "450px",
          borderTop: `8px solid ${BRAND_ORANGE}`,
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
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
            margin: "0 0 24px 0",
            color: "#666",
            fontSize: "0.875rem",
          }}
        >
          Add a new employee or contractor to your roster
        </p>

        {/* Error Message */}
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

        {/* Full Name */}
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="employee-name"
            style={{
              display: "block",
              fontSize: "0.7rem",
              fontWeight: 800,
              color: "#666",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
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
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "2px solid #EEE",
              fontSize: "1rem",
              fontFamily: "Inter, sans-serif",
              boxSizing: "border-box",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = BRAND_ORANGE;
              e.target.style.boxShadow = "0 0 0 3px rgba(255, 140, 0, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#EEE";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Crew Selection */}
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="employee-crew"
            style={{
              display: "block",
              fontSize: "0.7rem",
              fontWeight: 800,
              color: "#666",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Assign to Crew
          </label>
          <div style={{ position: "relative" }}>
            <select
              id="employee-crew"
              value={selectedCrewId}
              onChange={(e) => setSelectedCrewId(e.target.value)}
              disabled={isSaving}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "2px solid #EEE",
                fontSize: "1rem",
                fontFamily: "Inter, sans-serif",
                appearance: "none",
                backgroundColor: "white",
                cursor: isSaving ? "not-allowed" : "pointer",
                boxSizing: "border-box",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = BRAND_ORANGE;
                e.target.style.boxShadow = "0 0 0 3px rgba(255, 140, 0, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#EEE";
                e.target.style.boxShadow = "none";
              }}
            >
              <option value="">Choose a truck...</option>
              {crews.map((crew) => (
                <option key={crew.id} value={crew.id}>
                  {crew.name} {crew.foremanName ? `(${crew.foremanName})` : ""}
                </option>
              ))}
            </select>
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                right: "15px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: BRAND_ORANGE,
                fontWeight: "bold",
                fontSize: "0.75rem",
              }}
            >
              ▼
            </span>
          </div>
        </div>

        {/* Hourly Rate Slider */}
        <div style={{ marginBottom: "28px" }}>
          <label
            htmlFor="employee-rate"
            style={{
              display: "block",
              fontSize: "0.7rem",
              fontWeight: 800,
              color: "#666",
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Hourly Pay Rate
          </label>

          {/* Large rate display — decorative, values conveyed via slider */}
          <div
            aria-hidden="true"
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              color: BRAND_ORANGE,
              marginBottom: "12px",
              textAlign: "center",
              fontFamily: "Poppins, sans-serif",
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
            onChange={(e) => setHourlyRate(parseInt(e.target.value))}
            disabled={isSaving}
            aria-valuemin={15}
            aria-valuemax={100}
            aria-valuenow={hourlyRate}
            aria-valuetext={`$${hourlyRate} per hour`}
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

        {/* Action Buttons */}
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
            style={{
              padding: "12px",
              background: "#F4F4F4",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: isSaving ? "not-allowed" : "pointer",
              color: BRAND_DARK,
              transition: "background-color 0.2s ease",
              opacity: isSaving ? 0.6 : 1,
              minHeight: "44px",
            }}
            onMouseOver={(e) => {
              if (!isSaving) e.currentTarget.style.backgroundColor = "#E0E0E0";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#F4F4F4";
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            type="button"
            aria-busy={isSaving}
            style={{
              padding: "12px",
              background: BRAND_ORANGE,
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: 800,
              fontSize: "0.875rem",
              cursor: isSaving ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              opacity: isSaving ? 0.8 : 1,
              minHeight: "44px",
            }}
            onMouseOver={(e) => {
              if (!isSaving) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 140, 0, 0.4)";
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(255, 140, 0, 0.2)";
            }}
          >
            {isSaving ? "Saving…" : "Save Employee"}
          </button>
        </div>
      </div>
    </div>
  );
}
